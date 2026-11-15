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

describe('R3 — import de sauvegarde validé (QA-02)', () => {
  test('les vraies sauvegardes restent importables à toutes les étapes d\'une partie', async () => {
    const { runBot } = await import('../bot');
    const { exportSave, importSave } = await import('../../src/engine/save');
    const { endLife } = await import('../../src/engine/game');
    for (const seed of [1, 2, 3]) {
      const { s } = runBot(1, seed);
      expect(importSave(exportSave(s))).not.toBeNull(); // en pleine vie, avec Échos et ancêtres
      endLife(s, 0);
      expect(s.succession).not.toBeNull();
      expect(importSave(exportSave(s))).not.toBeNull(); // succession en attente
    }
    const fresh = newGame(0, 9);
    expect(importSave(exportSave(fresh))).not.toBeNull(); // partie neuve, avant la cérémonie
  });
});

describe('R8 — « le Vénérable » et surnoms répétés (DATA-01, GD-04, PBA-07)', () => {
  const base = async () => {
    const { ACTS } = await import('../../src/engine/data');
    const share = Object.fromEntries(ACTS.map((a) => [a, 0])) as any;
    share.etudier = 0.6; share.commercer = 0.4;
    return {
      share, used: 2, switches: 5, harmonyAvg: 0.9, harmonyMin: 0.8, value: 100, parentValue: 100, bestBefore: 1000, gen: 30,
      traits: [], negTraits: 0, vocTier: 10, durRatio: 1, extended: false, spouse: null, eventTier: 0, builds: 0, game: 29, predators: 11,
    };
  };
  test('donné au passage au rang X, plus à chaque vie au rang X', async () => {
    const { pickEpithet } = await import('../../src/engine/epithets');
    const f = await base();
    expect(pickEpithet({ ...f, prevVocTier: 9 })?.id).toBe('venerable');
    expect(pickEpithet({ ...f, prevVocTier: 10 })?.id).not.toBe('venerable');
  });
  test('le surnom du parent n\'est pas redonné ; un autre surnom applicable est choisi', async () => {
    const { pickEpithet } = await import('../../src/engine/epithets');
    const f = await base();
    const share = { ...f.share, etudier: 0, commercer: 1 };
    expect(pickEpithet({ ...f, share, prevVocTier: 10 })?.id).toBe('negociant');
    expect(pickEpithet({ ...f, share, prevVocTier: 10, parentEpithet: 'negociant' })?.id).not.toBe('negociant');
  });
});

describe('R10 — rééquilibrage des convertisseurs, Destin du jour figé', () => {
  test('les codes du Destin du jour produits avec les règles de la 0.2.1 restent vérifiables', async () => {
    const { verifyCode } = await import('../../src/engine/daily');
    const fx: { date: string; score: number; code: string }[] = (await import('./fixtures-destin-v021.json')).default;
    expect(fx.length).toBe(9);
    for (const f of fx) {
      const v = verifyCode(f.code)!;
      expect(v.ok).toBe(true);
      expect(v.actual).toBe(f.score);
    }
  });
  test('nouvelles valeurs de la partie principale', async () => {
    const { ACT, ACT_UNLOCK, BUILDING } = await import('../../src/engine/data');
    expect(ACT.commercer.produce.or).toBe(1.25);
    expect(ACT.mediter.produce.essence).toBe(0.1);
    expect(BUILDING.sanctuaire.cost.savoir).toBeUndefined();
    expect(ACT_UNLOCK.etudier.amount).toBe(40);
    expect(ACT_UNLOCK.mediter.amount).toBe(20);
  });
});
