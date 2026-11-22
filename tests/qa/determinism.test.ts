// QA — déterminisme de la partie et du Destin du jour.
import { describe, expect, test } from 'vitest';
import { ACTS } from '../../src/engine/data';
import { DailyRun, dailySetup, decodeRun, encodeRun, replay } from '../../src/engine/daily';
import { activeEvent, upcomingEvents } from '../../src/engine/events';
import { countyHouses } from '../../src/engine/alliances';
import { Rng } from '../../src/engine/rng';
import { clone, playRandom } from './helpers';

describe('déterminisme', () => {
  test('même graine + mêmes actions → état identique (1 h, dt 0,5)', () => {
    const a = playRandom({ seed: 5, seconds: 3600 }).s;
    const b = playRandom({ seed: 5, seconds: 3600 }).s;
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  test('graines différentes → parties différentes', () => {
    const a = playRandom({ seed: 5, seconds: 600 }).s;
    const b = playRandom({ seed: 6, seconds: 600 }).s;
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });

  test('reprendre depuis une copie sérialisée ne change pas la suite', () => {
    const mid = playRandom({ seed: 8, seconds: 900 });
    const c = clone(mid.s);
    const rtC = clone(mid.rt);
    const go = (s: typeof c, rt: typeof rtC) => playRandom({ seed: 99, seconds: 900, state: s, rt, start: mid.now }).s;
    expect(JSON.stringify(go(mid.s, mid.rt))).toBe(JSON.stringify(go(c, rtC)));
  });

  test('événements et maisons du comté ne dépendent que de l\'horloge UTC', () => {
    const t = Date.UTC(2026, 10, 16, 12, 10);
    expect(activeEvent(t)?.key).toBe('2026-11-16T12');
    expect(upcomingEvents(t, 12).map((w) => w.def.id)).toEqual(upcomingEvents(t, 12).map((w) => w.def.id));
    expect(countyHouses(t)).toEqual(countyHouses(t + 3 * 86400_000)); // même semaine (lundi → jeudi)
    expect(countyHouses(t)).not.toEqual(countyHouses(t + 7 * 86400_000));
  });
});

describe('Destin du jour : replay', () => {
  /** Partie au hasard, actions changées à des ticks quelconques (y compris plusieurs fois au même tick). */
  function randomRun(date: string, seed: number) {
    const run = new DailyRun(dailySetup(date));
    const rng = new Rng(seed);
    while (!run.done) {
      if (rng.chance(0.05)) run.setAct(rng.chance(0.1) ? null : rng.pick(ACTS));
      if (rng.chance(0.01)) run.setAct(rng.pick(ACTS)); // double changement dans le même tick
      run.step();
    }
    return run;
  }

  test('100 parties aléatoires sur 10 dates : le replay redonne toujours le score exact', () => {
    let n = 0;
    for (let d = 1; d <= 10; d++) {
      const date = `2026-11-${String(d).padStart(2, '0')}`;
      for (let k = 0; k < 10; k++) {
        const run = randomRun(date, d * 100 + k);
        const score = run.score();
        expect(replay(date, run.actions)).toBe(score);
        const dec = decodeRun(encodeRun(date, run.actions, score))!;
        expect(replay(dec.date, dec.actions)).toBe(score);
        n++;
      }
    }
    expect(n).toBe(100);
  });

  test('les actions enregistrées sont triées et sans doublon consécutif', () => {
    const run = randomRun('2026-11-14', 3);
    for (let i = 1; i < run.actions.length; i++) {
      expect(run.actions[i][0]).toBeGreaterThan(run.actions[i - 1][0]);
      expect(run.actions[i][1]).not.toBe(run.actions[i - 1][1]);
    }
  });

  test('le replay ne dépend pas de l\'état global (deux replays entrelacés)', () => {
    const r1 = randomRun('2026-11-14', 1), r2 = randomRun('2026-11-15', 2);
    const a = replay('2026-11-14', r1.actions);
    replay('2026-11-15', r2.actions);
    expect(replay('2026-11-14', r1.actions)).toBe(a);
  });
});
