import { describe, expect, it, test } from 'vitest';
import { ACTS, type ActId } from '../src/engine/data';
import { DailyRun, dailySetup, decodeRun, encodeRun, replay, verifyCode } from '../src/engine/daily';
import { ecoHealth, ecoStep, newEco } from '../src/engine/ecosystem';
import { activeEvent, upcomingEvents } from '../src/engine/events';
import { confirmSuccession, newRuntime, setActivity, startLife, tick } from '../src/engine/game';
import { exportSave, importSave } from '../src/engine/save';
import { newGame } from '../src/engine/state';

function playDaily(date: string, plan: (t: number, run: DailyRun) => ActId | null) {
  const run = new DailyRun(dailySetup(date));
  while (!run.done) {
    const a = plan(run.tickN * 0.1, run);
    if (a !== run.life.act) run.setAct(a);
    run.step();
  }
  return run;
}

describe('écosystème', () => {
  test('revient à l\'équilibre après perturbation', () => {
    const e = newEco();
    e.G = 70;
    for (let i = 0; i < 900; i++) ecoStep(e, 1);
    expect(ecoHealth(e)).toBeGreaterThan(0.9);
  });
});

describe('défi du jour', () => {
  test('setup déterministe', () => {
    expect(dailySetup('2026-11-12')).toEqual(dailySetup('2026-11-12'));
    expect(JSON.stringify(dailySetup('2026-11-12'))).not.toEqual(JSON.stringify(dailySetup('2026-11-13')));
  });

  test('replay et code vérifiable', () => {
    const run = playDaily('2026-11-12', (t) => (t < 30 ? 'cultiver' : t < 60 ? 'commercer' : 'etudier'));
    const score = run.score();
    expect(score).toBeGreaterThan(0);
    expect(replay('2026-11-12', run.actions)).toBe(score);
    const code = encodeRun('2026-11-12', run.actions, score);
    expect(decodeRun(code)!.actions).toEqual(run.actions);
    expect(verifyCode(code)!.ok).toBe(true);
    const fake = encodeRun('2026-11-12', run.actions, score + 50);
    expect(verifyCode(fake)!.ok).toBe(false);
    expect(verifyCode('n\'importe quoi')).toBeNull();
  });

  test('calibrage des stratégies', () => {
    const dates = ['2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15', '2026-11-16', '2026-11-17'];
    const strategies: Record<string, (t: number, r: DailyRun) => ActId | null> = {
      rien: () => null,
      cultiver: () => 'cultiver',
      chasser: () => 'chasser',
      chaine: (t, r) => (t < 25 ? 'cultiver' : t < 55 ? (r.res.vivres > 1 ? 'commercer' : 'cultiver') : r.res.or > 1 ? 'etudier' : 'commercer'),
      commerce: (t, r) => (r.res.vivres > 3 || t > 5 ? (r.res.vivres > 0.5 ? 'commercer' : 'chasser') : 'chasser'),
      mediter: () => 'mediter',
    };
    const out: Record<string, number[]> = {};
    for (const [k, f] of Object.entries(strategies)) out[k] = dates.map((d) => playDaily(d, f).score());
    if (process.env.BAL) console.log(JSON.stringify(out));
    expect(out.rien.every((x) => x < 100)).toBe(true);
  });
});

describe('partie', () => {
  test('cycle de vie complet → succession → Écho rejoué', () => {
    const s = newGame(0, 1);
    const rt = newRuntime();
    rt.online = false;
    startLife(s);
    setActivity(s, 'cultiver');
    let now = 0;
    while (s.life) { now += 100; tick(s, rt, 0.1, now); }
    expect(s.succession).not.toBeNull();
    const sc = s.succession!;
    expect(sc.newEcho.acts.length).toBeGreaterThanOrEqual(59);
    expect(sc.vocationEarned?.act).toBe('cultiver');
    confirmSuccession(s, 0, [sc.newEcho.id]);
    expect(s.echoes.length).toBe(1);
    expect(s.hero.gen).toBe(2);
    const v0 = s.res.vivres;
    for (let i = 0; i < 100; i++) { now += 100; tick(s, rt, 0.1, now); }
    expect(s.res.vivres).toBeGreaterThan(v0); // l'Écho produit seul
    expect(ACTS.length).toBe(5);
  });

  test('sauvegarde export/import', () => {
    const s = newGame(0, 3);
    s.lineage.name = 'Dupré-Éléonore';
    const back = importSave(exportSave(s))!;
    expect(back.lineage.name).toBe('Dupré-Éléonore');
    expect(back.hero).toEqual(s.hero);
  });
});

describe('événements', () => {
  test('planning identique pour tous', () => {
    const t = Date.UTC(2026, 10, 12, 12, 10);
    const e = activeEvent(t)!;
    expect(e.key).toBe('2026-11-12T12');
    expect(activeEvent(Date.UTC(2026, 10, 12, 13, 0))).toBeNull();
    expect(upcomingEvents(t, 4).length).toBe(4);
  });
});

describe('enregistrement de la vie', () => {
  it('enregistre exactement une entrée par seconde, même si la vie est rallongée', () => {
    for (const extra of [0, 30]) {
      const s = newGame(0, 42);
      const rt = newRuntime();
      rt.online = false;
      startLife(s);
      setActivity(s, 'cultiver');
      const dur = s.life!.dur + extra;
      let n = 0;
      while (s.life) {
        if (n === 50 && extra) s.life.dur += extra;
        tick(s, rt, 0.1, 0);
        n++;
      }
      expect(s.succession!.newEcho.acts.length).toBe(dur);
    }
  });
});
