import { describe, expect, it, test } from 'vitest';
import { ACTS, FEMININE_NAMES, FIRST_NAMES, TRAIT, acc, sexFor, traitName, vocationName, type ActId } from '../src/engine/data';
import { DailyRun, dailySetup, decodeRun, encodeRun, replay, verifyCode } from '../src/engine/daily';
import { ecoHealth, ecoStep, newEco } from '../src/engine/ecosystem';
import { activeEvent, upcomingEvents } from '../src/engine/events';
import { confirmSuccession, isPaused, newRuntime, resumeLife, setActivity, startLife, tick, vocationOutlook } from '../src/engine/game';
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

  test('la vie ne s\'écoule que pendant une activité, les Échos continuent', () => {
    const s = newGame(0, 1);
    const rt = newRuntime();
    rt.online = false;
    startLife(s);
    expect(s.life!.act).toBe('cultiver'); // la vie démarre seule
    let now = 0;
    while (s.life) { now += 100; tick(s, rt, 0.1, now); }
    confirmSuccession(s, 0, [s.succession!.newEcho.id]);
    expect(s.echoes[0].acts.includes(-1)).toBe(false);
    setActivity(s, null);
    expect(isPaused(s)).toBe(true);
    const t0 = s.life!.t, v0 = s.res.vivres;
    for (let i = 0; i < 300; i++) { now += 100; tick(s, rt, 0.1, now); }
    expect(s.life!.t).toBe(t0); // sablier figé
    expect(s.life!.rec.length).toBe(0); // rien n'est enregistré
    expect(s.res.vivres).toBeGreaterThan(v0); // l'Écho produit toujours
    s.life!.lastAct = 'chasser';
    resumeLife(s);
    expect(s.life!.act).toBe('chasser');
  });

  test('l\'héritier commence par l\'activité de sa vocation', () => {
    const s = newGame(0, 2);
    s.hero.vocation = { act: 'chasser', tier: 2 };
    startLife(s);
    expect(s.life!.act).toBe('chasser');
    s.hero.vocation = { act: 'mediter', tier: 1 }; // pas encore débloquée
    startLife(s);
    expect(s.life!.act).toBe('cultiver');
  });

  test('une vie en pause sauvegardée repart au chargement', () => {
    const s = newGame(0, 4);
    startLife(s);
    setActivity(s, 'chasser');
    setActivity(s, null);
    const back = importSave(exportSave(s))!;
    resumeLife(back);
    expect(back.life!.act).toBe('chasser');
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

describe('Échos et événements', () => {
  /** Premier créneau « Marée d'or » à partir d'une date donnée. */
  function findMaree(): number {
    let t = Date.UTC(2026, 10, 1);
    for (let i = 0; i < 400; i++, t += 4 * 3600_000) {
      const w = upcomingEvents(t, 1)[0];
      if (w.def.id === 'maree') return w.start + 60_000;
    }
    throw new Error('pas de Marée');
  }

  test('le ×3 d\'une Marée d\'or ne gonfle ni la puissance ni la valeur de l\'Écho', () => {
    const play = (online: boolean) => {
      const s = newGame(0, 7);
      s.unlocked.push('commercer');
      s.res.vivres = 1e6;
      const rt = newRuntime();
      rt.online = online;
      startLife(s);
      setActivity(s, 'commercer');
      let now = findMaree();
      while (s.life) { now += 100; tick(s, rt, 0.1, now); }
      return s.succession!;
    };
    const ev = play(true), calm = play(false);
    expect(ev.ancestor.value).toBeGreaterThan(calm.ancestor.value * 2.5); // la vraie vie a bien profité du ×3
    expect(ev.newEcho.pow).toEqual(calm.newEcho.pow); // l'Écho rejoue à puissance normale
    expect(ev.newEcho.value).toBeCloseTo(calm.newEcho.value, 3); // et sa valeur n'est pas gonflée
  });
});

describe('pronostic de vocation', () => {
  test('suit le seuil de la moitié de la vie', () => {
    const s = newGame(0, 5);
    startLife(s);
    const life = s.life!;
    const dur = life.dur;
    life.t = dur * 0.3; life.timeIn.cultiver = dur * 0.3;
    let o = vocationOutlook(life, s.hero)!;
    expect(o.state).toBe('onTrack');
    expect(o.act).toBe('cultiver');
    expect(o.need).toBeCloseTo(dur * 0.2);
    life.t = dur * 0.55; life.timeIn.cultiver = dur * 0.55;
    o = vocationOutlook(life, s.hero)!;
    expect(o.state).toBe('secured');
    expect(o.result).toEqual({ act: 'cultiver', tier: 1 });
  });

  test('annonce une vocation affaiblie quand le seuil devient inatteignable', () => {
    const s = newGame(0, 6);
    s.hero.vocation = { act: 'chasser', tier: 3 };
    startLife(s);
    const life = s.life!;
    const dur = life.dur;
    life.t = dur * 0.9;
    life.timeIn.chasser = dur * 0.3; life.timeIn.cultiver = dur * 0.3; life.timeIn.commercer = dur * 0.3;
    const o = vocationOutlook(life, s.hero)!;
    expect(o.state).toBe('lost');
    expect(o.result).toEqual({ act: 'chasser', tier: 2 });
  });

  test('pronostic cohérent avec le résultat réel en fin de vie', () => {
    const s = newGame(0, 8);
    const rt = newRuntime();
    rt.online = false;
    startLife(s);
    let now = 0, i = 0;
    while (s.life) {
      setActivity(s, (i++ % 10) < 6 ? 'cultiver' : 'chasser');
      const last = vocationOutlook(s.life, s.hero);
      now += 100; tick(s, rt, 0.1, now);
      if (!s.life) expect(last?.result).toEqual(s.succession!.vocationEarned);
    }
  });
});

describe('genre des personnages', () => {
  it('chaque prénom féminin existe dans FIRST_NAMES, et il y a des deux', () => {
    for (const n of FEMININE_NAMES) expect(FIRST_NAMES).toContain(n);
    expect(FEMININE_NAMES.size).toBeGreaterThan(5);
    expect(FIRST_NAMES.length - FEMININE_NAMES.size).toBeGreaterThan(5);
  });

  it('le genre est fixé à la naissance et suit le prénom, jusqu\'aux héritiers', () => {
    const s = newGame(0, 42);
    expect(s.hero.sex).toBe(sexFor(s.hero.name));
    const rt = newRuntime();
    startLife(s);
    let now = 0;
    while (!s.succession) { now += 100; tick(s, rt, 0.1, now); }
    const sc = s.succession!;
    expect(sc.ancestor.sex).toBe(s.hero.sex);
    expect(sc.newEcho.sex).toBe(s.hero.sex);
    for (const h of sc.heirs) expect(h.sex).toBe(sexFor(h.name));
  });

  it('les anciennes sauvegardes sans genre le retrouvent par le prénom', () => {
    const s = newGame(0, 7);
    s.hero.name = 'Mahaut';
    delete (s.hero as { sex?: string }).sex;
    const back = importSave(exportSave(s))!;
    expect(back.hero.sex).toBe('f');
  });

  it('accords des traits, vocations et formules', () => {
    const f = { name: 'Iseult' }, m = { name: 'Tristan' };
    expect(acc(f, 'premier du nom', 'première du nom')).toBe('première du nom');
    expect(acc(m, 'premier du nom', 'première du nom')).toBe('premier du nom');
    expect(traitName(TRAIT.elu, f)).toBe('Élue');
    expect(traitName(TRAIT.elu, m)).toBe('Élu');
    expect(traitName(TRAIT.elu)).toBe('Élu / Élue');
    expect(traitName(TRAIT.robuste, f)).toBe('Robuste');
    expect(vocationName({ act: 'chasser', tier: 2 }, f, String)).toBe('Chasseresse 2');
    expect(vocationName({ act: 'mediter', tier: 1 }, f, String)).toBe('Mystique 1');
  });

  it('le Destin du jour reste identique (aucun tirage ajouté)', () => {
    // valeurs relevées avant l'ajout du genre : les codes partagés doivent rester valides
    const d = dailySetup('2026-01-01');
    expect(d.name).toBe('Tancrède');
    expect(d.traits).toEqual(['rat_biblio', 'prodige', 'distrait']);
  });
});
