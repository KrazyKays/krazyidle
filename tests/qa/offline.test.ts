// QA — hors ligne (pas 1 s) contre en ligne (pas 0,1 s), sensibilité au pas, plafond hors ligne.
import { describe, expect, test } from 'vitest';
import { RES, RES_INFO, type ActId } from '../../src/engine/data';
import { confirmSuccession, newRuntime, offlineCapSec, setActivity, simulateOffline, tick } from '../../src/engine/game';
import type { GameState } from '../../src/engine/state';
import { clone, playRandom, T0 } from './helpers';

const value = (s: GameState) => RES.reduce((a, r) => a + s.totalEver[r] * RES_INFO[r].value, 0);

/** Une partie de milieu de jeu : 1 h de joueur aléatoire, puis héros vivant. */
function midGame(seed: number) {
  const { s } = playRandom({ seed, seconds: 3600 });
  if (s.succession) confirmSuccession(s, 0, [...s.echoes, s.succession.newEcho].slice(-2).map((e) => e.id));
  return s;
}

/** Avance `sec` secondes à pas dt, hors ligne (sans événements), sans intervention du joueur. */
function runFor(s: GameState, sec: number, dt: number, act?: ActId) {
  const rt = newRuntime();
  rt.online = false;
  if (act && s.life) setActivity(s, act);
  const n = Math.round(sec / dt);
  for (let i = 0; i < n; i++) tick(s, rt, dt, T0 + i * dt * 1000);
  return s;
}

describe('hors ligne vs en ligne', () => {
  for (const seed of [1, 2, 3, 4]) {
    test(`graine ${seed} : 30 min hors ligne (pas 1 s) ≈ 30 min en ligne (pas 0,1 s) à ±2 %`, () => {
      const base = midGame(seed);
      const on = runFor(clone(base), 1800, 0.1);
      const off = clone(base);
      const rep = simulateOffline(off, newRuntime(), 1800, T0 + 1800_000)!;
      expect(rep.seconds).toBe(1800);
      const gOn = value(on) - value(base), gOff = value(off) - value(base);
      // [MESURÉ] écarts observés : < 0,2 % sur ces graines
      expect(Math.abs(gOff / gOn - 1)).toBeLessThan(0.02);
      expect(off.hero.gen).toBe(on.hero.gen);
    });
  }

  // Une graine seule varie de ±4 % (é.-t. mesuré sur 20 graines, lab/balance/r10/offline-hunt.ts) : le test
  // porte sur la moyenne de 8 graines. Biais connu : la chasse perd ~3 % au pas de 1 s (QA, confrontation B4).
  test('lignée de chasseurs (Affût) : écart moyen hors ligne / en ligne borné à ±5 % (8 graines)', () => {
    const gaps: number[] = [];
    for (const seed of [11, 12, 13, 14, 15, 16, 17, 18]) {
      const base = midGame(seed);
      for (const e of base.echoes) { e.acts = e.acts.map(() => 1); }
      const on = runFor(clone(base), 1200, 0.1, 'chasser');
      const off = clone(base);
      if (off.life) setActivity(off, 'chasser');
      simulateOffline(off, newRuntime(), 1200, T0 + 1200_000);
      gaps.push((value(off) - value(base)) / (value(on) - value(base)) - 1);
    }
    const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    expect(Math.abs(mean)).toBeLessThan(0.05);
  });
});

describe('sensibilité au pas (même partie, mêmes actions)', () => {
  test('dt 0,1 / 0,5 / 1 : valeur produite en 20 min à ±3 %', () => {
    const base = midGame(21);
    const g = [0.1, 0.5, 1].map((dt) => value(runFor(clone(base), 1200, dt)) - value(base));
    expect(Math.abs(g[1] / g[0] - 1)).toBeLessThan(0.03);
    expect(Math.abs(g[2] / g[0] - 1)).toBeLessThan(0.03);
  });

  test('une vie complète enregistre dur entrées quel que soit le pas', () => {
    for (const dt of [0.1, 0.25, 0.3, 0.5, 0.7, 1]) {
      const s = midGame(3);
      const dur = s.life!.dur;
      runFor(s, dur + 5, dt);
      expect(s.succession, `dt=${dt}`).toBeTruthy();
      expect(s.succession!.newEcho.acts.length, `dt=${dt}`).toBe(dur);
    }
  });
});

describe('plafond hors ligne', () => {
  test('6 h de base, +2 h par niveau de Patience ; au-delà, le temps est perdu', () => {
    const s = midGame(5);
    s.upgrades.patience = 0; // le joueur aléatoire a pu en acheter
    expect(offlineCapSec(s)).toBe(6 * 3600);
    s.upgrades.patience = 2;
    expect(offlineCapSec(s)).toBe(10 * 3600);
    s.upgrades.patience = 9;
    expect(offlineCapSec(s)).toBe(24 * 3600);
    s.upgrades.patience = 0;
    const rep = simulateOffline(clone(s), newRuntime(), 48 * 3600, T0)!;
    expect(rep.seconds).toBe(6 * 3600);
  });

  test('moins de 30 s : pas de simulation hors ligne', () => {
    const s = midGame(5);
    expect(simulateOffline(s, newRuntime(), 29.9, T0)).toBeNull();
  });

  test('hors ligne, les événements ne comptent pas (aucun Éclat, aucun progrès)', () => {
    const s = midGame(6);
    const e0 = s.eclats;
    // 12 h UTC : fenêtre d'événement traversée pendant l'absence
    simulateOffline(s, newRuntime(), 3600, Date.UTC(2026, 10, 16, 12, 30));
    expect(Object.keys(s.events).filter((k) => k.startsWith('2026-11-16T12'))).toEqual([]);
    expect(s.eclats - e0).toBeGreaterThanOrEqual(0); // seuls les surnoms peuvent en rapporter
    const rt = newRuntime();
    expect(rt.online).toBe(true);
  });

  test('hors ligne, la vie s\'achève et la succession reste en attente ; les Échos bouclent', () => {
    const s = midGame(7);
    const loops0 = s.echoes.reduce((a, e) => a + e.loops, 0);
    const rep = simulateOffline(s, newRuntime(), 2 * 3600, T0)!;
    expect(rep.died).toBe(true);
    expect(s.succession).toBeTruthy();
    expect(s.life).toBeNull();
    if (s.echoes.length) expect(rep.loops).toBeGreaterThan(0);
    expect(s.echoes.reduce((a, e) => a + e.loops, 0) - loops0).toBe(rep.loops);
  });
});
