// Comparaison d'une ou plusieurs campagnes candidates à une référence (mêmes graines), critères 1 à 3.
//   node lab/balance/simplif/analyse.mjs <id-réf> <id-cand> [<id-cand> …] [--md]
import { readFileSync } from 'node:fs';
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const md = process.argv.includes('--md');
const load = (id) => readFileSync(`lab/results/${id}/runs.jsonl`, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const by = (runs) => { const o = {}; for (const r of runs) (o[r.profile] ??= new Map()).set(r.seed, r); return o; };
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sd = (xs) => { const m = mean(xs); return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, xs.length - 1)); };
const q = (xs, p) => { const v = [...xs].sort((a, b) => a - b); return v[Math.round(p * (v.length - 1))]; };
const TOL = Math.log10(1.05);
const [refId, ...cands] = args;
const ref = by(load(refId));
const MONO = ['mono-cultiver', 'mono-commercer', 'mono-etudier', 'mono-mediter'];
const vals = (B, p, S) => [...B[p].values()].filter((r) => !S || S[p]?.has(r.seed)).map((r) => r.log10Value);
const spread = (B, S) => { const ms = MONO.filter((p) => B[p]).map((p) => mean(vals(B, p, S))); return ms.length === 4 ? Math.max(...ms) - Math.min(...ms) : NaN; };
const etudGap = (B, S) => B['mono-etudier'] && B['mono-cultiver'] ? Math.max(...MONO.map((p) => mean(vals(B, p, S)))) - mean(vals(B, 'mono-etudier', S)) : NaN;
const f = (x, d = 3) => (Number.isFinite(x) ? x.toFixed(d) : '—');
const pct = (x) => (x >= 0 ? '+' : '') + (x * 100).toFixed(1) + ' %';
for (const cid of cands) {
  const C = by(load(cid));
  let ok1 = true, ok3 = true;
  const rows = [];
  for (const p of Object.keys(ref)) {
    if (!C[p]) continue;
    const seeds = [...ref[p].keys()].filter((s) => C[p].has(s));
    const d = seeds.map((s) => C[p].get(s).log10Value - ref[p].get(s).log10Value);
    const dv = mean(d), se = sd(d) / Math.sqrt(d.length);
    const L0 = mean(seeds.map((s) => ref[p].get(s).legacyTotal)), L1 = mean(seeds.map((s) => C[p].get(s).legacyTotal));
    const G0 = mean(seeds.map((s) => ref[p].get(s).gen)), G1 = mean(seeds.map((s) => C[p].get(s).gen));
    const hc0 = mean(seeds.map((s) => ref[p].get(s).heroActShare.cultiver)), hc1 = mean(seeds.map((s) => C[p].get(s).heroActShare.cultiver));
    const ec0 = mean(seeds.map((s) => ref[p].get(s).echoActShare.cultiver)), ec1 = mean(seeds.map((s) => C[p].get(s).echoActShare.cultiver));
    const es0 = mean(seeds.map((s) => ref[p].get(s).echoShare)), es1 = mean(seeds.map((s) => C[p].get(s).echoShare));
    const v1 = Math.abs(dv) <= TOL, l1 = Math.abs(L1 / L0 - 1) <= 0.05, s3 = hc1 - hc0 <= 0.05 && ec1 - ec0 <= 0.05;
    if (!v1 || !l1) ok1 = false;
    if (!s3) ok3 = false;
    rows.push({ p, n: seeds.length, dv, se, vx: 10 ** dv - 1, L: L1 / L0 - 1, G: G1 / G0 - 1, hc: hc1 - hc0, ec: ec1 - ec0, es: es1 - es0, v1, l1, s3,
      v10: q(seeds.map((s) => C[p].get(s).log10Value), 0.1), v50: q(seeds.map((s) => C[p].get(s).log10Value), 0.5), v90: q(seeds.map((s) => C[p].get(s).log10Value), 0.9) });
  }
  const sp0 = spread(ref, C), sp1 = spread(C);
  const ok2 = !Number.isFinite(sp1) || sp1 <= sp0 + 0.02;
  console.log(`\n## ${cid} contre ${refId}`);
  console.log('| profil | n | valeur (Δ, ± erreur type appariée) | p10/p50/p90 log10 | Héritage | générations | part Récolter héros / Échos (points) | part des Échos (points) | C1 | C3 |');
  console.log('|---|---|---|---|---|---|---|---|---|---|');
  for (const r of rows) console.log(`| ${r.p} | ${r.n} | ${pct(r.vx)} (±${f(r.se * Math.LN10 * 100, 1)} %) | ${f(r.v10, 2)} / ${f(r.v50, 2)} / ${f(r.v90, 2)} | ${pct(r.L)} | ${pct(r.G)} | ${f(r.hc * 100, 1)} / ${f(r.ec * 100, 1)} | ${f(r.es * 100, 1)} | ${r.v1 && r.l1 ? '✅' : '❌'} | ${r.s3 ? '✅' : '❌'} |`);
  console.log(`\nÉcart mono-activités (max − min, log10) : réf ${f(sp0)} → ${f(sp1)} ; meilleur mono − mono-etudier : réf ${f(etudGap(ref, C))} → ${f(etudGap(C))}.`);
  console.log(`Critère 1 : ${ok1 ? '✅' : '❌'} · critère 2 : ${Number.isFinite(sp1) ? (ok2 ? '✅' : '❌') : 'n/a'} · critère 3 : ${ok3 ? '✅' : '❌'}`);
}
