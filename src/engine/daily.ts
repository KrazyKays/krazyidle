// Destin du jour : une vie identique pour tous les joueurs, rejouable et vérifiable par code.
import { ACTS, FIRST_NAMES, RES, RES_INFO, TRAITS, type ActId, type ResId } from './data';
import { ecoStep, harmonyMult, newEco, type Eco } from './ecosystem';
import { hashStr, Rng } from './rng';
import { lifeTick, sumMods, type SimCtx } from './sim';
import { newLife, zeroActs, zeroRes, type LifeState } from './state';

export const DAILY_DT = 0.1;
export const DAILY_DUR = 90;

export interface DailyMod {
  id: string;
  g: string;
  name: string;
  icon: string;
  desc: string;
  act?: Partial<Record<ActId, number>>;
  xp?: number;
  eco?: Partial<Eco>;
}

export const DAILY_MODS: DailyMod[] = [
  { id: 'secheresse', g: 'cultiver', name: 'Sécheresse', icon: '☀️', desc: 'Cultiver ×0.5', act: { cultiver: 0.5 } },
  { id: 'fertiles', g: 'cultiver', name: 'Terres fertiles', icon: '🌷', desc: 'Flore initiale abondante', eco: { F: 100 } },
  { id: 'abondance', g: 'chasser', name: 'Gibier abondant', icon: '🐗', desc: 'Gibier initial ×2', eco: { G: 60 } },
  { id: 'loups', g: 'chasser', name: 'Hiver des loups', icon: '🐺', desc: 'Prédateurs nombreux, Gibier rare', eco: { P: 30, G: 15 } },
  { id: 'foire', g: 'commercer', name: 'Foire du comté', icon: '🎪', desc: 'Commercer ×1.8', act: { commercer: 1.8 } },
  { id: 'inflation', g: 'commercer', name: 'Inflation', icon: '📉', desc: 'Commercer ×0.6', act: { commercer: 0.6 } },
  { id: 'academie', g: 'etudier', name: 'Académie ouverte', icon: '🎓', desc: 'Étudier ×1.8', act: { etudier: 1.8 } },
  { id: 'brume', g: 'mediter', name: 'Brume mystique', icon: '🌫️', desc: 'Méditer ×2', act: { mediter: 2 } },
  { id: 'prodiges', g: 'xp', name: 'Âge des prodiges', icon: '⚡', desc: 'Expérience ×1.6', xp: 1.6 },
  { id: 'lenteur', g: 'xp', name: 'Torpeur', icon: '🐌', desc: 'Expérience ×0.6', xp: 0.6 },
];

export interface DailySetup {
  date: string;
  name: string;
  traits: string[];
  mods: DailyMod[];
  eco: Eco;
  startRes: Record<ResId, number>;
}

export function dailySetup(date: string): DailySetup {
  const rng = new Rng(hashStr('daily:' + date));
  const name = rng.pick(FIRST_NAMES);
  const pos = TRAITS.filter((t) => !t.neg && !t.shop && t.rarity <= 1 && !t.mods.heirs && !t.mods.echo && !t.mods.life);
  const neg = TRAITS.filter((t) => t.neg && !t.mods.echo && !t.mods.life);
  const traits: string[] = [];
  while (traits.length < 2) {
    const t = rng.pick(pos).id;
    if (!traits.includes(t)) traits.push(t);
  }
  traits.push(rng.pick(neg).id);
  const mods: DailyMod[] = [];
  while (mods.length < 2) {
    const m = rng.pick(DAILY_MODS);
    if (!mods.some((x) => x.g === m.g)) mods.push(m);
  }
  const eco = newEco();
  for (const m of mods) Object.assign(eco, m.eco ?? {});
  const startRes = zeroRes();
  startRes.vivres = 10 + rng.int(4) * 5;
  return { date, name, traits, mods, eco, startRes };
}

export class DailyRun {
  setup: DailySetup;
  life: LifeState;
  res: Record<ResId, number>;
  eco: Eco;
  tickN = 0;
  actions: [number, number][] = [];
  ctx: SimCtx;
  hero: { traits: string[]; vocation: null };
  xpMult: number;

  constructor(setup: DailySetup) {
    this.setup = setup;
    this.res = { ...setup.startRes };
    this.eco = { ...setup.eco };
    const m = sumMods(setup.traits);
    this.life = newLife(DAILY_DUR, (() => { const z = zeroActs(); for (const a of ACTS) z[a] = Math.max(0, m.start); return z; })());
    this.hero = { traits: setup.traits, vocation: null };
    let xp = Math.max(0.2, 1 + m.xp);
    for (const md of setup.mods) if (md.xp) xp *= md.xp;
    this.xpMult = xp;
    const mods = setup.mods;
    this.ctx = {
      res: this.res,
      eco: this.eco,
      ecoImpactMult: Math.max(0.3, 1 - m.eco),
      prodMult: (a) => {
        let x = harmonyMult(this.eco);
        for (const md of mods) if (md.act?.[a]) x *= md.act[a]!;
        return x;
      },
    };
  }

  get totalTicks() {
    return Math.round(DAILY_DUR / DAILY_DT);
  }
  get done() {
    return this.tickN >= this.totalTicks;
  }

  setAct(a: ActId | null) {
    if (this.done) return;
    const idx = a ? ACTS.indexOf(a) : -1;
    if (this.actions.length && this.actions[this.actions.length - 1][0] === this.tickN) this.actions.pop();
    const prev = this.actions.length ? this.actions[this.actions.length - 1][1] : -1;
    if (prev !== idx) this.actions.push([this.tickN, idx]);
    this.life.act = a;
  }

  step() {
    if (this.done) return;
    ecoStep(this.eco, DAILY_DT);
    lifeTick(this.ctx, this.life, this.hero, this.xpMult, DAILY_DT);
    this.tickN++;
  }

  score(): number {
    let v = 0;
    for (const r of RES) v += this.res[r] * RES_INFO[r].value;
    return Math.floor(v);
  }
}

/** Rejoue une liste d'actions et renvoie le score. */
export function replay(date: string, actions: [number, number][]): number {
  const run = new DailyRun(dailySetup(date));
  let i = 0;
  while (!run.done) {
    while (i < actions.length && actions[i][0] === run.tickN) {
      const a = actions[i][1];
      run.setAct(a >= 0 ? ACTS[a] : null);
      i++;
    }
    run.step();
  }
  return run.score();
}

const PREFIX = 'KI1';

export function encodeRun(date: string, actions: [number, number][], score: number): string {
  const body = actions.map(([t, a]) => t.toString(36) + (a < 0 ? 'x' : String(a))).join('.');
  const raw = `${PREFIX}|${date}|${body}|${score}`;
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeRun(code: string): { date: string; actions: [number, number][]; score: number } | null {
  try {
    const b = code.trim().replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(b + '='.repeat((4 - (b.length % 4)) % 4));
    const [p, date, body, score] = raw.split('|');
    if (p !== PREFIX || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    const actions: [number, number][] = body
      ? body.split('.').map((tok) => {
          const last = tok.slice(-1);
          return [parseInt(tok.slice(0, -1), 36), last === 'x' ? -1 : parseInt(last, 10)] as [number, number];
        })
      : [];
    if (actions.some(([t, a]) => !Number.isFinite(t) || !Number.isFinite(a) || a > 4)) return null;
    return { date, actions, score: parseInt(score, 10) };
  } catch {
    return null;
  }
}

export function verifyCode(code: string): { ok: boolean; date: string; claimed: number; actual: number } | null {
  const d = decodeRun(code);
  if (!d) return null;
  const actual = replay(d.date, d.actions);
  return { ok: actual === d.score, date: d.date, claimed: d.score, actual };
}

export const DAILY_TIERS = [250, 500, 800];
