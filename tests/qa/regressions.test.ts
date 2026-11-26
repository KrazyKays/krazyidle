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
      share, used: 2, switches: 5, value: 100, parentValue: 100, bestBefore: 1000, gen: 30,
      traits: [], negTraits: 0, vocTier: 10, durRatio: 1, extended: false, spouse: null, eventTier: 0, builds: 0,
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
    // 0.5 (SIMPLIF-2) : 1,25 et 0,10 intègrent l'Harmonie moyenne (×1,265).
    expect(ACT.commercer.produce.or).toBe(1.58);
    expect(ACT.mediter.produce.essence).toBe(0.127);
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
    const { dailySetup, dailySolution, encodeRun, playActions, traceFromCode } = await import('../../src/engine/daily');
    const date = '2026-11-17';
    const sol = dailySolution(date);
    const run = playActions(dailySetup(date), sol.actions);
    const code = encodeRun(date, run.actions, run.score());
    const tr = traceFromCode(code)!;
    expect(tr.deliveredTick).toBe(run.deliveredTick);
    expect(tr.lineTick).toEqual(run.lineTick);
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
    for (const dd of ['2026-11-17', '2026-11-18', '2026-11-19']) for (let a = 0; a < 4; a++) expect(playActions(dailySetup(dd), [[0, a]]).delivered).toBe(false);
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
    const { dailySetup, decodeRun, DailyRun } = await import('../../src/engine/daily');
    const run = new DailyRun(dailySetup(date));
    expect(run.ctx.acts).toBeUndefined(); // table ACT de la partie principale
    expect(ACT.commercer.produce.or).toBe(1.58);
    const fx: { code: string }[] = (await import('./fixtures-destin-v021.json')).default;
    for (const f of fx) expect(decodeRun(f.code)).toBeNull();
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
      share: { cultiver: 1, commercer: 0, etudier: 0, mediter: 0 }, used: 1, switches: 0,
      value: 1, parentValue: 0, bestBefore: 1, gen: 3, traits: [], negTraits: 0,
      vocTier: 0, durRatio: 1, extended: false, spouse: null, eventTier: 0, builds: 0,
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
    expect(TABS.map((t) => t.id)).toEqual(['vie', 'memoire', 'ameliorer', 'maison', 'destin']);
    expect(SUBS.ameliorer.map((x) => x.id)).toEqual(['batiments', 'heritage', 'bazar']);
    expect(SUB_TAB.echos).toBe('memoire');
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
  test('sur ordinateur, la Vie n\'est pas un onglet ; en 3 colonnes les Échos quittent la Mémoire', async () => {
    const { normSub, normTab, subsShown, tabsShown } = await import('../../src/ui/nav');
    const s = newGame(0, 1);
    expect(tabsShown('two').map((t) => t.id)).not.toContain('vie');
    expect(normTab('vie', 'two')).toBe('memoire');
    expect(normTab('vie', 'mobile')).toBe('vie');
    expect(subsShown(s, 'memoire', 'three')).toEqual([]); // les Échos ont leur colonne
    expect(tabsShown('three').map((t) => t.id)).not.toContain('memoire');
    expect(normTab('memoire', 'three')).toBe('ameliorer');
    expect(normSub(s, 'memoire', 'two', 'echos')).toBe('echos');
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

describe('TRAIT-EVO — mutations plafonnées, dons qui mûrissent (0.3)', () => {
  test('une mutation ne donne jamais de légendaire ni de forme mûrie, quelle que soit Bonne étoile', async () => {
    const { genHeirs } = await import('../../src/engine/game');
    const { TRAIT, mutationWeights } = await import('../../src/engine/data');
    const { Rng } = await import('../../src/engine/rng');
    for (let luck = 0; luck <= 5; luck++) expect(mutationWeights(luck)[3]).toBe(0);
    const s = newGame(0, 7);
    s.upgrades.etoile = 5;
    const rng = new Rng(42);
    for (let k = 0; k < 400; k++) {
      for (const h of genHeirs(s, { ...s.hero, traits: [] }, rng)) {
        for (const t of h.traits) {
          expect(TRAIT[t].matured ?? false).toBe(false);
          if (TRAIT[t].rarity === 3) expect(TRAIT[t].nova).toBe(true); // seule l'Étoile filante, par son propre tirage
        }
      }
    }
  });

  test('un don mûr passe parfois sous sa forme supérieure, sans usure ; un don non mûr jamais', async () => {
    const { genHeirs } = await import('../../src/engine/game');
    const { Rng } = await import('../../src/engine/rng');
    const s = newGame(0, 8);
    const parent = { ...s.hero, traits: ['main_verte'], wear: { main_verte: 6 } };
    const rng = new Rng(1);
    let evolved = 0, kept = 0, wrong = 0;
    for (let k = 0; k < 300; k++) {
      for (const h of genHeirs(s, parent, rng, { main_verte: 'seve' })) {
        if (h.traits.includes('seve')) { evolved++; expect(h.evolved).toContain('seve'); expect(h.wear?.seve).toBeUndefined(); }
        if (h.traits.includes('main_verte')) kept++;
      }
      for (const h of genHeirs(s, parent, rng)) if (h.traits.includes('seve')) wrong++;
    }
    expect(evolved).toBeGreaterThan(50);
    expect(kept).toBeGreaterThan(evolved); // 25 % de chance seulement : le don reste le plus souvent tel quel
    expect(wrong).toBe(0);
  });

  test('la vie doit mériter l\'évolution : cultiver la moitié de sa vie fait mûrir Main verte, pas moins', async () => {
    const { ripeTraits } = await import('../../src/engine/evolution');
    const facts = (cultiver: number) => ({
      share: { cultiver, commercer: 1 - cultiver, etudier: 0, mediter: 0 }, used: 2, switches: 3,
      value: 100, parentValue: 90, bestBefore: 100, gen: 5, traits: ['main_verte', 'genie'], negTraits: 0, vocTier: 2, prevVocTier: 1,
      durRatio: 1, extended: false, spouse: null, eventTier: 0, builds: 0,
    });
    expect(ripeTraits(['main_verte', 'genie'], facts(0.6))).toEqual({ main_verte: 'seve' });
    expect(ripeTraits(['main_verte', 'genie'], facts(0.4))).toEqual({});
    // Génie → Élu : une vie une fois et demie meilleure que la meilleure de la lignée, et une vocation de rang 6.
    expect(ripeTraits(['genie'], { ...facts(0.6), value: 160, vocTier: 6 })).toEqual({ genie: 'elu' });
    expect(ripeTraits(['genie'], { ...facts(0.6), value: 140, vocTier: 6 })).toEqual({});
  });

  test('les traits de la 0.3 restent hors du Destin du jour et des maisons de la semaine (codes EL2 inchangés)', async () => {
    const { dailySetup } = await import('../../src/engine/daily');
    const { countyHouses } = await import('../../src/engine/alliances');
    const { TRAIT } = await import('../../src/engine/data');
    for (let d = 0; d < 30; d++) {
      const date = new Date(Date.UTC(2026, 0, 1) + d * 12 * 86400_000).toISOString().slice(0, 10);
      for (const t of dailySetup(date).traits) expect(TRAIT[t].since).toBeUndefined();
      for (const ch of countyHouses(Date.UTC(2026, 0, 1) + d * 7 * 86400_000)) expect(TRAIT[ch.gift].since).toBeUndefined();
    }
  }, 30_000); // un tirage du jour coûte ~0,1 s : 30 dates réparties sur l'année

  test('le Bazar ne vend ni formes mûries ni Étoile filante', async () => {
    const { buyBlessing } = await import('../../src/engine/game');
    const s = newGame(0, 9);
    s.eclats = 100;
    expect(buyBlessing(s, 'seve')).toBe(false);
    expect(buyBlessing(s, 'etoile_filante')).toBe(false);
    expect(buyBlessing(s, 'genie')).toBe(true);
  });
});

describe('NOVA — l\'Étoile filante (0.3)', () => {
  test('elle embrase la Crypte pendant sa vie, ne se transmet pas et ne laisse pas d\'Écho', async () => {
    const { confirmSuccession, cryptBoost, endLife, genHeirs } = await import('../../src/engine/game');
    const { Rng } = await import('../../src/engine/rng');
    const s = newGame(0, 10);
    s.hero.traits = ['etoile_filante'];
    startLife(s);
    expect(cryptBoost(s)).toBe(2);
    const rng = new Rng(3);
    let carried = 0, n = 0;
    for (let k = 0; k < 300; k++) for (const h of genHeirs(s, s.hero, rng)) { n++; if (h.traits.includes('etoile_filante')) carried++; }
    expect(carried / n).toBeLessThan(0.01); // seulement le tirage propre (≈ 0,2 % par succession), jamais l'héritage
    s.life!.t = s.life!.dur;
    endLife(s, 1000);
    const sc = s.succession!;
    expect(sc.noEcho).toBe(true);
    expect(confirmSuccession(s, 0, [sc.newEcho.id])).toBe(true);
    expect(s.echoes).toHaveLength(0);
    expect(cryptBoost(s)).toBe(1);
  });

  test('un code d\'alliance ne peut pas apporter d\'Étoile filante', async () => {
    const { suitorFromCode } = await import('../../src/engine/alliances');
    const s = newGame(0, 11);
    const sp = suitorFromCode(s, { house: { id: 'x', name: 'X', crest: '🦁', color: '#c62828' }, name: 'Aude', sex: 'f', gen: 3, traits: ['etoile_filante', 'genie'], vocation: null, nonce: 1 } as never);
    expect(sp.traits).toEqual(['genie']);
  });
});

describe('ECLATS — palier Or à 5 ✦, Almanach, Bénédictions légendaires renchéries (0.3)', () => {
  test('le premier Or d\'un événement offre sa page d\'Almanach une seule fois', async () => {
    const { tick, EVENT_REWARDS, ALMANACH_ECLATS } = await import('../../src/engine/game');
    const { upcomingEvents } = await import('../../src/engine/events');
    expect(EVENT_REWARDS).toEqual([1, 2, 5]);
    const w = upcomingEvents(Date.UTC(2026, 10, 16), 50)[0];
    const s = newGame(0, 12);
    startLife(s);
    const rt = newRuntime();
    s.events[w.key] = { target: 10, progress: 1000, tier: 0, v: 2 };
    tick(s, rt, 0.1, w.start + 1000);
    expect(s.almanach).toEqual([w.def.id]);
    expect(s.eclats).toBe(1 + 2 + 5 + ALMANACH_ECLATS);
  });

  test('chaque Bénédiction légendaire renchérit les suivantes de 50 %, ×3 au plus', async () => {
    const { blessingCost, buyBlessing } = await import('../../src/engine/game');
    const s = newGame(0, 13);
    s.eclats = 1000;
    const costs: number[] = [];
    for (let k = 0; k < 6; k++) { costs.push(blessingCost(s, 'elu')); buyBlessing(s, 'elu'); s.blessings = []; }
    expect(costs).toEqual([12, 18, 24, 30, 36, 36]);
    expect(blessingCost(s, 'genie')).toBe(6); // les épiques ne bougent pas
  });
});

describe('FEATS — hauts faits de fin de partie (0.3)', () => {
  test('un haut fait s\'obtient une fois, avec ses Éclats', async () => {
    const { checkFeats, FEAT } = await import('../../src/engine/feats');
    const s = newGame(0, 14);
    s.hero.gen = FEAT.millenaire;
    expect(checkFeats(s, 5)).toEqual(['millenaire']);
    expect(s.eclats).toBe(5);
    expect(checkFeats(s, 6)).toEqual([]);
    expect(s.feats).toEqual({ millenaire: 5 });
  });
});

describe('TERRE-1 — plus de vérification des codes du Destin (0.4)', () => {
  test('le moteur n\'exporte plus de vérification ; le partage montre une bande d\'activités', async () => {
    const daily = await import('../../src/engine/daily');
    expect('verifyCode' in daily).toBe(false);
    // 6 s par carré : Cultiver, puis pause, puis Méditer
    const rec = [...Array(6).fill(0), ...Array(6).fill(-1), ...Array(4).fill(3)];
    expect(daily.dailyStrip(rec)).toBe('🟩⬛🟪');
  });
});

describe('TERRE-2 — plus de Prédateurs (0.4)', () => {
  test('une ancienne sauvegarde perd ses Prédateurs et le surnom « le Tueur de loups »', async () => {
    const { deserialize, serialize } = await import('../../src/engine/save');
    const s: any = newGame(0, 21);
    s.eco = { F: 60, G: 20, P: 3 };
    s.epithets = { tueur_loups: 2, laboureur: 1 };
    s.ancestors = [{ id: 1, name: 'Jehan', gen: 1, traits: [], vocation: null, value: 1, legacy: 1, dominant: null, diedAt: 0, epithet: 'tueur_loups' }];
    const t = deserialize(serialize(s))!;
    expect((t as any).eco).toBeUndefined(); // 0.5 : plus de Domaine du tout (SIMPLIF-2)
    expect(t.epithets).toEqual({ laboureur: 1 });
    expect(t.ancestors[0].epithet).toBeUndefined();
  });
});

describe('TERRE-4 — Cultiver et Chasser fusionnés en Récolter (0.4)', () => {
  test('quatre activités, une par ressource', async () => {
    const { ACTS, ACT } = await import('../../src/engine/data');
    expect(ACTS).toEqual(['cultiver', 'commercer', 'etudier', 'mediter']);
    expect(ACT.cultiver.name).toBe('Récolter');
  });
  test('une sauvegarde 0.3 est reprise : vocation, Échos, compétences, dons, bâtiment, hauts faits', async () => {
    const { deserialize } = await import('../../src/engine/save');
    const { startLife } = await import('../../src/engine/game');
    const s: any = newGame(0, 30);
    startLife(s);
    s.v = 2;
    s.unlocked = ['cultiver', 'chasser', 'commercer'];
    s.hero.vocation = { act: 'chasser', tier: 4 };
    s.hero.traits = ['oeil_faucon', 'main_verte', 'pas_loup'];
    s.hero.wear = { oeil_faucon: 3, main_verte: 1 };
    s.life.lvl = { cultiver: 2, chasser: 7, commercer: 1, etudier: 0, mediter: 0 };
    s.life.xp = { cultiver: 1, chasser: 2, commercer: 0, etudier: 0, mediter: 0 };
    s.life.timeIn = { cultiver: 5, chasser: 10, commercer: 1, etudier: 0, mediter: 0 };
    s.life.act = 'chasser';
    s.life.rec = [0, 1, 2, 4, -1];
    s.echoes = [{ id: 9, heroId: 1, name: 'Jehan', gen: 1, traits: ['oeil_faucon'], vocation: { act: 'chasser', tier: 2 }, acts: [1, 1, 4, 3, -1], pow: [1, 1, 1, 1, 0], strength: 0, pos: 0, loops: 0, pinned: false, value: 10 }];
    s.buildings = { champs: 2, pavillon: 5 };
    s.feats = { cinq_metiers: 1, chasse_raisonnee: 2 };
    s.blessings = ['oeil_faucon'];
    const t = deserialize(JSON.stringify(s))!;
    expect(t.unlocked).toEqual(['cultiver', 'commercer']);
    expect(t.hero.vocation).toEqual({ act: 'cultiver', tier: 4 });
    expect(t.hero.traits).toEqual(['main_verte', 'seve']);
    expect(t.hero.wear).toEqual({ main_verte: 3 });
    expect(t.life!.lvl).toEqual({ cultiver: 7, commercer: 1, etudier: 0, mediter: 0 });
    expect(t.life!.xp.cultiver).toBe(2);
    expect(t.life!.timeIn.cultiver).toBe(15);
    expect(t.life!.act).toBe('cultiver');
    expect(t.life!.rec).toEqual([0, 0, 1, 3, -1]);
    expect(t.echoes[0].acts).toEqual([0, 0, 3, 2, -1]);
    expect(t.echoes[0].traits).toEqual(['main_verte']);
    expect(t.echoes[0].vocation!.act).toBe('cultiver');
    expect(t.buildings).toEqual({ champs: 5 });
    expect(t.feats).toEqual({ quatre_metiers: 1, recolte_raisonnee: 2 });
    expect(t.blessings).toEqual(['main_verte']);
  });
  test('codes d\'alliance AL2 par identifiants ; les AL1 (rangs de la 0.3) ne sont plus lus', async () => {
    const { decodeProposal, encodeProposal } = await import('../../src/engine/alliances');
    const a = newGame(0, 31);
    const code = encodeProposal(a, { ...a.hero, id: 77, traits: ['main_verte', 'elu'], vocation: { act: 'commercer', tier: 3 } });
    expect(code.startsWith('AL2-')).toBe(true);
    const p = decodeProposal(code)!;
    expect(p.traits).toEqual(['main_verte', 'elu']);
    expect(p.vocation).toEqual({ act: 'commercer', tier: 3 });
    expect(decodeProposal(code.replace('AL2-', 'AL1-'))).toBeNull();
  });
});

describe('SIMPLIF-1 — plus de consignes de Récolter (0.5)', () => {
  test('la sauvegarde 0.4 perd sa consigne, son compteur de Battue et les surnoms des consignes', async () => {
    const { deserialize, serialize } = await import('../../src/engine/save');
    const s: any = newGame(0, 41);
    s.posture = 'battue';
    s.life = { ...s.life, post: { semer: 3, battue: 9 } };
    s.echoes = [{ id: 1, heroId: 1, name: 'Jehan', gen: 1, traits: [], vocation: null, acts: [0], pow: [1], strength: 0, pos: 0, loops: 0, epithet: 'boucher' }];
    s.ancestors = [{ id: 1, name: 'Jehan', gen: 1, traits: [], epithet: 'grand_veneur' }];
    s.epithets = { semeur: 1, laboureur: 2 };
    const t: any = deserialize(serialize(s))!;
    expect(t.posture).toBeUndefined();
    expect(t.life?.post).toBeUndefined();
    expect(t.echoes[0].epithet).toBeUndefined();
    expect(t.ancestors[0].epithet).toBeUndefined();
    expect(t.epithets).toEqual({ laboureur: 2 });
  });
  test('Destin du jour : quatre choix, codes EL4 ; un code EL3 (consignes) n\'est plus lu', async () => {
    const { DAILY_CHOICES, DailyRun, dailySetup, decodeRun, encodeRun } = await import('../../src/engine/daily');
    expect(DAILY_CHOICES).toEqual(['cultiver', 'commercer', 'etudier', 'mediter']);
    const date = '2026-11-22';
    const run = new DailyRun(dailySetup(date));
    run.setAct('cultiver');
    for (let i = 0; i < 50; i++) run.step();
    run.setAct('commercer');
    const code = encodeRun(date, run.actions, run.score());
    expect(atob(code.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((code.length + 3) % 4)).startsWith('EL4|')).toBe(true);
    expect(decodeRun(code)!.actions).toEqual([[0, 0], [50, 1]]);
    expect(decodeRun(btoa(`EL3|${date}|05|1000`).replace(/=+$/, ''))).toBeNull();
  });
});

describe('SIMPLIF-2 — plus de Domaine ni d\'Harmonie ; rendements compensés (0.5, V3-A)', () => {
  test('rendements V3-A, sans Garde forestier ; production = rendement × puissance, sans facteur caché', async () => {
    const { ACT, BUILDING } = await import('../../src/engine/data');
    const { runActivity } = await import('../../src/engine/sim');
    expect([ACT.cultiver.produce.vivres, ACT.commercer.produce.or, ACT.etudier.produce.savoir, ACT.mediter.produce.essence]).toEqual([1.92, 1.58, 0.76, 0.127]);
    expect(BUILDING.garde).toBeUndefined();
    const res = { vivres: 0, or: 0, savoir: 0, essence: 0 };
    runActivity({ res, prodMult: () => 1 }, 'cultiver', 2, 1, false);
    expect(res.vivres).toBeCloseTo(3.84, 9);
  });
  test('une sauvegarde 0.4 perd son Domaine ; le Garde forestier est remboursé (Or et Vivres payés)', async () => {
    const { deserialize, serialize } = await import('../../src/engine/save');
    const s: any = newGame(0, 42);
    startLife(s);
    s.eco = { F: 40, G: 10 };
    s.buildings = { champs: 3, garde: 2 };
    s.res.or = 5; s.res.vivres = 7;
    s.life.st = { sw: 1, hs: 4, hn: 5, hm: 0.5, ev: 0, bd: 0 };
    const t: any = deserialize(serialize(s))!;
    expect(t.eco).toBeUndefined();
    expect(t.buildings).toEqual({ champs: 3 });
    expect(t.res.or).toBe(5 + 60 + 120);
    expect(t.res.vivres).toBe(7 + 100 + 200);
    expect(t.life.st).toEqual({ sw: 1, ev: 0, bd: 0 });
  });
});

describe('SIMPLIF-3 — la lignée remplace le Domaine dans les conditions (0.5)', () => {
  const base = {
    share: { cultiver: 0.2, commercer: 0.3, etudier: 0.3, mediter: 0.2 }, used: 4, switches: 10, value: 100, parentValue: 300,
    bestBefore: 1000, gen: 12, traits: [] as string[], negTraits: 0, vocTier: 0, durRatio: 1, extended: false, spouse: null,
    eventTier: 0, builds: 0,
  };
  test('chaîne de longévité : usure du sang (Robuste ≥ 2, Longévité ≥ 2 sans mauvais présage), puis un record', async () => {
    const { ripeTraits } = await import('../../src/engine/evolution');
    expect(ripeTraits(['robuste'], { ...base, wear: { robuste: 1 } })).toEqual({});
    expect(ripeTraits(['robuste'], { ...base, wear: { robuste: 2 } })).toEqual({ robuste: 'longevite' });
    expect(ripeTraits(['longevite'], { ...base, wear: { longevite: 2 } })).toEqual({ longevite: 'centenaire' });
    expect(ripeTraits(['longevite'], { ...base, wear: { longevite: 3 }, negTraits: 1 })).toEqual({});
    expect(ripeTraits(['centenaire'], { ...base, value: 1600 })).toEqual({ centenaire: 'eternel' });
    expect(ripeTraits(['centenaire'], { ...base, value: 1400 })).toEqual({});
  });
  test('surnoms : le Juste, le Jardinier, l\'Ermite et le Glorieux ne lisent plus le Domaine ; plus de Dévastateur', async () => {
    const { EPITHET, pickEpithet } = await import('../../src/engine/epithets');
    const land = { ...base, share: { cultiver: 0.6, commercer: 0.2, etudier: 0.2, mediter: 0 } };
    expect(pickEpithet({ ...land, value: 330 })?.id).toBe('juste');
    expect(pickEpithet({ ...land, value: 500 })?.id).not.toBe('juste');
    expect(pickEpithet({ ...land, traits: ['seve'] })?.id).toBe('jardinier');
    expect(pickEpithet({ ...base, share: { cultiver: 0, commercer: 0, etudier: 0.3, mediter: 0.7 } })?.id).toBe('ermite');
    expect(pickEpithet({ ...base, value: 2500, parentValue: 2000, parentEpithet: 'laboureur' })?.id).toBe('grand'); // parent Commun
    expect(pickEpithet({ ...base, value: 2500, parentValue: 2000, parentEpithet: 'grand' })?.id).toBe('glorieux');
    expect(EPITHET.devastateur).toBeUndefined();
    for (const e of Object.values(EPITHET)) expect(Object.keys(e.mods).every((k) => k === 'pow' || k === 'act')).toBe(true);
  });
  test('haut fait « Sept générations à la terre » : sept chefs d\'affilée qui ont surtout récolté', async () => {
    const { FEAT_DEF } = await import('../../src/engine/feats');
    const s = newGame(0, 43);
    const anc = (dominant: 'cultiver' | 'commercer') => ({ id: 1, name: 'Jehan', gen: 1, traits: [], vocation: null, value: 1, legacy: 1, dominant, diedAt: 0 });
    const land = { ...base, share: { cultiver: 0.6, commercer: 0.2, etudier: 0.2, mediter: 0 } };
    s.ancestors = Array.from({ length: 6 }, () => anc('cultiver'));
    expect(FEAT_DEF.sept_generations.test(s, land)).toBe(true);
    expect(FEAT_DEF.sept_generations.test(s, base)).toBe(false);
    s.ancestors[2] = anc('commercer');
    expect(FEAT_DEF.sept_generations.test(s, land)).toBe(false);
  });
  test('usure : Harmonieux s\'use deux fois moins ; méditer ne purifie pas le sang (écarté à la mesure)', async () => {
    const { genHeirs } = await import('../../src/engine/game');
    const { Rng } = await import('../../src/engine/rng');
    const s = newGame(0, 44);
    s.upgrades.transmission = 5;
    const heirWear = (traits: string[]) => {
      const p = { ...s.hero, traits, wear: { robuste: 4, harmonieux: 4 } };
      for (let seed = 1; seed < 200; seed++) {
        const h = genHeirs(s, p, new Rng(seed), {}).find((x) => x.traits.includes('robuste'));
        if (h) return h.wear?.robuste;
      }
      return undefined;
    };
    expect(heirWear(['robuste'])).toBe(5);
    expect(heirWear(['robuste', 'harmonieux'])).toBe(4.5);
  });
  test('dot : un héros Marchand la négocie (÷2), le Grand marché aussi pendant sa fenêtre', async () => {
    const { dowry } = await import('../../src/engine/alliances');
    const { EVENT_DEF } = await import('../../src/engine/data');
    const { activeEvent } = await import('../../src/engine/events');
    const s = newGame(0, 45);
    s.res.or = 10000;
    expect(dowry(s, 'pnj')).toBe(500);
    s.hero.vocation = { act: 'commercer', tier: 2 };
    expect(dowry(s, 'pnj')).toBe(250);
    s.hero.vocation = null;
    expect(EVENT_DEF.migration.name).toBe('Grand marché');
    expect(EVENT_DEF.migration.act).toEqual({ commercer: 2 });
    let t = Date.UTC(2026, 10, 1);
    while (activeEvent(t)?.def.id !== 'migration') t += 3600_000;
    expect(dowry(s, 'pnj', t)).toBe(250);
    expect(dowry(s, 'joueur', t)).toBe(125);
  });
  test('sauvegarde : le Dévastateur disparaît des Échos et du Codex', async () => {
    const { deserialize, serialize } = await import('../../src/engine/save');
    const s: any = newGame(0, 46);
    s.epithets = { devastateur: 1, juste: 2 };
    s.ancestors = [{ id: 1, name: 'Jehan', gen: 1, traits: [], epithet: 'devastateur' }];
    const t: any = deserialize(serialize(s))!;
    expect(t.epithets).toEqual({ juste: 2 });
    expect(t.ancestors[0].epithet).toBeUndefined();
  });
});

describe('Archives de la maison retirées (0.5)', () => {
  test('plus de bâtiment ni de sous-onglet Archives ; Mémoire n\'a que les Échos', async () => {
    const { BUILDING } = await import('../../src/engine/data');
    const { SUBS } = await import('../../src/ui/nav');
    expect(BUILDING.archives).toBeUndefined();
    expect(SUBS.memoire.map((x) => x.id)).toEqual(['echos']);
  });
  test('une sauvegarde avec des Archives est remboursée (Savoir et Or) et les perd', async () => {
    const { deserialize, serialize } = await import('../../src/engine/save');
    const s: any = newGame(0, 47);
    s.buildings.archives = 2;
    s.res.savoir = 0; s.res.or = 0;
    const t: any = deserialize(serialize(s))!;
    expect(t.buildings.archives).toBeUndefined();
    expect(t.res.savoir).toBe(40 + 104);
    expect(t.res.or).toBe(120 + 312);
  });
});

describe('SIMPLIF-5 — Destin du jour sans Domaine : nouveaux modificateurs (0.5)', () => {
  test('Récolte précoce, Héritage du comté et Disette remplacent les modificateurs de Flore et de Gibier', async () => {
    const { DAILY_MODS, DailyRun, dailySetup } = await import('../../src/engine/daily');
    const ids = DAILY_MODS.map((m) => m.id);
    for (const gone of ['fertiles', 'abondance', 'hiver']) expect(ids).not.toContain(gone);
    expect(ids).toEqual(expect.arrayContaining(['precoce', 'heritage_comte', 'disette']));
    const precoce = DAILY_MODS.find((m) => m.id === 'precoce')!;
    const setup = { ...dailySetup('2026-11-22'), mods: [precoce] };
    const run = new DailyRun(setup);
    expect(run.ctx.prodMult('cultiver')).toBe(1.5);
    run.setAct('cultiver');
    for (let i = 0; i < 300; i++) run.step();
    expect(run.ctx.prodMult('cultiver')).toBe(1);
    // Ressources de départ imposées par le tirage du jour
    for (let k = 0; k < 200; k++) {
      const d = new Date(Date.UTC(2026, 0, 1) + k * 86400e3).toISOString().slice(0, 10);
      const su = dailySetup(d);
      if (su.mods.some((m) => m.id === 'disette')) expect(su.startRes.vivres).toBe(0);
      if (su.mods.some((m) => m.id === 'heritage_comte')) expect(su.startRes.or).toBe(10);
    }
  });
});

describe('UX-EVT 1 — texte de l\'événement stable (0.6)', () => {
  test('la ligne d\'objectif garde la même longueur quand le score varie', async () => {
    const { eventGoalLine } = await import('../../src/ui/eventview');
    const lens = new Set<number>();
    for (let p = 0; p < 1000; p += 7) lens.add(eventGoalLine({ target: 1000, progress: p, tier: 0, v: 2 }).length);
    // « Vers 🥉 : 0 % » à « Vers 🥉 : 99 % » : au plus deux chiffres, donc deux longueurs.
    expect(lens.size).toBeLessThanOrEqual(2);
    expect(eventGoalLine({ target: 1000, progress: 999, tier: 0, v: 2 })).toBe('Vers 🥉 : 99 %');
    expect(eventGoalLine({ target: 1000, progress: 1500, tier: 1, v: 2 })).toBe('Vers 🥈 : 50 %');
    expect(eventGoalLine({ target: 1000, progress: 9000, tier: 3, v: 2 })).toBe('🥇 Or atteint !');
    expect(eventGoalLine(undefined)).toBe('Vers 🥉 : 0 %');
  });
});

describe('DESTIN-0 — Destin du jour mis en réserve, une seule page d\'événements (0.6)', () => {
  test('le Destin n\'a plus qu\'un sous-onglet (événement, Veillée et calendrier)', async () => {
    const { SUBS, SUB_TAB, subsShown } = await import('../../src/ui/nav');
    expect(SUBS.destin.map((x) => x.id)).toEqual(['jour']);
    expect(SUB_TAB.jour).toBe('destin');
    expect(subsShown(newGame(0, 1), 'destin', 'mobile')).toHaveLength(1);
  });
  test('l\'interface ne lance plus la Commande du comté (le moteur reste)', async () => {
    const fs = await import('node:fs');
    const app = fs.readFileSync('src/ui/app.ts', 'utf8');
    expect(app).not.toMatch(/engine\/daily/);
    expect(app).not.toMatch(/dailyRec\(/);
    const daily = await import('../../src/engine/daily');
    expect(typeof daily.dailySetup).toBe('function');
  });
});

describe('CODEX-NEW — nouveautés du Codex gardées dans la sauvegarde (0.6)', () => {
  test('un surnom gagné avant un rechargement reste signalé jusqu\'à la visite', async () => {
    const { codexFresh, markCodexSeen } = await import('../../src/engine/codex');
    const { serialize, deserialize } = await import('../../src/engine/save');
    const s = newGame(0, 4);
    expect(codexFresh(s)).toEqual([]);
    s.epithets.patient = 1;
    s.feats = { lignee: 123 };
    const back = deserialize(serialize(s))!; // rechargement (ou rattrapage hors ligne puis rechargement)
    expect(codexFresh(back).sort()).toEqual(['e:patient', 'f:lignee']);
    expect(markCodexSeen(back).length).toBe(2);
    expect(codexFresh(back)).toEqual([]);
    expect(codexFresh(deserialize(serialize(back))!)).toEqual([]);
  });
  test('une ancienne sauvegarde ne signale pas tout son Codex comme nouveau', async () => {
    const { codexFresh } = await import('../../src/engine/codex');
    const { serialize, deserialize } = await import('../../src/engine/save');
    const s = newGame(0, 5);
    s.epithets.patient = 2;
    s.almanach = ['maree'];
    delete s.codexSeen; // sauvegarde d'avant la 0.6
    expect(codexFresh(deserialize(serialize(s))!)).toEqual([]);
  });
});

describe('MAISON-1 — titres de famille et blason gagné (0.6)', () => {
  test('le rang monte avec la génération, les surnoms et les hauts faits, et s\'annonce une fois', async () => {
    const { HOUSE_RANKS, announceRanks, houseRank, nextRankNeeds } = await import('../../src/engine/maison');
    const s = newGame(0, 6);
    expect(houseRank(s)).toBe(0);
    s.hero.gen = 59;
    expect(HOUSE_RANKS[houseRank(s)].id).toBe('seigneurie');
    s.hero.gen = 400; // génération seule : bloqué faute de surnoms
    expect(HOUSE_RANKS[houseRank(s)].id).toBe('seigneurie');
    for (const id of ['a', 'b', 'c', 'd', 'e', 'f']) s.epithets[id] = 1;
    s.feats = { x: 1 };
    expect(HOUSE_RANKS[houseRank(s)].id).toBe('comte');
    expect(nextRankNeeds(s)!.rank.id).toBe('marquisat');
    expect(announceRanks(s).map((r) => r.id)).toEqual(['seigneurie', 'baronnie', 'comte']);
    expect(announceRanks(s)).toEqual([]);
  });
  test('les partitions se gagnent ; celles achetées avant la 0.6 restent acquises', async () => {
    const { partitionOpen } = await import('../../src/engine/maison');
    const s = newGame(0, 7);
    expect(partitionOpen(s, 'plein')).toBe(true);
    expect(partitionOpen(s, 'parti')).toBe(false);
    s.hero.gen = 5;
    expect(partitionOpen(s, 'parti')).toBe(true);
    expect(partitionOpen(s, 'ecartele')).toBe(false);
    s.partitions.push('ecartele'); // achetée 3 ✦ en 0.5
    expect(partitionOpen(s, 'ecartele')).toBe(true);
    const game = await import('../../src/engine/game');
    expect('buyPartition' in game).toBe(false);
  });
  test('écartelé d\'alliance et bordure dessinés dans l\'écu', async () => {
    const { shieldSvg, timbreSvg } = await import('../../src/ui/heraldry');
    const svg = shieldSvg('🦁', 'parti', { quarter: { crest: '🐺', color: '#123456' }, bordure: '#b3261e' });
    expect(svg).toContain('fill="#123456"');
    expect(svg).toContain('stroke="#b3261e"');
    expect(svg).not.toContain('shield-part'); // l'écartelé remplace la partition
    expect(svg.match(/class="hd-charge"/g)).toHaveLength(4);
    expect(timbreSvg(0)).toBe('');
    for (let r = 1; r <= 5; r++) expect(timbreSvg(r)).toMatch(/^<svg/);
  });
  test('seules les maisons unies par un mariage peuvent être écartelées', async () => {
    const { quarterChoices } = await import('../../src/engine/maison');
    const s = newGame(0, 8);
    const house = { id: 'h1', name: 'Dubois', crest: '🐺', color: '#123456' };
    s.alliances.h1 = { house, origin: 'pnj', count: 0, lastGen: 1 };
    expect(quarterChoices(s)).toEqual([]);
    s.alliances.h1.count = 1;
    expect(quarterChoices(s)).toEqual([house]);
  });
});

describe('VEILLEE — Veillée des ancêtres pendant les événements (0.6)', () => {
  const mkEv = async () => {
    const { activeEvent } = await import('../../src/engine/events');
    const start = Date.UTC(2026, 10, 24, 8, 0, 0);
    return { ev: activeEvent(start + 1000)!, start };
  };
  test('un souvenir toutes les 5 min, 9 par événement, 3 en attente au plus', async () => {
    const { observeVeillee, veilleeSlots } = await import('../../src/engine/veillee');
    const { ev, start } = await mkEv();
    expect(ev).not.toBeNull();
    expect(veilleeSlots(ev, start)).toBe(1);
    expect(veilleeSlots(ev, start + 44 * 60_000)).toBe(9);
    expect(veilleeSlots(ev, ev.end + 60_000)).toBe(9);
    const s = newGame(0, 9);
    expect(observeVeillee(s, ev, start + 11 * 60_000)).toBe(3);
    expect(observeVeillee(s, ev, start + 21 * 60_000)).toBe(3); // 5 ouverts : 2 perdus
    expect(s.veillee!.lost).toBe(2);
  });
  test('passer trois fois rapporte autant que rester ; le surplus se perd', async () => {
    const { answerVeillee } = await import('../../src/engine/veillee');
    const { ev, start } = await mkEv();
    const assidu = newGame(0, 10), passant = newGame(0, 10);
    for (let m = 0; m < 45; m++) answerVeillee(assidu, ev, start + m * 60_000, 'devise');
    for (const m of [14, 29, 44]) for (let k = 0; k < 3; k++) answerVeillee(passant, ev, start + m * 60_000, 'devise');
    expect(assidu.souvenirs!.devise).toBe(9);
    expect(passant.souvenirs!.devise).toBe(9);
    const absent = newGame(0, 10);
    for (let k = 0; k < 5; k++) answerVeillee(absent, ev, start + 44 * 60_000, 'bordure');
    expect(absent.souvenirs!.bordure).toBe(3);
  });
  test('les souvenirs débloquent bordures et devises, sans toucher à la production', async () => {
    const { answerVeillee } = await import('../../src/engine/veillee');
    const { borduresOpen, SOUVENIRS_PER_UNLOCK } = await import('../../src/engine/maison');
    const { ev, start } = await mkEv();
    const s = newGame(0, 11);
    const res = JSON.stringify(s.res), eclats = s.eclats;
    let unlocked: string | null = null;
    for (let k = 0; k < SOUVENIRS_PER_UNLOCK; k++) unlocked = answerVeillee(s, ev, start + k * 5 * 60_000, 'bordure')!.unlocked;
    expect(unlocked).toBe('la bordure de gueules');
    expect(borduresOpen(s).map((b) => b.id)).toEqual(['gueules']);
    expect(JSON.stringify(s.res)).toBe(res);
    expect(s.eclats).toBe(eclats);
  });
  test('la scène nomme un ancêtre de la maison et reste la même pour un même souvenir', async () => {
    const { veilleeScene } = await import('../../src/engine/veillee');
    const { runBot } = await import('../bot');
    const { ev } = await mkEv();
    const { s } = runBot(1, 3);
    const a = veilleeScene(s, ev, 2), b = veilleeScene(s, ev, 2);
    expect(a).toEqual(b);
    expect(a.who).not.toBeNull();
    expect(a.text).toContain(a.who!.split(' ')[0]);
    expect(a.text).not.toMatch(/\{/);
    const fresh = veilleeScene(newGame(0, 12), ev, 0);
    expect(fresh.who).toBeNull();
    expect(fresh.text).toMatch(/^[A-ZÉÀ]/);
  });
});

describe('THEMES — thèmes de couleur (0.6)', () => {
  test('Crépuscule et Parchemin d\'office ; un thème d\'événement après 3 médailles d\'or', async () => {
    const { THEMES, announceThemes, themeOpen } = await import('../../src/engine/maison');
    const s = newGame(0, 13);
    expect(THEMES.filter((t) => themeOpen(s, t.id)).map((t) => t.id)).toEqual(['crepuscule', 'parchemin']);
    s.eventGolds = { eclipse: 2 };
    expect(themeOpen(s, 'eclipse')).toBe(false);
    s.eventGolds.eclipse = 3;
    expect(themeOpen(s, 'eclipse')).toBe(true);
    expect(announceThemes(s).map((t) => t.id)).toEqual(['eclipse']);
    expect(announceThemes(s)).toEqual([]);
  });
  test('l\'or d\'un événement est compté par type, sans rien changer d\'autre', async () => {
    const { activeEvent } = await import('../../src/engine/events');
    const { tick } = await import('../../src/engine/game');
    const { newRuntime, startLife, setActivity } = await import('../../src/engine/game');
    const t0 = Date.UTC(2026, 10, 24, 8, 1, 0);
    const s = newGame(t0, 14); startLife(s); setActivity(s, 'cultiver');
    const rt = newRuntime();
    tick(s, rt, 0.1, t0);
    const ev = activeEvent(t0)!;
    s.events[ev.key].progress = s.events[ev.key].target * 100;
    tick(s, rt, 0.1, t0 + 100);
    expect(s.events[ev.key].tier).toBe(3);
    expect(s.eventGolds).toEqual({ [ev.def.id]: 1 });
  });
  test('une ancienne sauvegarde compte un or par page d\'Almanach', async () => {
    const { serialize, deserialize } = await import('../../src/engine/save');
    const s = newGame(0, 15);
    s.almanach = ['maree', 'comete'];
    delete s.eventGolds;
    expect(deserialize(serialize(s))!.eventGolds).toEqual({ maree: 1, comete: 1 });
  });
  test('chaque thème a son bloc de couleurs dans la feuille de style', async () => {
    const fs = await import('node:fs');
    const css = fs.readFileSync('src/style.css', 'utf8');
    const { THEMES } = await import('../../src/engine/maison');
    for (const t of THEMES.slice(1)) expect(css).toContain(`:root[data-theme="${t.id}"]`);
    expect(css).not.toMatch(/rgba\(20, 17, 31/); // barres du haut et du bas : couleur du thème, plus en dur
  });
});

describe('THEMES 2 — thème clair : fonds pleins en or clair, creux teintés (0.6)', () => {
  test('les boutons pleins et les creux passent par des variables que Parchemin redéfinit', async () => {
    const fs = await import('node:fs');
    const css = fs.readFileSync('src/style.css', 'utf8');
    expect(css).toMatch(/\.btn-primary \{ background: linear-gradient\(180deg, var\(--fill1\), var\(--fill2\)\)/);
    expect(css).not.toMatch(/background: rgba\(0, 0, 0, 0\.(2|22|25|35)\)/);
    const parchemin = css.match(/:root\[data-theme="parchemin"\] \{([^}]*)\}/)![1];
    for (const v of ['--fill1', '--fill2', '--well', '--well-strong']) expect(parchemin).toContain(v);
  });
});

describe('DICTON — le « Dicton des anciens » quitte le Codex (0.6)', () => {
  test('plus de dicton ni de style associé', async () => {
    const fs = await import('node:fs');
    expect(fs.readFileSync('src/ui/legends.ts', 'utf8')).not.toContain('Dicton des anciens');
    expect(fs.readFileSync('src/style.css', 'utf8')).not.toContain('codex-lore');
  });
});

describe('TUTO-1 — tutoriel de la première partie (0.6)', () => {
  const fresh = () => {
    const s = newGame(0, 4);
    s.flags.started = true;
    startLife(s);
    setActivity(s, null); // la première vie attend le joueur (main.ts)
    return s;
  };

  test('rien pendant la cérémonie de fondation', async () => {
    const { currentHint } = await import('../../src/ui/tuto');
    const s = newGame(0, 4);
    expect(currentHint(s, 'mobile')).toBeNull();
  });

  test('1. la première vie démarre en pause, le halo désigne Récolter, le choix coche l\'étape', async () => {
    const { currentHint, tutoAutoDone, lifeWaitsForPlayer } = await import('../../src/ui/tuto');
    const { isPaused } = await import('../../src/engine/game');
    const s = fresh();
    expect(isPaused(s)).toBe(true);
    expect(lifeWaitsForPlayer(s)).toBe(true);
    const h = currentHint(s, 'mobile')!;
    expect(h.id).toBe('start');
    expect(h.tuto).toBe(true);
    expect(h.halo).toEqual(['.act[data-act="cultiver"]']);
    setActivity(s, 'cultiver');
    tutoAutoDone(s);
    expect(s.flags.hint_start).toBe(true);
    expect(lifeWaitsForPlayer(s)).toBe(false);
    expect(currentHint(s, 'mobile')).toBeNull();
  });

  test('pas d\'astuce « pause » tant qu\'aucun Écho ne produit (la pause fige tout en génération 1)', async () => {
    const { currentHint, tutoAutoDone } = await import('../../src/ui/tuto');
    const s = fresh();
    setActivity(s, 'cultiver'); tutoAutoDone(s);
    setActivity(s, null);
    expect(currentHint(s, 'mobile')?.id).not.toBe('pause');
    s.echoes.push({} as never);
    s.hero.gen = 2;
    s.flags.hint_echo2 = true;
    expect(currentHint(s, 'mobile')?.id).toBe('pause');
  });

  test('2. à 25 Vivres, le halo mène aux Champs ; bâtir coche l\'étape', async () => {
    const { currentHint, tutoAutoDone } = await import('../../src/ui/tuto');
    const { buyBuilding } = await import('../../src/engine/game');
    const s = fresh();
    setActivity(s, 'cultiver'); tutoAutoDone(s);
    s.res.vivres = 25;
    const h = currentHint(s, 'mobile')!;
    expect(h.id).toBe('build');
    expect(h.halo.some((x) => x.includes('data-tab="ameliorer"'))).toBe(true);
    expect(h.halo.some((x) => x.includes('data-bld="champs"'))).toBe(true);
    expect(buyBuilding(s, 'champs')).toBe(true);
    tutoAutoDone(s);
    expect(s.flags.hint_build).toBe(true);
  });

  test('3 à 6. Commercer, promesse de l\'Écho, mort, preuve de l\'Écho', async () => {
    const { currentHint, dismissHint, tutoAutoDone } = await import('../../src/ui/tuto');
    const { endLife, confirmSuccession } = await import('../../src/engine/game');
    const s = fresh();
    setActivity(s, 'cultiver'); tutoAutoDone(s);
    s.unlocked.push('commercer');
    expect(currentHint(s, 'mobile')?.id).toBe('commerce');
    setActivity(s, 'commercer'); tutoAutoDone(s);
    expect(s.flags.hint_commerce).toBe(true);
    s.life!.t = 31;
    expect(currentHint(s, 'mobile')?.id).toBe('echo');
    dismissHint(s, 'echo');
    endLife(s, 0);
    const d = currentHint(s, 'mobile')!;
    expect(d.id).toBe('death');
    expect(d.halo).toEqual(['.death-card .btn-primary']);
    confirmSuccession(s, 0, [s.succession!.newEcho.id]);
    tutoAutoDone(s);
    expect(s.flags.hint_death).toBe(true);
    const p = currentHint(s, 'three')!;
    expect(p.id).toBe('echo2');
    expect(p.text).toContain('colonne des Échos');
    expect(p.text).toContain('pause');
    expect(currentHint(s, 'mobile')!.text).toContain('Mémoire › Échos');
  });

  test('« Passer le tuto » coche toutes les étapes et lance la vie', async () => {
    const { currentHint, skipTuto, TUTO_STEPS } = await import('../../src/ui/tuto');
    const { isPaused } = await import('../../src/engine/game');
    const s = fresh();
    skipTuto(s);
    expect(isPaused(s)).toBe(false);
    for (const id of TUTO_STEPS) expect(s.flags['hint_' + id]).toBe(true);
    s.res.vivres = 25; s.unlocked.push('commercer'); s.life!.t = 31;
    expect(currentHint(s, 'mobile')).toBeNull();
  });
});

describe('VIE-1 — consommation proportionnelle (0.7)', () => {
  test('une vie Récolter puis Commercer équilibrée reste équilibrée dans son Écho, à toute force de rejeu', async () => {
    const { runActivity } = await import('../../src/engine/sim');
    const { ACT } = await import('../../src/engine/data');
    // Vie : t1 s de Récolter puis t2 s de Commercer, réglés pour consommer pile les Vivres récoltés.
    const pr = ACT.cultiver.produce.vivres!, co = ACT.commercer.consume.vivres!;
    const t1 = 10, t2 = (t1 * pr) / co;
    for (const power of [1, 0.08, 0.35, 4, 20]) {
      const res = { vivres: 0, or: 0, savoir: 0, essence: 0 };
      const ctx = { res, prodMult: () => 1 };
      runActivity(ctx, 'cultiver', power, t1, false);
      const f = runActivity(ctx, 'commercer', power, t2, false);
      expect(f).toBeCloseTo(1, 9);
      expect(res.vivres).toBeCloseTo(0, 9);
      expect(res.or).toBeCloseTo(ACT.commercer.produce.or! * power * t2, 9);
    }
  });
});
