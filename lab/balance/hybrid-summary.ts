// Synthèse appariée des profils hybrides (runBal) contre mono-commercer.
//   node --import ./lab/balance/register.mjs lab/balance/hybrid-summary.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { f, stats } from './lib';

const rows = readFileSync('lab/balance/results/hybrid-runs.jsonl', 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const ref = new Map(rows.filter((r) => r.profile === 'mono-commercer').map((r) => [r.seed, r]));
const P = [...new Set(rows.map((r) => r.profile))];
const o = [`# Stratégies hybrides vs mono-commercer — ${ref.size} graines appariées, 6 h, dt 0,5, sans événements\n`,
  '| profil | log10 nette | log10 brute | Δ nette vs mono-commercer | graines où il bat mono-commercer | Héritage | gén. | temps héros (cul/cha/com/etu/med) |', '|---|---|---|---|---|---|---|---|'];
for (const p of P) {
  const R = rows.filter((r) => r.profile === p);
  const d = stats(R.map((r) => r.netLog10 - ref.get(r.seed)!.netLog10));
  const sh = ['cultiver', 'chasser', 'commercer', 'etudier', 'mediter'].map((a) => f(100 * stats(R.map((r) => r.heroActShare[a])).mean, 0)).join('/');
  o.push(`| ${p} | ${f(stats(R.map((r) => r.netLog10)).mean, 3)} ± ${f(stats(R.map((r) => r.netLog10)).sd, 3)} | ${f(stats(R.map((r) => r.grossLog10)).mean, 3)} | ${d.mean >= 0 ? '+' : ''}${f(d.mean, 3)} ± ${f(d.sd, 3)} | ${R.filter((r) => r.netLog10 > ref.get(r.seed)!.netLog10).length}/${R.length} | ${f(stats(R.map((r) => r.legacyTotal)).mean, 0)} | ${f(stats(R.map((r) => r.gen)).mean, 1)} | ${sh} |`);
}
writeFileSync('lab/balance/results/hybrid.md', o.join('\n') + '\n');
console.log(o.join('\n'));
