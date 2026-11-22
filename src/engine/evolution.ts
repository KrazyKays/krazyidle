// Évolution des traits (0.3) : un don se transcende en passant à l'enfant, à condition que la vie de son
// porteur l'ait mérité. « Main verte » ne devient « Sève de la terre » que chez qui a vraiment récolté.
// Les grands dons se fabriquent ainsi sur plusieurs générations au lieu de tomber du ciel par mutation.
import type { LifeFacts } from './epithets';

export interface EvolutionDef {
  from: string;
  to: string;
  /** ce que la vie du porteur doit accomplir, en clair (affiché sur la fiche du trait) */
  cond: string;
  test: (f: LifeFacts) => boolean;
}

/**
 * La vie écrase la meilleure de la lignée (×1,5, comme les records des Chroniques) : condition commune des
 * évolutions vers le légendaire. Un simple record ne suffit pas, l'économie grandit à chaque génération.
 */
const record = (f: LifeFacts) => f.bestBefore > 0 && f.value >= 1.5 * f.bestBefore;
const MASTER = 6;
/** Générations de transmission d'un don avant qu'il mûrisse (chaîne de longévité, 0.5). */
export const WEAR_RIPE = 2;
const wornFor = (f: LifeFacts, t: string) => (f.wear?.[t] ?? 0) >= WEAR_RIPE;

const act = (from: string, to: string, a: keyof LifeFacts['share'], verb: string): EvolutionDef[] => [
  { from, to, cond: `${verb} au moins la moitié de sa vie`, test: (f) => f.share[a] >= 0.5 },
  { from: to, to: 'sang_dore', cond: `${verb} au moins la moitié de sa vie, avec une vocation de rang ${MASTER} ou plus`, test: (f) => f.share[a] >= 0.5 && f.vocTier >= MASTER },
];

export const EVOLUTIONS: EvolutionDef[] = [
  ...act('main_verte', 'seve', 'cultiver', 'Récolter'),
  ...act('langue_argent', 'langue_or', 'commercer', 'Commercer'),
  ...act('rat_biblio', 'encyclopedique', 'etudier', 'Étudier'),
  ...act('ame_calme', 'troisieme_oeil', 'mediter', 'Méditer'),
  // 0.5 (SIMPLIF-3) : la santé du Domaine départageait des métiers (le Paysan en était privé) ; la chaîne de
  // longévité lit désormais la mémoire du sang. Un don mûri repart sans usure : il faut le garder deux générations.
  { from: 'robuste', to: 'longevite', cond: `Porter un don Robuste reçu depuis au moins ${WEAR_RIPE} générations`, test: (f) => wornFor(f, 'robuste') },
  { from: 'longevite', to: 'centenaire', cond: `Porter Longévité reçue depuis au moins ${WEAR_RIPE} générations, sans aucun mauvais présage`, test: (f) => wornFor(f, 'longevite') && f.negTraits === 0 },
  { from: 'curieux', to: 'prodige', cond: 'Pratiquer au moins trois activités', test: (f) => f.used >= 3 },
  { from: 'prodige', to: 'genie', cond: 'Étudier au moins la moitié de sa vie', test: (f) => f.share.etudier >= 0.5 },
  { from: 'polyvalent', to: 'sang_dore', cond: 'Pratiquer les quatre activités', test: (f) => f.used >= 4 },
  { from: 'echo_vibrant', to: 'memoire', cond: 'Méditer au moins la moitié de sa vie', test: (f) => f.share.mediter >= 0.5 },
  { from: 'genie', to: 'elu', cond: `Faire une fois et demie mieux que la meilleure vie de la lignée, avec une vocation de rang ${MASTER} ou plus`, test: (f) => record(f) && f.vocTier >= MASTER },
  { from: 'sang_dore', to: 'elu', cond: `Faire une fois et demie mieux que la meilleure vie de la lignée, avec une vocation de rang ${MASTER} ou plus`, test: (f) => record(f) && f.vocTier >= MASTER },
  { from: 'centenaire', to: 'eternel', cond: 'Faire une fois et demie mieux que la meilleure vie de la lignée', test: (f) => record(f) },
  { from: 'memoire', to: 'eternel', cond: 'Faire une fois et demie mieux que la meilleure vie de la lignée, en méditant au moins la moitié de sa vie', test: (f) => record(f) && f.share.mediter >= 0.5 },
];

/** Évolutions possibles d'un trait (une seule par trait aujourd'hui, la liste garde la porte ouverte). */
export function evolutionsOf(id: string): EvolutionDef[] {
  return EVOLUTIONS.filter((e) => e.from === id);
}

/** Dons mûrs d'une vie qui s'achève : trait → forme supérieure qu'il peut transmettre. */
export function ripeTraits(traits: string[], f: LifeFacts): Record<string, string> {
  const out: Record<string, string> = {};
  for (const t of traits) {
    const e = evolutionsOf(t).find((x) => x.test(f));
    if (e) out[t] = e.to;
  }
  return out;
}
