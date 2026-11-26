import { ACTS, CRESTS, CREST_COLORS, FIRST_NAMES, TRAITS, sexFor, type ActId, type ResId, type Sex } from './data';
import { hashStr, Rng } from './rng';

export interface Vocation {
  act: ActId;
  tier: number;
}

export interface Hero {
  id: number;
  name: string;
  /** genre, fixé à la naissance (absent des sauvegardes d'avant : déduit du prénom) */
  sex?: Sex;
  /** rang parmi les chefs de la lignée qui ont porté ce prénom (« Jehan III ») ; absent des sauvegardes d'avant */
  ord?: number;
  gen: number;
  traits: string[];
  vocation: Vocation | null;
  parentId: number | null;
  /** conjoint venu d'une autre maison (une union par vie) */
  spouse?: Spouse;
  /** usure du sang : générations successives de transmission de chaque trait (absent : déduit des ancêtres) */
  wear?: Record<string, number>;
  /** dons reçus sous leur forme mûrie à la naissance (évolution, 0.3) */
  evolved?: string[];
}

/** Maison alliée : maison du comté (PNJ) ou lignée d'un autre joueur. */
export interface HouseRef {
  id: string;
  name: string;
  crest: string;
  color: string;
  partition?: string;
}

export interface Spouse {
  name: string;
  sex: Sex;
  gen: number;
  traits: string[];
  vocation: Vocation | null;
  epithet?: string;
  house: HouseRef;
  origin: 'pnj' | 'joueur';
}

export interface Alliance {
  house: HouseRef;
  origin: 'pnj' | 'joueur';
  /** unions conclues avec cette maison (consanguinité au-delà d'une) */
  count: number;
  /** un cadet de notre maison lui a été proposé en retour */
  sent?: boolean;
  /** cette maison nous a proposé un cadet en réponse au nôtre */
  replied?: boolean;
  lastGen: number;
}

/** Statistiques de la vie en cours (surnoms). */
export interface LifeStats {
  /** changements d'activité */
  sw: number;
  /** meilleur palier d'événement atteint */
  ev: number;
  /** bâtiments construits */
  bd: number;
}

export interface LifeState {
  t: number;
  dur: number;
  /** null = vie en pause : le temps du héros ne s'écoule pas. */
  act: ActId | null;
  /** dernière activité choisie, reprise au lancement du jeu */
  lastAct?: ActId | null;
  xp: Record<ActId, number>;
  lvl: Record<ActId, number>;
  timeIn: Record<ActId, number>;
  rec: number[]; // activité par seconde (-1 = rien, anciennes sauvegardes)
  pow: number[]; // puissance par seconde
  value: number; // valeur produite (pour l'Héritage)
  /** valeur produite hors bonus d'événement : mesure la qualité intrinsèque de l'Écho */
  baseValue?: number;
  extended: boolean; // bonus "Temps suspendu" utilisé
  st?: LifeStats;
  /** Compagnonnage (0.8) : paire formée pendant cette vie (`PAIR_DEF`), une seule fois : un rechargement ne la redonne pas */
  comp?: string;
}

export interface Echo {
  id: number;
  heroId: number;
  name: string;
  /** genre, fixé à la naissance (absent des sauvegardes d'avant : déduit du prénom) */
  sex?: Sex;
  /** rang parmi les chefs de la lignée qui ont porté ce prénom (« Jehan III ») ; absent des sauvegardes d'avant */
  ord?: number;
  gen: number;
  traits: string[];
  vocation: Vocation | null;
  acts: number[];
  pow: number[];
  strength: number; // bonus d'écho issu des traits
  pos: number;
  loops: number;
  pinned: boolean;
  value: number;
  /** surnom gagné à la mort (Chroniques) */
  epithet?: string;
  /** paire de Compagnonnage de sa vie (0.8) : ses deux métiers rejoués plus fort (`COMPAGNON_ECHO`) */
  comp?: string;
}

export interface Ancestor {
  id: number;
  name: string;
  /** genre, fixé à la naissance (absent des sauvegardes d'avant : déduit du prénom) */
  sex?: Sex;
  /** rang parmi les chefs de la lignée qui ont porté ce prénom (« Jehan III ») ; absent des sauvegardes d'avant */
  ord?: number;
  gen: number;
  traits: string[];
  vocation: Vocation | null;
  value: number;
  legacy: number;
  dominant: ActId | null;
  diedAt: number;
  epithet?: string;
  spouse?: { name: string; sex: Sex; epithet?: string; house: HouseRef; origin: 'pnj' | 'joueur' };
  /** paire de Compagnonnage formée par cette vie (0.8) */
  comp?: string;
}

export interface Succession {
  heirs: Hero[];
  /** Écho de la vie qui s'achève. Ignoré si `noEcho` (Étoile filante) : il n'est ni proposé ni gardé. */
  newEcho: Echo;
  /** la vie était une Étoile filante : elle ne laisse pas d'Écho (0.3) */
  noEcho?: boolean;
  /** dons mûrs du défunt : trait → forme supérieure qu'il a pu transmettre (0.3) */
  ripe?: Record<string, string>;
  /** hauts faits obtenus à cette mort (0.3) */
  feats?: string[];
  legacyGain: number;
  vocationEarned: Vocation | null;
  ancestor: Ancestor;
  /** surnom attribué et Éclats gagnés s'il vient d'être découvert */
  epithet?: { id: string; isNew: boolean; eclats: number };
  /** Compagnonnage (0.8) : paire formée, multiplicateur appliqué à `legacyGain` */
  comp?: { id: string; mult: number };
}

export interface EventProgress {
  target: number;
  progress: number;
  tier: number; // paliers atteints 0..3
  /** règle de calcul : 2 = toute la production compte (R9) ; absent = ancienne règle (ressource visée seule) */
  v?: number;
}

export interface DailyRecord {
  best: number;
  code: string;
  rewarded: number; // paliers récompensés
  /** 2 = Commande du comté (best = résultat de `dailyResult`) ; absent = ancien Destin à points, ignoré. */
  v?: number;
}

export interface GameState {
  v: number;
  seed: number;
  createdAt: number;
  lastTick: number;
  lineage: {
    name: string; crest: string; color: string; partition?: string;
    /** nombre de chefs de la lignée ayant porté chaque prénom */
    names?: Record<string, number>;
    /** écartelé d'alliance (0.6) : armes d'une maison alliée aux 2e et 3e quartiers (remplace la partition) */
    quarter?: { name: string; crest: string; color: string };
    /** bordure de l'écu (0.6, `BORDURES`) */
    bordure?: string;
    /** devise de la maison (0.6, `DEVISES`) */
    devise?: string;
  };
  /** Partitions d'écu débloquées au Bazar céleste ('plein' est offert). */
  partitions: string[];
  res: Record<ResId, number>;
  totalEver: Record<ResId, number>;
  unlocked: ActId[];
  nextId: number;
  hero: Hero;
  life: LifeState | null;
  succession: Succession | null;
  echoes: Echo[];
  buildings: Record<string, number>;
  legacy: number;
  legacyTotal: number;
  upgrades: Record<string, number>;
  eclats: number;
  blessings: string[];
  events: Record<string, EventProgress>;
  daily: Record<string, DailyRecord>;
  ancestors: Ancestor[];
  flags: Record<string, boolean>;
  settings: { notation: 'lettres' | 'scientifique'; reducedMotion: boolean; /** empêche la mise en veille de l'écran tant que le jeu est affiché */ keepAwake: boolean; /** thème de couleur (0.6, `THEMES`) ; absent : Crépuscule */ theme?: string };
  /** identifiant stable de la maison (codes d'alliance) */
  houseId: string;
  /** surnoms découverts : nombre de fois portés */
  epithets: Record<string, number>;
  /** maisons alliées, par identifiant */
  alliances: Record<string, Alliance>;
  /** enfants non choisis, mariables dans d'autres maisons */
  cadets: Hero[];
  /** empreintes des codes d'alliance déjà acceptés */
  usedCodes: string[];
  /** Almanach (0.3) : types d'événement dont le palier Or a été atteint au moins une fois */
  almanach?: string[];
  /** Hauts faits (0.3) : identifiant → date d'obtention (ms) */
  feats?: Record<string, number>;
  /** Compagnonnage (0.8) : nombre de vies ayant formé chaque paire (Codex) */
  compagnons?: Record<string, number>;
  /** Codex (0.6) : entrées déjà vues par le joueur (`codexKeys`) ; le reste est signalé comme nouveau */
  codexSeen?: string[];
  /** médailles d'or par type d'événement (0.6, thèmes de couleur) */
  eventGolds?: Record<string, number>;
  /** Veillée des ancêtres (0.6) : souvenirs recueillis, par piste (devises ou bordures) */
  souvenirs?: { devise: number; bordure: number };
  /** Veillée de l'événement en cours : souvenirs recueillis et perdus (plus de 3 en attente) */
  veillee?: { key: string; taken: number; lost: number };
  stats: { lives: number; playTime: number; eventsDone: number; bestLife: number; /** Bénédictions légendaires ou mythiques achetées (0.3) */ blessHigh?: number; sessions?: number; installAskAt?: number; /** débit de valeur (pts/s) au dernier pas, pour fixer l'objectif des événements */ valueRate?: number };
}

/** 3 (0.4) : Cultiver et Chasser fusionnés en Récolter (`mergeLandV04`). */
export const SAVE_VERSION = 3;

export function zeroRes(): Record<ResId, number> {
  return { vivres: 0, or: 0, savoir: 0, essence: 0 };
}
export function zeroActs(): Record<ActId, number> {
  return { cultiver: 0, commercer: 0, etudier: 0, mediter: 0 };
}

export function newGame(now = Date.now(), seed = (Math.random() * 2 ** 32) >>> 0): GameState {
  const rng = new Rng(seed);
  const crest = rng.pick(CRESTS);
  const color = rng.pick(CREST_COLORS);
  const starter = rng.pick(TRAITS.filter((t) => t.rarity === 0 && !t.neg));
  const name = rng.pick(FIRST_NAMES);
  const hero: Hero = { id: 1, name, sex: sexFor(name), ord: 1, gen: 1, traits: [starter.id], vocation: null, parentId: null };
  const s: GameState = {
    v: SAVE_VERSION,
    seed: rng.s,
    createdAt: now,
    lastTick: now,
    lineage: { name: 'Sansnom', crest, color, partition: 'plein', names: { [name]: 1 } },
    partitions: ['plein'],
    res: zeroRes(),
    totalEver: zeroRes(),
    unlocked: ['cultiver'],
    nextId: 2,
    hero,
    life: null,
    succession: null,
    echoes: [],
    buildings: {},
    legacy: 0,
    legacyTotal: 0,
    upgrades: {},
    eclats: 0,
    blessings: [],
    events: {},
    daily: {},
    ancestors: [],
    flags: {},
    houseId: (hashStr(`maison:${seed}:${now}`) >>> 0).toString(36),
    epithets: {},
    alliances: {},
    cadets: [],
    usedCodes: [],
    codexSeen: [],
    eventGolds: {},
    settings: { notation: 'lettres', reducedMotion: false, keepAwake: false },
    stats: { lives: 0, playTime: 0, eventsDone: 0, bestLife: 0 },
  };
  return s;
}

export function newLife(dur: number, startLvl: Record<ActId, number>, act: ActId | null = null): LifeState {
  const lvl = zeroActs();
  for (const a of ACTS) lvl[a] = startLvl[a];
  return { t: 0, dur, act, lastAct: act, xp: zeroActs(), lvl, timeIn: zeroActs(), rec: [], pow: [], value: 0, baseValue: 0, extended: false, st: newLifeStats() };
}

export function newLifeStats(): LifeStats {
  return { sw: 0, ev: 0, bd: 0 };
}
