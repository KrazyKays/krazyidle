// QA — événements mondiaux : objectif adaptatif, paliers, Éclats, bornes horaires.
import { describe, expect, test } from 'vitest';
import { EVENTS } from '../../src/engine/data';
import { activeEvent, upcomingEvents } from '../../src/engine/events';
import { confirmSuccession, newRuntime, setActivity, tick, type Runtime } from '../../src/engine/game';
import type { GameState } from '../../src/engine/state';
import { clone, playRandom } from './helpers';

/** Première fenêtre « Moisson dorée » (objectif Vivres, Cultiver ×3) après le 16/11/2026. */
function moisson() {
  const w = upcomingEvents(Date.UTC(2026, 10, 16), 200).find((x) => x.def.id === 'moisson')!;
  expect(w).toBeTruthy();
  return w;
}

/** Partie avancée (2 h), héros vivant qui cultive. */
function lateGame(): GameState {
  const { s } = playRandom({ seed: 31, seconds: 2 * 3600 });
  if (s.succession) confirmSuccession(s, 0, [...s.echoes, s.succession.newEcho].slice(-2).map((e) => e.id));
  setActivity(s, 'cultiver');
  return s;
}

/** Joue `sec` secondes à 0,1 s à partir de `from`. */
function play(s: GameState, rt: Runtime, from: number, sec: number) {
  for (let i = 0; i < sec * 10; i++) {
    tick(s, rt, 0.1, from + i * 100);
    if (s.succession) confirmSuccession(s, 0, s.echoes.map((e) => e.id).slice(0, 2));
    if (s.life && s.life.act !== 'cultiver') setActivity(s, 'cultiver');
  }
}

describe('calendrier', () => {
  test('6 fenêtres de 45 min par jour, aux heures UTC 0/4/8/12/16/20', () => {
    const d = Date.UTC(2026, 10, 16);
    for (const h of [0, 4, 8, 12, 16, 20]) {
      expect(activeEvent(d + h * 3600_000)?.key.endsWith(String(h).padStart(2, '0'))).toBe(true);
      expect(activeEvent(d + h * 3600_000 + 44 * 60_000 + 59_999)).not.toBeNull();
      expect(activeEvent(d + h * 3600_000 + 45 * 60_000)).toBeNull();
      expect(activeEvent(d + h * 3600_000 - 1)).toBeNull();
    }
  });
  test('les 6 types d\'événement sont tirés sur un mois', () => {
    const ids = new Set(upcomingEvents(Date.UTC(2026, 10, 1), 180).map((w) => w.def.id));
    expect(ids.size).toBe(EVENTS.length);
  });
});

describe('objectif adaptatif', () => {
  test('joueur présent avant le début : l\'objectif suit son économie', () => {
    const w = moisson();
    const s = lateGame();
    const rt = newRuntime();
    play(s, rt, w.start - 60_000, 60.1);
    expect(s.events[w.key].target).toBeGreaterThan(1000);
  });

  // BUG QA-03 : ensureEventProgress (src/engine/game.ts:256-262) fixe l'objectif une fois pour toutes
  // à partir de rt.rate, la moyenne glissante de production. Si le premier tick de l'événement se fait
  // avec un Runtime neuf (jeu relancé moins de 30 s après la dernière sauvegarde : pas de rattrapage,
  // src/main.ts:65), rt.rate vaut 0 et l'objectif tombe au minimum (60 Vivres), quelle que soit l'économie.
  // Les trois paliers (6 ✦) tombent alors en quelques secondes.
  test.fails('BUG QA-03 : un Runtime neuf au début de l\'événement ne ramène pas l\'objectif au minimum', () => {
    const w = moisson();
    const s = lateGame();
    const warm = clone(s);
    const rtW = newRuntime();
    play(warm, rtW, w.start - 60_000, 60.1);
    const rtC = newRuntime(); // relance du jeu
    play(s, rtC, w.start, 0.1);
    expect(s.events[w.key].target).toBeGreaterThan(warm.events[w.key].target * 0.5);
  });

  test('reproduction QA-03 : objectif minimal et palier Or en moins d\'une minute', () => {
    const w = moisson();
    const s = lateGame();
    const e0 = s.eclats;
    const rtC = newRuntime();
    play(s, rtC, w.start, 0.1);
    expect(s.events[w.key].target).toBe(60);
    let t = 0;
    while (s.events[w.key].tier < 3 && t < 600) { play(s, rtC, w.start + 100 + t * 1000, 1); t++; }
    expect(s.events[w.key].tier).toBe(3);
    expect(t).toBeLessThan(60);
    expect(s.eclats - e0).toBeGreaterThanOrEqual(6);
  });

  test('l\'objectif n\'est fixé qu\'une fois par fenêtre : quitter et revenir ne le réinitialise pas', () => {
    const w = moisson();
    const s = lateGame();
    const rt = newRuntime();
    play(s, rt, w.start - 30_000, 40);
    const target = s.events[w.key].target;
    play(s, newRuntime(), w.start + 20 * 60_000, 1);
    expect(s.events[w.key].target).toBe(target);
  });
});
