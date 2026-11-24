// Textes de la carte d'événement. Purs (aucun DOM) : testés sous Vitest.
import { EVENT_TIERS } from '../engine/game';
import type { EventProgress } from '../engine/state';

const MEDALS = ['🥉', '🥈', '🥇'];

/**
 * Ligne d'objectif de l'événement : la médaille visée et le pourcentage du chemin vers elle.
 * Un pourcentage entier se lit mieux que « 12.4K / 30.0K équivalent » et garde une longueur stable.
 */
export function eventGoalLine(ep: EventProgress | undefined): string {
  if (!ep) return `Vers ${MEDALS[0]} : 0 %`;
  if (ep.tier >= 3) return `${MEDALS[2]} Or atteint !`;
  const goal = ep.target * EVENT_TIERS[ep.tier];
  const pct = Math.max(0, Math.min(99, Math.floor((ep.progress / goal) * 100)));
  return `Vers ${MEDALS[ep.tier]} : ${pct} %`;
}
