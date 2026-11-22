// Ajustement local (par profil) de Δlog10(valeur) et Δ(Héritage) contre V0 : Δ = c + a·ln H + b·ln kc, sur les
// campagnes du crible, puis recherche du couple (H, kc) qui minimise le pire écart |Δvaleur| sur les profils.
//   node lab/balance/simplif/ajuste.mjs <id-réf> <id:H:kc> [...]  [--sans=occasionnel,…] (profils exclus du minimax)
import { readFileSync } from 'node:fs';
const argv = process.argv.slice(2);
const excl = (argv.find((a) => a.startsWith('--sans=')) ?? '--sans=').slice(7).split(',').filter(Boolean);
// --tenir=a,b : contrainte dure |Δvaleur| ≤ 5 % sur ces profils
const hold = (argv.find((a) => a.startsWith('--tenir=')) ?? '--tenir=').slice(8).split(',').filter(Boolean);
const tol = Number((argv.find((a) => a.startsWith('--tol=')) ?? '--tol=0.05').slice(6)); // tolérance de --tenir
const [refId, ...specs] = argv.filter((a) => !a.startsWith('--'));
const load = (id) => { const m = {}; for (const l of readFileSync(`lab/results/${id}/runs.jsonl`, 'utf8').trim().split('\n')) { const r = JSON.parse(l); (m[r.profile] ??= new Map()).set(r.seed, r); } return m; };
const ref = load(refId);
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const obs = specs.map((s) => { const [id, H, kc] = s.split(':'); const C = load(id); const d = {}; for (const p in C) { const seeds = [...C[p].keys()]; d[p] = { v: mean(seeds.map((x) => C[p].get(x).log10Value - ref[p].get(x).log10Value)), L: Math.log(mean(seeds.map((x) => C[p].get(x).legacyTotal)) / mean(seeds.map((x) => ref[p].get(x).legacyTotal))) }; } return { H: +H, kc: +kc, d }; });
// moindres carrés 3 paramètres
function fit(rows) { // rows: [lnH, lnkc, y]
  const X = rows.map((r) => [1, r[0], r[1]]), y = rows.map((r) => r[2]);
  const A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], b = [0, 0, 0];
  X.forEach((x, i) => { for (let j = 0; j < 3; j++) { b[j] += x[j] * y[i]; for (let k = 0; k < 3; k++) A[j][k] += x[j] * x[k]; } });
  // Gauss
  for (let i = 0; i < 3; i++) { let p = i; for (let r = i + 1; r < 3; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r; [A[i], A[p]] = [A[p], A[i]]; [b[i], b[p]] = [b[p], b[i]]; for (let r = 0; r < 3; r++) if (r !== i) { const f = A[r][i] / A[i][i]; for (let k = 0; k < 3; k++) A[r][k] -= f * A[i][k]; b[r] -= f * b[i]; } }
  return b.map((x, i) => x / A[i][i]);
}
const profiles = Object.keys(obs[0].d);
const M = {};
console.log('| profil | élasticité valeur / H | élasticité valeur / kc | élasticité Héritage / H | / kc |\n|---|---|---|---|---|');
for (const p of profiles) {
  const fv = fit(obs.map((o) => [Math.log(o.H), Math.log(o.kc), o.d[p].v * Math.LN10]));
  const fl = fit(obs.map((o) => [Math.log(o.H), Math.log(o.kc), o.d[p].L]));
  M[p] = { fv, fl };
  console.log(`| ${p} | ${fv[1].toFixed(2)} | ${fv[2].toFixed(2)} | ${fl[1].toFixed(2)} | ${fl[2].toFixed(2)} |`);
}
let best = null;
for (let H = 1.2; H <= 1.4001; H += 0.005) for (let kc = 1; kc <= 1.4001; kc += 0.005) {
  let worst = 0;
  for (const p of profiles) { if (excl.includes(p)) continue; const v = M[p].fv[0] + M[p].fv[1] * Math.log(H) + M[p].fv[2] * Math.log(kc); worst = Math.max(worst, Math.abs(v)); }
  if (hold.some((p) => Math.abs(M[p].fv[0] + M[p].fv[1] * Math.log(H) + M[p].fv[2] * Math.log(kc)) > Math.log(1 + tol))) continue;
  if (!best || worst < best.worst) best = { H, kc, worst };
}
console.log(`\nMinimax (hors ${excl.join(', ') || 'aucun'}${hold.length ? ' ; ±' + tol * 100 + ' % tenu sur ' + hold.join(', ') : ''}) : H = ${best.H.toFixed(3)}, kc = ${best.kc.toFixed(3)}, pire écart prédit ${((Math.exp(best.worst) - 1) * 100).toFixed(1)} %`);
for (const p of profiles) { const v = M[p].fv[0] + M[p].fv[1] * Math.log(best.H) + M[p].fv[2] * Math.log(best.kc); const L = M[p].fl[0] + M[p].fl[1] * Math.log(best.H) + M[p].fl[2] * Math.log(best.kc); console.log(`  ${p.padEnd(15)} valeur ${((Math.exp(v) - 1) * 100).toFixed(1)} %  Héritage ${((Math.exp(L) - 1) * 100).toFixed(1)} %`); }
