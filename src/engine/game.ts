// Logique de la partie principale : vie, Échos, succession, événements.
import {
  ACTS, ACT_UNLOCK, BUILDING, BUILDING_FOR_ACT, EVENT_DEF, FIRST_NAMES, JOJO_LINE, isJoestar, LEGACY_DEF, sexFor, sexOf, RES, RES_INFO, TRAIT, TRAITS,
  GENOME_BUDGET, VOCATION_MAX, bMult, traitWeight, wearMult, legacyCost, type ActId, type ResId,
  EVO_CHANCE, EVO_LEGENDARY, EVO_LUCK, NOVA_CHANCE, NOVA_LUCK, mutationWeights,
} from './data';
import { ripeTraits } from './evolution';
import { FEAT_DEF, checkFeats } from './feats';
import { addCadets, inbreedingRisk } from './alliances';
import { EPITHET, EPITHET_ECLATS, pickEpithet, type LifeFacts } from './epithets';
import { activeEvent, type EventWindow } from './events';
import { crown } from './names';
import { hashStr, Rng } from './rng';
import { lifeTick, runActivity, sumMods, type SimCtx } from './sim';
import { newLife, newLifeStats, zeroActs, zeroRes, type Ancestor, type Echo, type GameState, type Hero, type LifeState, type Succession, type Vocation } from './state';

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
  /** secondes simulées depuis la création (un Runtime neuf n'a pas encore de moyenne de production) */
  age: number;
  /** rattrapage du temps passé hors ligne en cours (`simulateOffline`) */
  offline?: boolean;
}

export function newRuntime(): Runtime {
  return { event: null, online: true, rate: zeroRes(), net: zeroRes(), echoRate: 0, tickGross: zeroRes(), notices: [], pauseLife: false, age: 0 };
}

/** Horizon (s) du débit mémorisé, et durée pendant laquelle un Runtime neuf s'y fie. */
export const RATE_MEMORY_SEC = 60;
export const RATE_WARMUP_SEC = 10;

const up = (s: GameState, id: string) => s.upgrades[id] ?? 0;
const bl = (s: GameState, id: string) => s.buildings[id] ?? 0;

// ---------------------------------------------------------------------------
// Multiplicateurs
export function prodMult(s: GameState, rt: Runtime, a: ActId): number {
  let m = bMult(bl(s, BUILDING_FOR_ACT[a]), 0.25);
  m *= Math.pow(1.12, up(s, 'prosperite'));
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
  return echoPowerMult(s, rt) * Math.max(0.2, 1 + e.strength) * (1 + (EPITHET[e.epithet ?? '']?.mods.pow ?? 0));
}

/**
 * Étoile filante : tant qu'elle vit, la Crypte s'embrase et tous les Échos rejouent plus fort. Ce bonus ne
 * dépend que du héros vivant ; comme celui d'un événement, il n'entre pas dans la valeur d'un Écho.
 */
export function cryptBoost(s: GameState): number {
  return s.life ? 1 + sumMods(s.hero.traits).crypt : 1;
}

/** Bonus de surnom d'un Écho pour une activité. */
export function echoActMult(e: Echo, a: ActId): number {
  return 1 + (EPITHET[e.epithet ?? '']?.mods.act?.[a] ?? 0);
}

export function chroniclesUnlocked(s: GameState): boolean {
  return up(s, 'chroniques') > 0;
}

/** Statistiques de la vie en cours (créées au besoin pour les anciennes sauvegardes). */
export function lifeStats(life: LifeState) {
  return (life.st ??= newLifeStats());
}

export function xpMult(s: GameState, rt: Runtime): number {
  const m = sumMods(s.hero.traits);
  let x = Math.max(0.2, 1 + m.xp) * (1 + 0.1 * bl(s, 'bibliotheque'));
  const ev = rt.online ? rt.event?.def : undefined;
  if (ev?.xp) x *= ev.xp;
  return x;
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

/**
 * Héritage d'une vie : racine cubique de sa valeur, multipliée par √(durée / durée normale de la lignée).
 * Une vie allongée par ses traits donnait un meilleur Écho mais moins d'Héritage et de générations
 * (Centenaire ×0,84) ; la durée normale exclut les bonus communs (Sève éternelle, Clepsydre), pour ne
 * pas gonfler l'Héritage de toutes les vies, ni Temps suspendu (R13). durRatio vaut 1 par défaut.
 */
export function legacyFor(value: number, durRatio = 1): number {
  return Math.floor(Math.cbrt(value / 20) * Math.sqrt(Math.max(0, durRatio)));
}

// ---------------------------------------------------------------------------
export function makeCtx(s: GameState, rt: Runtime): SimCtx {
  return {
    res: s.res,
    prodMult: (a) => prodMult(s, rt, a),
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
        if (ep) {
          const goal = rt.event.def.goal;
          // v2 : toute la production compte (en équivalent de la ressource visée), la ressource visée davantage.
          if (ep.v === 2) ep.progress += (amt * RES_INFO[r].value / RES_INFO[goal].value) * (r === goal ? EVENT_GOAL_WEIGHT : 1);
          else if (goal === r) ep.progress += amt;
        }
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
  if (a && s.life.lastAct && a !== s.life.lastAct && s.life.t > 0) lifeStats(s.life).sw++;
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

  // Échos
  let echoGross = 0;
  const crypt = cryptBoost(s);
  for (const e of s.echoes) {
    if (!e.acts.length) continue;
    const p = echoPower(s, rt, e) * crypt;
    let left = dt;
    while (left > 1e-9) {
      const idx = Math.min(e.acts.length - 1, Math.floor(e.pos));
      const step = Math.min(left, idx + 1 - e.pos);
      const a = e.acts[idx];
      if (a >= 0) {
        const g0 = sumValue(rt.tickGross);
        runActivity(ctx, ACTS[a], e.pow[idx] * p * echoActMult(e, ACTS[a]), step, false);
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
  // Débit de valeur moyen sur ~60 s, mémorisé dans la sauvegarde : un Runtime neuf (jeu relancé pendant
  // la fenêtre) ne doit pas faire tomber l'objectif d'un événement au plancher (QA-03).
  const vr = sumValue(rt.tickGross) / dt;
  s.stats.valueRate = (s.stats.valueRate ?? vr) + (vr - (s.stats.valueRate ?? vr)) * Math.min(1, dt / RATE_MEMORY_SEC);
  rt.age += dt;
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
  // rt.rate (moyenne sur ~3 s) repart de 0 à chaque lancement : tant que le Runtime est neuf, on se fie
  // au débit mémorisé. En session continue, le calcul reste celui d'origine.
  if (rt.age < RATE_WARMUP_SEC) valueRate = Math.max(valueRate, s.stats.valueRate ?? 0);
  // Objectif sur le débit moyen de ~60 s (plus stable que rt.rate, et moins sensible à une baisse volontaire
  // juste avant la fenêtre). Bronze ≈ EVENT_BASE_SEC secondes de production habituelle.
  valueRate = Math.max(valueRate, s.stats.valueRate ?? 0);
  const goal = w.def.goal;
  const target = Math.max(15 / RES_INFO[goal].value * 4, (valueRate * EVENT_BASE_SEC) / RES_INFO[goal].value);
  s.events[w.key] = { target: Math.ceil(target), progress: 0, tier: 0, v: 2 };
  // ménage
  const keys = Object.keys(s.events).sort();
  while (keys.length > 30) delete s.events[keys.shift()!];
}

/**
 * Événements (R9) : paliers progressifs au lieu du tout ou rien. Toute la production compte vers l'objectif,
 * la ressource visée EVENT_GOAL_WEIGHT fois ; Bronze ≈ EVENT_BASE_SEC s de production habituelle.
 */
export const EVENT_GOAL_WEIGHT = 3;
export const EVENT_BASE_SEC = 1200;
export const EVENT_TIERS = [1, 3, 8];
/** Éclats par palier (Bronze, Argent, Or). L'Or rapporte 5 ✦ depuis la 0.3 (3 avant) : c'est le palier qui
 *  demande de jouer l'activité dopée, et il payait mal face au Destin du jour. */
export const EVENT_REWARDS = [1, 2, 5];
/** Almanach (0.3) : le premier Or obtenu à chaque type d'événement en offre la page, et ces Éclats en plus. */
export const ALMANACH_ECLATS = 2;
const TIER_NAMES = ['Bronze', 'Argent', 'Or'];

function checkEventTiers(s: GameState, rt: Runtime, w: EventWindow) {
  const ep = s.events[w.key];
  while (ep.tier < 3 && ep.progress >= ep.target * EVENT_TIERS[ep.tier]) {
    s.eclats += EVENT_REWARDS[ep.tier];
    rt.notices.push({ kind: 'event', text: `${EVENT_DEF[w.def.id].icon} Palier ${TIER_NAMES[ep.tier]} atteint ! +${EVENT_REWARDS[ep.tier]} ✦` });
    ep.tier++;
    if (ep.tier === 3) {
      s.stats.eventsDone++;
      const alm = (s.almanach ??= []);
      if (!alm.includes(w.def.id)) {
        alm.push(w.def.id);
        s.eclats += ALMANACH_ECLATS;
        rt.notices.push({ kind: 'event', text: `📖 Nouvelle page de l'Almanach : ${EVENT_DEF[w.def.id].icon} ${EVENT_DEF[w.def.id].name} ! +${ALMANACH_ECLATS} ✦` });
        for (const id of checkFeats(s, s.lastTick)) rt.notices.push({ kind: 'event', text: `🏆 Haut fait : ${FEAT_DEF[id].icon} ${FEAT_DEF[id].name} ! +${FEAT_DEF[id].eclats} ✦` });
      }
    }
    if (s.life) lifeStats(s.life).ev = Math.max(lifeStats(s.life).ev, ep.tier);
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
  // Seuls les traits allongent la « durée relative » : ni les bonus communs, ni Temps suspendu (Bazar),
  // qui faisait gonfler l'Héritage de qui l'achète à chaque vie (+15,9 %, garde-fou rouge en C075).
  const normalDur = lifeDuration(s, { ...hero, traits: [] }) + (life.extended ? 30 : 0);
  const legacyGain = legacyFor(life.value, life.dur / normalDur);
  const m = sumMods(hero.traits);
  const facts = lifeFacts(s, life, voc);
  const ep = chroniclesUnlocked(s) ? pickEpithet(facts) : null;
  // Évolution (0.3) : les dons que cette vie a mérités peuvent passer à l'enfant sous leur forme supérieure.
  const ripe = ripeTraits(hero.traits, facts);
  const noEcho = hero.traits.some((t) => TRAIT[t]?.nova);
  const echo: Echo = {
    id: s.nextId++, heroId: hero.id, name: hero.name, sex: sexOf(hero), ord: hero.ord, gen: hero.gen, traits: [...hero.traits], vocation: voc ?? hero.vocation,
    acts: life.rec.slice(), pow: life.pow.slice(), strength: m.echo, pos: 0, loops: 0, pinned: false, value: life.baseValue ?? life.value,
    epithet: ep?.id,
  };
  const ancestor: Ancestor = {
    id: hero.id, name: hero.name, sex: sexOf(hero), ord: hero.ord, gen: hero.gen, traits: [...hero.traits], vocation: voc ?? hero.vocation,
    value: life.value, legacy: legacyGain, dominant: dom.act, diedAt: now, epithet: ep?.id,
    spouse: hero.spouse ? { name: hero.spouse.name, sex: hero.spouse.sex, epithet: hero.spouse.epithet, house: hero.spouse.house, origin: hero.spouse.origin } : undefined,
  };
  let epInfo: Succession['epithet'];
  if (ep) {
    const isNew = !s.epithets[ep.id];
    const eclats = isNew ? EPITHET_ECLATS[ep.rarity] : 0;
    s.epithets[ep.id] = (s.epithets[ep.id] ?? 0) + 1;
    s.eclats += eclats;
    epInfo = { id: ep.id, isNew, eclats };
  }
  // Vocation non entretenue : elle se transmet affaiblie d'un rang.
  const decayed = hero.vocation && hero.vocation.tier > 1 ? { act: hero.vocation.act, tier: hero.vocation.tier - 1 } : null;
  const heroForHeirs: Hero = { ...hero, vocation: voc ?? decayed };
  const rng = new Rng(s.seed);
  const heirs = genHeirs(s, heroForHeirs, rng, ripe);
  s.seed = rng.s;
  s.succession = { heirs, newEcho: echo, legacyGain, vocationEarned: voc, ancestor, epithet: epInfo };
  if (noEcho) s.succession.noEcho = true;
  const feats = checkFeats(s, now, facts);
  if (feats.length) s.succession.feats = feats;
  if (Object.keys(ripe).length) s.succession.ripe = ripe;
  s.life = null;
}

/** Ce que les Chroniques retiennent d'une vie qui s'achève. */
export function lifeFacts(s: GameState, life: LifeState, voc: Vocation | null): LifeFacts {
  const hero = s.hero;
  const st = lifeStats(life);
  const share = zeroActs();
  let used = 0;
  for (const a of ACTS) {
    share[a] = life.dur > 0 ? life.timeIn[a] / life.dur : 0;
    if (share[a] >= 0.1) used++;
  }
  const parent = s.ancestors[s.ancestors.length - 1];
  return {
    share, used, switches: st.sw,
    value: life.value, parentValue: parent?.value ?? 0, bestBefore: s.stats.bestLife, gen: hero.gen,
    traits: hero.traits, negTraits: hero.traits.filter((t) => TRAIT[t]?.neg).length,
    vocTier: voc?.tier ?? 0, prevVocTier: hero.vocation?.tier ?? 0, parentEpithet: parent?.epithet, wear: heroWear(s, hero), durRatio: life.dur / lifeDuration(s, { ...hero, traits: [] }), extended: life.extended, spouse: hero.spouse?.origin ?? null,
    eventTier: st.ev, builds: st.bd,
  };
}

export function genHeirs(s: GameState, parent: Hero, rng: Rng, ripe: Record<string, string> = {}): Hero[] {
  const pm = sumMods(parent.traits);
  const n = Math.min(6, 3 + up(s, 'sang') + pm.heirs);
  const inherit = 0.5 + 0.08 * up(s, 'transmission') + pm.inherit;
  const luck = up(s, 'etoile');
  const spouse = parent.spouse;
  const inbred = inbreedingRisk(s, spouse);
  const out: Hero[] = [];
  const used = new Set<string>();
  // Les prénoms ont leur propre aléa : allonger la liste ne change ni les traits ni la suite de la partie.
  const names = new Rng(hashStr(`prenoms:${s.createdAt}:${parent.id}`));
  // Maison Joestar : un enfant par génération porte le prénom du JoJo de sa génération.
  const jojo = isJoestar(s.lineage.name) ? JOJO_LINE[parent.gen % JOJO_LINE.length] : null;
  const jojoAt = jojo ? parent.id % n : -1;
  const pw = heroWear(s, parent);
  // Une union apporte du sang neuf : l'usure des dons du parent est divisée par deux. Harmonieux : ses dons
  // s'usent deux fois moins vite (0.5). « Purifier le sang » par la méditation a été écarté : la diversité des
  // traits du mono-Méditer tombait de 39 à 17 combinaisons (SIMPLIF-3, critère fixé avant mesure : −20 %).
  const step = Math.max(0, 1 - pm.wear);
  const carry = (t: string) => (spouse ? Math.floor((pw[t] ?? 0) / 2) : pw[t] ?? 0) + step;
  const nova = rng.chance(NOVA_CHANCE + NOVA_LUCK * luck) ? rng.int(n) : -1;
  for (let i = 0; i < n; i++) {
    const wear: Record<string, number> = {};
    const cand: string[] = [];
    const add = (t: string, w: number) => { if (!cand.includes(t)) cand.push(t); wear[t] = Math.min(wear[t] ?? w, w); };
    const evolved: string[] = [];
    for (const t of parent.traits) {
      const def = TRAIT[t];
      if (!def || def.nova) continue; // l'Étoile filante ne se transmet pas
      const p = def.neg ? 0.3 : Math.min(0.95, inherit) * wearMult(pw[t] ?? 0);
      if (!rng.chance(p)) continue;
      // Un don mûr se transcende parfois : la forme supérieure repart sans usure (sang neuf).
      const up2 = ripe[t];
      if (up2 && TRAIT[up2] && rng.chance(Math.min(0.95, EVO_CHANCE + EVO_LUCK * luck) * (TRAIT[up2].rarity >= 3 ? EVO_LEGENDARY : 1))) {
        add(up2, 0);
        evolved.push(up2);
      } else add(t, def.neg ? 0 : carry(t));
    }
    // Le conjoint transmet aussi ses traits, un peu moins souvent (jamais ceux du Bazar) : sang neuf, sans usure.
    if (spouse) {
      for (const t of spouse.traits) {
        const def = TRAIT[t];
        if (!def || def.shop || def.nova) continue;
        const p = (def.neg ? 0.3 : Math.min(0.95, inherit)) * 0.8;
        if (rng.chance(p)) add(t, 0);
      }
      // Consanguinité : trop d'unions avec la même maison fragilisent le sang.
      if (inbred > 0 && rng.chance(inbred)) {
        const pool = TRAITS.filter((t) => t.neg && t.rarity <= 1 && !cand.includes(t.id));
        if (pool.length) add(rng.pick(pool).id, 0);
      }
    }
    const muts = (rng.chance(0.85) ? 1 : 0) + (rng.chance(0.25 + 0.04 * luck) ? 1 : 0);
    for (let k = 0; k < muts; k++) {
      const rar = rng.weighted(mutationWeights(luck));
      const negChance = rar === 0 ? Math.max(0.05, 0.3 - 0.05 * luck) : rar === 1 ? 0.12 : 0;
      const wantNeg = rng.chance(negChance);
      const pool = TRAITS.filter((t) => !t.shop && !t.nova && !t.matured && t.rarity === rar && !!t.neg === wantNeg && !cand.includes(t.id));
      if (pool.length) add(rng.pick(pool).id, 0);
    }
    // Étoile filante : un tirage à part par succession (un seul enfant au plus), qui ne doit rien aux parents.
    if (i === nova) add('etoile_filante', 0);
    const traits = expressGenome(cand, rng);
    for (const b of s.blessings) if (!traits.includes(b)) { traits.push(b); wear[b] = 0; }
    const kept: Record<string, number> = {};
    for (const t of traits) if (!TRAIT[t]?.neg && wear[t]) kept[t] = wear[t];
    let vocation: Vocation | null = null;
    const vocP = Math.min(0.95, 0.6 + 0.08 * up(s, 'transmission'));
    if (parent.vocation && rng.chance(vocP)) {
      vocation = { ...parent.vocation };
      // Union de métier : deux parents du même métier le transmettent parfois d'un rang plus haut.
      if (spouse?.vocation?.act === vocation.act && rng.chance(0.35)) vocation.tier = Math.min(VOCATION_MAX, vocation.tier + 1);
    } else if (!parent.vocation && spouse?.vocation && rng.chance(0.4)) {
      vocation = { act: spouse.vocation.act, tier: Math.max(1, spouse.vocation.tier - 1) };
    }
    let name = names.pick(FIRST_NAMES);
    for (let k = 0; k < 5 && used.has(name); k++) name = names.pick(FIRST_NAMES);
    if (i === jojoAt) name = jojo!;
    used.add(name);
    const heir: Hero = { id: s.nextId++, name, sex: sexFor(name), gen: parent.gen + 1, traits, vocation, parentId: parent.id, wear: kept };
    const shown = evolved.filter((t) => traits.includes(t));
    if (shown.length) heir.evolved = shown;
    out.push(heir);
  }
  return out;
}

/**
 * Les dons qui s'expriment chez l'enfant : les positifs tiennent dans le budget génétique
 * (choisis par rareté, avec une part de hasard : chaque enfant est une combinaison différente),
 * les négatifs complètent jusqu'à 4 traits.
 */
export function expressGenome(cand: string[], rng: Rng): string[] {
  const pos = cand.filter((t) => TRAIT[t] && !TRAIT[t].neg);
  const neg = cand.filter((t) => TRAIT[t]?.neg);
  const prio = new Map(pos.map((t) => [t, traitWeight(t) + rng.next() * 2.5]));
  pos.sort((a, b) => prio.get(b)! - prio.get(a)!);
  const out: string[] = [];
  let used = 0;
  for (const t of pos) {
    const w = traitWeight(t);
    if (out.length < 4 && used + w <= GENOME_BUDGET) { out.push(t); used += w; }
  }
  for (const t of neg) if (out.length < 4) out.push(t);
  return out;
}

/**
 * Usure du sang d'un héros : depuis combien de générations chaque don se transmet.
 * Les héros d'avant cette règle la déduisent de la généalogie.
 */
export function heroWear(s: GameState, hero: Hero): Record<string, number> {
  if (hero.wear) return hero.wear;
  const w: Record<string, number> = {};
  for (const t of hero.traits) {
    if (TRAIT[t]?.neg) continue;
    let n = 0;
    for (let i = s.ancestors.length - 1; i >= 0 && s.ancestors[i].traits.includes(t); i--) n++;
    if (n) w[t] = n;
  }
  return w;
}

/** Valide la succession : héritier choisi + Échos conservés. */
export function confirmSuccession(s: GameState, heirIdx: number, keepEchoIds: number[]): boolean {
  const sc: Succession | null = s.succession;
  if (!sc) return false;
  const all = sc.noEcho ? [...s.echoes] : [...s.echoes, sc.newEcho];
  const keep = all.filter((e) => keepEchoIds.includes(e.id));
  if (keep.length > echoSlots(s)) return false;
  s.echoes = keep;
  s.legacy += sc.legacyGain;
  s.legacyTotal += sc.legacyGain;
  s.ancestors.push(sc.ancestor);
  if (s.ancestors.length > 300) s.ancestors.shift();
  s.stats.lives++;
  s.stats.bestLife = Math.max(s.stats.bestLife, sc.ancestor.value);
  const idx = Math.max(0, Math.min(sc.heirs.length - 1, heirIdx));
  s.hero = sc.heirs[idx];
  crown(s, s.hero);
  addCadets(s, sc.heirs.filter((_, i) => i !== idx));
  s.blessings = [];
  s.succession = null;
  checkFeats(s, s.lastTick);
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
  if (!buildingOpen(s, id)) return false;
  const cost = buildingCost(id, lvl);
  if (!canAfford(s, cost)) return false;
  for (const r in cost) s.res[r as ResId] -= cost[r as ResId]!;
  s.buildings[id] = lvl + 1;
  if (s.life) lifeStats(s.life).bd++;
  if (id === 'clepsydre' && s.life) s.life.dur += 4;
  return true;
}

/** Le bâtiment peut-il être bâti à cette génération (`minGen`) ? */
export function buildingOpen(s: GameState, id: string): boolean {
  const d = BUILDING[id];
  return !!d && (!d.minGen || s.hero.gen >= d.minGen || bl(s, id) > 0);
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
};

export const BLESSING_COST = [0, 3, 6, 12, 15];
/** Chaque Bénédiction légendaire ou mythique achetée renchérit les suivantes de 50 % (×3 au plus) : avec plus
 *  d'Éclats en circulation (0.3), le Bazar ne doit pas devenir le robinet à légendaires que les mutations ne sont plus. */
export const BLESSING_HIGH_STEP = 0.5;
export const BLESSING_HIGH_MAX = 4;

/** Le Bazar ne vend ni l'Étoile filante, ni les formes mûries des dons (elles se méritent). */
export function blessable(traitId: string): boolean {
  const t = TRAIT[traitId];
  return !!t && !t.neg && !t.nova && !t.matured && t.rarity >= 1 && !!BLESSING_COST[t.rarity];
}

export function blessingCost(s: GameState, traitId: string): number {
  const t = TRAIT[traitId];
  if (!t) return 0;
  const base = BLESSING_COST[t.rarity];
  return t.rarity >= 3 ? Math.ceil(base * (1 + BLESSING_HIGH_STEP * Math.min(BLESSING_HIGH_MAX, s.stats.blessHigh ?? 0))) : base;
}

export function buyBlessing(s: GameState, traitId: string): boolean {
  const t = TRAIT[traitId];
  if (!t || !blessable(traitId) || s.blessings.includes(traitId) || s.blessings.length >= 2) return false;
  const c = blessingCost(s, traitId);
  if (!c || s.eclats < c) return false;
  s.eclats -= c;
  if (t.rarity >= 3) s.stats.blessHigh = (s.stats.blessHigh ?? 0) + 1;
  s.blessings.push(traitId);
  // Succession en attente : les héritiers sont déjà tirés. La Bénédiction s'applique à eux tous,
  // hors budget et sans usure, comme si elle avait été achetée avant la mort (QA-01).
  if (s.succession) {
    for (const h of s.succession.heirs) if (!h.traits.includes(traitId)) h.traits.push(traitId);
  }
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

/** Écart minimal (s) rattrapé par simulation : la relance du jeu et le retour d'un onglet en arrière-plan. */
export const OFFLINE_MIN_SEC = 30;

/**
 * Simule l'absence par pas d'une seconde, sans événements. minSec abaisse le seuil pour rattraper
 * aussi les courts trous du moteur (onglet masqué, fil gelé) : voir main.ts.
 */
export function simulateOffline(s: GameState, rt: Runtime, elapsedSec: number, now: number, minSec = OFFLINE_MIN_SEC): OfflineReport | null {
  const sec = Math.min(elapsedSec, offlineCapSec(s));
  if (sec < minSec) return null;
  const before = { ...s.res };
  const loops0 = s.echoes.reduce((a, e) => a + e.loops, 0);
  const hadLife = !!s.life;
  rt.online = false;
  rt.offline = true;
  const start = now - sec * 1000;
  const steps = Math.floor(sec);
  for (let i = 0; i < steps; i++) tick(s, rt, 1, start + i * 1000);
  rt.online = true;
  rt.offline = false;
  const gains = zeroRes();
  for (const r of RES) gains[r] = s.res[r] - before[r];
  return { seconds: sec, gains, died: hadLife && !s.life, loops: s.echoes.reduce((a, e) => a + e.loops, 0) - loops0 };
}


/** Production moyenne d'un Écho par seconde de boucle (valeur de sa vie / durée) : la vraie mesure de sa force. */
export function echoValueRate(e: Pick<Echo, 'value' | 'acts'>): number {
  return e.acts.length ? e.value / e.acts.length : 0;
}

/**
 * Production attendue d'un Écho en pts/s, hors bonus d'événement : valeur de sa vie par seconde × sa puissance
 * de rejeu (Mémoire du sang, Sanctuaire, ses traits d'Écho, son surnom). C'est elle qui guide la présélection et
 * s'affiche sur les cartes : la valeur seule ignorait la force propre et le surnom de l'Écho (GD-02, PBA-14) et
 * affichait la puissance du héros vivant au lieu de celle de l'Écho (GD-09).
 */
export function echoExpectedRate(s: GameState, rt: Runtime, e: Echo): number {
  return echoValueRate(e) * echoPower(s, { ...rt, online: false }, e);
}
