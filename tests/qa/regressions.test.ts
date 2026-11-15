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

describe('R9 — paliers d\'événement progressifs', () => {
  test('toute la production compte, la ressource visée triple ; l\'ancienne règle reste pour une fenêtre déjà ouverte', async () => {
    const { makeCtx, EVENT_GOAL_WEIGHT } = await import('../../src/engine/game');
    const { upcomingEvents } = await import('../../src/engine/events');
    const w = upcomingEvents(Date.UTC(2026, 10, 16), 50).find((x) => x.def.goal === 'or')!;
    const s = newGame(0, 4);
    const rt = newRuntime();
    rt.event = w;
    s.events[w.key] = { target: 100, progress: 0, tier: 0, v: 2 };
    const ctx = makeCtx(s, rt);
    ctx.onProduce!('vivres', 10, false, 'cultiver'); // 10 Vivres = 10 pts = 5 Or équivalent
    ctx.onProduce!('or', 1, false, 'commercer');
    expect(s.events[w.key].progress).toBeCloseTo(5 + EVENT_GOAL_WEIGHT);
    s.events[w.key] = { target: 100, progress: 0, tier: 0 }; // ouverte avant la mise à jour
    ctx.onProduce!('vivres', 10, false, 'cultiver');
    ctx.onProduce!('or', 1, false, 'commercer');
    expect(s.events[w.key].progress).toBe(1);
  });
});

describe('R11 — dot calculée sur l\'Or en stock', () => {
  test('5 % de l\'Or en stock, 50 au minimum, moitié prix entre joueurs ; l\'Or produit par le passé ne compte plus', async () => {
    const { dowry } = await import('../../src/engine/alliances');
    const s = newGame(0, 5);
    s.totalEver.or = 1e9;
    s.res.or = 100;
    expect(dowry(s, 'pnj')).toBe(50);
    s.res.or = 10_000;
    expect(dowry(s, 'pnj')).toBe(500);
    expect(dowry(s, 'joueur')).toBe(250);
  });
});

describe('R13 — Héritage selon la durée de vie', () => {
  test('√(durée / durée normale) : neutre pour une vie normale, ×√1,5 pour une vie 1,5 fois plus longue', async () => {
    const { legacyFor } = await import('../../src/engine/game');
    expect(legacyFor(20 * 1000)).toBe(10);
    expect(legacyFor(20 * 1000, 1)).toBe(10);
    expect(legacyFor(20 * 1000, 1.5)).toBe(Math.floor(10 * Math.sqrt(1.5)));
  });
  test('les bonus communs de durée (Sève éternelle, Clepsydre) ne gonflent pas l\'Héritage', async () => {
    const { endLife, lifeDuration, startLife: start } = await import('../../src/engine/game');
    const s = newGame(0, 6);
    s.upgrades.longevite = 5; s.buildings.clepsydre = 5;
    s.hero.traits = [];
    start(s);
    s.life!.value = 20 * 1000;
    expect(s.life!.dur).toBe(lifeDuration(s, s.hero));
    endLife(s, 0);
    expect(s.succession!.legacyGain).toBe(10);
  });
});

describe('R13 — Temps suspendu n\'entre pas dans la durée relative', () => {
  test('acheter Temps suspendu ne change pas le facteur de durée de l\'Héritage', async () => {
    const { endLife, buyTemps, startLife: start } = await import('../../src/engine/game');
    const s = newGame(0, 6);
    s.hero.traits = [];
    start(s);
    s.eclats = 5;
    expect(buyTemps(s)).toBe(true);
    s.life!.value = 20 * 1000;
    endLife(s, 0);
    expect(s.succession!.legacyGain).toBe(10);
  });
});

describe('R14 — paliers du Destin du jour relatifs au jour', () => {
  test('référence = meilleure activité tenue toute la vie ; paliers 70 / 100 / 110 %, identiques à chaque appel', async () => {
    const { ACTS } = await import('../../src/engine/data');
    const { DailyRun, dailySetup, dailyReference, dailyTiers } = await import('../../src/engine/daily');
    const date = '2026-11-14';
    let best = 0;
    for (const a of ACTS) { const r = new DailyRun(dailySetup(date)); r.setAct(a); while (!r.done) r.step(); best = Math.max(best, r.score()); }
    expect(dailyReference(date)).toBe(best);
    expect(dailyTiers(date)).toEqual([Math.round(best * 0.7), best, Math.round(best * 1.1)]);
    expect(dailyTiers(date)).toEqual(dailyTiers(date));
  });
  test('le score et la vérification des codes ne changent pas', async () => {
    const { verifyCode } = await import('../../src/engine/daily');
    const fx: { score: number; code: string }[] = (await import('./fixtures-destin-v021.json')).default;
    for (const f of fx) expect(verifyCode(f.code)!.actual).toBe(f.score);
  });
});
