import { describe, expect, test } from 'vitest';
import { ECO_EQ, ecoRegen, ecoStep, harmonyMult, newEco, type Eco } from '../src/engine/ecosystem';
import { dailySetup, DailyRun, decodeRun, encodeRun, replay } from '../src/engine/daily';
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

describe('écosystème (0.4 : Récolter)', () => {
  test('récolter fait pousser la Flore et prélève le Gibier', () => {
    const { eco } = sim([['cultiver', 1, 1]]);
    expect(eco.F).toBeGreaterThan(ECO_EQ.F);
    expect(eco.G).toBeLessThan(ECO_EQ.G);
  });

  test('sans Prédateurs (0.4), le Domaine laissé libre reste à son équilibre', () => {
    const { eco } = sim([], 600);
    expect(eco.F).toBeCloseTo(ECO_EQ.F, 0);
    expect(eco.G).toBeCloseTo(ECO_EQ.G, 0);
  });

  test('des Échos puissants dégradent le Domaine, qui se dérègle sans s\'effondrer', () => {
    const light = sim([['cultiver', 1, 1]]);
    const heavy = sim([['cultiver', 5, 1], ['cultiver', 5, 0.6], ['cultiver', 5, 0.6]]);
    // [MESURÉ] Harmonie ×1,26 contre ×1,29 sur 10 min (l'ancienne chasse seule tombait sous ×0,75) : en
    // Équilibre, on ne chasse que le surplus de Gibier. Épuiser les hardes passe par la Battue (consignes).
    expect(harmonyMult(heavy.eco)).toBeLessThan(harmonyMult(light.eco) - 0.02);
    // Comme l'ancien Cultiver, la récolte croît presque comme la puissance (×15 ici) ; le Domaine la borne
    // (Harmonie, rendement plafonné), il ne l'écrase pas : c'est la Battue qui épuise les hardes.
    expect(heavy.got.vivres / 15).toBeLessThan(light.got.vivres * 1.3);
    expect(heavy.eco.G).toBeGreaterThan(1);
  });

  test('la puissance pèse sur le Domaine : un héros ×5 prélève plus qu\'un héros ×1', () => {
    expect(sim([['cultiver', 5, 1]]).eco.G).toBeLessThan(sim([['cultiver', 1, 1]]).eco.G - 1);
  });

  test('le Garde forestier régénère sans neutraliser la pression', () => {
    const heavy: [ActId, number, number][] = [['cultiver', 5, 1], ['cultiver', 5, 0.6], ['cultiver', 5, 0.6]];
    const none = sim(heavy);
    const garde = sim(heavy, 600, 0.04);
    expect(harmonyMult(garde.eco)).toBeGreaterThan(harmonyMult(none.eco));
    expect(harmonyMult(garde.eco)).toBeLessThan(1.3);
  });
});

describe('remise à zéro de la 0.1.0', () => {
  test('les codes du Destin d\'avant la sortie ne sont plus reconnus', () => {
    const run = new DailyRun(dailySetup('2026-11-14'));
    while (!run.done) { run.setAct('cultiver'); run.step(); }
    const code = encodeRun('2026-11-14', run.actions, run.score());
    const d = decodeRun(code)!;
    expect(replay(d.date, d.actions)).toBe(run.score());
    // un code au format d'avant la sortie (préfixe KI1) est refusé
    expect(decodeRun(btoa('KI1|2026-11-14|0x|10').replace(/=+$/, ''))).toBeNull();
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
