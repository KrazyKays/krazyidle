import { ACTS, CRESTS, CREST_COLORS, FIRST_NAMES, TRAITS, sexFor, type ActId, type ResId, type Sex } from './data';
import { newEco, type Eco } from './ecosystem';
import { Rng } from './rng';

export interface Vocation {
  act: ActId;
  tier: number;
}

export interface Hero {
  id: number;
  name: string;
  /** genre, fixé à la naissance (absent des sauvegardes d'avant : déduit du prénom) */
  sex?: Sex;
  gen: number;
  traits: string[];
  vocation: Vocation | null;
  parentId: number | null;
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
}

export interface Echo {
  id: number;
  heroId: number;
  name: string;
  /** genre, fixé à la naissance (absent des sauvegardes d'avant : déduit du prénom) */
  sex?: Sex;
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
}

export interface Ancestor {
  id: number;
  name: string;
  /** genre, fixé à la naissance (absent des sauvegardes d'avant : déduit du prénom) */
  sex?: Sex;
  gen: number;
  traits: string[];
  vocation: Vocation | null;
  value: number;
  legacy: number;
  dominant: ActId | null;
  diedAt: number;
}

export interface Succession {
  heirs: Hero[];
  newEcho: Echo;
  legacyGain: number;
  vocationEarned: Vocation | null;
  ancestor: Ancestor;
}

export interface EventProgress {
  target: number;
  progress: number;
  tier: number; // paliers atteints 0..3
}

export interface DailyRecord {
  best: number;
  code: string;
  rewarded: number; // paliers récompensés
}

export interface GameState {
  v: number;
  seed: number;
  createdAt: number;
  lastTick: number;
  lineage: { name: string; crest: string; color: string; partition?: string };
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
  eco: Eco;
  eclats: number;
  blessings: string[];
  events: Record<string, EventProgress>;
  daily: Record<string, DailyRecord>;
  ancestors: Ancestor[];
  flags: Record<string, boolean>;
  settings: { notation: 'lettres' | 'scientifique'; reducedMotion: boolean };
  stats: { lives: number; playTime: number; eventsDone: number; bestLife: number; sessions?: number; installAskAt?: number };
}

export const SAVE_VERSION = 1;

export function zeroRes(): Record<ResId, number> {
  return { vivres: 0, or: 0, savoir: 0, essence: 0 };
}
export function zeroActs(): Record<ActId, number> {
  return { cultiver: 0, chasser: 0, commercer: 0, etudier: 0, mediter: 0 };
}

export function newGame(now = Date.now(), seed = (Math.random() * 2 ** 32) >>> 0): GameState {
  const rng = new Rng(seed);
  const crest = rng.pick(CRESTS);
  const color = rng.pick(CREST_COLORS);
  const starter = rng.pick(TRAITS.filter((t) => t.rarity === 0 && !t.neg));
  const name = rng.pick(FIRST_NAMES);
  const hero: Hero = { id: 1, name, sex: sexFor(name), gen: 1, traits: [starter.id], vocation: null, parentId: null };
  const s: GameState = {
    v: SAVE_VERSION,
    seed: rng.s,
    createdAt: now,
    lastTick: now,
    lineage: { name: 'Sansnom', crest, color, partition: 'plein' },
    partitions: ['plein'],
    res: zeroRes(),
    totalEver: zeroRes(),
    unlocked: ['cultiver', 'chasser'],
    nextId: 2,
    hero,
    life: null,
    succession: null,
    echoes: [],
    buildings: {},
    legacy: 0,
    legacyTotal: 0,
    upgrades: {},
    eco: newEco(),
    eclats: 0,
    blessings: [],
    events: {},
    daily: {},
    ancestors: [],
    flags: {},
    settings: { notation: 'lettres', reducedMotion: false },
    stats: { lives: 0, playTime: 0, eventsDone: 0, bestLife: 0 },
  };
  return s;
}

export function newLife(dur: number, startLvl: Record<ActId, number>, act: ActId | null = null): LifeState {
  const lvl = zeroActs();
  for (const a of ACTS) lvl[a] = startLvl[a];
  return { t: 0, dur, act, lastAct: act, xp: zeroActs(), lvl, timeIn: zeroActs(), rec: [], pow: [], value: 0, baseValue: 0, extended: false };
}
