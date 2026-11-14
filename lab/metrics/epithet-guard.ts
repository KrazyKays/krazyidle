// Garde-fou sur la distribution des surnoms (B10). Lit lab/results/<id>/extra.jsonl (collect-extra.ts).
//   node --import ./lab/sim/register.mjs lab/metrics/epithet-guard.ts <id-campagne-extra>
// Code de sortie 1 si un seuil est franchi pour un profil ayant acheté Chroniques (≥ 50 vies surnommées).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { EPITHETS } from '../../src/engine/epithets';
import { ROOT } from './lib';

export const EPITHET_RULES = {
  topShareMax: 0.40,      // aucun surnom > 40 % des vies surnommées (profil, campagne)
  effectiveMin: 5,        // nombre effectif de surnoms exp(H Shannon) ≥ 5
  distinctPerRunMin: 3,   // surnoms distincts par partie (moyenne) ≥ 3
  rarity: { communMin: 0.35, epiqueMax: 0.30, legendaireMax: 0.05 }, // parts des vies surnommées
};
const RAR = Object.fromEntries(EPITHETS.map((e) => [e.id, e.rarity]));

const id = process.argv[2];
const ex = readFileSync(join(ROOT, 'lab', 'results', id, 'extra.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const by: Record<string, any[]> = {};
for (const e of ex) (by[e.profile] ??= []).push(e);
let fail = false;
const all = new Set<string>();
console.log('| profil | vies surnommées | surnom dominant | part | n effectif | distincts/partie | commun | rare | épique | légendaire | verdict |\n|---|---|---|---|---|---|---|---|---|---|---|');
for (const [p, es] of Object.entries(by)) {
  const tot: Record<string, number> = {};
  for (const e of es) for (const [k, v] of Object.entries(e.epithetById as Record<string, number>)) { tot[k] = (tot[k] ?? 0) + v; all.add(k); }
  const n = Object.values(tot).reduce((a, b) => a + b, 0);
  if (n < 50) { console.log(`| ${p} | ${n} | — | — | — | — | — | — | — | — | n/a (< 50 vies) |`); continue; }
  const [topId, topN] = Object.entries(tot).sort((a, b) => b[1] - a[1])[0];
  const H = -Object.values(tot).reduce((a, v) => a + (v / n) * Math.log(v / n), 0);
  const eff = Math.exp(H);
  const dpr = es.reduce((a, e) => a + Object.keys(e.epithetById).length, 0) / es.length;
  const r = [0, 1, 2, 3].map((k) => Object.entries(tot).filter(([i]) => RAR[i] === k).reduce((a, [, v]) => a + v, 0) / n);
  const R = EPITHET_RULES;
  const bad = [topN / n > R.topShareMax && 'dominant', eff < R.effectiveMin && 'n effectif', dpr < R.distinctPerRunMin && 'distincts', r[0] < R.rarity.communMin && 'communs', r[2] > R.rarity.epiqueMax && 'épiques', r[3] > R.rarity.legendaireMax && 'légendaires'].filter(Boolean);
  if (bad.length) fail = true;
  const pc = (x: number) => (x * 100).toFixed(0) + ' %';
  console.log(`| ${p} | ${n} | ${topId} | ${pc(topN / n)} | ${eff.toFixed(2)} | ${dpr.toFixed(2)} | ${pc(r[0])} | ${pc(r[1])} | ${pc(r[2])} | ${pc(r[3])} | ${bad.length ? 'ROUGE (' + bad.join(', ') + ')' : 'VERT'} |`);
}
console.log(`\nSurnoms vus dans la campagne : ${all.size}/${EPITHETS.length}`);
process.exit(fail ? 1 : 0);
