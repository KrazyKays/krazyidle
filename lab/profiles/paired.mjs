// Comparaison appariée (mêmes graines) : node lab/profiles/paired.mjs <dirA> <profA> <dirB> <profB> [kpi=log10Value]
import { readFileSync } from 'node:fs';
const [da, pa, db, pb, k = 'log10Value'] = process.argv.slice(2);
const load = (d, p) => Object.fromEntries(readFileSync(d + '/runs.jsonl', 'utf8').trim().split('\n').map(JSON.parse).filter((r) => r.profile === p).map((r) => [r.seed, r[k]]));
const A = load(da, pa), B = load(db, pb);
const ds = Object.keys(A).filter((s) => s in B).map((s) => B[s] - A[s]);
const m = ds.reduce((a, b) => a + b, 0) / ds.length, sd = Math.sqrt(ds.reduce((a, b) => a + (b - m) ** 2, 0) / (ds.length - 1));
const win = ds.filter((x) => x > 0).length;
console.log(`${pb} − ${pa} [${k}] : Δ moy ${m.toFixed(3)} (×${k === 'log10Value' ? (10 ** m).toFixed(3) : '-'}) z ${(m / (sd / Math.sqrt(ds.length))).toFixed(1)} · B meilleur sur ${win}/${ds.length}`);
