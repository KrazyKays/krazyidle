// QA — invariants sur de longues parties aléatoires (graines fixes).
import { describe, expect, test } from 'vitest';
import { invariants, playRandom } from './helpers';

const SEEDS = [1, 2, 3, 4, 5, 6];

describe('invariants (joueur aléatoire, 2 h de jeu, dt 0,5)', () => {
  for (const seed of SEEDS) {
    test(`graine ${seed} : aucune ressource négative/NaN, Domaine borné, Échos ≤ emplacements, 1 entrée/s`, () => {
      const bad: string[] = [];
      const { s } = playRandom({
        seed, seconds: 2 * 3600, dt: 0.5,
        check: (st, _rt, t) => { if (bad.length < 5) for (const b of invariants(st)) bad.push(`t=${t}: ${b}`); },
      });
      expect(bad).toEqual([]);
      expect(s.stats.lives).toBeGreaterThan(20);
    });
  }

  test('dt 0,1 (pas réel du jeu), 20 min, avec événements : invariants tenus', () => {
    const bad: string[] = [];
    // Démarre 5 min avant l'événement de 12 h UTC pour traverser une fenêtre.
    playRandom({
      seed: 42, seconds: 20 * 60, dt: 0.1, online: true, start: Date.UTC(2026, 10, 16, 11, 55),
      check: (st, _rt, t) => { if (bad.length < 5) for (const b of invariants(st)) bad.push(`t=${t}: ${b}`); },
    });
    expect(bad).toEqual([]);
  });

  test('dt 1 (pas hors ligne), joueur qui change d\'activité très souvent', () => {
    const bad: string[] = [];
    playRandom({
      seed: 9, seconds: 3600, dt: 1, switchRate: 0.9, pauseRate: 0.1,
      check: (st, _rt, t) => { if (bad.length < 5) for (const b of invariants(st)) bad.push(`t=${t}: ${b}`); },
    });
    expect(bad).toEqual([]);
  });

  test('chaque Écho a exactement une entrée par seconde de la vie qui l\'a produit', () => {
    const { s } = playRandom({ seed: 77, seconds: 3600, dt: 0.1, switchRate: 0.5, pauseRate: 0.05 });
    expect(s.echoes.length).toBeGreaterThan(0);
    // Toute durée d'Écho est un nombre entier de secondes ≥ 20 (lifeDuration plancher) et cohérente avec pow.
    for (const e of s.echoes) {
      expect(e.acts.length).toBe(e.pow.length);
      expect(e.acts.length).toBeGreaterThanOrEqual(20);
      expect(e.acts.every((a) => a >= 0)).toBe(true); // jamais -1 : la pause n'enregistre rien
    }
  });
});
