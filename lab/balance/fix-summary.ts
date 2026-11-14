// Effet d'une proposition (fix1 : Commercer 1,5 → 1,1 Or ; Méditer 0,06 → 0,15 Essence) vs C000, graines 1-50 appariées.
//   node --import ./lab/balance/register.mjs lab/balance/fix-summary.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { f, stats } from './lib';

const fix = readFileSync('lab/balance/results/fix1-runs.jsonl', 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const ref = new Map(readFileSync('lab/results/C000-reference-sans-evenements/runs.jsonl', 'utf8').trim().split('\n').map((l) => JSON.parse(l)).map((r) => [`${r.profile}|${r.seed}`, r]));
const P = [...new Set(fix.map((r) => r.profile))];
const o = ['# fix1 — ACT.commercer.produce.or = 1,1 ; ACT.mediter.produce.essence = 0,15 (en mémoire) — 50 graines, 6 h, dt 0,5, sans événements\n',
  'Référence = C000 (mêmes graines). log10 brute comparable à log10Value.\n',
  '| profil | log10 C000 | log10 fix1 | Δ | Héritage C000 → fix1 |', '|---|---|---|---|---|'];
const m: Record<string, number> = {}, m0: Record<string, number> = {};
for (const p of P) {
  const R = fix.filter((r) => r.profile === p);
  const B = R.map((r) => ref.get(`${p}|${r.seed}`)!);
  m[p] = stats(R.map((r) => r.grossLog10)).mean; m0[p] = stats(B.map((r) => r.log10Value)).mean;
  o.push(`| ${p} | ${f(m0[p], 3)} | ${f(m[p], 3)} | ${f(stats(R.map((r, i) => r.grossLog10 - B[i].log10Value)).mean, 3)} ± ${f(stats(R.map((r, i) => r.grossLog10 - B[i].log10Value)).sd, 3)} | ${f(stats(B.map((r) => r.legacyTotal)).mean, 0)} → ${f(stats(R.map((r) => r.legacyTotal)).mean, 0)} |`);
}
const mono = P.filter((p) => p.startsWith('mono'));
const spread = (x: Record<string, number>) => 10 ** (Math.max(...mono.map((p) => x[p])) - Math.min(...mono.map((p) => x[p])));
const best = (x: Record<string, number>) => mono.reduce((a, b) => (x[a] > x[b] ? a : b));
o.push(`\nÉcart meilleure / pire activité mono : C000 ×${f(spread(m0), 1)} (${best(m0)}) → fix1 ×${f(spread(m), 1)} (${best(m)}).`);
const wins = (p: string, q: string) => fix.filter((r) => r.profile === p).filter((r) => r.grossLog10 > fix.find((x) => x.profile === q && x.seed === r.seed)!.grossLog10).length;
o.push(`fix1 : mono-cultiver bat mono-commercer sur ${wins('mono-cultiver', 'mono-commercer')}/50 graines.`);
writeFileSync('lab/balance/results/fix1.md', o.join('\n') + '\n');
console.log(o.join('\n'));
