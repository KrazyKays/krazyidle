// Profils supplémentaires du Player Behavior Analyst (phase 1, audit 2026-11-14).
// N'altère NI le jeu NI lab/sim : ajoute des entrées à PROFILES et instrumente les successions.
// Toutes les hypothèses (temps de réaction, fréquence, règles de décision) sont dans `desc`.
import { ACT, ACTS, BUILDINGS, LEGACY, RES_INFO, TRAIT, legacyCost, type ActId, type ResId } from '../../src/engine/data';
import {
  buildingCost, buyBlessing, buyBuilding, buyLegacy, buyTemps, canAfford, confirmSuccession, echoSlots, echoValueRate, prodMult,
  type Runtime,
} from '../../src/engine/game';
import { acceptProposal, canMarry, countyHouses, dowry, encodeProposal, marry, suitorFor } from '../../src/engine/alliances';
import { activeEvent } from '../../src/engine/events';
import { ecoFactor, ecoHealth } from '../../src/engine/ecosystem';
import { EPITHET } from '../../src/engine/epithets';
import { lifePower, sumMods } from '../../src/engine/sim';
import { zeroRes, type GameState, type Hero } from '../../src/engine/state';
import { PROFILES, feasible, type Ctx, type Profile } from '../sim/profiles';

const has = (s: GameState, a: ActId) => s.unlocked.includes(a);
/** Valeur nette instantanée lue dans ACT : identique à actNetValue (lab/sim) sans surcharge, mais suit BAL_OBJ (phase 2). */
function actNetValue(s: GameState, rt: Runtime, a: ActId): number {
  if (!s.life || !has(s, a)) return -Infinity;
  const p = lifePower(s.life, s.hero, a);
  const base = prodMult(s, rt, a) * p * ecoFactor(a, s.eco);
  let v = 0;
  for (const r in ACT[a].produce) v += ACT[a].produce[r as ResId]! * RES_INFO[r as ResId].value * base;
  for (const r in ACT[a].consume) v -= ACT[a].consume[r as ResId]! * RES_INFO[r as ResId].value * Math.sqrt(Math.max(p, 0.01));
  return v;
}
/** Force réelle d'un Écho (GD-02) : pts/s × max(0,2 ; 1 + force) × (1 + surnom). */
const echoTrueRate = (e: { value: number; acts: number[]; strength: number; epithet?: string }) =>
  echoValueRate(e) * Math.max(0.2, 1 + e.strength) * (1 + (EPITHET[e.epithet ?? '']?.mods.pow ?? 0));

// ---------------------------------------------------------------------------
// Briques (copies locales des helpers non exportés de lab/sim/profiles.ts)
function legacyBotMain(s: GameState): ActId {
  const g = s.hero.gen;
  if (s.hero.vocation && g % 3 !== 0) return s.hero.vocation.act;
  const order: ActId[] = ['cultiver', 'commercer', 'etudier', 'mediter', 'chasser'];
  const avail = order.filter((a) => has(s, a));
  return avail[g % avail.length] ?? ACTS[0];
}
function legacyBotActivity(s: GameState): ActId {
  const life = s.life!;
  let a = feasible(s, legacyBotMain(s));
  if (life.t / life.dur > 0.7) a = has(s, 'commercer') && s.res.vivres > 20 ? 'commercer' : 'cultiver';
  return a;
}
const heirScoreBot = (h: Hero) => { const m = sumMods(h.traits); return m.all + m.xp * 0.5 + (h.vocation ? h.vocation.tier * 0.2 : 0); };
const heirScoreOpti = (h: Hero) => {
  const m = sumMods(h.traits);
  return m.all * 1.5 + m.xp * 0.6 + m.life / 60 + m.echo * 0.5 + m.start * 0.3 + (h.vocation ? h.vocation.tier * 0.25 : 0);
};
function successionBest(s: GameState, score: (h: Hero) => number, key: 'value' | 'rate' | 'recent' | 'true') {
  const sc = s.succession!;
  let best = 0;
  sc.heirs.forEach((h, i) => { if (score(h) > score(sc.heirs[best])) best = i; });
  const all = [...s.echoes, sc.newEcho];
  if (key === 'recent') all.sort((a, b) => b.id - a.id);
  else if (key === 'true') all.sort((a, b) => echoTrueRate(b) - echoTrueRate(a));
  else all.sort((a, b) => (key === 'rate' ? echoValueRate(b) - echoValueRate(a) : b.value - a.value));
  confirmSuccession(s, best, all.slice(0, echoSlots(s)).map((e) => e.id));
}
function buyAllGreedy(s: GameState, skipLegacy: string[] = []) {
  let bought = true;
  while (bought) {
    bought = false;
    for (const l of LEGACY) if (!skipLegacy.includes(l.id) && legacyCost(l, s.upgrades[l.id] ?? 0) <= s.legacy && buyLegacy(s, l.id)) bought = true;
    for (const b of BUILDINGS) if (canAfford(s, buildingCost(b.id, s.buildings[b.id] ?? 0)) && buyBuilding(s, b.id)) bought = true;
  }
}
/** Achats gourmands, mais épargne pour Alliances puis Chroniques dès qu'elles sont à portée (≥ 50 % du prix). */
function buySaving(s: GameState) {
  for (const id of ['alliances', 'chroniques']) {
    if ((s.upgrades[id] ?? 0) > 0) continue;
    if (s.legacy >= 90 * (id === 'chroniques' ? 160 / 90 : 1)) buyLegacy(s, id);
    if ((s.upgrades[id] ?? 0) === 0 && s.legacyTotal >= (id === 'alliances' ? 45 : 80)) { buyAllGreedy(s, LEGACY.map((l) => l.id)); return; }
  }
  buyAllGreedy(s);
}
function optiActivity(s: GameState, c: Ctx): ActId {
  const life = s.life!;
  const v = s.hero.vocation?.act;
  if (v && has(s, v) && life.timeIn[v] < life.dur * 0.5 && life.timeIn[v] + (life.dur - life.t) <= life.dur * 0.5 + 2) return feasible(s, v);
  let best: ActId = 'cultiver', bv = -Infinity;
  for (const a of ACTS) {
    const x = actNetValue(s, c.rt, a);
    if (x > bv && feasible(s, a) === a) { bv = x; best = a; }
  }
  return best;
}
function marryPnj(s: GameState, c: Ctx, factor = 4) {
  if (canMarry(s) && s.res.or > factor * dowry(s, 'pnj')) marry(s, suitorFor(s, countyHouses(c.now)[0], c.now));
}
function bazaar(s: GameState) {
  if (s.life && !s.life.extended && s.life.t < 5) buyTemps(s);
  if (s.eclats >= 15 && s.blessings.length < 2) for (const id of ['elu', 'eternel', 'sang_dore', 'memoire']) if (TRAIT[id] && buyBlessing(s, id)) break;
}

// ---------------------------------------------------------------------------
// Instrumentation des frustrations (collectée par partie, lue par le worker)
export interface Frustr {
  successions: number;
  /** le parent transmettait une vocation, aucun héritier ne l'a reçue */
  vocLost: number;
  /** tous les héritiers portent au moins un trait négatif */
  heirsAllBad: number;
  /** aucun héritier n'a de trait positif */
  heirsNoGood: number;
  /** vies terminées avec Harmonie min ≤ 0,3 (Domaine à l'agonie) */
  collapse: number;
  /** attente totale (s) avec succession en suspens */
  pendingSec: number;
  /** surnoms obtenus par id */
  epithets: Record<string, number>;
  /** paliers d'événements atteints [0,1,2,3] (comptés à la fin de chaque fenêtre) */
  eventTiers: number[];
  /** Éclats gagnés */
  eclatsGained: number;
  /** objectifs d'événements fixés (cible / taux de valeur courant, en s) */
  eventTargetSec: number[];
  extra: Record<string, number>;
  evMap: Record<string, { tier: number; target: number }>;
}
export let F: Frustr = newF();
export function newF(): Frustr {
  return { successions: 0, vocLost: 0, heirsAllBad: 0, heirsNoGood: 0, collapse: 0, pendingSec: 0, epithets: {}, eventTiers: [0, 0, 0, 0], eclatsGained: 0, eventTargetSec: [], extra: {}, evMap: {} };
}
export function resetF() { F = newF(); }

function observeSuccession(s: GameState) {
  const sc = s.succession!;
  F.successions++;
  const parentVoc = sc.vocationEarned ?? (sc.ancestor.vocation ?? null);
  if (parentVoc && sc.heirs.every((h) => !h.vocation)) F.vocLost++;
  if (sc.heirs.every((h) => h.traits.some((t) => TRAIT[t]?.neg))) F.heirsAllBad++;
  if (sc.heirs.every((h) => !h.traits.some((t) => TRAIT[t] && !TRAIT[t].neg))) F.heirsNoGood++;
  if (sc.epithet) F.epithets[sc.epithet.id] = (F.epithets[sc.epithet.id] ?? 0) + 1;
}

/** Enveloppe : instrumente la succession et le suivi des événements, sans changer la décision. */
function instrument(p: Profile): Profile {
  let lastEcl = -1;
  let seen = -1;
  return {
    ...p,
    activity: (s, c) => { F.extra.hmin = Math.min(F.extra.hmin ?? 1, ecoHealth(s.eco)); return p.activity(s, c); },
    succession: (s, c) => {
      if (s.succession!.newEcho.id !== seen) {
        seen = s.succession!.newEcho.id; observeSuccession(s); F.extra.pendStart = c.t;
        if ((F.extra.hmin ?? 1) <= 0.3) F.collapse++;
        F.extra.hmin = 1;
      }
      p.succession(s, c);
      if (!s.succession) F.pendingSec += c.t - (F.extra.pendStart ?? c.t);
    },
    buy: (s, c) => {
      // suivi des Éclats et des événements (appelé toutes les buyEvery secondes)
      if (lastEcl >= 0 && s.eclats > lastEcl) F.eclatsGained += s.eclats - lastEcl;
      for (const k in s.events) {
        const e = s.events[k];
        const m = (F.evMap[k] ??= { tier: 0, target: e.target });
        m.tier = Math.max(m.tier, e.tier);
      }
      p.buy(s, c);
      lastEcl = s.eclats;
    },
  };
}

// ---------------------------------------------------------------------------
const P: Record<string, Profile> = {};

P['debutant-realiste'] = {
  id: 'debutant-realiste',
  desc: 'Débutant réaliste : décide toutes les 30 s ; 25 % de choix au hasard (dont 5 % d\'activité sans intrants) ; reste sinon sur la vocation/Cultiver ; succession validée après 60 s, et 1 fois sur 5 « oubliée » 10 min ; 1er héritier ; garde les Échos récents ; un achat (bâtiment le moins cher, puis 1re amélioration abordable) toutes les 60 s ; met parfois la vie en pause par erreur (3 % des décisions, 2 min).',
  decideEvery: 30, buyEvery: 60, successionDelay: 60,
  activity: (s, c) => {
    if (c.mem.pauseUntil && c.t < c.mem.pauseUntil) return null;
    if (c.rng.chance(0.03)) { c.mem.pauseUntil = c.t + 120; return null; }
    const avail = ACTS.filter((a) => has(s, a));
    if (c.rng.chance(0.05)) return c.rng.pick(avail); // erreur : pas de repli
    if (c.rng.chance(0.2)) return feasible(s, c.rng.pick(avail));
    const v = s.hero.vocation?.act;
    return feasible(s, v && has(s, v) ? v : 'cultiver');
  },
  succession: (s, c) => {
    if (c.mem.forgot === undefined) c.mem.forgot = c.rng.chance(0.2) ? c.t + 540 : 0;
    if (c.mem.forgot && c.t < c.mem.forgot) { return; }
    c.mem.forgot = undefined;
    successionBest(s, () => 0, 'recent');
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
};

// Occasionnels : décisions du joueur expérimenté, mais présence rare.
const occ = (id: string, sessions: [number, number], desc: string): Profile => ({
  id, desc, decideEvery: 2, buyEvery: 10, successionDelay: 5, sessions,
  activity: (s) => legacyBotActivity(s),
  succession: (s) => successionBest(s, heirScoreBot, 'value'),
  buy: (s) => buyAllGreedy(s),
});
P['occ-quotidien'] = occ('occ-quotidien', [15, 23.75], 'Occasionnel quotidien : 15 min en ligne une fois par jour (absence 23 h 45, plafonnée à 6 h par le moteur). Décisions du profil expérimenté.');
P['occ-3x-jour'] = occ('occ-3x-jour', [10, 7.83], 'Occasionnel 3×/jour : 10 min toutes les ~8 h (matin, midi, soir). Décisions du profil expérimenté.');
P['assidu'] = { ...occ('assidu', [90, 1.5], 'Assidu : sessions de 1 h 30 puis 1 h 30 d\'absence. Décisions de l\'optimiseur (activité gloutonne, Échos par pts/s, Bazar, mariages PNJ).'),
  decideEvery: 1, buyEvery: 5, successionDelay: 2,
  activity: (s, c) => optiActivity(s, c),
  succession: (s) => successionBest(s, heirScoreOpti, 'rate'),
  buy: (s, c) => { buySaving(s); bazaar(s); marryPnj(s, c); },
};

P['opti-fort'] = {
  id: 'opti-fort',
  desc: 'Optimiseur fort : activité gloutonne (valeur nette instantanée) mais Commercer dès que les Vivres le permettent ; épargne l\'Héritage pour Alliances puis Chroniques ; Échos par pts/s ; Bazar ; mariage PNJ dès que la dot ≤ 50 % de l\'Or. Réaction 1 s.',
  decideEvery: 1, buyEvery: 5, successionDelay: 0,
  activity: (s, c) => {
    const life = s.life!;
    const v = s.hero.vocation?.act;
    if (v && has(s, v) && life.timeIn[v] < life.dur * 0.5 && life.timeIn[v] + (life.dur - life.t) <= life.dur * 0.5 + 2) return feasible(s, v);
    if (has(s, 'commercer') && s.res.vivres > 30) return 'commercer';
    return optiActivity(s, c);
  },
  succession: (s) => successionBest(s, heirScoreOpti, 'rate'),
  buy: (s, c) => { buySaving(s); bazaar(s); marryPnj(s, c, 2); },
};

// Joueurs qui ignorent une mécanique (variantes de l'optimiseur fort)
P['sans-bazar'] = { ...P['opti-fort'], id: 'sans-bazar', desc: 'Optimiseur fort qui n\'ouvre jamais le Bazar céleste (ni Temps suspendu, ni Bénédictions).', buy: (s, c) => { buySaving(s); marryPnj(s, c, 2); } };
P['sans-alliance'] = { ...P['opti-fort'], id: 'sans-alliance', desc: 'Optimiseur fort qui ne se marie jamais (achète quand même l\'amélioration).', buy: (s) => { buySaving(s); bazaar(s); } };
P['sans-echo-choix'] = { ...P['opti-fort'], id: 'sans-echo-choix', desc: 'Optimiseur fort qui valide la présélection sans réfléchir : garde les Échos les plus récents.', succession: (s) => successionBest(s, heirScoreOpti, 'recent') };
P['echo-par-valeur'] = { ...P['opti-fort'], id: 'echo-par-valeur', desc: 'Optimiseur fort qui garde les Échos par valeur totale (et non par pts/s).', succession: (s) => successionBest(s, heirScoreOpti, 'value') };

// Pause : ne joue le héros que pendant les événements (fenêtres de 45 min), pause sinon.
P['pause-hors-evt'] = {
  ...P['opti-fort'], id: 'pause-hors-evt',
  desc: 'Exploit pause : met la vie en pause hors événements mondiaux, ne joue le héros que pendant les fenêtres (bonus ×2–×3 sur life.value, donc sur l\'Héritage). Sinon optimiseur fort. À lancer avec --events.',
  activity: (s, c) => (c.rt.online && activeEvent(c.now) ? P['opti-fort'].activity(s, c) : null),
};
// Pause : ne laisse vivre le héros que si l'Harmonie est haute (farm « le Juste » / « le Glorieux »).
P['pause-harmonie'] = {
  ...P['opti-fort'], id: 'pause-harmonie',
  desc: 'Exploit pause : met la vie en pause dès que l\'Harmonie < 0,92 (reprend à ≥ 0,97) pour fabriquer des vies « parfaites » (le Juste, le Jardinier, le Glorieux). Sinon optimiseur fort, Cultiver/Chasser privilégiés.',
  activity: (s, c) => {
    const h = ecoHealth(s.eco);
    if (c.mem.p) { if (h >= 0.97) c.mem.p = false; else return null; }
    else if (h < 0.92) { c.mem.p = true; return null; }
    const a = P['opti-fort'].activity(s, c);
    return a === 'commercer' || a === 'etudier' || a === 'mediter' ? (s.life!.timeIn.cultiver + s.life!.timeIn.chasser < s.life!.t * 0.6 ? 'cultiver' : a) : a;
  },
};

// Événements : joue l'activité qui produit la ressource objectif pendant la fenêtre.
const goalAct = (goal: string, s: GameState): ActId =>
  goal === 'or' ? feasible(s, 'commercer') : goal === 'savoir' ? feasible(s, 'etudier') : goal === 'essence' ? (has(s, 'mediter') ? 'mediter' : 'cultiver') : 'cultiver';
P['evt-focus'] = {
  ...P['opti-fort'], id: 'evt-focus',
  desc: 'Joueur d\'événements : pendant une fenêtre, joue l\'activité qui produit la ressource objectif (Or→Commercer, Savoir→Étudier, Essence→Méditer, Vivres→Cultiver). Sinon optimiseur fort. --events.',
  activity: (s, c) => { const ev = c.rt.online ? activeEvent(c.now) : null; return ev ? goalAct(ev.def.goal, s) : P['opti-fort'].activity(s, c); },
};
// Exploit : « relancer le jeu » juste au début de la fenêtre → rt.rate = 0 au premier pas (main.ts : newRuntime + rattrapage < 30 s ignoré).
P['evt-reload'] = {
  ...P['evt-focus'], id: 'evt-reload',
  desc: 'Exploit : ferme le jeu quelques secondes avant chaque événement et le rouvre à l\'ouverture de la fenêtre (absence < 30 s → pas de rattrapage, taux glissant rt.rate remis à 0) : l\'objectif est calculé sur un taux nul. Puis comme evt-focus.',
  decideEvery: 0.5,
  activity: (s, c) => {
    const ev = c.rt.online ? activeEvent(c.now + 500) : null;
    if (ev && c.mem.reloaded !== ev.key && !s.events[ev.key]) {
      c.mem.reloaded = ev.key;
      c.rt.rate = zeroRes(); c.rt.net = zeroRes(); c.rt.echoRate = 0; // = newRuntime()
    }
    return P['evt-focus'].activity(s, c);
  },
};

// Surnoms : Phénix à volonté (vie sacrifiée puis vie normale ≥ 5× → +35 % de puissance d'Écho, légendaire).
P['phenix'] = {
  ...P['opti-fort'], id: 'phenix',
  desc: 'Exploit surnoms : dès que les Chroniques sont achetées et gen ≥ 10, une vie sur deux est « sacrifiée » (activité de plus faible valeur, sans vocation) pour que l\'enfant fasse ≥ 5× et devienne « le Phénix » (+35 % de puissance d\'Écho). Échos par pts/s.',
  activity: (s, c) => {
    if ((s.upgrades.chroniques ?? 0) > 0 && s.hero.gen >= 10 && s.hero.gen % 2 === 0) {
      let worst: ActId = 'cultiver', wv = Infinity;
      for (const a of ACTS) { const x = actNetValue(s, c.rt, a); if (has(s, a) && x > 0 && x < wv) { wv = x; worst = a; } }
      // Chasser en disette est l'activité la moins productive : on la force si le Gibier est bas.
      return worst;
    }
    return P['opti-fort'].activity(s, c);
  },
  // l'Écho sacrifié est faible : la présélection par pts/s l'écarte d'elle-même
};
// Surnoms : Sans-Repos (≥ 50 changements, ≥ 4 activités à 10 %) : +12 % de puissance, épique.
P['sans-repos'] = {
  ...P['opti-fort'], id: 'sans-repos',
  desc: 'Exploit surnoms : change d\'activité toutes les secondes en tournant sur 4 activités (≥ 50 changements, ≥ 10 % chacune) → « le Sans-Repos » (+12 %). Réaction 1 s (raccourcis 1–5).',
  activity: (s, c) => {
    if ((s.upgrades.chroniques ?? 0) === 0) return P['opti-fort'].activity(s, c);
    const avail = (['commercer', 'cultiver', 'etudier', 'chasser', 'mediter'] as ActId[]).filter((a) => has(s, a)).slice(0, 4);
    c.mem.k = ((c.mem.k ?? 0) + 1) % avail.length;
    return feasible(s, avail[c.mem.k]);
  },
};
// Alliances : codes forgés (le sel du contrôle est dans le client). Un nouveau code par vie, maison neuve à chaque fois.
P['faussaire'] = {
  ...P['opti-fort'], id: 'faussaire',
  desc: 'Exploit alliances : forge à chaque vie un code AL1 (maison inventée, jamais la même → aucune consanguinité ; traits Élu + Sang doré + Génie + Mémoire ; vocation du héros à rang+2) et l\'accepte (dot ½). Sinon optimiseur fort.',
  buy: (s, c) => {
    buySaving(s); bazaar(s);
    if (canMarry(s) && s.res.or > 2 * dowry(s, 'joueur')) {
      const n = (c.mem.forged = (c.mem.forged ?? 0) + 1);
      const fake: GameState = { ...s, houseId: 'forge' + n, lineage: { ...s.lineage, name: 'Fauxsang' } };
      const voc = s.hero.vocation ?? { act: 'commercer' as ActId, tier: 1 };
      const cadet: Hero = { id: 1e6 + n, name: 'Iseult', sex: 'f', gen: s.hero.gen, traits: ['elu', 'sang_dore', 'genie', 'memoire'], vocation: { act: voc.act, tier: 10 }, parentId: null };
      const code = encodeProposal(fake, cadet, undefined, n);
      const r = acceptProposal(s, code);
      if (r.ok) F.extra.forgedOk = (F.extra.forgedOk ?? 0) + 1;
    }
  },
};
P['mariage-pnj-max'] = {
  ...P['opti-fort'], id: 'mariage-pnj-max',
  desc: 'Référence honnête du faussaire : mariage PNJ à chaque vie (maison prestigieuse, consanguinité croissante), dès que la dot est payable.',
  buy: (s, c) => { buySaving(s); bazaar(s); marryPnj(s, c, 1.05); },
};
// Affût : provoque la disette (chasse jusqu'au seuil), fait autre chose pendant l'affût, rechasse à la réouverture.
P['affut-provoc'] = {
  ...P['opti-fort'], id: 'affut-provoc',
  desc: 'Exploit Affût : vocation Chasseur ; chasse jusqu\'à déclencher la disette, puis Commerce pendant l\'affût (les Échos chasseurs remplissent la réserve), puis rechasse dès la réouverture pour encaisser la vague de trophées. Après 30 min.',
  activity: (s, c) => {
    if (c.t < 1800) return legacyBotActivity(s);
    if (s.hunt.on) return has(s, 'commercer') && s.res.vivres > 10 ? 'commercer' : 'cultiver';
    return 'chasser';
  },
  succession: (s) => successionBest(s, heirScoreBot, 'rate'),
};

// Horloge système avancée : Éclats illimités (sauts vers les fenêtres d'événement / les Destins d'autres jours).
P['eclats-infinis'] = {
  ...P['opti-fort'], id: 'eclats-infinis',
  desc: 'Exploit horloge : le joueur « saute » l\'horloge vers des fenêtres d\'événement (≈ 3 ✦/min réelle mesurés) ; modélisé par un solde d\'Éclats maintenu à ≥ 40. Achète Temps suspendu à chaque vie et 2 Bénédictions (Élu, Éternel) à chaque succession.',
  buy: (s, c) => { if (s.eclats < 40) s.eclats = 40; buySaving(s); bazaar(s); marryPnj(s, c, 2); },
};

// Variantes d'isolement (piège de vocation) : optimiseur de référence + épargne seule / + règle « Commercer » seule.
P['opti-epargne'] = {
  ...P['opti-fort'], id: 'opti-epargne',
  desc: 'Optimiseur de référence (activité gloutonne pure, sans règle Commercer) + épargne Alliances/Chroniques + Bazar + mariage PNJ (dot ≤ 25 % de l\'Or).',
  activity: (s, c) => optiActivity(s, c),
  buy: (s, c) => { buySaving(s); bazaar(s); marryPnj(s, c, 4); },
};
P['opti-commerce'] = {
  ...P['opti-fort'], id: 'opti-commerce',
  desc: 'Activité d\'opti-fort (Commercer dès que Vivres > 30, vocation gardée) mais achats gourmands sans épargne.',
  buy: (s, c) => { buyAllGreedy(s); bazaar(s); marryPnj(s, c, 4); },
};
P['sans-vocation-piege'] = {
  ...P['opti-fort'], id: 'sans-vocation-piege',
  desc: 'Opti-fort qui n\'entretient une vocation que si c\'est Commercer ou Cultiver (abandonne Étudier/Méditer) : mesure le coût du piège de vocation.',
  activity: (s, c) => {
    const life = s.life!;
    const v = s.hero.vocation?.act;
    if (v && (v === 'commercer' || v === 'cultiver') && life.timeIn[v] < life.dur * 0.5 && life.timeIn[v] + (life.dur - life.t) <= life.dur * 0.5 + 2) return feasible(s, v);
    if (has(s, 'commercer') && s.res.vivres > 30) return 'commercer';
    return feasible(s, 'cultiver');
  },
};

// --- Phase 2 (confrontation B1, B2) : variantes d'opti-epargne (profil non piégé) ---
P['ep-recent'] = { ...P['opti-epargne'], id: 'ep-recent', desc: 'opti-epargne, Échos les plus récents.', succession: (s) => successionBest(s, heirScoreOpti, 'recent') };
P['ep-vraie-force'] = { ...P['opti-epargne'], id: 'ep-vraie-force', desc: 'opti-epargne, Échos triés par force réelle (pts/s × force × surnom, GD-02).', succession: (s) => successionBest(s, heirScoreOpti, 'true') };
P['ep-sans-mariage'] = { ...P['opti-epargne'], id: 'ep-sans-mariage', desc: 'opti-epargne sans aucun mariage.', buy: (s) => { buySaving(s); bazaar(s); } };
P['ep-mariage-max'] = {
  ...P['opti-epargne'], id: 'ep-mariage-max',
  desc: 'opti-epargne qui se marie à chaque vie dès que la dot est payable : maison dont la spécialité = vocation du héros (union de métier), sinon maison prestigieuse (don épique/légendaire).',
  buy: (s, c) => {
    buySaving(s); bazaar(s);
    if (canMarry(s) && s.res.or > 1.05 * dowry(s, 'pnj')) {
      const hs = countyHouses(c.now);
      const ch = hs.find((h) => h.spec === s.hero.vocation?.act) ?? hs[0];
      marry(s, suitorFor(s, ch, c.now));
    }
  },
};

// B2 : le mariage passe AVANT les achats (l'Or n'est pas mangé par les bâtiments) — joueur qui veut vraiment s'unir.
const marryFirst = (pick: (s: GameState, now: number) => ReturnType<typeof countyHouses>[number] | undefined) => (s: GameState, c: Ctx) => {
  if (canMarry(s) && s.res.or >= dowry(s, 'pnj')) { const ch = pick(s, c.now); if (ch) marry(s, suitorFor(s, ch, c.now)); }
  buySaving(s); bazaar(s);
};
P['ep-mariage-force'] = { ...P['opti-epargne'], id: 'ep-mariage-force', desc: 'opti-epargne qui paie la dot avant tout achat, à chaque vie, maison prestigieuse (don épique/légendaire).', buy: marryFirst((_s, now) => countyHouses(now)[0]) };
P['ep-mariage-metier'] = { ...P['opti-epargne'], id: 'ep-mariage-metier', desc: 'opti-epargne qui paie la dot avant tout achat, uniquement avec une maison dont la spécialité = vocation du héros (union de métier : rang +1 à 35 %).', buy: marryFirst((s, now) => countyHouses(now).find((h) => h.spec === s.hero.vocation?.act)) };

// R11 (phase 4, Lead) : variantes de mariage d'un profil marchand, qui a toujours de l'Or pour la dot
// (les lignées de paysans d'opti-epargne ne se marient presque jamais : 84 % des graines sans mariage).
P['oc-sans-mariage'] = { ...P['opti-commerce'], id: 'oc-sans-mariage', desc: 'opti-commerce, sans aucun mariage (témoin R11).', buy: (s) => { buySaving(s); bazaar(s); } };
P['oc-mariage-force'] = { ...P['opti-commerce'], id: 'oc-mariage-force', desc: 'opti-commerce qui paie la dot avant tout achat, à chaque vie, maison prestigieuse.', buy: marryFirst((_s, now) => countyHouses(now)[0]) };
P['oc-mariage-metier'] = { ...P['opti-commerce'], id: 'oc-mariage-metier', desc: 'opti-commerce qui ne s\'unit qu\'à une maison de sa vocation.', buy: marryFirst((s, now) => countyHouses(now).find((h) => h.spec === s.hero.vocation?.act)) };

for (const [k, p] of Object.entries(P)) PROFILES[k] = instrument(p);
// Les profils de référence sont aussi instrumentés (mêmes décisions) sous un alias.
for (const k of ['experimente', 'debutant', 'occasionnel', 'optimiseur', 'mono-cultiver', 'mono-chasser', 'mono-commercer', 'mono-etudier', 'mono-mediter']) {
  const base = PROFILES[k];
  if (base && !PROFILES['i-' + k]) PROFILES['i-' + k] = instrument({ ...base, id: 'i-' + k });
}
export const PBA_PROFILES = Object.keys(P);
export type { Runtime };
