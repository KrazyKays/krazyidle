// Profils de joueurs simulés. Chaque profil décide : activité, succession, achats, sessions.
// Ils n'utilisent QUE l'API publique du moteur (aucune modification du jeu).
import { ACT, ACTS, BUILDINGS, LEGACY, RES_INFO, TRAIT, legacyCost, type ActId, type ResId } from '../../src/engine/data';
import {
  buildingCost, buyBlessing, buyBuilding, buyLegacy, buyTemps, canAfford, confirmSuccession, echoSlots, echoValueRate, prodMult,
  type Runtime,
} from '../../src/engine/game';
import { canMarry, countyHouses, dowry, marry, suitorFor } from '../../src/engine/alliances';
import { consumeScaleFor, lifePower, sumMods } from '../../src/engine/sim';
import type { GameState, Hero } from '../../src/engine/state';
import type { Rng } from '../../src/engine/rng';

export interface Ctx {
  /** secondes de jeu écoulées depuis le début de la partie */
  t: number;
  now: number;
  rt: Runtime;
  /** RNG propre au profil (indépendant de celui du jeu) */
  rng: Rng;
  /** mémoire libre du profil */
  mem: Record<string, any>;
}

export interface Profile {
  id: string;
  desc: string;
  /** intervalle entre deux décisions d'activité (s) : temps de réaction du joueur */
  decideEvery: number;
  /** intervalle entre deux sessions d'achats (s) */
  buyEvery: number;
  /** délai avant de valider une succession (s) */
  successionDelay: number;
  /** sessions : [minutes en ligne, heures hors ligne] ; absent = joue en continu */
  sessions?: [number, number];
  activity(s: GameState, c: Ctx): ActId | null;
  succession(s: GameState, c: Ctx): void;
  buy(s: GameState, c: Ctx): void;
}

// ---------------------------------------------------------------------------
// Briques réutilisables
const has = (s: GameState, a: ActId) => s.unlocked.includes(a);

/** Remplace une activité impossible faute d'intrants par la plus proche réalisable. */
export function feasible(s: GameState, a: ActId): ActId {
  if (a === 'commercer' && s.res.vivres < 5) return 'cultiver';
  if (a === 'etudier' && s.res.or < 5) return s.res.vivres > 10 && has(s, 'commercer') ? 'commercer' : 'cultiver';
  return a;
}

/** Logique du bot historique (tests/bot.ts) — référence « joueur expérimenté ». */
function legacyBotMain(s: GameState): ActId {
  const g = s.hero.gen;
  if (s.hero.vocation && g % 3 !== 0) return s.hero.vocation.act;
  const order: ActId[] = ['cultiver', 'commercer', 'etudier', 'mediter'];
  const avail = order.filter((a) => has(s, a));
  // Rang tournant g % n. Seul cas corrigé (0.4) : avec trois activités débloquées, g % 3 vaut toujours 0 sur
  // les générations qui changent de métier (g multiple de 3), et le bot restait aux champs pour toujours.
  const n = avail.length;
  return avail[n % 3 === 0 && g % 3 === 0 ? Math.floor(g / 3) % n : g % n] ?? ACTS[0];
}

function legacyBotActivity(s: GameState): ActId {
  const life = s.life!;
  const main = legacyBotMain(s);
  let a = feasible(s, main);
  if (life.t / life.dur > 0.7) a = has(s, 'commercer') && s.res.vivres > 20 ? 'commercer' : 'cultiver';
  return a;
}

function heirScoreBot(h: Hero) {
  const m = sumMods(h.traits);
  return m.all + m.xp * 0.5 + (h.vocation ? h.vocation.tier * 0.2 : 0);
}

function successionBest(s: GameState, score: (h: Hero) => number, echoKey: 'value' | 'rate') {
  const sc = s.succession!;
  let best = 0;
  sc.heirs.forEach((h, i) => { if (score(h) > score(sc.heirs[best])) best = i; });
  const all = [...s.echoes, sc.newEcho];
  const key = echoKey === 'rate' ? echoValueRate : (e: { value: number }) => e.value;
  all.sort((a, b) => key(b) - key(a));
  confirmSuccession(s, best, all.slice(0, echoSlots(s)).map((e) => e.id));
}

function buyAllGreedy(s: GameState) {
  let bought = true;
  while (bought) {
    bought = false;
    for (const l of LEGACY) if (legacyCost(l, s.upgrades[l.id] ?? 0) <= s.legacy && buyLegacy(s, l.id)) bought = true;
    for (const b of BUILDINGS) if (canAfford(s, buildingCost(b.id, s.buildings[b.id] ?? 0)) && buyBuilding(s, b.id)) bought = true;
  }
}

/**
 * Valeur nette instantanée (pts/s) d'une activité pour le héros vivant. Lit les rendements dans ACT
 * (et non des constantes), pour suivre les surcharges de paramètres des expériences d'équilibrage.
 */
export function actNetValue(s: GameState, rt: Runtime, a: ActId): number {
  if (!s.life || !has(s, a)) return -Infinity;
  const p = lifePower(s.life, s.hero, a);
  const base = prodMult(s, rt, a) * p;
  const def = ACT[a];
  let prod = 0, cons = 0;
  for (const r in def.produce) prod += def.produce[r as ResId]! * RES_INFO[r as ResId].value;
  for (const r in def.consume) cons += def.consume[r as ResId]! * RES_INFO[r as ResId].value;
  return base * prod - cons * consumeScaleFor(p);
}

// ---------------------------------------------------------------------------
export const PROFILES: Record<string, Profile> = {
  experimente: {
    id: 'experimente',
    desc: 'Réplique du bot historique (tests/bot.ts) : vocation 2 générations sur 3, commerce en fin de vie, achats gourmands, Échos gardés par valeur totale.',
    decideEvery: 0.5, buyEvery: 5, successionDelay: 0,
    activity: (s) => legacyBotActivity(s),
    succession: (s) => successionBest(s, heirScoreBot, 'value'),
    buy: (s) => buyAllGreedy(s),
  },

  debutant: {
    id: 'debutant',
    desc: 'Découvre le jeu : reste sur sa vocation ou Cultiver, change rarement, réagit lentement, prend le 1er héritier, garde les Échos les plus récents, achète le bâtiment le moins cher de temps en temps.',
    decideEvery: 20, buyEvery: 45, successionDelay: 30,
    activity: (s, c) => {
      const v = s.hero.vocation?.act;
      if (c.rng.chance(0.15)) {
        const avail = ACTS.filter((a) => has(s, a));
        return feasible(s, c.rng.pick(avail));
      }
      return feasible(s, v && has(s, v) ? v : 'cultiver');
    },
    succession: (s) => {
      const sc = s.succession!;
      const all = [...s.echoes, sc.newEcho].sort((a, b) => b.id - a.id);
      confirmSuccession(s, 0, all.slice(0, echoSlots(s)).map((e) => e.id));
    },
    buy: (s) => {
      let cheapest: string | null = null, cv = Infinity;
      for (const b of BUILDINGS) {
        const cost = buildingCost(b.id, s.buildings[b.id] ?? 0);
        if (!canAfford(s, cost)) continue;
        const v = Object.entries(cost).reduce((a, [r, x]) => a + x! * RES_INFO[r as keyof typeof RES_INFO].value, 0);
        if (v < cv) { cv = v; cheapest = b.id; }
      }
      if (cheapest) buyBuilding(s, cheapest);
      for (const l of LEGACY) if (buyLegacy(s, l.id)) break;
    },
  },

  occasionnel: {
    id: 'occasionnel',
    desc: 'Décisions du joueur expérimenté, mais par sessions : 20 min en ligne puis 4 h hors ligne (progression hors ligne du moteur).',
    decideEvery: 2, buyEvery: 10, successionDelay: 5,
    sessions: [20, 4],
    activity: (s) => legacyBotActivity(s),
    succession: (s) => successionBest(s, heirScoreBot, 'value'),
    buy: (s) => buyAllGreedy(s),
  },

  optimiseur: {
    id: 'optimiseur',
    desc: 'Glouton informé : activité de meilleure valeur nette instantanée (sous contrainte de vocation), Échos par pts/s, Temps suspendu, Bénédictions, mariages PNJ, achats gourmands.',
    decideEvery: 1, buyEvery: 5, successionDelay: 0,
    activity: (s, c) => {
      const life = s.life!;
      const v = s.hero.vocation?.act;
      // Garde la vocation si elle n'est pas encore sécurisée (50 % de la vie).
      if (v && has(s, v) && life.timeIn[v] < life.dur * 0.5 && life.timeIn[v] + (life.dur - life.t) <= life.dur * 0.5 + 2) return feasible(s, v);
      let best: ActId = 'cultiver', bv = -Infinity;
      for (const a of ACTS) {
        const x = actNetValue(s, c.rt, a);
        if (x > bv && feasible(s, a) === a) { bv = x; best = a; }
      }
      return best;
    },
    succession: (s) => successionBest(s, (h) => {
      const m = sumMods(h.traits);
      return m.all * 1.5 + m.xp * 0.6 + m.life / 60 + m.echo * 0.5 + m.start * 0.3 + (h.vocation ? h.vocation.tier * 0.25 : 0);
    }, 'rate'),
    buy: (s, c) => {
      buyAllGreedy(s);
      if (s.life && !s.life.extended && s.life.t < 5) buyTemps(s);
      if (s.eclats >= 15 && s.blessings.length < 2) {
        for (const id of ['elu', 'eternel', 'sang_dore', 'memoire']) if (TRAIT[id] && buyBlessing(s, id)) break;
      }
      if (canMarry(s) && s.res.or > 4 * dowry(s, 'pnj')) {
        const houses = countyHouses(c.now);
        const ch = houses[0];
        marry(s, suitorFor(s, ch, c.now));
      }
    },
  },
};

// Joueur qui vise les événements : décisions du joueur expérimenté, mais pendant une fenêtre il pratique
// l'activité dopée par l'événement (s'il l'a débloquée et peut l'alimenter).
PROFILES.evenementiel = {
  ...PROFILES.experimente,
  id: 'evenementiel',
  desc: 'Joueur expérimenté qui, pendant un événement, pratique l\'activité qu\'il dope (sinon comme experimente).',
  activity: (s, c) => {
    const ev = c.rt.event?.def;
    const boosted = ev?.act ? (Object.keys(ev.act) as ActId[]).find((a) => has(s, a)) : undefined;
    return boosted ? feasible(s, boosted) : legacyBotActivity(s);
  },
};

// Profils mono-activité : toujours la même activité (avec repli si intrants manquants).
for (const a of ACTS) {
  PROFILES['mono-' + a] = {
    id: 'mono-' + a,
    desc: `Pratique uniquement « ${a} » après les 30 premières minutes (repli sur Cultiver/Commercer si intrants manquants).`,
    decideEvery: 1, buyEvery: 5, successionDelay: 0,
    activity: (s, c) => (c.t < 1800 ? legacyBotActivity(s) : has(s, a) ? feasible(s, a) : 'cultiver'),
    succession: (s) => successionBest(s, heirScoreBot, 'rate'),
    buy: (s) => buyAllGreedy(s),
  };
}
