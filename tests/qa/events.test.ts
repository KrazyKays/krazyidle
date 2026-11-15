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

  // QA-03 (corrigé en R5) : l'objectif était fixé sur rt.rate, qui repart de 0 avec un Runtime neuf
  // (jeu relancé pendant la fenêtre) : il tombait au plancher (60) et les 3 paliers en quelques secondes.
  // Le débit est désormais mémorisé dans la sauvegarde (stats.valueRate).
  test('QA-03 : à historique identique, une relance pendant la fenêtre donne le même objectif qu\'une session continue', () => {
    const w = moisson();
    const s = lateGame();
    const rt = newRuntime();
    play(s, rt, w.start - 120_000, 119.9); // deux minutes de culture juste avant la fenêtre
    const relaunched = clone(s);
    play(s, rt, w.start, 0.1); // session continue
    play(relaunched, newRuntime(), w.start, 0.1); // jeu relancé au début de la fenêtre
    const cont = s.events[w.key].target, cold = relaunched.events[w.key].target;
    // L'objectif en session continue repose sur une moyenne de ~3 s, bruitée ; la relance sur ~60 s.
    // On exige le même ordre de grandeur (le bug le divisait par ~5 000).
    expect(cold).toBeGreaterThan(cont * 0.5);
    expect(cold).toBeLessThan(cont * 2);
  });

  test('QA-03 : relancé pendant la fenêtre, le palier Or n\'est plus atteint en moins d\'une minute', () => {
    const w = moisson();
    const s = lateGame();
    const rtC = newRuntime();
    play(s, rtC, w.start, 0.1);
    expect(s.events[w.key].target).toBeGreaterThan(60);
    let t = 0;
    while (s.events[w.key].tier < 3 && t < 60) { play(s, rtC, w.start + 100 + t * 1000, 1); t++; }
    expect(s.events[w.key].tier).toBeLessThan(3);
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
