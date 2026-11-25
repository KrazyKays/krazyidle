// Identité de la maison (0.6) : rang (titre de famille), partitions, écartelé d'alliance, bordures et devises.
// Tout est cosmétique et se gagne en jouant : rien ne s'achète, rien ne touche à la production.
import type { GameState, HouseRef } from './state';

// ---------------------------------------------------------------------------
// Titres de famille : le rang de la maison monte avec la lignée.

export interface HouseRank {
  id: string;
  name: string;
  /** génération du chef de maison */
  gen: number;
  /** surnoms différents découverts (Codex) */
  epithets: number;
  /** hauts faits accomplis */
  feats: number;
  /** ornement posé au-dessus de l'écu */
  timbre: string;
}

/**
 * Seuils fixés sur les références T05 [SIMULÉ] : un joueur actif atteint ~160 générations, 4 à 6 surnoms
 * et 0 à 1 haut fait en 6 h ; un occasionnel ~28 générations. Seigneurie dans la première session,
 * Baronnie dans la journée, Duché en fin de partie (30 surnoms et 8 hauts faits existent).
 */
export const HOUSE_RANKS: HouseRank[] = [
  { id: 'maison', name: 'Maison', gen: 0, epithets: 0, feats: 0, timbre: '' },
  { id: 'seigneurie', name: 'Seigneurie', gen: 20, epithets: 0, feats: 0, timbre: 'Heaume de seigneur' },
  { id: 'baronnie', name: 'Baronnie', gen: 60, epithets: 3, feats: 0, timbre: 'Tortil de baron' },
  { id: 'comte', name: 'Comté', gen: 150, epithets: 6, feats: 1, timbre: 'Couronne de comte' },
  { id: 'marquisat', name: 'Marquisat', gen: 300, epithets: 10, feats: 3, timbre: 'Couronne de marquis' },
  { id: 'duche', name: 'Duché', gen: 600, epithets: 15, feats: 5, timbre: 'Couronne ducale' },
];

const nEpithets = (s: GameState) => Object.keys(s.epithets ?? {}).length;
const nFeats = (s: GameState) => Object.keys(s.feats ?? {}).length;

/** Rang atteint (indice dans `HOUSE_RANKS`). Les trois critères ne font que croître : le rang ne redescend pas. */
export function houseRank(s: GameState): number {
  let r = 0;
  HOUSE_RANKS.forEach((k, i) => { if (s.hero.gen >= k.gen && nEpithets(s) >= k.epithets && nFeats(s) >= k.feats) r = i; });
  return r;
}

/** Ce qui manque pour le rang suivant (null au Duché). */
export function nextRankNeeds(s: GameState): { rank: HouseRank; parts: { label: string; have: number; need: number }[] } | null {
  const k = HOUSE_RANKS[houseRank(s) + 1];
  if (!k) return null;
  const parts = [
    { label: 'génération', have: s.hero.gen, need: k.gen },
    { label: 'surnoms découverts', have: nEpithets(s), need: k.epithets },
    { label: 'hauts faits', have: nFeats(s), need: k.feats },
  ].filter((p) => p.need > 0);
  return { rank: k, parts };
}

/** Rangs atteints mais pas encore annoncés au joueur (drapeaux `rang_<id>`) ; les marque annoncés. */
export function announceRanks(s: GameState): HouseRank[] {
  const out: HouseRank[] = [];
  const r = houseRank(s);
  for (let i = 1; i <= r; i++) {
    const f = `rang_${HOUSE_RANKS[i].id}`;
    if (!s.flags[f]) { s.flags[f] = true; out.push(HOUSE_RANKS[i]); }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Partitions de l'écu : gagnées par la lignée (elles coûtaient 3 ✦ jusqu'à la 0.5 ; les achetées restent acquises).

export const PARTITION_UNLOCK: Record<string, { hint: string; ok: (s: GameState) => boolean }> = {
  plein: { hint: 'Offerte', ok: () => true },
  parti: { hint: 'Atteindre la génération V', ok: (s) => s.hero.gen >= 5 },
  coupe: { hint: 'Découvrir un premier surnom', ok: (s) => nEpithets(s) >= 1 },
  tranche: { hint: 'Atteindre le palier Or d\'un événement', ok: (s) => (s.almanach?.length ?? 0) >= 1 },
  chevron: { hint: 'Élever la maison au rang de Seigneurie', ok: (s) => houseRank(s) >= 1 },
  ecartele: { hint: 'Accomplir un haut fait', ok: (s) => nFeats(s) >= 1 },
};

export function partitionOpen(s: GameState, id: string): boolean {
  return s.partitions.includes(id) || !!PARTITION_UNLOCK[id]?.ok(s);
}

// ---------------------------------------------------------------------------
// Écartelé d'alliance : les armes d'une maison alliée aux 2e et 3e quartiers.

/** Maisons dont on peut porter les armes : celles avec qui une union a été conclue. */
export function quarterChoices(s: GameState): HouseRef[] {
  return Object.values(s.alliances ?? {}).filter((a) => a.count > 0).map((a) => a.house);
}

// ---------------------------------------------------------------------------
// Bordures et devises : souvenirs de la Veillée des ancêtres (voir `veillee.ts`).

export interface Bordure { id: string; name: string; color: string }
export const BORDURES: Bordure[] = [
  { id: 'gueules', name: 'Bordure de gueules', color: '#b3261e' },
  { id: 'azur', name: 'Bordure d\'azur', color: '#1f4e9c' },
  { id: 'argent', name: 'Bordure d\'argent', color: '#e4e4e4' },
  { id: 'sinople', name: 'Bordure de sinople', color: '#2e7d32' },
  { id: 'sable', name: 'Bordure de sable', color: '#1b1b1b' },
  { id: 'pourpre', name: 'Bordure de pourpre', color: '#6a1b9a' },
];

export const DEVISES: string[] = [
  'Rien ne se perd',
  'Le sang se souvient',
  'Après nous, encore nous',
  'Qui sème lègue',
  'De braise en braise',
  'Le temps est notre champ',
  'Fidèles au Sablier',
  'Plus loin que nos pères',
];

/** Souvenirs de Veillée nécessaires pour chaque bordure ou devise suivante. */
export const SOUVENIRS_PER_UNLOCK = 4;

export type SouvenirTrack = 'devise' | 'bordure';

export function souvenirsOf(s: GameState, track: SouvenirTrack): number {
  return s.souvenirs?.[track] ?? 0;
}

/** Bordures gagnées, dans l'ordre de la liste. */
export function borduresOpen(s: GameState): Bordure[] {
  return BORDURES.slice(0, Math.floor(souvenirsOf(s, 'bordure') / SOUVENIRS_PER_UNLOCK));
}

/** Devises gagnées, dans l'ordre de la liste. */
export function devisesOpen(s: GameState): string[] {
  return DEVISES.slice(0, Math.floor(souvenirsOf(s, 'devise') / SOUVENIRS_PER_UNLOCK));
}

// ---------------------------------------------------------------------------
// Thèmes de couleur (0.6, validés par le propriétaire sur l'aperçu du 2026-11-24).

export interface ThemeDef {
  id: string;
  name: string;
  /** type d'événement dont il faut décrocher l'or `THEME_GOLDS` fois ; absent : offert */
  event?: string;
  /** couleur de fond (barre d'état du téléphone) et couleur d'accent (pastille de choix) */
  bg: string;
  gold: string;
}

export const THEME_GOLDS = 3;

export const THEMES: ThemeDef[] = [
  { id: 'crepuscule', name: 'Crépuscule', bg: '#14111f', gold: '#f2c45a' },
  // Le thème clair est offert : c'est une question d'accessibilité, pas une récompense.
  { id: 'parchemin', name: 'Parchemin', bg: '#efe6d2', gold: '#a8741a' },
  { id: 'maree', name: 'Marée d\'or', event: 'maree', bg: '#0b1624', gold: '#f5c650' },
  { id: 'moisson', name: 'Moisson dorée', event: 'moisson', bg: '#141a10', gold: '#f0c24b' },
  { id: 'marche', name: 'Grand marché', event: 'migration', bg: '#1c120e', gold: '#ffbe55' },
  { id: 'eclipse', name: 'Éclipse', event: 'eclipse', bg: '#07060b', gold: '#e8c26a' },
  { id: 'comete', name: 'Comète savante', event: 'comete', bg: '#0c1220', gold: '#9fe3ff' },
  { id: 'concile', name: 'Concile des ancêtres', event: 'concile', bg: '#151515', gold: '#e9c98d' },
];

export function themeDef(id: string | undefined): ThemeDef {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

/** Médailles d'or décrochées sur ce type d'événement. */
export function eventGolds(s: GameState, eventId: string): number {
  return s.eventGolds?.[eventId] ?? 0;
}

export function themeOpen(s: GameState, id: string): boolean {
  const t = THEMES.find((x) => x.id === id);
  return !!t && (!t.event || eventGolds(s, t.event) >= THEME_GOLDS);
}

/** Thèmes d'événement débloqués mais pas encore annoncés (drapeaux `theme_<id>`) ; les marque annoncés. */
export function announceThemes(s: GameState): ThemeDef[] {
  return THEMES.filter((t) => t.event && themeOpen(s, t.id) && !s.flags[`theme_${t.id}`]).map((t) => { s.flags[`theme_${t.id}`] = true; return t; });
}
