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

describe('R10 — rééquilibrage des convertisseurs', () => {
  // Le gel du Destin du jour aux règles 0.2.1 a été levé par CMD-1 (Commande du comté) : voir plus bas.
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

// R14 (paliers relatifs à la meilleure activité) : remplacé par CMD-1, paliers en âge de livraison.

describe('R15 — présélection et pts/s des Échos selon leur force réelle', () => {
  test('à valeur égale, l\'Écho aux traits d\'Écho et au surnom puissants est mieux classé', async () => {
    const { echoExpectedRate, echoValueRate } = await import('../../src/engine/game');
    const s = newGame(0, 7);
    const mk = (id: number, strength: number, epithet?: string) => ({ id, heroId: id, name: 'X', gen: 2, traits: [], vocation: null, acts: Array(60).fill(0), pow: Array(60).fill(1), strength, pos: 0, loops: 0, pinned: false, value: 600, epithet });
    const plain = mk(1, 0), strong = mk(2, 0.8, 'grand');
    expect(echoValueRate(plain)).toBe(echoValueRate(strong));
    expect(echoExpectedRate(s, newRuntime(), strong)).toBeGreaterThan(echoExpectedRate(s, newRuntime(), plain) * 1.8);
  });
});

describe('R16 — réglage « Garder l\'écran allumé »', () => {
  test('désactivé par défaut et complété dans les anciennes sauvegardes', async () => {
    const { exportSave, importSave } = await import('../../src/engine/save');
    expect(newGame(0, 1).settings.keepAwake).toBe(false);
    const old = newGame(0, 2);
    delete (old.settings as any).keepAwake;
    const st = importSave(exportSave(old));
    expect(st).not.toBeNull();
    expect(st!.settings.keepAwake).toBe(false);
  });
});

describe('UI-1 — fantôme du Destin du jour (retours du 2026-11-17), adapté à la Commande', () => {
  test('la courbe note l\'avancement de la commande à chaque seconde et finit sur celui de la partie', async () => {
    const { DailyRun, DAILY_DUR, dailySetup } = await import('../../src/engine/daily');
    const run = new DailyRun(dailySetup('2026-11-17'));
    run.setAct('cultiver');
    while (!run.done) run.step();
    expect(run.delivered).toBe(false); // Cultiver seul ne livre jamais (Savoir et Essence demandés)
    expect(run.curve).toHaveLength(DAILY_DUR + 1);
    expect(run.curve[DAILY_DUR]).toBe(run.progress());
  });
  test('le fantôme du record se reconstruit depuis son code, sans rien ajouter à la sauvegarde', async () => {
    const { dailySetup, dailySolution, encodeRun, playActions, traceFromCode, verifyCode } = await import('../../src/engine/daily');
    const date = '2026-11-17';
    const sol = dailySolution(date);
    const run = playActions(dailySetup(date), sol.actions);
    const code = encodeRun(date, run.actions, run.score());
    const tr = traceFromCode(code)!;
    expect(tr.deliveredTick).toBe(run.deliveredTick);
    expect(tr.lineTick).toEqual(run.lineTick);
    expect(verifyCode(code)!.ok).toBe(true);
    expect(traceFromCode('pas-un-code')).toBeNull();
  });
});

describe('UI-2 — le chrono du Destin du jour démarre à la première activité (retours du 2026-11-17)', () => {
  test('avant toute activité, le temps réel écoulé ne fait rien avancer et n\'est pas mis de côté', async () => {
    const { DailyRun, dailySetup } = await import('../../src/engine/daily');
    const run = new DailyRun(dailySetup('2026-11-17'));
    expect(run.started).toBe(false);
    expect(run.advance(30)).toBe(0);
    run.setAct(null); // « aucune activité » ne lance pas le chrono
    expect(run.advance(30)).toBe(0);
    expect(run.tickN).toBe(0);
    run.setAct('cultiver');
    expect(run.started).toBe(true);
    expect(run.actions[0][0]).toBe(0); // la première action est au tic 0
    run.advance(1.05);
    expect(run.tickN).toBe(10);
  });
  test('une fois lancé, le chrono continue même sans activité, jusqu\'à la fin', async () => {
    const { DailyRun, dailySetup } = await import('../../src/engine/daily');
    const run = new DailyRun(dailySetup('2026-11-17'));
    run.setAct('cultiver');
    run.advance(5);
    run.setAct(null);
    run.advance(1000);
    expect(run.done).toBe(true);
  });
  test('un code dont la première action est retardée se rejoue comme s\'il commençait à 0 (pas de temps à vide)', async () => {
    const { encodeRun, replay } = await import('../../src/engine/daily');
    const date = '2026-11-17';
    expect(replay(date, [[300, 0], [500, 2]])).toBe(replay(date, [[0, 0], [200, 2]]));
    expect(encodeRun(date, [], 0)).toBeTruthy();
    expect(replay(date, [])).toBe(0);
  });
});

describe('CMD-1 — la Commande du comté remplace le Destin à points (validé le 2026-11-17)', () => {
  const date = '2026-11-17';
  test('la commande demande toujours du Savoir et de l\'Essence, et au moins une ligne de Vivres ou d\'Or', async () => {
    const { dailySetup } = await import('../../src/engine/daily');
    for (let d = 1; d <= 20; d++) {
      const o = dailySetup(`2026-12-${String(d).padStart(2, '0')}`).order;
      expect(o.savoir).toBeGreaterThan(0);
      expect(o.essence).toBeGreaterThan(0);
      expect(o.vivres + o.or).toBeGreaterThan(0);
    }
  });
  test('aucune activité tenue seule ne livre la commande', async () => {
    const { dailySetup, playActions } = await import('../../src/engine/daily');
    for (const dd of ['2026-11-17', '2026-11-18', '2026-11-19']) for (let a = 0; a < 5; a++) expect(playActions(dailySetup(dd), [[0, a]]).delivered).toBe(false);
  });
  test('stock au même moment : la partie s\'arrête à la livraison, au tic où tout est réuni', async () => {
    const { dailySetup, dailySolution, playActions, RES_ORDER } = await import('../../src/engine/daily').then((m) => ({ ...m, RES_ORDER: ['vivres', 'or', 'savoir', 'essence'] as const }));
    const setup = dailySetup(date);
    const run = playActions(setup, dailySolution(date).actions);
    expect(run.delivered).toBe(true);
    expect(run.done).toBe(true);
    expect(run.tickN).toBe(run.deliveredTick);
    for (const r of RES_ORDER) expect(run.res[r]).toBeGreaterThanOrEqual(setup.order[r]);
    run.step(); // plus rien ne bouge après la livraison
    expect(run.tickN).toBe(run.deliveredTick);
  });
  test('paliers en âges : Bronze 90, Or = solveur + 2 ans, Argent à mi-chemin ; le solveur décroche l\'Or', async () => {
    const { DAILY_DUR, GOLD_MARGIN, dailySolution, dailyTiers, dailyResult, medalsOf } = await import('../../src/engine/daily');
    const sol = dailySolution(date);
    const t = dailyTiers(date);
    expect(t[0]).toBe(DAILY_DUR);
    expect(t[2]).toBe(Math.ceil(sol.tick / 10) + GOLD_MARGIN);
    expect(t[1]).toBe(Math.round((t[2] + DAILY_DUR) / 2));
    expect(medalsOf(date, dailyResult(sol.tick, 1))).toBe(3);
    expect(medalsOf(date, dailyResult(null, 0.99))).toBe(0);
    expect(medalsOf(date, dailyResult(t[1] * 10 + 1, 1))).toBe(1);
  });
  test('résultat comparable : livrer plus jeune bat livrer plus vieux, qui bat ne pas livrer', async () => {
    const { dailyResult, resultAge } = await import('../../src/engine/daily');
    expect(dailyResult(500, 1)).toBeGreaterThan(dailyResult(600, 1));
    expect(dailyResult(899, 1)).toBeGreaterThan(dailyResult(null, 0.999));
    expect(resultAge(dailyResult(583, 1))).toBeCloseTo(58.3);
    expect(resultAge(dailyResult(null, 0.5))).toBeNull();
  });
  test('rendements de la partie principale (plus de règles figées 0.2.1) ; les anciens codes EL1 sont refusés', async () => {
    const { ACT } = await import('../../src/engine/data');
    const { dailySetup, verifyCode, DailyRun } = await import('../../src/engine/daily');
    const run = new DailyRun(dailySetup(date));
    expect(run.ctx.acts).toBeUndefined(); // table ACT de la partie principale
    expect(ACT.commercer.produce.or).toBe(1.25);
    const fx: { code: string }[] = (await import('./fixtures-destin-v021.json')).default;
    for (const f of fx) expect(verifyCode(f.code)).toBeNull();
  });
  test('la commande et les paliers sont identiques à chaque appel (déterministes, pour tous les joueurs)', async () => {
    const { dailySetup, dailyTiers } = await import('../../src/engine/daily');
    expect(dailySetup(date)).toEqual(dailySetup(date));
    expect(dailyTiers(date)).toEqual(dailyTiers(date));
  });
});

describe('NOM-1 — les prénoms des héritiers ont leur propre aléa', () => {
  test('changer de prénoms ne change ni les traits, ni la suite du tirage génétique', async () => {
    const { genHeirs } = await import('../../src/engine/game');
    const { Rng } = await import('../../src/engine/rng');
    const a = newGame(0, 7), b = newGame(1_000, 7); // même génétique, autre aléa de prénoms
    const ra = new Rng(42), rb = new Rng(42);
    const ha = genHeirs(a, a.hero, ra), hb = genHeirs(b, b.hero, rb);
    expect(ha.map((h) => h.name)).not.toEqual(hb.map((h) => h.name)); // les prénoms, eux, changent
    expect(ha.map((h) => h.traits)).toEqual(hb.map((h) => h.traits));
    expect(ra.s).toBe(rb.s);
  });
  test('les prénoms d\'une fratrie restent déterministes et distincts', async () => {
    const { genHeirs } = await import('../../src/engine/game');
    const { Rng } = await import('../../src/engine/rng');
    const s = newGame(0, 7);
    const n1 = genHeirs(s, s.hero, new Rng(1)).map((h) => h.name);
    const n2 = genHeirs(s, s.hero, new Rng(1)).map((h) => h.name);
    expect(n1).toEqual(n2);
    expect(new Set(n1).size).toBe(n1.length);
  });
});

describe('NOM-2 — 80 prénoms médiévaux, autant de chaque genre', () => {
  test('liste sans doublon, 40 prénoms féminins et 40 masculins', async () => {
    const { FIRST_NAMES, FEMININE_NAMES } = await import('../../src/engine/data');
    expect(new Set(FIRST_NAMES).size).toBe(FIRST_NAMES.length);
    expect(FIRST_NAMES).toHaveLength(80);
    expect(FEMININE_NAMES.size).toBe(40);
    for (const n of ['Esclarmonde', 'Jehanne', 'Azalaïs']) expect(FEMININE_NAMES.has(n)).toBe(true);
    for (const n of ['Foulques', 'Archambaud', 'Évrard']) expect(FEMININE_NAMES.has(n)).toBe(false);
  });
});

describe('NOM-3 — numérotation dynastique (« Jehan III »)', () => {
  const crowned = async (names: string[]) => {
    const { confirmSuccession, endLife } = await import('../../src/engine/game');
    const { renameHead } = await import('../../src/engine/names');
    const s = newGame(0, 5);
    renameHead(s, names[0]);
    startLife(s);
    for (const n of names.slice(1)) {
      endLife(s, 0);
      s.succession!.heirs[0].name = n;
      confirmSuccession(s, 0, []);
    }
    return s;
  };
  test('le rang suit les chefs qui ont porté le prénom ; « Ier » / « Ire » dès qu\'un second le porte', async () => {
    const { regnalName } = await import('../../src/engine/names');
    const s = await crowned(['Jehan', 'Mahaut', 'Jehan', 'Hugues', 'Jehan']);
    const n = s.lineage.names;
    expect(s.ancestors.map((a) => regnalName(a, n))).toEqual(['Jehan Ier', 'Mahaut', 'Jehan II', 'Hugues']);
    expect(regnalName(s.hero, n)).toBe('Jehan III');
    const t = await crowned(['Mahaut', 'Hugues', 'Mahaut']);
    expect(regnalName(t.ancestors[0], t.lineage.names)).toBe('Mahaut Ire');
  });
  test('un héritier pas encore couronné montre le rang qu\'il prendrait ; les Échos gardent le leur', async () => {
    const { endLife } = await import('../../src/engine/game');
    const { regnalName } = await import('../../src/engine/names');
    const { fullName } = await import('../../src/engine/epithets');
    const s = await crowned(['Jehan', 'Jehan']);
    endLife(s, 0);
    expect(regnalName({ name: 'Jehan' }, s.lineage.names)).toBe('Jehan III');
    expect(regnalName({ name: 'Ulric' }, s.lineage.names)).toBe('Ulric');
    expect(fullName(s.succession!.newEcho, s.lineage.names)).toMatch(/^Jehan II\b/);
  });
  test('le dé de la fondation ne laisse pas de rang fantôme', async () => {
    const { renameHead } = await import('../../src/engine/names');
    const s = newGame(0, 5);
    renameHead(s, 'Aude'); renameHead(s, 'Odon');
    expect(s.lineage.names).toEqual({ Odon: 1 });
    expect(s.hero.ord).toBe(1);
  });
  test('sauvegarde d\'avant la numérotation : rangs recalculés d\'après la généalogie', async () => {
    const { exportSave, importSave } = await import('../../src/engine/save');
    const s = await crowned(['Jehan', 'Mahaut', 'Jehan']);
    const old = JSON.parse(JSON.stringify(s));
    delete old.lineage.names; delete old.hero.ord;
    for (const a of old.ancestors) delete a.ord;
    for (const e of old.echoes) delete e.ord;
    const back = importSave(exportSave(old))!;
    expect(back.lineage.names).toEqual({ Jehan: 2, Mahaut: 1 });
    expect(back.ancestors.map((a) => a.ord)).toEqual([1, 1]);
    expect(back.hero.ord).toBe(2);
  });
});

describe('NOM-4 — easter egg : la Maison Joestar', () => {
  test('nom de maison reconnu quelle que soit la graphie', async () => {
    const { isJoestar } = await import('../../src/engine/data');
    for (const n of ['Joestar', 'JOESTAR', 'joëstar', 'Joe Star']) expect(isJoestar(n)).toBe(true);
    for (const n of ['Joestars', 'Valombre', 'Jo']) expect(isJoestar(n)).toBe(false);
  });
  test('un seul héritier par génération porte le prénom du JoJo, aux mêmes traits qu\'une maison normale', async () => {
    const { genHeirs } = await import('../../src/engine/game');
    const { Rng } = await import('../../src/engine/rng');
    const { JOJO_LINE, isJojo } = await import('../../src/engine/data');
    const a = newGame(0, 9), b = newGame(0, 9);
    b.lineage.name = 'Joestar';
    for (const gen of [1, 5, 9]) {
      a.hero.gen = gen; b.hero.gen = gen;
      const ha = genHeirs(a, a.hero, new Rng(3)), hb = genHeirs(b, b.hero, new Rng(3));
      expect(ha.some((h) => isJojo(h.name))).toBe(false);
      expect(hb.filter((h) => isJojo(h.name)).map((h) => h.name)).toEqual([JOJO_LINE[gen % 9]]);
      expect(hb.map((h) => h.traits)).toEqual(ha.map((h) => h.traits)); // renommer sa maison ne relance rien
    }
  });
  test('la saga suit les générations ; Jolyne est accordée au féminin ; Josuke II, puis Jonathan II', async () => {
    const { confirmSuccession, endLife } = await import('../../src/engine/game');
    const { isJojo } = await import('../../src/engine/data');
    const { regnalName, renameHead } = await import('../../src/engine/names');
    const s = newGame(0, 4);
    s.lineage.name = 'Joestar';
    renameHead(s, 'Jonathan');
    startLife(s);
    for (let g = 0; g < 9; g++) {
      endLife(s, 0);
      const i = s.succession!.heirs.findIndex((h) => isJojo(h.name));
      confirmSuccession(s, i, []);
    }
    const line = [...s.ancestors, s.hero].map((p) => regnalName(p, s.lineage.names));
    expect(line).toEqual(['⭐ Jonathan Ier', '⭐ Joseph', '⭐ Jotaro', '⭐ Josuke Ier', '⭐ Giorno', '⭐ Jolyne', '⭐ Johnny', '⭐ Josuke II', '⭐ Jodio', '⭐ Jonathan II']);
    expect(s.ancestors[5].sex).toBe('f');
  });
});

describe('GD-SURNOMS A — « le Constant » devient un surnom commun, sans effet', () => {
  test('commun, sans bonus, et battu par « le Laboureur » quand les deux conviennent', async () => {
    const { EPITHET, pickEpithet } = await import('../../src/engine/epithets');
    expect(EPITHET.constant.rarity).toBe(0);
    expect(EPITHET.constant.mods).toEqual({});
    const f = {
      share: { cultiver: 1, chasser: 0, commercer: 0, etudier: 0, mediter: 0 }, used: 1, switches: 0,
      harmonyAvg: 0.5, harmonyMin: 0.5, value: 1, parentValue: 1, bestBefore: 1, gen: 3, traits: [], negTraits: 0,
      vocTier: 0, durRatio: 1, extended: false, spouse: null, eventTier: 0, builds: 0, game: 50, predators: 5,
    };
    expect(pickEpithet(f)?.id).toBe('laboureur');
    expect(pickEpithet({ ...f, parentEpithet: 'laboureur' })?.id).toBe('constant');
  });
});

describe('GD-SURNOMS C — un surnom commun déjà connu ne déploie plus la grande carte', () => {
  test('carte pour une découverte ou un surnom Rare et plus, ligne discrète pour un Commun connu', async () => {
    const { epithetRevealKind } = await import('../../src/engine/epithets');
    expect(epithetRevealKind('laboureur', true)).toBe('carte');
    expect(epithetRevealKind('laboureur', false)).toBe('ligne');
    expect(epithetRevealKind('constant', false)).toBe('ligne');
    expect(epithetRevealKind('juste', false)).toBe('carte');
    expect(epithetRevealKind('venerable', false)).toBe('carte');
  });
});

describe('UX-NAV 1 — menus rangés par intention, avec sous-onglets', () => {
  test('cinq onglets ; tous les achats sous Améliorer, les Échos sous Domaine', async () => {
    const { TABS, SUBS, SUB_TAB } = await import('../../src/ui/nav');
    expect(TABS.map((t) => t.id)).toEqual(['vie', 'domaine', 'ameliorer', 'maison', 'destin']);
    expect(SUBS.ameliorer.map((x) => x.id)).toEqual(['batiments', 'heritage', 'bazar']);
    expect(SUB_TAB.echos).toBe('domaine');
    expect(SUB_TAB.alliances).toBe('maison');
    expect(SUB_TAB.jour).toBe('destin');
  });
  test('un sous-onglet n\'apparaît qu\'une fois sa mécanique débloquée', async () => {
    const { subsShown } = await import('../../src/ui/nav');
    const s = newGame(0, 1);
    const ids = (t: Parameters<typeof subsShown>[1], l: Parameters<typeof subsShown>[2] = 'mobile') => subsShown(s, t, l).map((x) => x.id);
    expect(ids('maison')).toEqual(['lignee']);
    expect(ids('ameliorer')).toEqual(['batiments', 'heritage']);
    s.upgrades.alliances = 1; s.upgrades.chroniques = 1;
    expect(ids('maison')).toEqual(['lignee', 'alliances', 'codex']);
    s.eclats = 1;
    expect(ids('ameliorer')).toEqual(['batiments', 'heritage', 'bazar']);
    // Le Bazar reste une fois découvert, même à 0 Éclat (drapeau posé par l'interface).
    s.eclats = 0; s.flags.bazar = true;
    expect(ids('ameliorer')).toContain('bazar');
  });
  test('sur ordinateur, la Vie n\'est pas un onglet ; en 3 colonnes les Échos quittent le Domaine', async () => {
    const { normSub, normTab, subsShown, tabsShown } = await import('../../src/ui/nav');
    const s = newGame(0, 1);
    expect(tabsShown('two').map((t) => t.id)).not.toContain('vie');
    expect(normTab('vie', 'two')).toBe('domaine');
    expect(normTab('vie', 'mobile')).toBe('vie');
    expect(subsShown(s, 'domaine', 'three').map((x) => x.id)).toEqual(['nature']);
    expect(normSub(s, 'domaine', 'three', 'echos')).toBe('nature');
    expect(normSub(s, 'domaine', 'two', 'echos')).toBe('echos');
    // Un sous-onglet verrouillé n'est jamais affiché, même s'il était le dernier choisi.
    expect(normSub(s, 'maison', 'mobile', 'alliances')).toBe('lignee');
    expect(normSub(s, 'vie', 'mobile', undefined)).toBeNull();
  });
  test('pastilles « nouveau » : un achat se signale une fois, jusqu\'à la visite ; le niveau suivant est nouveau', async () => {
    const { SeenBadges, affordableKeys } = await import('../../src/ui/nav');
    const s = newGame(0, 1);
    s.legacy = 1e9;
    const seen = new SeenBadges();
    const keys = affordableKeys(s, 'heritage');
    expect(keys.length).toBeGreaterThan(0);
    expect(seen.fresh('heritage', keys)).toBe(keys.length);
    seen.mark('heritage', keys);
    expect(seen.fresh('heritage', affordableKeys(s, 'heritage'))).toBe(0);
    const id = keys[0].split(':')[1];
    s.upgrades[id] = (s.upgrades[id] ?? 0) + 1;
    expect(seen.fresh('heritage', affordableKeys(s, 'heritage'))).toBe(1);
    // Codex : les surnoms connus au lancement ne sont pas nouveaux, une découverte l'est.
    s.epithets = { laboureur: 1 };
    seen.primeOnce('codex', affordableKeys(s, 'codex'));
    expect(seen.fresh('codex', affordableKeys(s, 'codex'))).toBe(0);
    s.epithets.juste = 1;
    expect(seen.fresh('codex', affordableKeys(s, 'codex'))).toBe(1);
  });
});

describe('UX-NAV 4 — sous-onglets en bas sur téléphone, à portée du pouce', () => {
  test('sur téléphone la barre des sous-onglets rejoint le bloc du bas ; sur ordinateur elle reste en tête de colonne', async () => {
    const { subBarPlace } = await import('../../src/ui/nav');
    expect(subBarPlace('mobile')).toBe('dock');
    expect(subBarPlace('two')).toBe('panneau');
    expect(subBarPlace('three')).toBe('panneau');
  });
  test('la frise de vie ne déborde plus sous la barre du haut ; sous-onglets de 44 px au moins', async () => {
    const { readFileSync } = await import('node:fs');
    const css = readFileSync(new URL('../../src/style.css', import.meta.url), 'utf8');
    const rule = (sel: string) => css.match(new RegExp(`^${sel.replace('.', '\\.')} \\{([^}]*)\\}`, 'm'))?.[1] ?? '';
    expect(rule('.top-life')).toMatch(/bottom: 0;/);
    expect(rule('.subtab')).toMatch(/min-height: 44px/);
    expect(rule('.dock')).toMatch(/position: fixed; bottom: 0/);
  });
});
