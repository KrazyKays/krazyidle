// Nouveautés du Codex (0.6) : ce qui a été obtenu depuis la dernière visite, gardé dans la sauvegarde.
// Avant, la mémoire des pastilles vivait en session : un surnom gagné pendant le rattrapage hors ligne
// ou juste avant un rechargement n'était jamais signalé, et l'ouverture du Codex effaçait tout d'un coup.
import type { GameState } from './state';

/** Une clé par entrée du Codex : surnom (`e:`), haut fait (`f:`), page d'Almanach (`a:`), compagnonnage (`c:`, 0.8). */
export function codexKeys(s: GameState): string[] {
  return [
    ...Object.keys(s.compagnons ?? {}).map((id) => `c:${id}`),
    ...Object.keys(s.epithets ?? {}).map((id) => `e:${id}`),
    ...Object.keys(s.feats ?? {}).map((id) => `f:${id}`),
    ...(s.almanach ?? []).map((id) => `a:${id}`),
  ];
}

/** Entrées obtenues depuis la dernière visite du Codex. */
export function codexFresh(s: GameState): string[] {
  const seen = new Set(s.codexSeen ?? []);
  return codexKeys(s).filter((k) => !seen.has(k));
}

/** Le joueur ouvre le Codex : les nouveautés sont vues ; renvoie celles qu'il découvre maintenant. */
export function markCodexSeen(s: GameState): string[] {
  const fresh = codexFresh(s);
  if (fresh.length) s.codexSeen = [...(s.codexSeen ?? []), ...fresh];
  return fresh;
}
