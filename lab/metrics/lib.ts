// Outils statistiques du Game Data Analyst (lecture seule sur lab/sim et src/).
// Utilisé par lab/metrics/analyze.ts, lab/metrics/robustness.ts et lab/reports/build-dashboard.ts.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { RunResult } from '../sim/runner';

export const ROOT = join(import.meta.dirname ?? new URL('.', import.meta.url).pathname, '..', '..');

export function loadRuns(id: string): RunResult[] {
  const p = join(ROOT, 'lab', 'results', id, 'runs.jsonl');
  if (!existsSync(p)) throw new Error(`runs.jsonl introuvable : ${p}`);
  return readFileSync(p, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

export function loadMeta(id: string): any {
  const p = join(ROOT, 'lab', 'results', id, 'meta.json');
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : { id };
}

export function byProfile(rs: RunResult[]): Record<string, RunResult[]> {
  const o: Record<string, RunResult[]> = {};
  for (const r of rs) (o[r.profile] ??= []).push(r);
  return o;
}

export interface D { n: number; mean: number; sd: number; p10: number; p50: number; p90: number; min: number; max: number; ci95: number }

/** Statistiques descriptives ; quantiles par interpolation linéaire (type 7). */
export function desc(xs: number[]): D {
  const v = xs.filter(Number.isFinite).sort((a, b) => a - b);
  const n = v.length;
  if (!n) return { n: 0, mean: NaN, sd: NaN, p10: NaN, p50: NaN, p90: NaN, min: NaN, max: NaN, ci95: NaN };
  const mean = v.reduce((a, b) => a + b, 0) / n;
  const sd = n > 1 ? Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1)) : 0;
  const q = (p: number) => { const h = (n - 1) * p, lo = Math.floor(h), hi = Math.ceil(h); return v[lo] + (v[hi] - v[lo]) * (h - lo); };
  return { n, mean, sd, p10: q(0.1), p50: q(0.5), p90: q(0.9), min: v[0], max: v[n - 1], ci95: 1.96 * sd / Math.sqrt(n) };
}

export function pearson(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 3) return NaN;
  const mx = x.reduce((a, b) => a + b, 0) / n, my = y.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; syy += (y[i] - my) ** 2; }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : NaN;
}

const ranks = (x: number[]) => {
  const idx = x.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0]);
  const r = new Array(x.length);
  for (let i = 0; i < idx.length;) {
    let j = i; while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
    for (let k = i; k <= j; k++) r[idx[k][1]] = (i + j) / 2 + 1;
    i = j + 1;
  }
  return r as number[];
};
export const spearman = (x: number[], y: number[]) => pearson(ranks(x), ranks(y));

/** Nombre de graines par groupe pour détecter un écart `delta` (unités du KPI), α = 0,05 bilatéral, puissance 0,8. */
export const seedsNeeded = (sd: number, delta: number) => (delta > 0 ? Math.ceil(2 * ((1.96 + 0.8416) ** 2) * sd * sd / (delta * delta)) : Infinity);

/** Test de Welch (approximation normale, suffisante pour n ≥ 30) : renvoie z. */
export function welchZ(a: number[], b: number[]) {
  const A = desc(a), B = desc(b);
  const se = Math.sqrt(A.sd ** 2 / A.n + B.sd ** 2 / B.n);
  return se ? (B.mean - A.mean) / se : (B.mean === A.mean ? 0 : Infinity);
}

/** Test apparié (mêmes graines) : z de la différence moyenne. */
export function pairedZ(a: number[], b: number[]) {
  const d = a.map((x, i) => b[i] - x);
  const D = desc(d);
  return D.sd ? D.mean / (D.sd / Math.sqrt(D.n)) : (D.mean === 0 ? 0 : Infinity);
}

export const fmt = (x: number, d = 3) => (!Number.isFinite(x) ? '—' : Math.abs(x) >= 1000 ? x.toFixed(0) : Math.abs(x) >= 10 ? x.toFixed(1) : x.toFixed(d));
export const pct = (x: number, d = 0) => (Number.isFinite(x) ? (x * 100).toFixed(d) + ' %' : '—');
