#!/usr/bin/env node
// Verrou d'audit : tant que .claude/AUDIT_LOCK existe, aucune écriture n'est permise sur le code du jeu.
// Hook PreToolUse (Edit, Write, NotebookEdit, Bash). Code de sortie 2 = action bloquée, message renvoyé à l'agent.
import { existsSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
if (!existsSync(join(root, '.claude', 'AUDIT_LOCK'))) process.exit(0);

let input = {};
try { input = JSON.parse(readFileSync(0, 'utf8')); } catch { process.exit(0); }
const tool = input.tool_name;
const ti = input.tool_input || {};

// Chemins protégés : tout ce qui change le jeu livré.
const PROTECTED = [/^src\//, /^public\//, /^index\.html$/, /^vite\.config\.ts$/, /^tsconfig\.json$/, /^\.github\//, /^docs\/GAME_DESIGN\.md$/];
const isProtected = (p) => {
  const rel = relative(root, resolve(root, p)).replace(/\\/g, '/');
  return !rel.startsWith('..') && PROTECTED.some((re) => re.test(rel));
};
const block = (why) => {
  process.stderr.write(`AUDIT_LOCK actif : ${why}\nPhase d'audit en lecture seule — le code du jeu (src/, public/, index.html, configs, GDD) ne peut pas être modifié. Écrivez dans audits/, lab/ ou tests/qa/.`);
  process.exit(2);
};

if (['Edit', 'Write', 'NotebookEdit', 'MultiEdit'].includes(tool)) {
  const p = ti.file_path || ti.notebook_path;
  if (p && isProtected(p)) block(`écriture refusée sur ${p}`);
}
if (tool === 'Bash') {
  const cmd = String(ti.command || '');
  const touchesGame = /(^|[\s'"=/.])(src\/|public\/|index\.html|vite\.config\.ts|tsconfig\.json|\.github\/)/.test(cmd);
  const writes = /(sed\s+-i|perl\s+-[a-z]*i|>\s*[^&|]|>>|\btee\b|\bmv\b|\bcp\b|\brm\b|\btouch\b|\btruncate\b|git\s+(checkout|restore|apply|am|reset|stash|commit|push|revert|cherry-pick)|\bpatch\b|writeFile|\.write\()/.test(cmd);
  if (touchesGame && writes) block('commande shell susceptible de modifier le code du jeu');
  if (/git\s+(commit|push|reset\s+--hard|rebase|merge)/.test(cmd) && !/\bAUDIT_LEAD=1\b/.test(cmd)) block('les opérations git sont réservées au Technical Lead');
}
process.exit(0);
