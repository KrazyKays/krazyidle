// Numérotation dynastique : quand un prénom revient parmi les chefs de la lignée, il prend son rang
// (« Jehan III »). Le premier du nom devient « Ier » (« Ire ») dès qu'un second le porte, comme chez les rois.
import { isJojo, sexFor, sexOf, type Named } from './data';
import type { GameState } from './state';

/** Ce qui peut porter un rang : héros, Écho, ancêtre (absent des sauvegardes d'avant : recalculé). */
export type Ranked = Named & { ord?: number };

const ROMAN: [number, string][] = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
export function roman(n: number): string {
  if (n <= 0 || n > 3999) return String(n);
  let out = '';
  for (const [v, r] of ROMAN) while (n >= v) { out += r; n -= v; }
  return out;
}

/** Le héros devient chef de la lignée : il prend son rang parmi ceux qui ont porté son prénom. */
export function crown(s: GameState, p: Ranked): void {
  const c = (s.lineage.names ??= {});
  p.ord = (c[p.name] ?? 0) + 1;
  c[p.name] = p.ord;
}

/** Change le prénom du chef de lignée (dé de la cérémonie de fondation) en gardant les rangs justes. */
export function renameHead(s: GameState, name: string): void {
  const c = (s.lineage.names ??= {});
  const old = s.hero.name;
  if (c[old] && c[old] === s.hero.ord) c[old]--;
  if (!c[old]) delete c[old];
  s.hero.name = name;
  s.hero.sex = sexFor(name);
  crown(s, s.hero);
}

/**
 * Rang affiché : « II », « Ier » / « Ire », ou rien pour un prénom porté une seule fois.
 * Un héritier pas encore couronné (sans rang) montre celui qu'il prendrait.
 */
export function regnal(p: Ranked, names: Record<string, number> | undefined): string {
  const total = names?.[p.name] ?? 0;
  const ord = p.ord ?? total + 1;
  if (Math.max(total, ord) < 2) return '';
  return ord === 1 ? (sexOf(p) === 'f' ? 'Ire' : 'Ier') : roman(ord);
}

/** « Jehan III », ou le prénom seul ; les JoJo de la Maison Joestar portent la marque de l'étoile. */
export function regnalName(p: Ranked, names: Record<string, number> | undefined): string {
  const r = regnal(p, names);
  const n = r ? `${p.name} ${r}` : p.name;
  return isJojo(p.name) ? `⭐ ${n}` : n;
}

/** Rangs des sauvegardes d'avant la numérotation, recalculés dans l'ordre de la généalogie. */
export function rebuildRanks(s: GameState): void {
  const c: Record<string, number> = {};
  const rank = (p: Ranked) => { p.ord = (c[p.name] ?? 0) + 1; c[p.name] = p.ord; };
  for (const a of s.ancestors) rank(a);
  rank(s.hero);
  const byId = new Map<number, number | undefined>(s.ancestors.map((a) => [a.id, a.ord]));
  byId.set(s.hero.id, s.hero.ord);
  for (const e of s.echoes) e.ord = byId.get(e.heroId);
  if (s.succession) {
    s.succession.ancestor.ord = byId.get(s.succession.ancestor.id);
    s.succession.newEcho.ord = byId.get(s.succession.newEcho.heroId);
  }
  s.lineage.names = c;
}
