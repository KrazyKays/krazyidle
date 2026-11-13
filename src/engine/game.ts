// Logique de la partie principale : vie, Échos, Domaine, succession, événements.
import {
  ACTS, ACT_UNLOCK, BUILDING, BUILDING_FOR_ACT, EVENT_DEF, FIRST_NAMES, LEGACY_DEF, RES, RES_INFO, TRAIT, TRAITS,
  VOCATION_MAX, bMult, legacyCost, type ActId, type ResId,
} from './data';
import { ecoRegen, ecoStep, harmonyMult } from './ecosystem';
import { activeEvent, type EventWindow } from './events';
import { Rng } from './rng';
import { ECHO_ECO_STRENGTH, lifeTick, runActivity, sumMods, type SimCtx } from './sim';
import { newLife, zeroActs, zeroRes, type Ancestor, type Echo, type GameState, type Hero, type LifeState, type Succession, type Vocation } from './state';

export interface Runtime {
  event: EventWindow | null;
  online: boolean;
  /** production brute par seconde (moyenne glissante) */
  rate: Record<ResId, number>;
  net: Record<ResId, number>;
  echoRate: number;
  tickGross: Record<ResId, number>;
  notices: { kind: string; text: string }[];
  pauseLife: boolean;
}

export function newRuntime(): Runtime {
  return { event: null, online: true, rate: zeroRes(), net: zeroRes(), echoRate: 0, tickGross: zeroRes(), notices: [], pauseLife: false };
}

const up = (s: GameState, id: string) => s.upgrades[id] ?? 0;
const bl = (s: GameState, id: string) => s.buildings[id] ?? 0;

// ---------------------------------------------------------------------------
// Multiplicateurs
export function prodMult(s: GameState, rt: Runtime, a: ActId): number {
  let m = bMult(bl(s, BUILDING_FOR_ACT[a]), 0.25);
  m *= Math.pow(1.12, up(s, 'prosperite'));
  m *= harmonyMult(s.eco);
  const ev = rt.online ? rt.event?.def : undefined;
  if (ev?.act?.[a]) m *= ev.act[a]!;
  return m;
}

export function echoPowerMult(s: GameState, rt: Runtime): number {
  let m = 0.4 * (1 + 0.15 * up(s, 'memoire')) * (1 + 0.1 * bl(s, 'sanctuaire'));
  const ev = rt.online ? rt.event?.def : undefined;
  if (ev?.echo) m *= ev.echo;
  return m;
}

export function echoPower(s: GameState, rt: Runtime, e: Echo): number {
  return echoPowerMult(s, rt) * Math.max(0.2, 1 + e.strength);
}

export function xpMult(s: GameState, rt: Runtime): number {
  const m = sumMods(s.hero.traits);
  let x = Math.max(0.2, 1 + m.xp) * (1 + 0.1 * bl(s, 'bibliotheque'));
  const ev = rt.online ? rt.event?.def : undefined;
  if (ev?.xp) x *= ev.xp;
  return x;
}

export function ecoImpactMult(s: GameState): number {
  const m = sumMods(s.hero.traits);
  return Math.max(0.3, 1 - m.eco);
}

/** Garde forestier : le Domaine revient de lui-même vers l'équilibre (0,4 %/s par niveau). */
export const GARDE_REGEN = 0.004;
export function ecoRegenRate(s: GameState): number {
  return GARDE_REGEN * bl(s, 'garde');
}

export function lifeDuration(s: GameState, hero: Hero): number {
  const m = sumMods(hero.traits);
  return Math.max(20, 60 + m.life + 8 * up(s, 'longevite') + 4 * bl(s, 'clepsydre'));
}

export function startLevels(s: GameState, hero: Hero): Record<ActId, number> {
  const m = sumMods(hero.traits);
  const base = Math.max(0, m.start + up(s, 'eveil'));
  const lv = zeroActs();
  for (const a of ACTS) lv[a] = base;
  if (hero.vocation) lv[hero.vocation.act] += Math.floor(hero.vocation.tier / 2);
  return lv;
}

export function echoSlots(s: GameState): number {
  return 2 + up(s, 'crypte');
}

export function offlineCapSec(s: GameState): number {
  return (6 + 2 * up(s, 'patience')) * 3600;
}

export function legacyFor(value: number): number {
  return Math.floor(Math.cbrt(value / 20));
}

// ---------------------------------------------------------------------------
export function makeCtx(s: GameState, rt: Runtime): SimCtx {
  return {
    res: s.res,
    eco: s.eco,
    prodMult: (a) => prodMult(s, rt, a),
    ecoImpactMult: ecoImpactMult(s),
    onProduce: (r, amt, fromLife, act) => {
      s.totalEver[r] += amt;
      rt.tickGross[r] += amt;
      if (fromLife && s.life) {
        const v = amt * RES_INFO[r].value;
        s.life.value += v;
        // L'Écho rejoue sans le bonus d'événement : sa valeur ne doit pas en tenir compte.
        const evMult = rt.online ? rt.event?.def.act?.[act] ?? 1 : 1;
        s.life.baseValue = (s.life.baseValue ?? 0) + v / evMult;
      }
      if (rt.online && rt.event) {
        const ep = s.events[rt.event.key];
        if (ep && rt.event.def.goal === r) ep.progress += amt;
      }
    },
  };
}

/** Activité de départ : celle de la vocation héritée, sinon Cultiver. */
export function defaultAct(s: GameState, hero: Hero): ActId {
  const v = hero.vocation?.act;
  return v && s.unlocked.includes(v) ? v : 'cultiver';
}

export function startLife(s: GameState) {
  s.life = newLife(lifeDuration(s, s.hero), startLevels(s, s.hero), defaultAct(s, s.hero));
}

/** null met la vie en pause : le temps du héros ne s'écoule plus, les Échos continuent. */
export function setActivity(s: GameState, a: ActId | null) {
  if (!s.life) return;
  if (a && !s.unlocked.includes(a)) return;
  s.life.act = a;
  if (a) s.life.lastAct = a;
}

export function isPaused(s: GameState): boolean {
  return !!s.life && !s.life.act;
}

/** Reprend la vie sur la dernière activité choisie (la pause ne survit pas à la session). */
export function resumeLife(s: GameState) {
  if (!s.life || s.life.act) return;
  const last = s.life.lastAct;
  setActivity(s, last && s.unlocked.includes(last) ? last : defaultAct(s, s.hero));
}

/** Un pas de simulation. dt en secondes, now en ms. */
export function tick(s: GameState, rt: Runtime, dt: number, now: number) {
  rt.event = rt.online ? activeEvent(now) : null;
  if (rt.event) ensureEventProgress(s, rt, rt.event);
  for (const r of RES) rt.tickGross[r] = 0;
  const before = { ...s.res };
  const ctx = makeCtx(s, rt);

  // Écosystème
  ecoStep(s.eco, dt);
  ecoRegen(s.eco, ecoRegenRate(s), dt);
  if (rt.online && rt.event?.def.id === 'migration') s.eco.G = Math.min(140, s.eco.G + 0.25 * dt);

  // Échos
  let echoGross = 0;
  for (const e of s.echoes) {
    if (!e.acts.length) continue;
    const p = echoPower(s, rt, e);
    let left = dt;
    while (left > 1e-9) {
      const idx = Math.min(e.acts.length - 1, Math.floor(e.pos));
      const step = Math.min(left, idx + 1 - e.pos);
      const a = e.acts[idx];
      if (a >= 0) {
        const g0 = sumValue(rt.tickGross);
        runActivity(ctx, ACTS[a], e.pow[idx] * p, ECHO_ECO_STRENGTH, step, false);
        echoGross += sumValue(rt.tickGross) - g0;
      }
      e.pos += step;
      left -= step;
      if (e.pos >= e.acts.length - 1e-9) {
        e.pos = 0;
        e.loops++;
      }
    }
  }

  // Vie : le temps du héros ne s'écoule que pendant une activité
  if (s.life && s.life.act && !rt.pauseLife) {
    lifeTick(ctx, s.life, s.hero, xpMult(s, rt), dt);
    if (s.life.t >= s.life.dur - 1e-9) endLife(s, now);
  }

  // Débloquages
  for (const a of ACTS) {
    const u = ACT_UNLOCK[a];
    if (!s.unlocked.includes(a) && u.res && s.totalEver[u.res] >= u.amount) {
      s.unlocked.push(a);
      rt.notices.push({ kind: 'unlock', text: `Nouvelle activité : ${a === 'etudier' ? 'Étudier' : a === 'mediter' ? 'Méditer' : 'Commercer'} !` });
    }
  }

  // Événement : paliers
  if (rt.online && rt.event) checkEventTiers(s, rt, rt.event);

  // Statistiques de taux
  const k = Math.min(1, dt / 3);
  for (const r of RES) {
    rt.rate[r] += (rt.tickGross[r] / dt - rt.rate[r]) * k;
    rt.net[r] += ((s.res[r] - before[r]) / dt - rt.net[r]) * k;
  }
  rt.echoRate += (echoGross / dt - rt.echoRate) * k;
  s.stats.playTime += dt;
  s.lastTick = now;
}

function sumValue(g: Record<ResId, number>) {
  let v = 0;
  for (const r of RES) v += g[r] * RES_INFO[r].value;
  return v;
}

// ---------------------------------------------------------------------------
// Événements
function ensureEventProgress(s: GameState, rt: Runtime, w: EventWindow) {
  if (s.events[w.key]) return;
  let valueRate = 0;
  for (const r of RES) valueRate += rt.rate[r] * RES_INFO[r].value;
  const goal = w.def.goal;
  const target = Math.max(15 / RES_INFO[goal].value * 4, (valueRate * 240) / RES_INFO[goal].value);
  s.events[w.key] = { target: Math.ceil(target), progress: 0, tier: 0 };
  // ménage
  const keys = Object.keys(s.events).sort();
  while (keys.length > 30) delete s.events[keys.shift()!];
}

export const EVENT_TIERS = [1, 2.5, 5];
export const EVENT_REWARDS = [1, 2, 3];
const TIER_NAMES = ['Bronze', 'Argent', 'Or'];

function checkEventTiers(s: GameState, rt: Runtime, w: EventWindow) {
  const ep = s.events[w.key];
  while (ep.tier < 3 && ep.progress >= ep.target * EVENT_TIERS[ep.tier]) {
    s.eclats += EVENT_REWARDS[ep.tier];
    rt.notices.push({ kind: 'event', text: `${EVENT_DEF[w.def.id].icon} Palier ${TIER_NAMES[ep.tier]} atteint ! +${EVENT_REWARDS[ep.tier]} ✦` });
    ep.tier++;
    if (ep.tier === 3) s.stats.eventsDone++;
  }
}

// ---------------------------------------------------------------------------
// Mort & succession
export function dominantAct(life: { timeIn: Record<ActId, number> }): { act: ActId | null; share: number } {
  let best: ActId | null = null, bt = 0, tot = 0;
  for (const a of ACTS) {
    tot += life.timeIn[a];
    if (life.timeIn[a] > bt) { bt = life.timeIn[a]; best = a; }
  }
  return { act: best, share: tot > 0 ? bt / tot : 0 };
}

/** Part de la vie à consacrer à une activité pour en obtenir (ou en faire monter) la Vocation. */
export const VOCATION_SHARE = 0.5;

export interface VocationOutlook {
  act: ActId;
  /** part de la vie déjà passée dans cette activité (0..1) */
  share: number;
  /** secondes encore nécessaires pour atteindre le seuil */
  need: number;
  state: 'secured' | 'onTrack' | 'lost';
  /** vocation transmise si la vie s'achevait selon cet état (null = aucune) */
  result: Vocation | null;
}

/**
 * Pronostic de vocation pour la vie en cours. Le temps ne s'écoulant que pendant
 * une activité, la part finale d'une activité vaut son temps cumulé / durée de vie.
 */
export function vocationOutlook(life: LifeState, hero: Hero): VocationOutlook | null {
  const half = life.dur * VOCATION_SHARE;
  const left = Math.max(0, life.dur - life.t);
  const reachable = (a: ActId) => life.timeIn[a] + left >= half - 1e-6;
  const cur = hero.vocation;
  const tierFor = (a: ActId) => Math.min(VOCATION_MAX, (cur && cur.act === a ? cur.tier : 0) + 1);
  const mk = (a: ActId, state: VocationOutlook['state']): VocationOutlook => {
    let result: Vocation | null;
    if (state === 'lost') result = cur && cur.tier > 1 ? { act: cur.act, tier: cur.tier - 1 } : null;
    else result = { act: a, tier: tierFor(a) };
    return { act: a, share: life.timeIn[a] / life.dur, need: Math.max(0, half - life.timeIn[a]), state, result };
  };
  const secured = ACTS.find((a) => life.timeIn[a] >= half - 1e-6);
  if (secured) return mk(secured, 'secured');
  if (cur && reachable(cur.act)) return mk(cur.act, 'onTrack');
  // Sinon : l'activité atteignable la plus pratiquée (à égalité, celle en cours).
  let best: ActId | null = null;
  for (const a of ACTS) {
    if (!reachable(a)) continue;
    if (best === null || life.timeIn[a] > life.timeIn[best] || (life.timeIn[a] === life.timeIn[best] && a === life.act)) best = a;
  }
  if (best) return mk(best, 'onTrack');
  if (cur) return mk(cur.act, 'lost');
  return null;
}

export function endLife(s: GameState, now: number) {
  const life = s.life!;
  const hero = s.hero;
  const dom = dominantAct(life);
  let voc: Vocation | null = null;
  if (dom.act && dom.share >= VOCATION_SHARE) {
    const prev = hero.vocation && hero.vocation.act === dom.act ? hero.vocation.tier : 0;
    voc = { act: dom.act, tier: Math.min(VOCATION_MAX, prev + 1) };
  }
  const legacyGain = legacyFor(life.value);
  const m = sumMods(hero.traits);
  const echo: Echo = {
    id: s.nextId++, heroId: hero.id, name: hero.name, gen: hero.gen, traits: [...hero.traits], vocation: voc ?? hero.vocation,
    acts: life.rec.slice(), pow: life.pow.slice(), strength: m.echo, pos: 0, loops: 0, pinned: false, value: life.baseValue ?? life.value,
  };
  const ancestor: Ancestor = {
    id: hero.id, name: hero.name, gen: hero.gen, traits: [...hero.traits], vocation: voc ?? hero.vocation,
    value: life.value, legacy: legacyGain, dominant: dom.act, diedAt: now,
  };
  // Vocation non entretenue : elle se transmet affaiblie d'un rang.
  const decayed = hero.vocation && hero.vocation.tier > 1 ? { act: hero.vocation.act, tier: hero.vocation.tier - 1 } : null;
  const heroForHeirs: Hero = { ...hero, vocation: voc ?? decayed };
  const rng = new Rng(s.seed);
  const heirs = genHeirs(s, heroForHeirs, rng);
  s.seed = rng.s;
  s.succession = { heirs, newEcho: echo, legacyGain, vocationEarned: voc, ancestor };
  s.life = null;
}

export function genHeirs(s: GameState, parent: Hero, rng: Rng): Hero[] {
  const pm = sumMods(parent.traits);
  const n = Math.min(6, 3 + up(s, 'sang') + pm.heirs);
  const inherit = 0.5 + 0.08 * up(s, 'transmission') + pm.inherit;
  const luck = up(s, 'etoile');
  const out: Hero[] = [];
  const used = new Set<string>();
  for (let i = 0; i < n; i++) {
    const traits: string[] = [];
    for (const t of parent.traits) {
      const def = TRAIT[t];
      if (!def) continue;
      const p = def.neg ? 0.3 : Math.min(0.95, inherit);
      if (rng.chance(p)) traits.push(t);
    }
    const muts = (rng.chance(0.85) ? 1 : 0) + (rng.chance(0.25 + 0.04 * luck) ? 1 : 0);
    for (let k = 0; k < muts; k++) {
      const rar = rng.weighted([60 - 6 * luck, 28 + 2 * luck, 10 + 3 * luck, 2 + 1 * luck]);
      const negChance = rar === 0 ? Math.max(0.05, 0.3 - 0.05 * luck) : rar === 1 ? 0.12 : 0;
      const wantNeg = rng.chance(negChance);
      const pool = TRAITS.filter((t) => !t.shop && t.rarity === rar && !!t.neg === wantNeg && !traits.includes(t.id));
      if (pool.length) traits.push(rng.pick(pool).id);
    }
    for (const b of s.blessings) if (!traits.includes(b)) traits.push(b);
    // max 4 traits : on garde les meilleurs (positifs d'abord)
    traits.sort((a, b) => score(b) - score(a));
    while (traits.length > 4 + s.blessings.length) traits.pop();
    let vocation: Vocation | null = null;
    if (parent.vocation && rng.chance(Math.min(0.95, 0.6 + 0.08 * up(s, 'transmission')))) vocation = { ...parent.vocation };
    let name = rng.pick(FIRST_NAMES);
    for (let k = 0; k < 5 && used.has(name); k++) name = rng.pick(FIRST_NAMES);
    used.add(name);
    out.push({ id: s.nextId++, name, gen: parent.gen + 1, traits, vocation, parentId: parent.id });
  }
  return out;
}

function score(id: string) {
  const t = TRAIT[id];
  if (!t) return -99;
  return t.neg ? -1 - t.rarity : 1 + t.rarity;
}

/** Valide la succession : héritier choisi + Échos conservés. */
export function confirmSuccession(s: GameState, heirIdx: number, keepEchoIds: number[]): boolean {
  const sc: Succession | null = s.succession;
  if (!sc) return false;
  const all = [...s.echoes, sc.newEcho];
  const keep = all.filter((e) => keepEchoIds.includes(e.id));
  if (keep.length > echoSlots(s)) return false;
  s.echoes = keep;
  s.legacy += sc.legacyGain;
  s.legacyTotal += sc.legacyGain;
  s.ancestors.push(sc.ancestor);
  if (s.ancestors.length > 300) s.ancestors.shift();
  s.stats.lives++;
  s.stats.bestLife = Math.max(s.stats.bestLife, sc.ancestor.value);
  s.hero = sc.heirs[Math.max(0, Math.min(sc.heirs.length - 1, heirIdx))];
  s.blessings = [];
  s.succession = null;
  startLife(s);
  return true;
}

// ---------------------------------------------------------------------------
// Achats
export function buildingCost(id: string, lvl: number): Partial<Record<ResId, number>> {
  const d = BUILDING[id];
  const out: Partial<Record<ResId, number>> = {};
  for (const r in d.cost) out[r as ResId] = Math.ceil(d.cost[r as ResId]! * Math.pow(d.growth, lvl));
  return out;
}

export function canAfford(s: GameState, cost: Partial<Record<ResId, number>>) {
  for (const r in cost) if (s.res[r as ResId] < cost[r as ResId]!) return false;
  return true;
}

export function buyBuilding(s: GameState, id: string): boolean {
  const lvl = bl(s, id);
  const d = BUILDING[id];
  if (d.max !== undefined && lvl >= d.max) return false;
  const cost = buildingCost(id, lvl);
  if (!canAfford(s, cost)) return false;
  for (const r in cost) s.res[r as ResId] -= cost[r as ResId]!;
  s.buildings[id] = lvl + 1;
  if (id === 'clepsydre' && s.life) s.life.dur += 4;
  return true;
}

export function buyLegacy(s: GameState, id: string): boolean {
  const d = LEGACY_DEF[id];
  const lvl = up(s, id);
  if (d.max !== undefined && lvl >= d.max) return false;
  const c = legacyCost(d, lvl);
  if (s.legacy < c) return false;
  s.legacy -= c;
  s.upgrades[id] = lvl + 1;
  if (id === 'longevite' && s.life) s.life.dur += 8;
  return true;
}

export const SHOP = {
  temps: { cost: 2, name: 'Temps suspendu', icon: '⌛', desc: '+30 s à la vie actuelle (1 fois par vie)' },
  crest: { cost: 1, name: 'Nouveau blason', icon: '🛡️', desc: 'Change l\'emblème et la couleur de la lignée' },
  partition: { cost: 3, name: 'Partition d\'écu', icon: '🛡️', desc: 'Divise l\'écu de la maison en deux teintes' },
};

/** Débloque une partition d'écu (Bazar céleste) et l'applique au blason. */
export function buyPartition(s: GameState, id: string): boolean {
  if (s.partitions.includes(id) || s.eclats < SHOP.partition.cost) return false;
  s.eclats -= SHOP.partition.cost;
  s.partitions.push(id);
  s.lineage.partition = id;
  return true;
}
export const BLESSING_COST = [0, 3, 6, 12, 15];

export function buyBlessing(s: GameState, traitId: string): boolean {
  const t = TRAIT[traitId];
  if (!t || t.neg || s.blessings.includes(traitId) || s.blessings.length >= 2) return false;
  const c = BLESSING_COST[t.rarity];
  if (!c || s.eclats < c) return false;
  s.eclats -= c;
  s.blessings.push(traitId);
  return true;
}

export function buyTemps(s: GameState): boolean {
  if (!s.life || s.life.extended || s.eclats < SHOP.temps.cost) return false;
  s.eclats -= SHOP.temps.cost;
  s.life.dur += 30;
  s.life.extended = true;
  return true;
}

// ---------------------------------------------------------------------------
// Hors-ligne
export interface OfflineReport {
  seconds: number;
  gains: Record<ResId, number>;
  died: boolean;
  loops: number;
}

export function simulateOffline(s: GameState, rt: Runtime, elapsedSec: number, now: number): OfflineReport | null {
  const sec = Math.min(elapsedSec, offlineCapSec(s));
  if (sec < 30) return null;
  const before = { ...s.res };
  const loops0 = s.echoes.reduce((a, e) => a + e.loops, 0);
  const hadLife = !!s.life;
  rt.online = false;
  const start = now - sec * 1000;
  const steps = Math.floor(sec);
  for (let i = 0; i < steps; i++) tick(s, rt, 1, start + i * 1000);
  rt.online = true;
  const gains = zeroRes();
  for (const r of RES) gains[r] = s.res[r] - before[r];
  return { seconds: sec, gains, died: hadLife && !s.life, loops: s.echoes.reduce((a, e) => a + e.loops, 0) - loops0 };
}

export { harmonyMult };
