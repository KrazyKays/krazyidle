// Domaine : écosystème Flore / Gibier (Lotka-Volterra amorti). Les Prédateurs ont disparu en 0.4 : ils
// restaient collés à leur équilibre et n'apportaient qu'une vigueur et des trophées invisibles (TERRE-2).
// L'optimum n'est pas le maximum : surexploiter fait osciller puis s'effondrer le système.
import type { ActId } from './data';

export interface Eco {
  F: number; // Flore
  G: number; // Gibier
}

export const ECO_EQ: Eco = { F: 62.5, G: 29 };

const rF = 0.15, K = 100, aFG = 0.002;
/**
 * Mortalité du Gibier : naturelle (mG) et due à sa propre densité (cG·G). Le second terme remplace les
 * Prédateurs, qui suivaient le Gibier (P ≈ 11,2/29 × G) : leur prélèvement 0,005·P·G valait ≈ 0,00193·G².
 * Une compensation constante (0,106) gardait l'équilibre mais pas ce frein, et le Gibier s'emballait quand
 * la Flore abonde (TERRE-2b : optimiseur −15 % de valeur, Harmonie −4 points).
 */
const bG = 0.1 / 60, mG = 0.05, cG = (0.005 * 11.2) / 29;

/**
 * Remplissage des jauges du Domaine (0 à 1) : chaque barre va de 0 à deux fois l'équilibre, qui tombe donc
 * au milieu pour les deux populations. « L'optimum n'est pas le maximum » se lit d'un coup d'œil : on vise
 * le centre, pas le plein (ECO-1).
 */
export function ecoGauge(e: Eco, k: keyof Eco): number {
  return Math.max(0, Math.min(1, e[k] / (2 * ECO_EQ[k])));
}

export function newEco(): Eco {
  return { ...ECO_EQ };
}

export function ecoStep(e: Eco, dt: number) {
  let left = dt;
  while (left > 0) {
    const h = Math.min(0.5, left);
    left -= h;
    const { F, G } = e;
    const dF = rF * F * (1 - F / K) - aFG * F * G + 0.1;
    const dG = bG * F * G - mG * G - cG * G * G + 0.05;
    e.F = clamp(F + dF * h, 0.5, 140);
    e.G = clamp(G + dG * h, 0.2, 140);
  }
}

/** Un héros ou un Écho puissant pèse davantage sur le Domaine (croissance logarithmique). */
export function ecoPressure(power: number): number {
  return 1 + 0.5 * Math.log(Math.max(1, power));
}

/** Régénération apportée par le Garde forestier (rappel vers l'équilibre, par seconde). */
export function ecoRegen(e: Eco, rate: number, dt: number) {
  if (rate <= 0) return;
  const k = 1 - Math.exp(-rate * dt);
  e.F += (ECO_EQ.F - e.F) * k;
  e.G += (ECO_EQ.G - e.G) * k;
}

/** Abondance relative de la Flore et du Gibier, bornée comme les rendements. */
const abundF = (e: Eco) => clamp(e.F / ECO_EQ.F, 0.2, 1.6);
const abundG = (e: Eco) => clamp(e.G / ECO_EQ.G, 0.05, 2.2);

/**
 * Récolter (0.4) : part de la chasse dans le travail de la terre. On chasse le surplus de Gibier :
 * ½ + 1,5·(G/G_éq − 1), soit moitié-moitié à l'équilibre, plus de chasse dès que les hardes abondent (toute la
 * récolte à 4/3 de l'équilibre), plus du tout sous 2/3. Retenue parmi cinq règles en mémoire puis trois en
 * campagne (lab/balance/terre/RESULTATS.md) : c'est celle qui garde le Domaine le plus proche de l'ancien
 * Cultiver (Harmonie −3,5 à −4 points, valeur produite +0 à +18 %).
 */
export function huntShare(e: Eco, posture: Posture = 'equilibre'): number {
  if (posture === 'semer') return 0;
  if (posture === 'battue') return 1;
  const g = e.G / ECO_EQ.G;
  return clamp(0.5 + 1.5 * (g - 1), 0, 1);
}

// --- Consignes du héros (0.4) ------------------------------------------------
/**
 * Le héros qui récolte choisit une consigne ; ses Échos, et lui-même hors ligne, restent en Équilibre.
 * Semer : tout aux champs, peu de Vivres tout de suite, la Flore pousse deux fois plus (le Gibier suit).
 * Battue : tout à la chasse, beaucoup de Vivres, les hardes s'épuisent. Alterner les deux, en lisant le
 * Domaine, rapporte plus qu'Équilibre ; tenir la Battue le ruine (calibrage : lab/balance/terre/).
 */
export type Posture = 'semer' | 'equilibre' | 'battue';
export const POSTURES: Posture[] = ['semer', 'equilibre', 'battue'];
export const POSTURE = {
  /** Semer : rendement des champs, et pousse de la Flore (×) */
  semerYield: 0.7,
  semerFlore: 3,
  /** Battue : rendement de la chasse (×) et prélèvement du Gibier (×) */
  battueYield: 3,
  battueGibier: 4,
};

/** Impact d'une activité sur l'écosystème. strength ≈ 1 pour le héros vivant. */
export function ecoImpact(e: Eco, act: ActId, strength: number, dt: number, posture: Posture = 'equilibre') {
  const s = strength * dt;
  switch (act) {
    case 'cultiver': {
      // Les champs font pousser la Flore, la chasse prélève le Gibier (anciennes activités Cultiver et Chasser).
      const h = huntShare(e, posture);
      const fl = posture === 'semer' ? POSTURE.semerFlore : 1;
      const gi = posture === 'battue' ? POSTURE.battueGibier : 1;
      e.F = Math.min(140, e.F + 0.35 * fl * (1 - h) * s);
      e.G = Math.max(0.2, e.G - 0.035 * gi * e.G * h * s);
      break;
    }
    case 'commercer':
      // les caravanes défrichent un peu
      e.F = Math.max(0.5, e.F - 0.08 * s);
      break;
    case 'mediter':
      e.F += (ECO_EQ.F - e.F) * 0.03 * s;
      e.G += (ECO_EQ.G - e.G) * 0.03 * s;
      break;
    default:
      break;
  }
}

/** 0..1 : proximité de l'équilibre (distance log). */
export function ecoHealth(e: Eco): number {
  const d = Math.log(e.F / ECO_EQ.F) ** 2 + Math.log(e.G / ECO_EQ.G) ** 2;
  return Math.exp(-d / 1.2);
}

/** Multiplicateur global d'Harmonie : 0.7 → 1.3 */
export function harmonyMult(e: Eco): number {
  return 0.7 + 0.6 * ecoHealth(e);
}

/** Facteur de rendement propre à l'activité (dépend des populations). */
export function ecoFactor(act: ActId, e: Eco, posture: Posture = 'equilibre'): number {
  if (act === 'cultiver') {
    if (posture === 'semer') return POSTURE.semerYield * abundF(e);
    if (posture === 'battue') return POSTURE.battueYield * abundG(e);
    const h = huntShare(e);
    return (1 - h) * abundF(e) + h * abundG(e);
  }
  return 1;
}

function clamp(x: number, a: number, b: number) {
  return x < a ? a : x > b ? b : x;
}
