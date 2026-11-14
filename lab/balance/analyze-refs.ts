// Analyse appariée (même graine) des campagnes de référence C000/C001 : dominance entre profils.
//   node --import ./lab/balance/register.mjs lab/balance/analyze-refs.ts [campagne]
import { readFileSync } from 'node:fs';
import { f, stats } from './lib';

const id = process.argv[2] ?? 'C000-reference-sans-evenements';
const runs = readFileSync(`lab/results/${id}/runs.jsonl`, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const by: Record<string, Record<number, any>> = {};
for (const r of runs) (by[r.profile] ??= {})[r.seed] = r;
const P = Object.keys(by);
const seeds = Object.keys(by[P[0]]).map(Number);
console.log(`# ${id} — ${runs.length} parties, graines ${seeds[0]}-${seeds[seeds.length - 1]}\n`);

const best: Record<string, number> = {};
for (const s of seeds) {
  let b = P[0];
  for (const p of P) if (by[p][s].log10Value > by[b][s].log10Value) b = p;
  best[b] = (best[b] ?? 0) + 1;
}
console.log('Meilleur profil par graine (log10Value) :', JSON.stringify(best), '\n');

console.log('| profil | log10Value moy ± é.-t. | Héritage moy | ratio de valeur vs meilleur (10^Δ, p50) | Δlog10 min…max vs meilleur | graines où il bat le meilleur |');
console.log('|---|---|---|---|---|---|');
const mean = (p: string) => stats(seeds.map((s) => by[p][s].log10Value)).mean;
const top = P.reduce((a, b) => (mean(a) > mean(b) ? a : b));
for (const p of [...P].sort((a, b) => mean(b) - mean(a))) {
  const d = seeds.map((s) => by[p][s].log10Value - by[top][s].log10Value).sort((a, b) => a - b);
  const sv = stats(seeds.map((s) => by[p][s].log10Value));
  const lg = stats(seeds.map((s) => by[p][s].legacyTotal));
  console.log(`| ${p} | ${f(sv.mean, 3)} ± ${f(sv.sd, 3)} | ${f(lg.mean, 0)} ± ${f(lg.sd, 0)} | ×${f(Math.pow(10, d[Math.floor(d.length / 2)]), 3)} | ${f(d[0], 3)}…${f(d[d.length - 1], 3)} | ${d.filter((x) => x > 0).length}/${seeds.length} |`);
}
console.log(`\n(meilleur en moyenne : ${top})`);

// Progression horaire (log10Value) et gain par heure
console.log('\n| profil | h1 | h2 | h3 | h4 | h5 | h6 | Δlog10/h (h5→h6) | gen/h (moy) |');
console.log('|---|---|---|---|---|---|---|---|---|');
for (const p of P) {
  const H = [1, 2, 3, 4, 5, 6].map((h) => stats(seeds.map((s) => by[p][s].hourly.find((x: any) => x.h === h)?.log10Value ?? NaN)).mean);
  console.log(`| ${p} | ${H.map((x) => f(x)).join(' | ')} | ${f(H[5] - H[4])} | ${f(stats(seeds.map((s) => by[p][s].gen)).mean / 6, 1)} |`);
}
