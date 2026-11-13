// Domaine : écosystème Flore / Gibier / Prédateurs (Lotka-Volterra amorti).
// L'optimum n'est pas le maximum : surexploiter fait osciller puis s'effondrer le système.
import type { ActId } from './data';

export interface Eco {
  F: number; // Flore
  G: number; // Gibier
  P: number; // Prédateurs
}

export const ECO_EQ: Eco = { F: 62.5, G: 29, P: 11.2 };

const rF = 0.15, K = 100, aFG = 0.002;
const bG = 0.1 / 60, mG = 0.05, cGP = 0.005;
const rP = 0.05, kP = ECO_EQ.P / ECO_EQ.G;

export function newEco(): Eco {
  return { ...ECO_EQ };
}

export function ecoStep(e: Eco, dt: number) {
  let left = dt;
  while (left > 0) {
    const h = Math.min(0.5, left);
    left -= h;
    const { F, G, P } = e;
    const dF = rF * F * (1 - F / K) - aFG * F * G + 0.1;
    const dG = bG * F * G - mG * G - cGP * G * P + 0.05;
    // La capacité d'accueil des Prédateurs suit le Gibier : déclin graduel au lieu d'un effondrement
    // exponentiel au moindre prélèvement.
    const dPp = rP * P * (1 - P / (kP * Math.max(G, 0.2))) + 0.02;
    e.F = clamp(F + dF * h, 0.5, 140);
    e.G = clamp(G + dG * h, 0.2, 140);
    e.P = clamp(P + dPp * h, 0.1, 100);
  }
}

/** Un héros ou un Écho puissant pèse davantage sur le Domaine (croissance logarithmique). */
export function ecoPressure(power: number): number {
  return 1 + 0.5 * Math.log(Math.max(1, power));
}

/** Les Prédateurs gardent les hardes saines. Sans eux, le Gibier s'affaiblit (0.55 → 1.13). */
export function gameVigor(e: Eco): number {
  return 0.55 + 0.45 * Math.min(1.3, e.P / ECO_EQ.P);
}

/** Or rapporté par Chasser (trophées) quand les Prédateurs pullulent, par unité de production. */
export const TROPHY_OR = 1.5;
export function trophyFactor(e: Eco): number {
  return clamp(e.P / ECO_EQ.P - 1, 0, 1.5);
}

/** Régénération apportée par le Garde forestier (rappel vers l'équilibre, par seconde). */
export function ecoRegen(e: Eco, rate: number, dt: number) {
  if (rate <= 0) return;
  const k = 1 - Math.exp(-rate * dt);
  e.F += (ECO_EQ.F - e.F) * k;
  e.G += (ECO_EQ.G - e.G) * k;
  e.P += (ECO_EQ.P - e.P) * k;
}

/** Impact d'une activité sur l'écosystème. strength ≈ 1 pour le héros vivant. */
export function ecoImpact(e: Eco, act: ActId, strength: number, dt: number) {
  const s = strength * dt;
  switch (act) {
    case 'cultiver':
      e.F = Math.min(140, e.F + 0.35 * s);
      break;
    case 'chasser':
      e.G = Math.max(0.2, e.G - 0.035 * e.G * s);
      e.P = Math.max(0.1, e.P - 0.001 * e.P * s);
      break;
    case 'commercer':
      // les caravanes défrichent un peu
      e.F = Math.max(0.5, e.F - 0.08 * s);
      break;
    case 'mediter':
      e.F += (ECO_EQ.F - e.F) * 0.03 * s;
      e.G += (ECO_EQ.G - e.G) * 0.03 * s;
      e.P += (ECO_EQ.P - e.P) * 0.03 * s;
      break;
    default:
      break;
  }
}

/** 0..1 : proximité de l'équilibre (distance log). */
export function ecoHealth(e: Eco): number {
  const d =
    Math.log(e.F / ECO_EQ.F) ** 2 + Math.log(e.G / ECO_EQ.G) ** 2 + Math.log(e.P / ECO_EQ.P) ** 2;
  return Math.exp(-d / 1.2);
}

/** Multiplicateur global d'Harmonie : 0.7 → 1.3 */
export function harmonyMult(e: Eco): number {
  return 0.7 + 0.6 * ecoHealth(e);
}

/** Facteur de rendement propre à l'activité (dépend des populations). */
export function ecoFactor(act: ActId, e: Eco): number {
  if (act === 'cultiver') return clamp(e.F / ECO_EQ.F, 0.2, 1.6);
  if (act === 'chasser') return clamp(e.G / ECO_EQ.G, 0.05, 2.2) * gameVigor(e);
  return 1;
}

function clamp(x: number, a: number, b: number) {
  return x < a ? a : x > b ? b : x;
}
