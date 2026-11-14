// QA — cas limites : plafonds, achats à coût exact, succession jamais validée, pause prolongée, achats pendant la succession.
import { describe, expect, test } from 'vitest';
import { BUILDING, LEGACY_DEF, VOCATION_MAX, legacyCost } from '../../src/engine/data';
import { CADETS_MAX, addCadets } from '../../src/engine/alliances';
import {
  BLESSING_COST, buildingCost, buyBlessing, buyBuilding, buyLegacy, buyTemps, confirmSuccession, echoSlots, endLife, genHeirs, lifeDuration,
  newRuntime, setActivity, startLife, tick,
} from '../../src/engine/game';
import { Rng } from '../../src/engine/rng';
import { newGame, type GameState } from '../../src/engine/state';
import { invariants, T0 } from './helpers';

function fresh(seed = 1): GameState {
  const s = newGame(0, seed);
  startLife(s);
  return s;
}

describe('plafonds', () => {
  test('Clepsydre : 15 niveaux au plus, +4 s par niveau y compris sur la vie en cours', () => {
    const s = fresh();
    s.res.savoir = s.res.essence = 1e30;
    const d0 = s.life!.dur;
    let n = 0;
    while (buyBuilding(s, 'clepsydre')) n++;
    expect(n).toBe(15);
    expect(s.life!.dur).toBe(d0 + 60);
    expect(lifeDuration(s, s.hero)).toBe(d0 + 60);
  });

  test('Crypte : 6 niveaux, 8 emplacements ; confirmSuccession refuse un Écho de trop', () => {
    const s = fresh();
    s.legacy = s.legacyTotal = 1e9;
    let n = 0;
    while (buyLegacy(s, 'crypte')) n++;
    expect(n).toBe(6);
    expect(echoSlots(s)).toBe(8);
    endLife(s, 0);
    const fake = Array.from({ length: 8 }, (_, i) => ({ ...s.succession!.newEcho, id: 1000 + i }));
    s.echoes = fake;
    expect(confirmSuccession(s, 0, [...fake.map((e) => e.id), s.succession!.newEcho.id])).toBe(false);
    expect(confirmSuccession(s, 0, fake.map((e) => e.id))).toBe(true);
  });

  test('Vocation : jamais au-delà de X, même après 15 vies dans la même activité', () => {
    const s = fresh();
    const rt = newRuntime(); rt.online = false;
    let now = T0;
    for (let life = 0; life < 15; life++) {
      setActivity(s, 'cultiver');
      while (s.life) { tick(s, rt, 0.5, (now += 500)); }
      const sc = s.succession!;
      const heir = Math.max(0, sc.heirs.findIndex((h) => h.vocation?.act === 'cultiver'));
      confirmSuccession(s, heir, []);
      s.hero.vocation = sc.vocationEarned; // force la transmission pour atteindre le plafond
      startLife(s);
    }
    expect(s.hero.vocation!.tier).toBe(VOCATION_MAX);
  });

  test('300 ancêtres au plus, 8 cadets au plus', () => {
    const s = fresh();
    s.upgrades.alliances = 1;
    for (let i = 0; i < 320; i++) {
      endLife(s, i);
      confirmSuccession(s, 0, []);
    }
    expect(s.ancestors.length).toBe(300);
    expect(s.cadets.length).toBe(CADETS_MAX);
    addCadets(s, [s.hero, s.hero, s.hero]);
    expect(s.cadets.length).toBe(CADETS_MAX);
    expect(invariants(s)).toEqual([]);
  });

  test('Héritiers : 6 au plus (Sang fécond 3 + Fertile)', () => {
    const s = fresh();
    s.upgrades.sang = 3;
    const parent = { ...s.hero, traits: ['fertile'] };
    expect(genHeirs(s, parent, new Rng(1))).toHaveLength(6);
  });

  test('Temps suspendu : une fois par vie, refusé sans vie', () => {
    const s = fresh();
    s.eclats = 10;
    expect(buyTemps(s)).toBe(true);
    expect(buyTemps(s)).toBe(false);
    endLife(s, 0);
    expect(buyTemps(s)).toBe(false);
    expect(s.eclats).toBe(8);
  });
});

describe('achats à coût exact', () => {
  test('bâtiment payé au centime près : achat accepté, ressource à 0', () => {
    const s = fresh();
    const c = buildingCost('pavillon', 0);
    s.res.vivres = c.vivres!; s.res.or = c.or!;
    expect(buyBuilding(s, 'pavillon')).toBe(true);
    expect(s.res.vivres).toBe(0);
    expect(s.res.or).toBe(0);
    expect(BUILDING.pavillon).toBeTruthy();
  });
  test('un centième de moins : refusé', () => {
    const s = fresh();
    s.res.vivres = buildingCost('champs', 0).vivres! - 0.01;
    expect(buyBuilding(s, 'champs')).toBe(false);
  });
  test('Héritage à coût exact', () => {
    const s = fresh();
    s.legacy = legacyCost(LEGACY_DEF.prosperite, 0);
    expect(buyLegacy(s, 'prosperite')).toBe(true);
    expect(s.legacy).toBe(0);
  });
  test('Bénédiction à coût exact', () => {
    const s = fresh();
    s.eclats = BLESSING_COST[3];
    expect(buyBlessing(s, 'elu')).toBe(true);
    expect(s.eclats).toBe(0);
  });
});

describe('succession jamais validée, pause prolongée', () => {
  test('succession en attente pendant 6 h : les Échos bouclent, rien ne diverge', () => {
    const s = fresh(4);
    const rt = newRuntime(); rt.online = false;
    let now = T0;
    for (let k = 0; k < 3; k++) { while (s.life) tick(s, rt, 0.5, (now += 500)); confirmSuccession(s, 0, [s.succession!.newEcho.id, ...s.echoes.map((e) => e.id)].slice(0, 2)); }
    while (s.life) tick(s, rt, 0.5, (now += 500));
    expect(s.succession).toBeTruthy();
    for (let i = 0; i < 6 * 3600; i++) tick(s, rt, 1, (now += 1000));
    expect(invariants(s)).toEqual([]);
    expect(s.echoes.every((e) => e.loops > 100)).toBe(true);
    expect(confirmSuccession(s, 0, [])).toBe(true);
  });

  test('pause de 6 h : la vie n\'avance pas, aucun enregistrement', () => {
    const s = fresh(5);
    const rt = newRuntime(); rt.online = false;
    setActivity(s, null);
    for (let i = 0; i < 6 * 3600; i++) tick(s, rt, 1, T0 + i * 1000);
    expect(s.life!.t).toBe(0);
    expect(s.life!.rec).toHaveLength(0);
    expect(invariants(s)).toEqual([]);
  });

  test('indice d\'héritier hors bornes : ramené au premier ou au dernier', () => {
    const s = fresh(6);
    endLife(s, 0);
    const heirs = s.succession!.heirs;
    expect(confirmSuccession(s, 99, [])).toBe(true);
    expect(s.hero.id).toBe(heirs[heirs.length - 1].id);
  });

  // BUG QA-01 : le Bazar reste ouvert pendant la succession en attente (src/ui/app.ts:771-780, aucune
  // condition), buyBlessing l'accepte (src/engine/game.ts:578), mais les héritiers sont déjà tirés
  // (endLife → genHeirs, game.ts:372) et confirmSuccession vide les Bénédictions (game.ts:517).
  // Les Éclats sont dépensés pour rien : ni l'héritier choisi ni ses enfants ne reçoivent le trait.
  test.fails('BUG QA-01 : une Bénédiction achetée pendant la succession n\'est pas perdue', () => {
    const s = fresh(7);
    endLife(s, 0);
    s.eclats = 12;
    expect(buyBlessing(s, 'elu')).toBe(true);
    confirmSuccession(s, 0, []);
    // Soit l'héritier la reçoit, soit elle reste réservée pour la génération suivante.
    expect(s.hero.traits.includes('elu') || s.blessings.includes('elu')).toBe(true);
  });

  test('reproduction QA-01 : Éclats débités, Bénédiction effacée, trait absent', () => {
    const s = fresh(7);
    endLife(s, 0);
    s.eclats = 12;
    buyBlessing(s, 'elu');
    expect(s.eclats).toBe(0);
    confirmSuccession(s, 0, []);
    expect(s.blessings).toEqual([]);
    expect(s.hero.traits).not.toContain('elu');
  });
});
