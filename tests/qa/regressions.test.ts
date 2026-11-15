// Tests de régression des corrections de la phase 4 (une section par ligne de la feuille de route).
import { describe, expect, test } from 'vitest';
import { OFFLINE_MIN_SEC, newRuntime, setActivity, simulateOffline, startLife } from '../../src/engine/game';
import { newGame } from '../../src/engine/state';

describe('R1 — temps de jeu rattrapé (PBA-01, QA-06)', () => {
  test('un trou de 10 s est rattrapé quand on abaisse le seuil, pas avec le seuil de relance', () => {
    const mk = () => { const s = newGame(0, 3); startLife(s); setActivity(s, 'cultiver'); return s; };
    const a = mk(), b = mk();
    expect(simulateOffline(a, newRuntime(), 10, 10_000)).toBeNull();
    const rep = simulateOffline(b, newRuntime(), 10, 10_000, 5);
    expect(rep).not.toBeNull();
    expect(rep!.seconds).toBe(10);
    expect(b.stats.playTime).toBe(10);
    expect(b.res.vivres).toBeGreaterThan(0);
  });
  test('le seuil par défaut reste celui de la relance du jeu', () => {
    expect(OFFLINE_MIN_SEC).toBe(30);
  });
});
