// Destin du jour : « la Commande du comté ». Une vie identique pour tous les joueurs, une commande à livrer
// le plus jeune possible. Le code d'une partie sert à rejouer le fantôme de son record ; il n'y a plus
// de vérification de code (0.4) : sans classement, elle ne protégeait rien et figeait l'équilibrage.
import { ACTS, DAILY_NAMES, RES, TRAITS, type ActId, type ResId } from './data';
import { ecoStep, harmonyMult, newEco, type Eco } from './ecosystem';
import { hashStr, Rng } from './rng';
import { lifeTick, sumMods, type SimCtx } from './sim';
import { newLife, zeroActs, zeroRes, type LifeState } from './state';

export const DAILY_DT = 0.1;
export const DAILY_DUR = 90;
const TICKS_PER_SEC = Math.round(1 / DAILY_DT);
const TOTAL_TICKS = Math.round(DAILY_DUR / DAILY_DT);

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
  { id: 'hiver', g: 'chasser', name: 'Hiver rude', icon: '❄️', desc: 'Gibier rare', eco: { G: 15 } },
  { id: 'foire', g: 'commercer', name: 'Foire du comté', icon: '🎪', desc: 'Commercer ×1.8', act: { commercer: 1.8 } },
  { id: 'inflation', g: 'commercer', name: 'Inflation', icon: '📉', desc: 'Commercer ×0.6', act: { commercer: 0.6 } },
  { id: 'academie', g: 'etudier', name: 'Académie ouverte', icon: '🎓', desc: 'Étudier ×1.8', act: { etudier: 1.8 } },
  { id: 'brume', g: 'mediter', name: 'Brume mystique', icon: '🌫️', desc: 'Méditer ×2', act: { mediter: 2 } },
  { id: 'prodiges', g: 'xp', name: 'Âge des prodiges', icon: '⚡', desc: 'Expérience ×1.6', xp: 1.6 },
  { id: 'lenteur', g: 'xp', name: 'Torpeur', icon: '🐌', desc: 'Expérience ×0.6', xp: 0.6 },
];

/** Commande du jour : quantités de chaque ressource à avoir en stock au même moment (0 = pas demandé). */
export type DailyOrder = Record<ResId, number>;

export interface DailySetup {
  date: string;
  name: string;
  traits: string[];
  mods: DailyMod[];
  eco: Eco;
  startRes: Record<ResId, number>;
  order: DailyOrder;
}

/**
 * Forme de la commande avant calibrage : Savoir et Essence toujours demandés (donc au moins quatre
 * activités : une source de Vivres, Commercer, Étudier, Méditer), plus des Vivres et/ou de l'Or.
 */
export const ORDER_BASE: DailyOrder = { vivres: 60, or: 20, savoir: 10, essence: 3 };
/** Bornes de l'âge de livraison du solveur visées par le calibrage de la commande. */
export const ORDER_TARGET: [number, number] = [56, 66];

/** Tirage du jour sans commande (héros, traits, modificateurs, monde). */
function baseSetup(date: string): Omit<DailySetup, 'order'> {
  const rng = new Rng(hashStr('daily:' + date));
  const name = rng.pick(DAILY_NAMES);
  const pos = TRAITS.filter((t) => !t.since && !t.neg && !t.shop && t.rarity <= 1 && !t.mods.heirs && !t.mods.echo && !t.mods.life);
  const neg = TRAITS.filter((t) => !t.since && t.neg && !t.mods.echo && !t.mods.life);
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

/** Forme brute de la commande du jour (proportions), avant mise à l'échelle. */
function orderShape(date: string): DailyOrder {
  const rng = new Rng(hashStr('commande:' + date));
  const vary = () => 0.7 + rng.next() * 0.6;
  const kind = rng.int(3); // 0 : Vivres et Or, 1 : Vivres seuls, 2 : Or seul
  return {
    vivres: kind === 2 ? 0 : ORDER_BASE.vivres * vary() * (kind === 1 ? 1.4 : 1),
    or: kind === 1 ? 0 : ORDER_BASE.or * vary() * (kind === 2 ? 1.4 : 1),
    savoir: ORDER_BASE.savoir * vary(),
    essence: ORDER_BASE.essence * vary(),
  };
}

/** Quantités lisibles : Vivres et Or par 5, Savoir et Essence à l'unité (au moins 1 si demandé). */
function roundOrder(o: DailyOrder, k: number): DailyOrder {
  const r = (x: number, step: number) => (x <= 0 ? 0 : Math.max(step, Math.round((x * k) / step) * step));
  return { vivres: r(o.vivres, 5), or: r(o.or, 5), savoir: r(o.savoir, 1), essence: r(o.essence, 1) };
}

const setupCache = new Map<string, DailySetup>();
const solveCache = new Map<string, DailySolution>();

/**
 * Destin du jour, identique pour tous. La commande est mise à l'échelle pour que le meilleur joueur
 * réactif (règle simple, voir `reactiveBest`) la livre vers 56 à 66 ans ; le solveur fait mieux, ce qui
 * fixe l'Or (`dailyTiers`).
 */
export function dailySetup(date: string): DailySetup {
  const hit = setupCache.get(date);
  if (hit) return structuredCloneSetup(hit);
  const base = baseSetup(date);
  const shape = orderShape(date);
  let k = 1;
  let setup: DailySetup = { ...base, order: roundOrder(shape, k) };
  for (let i = 0; i < 10; i++) {
    const r = reactiveBest(setup);
    const age = (r.deliveredTick ?? TOTAL_TICKS) / TICKS_PER_SEC;
    if (r.delivered && age >= ORDER_TARGET[0] && age <= ORDER_TARGET[1]) break;
    // Livraison trop tardive (ou impossible) : commande réduite ; trop précoce : commande grossie.
    k *= !r.delivered ? 0.7 : Math.pow(((ORDER_TARGET[0] + ORDER_TARGET[1]) / 2) / age, 0.9);
    setup = { ...base, order: roundOrder(shape, k) };
  }
  setupCache.set(date, setup);
  return structuredCloneSetup(setup);
}

function structuredCloneSetup(s: DailySetup): DailySetup {
  return { ...s, traits: [...s.traits], mods: [...s.mods], eco: { ...s.eco }, startRes: { ...s.startRes }, order: { ...s.order } };
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
  /** Tic de livraison de la commande (null tant qu'elle n'est pas livrée). */
  deliveredTick: number | null = null;
  /** Avancement de la commande à chaque seconde écoulée (curve[k] = avancement à k s, de 0 à 1). */
  curve: number[];
  /** Âge (en tics) auquel chaque ligne de la commande a été remplie pour la première fois. */
  lineTick: Partial<Record<ResId, number>> = {};

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
    this.curve = [this.progress()];
  }

  get totalTicks() {
    return TOTAL_TICKS;
  }
  get delivered() {
    return this.deliveredTick !== null;
  }
  /** Partie finie : commande livrée ou vie écoulée. */
  get done() {
    return this.delivered || this.tickN >= TOTAL_TICKS;
  }
  /** Le chrono ne démarre qu'à la première activité choisie ; ensuite il ne s'arrête plus. */
  get started() {
    return this.actions.length > 0;
  }

  /**
   * Avance la partie du temps réel écoulé (accumulé dans `acc`) et renvoie le reste à reporter.
   * Avant la première activité, rien n'avance et le temps d'attente n'est pas mis de côté.
   */
  advance(acc: number): number {
    if (!this.started) return 0;
    while (acc >= DAILY_DT && !this.done) {
      this.step();
      acc -= DAILY_DT;
    }
    return acc;
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
    // Le temps ne s'écoule pas avant la première activité (ni dans le jeu, ni au replay d'un code).
    if (this.done || !this.started) return;
    ecoStep(this.eco, DAILY_DT);
    lifeTick(this.ctx, this.life, this.hero, this.xpMult, DAILY_DT);
    this.tickN++;
    const o = this.setup.order;
    let all = true;
    for (const r of RES) {
      if (o[r] <= 0) continue;
      if (this.res[r] >= o[r]) { if (this.lineTick[r] === undefined) this.lineTick[r] = this.tickN; } else all = false;
    }
    if (all) this.deliveredTick = this.tickN;
    if (this.tickN % TICKS_PER_SEC === 0 || this.delivered) this.curve.push(this.progress());
  }

  /** Avancement de la commande : moyenne des lignes, chacune plafonnée à 100 %. */
  progress(): number {
    const o = this.setup.order;
    let s = 0, n = 0;
    for (const r of RES) if (o[r] > 0) { s += Math.min(1, this.res[r] / o[r]); n++; }
    return n ? s / n : 0;
  }

  /** Ce qui manque encore à la commande. */
  missing(): Partial<Record<ResId, number>> {
    const out: Partial<Record<ResId, number>> = {};
    for (const r of RES) if (this.setup.order[r] > this.res[r]) out[r] = this.setup.order[r] - this.res[r];
    return out;
  }

  /**
   * Résultat comparable (plus grand = meilleur) : une commande livrée vaut 1000 + tics d'avance sur la fin
   * de la vie ; sinon, l'avancement en millièmes (0 à 999).
   */
  score(): number {
    return dailyResult(this.deliveredTick, this.progress());
  }
}

export function dailyResult(deliveredTick: number | null, progress: number): number {
  return deliveredTick !== null ? 1000 + TOTAL_TICKS - deliveredTick : Math.min(999, Math.floor(progress * 1000));
}
/** Âge de livraison (en années, au dixième) d'un résultat, ou null si la commande n'a pas été livrée. */
export function resultAge(result: number): number | null {
  return result >= 1000 ? (TOTAL_TICKS - (result - 1000)) / TICKS_PER_SEC : null;
}

/** Rejoue une liste d'actions et renvoie le résultat. */
export function replay(date: string, actions: [number, number][]): number {
  return replayRun(date, actions).score();
}

/** Trace d'une partie : avancement à chaque seconde, activité de chaque seconde et âge de chaque ligne remplie. */
export interface DailyTrace { curve: number[]; rec: number[]; lineTick: Partial<Record<ResId, number>>; deliveredTick: number | null }

const traceOf = (run: DailyRun): DailyTrace => ({ curve: run.curve, rec: run.life.rec, lineTick: run.lineTick, deliveredTick: run.deliveredTick });

/** Trace d'une partie partagée par son code (le record du jour), ou null si le code est illisible. */
export function traceFromCode(code: string): DailyTrace | null {
  const d = decodeRun(code);
  if (!d) return null;
  return traceOf(replayRun(d.date, d.actions));
}

function replayRun(date: string, actions: [number, number][]): DailyRun {
  const run = new DailyRun(dailySetup(date));
  let i = 0;
  // Une partie ne démarre qu'à sa première activité : un code ne peut pas faire tourner le temps à vide au départ.
  const t0 = actions.length ? actions[0][0] : 0;
  while (!run.done) {
    while (i < actions.length && actions[i][0] - t0 === run.tickN) {
      const a = actions[i][1];
      run.setAct(a >= 0 ? ACTS[a] : null);
      i++;
    }
    if (!run.started) break;
    run.step();
  }
  return run;
}

const PREFIX = 'EL2';

export function encodeRun(date: string, actions: [number, number][], result: number): string {
  const body = actions.map(([t, a]) => t.toString(36) + (a < 0 ? 'x' : String(a))).join('.');
  const raw = `${PREFIX}|${date}|${body}|${result}`;
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
    const sc = parseInt(score, 10);
    if (!Number.isFinite(sc)) return null;
    return { date, actions, score: sc };
  } catch {
    return null;
  }
}

/** Carrés de couleur de l'activité dominante par tranche de `step` secondes (partage du résultat). */
export const ACT_SQUARE = ['🟩', '🟧', '🟨', '🟦', '🟪'];
export function dailyStrip(rec: number[], step = 6): string {
  let out = '';
  for (let i = 0; i < rec.length; i += step) {
    const n = new Map<number, number>();
    for (const a of rec.slice(i, i + step)) n.set(a, (n.get(a) ?? 0) + 1);
    const top = [...n.entries()].sort((x, y) => y[1] - x[1] || x[0] - y[0])[0][0];
    out += top >= 0 ? ACT_SQUARE[top] ?? '⬜' : '⬛';
  }
  return out;
}

// --- Solveur et paliers ------------------------------------------------------------------------------

export interface DailySolution { actions: [number, number][]; tick: number; delivered: boolean; progress: number }

/** Joue une liste d'actions (format des codes) ; s'arrête dès qu'elle ne peut plus faire mieux que `cutoff` tics. */
export function playActions(setup: DailySetup, actions: [number, number][], cutoff = TOTAL_TICKS): DailyRun {
  const run = new DailyRun(setup);
  let i = 0;
  while (!run.done && run.tickN < cutoff) {
    while (i < actions.length && actions[i][0] <= run.tickN) { run.setAct(actions[i][1] >= 0 ? ACTS[actions[i][1]] : null); i++; }
    run.step();
  }
  return run;
}
const runCost = (r: DailyRun) => (r.delivered ? r.deliveredTick! : TOTAL_TICKS + Math.round((1 - r.progress()) * 10000));
/** Pénalité par changement d'activité dans le solveur (tics) : l'Or récompense un plan, pas des réflexes. */
export const SWITCH_PENALTY = 20;

/**
 * Joueur réactif : relit la commande toutes les `every` s et fait l'étape qui débloque la ligne la plus en
 * retard (Méditer pour l'Essence ; Étudier si l'Or suffit, sinon Commercer si les Vivres suffisent, sinon la
 * source de Vivres). C'est une règle simple qu'un joueur attentif peut suivre : elle sert de point de départ.
 */
export function reactivePlay(setup: DailySetup, src: ActId, every: number, orMin: number, vivMin: number): DailyRun {
  const run = new DailyRun(setup);
  const o = setup.order;
  const lag = (r: ResId) => (o[r] > 0 ? run.res[r] / o[r] : 9);
  const pick = (): ActId => {
    const worst = (['essence', 'savoir', 'or', 'vivres'] as ResId[]).reduce((a, b) => (lag(b) < lag(a) ? b : a));
    if (worst === 'essence') return 'mediter';
    if (worst === 'savoir') return run.res.or >= orMin ? 'etudier' : run.res.vivres >= vivMin ? 'commercer' : src;
    if (worst === 'or') return run.res.vivres >= vivMin ? 'commercer' : src;
    return src;
  };
  const per = Math.round(every * TICKS_PER_SEC);
  while (!run.done) {
    if (run.tickN % per === 0) { const a = pick(); if (a !== run.life.act) run.setAct(a); }
    run.step();
  }
  return run;
}

/** Meilleur joueur réactif parmi quelques réglages (rapide : sert au calibrage de la commande). */
export function reactiveBest(setup: DailySetup): DailyRun {
  let best: DailyRun | null = null;
  for (const src of ['cultiver', 'chasser'] as ActId[])
    for (const every of [3, 6])
      for (const [orMin, vivMin] of [[6, 10], [12, 20]]) {
        const r = reactivePlay(setup, src, every, orMin, vivMin);
        if (!best || runCost(r) < runCost(best)) best = r;
      }
  return best!;
}

/**
 * Optimum du jour : recherche locale déterministe (même résultat pour tous) partant du meilleur joueur
 * réactif. Voisinages : un changement d'activité avancé ou retardé (1, 3 ou 8 s), retiré, ou une phase qui
 * change d'activité. Le résultat est un minorant de ce qu'un expert peut faire, pas l'optimum absolu.
 */
export function solveDaily(setup: DailySetup): DailySolution {
  let cur = reactiveBest(setup).actions.map(([t, a]) => [t, a] as [number, number]);
  const pen = (acts: [number, number][]) => SWITCH_PENALTY * acts.length;
  let curCost = runCost(playActions(setup, cur)) + pen(cur);
  const norm = (acts: [number, number][]) => {
    const out: [number, number][] = [];
    for (const [t, a] of [...acts].sort((x, y) => x[0] - y[0])) {
      const tt = Math.max(0, Math.min(TOTAL_TICKS - 1, t));
      if (out.length && out[out.length - 1][0] === tt) out.pop();
      if (!out.length || out[out.length - 1][1] !== a) out.push([tt, a]);
    }
    if (out.length) out[0][0] = 0;
    return out;
  };
  for (let sweep = 0; sweep < 40; sweep++) {
    let improved = false;
    const neigh: [number, number][][] = [];
    for (let i = 1; i < cur.length; i++) for (const d of [-80, -30, -10, 10, 30, 80]) neigh.push(cur.map(([t, a], j) => [j === i ? t + d : t, a] as [number, number]));
    for (let i = 1; i < cur.length; i++) neigh.push(cur.filter((_, j) => j !== i));
    for (let i = 0; i < cur.length; i++) for (let a = 0; a < 5; a++) if (a !== cur[i][1]) neigh.push(cur.map(([t, b], j) => [t, j === i ? a : b] as [number, number]));
    for (const q of neigh) {
      const qq = norm(q);
      if (!qq.length) continue;
      const c = runCost(playActions(setup, qq, curCost < TOTAL_TICKS ? curCost - pen(qq) : TOTAL_TICKS)) + pen(qq);
      if (c < curCost) { cur = qq; curCost = c; improved = true; break; }
    }
    if (!improved) break;
  }
  const r = playActions(setup, cur);
  return { actions: cur, tick: r.deliveredTick ?? TOTAL_TICKS, delivered: r.delivered, progress: r.progress() };
}

/** Solution du solveur pour la date (calculée une fois, mise en cache). */
export function dailySolution(date: string): DailySolution {
  const hit = solveCache.get(date);
  if (hit) return hit;
  const sol = solveDaily(dailySetup(date));
  solveCache.set(date, sol);
  return sol;
}

/** Marge de l'Or sur l'optimum trouvé par le solveur (en années). */
export const GOLD_MARGIN = 2;

/**
 * Paliers du jour, en âges de livraison (années) : Bronze = livrée dans la vie (90), Or = âge du solveur
 * + marge, Argent à mi-chemin. Une médaille est gagnée si la commande est livrée à cet âge ou avant.
 */
export function dailyTiers(date: string): number[] {
  const sol = dailySolution(date);
  const gold = Math.min(DAILY_DUR, Math.ceil(sol.tick / TICKS_PER_SEC) + GOLD_MARGIN);
  const silver = Math.round((gold + DAILY_DUR) / 2);
  return [DAILY_DUR, silver, gold];
}

/** Nombre de médailles (0 à 3) d'un résultat. */
export function medalsOf(date: string, result: number): number {
  const age = resultAge(result);
  if (age === null) return 0;
  return dailyTiers(date).filter((t) => age <= t).length;
}
