// Outils partagés des tests QA : joueur aléatoire à graine fixe et vérification d'invariants.
import { ACTS, BUILDINGS, LEGACY, RES, TRAIT, TRAITS, legacyCost, type ActId } from '../../src/engine/data';
import { countyHouses, marry, suitorFor, canMarry } from '../../src/engine/alliances';
import {
  buildingCost, buyBlessing, buyBuilding, buyLegacy, buyTemps, canAfford, confirmSuccession, echoSlots, newRuntime, setActivity, startLife, tick,
  type Runtime,
} from '../../src/engine/game';
import { Rng } from '../../src/engine/rng';
import { newGame, type GameState } from '../../src/engine/state';

export const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));

/** Lundi 16/11/2026 2 h UTC : hors fenêtre d'événement. */
export const T0 = Date.UTC(2026, 10, 16, 2, 0, 0);

export interface PlayOpts {
  seed: number;
  seconds: number;
  dt?: number;
  /** événements actifs (horloge UTC simulée) */
  online?: boolean;
  /** début de la partie (ms) */
  start?: number;
  /** appelé après chaque tick ; retourne une liste d'anomalies */
  check?: (s: GameState, rt: Runtime, t: number) => void;
  /** état de départ (sinon newGame(0, seed)) */
  state?: GameState;
  rt?: Runtime;
  /** probabilité par seconde de changer d'activité */
  switchRate?: number;
  /** probabilité par seconde de mettre en pause */
  pauseRate?: number;
}

/**
 * Joueur aléatoire mais raisonnable : change d'activité au hasard, met parfois en pause,
 * achète ce qu'il peut, choisit un héritier et des Échos au hasard, se marie avec une maison du comté.
 */
export function playRandom(o: PlayOpts) {
  const dt = o.dt ?? 0.5;
  const s = o.state ?? newGame(0, o.seed);
  const rt = o.rt ?? newRuntime();
  rt.online = !!o.online;
  const rng = new Rng(o.seed * 7919 + 13);
  if (!s.life && !s.succession) startLife(s);
  let now = o.start ?? T0;
  const steps = Math.round(o.seconds / dt);
  const switchP = (o.switchRate ?? 0.08) * dt;
  const pauseP = (o.pauseRate ?? 0.01) * dt;
  for (let i = 0; i < steps; i++) {
    now += dt * 1000;
    if (s.life) {
      if (rng.chance(pauseP)) setActivity(s, null);
      else if (!s.life.act || rng.chance(switchP)) setActivity(s, rng.pick(s.unlocked) as ActId);
      if (s.eclats >= 2 && rng.chance(0.002)) buyTemps(s);
      if (canMarry(s) && rng.chance(0.01)) {
        const ch = rng.pick(countyHouses(now));
        marry(s, suitorFor(s, ch, now));
      }
    }
    tick(s, rt, dt, now);
    if (s.succession && rng.chance(Math.min(1, 0.2 * dt))) {
      const sc = s.succession;
      const all = [...s.echoes, sc.newEcho];
      const ids = all.map((e) => e.id).filter(() => rng.chance(0.7)).slice(0, echoSlots(s));
      confirmSuccession(s, rng.int(sc.heirs.length), ids);
    }
    if (i % Math.max(1, Math.round(5 / dt)) === 0) {
      for (const l of LEGACY) if (legacyCost(l, s.upgrades[l.id] ?? 0) <= s.legacy) buyLegacy(s, l.id);
      for (const b of BUILDINGS) if (canAfford(s, buildingCost(b.id, s.buildings[b.id] ?? 0))) buyBuilding(s, b.id);
      if (s.eclats >= 3 && rng.chance(0.3)) {
        const t = rng.pick(TRAITS.filter((x) => !x.neg && x.rarity >= 1));
        buyBlessing(s, t.id);
      }
    }
    o.check?.(s, rt, i * dt);
  }
  return { s, rt, now };
}

/** Invariants qui doivent tenir à tout instant. Retourne la liste des violations. */
export function invariants(s: GameState): string[] {
  const bad: string[] = [];
  const fin = (x: number) => Number.isFinite(x);
  for (const r of RES) {
    if (!fin(s.res[r]) || s.res[r] < 0) bad.push(`res.${r}=${s.res[r]}`);
    if (!fin(s.totalEver[r]) || s.totalEver[r] < 0) bad.push(`totalEver.${r}=${s.totalEver[r]}`);
  }
  const { F, G } = s.eco;
  if (!(F >= 0.5 && F <= 140)) bad.push(`eco.F=${F}`);
  if (!(G >= 0.2 && G <= 140)) bad.push(`eco.G=${G}`);
  if (!fin(s.hunt.affut) || s.hunt.affut < 0) bad.push(`hunt.affut=${s.hunt.affut}`);
  if (!(s.legacy >= 0 && s.legacy <= s.legacyTotal)) bad.push(`legacy=${s.legacy}/${s.legacyTotal}`);
  if (s.eclats < 0 || !fin(s.eclats)) bad.push(`eclats=${s.eclats}`);
  if (s.echoes.length > echoSlots(s)) bad.push(`echoes ${s.echoes.length}>${echoSlots(s)}`);
  if (s.ancestors.length > 300) bad.push(`ancestors=${s.ancestors.length}`);
  if (s.cadets.length > 8) bad.push(`cadets=${s.cadets.length}`);
  if ((s.buildings.clepsydre ?? 0) > 15) bad.push('clepsydre>15');
  if ((s.upgrades.crypte ?? 0) > 6) bad.push('crypte>6');
  if (!!s.life === !!s.succession) bad.push(`life=${!!s.life} succession=${!!s.succession}`);
  if (s.hero.vocation && (s.hero.vocation.tier < 1 || s.hero.vocation.tier > 10)) bad.push(`vocation=${s.hero.vocation.tier}`);
  for (const t of s.hero.traits) if (!TRAIT[t]) bad.push(`trait inconnu ${t}`);
  if (s.life) {
    const L = s.life;
    if (!(L.t >= 0 && L.t <= L.dur + 1e-6)) bad.push(`life.t=${L.t}/${L.dur}`);
    if (L.rec.length !== Math.floor(L.t + 1e-6)) bad.push(`rec ${L.rec.length} vs t ${L.t}`);
    if (L.rec.length !== L.pow.length) bad.push('rec/pow');
    const sum = ACTS.reduce((a, x) => a + L.timeIn[x], 0);
    if (Math.abs(sum - L.t) > 1e-6) bad.push(`timeIn ${sum} vs t ${L.t}`);
  }
  for (const e of s.echoes) {
    if (!(e.pos >= 0 && e.pos < e.acts.length + 1e-9)) bad.push(`echo ${e.id} pos=${e.pos}`);
    if (e.acts.some((a) => a < -1 || a > 4)) bad.push(`echo ${e.id} act invalide`);
    if (e.pow.some((p) => !fin(p) || p < 0)) bad.push(`echo ${e.id} pow invalide`);
  }
  return bad;
}
