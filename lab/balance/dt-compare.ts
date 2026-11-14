// Sensibilité au pas dt : C201 (dt 0,1) vs C000 (dt 0,5), mêmes profils et mêmes graines (1-50), appariés.
//   node --import ./lab/balance/register.mjs lab/balance/dt-compare.ts
import { readFileSync } from 'node:fs';
import { f, stats } from './lib';

const load = (id: string) => readFileSync(`lab/results/${id}/runs.jsonl`, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const a = load('C000-reference-sans-evenements'), b = load('C201-balance-dt01');
const idx = new Map(a.map((r) => [`${r.profile}|${r.seed}`, r]));
const P = [...new Set(b.map((r) => r.profile))];
console.log('# dt 0,1 (C201) vs dt 0,5 (C000), graines 1-50 appariées, 6 h, sans événements\n');
console.log('| profil | log10Value dt0,5 | log10Value dt0,1 | Δ (moy ± é.-t.) | Héritage dt0,5 | dt0,1 | Δ % | gén. dt0,5 | dt0,1 |');
console.log('|---|---|---|---|---|---|---|---|---|');
const means: Record<string, number> = {};
for (const p of P) {
  const B = b.filter((r) => r.profile === p), A = B.map((r) => idx.get(`${p}|${r.seed}`)!);
  const va = stats(A.map((r) => r.log10Value)), vb = stats(B.map((r) => r.log10Value));
  means[p] = vb.mean;
  const d = stats(B.map((r, i) => r.log10Value - A[i].log10Value));
  const la = stats(A.map((r) => r.legacyTotal)), lb = stats(B.map((r) => r.legacyTotal));
  console.log(`| ${p} | ${f(va.mean, 3)} | ${f(vb.mean, 3)} | ${f(d.mean, 3)} ± ${f(d.sd, 3)} | ${f(la.mean, 0)} | ${f(lb.mean, 0)} | ${f((100 * (lb.mean - la.mean)) / la.mean, 1)} % | ${f(stats(A.map((r) => r.gen)).mean, 1)} | ${f(stats(B.map((r) => r.gen)).mean, 1)} |`);
}
const wins = (x: string, y: string) => b.filter((r) => r.profile === x).filter((r) => r.log10Value > b.find((q) => q.profile === y && q.seed === r.seed)!.log10Value).length;
console.log(`\nÀ dt 0,1 : mono-commercer bat mono-cultiver sur ${wins('mono-commercer', 'mono-cultiver')}/50 graines ; ratio de valeur mono-commercer / mono-mediter = ×${f(10 ** (means['mono-commercer'] - means['mono-mediter']), 1)}.`);
