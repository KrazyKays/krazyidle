import { describe, expect, test } from 'vitest';
import { ECO_EQ, ecoRegen, ecoStep, gameVigor, harmonyMult, newEco, trophyFactor, type Eco } from '../src/engine/ecosystem';
import { dailySetup, DailyRun, encodeRun, verifyCode } from '../src/engine/daily';
import { runActivity, type SimCtx } from '../src/engine/sim';
import { buyPartition } from '../src/engine/game';
import { importSave, exportSave } from '../src/engine/save';
import { newGame } from '../src/engine/state';
import type { ActId } from '../src/engine/data';

/** Simule le Domaine seul : chaque acteur = [activité, puissance, force écologique]. */
function sim(actors: [ActId, number, number][], secs = 600, regen = 0, eco: Eco = newEco()) {
  const res = { vivres: 1e12, or: 1e12, savoir: 1e12, essence: 0 };
  const got = { vivres: 0, or: 0 };
  const ctx: SimCtx = { res, eco, prodMult: () => harmonyMult(eco), ecoImpactMult: 1, onProduce: (r, a) => { if (r === 'vivres' || r === 'or') got[r] += a; } };
  for (let t = 0; t < secs; t += 0.1) {
    ecoStep(eco, 0.1);
    ecoRegen(eco, regen, 0.1);
    for (const [a, p, s] of actors) runActivity(ctx, a, p, s, 0.1, false);
  }
  return { eco, got };
}

describe('écosystème v2', () => {
  test('le héros qui chasse seul fait vraiment baisser le Gibier', () => {
    const { eco } = sim([['chasser', 1, 1]]);
    expect(eco.G).toBeLessThan(ECO_EQ.G * 0.8);
    // … sans effondrement des Prédateurs : ils suivent le Gibier
    expect(eco.P).toBeGreaterThan(ECO_EQ.P * 0.5);
  });

  test('les Prédateurs comptent : sans eux, la chasse rapporte moins', () => {
    const e = newEco();
    expect(gameVigor(e)).toBeCloseTo(1, 5);
    expect(gameVigor({ ...e, P: 0.1 })).toBeLessThan(0.6);
    expect(trophyFactor(e)).toBe(0);
    expect(trophyFactor({ ...e, P: ECO_EQ.P * 2 })).toBeGreaterThan(0.9);
  });

  test('des Prédateurs abondants rapportent des trophées en Or', () => {
    const { got } = sim([['chasser', 1, 1]], 30, 0, { ...newEco(), P: 30 });
    expect(got.or).toBeGreaterThan(0);
  });

  test('la surchasse par des Échos puissants épuise le Domaine', () => {
    const light = sim([['chasser', 1, 1]]);
    const heavy = sim([['chasser', 5, 1], ['chasser', 5, 0.6], ['chasser', 5, 0.6]]);
    expect(heavy.eco.G).toBeLessThan(5);
    expect(harmonyMult(heavy.eco)).toBeLessThan(0.75);
    // trois chasseurs ×5 ne rapportent pas 15 fois plus qu'un seul héros ×1
    expect(heavy.got.vivres).toBeLessThan(light.got.vivres * 3);
  });

  test('la puissance pèse sur le Domaine : un héros ×5 prélève plus qu\'un héros ×1', () => {
    expect(sim([['chasser', 5, 1]]).eco.G).toBeLessThan(sim([['chasser', 1, 1]]).eco.G - 3);
  });

  test('le Garde forestier régénère sans neutraliser la pression', () => {
    const heavy: [ActId, number, number][] = [['chasser', 5, 1], ['chasser', 5, 0.6], ['chasser', 5, 0.6]];
    const none = sim(heavy);
    const garde = sim(heavy, 600, 0.04);
    expect(garde.eco.G).toBeGreaterThan(none.eco.G);
    expect(harmonyMult(garde.eco)).toBeLessThan(1.1);
  });
});

describe('remise à zéro de la 0.1.0', () => {
  test('les codes du Destin d\'avant la sortie ne sont plus reconnus', () => {
    const run = new DailyRun(dailySetup('2026-11-14'));
    while (!run.done) { run.setAct('cultiver'); run.step(); }
    const code = encodeRun('2026-11-14', run.actions, run.score());
    expect(verifyCode(code)!.ok).toBe(true);
    // un code au format d'avant la sortie (préfixe KI1) est refusé
    expect(verifyCode(btoa('KI1|2026-11-14|0x|10').replace(/=+$/, ''))).toBeNull();
  });
});

describe('héraldique', () => {
  test('une sauvegarde sans champs d\'héraldique reçoit l\'écu plein', () => {
    const s = newGame(0, 3) as any;
    delete s.partitions;
    delete s.lineage.partition;
    const back = importSave(exportSave(s))!;
    expect(back.partitions).toEqual(['plein']);
    expect(back.lineage.partition).toBe('plein');
  });

  test('débloquer une partition coûte des Éclats et l\'applique', () => {
    const s = newGame(0, 3);
    expect(buyPartition(s, 'parti')).toBe(false);
    s.eclats = 5;
    expect(buyPartition(s, 'parti')).toBe(true);
    expect(s.eclats).toBe(2);
    expect(s.lineage.partition).toBe('parti');
    expect(buyPartition(s, 'parti')).toBe(false);
  });
});
