// Outillage commun du Game Balancer (phase 1, lecture seule sur le jeu).
// - runBal : clone fidèle de lab/sim/runner.ts (même boucle, mêmes profils), qui mesure EN PLUS la valeur
//   NETTE produite (Σ Δressources × valeur pendant les ticks, consommation déduite), en plus de la valeur
//   BRUTE (Σ totalEver × valeur, indicateur log10Value des campagnes).
// - applyObjPatches : surcharges en mémoire des objets exportés (ACT, BUILDING, LEGACY_DEF, TRAIT, RES_INFO…).
// Les surcharges de littéraux passent par lab/balance/patch-loader.mjs (variable BAL_PATCH).
import * as data from '../../src/engine/data';
import { ACTS, RES, RES_INFO, type ActId } from '../../src/engine/data';
import { newRuntime, setActivity, simulateOffline, startLife, tick } from '../../src/engine/game';
import { Rng } from '../../src/engine/rng';
import { newGame, type GameState } from '../../src/engine/state';
import { PROFILES, type Ctx, type Profile } from '../sim/profiles';

export { PROFILES };

const roots: Record<string, any> = {
  ACT: data.ACT, ACT_UNLOCK: data.ACT_UNLOCK, BUILDING: data.BUILDING, LEGACY: data.LEGACY_DEF, TRAIT: data.TRAIT, RES_INFO: data.RES_INFO, EVENT: data.EVENT_DEF,
};

/** « ACT.mediter.produce.essence*=1.5;BUILDING.champs.growth=2 » → modifie les objets en mémoire. */
export function applyObjPatches(spec: string | undefined) {
  if (!spec) return;
  for (const part of spec.split(';').map((x) => x.trim()).filter(Boolean)) {
    const m = part.match(/^([\w.]+)\s*(\*=|=)\s*([-\d.eE]+)$/);
    if (!m) throw new Error('patch objet illisible : ' + part);
    const path = m[1].split('.');
    let o = roots[path[0]];
    if (!o) throw new Error('racine inconnue : ' + path[0]);
    for (const k of path.slice(1, -1)) { o = o[k]; if (o === undefined) throw new Error('chemin inconnu : ' + part); }
    const key = path[path.length - 1];
    if (typeof o[key] !== 'number') throw new Error('pas un nombre : ' + part);
    o[key] = m[2] === '*=' ? o[key] * Number(m[3]) : Number(m[3]);
  }
}
applyObjPatches(process.env.BAL_OBJ);

export const wealth = (s: GameState) => RES.reduce((a, r) => a + s.res[r] * RES_INFO[r].value, 0);
export const grossValue = (s: GameState) => RES.reduce((a, r) => a + s.totalEver[r] * RES_INFO[r].value, 0);

export interface BalOpts {
  profile: string | Profile;
  seed: number;
  hours: number;
  dt?: number;
  events?: boolean;
  start?: number;
  /** appelé après chaque succession validée (ex. forcer un trait) */
  afterSuccession?: (s: GameState) => void;
  /** appelé à chaque heure pleine */
  onHour?: (s: GameState, h: number) => void;
}

export interface BalResult {
  profile: string; seed: number; hours: number; dt: number; events: boolean;
  gen: number; lives: number; legacyTotal: number;
  grossLog10: number; netLog10: number; wealthLog10: number;
  hourly: { h: number; gross: number; net: number; gen: number; legacy: number }[];
  heroActShare: Record<string, number>;
  buildings: Record<string, number>; upgrades: Record<string, number>;
  harmonyAvg: number;
  unlockAt: Record<string, number>;
  bestLife: number;
}

export function runBal(o: BalOpts): BalResult {
  const prof = typeof o.profile === 'string' ? PROFILES[o.profile] : o.profile;
  if (!prof) throw new Error('profil inconnu ' + o.profile);
  const dt = o.dt ?? 0.5;
  const events = o.events ?? false;
  const start = o.start ?? Date.UTC(2026, 10, 16);
  const s = newGame(start, o.seed);
  const rt = newRuntime();
  rt.online = events;
  startLife(s);
  const c: Ctx = { t: 0, now: start, rt, rng: new Rng(o.seed ^ 0x9e3779b9), mem: {} };
  const total = o.hours * 3600;
  const actTime: Record<string, number> = Object.fromEntries(ACTS.map((a) => [a, 0]));
  const unlockAt: Record<string, number> = {};
  let net = 0, nextDecide = 0, nextBuy = 0, succAt = -1, hSum = 0, hN = 0;
  const hourly: BalResult['hourly'] = [];
  let sessionEnd = prof.sessions ? prof.sessions[0] * 60 : Infinity;
  const succeed = () => { prof.succession(s, c); if (!s.succession) o.afterSuccession?.(s); };
  while (c.t < total) {
    if (c.t >= sessionEnd && prof.sessions) {
      const off = Math.min(prof.sessions[1] * 3600, total - c.t);
      const w0 = wealth(s);
      simulateOffline(s, rt, off, c.now + off * 1000);
      net += wealth(s) - w0;
      c.t += off; c.now += off * 1000;
      rt.online = events;
      sessionEnd = c.t + prof.sessions[0] * 60;
      nextDecide = nextBuy = c.t;
      if (s.succession) succAt = c.t;
      continue;
    }
    if (s.life && c.t >= nextDecide) {
      const a = prof.activity(s, c);
      if (a !== s.life.act) setActivity(s, a);
      nextDecide = c.t + prof.decideEvery;
    }
    if (s.life?.act) actTime[s.life.act] += dt;
    c.now += dt * 1000;
    const w0 = wealth(s);
    tick(s, rt, dt, c.now);
    net += wealth(s) - w0;
    c.t += dt;
    hSum += 1; hN++; // 0.5 : plus de Domaine
    if (s.succession) {
      if (succAt < 0) succAt = c.t + prof.successionDelay;
      if (c.t >= succAt) { succeed(); succAt = -1; }
    }
    if (c.t >= nextBuy) { prof.buy(s, c); nextBuy = c.t + prof.buyEvery; }
    for (const a of s.unlocked) if (unlockAt[a] === undefined) unlockAt[a] = c.t;
    if (Math.floor(c.t / 3600) !== Math.floor((c.t - dt) / 3600)) {
      const h = Math.round(c.t / 3600);
      hourly.push({ h, gross: Math.log10(Math.max(1, grossValue(s))), net: Math.log10(Math.max(1, net)), gen: s.hero.gen, legacy: s.legacyTotal });
      o.onHour?.(s, h);
    }
  }
  const tot = Object.values(actTime).reduce((a, b) => a + b, 0) || 1;
  return {
    profile: prof.id, seed: o.seed, hours: o.hours, dt, events,
    gen: s.hero.gen, lives: s.stats.lives, legacyTotal: s.legacyTotal,
    grossLog10: Math.log10(Math.max(1, grossValue(s))), netLog10: Math.log10(Math.max(1, net)), wealthLog10: Math.log10(Math.max(1, wealth(s))),
    hourly, heroActShare: Object.fromEntries(ACTS.map((a) => [a, actTime[a] / tot])),
    buildings: { ...s.buildings }, upgrades: { ...s.upgrades }, harmonyAvg: hN ? hSum / hN : 0,
    unlockAt, bestLife: s.stats.bestLife,
  };
}

// ---------------------------------------------------------------------------
export function stats(xs: number[]) {
  const v = xs.filter(Number.isFinite).sort((a, b) => a - b);
  const n = v.length;
  if (!n) return { n: 0, mean: NaN, sd: NaN, p10: NaN, p50: NaN, p90: NaN, min: NaN, max: NaN };
  const mean = v.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, n - 1));
  const q = (p: number) => v[Math.min(n - 1, Math.max(0, Math.round(p * (n - 1))))];
  return { n, mean, sd, p10: q(0.1), p50: q(0.5), p90: q(0.9), min: v[0], max: v[n - 1] };
}
export const f = (x: number, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : '—');
export const ms = (x: ReturnType<typeof stats>, d = 2) => `${f(x.mean, d)} ± ${f(x.sd, d)} (p10 ${f(x.p10, d)} · p50 ${f(x.p50, d)} · p90 ${f(x.p90, d)})`;

export function parseSeeds(spec: string): number[] {
  const out: number[] = [];
  for (const part of spec.split(',')) {
    const [a, b] = part.split('-').map(Number);
    if (b === undefined) out.push(a); else for (let i = a; i <= b; i++) out.push(i);
  }
  return out;
}
export function arg(name: string, def?: string): string | undefined {
  const a = process.argv.find((x) => x === `--${name}` || x.startsWith(`--${name}=`));
  if (!a) return def;
  return a.includes('=') ? a.slice(a.indexOf('=') + 1) : 'true';
}
export type { ActId };
