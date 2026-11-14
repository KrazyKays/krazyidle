import { describe, expect, test } from 'vitest';
import { ACTS, TRAIT } from '../src/engine/data';
import {
  acceptProposal, countyHouses, decodeProposal, dowry, encodeProposal, isSealed, marry, proposeCadet, readProposal, suitorFor, weekIndex,
} from '../src/engine/alliances';
import { EPITHET, EPITHETS, epithetLabel, fullName, pickEpithet, type LifeFacts } from '../src/engine/epithets';
import { confirmSuccession, endLife, genHeirs, newRuntime, setActivity, startLife, tick } from '../src/engine/game';
import { Rng } from '../src/engine/rng';
import { deserialize, serialize } from '../src/engine/save';
import { newGame, type GameState, type Hero } from '../src/engine/state';

const NOW = Date.UTC(2026, 10, 14, 12);

function facts(over: Partial<LifeFacts> = {}): LifeFacts {
  const share = { cultiver: 0.3, chasser: 0.1, commercer: 0.3, etudier: 0.3, mediter: 0 };
  return {
    share, used: 4, switches: 10, harmonyAvg: 0.8, harmonyMin: 0.6, value: 100, parentValue: 100, bestBefore: 1000, gen: 7,
    traits: [], negTraits: 0, vocTier: 0, durRatio: 1, extended: false, spouse: null, eventTier: 0, builds: 0, game: 29, predators: 11,
    ...over,
    ...(over.share ? { share: { ...share, ...over.share } } : {}),
  };
}

function unlocked(seed = 3): GameState {
  const s = newGame(NOW, seed);
  s.upgrades.alliances = 1;
  s.upgrades.chroniques = 1;
  s.flags.started = true;
  startLife(s);
  return s;
}

describe('surnoms', () => {
  test('identifiants uniques et chaque surnom atteignable', () => {
    expect(new Set(EPITHETS.map((e) => e.id)).size).toBe(EPITHETS.length);
    expect(EPITHETS.length).toBeGreaterThanOrEqual(30);
  });

  test('le plus rare l\'emporte', () => {
    expect(pickEpithet(facts({ share: { cultiver: 0.8, chasser: 0.05, commercer: 0.05, etudier: 0.05, mediter: 0.05 }, used: 1 }))?.id).toBe('laboureur');
    // record + harmonie parfaite à la génération 12 : légendaire, pas seulement « le Grand »
    // record écrasé + harmonie parfaite en vivant de la terre, génération 12 : légendaire
    const land = { cultiver: 0.6, chasser: 0, commercer: 0.2, etudier: 0.2, mediter: 0 };
    expect(pickEpithet(facts({ share: land, value: 2500, bestBefore: 1000, harmonyAvg: 0.97, gen: 12 }))?.id).toBe('glorieux');
    expect(pickEpithet(facts({ value: 1600, bestBefore: 1000, gen: 6 }))?.id).toBe('grand');
    // battre le record de peu ne suffit pas
    expect(pickEpithet(facts({ value: 1100, bestBefore: 1000, gen: 6 }))).toBeNull();
    expect(pickEpithet(facts())).toBeNull();
  });

  test('accords et nom complet', () => {
    const f = { name: 'Mahaut', sex: 'f' as const, epithet: 'juste' };
    expect(fullName(f)).toBe('Mahaut la Juste');
    expect(epithetLabel('patriarche', { name: 'Jehan', sex: 'm' })).toBe('le Patriarche');
    expect(epithetLabel('patriarche', { name: 'Mahaut', sex: 'f' })).toBe('la Matriarche');
    expect(fullName({ name: 'Jehan' })).toBe('Jehan');
  });

  test('aucun surnom avant les Chroniques, puis découverte récompensée', () => {
    const s = newGame(NOW, 5);
    startLife(s);
    setActivity(s, 'cultiver');
    s.life!.t = s.life!.dur - 0.01;
    s.life!.timeIn.cultiver = s.life!.dur;
    endLife(s, NOW);
    expect(s.succession!.newEcho.epithet).toBeUndefined();

    const u = unlocked(5);
    u.life!.timeIn.cultiver = u.life!.dur;
    u.life!.st = { sw: 5, hs: 0.5, hn: 1, hm: 0.5, ev: 0, bd: 0 }; // Domaine troublé et quelques détours : ni « Juste » ni « Constant »
    const e0 = u.eclats;
    endLife(u, NOW);
    expect(u.succession!.newEcho.epithet).toBe('laboureur');
    expect(u.succession!.ancestor.epithet).toBe('laboureur');
    expect(u.succession!.epithet).toEqual({ id: 'laboureur', isNew: true, eclats: 1 });
    expect(u.eclats).toBe(e0 + 1);
    expect(u.epithets.laboureur).toBe(1);
  });

  test('l\'effet du surnom renforce l\'Écho', () => {
    const run = (epithet?: string) => {
      const s = newGame(NOW, 9);
      s.echoes = [{ id: 1, heroId: 1, name: 'Jehan', sex: 'm', gen: 1, traits: [], vocation: null, acts: Array(60).fill(0), pow: Array(60).fill(1), strength: 0, pos: 0, loops: 0, pinned: false, value: 1, epithet }];
      const rt = newRuntime();
      rt.online = false;
      for (let i = 0; i < 100; i++) tick(s, rt, 0.1, NOW);
      return s.res.vivres;
    };
    expect(run('laboureur')).toBeGreaterThan(run() * 1.08);
    expect(EPITHET.laboureur.mods.act?.cultiver).toBe(0.1);
  });

  test('les changements d\'activité sont comptés', () => {
    const s = unlocked();
    s.life!.t = 1;
    setActivity(s, 'chasser');
    setActivity(s, 'cultiver');
    setActivity(s, null);
    setActivity(s, 'cultiver');
    expect(s.life!.st!.sw).toBe(2);
  });
});

describe('maisons du comté', () => {
  test('trois maisons, les mêmes pour tous pendant la semaine', () => {
    const a = countyHouses(NOW), b = countyHouses(NOW + 86400_000);
    expect(a).toHaveLength(3);
    expect(a).toEqual(b);
    expect(new Set(a.map((x) => x.house.name)).size).toBe(3);
    expect(new Set(a.map((x) => x.spec)).size).toBe(3);
    expect(countyHouses(NOW + 7 * 86400_000)).not.toEqual(a);
    expect(weekIndex(NOW + 7 * 86400_000)).toBe(weekIndex(NOW) + 1);
  });

  test('prétendant stable, porteur du don de la maison', () => {
    const s = unlocked();
    const ch = countyHouses(NOW)[0];
    const p = suitorFor(s, ch, NOW);
    expect(p).toEqual(suitorFor(s, ch, NOW + 3600_000));
    expect(p.traits).toContain(ch.gift);
    expect(p.vocation?.act).toBe(ch.spec);
    expect(TRAIT[ch.gift].shop).toBeFalsy();
  });

  test('union : dot, une par vie, alliance enregistrée', () => {
    const s = unlocked();
    const ch = countyHouses(NOW)[1];
    const cost = dowry(s, 'pnj');
    expect(marry(s, suitorFor(s, ch, NOW)).ok).toBe(false); // pas d'Or
    s.res.or = 500;
    expect(marry(s, suitorFor(s, ch, NOW)).ok).toBe(true);
    expect(s.res.or).toBe(500 - cost);
    expect(s.alliances[ch.house.id].count).toBe(1);
    expect(marry(s, suitorFor(s, countyHouses(NOW)[2], NOW)).ok).toBe(false);
  });

  test('sans Alliances, pas de mariage', () => {
    const s = newGame(NOW, 4);
    startLife(s);
    s.res.or = 1000;
    expect(marry(s, suitorFor(s, countyHouses(NOW)[0], NOW)).ok).toBe(false);
  });

  test('les enfants héritent aussi des traits du conjoint', () => {
    const s = unlocked();
    const parent: Hero = { ...s.hero, traits: [], spouse: { name: 'Ysolde', sex: 'f', gen: 1, traits: ['genie', 'longevite'], vocation: null, house: { id: 'pnj:X', name: 'X', crest: '🦁', color: '#c62828' }, origin: 'pnj' } };
    s.alliances['pnj:X'] = { house: parent.spouse!.house, origin: 'pnj', count: 1, lastGen: 1 };
    const rng = new Rng(1);
    let got = 0;
    for (let i = 0; i < 40; i++) got += genHeirs(s, parent, rng).filter((h) => h.traits.includes('genie')).length;
    expect(got).toBeGreaterThan(20);
  });

  test('les enfants non choisis deviennent des cadets', () => {
    const s = unlocked();
    s.life!.t = s.life!.dur;
    endLife(s, NOW);
    const n = s.succession!.heirs.length;
    confirmSuccession(s, 0, []);
    expect(s.cadets).toHaveLength(n - 1);
    expect(s.cadets.every((c) => c.id !== s.hero.id)).toBe(true);
  });
});

describe('mariages entre joueurs', () => {
  function withCadet(seed: number, name: string) {
    const s = unlocked(seed);
    s.lineage.name = name;
    s.cadets.push({ id: 900 + seed, name: 'Aliénor', sex: 'f', gen: 14, traits: ['genie', 'elu', 'eternel', 'astres', 'maudit'], vocation: { act: 'etudier', tier: 9 }, parentId: null });
    s.res.or = 10_000;
    return s;
  }

  test('le code fait l\'aller-retour', () => {
    const alice = withCadet(11, 'Corbin');
    const code = encodeProposal(alice, alice.cadets[0]);
    const p = decodeProposal(code)!;
    expect(p.house.name).toBe('Corbin');
    expect(p.house.id).toBe(alice.houseId);
    expect(p.name).toBe('Aliénor');
    expect(p.vocation).toEqual({ act: 'etudier', tier: 9 });
    expect(decodeProposal(`Rejoins-nous ! ${code} 💍`)).not.toBeNull();
  });

  test('un code altéré est refusé', () => {
    const alice = withCadet(11, 'Corbin');
    const code = encodeProposal(alice, alice.cadets[0]);
    const parts = code.split('-');
    const bad = `${parts[0]}-${parts[1].slice(0, -2)}${parts[1].slice(-2) === 'AA' ? 'BB' : 'AA'}-${parts[2]}`;
    expect(decodeProposal(bad)).toBeNull();
    expect(decodeProposal('n\'importe quoi')).toBeNull();
  });

  test('prétendant borné : ni Bazar, un seul légendaire, vocation plafonnée', () => {
    const alice = withCadet(11, 'Corbin');
    const bruno = withCadet(12, 'Dorval');
    const r = readProposal(bruno, encodeProposal(alice, alice.cadets[0]));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.suitor.traits).not.toContain('astres');
    expect(r.suitor.traits.filter((t) => TRAIT[t].rarity >= 3)).toHaveLength(1);
    expect(r.suitor.traits.length).toBeLessThanOrEqual(4);
    expect(r.suitor.vocation!.tier).toBeLessThanOrEqual((bruno.hero.vocation?.tier ?? 0) + 2);
    expect(r.suitor.origin).toBe('joueur');
  });

  test('accepter, refuser de réutiliser, refuser sa propre maison, puis sceller l\'alliance', () => {
    const alice = withCadet(11, 'Corbin');
    const bruno = withCadet(12, 'Dorval');
    const code = encodeProposal(alice, alice.cadets[0]);
    expect(readProposal(alice, code).ok).toBe(false); // sa propre maison
    expect(acceptProposal(bruno, code).ok).toBe(true);
    expect(bruno.hero.spouse?.name).toBe('Aliénor');
    expect(bruno.res.or).toBe(10_000 - dowry(bruno, 'joueur'));
    expect(readProposal(bruno, code).ok).toBe(false); // déjà acceptée

    // Bruno répond avec l'un de ses cadets : l'alliance est scellée des deux côtés.
    const reply = proposeCadet(bruno, bruno.cadets[0].id, alice.houseId)!;
    expect(isSealed(bruno.alliances[alice.houseId])).toBe(true);
    expect(acceptProposal(alice, reply).ok).toBe(true);
    expect(isSealed(alice.alliances[bruno.houseId])).toBe(true);
  });

  test('l\'épouse ou l\'époux d\'un autre joueur vaut le surnom « Bien-Aimé »', () => {
    expect(pickEpithet(facts({ spouse: 'joueur' }))?.id).toBe('bien_aime');
  });
});

describe('sauvegarde', () => {
  test('les nouvelles données survivent et les anciennes parties migrent', () => {
    const s = unlocked();
    s.epithets.juste = 2;
    s.alliances['pnj:X'] = { house: { id: 'pnj:X', name: 'X', crest: '🦁', color: '#c62828' }, origin: 'pnj', count: 1, lastGen: 3 };
    const back = deserialize(serialize(s))!;
    expect(back.epithets).toEqual({ juste: 2 });
    expect(back.houseId).toBe(s.houseId);
    expect(back.alliances['pnj:X'].count).toBe(1);

    const old: any = JSON.parse(serialize(newGame(NOW, 2)));
    delete old.houseId; delete old.epithets; delete old.alliances; delete old.cadets; delete old.usedCodes;
    old.v = 1;
    const m = deserialize(JSON.stringify(old))!;
    expect(m.houseId).toBeTruthy();
    expect(m.cadets).toEqual([]);
    expect(m.usedCodes).toEqual([]);
    expect(deserialize(JSON.stringify(old))!.houseId).toBe(m.houseId);
  });
});

test('activités valides dans les surnoms', () => {
  for (const e of EPITHETS) for (const a of Object.keys(e.mods.act ?? {})) expect(ACTS).toContain(a);
});
