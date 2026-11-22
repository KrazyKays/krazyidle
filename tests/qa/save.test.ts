// QA — sauvegarde : export/import à tous les moments clés, migration, entrées malformées.
import { describe, expect, test } from 'vitest';
import { acceptProposal, encodeProposal } from '../../src/engine/alliances';
import { confirmSuccession, endLife, newRuntime, resumeLife, setActivity, startLife, tick } from '../../src/engine/game';
import { deserialize, exportSave, importSave, serialize } from '../../src/engine/save';
import { newGame, SAVE_VERSION, type GameState } from '../../src/engine/state';
import { clone, invariants, playRandom, T0 } from './helpers';

/** Export → import doit redonner exactement le même état (et la même suite de partie). */
function roundTrip(s: GameState) {
  const back = importSave(exportSave(s));
  expect(back).not.toBeNull();
  expect(serialize(back!)).toBe(serialize(s));
  return back!;
}

function sameFuture(a: GameState, b: GameState) {
  const ra = newRuntime(), rb = newRuntime();
  ra.online = rb.online = false;
  for (let i = 0; i < 1200; i++) { tick(a, ra, 0.5, T0 + i * 500); tick(b, rb, 0.5, T0 + i * 500); }
  expect(serialize(a)).toBe(serialize(b));
}

describe('export / import', () => {
  test('en pleine vie (milieu de partie)', () => {
    const { s } = playRandom({ seed: 3, seconds: 2400 });
    if (!s.life) confirmSuccession(s, 0, []);
    const rt = newRuntime(); rt.online = false;
    for (let i = 0; i < 25; i++) tick(s, rt, 0.1, T0 + i * 100);
    expect(s.life!.t).toBeGreaterThan(0);
    const back = roundTrip(s);
    sameFuture(s, back);
  });

  test('succession en attente : héritiers, nouvel Écho et Héritage conservés', () => {
    const { s } = playRandom({ seed: 4, seconds: 1800 });
    if (s.life) endLife(s, T0);
    expect(s.succession).toBeTruthy();
    const back = roundTrip(s);
    expect(back.succession!.heirs.map((h) => h.id)).toEqual(s.succession!.heirs.map((h) => h.id));
    expect(back.life).toBeNull();
    sameFuture(s, back);
  });

  test('vie en pause : la pause est sauvegardée puis levée au lancement', () => {
    const s = newGame(0, 1);
    startLife(s);
    setActivity(s, 'chasser');
    setActivity(s, null);
    const back = roundTrip(s);
    resumeLife(back);
    expect(back.life!.act).toBe('chasser');
  });

  test('avec alliances, cadets, codes utilisés, surnoms et partitions', () => {
    const a = newGame(0, 11), b = newGame(0, 12);
    for (const s of [a, b]) { s.upgrades.alliances = 1; s.upgrades.chroniques = 1; startLife(s); s.res.or = 1e5; }
    b.cadets.push({ ...b.hero, id: 900, traits: ['elu', 'prodige'] });
    expect(acceptProposal(a, encodeProposal(b, b.cadets[0])).ok).toBe(true);
    a.partitions.push('parti');
    a.epithets.juste = 2;
    const back = roundTrip(a);
    expect(back.hero.spouse!.house.id).toBe(b.houseId);
    expect(back.usedCodes).toEqual(a.usedCodes);
    expect(back.alliances[b.houseId].count).toBe(1);
  });

  test('accents, emojis et noms de maison exotiques survivent (UTF-8 → base64)', () => {
    const s = newGame(0, 2);
    s.lineage.name = 'Ærøskøbing 🐉 «ÉÈ»';
    expect(roundTrip(s).lineage.name).toBe('Ærøskøbing 🐉 «ÉÈ»');
  });

  test('un code tronqué ou altéré est refusé sans exception', () => {
    const s = playRandom({ seed: 1, seconds: 300 }).s;
    const code = exportSave(s);
    for (const bad of [code.slice(0, code.length / 2), code.slice(0, -7), '', '   ', '!!!', 'e30=' /* {} */, btoa('null'), btoa('[]'), btoa('{"v":"2","hero":{}}')]) {
      expect(() => importSave(bad)).not.toThrow();
      expect(importSave(bad)).toBeNull();
    }
  });
});

describe('migration d\'anciennes sauvegardes', () => {
  test('champs absents (0.1 : ni hunt, ni alliances, ni épithètes, ni sexe, ni lastAct, ni st) → partie jouable', () => {
    const { s } = playRandom({ seed: 6, seconds: 900 });
    const old: any = clone(s);
    for (const k of ['hunt', 'alliances', 'cadets', 'usedCodes', 'epithets', 'partitions', 'houseId']) delete old[k];
    delete old.hero.sex; delete old.hero.wear;
    for (const e of old.echoes) delete e.sex;
    if (old.life) { delete old.life.st; delete old.life.lastAct; delete old.life.baseValue; }
    old.v = 1;
    const m = deserialize(JSON.stringify(old))!;
    expect(m.v).toBe(SAVE_VERSION);
    expect('hunt' in m).toBe(false);
    expect(m.hero.sex).toMatch(/^[fm]$/);
    const rt = newRuntime(); rt.online = false;
    for (let i = 0; i < 600; i++) tick(m, rt, 0.5, T0 + i * 500);
    expect(invariants(m)).toEqual([]);
  });

  test('la migration ne partage pas d\'objets avec la partie neuve de référence', () => {
    const a = deserialize(JSON.stringify({ v: 1, hero: newGame(0, 1).hero, seed: 1, createdAt: 0 }))!;
    const b = deserialize(JSON.stringify({ v: 1, hero: newGame(0, 1).hero, seed: 1, createdAt: 0 }))!;
    a.res.or = 99;
    expect(b.res.or).toBe(0);
  });
});

describe('entrées malformées', () => {
  // QA-02 (corrigé en R3) : une sauvegarde dont le héros n'a pas de `traits` était acceptée par l'import,
  // écrite dans localStorage, puis faisait planter chaque lancement (startLife → sumMods(undefined)).
  test('QA-02 : une sauvegarde au héros incomplet est refusée à l\'import', () => {
    const bad = btoa(JSON.stringify({ v: 2, hero: { name: 'X' }, flags: { started: true } }));
    expect(importSave(bad)).toBeNull();
  });

  test('QA-02 : la sauvegarde locale incomplète reste lisible (jamais écartée sans contrôle à l\'import)', () => {
    expect(deserialize(JSON.stringify({ v: 2, hero: { name: 'X' }, flags: { started: true } }))).not.toBeNull();
  });
});
