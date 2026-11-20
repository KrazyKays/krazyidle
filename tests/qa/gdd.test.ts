// QA — conformité au GDD (docs/GAME_DESIGN.md) : chaque règle chiffrée a son test.
import { describe, expect, test } from 'vitest';
import {
  GENOME_BUDGET, LEGACY, LEGACY_DEF, TRAIT, TRAITS, VOCATION_BONUS, WEAR_FLOOR, WEAR_STEP, bMult, genomeWeight, wearMult, xpToNext,
} from '../../src/engine/data';
import { dowry, inbreedingRisk, marry, CADETS_MAX } from '../../src/engine/alliances';
import { AFFUT_DECAY, AFFUT_DRAW, AFFUT_ENTER, AFFUT_EXIT, AFFUT_GAIN, AFFUT_STEALTH, ECO_EQ, TROPHY_OR, ecoPressure, gameVigor, harmonyMult, newEco, updateHunt } from '../../src/engine/ecosystem';
import { EPITHETS, EPITHET_ECLATS } from '../../src/engine/epithets';
import {
  GARDE_REGEN, SHOP, echoPowerMult, echoSlots, endLife, expressGenome, genHeirs, legacyFor, lifeDuration, newRuntime, offlineCapSec, startLife,
} from '../../src/engine/game';
import { DAILY_DUR } from '../../src/engine/daily';
import { EVENT_DURATION_MIN, EVENT_HOURS_UTC } from '../../src/engine/data';
import { Rng } from '../../src/engine/rng';
import { newGame, type Hero, type Spouse } from '../../src/engine/state';

describe('GDD 2.1 — la Vie', () => {
  test('60 s par défaut ; XP ×1,3 par niveau ; vocation +20 %/rang', () => {
    const s = newGame(0, 1);
    expect(lifeDuration(s, { ...s.hero, traits: [] })).toBe(60);
    expect(xpToNext(5) / xpToNext(4)).toBeCloseTo(1.3);
    expect(VOCATION_BONUS).toBe(0.2);
  });
  test('à la naissance, le héros commence l\'activité de sa vocation (Cultiver par défaut)', () => {
    const s = newGame(0, 1);
    startLife(s);
    expect(s.life!.act).toBe('cultiver');
  });
  test('vocation gagnée à 50 % de la vie', () => {
    const s = newGame(0, 1);
    startLife(s);
    s.life!.timeIn.chasser = 30; s.life!.timeIn.cultiver = 30; s.life!.t = 60;
    endLife(s, 0);
    expect(s.succession!.vocationEarned?.tier).toBe(1);
  });
});

describe('GDD 2.2 — les Échos', () => {
  test('puissance de base 40 % ; 2 emplacements +1 par Crypte', () => {
    const s = newGame(0, 1);
    expect(echoPowerMult(s, newRuntime())).toBeCloseTo(0.4);
    expect(echoSlots(s)).toBe(2);
    s.upgrades.crypte = 3;
    expect(echoSlots(s)).toBe(5);
  });
});

describe('GDD 2.3 — la Lignée', () => {
  test('budget 6, poids 1/1/2/3/4, 4 traits au plus, Élu+Éternel+Sang doré+Centenaire = 10', () => {
    expect(GENOME_BUDGET).toBe(6);
    expect(TRAITS.filter((t) => !t.neg).map((t) => [t.rarity, genomeWeight([t.id])]).every(([r, w]) => w === [1, 1, 2, 3, 4][r])).toBe(true);
    expect(genomeWeight(['elu', 'eternel', 'sang_dore', 'centenaire'])).toBe(10);
    const rng = new Rng(3);
    for (let i = 0; i < 500; i++) expect(expressGenome(['elu', 'eternel', 'genie', 'prodige', 'fragile', 'distrait'], rng).length).toBeLessThanOrEqual(4);
  });
  test('usure : ×(1 − 0,06·n), plancher 0,3', () => {
    expect(WEAR_STEP).toBe(0.06);
    expect(WEAR_FLOOR).toBe(0.3);
    expect(wearMult(3)).toBeCloseTo(0.82);
    expect(wearMult(12)).toBeCloseTo(0.3);
  });
  test('un trait parental passe avec 50 % de chance (sans usure)', () => {
    const s = newGame(0, 1);
    const parent: Hero = { ...s.hero, traits: ['prodige'], wear: {} };
    const rng = new Rng(17);
    let got = 0, n = 0;
    for (let i = 0; i < 4000; i++) for (const h of genHeirs(s, parent, rng)) { n++; if (h.traits.includes('prodige')) got++; }
    // mutation « prodige » possible (~1 %) : tolérance
    expect(got / n).toBeGreaterThan(0.48);
    expect(got / n).toBeLessThan(0.54);
  });

  // QA-05 (requalifié en documentation par l'audit du 2026-11-14) : la 1ʳᵉ mutation est tirée avec 85 % de chance
  // et la 2ᵉ avec 25 % : environ 11 % des héritiers n'en ont aucune, comme le dit le GDD (§ 2.3).
  test('QA-05 : environ 11 % des héritiers n\'ont aucune mutation', () => {
    const s = newGame(0, 7);
    const parent: Hero = { ...s.hero, traits: [], vocation: null };
    const rng = new Rng(123);
    let zero = 0, n = 0;
    for (let i = 0; i < 2000; i++) for (const h of genHeirs(s, parent, rng)) { n++; if (h.traits.length === 0) zero++; }
    expect(zero / n).toBeGreaterThan(0.09);
    expect(zero / n).toBeLessThan(0.14);
  });

  test('3 héritiers, jusqu\'à 6 ; arbre d\'Héritage de 11 améliorations', () => {
    const s = newGame(0, 1);
    expect(genHeirs(s, s.hero, new Rng(1))).toHaveLength(3);
    expect(LEGACY).toHaveLength(11);
  });

  // QA-09 (Faible, ambiguïté du GDD) : « 4 traits au maximum » et « Bénédictions hors budget ».
  // Avec 2 Bénédictions, un héritier porte jusqu'à 6 traits. On documente le comportement actuel.
  test('comportement actuel QA-09 : avec 2 Bénédictions, un héritier peut porter 6 traits', () => {
    const s = newGame(0, 9);
    s.blessings = ['astres', 'elu'];
    const parent: Hero = { ...s.hero, traits: ['eternel', 'centenaire', 'sang_dore', 'genie', 'fragile', 'distrait'], wear: {} };
    const rng = new Rng(5);
    let max = 0;
    for (let i = 0; i < 300; i++) for (const h of genHeirs(s, parent, rng)) max = Math.max(max, h.traits.length);
    expect(max).toBe(6);
  });
});

describe('GDD 2.4 — le Domaine', () => {
  test('Harmonie ×0,7 → ×1,3 ; vigueur 0,55 → 1,13 ; pression 1 + ½ ln(p)', () => {
    expect(harmonyMult(newEco())).toBeCloseTo(1.3);
    expect(harmonyMult({ F: 0.5, G: 0.2, P: 0.1 })).toBeCloseTo(0.7, 2);
    expect(gameVigor({ ...ECO_EQ, P: 0 })).toBeCloseTo(0.55);
    expect(gameVigor(ECO_EQ)).toBeCloseTo(1);
    expect(gameVigor({ ...ECO_EQ, P: 1000 })).toBeCloseTo(1.135, 3);
    expect(ecoPressure(Math.E ** 2)).toBeCloseTo(2);
  });
  test('Affût : entrée 60 %, sortie 95 %, 3 % du prélèvement, 80 % en réserve, 1,5 Or, 3 unités, 0,5 %/s', () => {
    expect([AFFUT_ENTER, AFFUT_EXIT, 1 - AFFUT_STEALTH, AFFUT_GAIN, TROPHY_OR, AFFUT_DRAW, AFFUT_DECAY]).toEqual([0.6, 0.95, 0.030000000000000027, 0.8, 1.5, 3, 0.005]);
    const h = { affut: 0, on: false };
    updateHunt(h, { ...ECO_EQ, G: ECO_EQ.G * 0.61 }); expect(h.on).toBe(false);
    updateHunt(h, { ...ECO_EQ, G: ECO_EQ.G * 0.59 }); expect(h.on).toBe(true);
    updateHunt(h, { ...ECO_EQ, G: ECO_EQ.G * 0.94 }); expect(h.on).toBe(true);
    updateHunt(h, { ...ECO_EQ, G: ECO_EQ.G * 0.95 }); expect(h.on).toBe(false);
  });
  test('Garde forestier +0,4 %/s par niveau', () => {
    expect(GARDE_REGEN).toBe(0.004);
  });
});

describe('GDD 2.5 — le monde partagé', () => {
  test('événements à 0/4/8/12/16/20 h UTC, 45 min ; Destin du jour 90 s ; Temps suspendu +30 s ; partition 3 ✦', () => {
    expect(EVENT_HOURS_UTC).toEqual([0, 4, 8, 12, 16, 20]);
    expect(EVENT_DURATION_MIN).toBe(45);
    expect(DAILY_DUR).toBe(90);
    expect(SHOP.partition.cost).toBe(3);
    expect(SHOP.temps.desc).toMatch(/30 s/);
  });
});

describe('GDD 2.6 / 2.7 — Chroniques et Alliances', () => {
  test('35 surnoms en 4 raretés (la Comète en 0.3), 1 à 5 ✦ ; Chroniques 90 ⚜️, Alliances 45 ⚜️ (R12)', () => {
    expect(EPITHETS).toHaveLength(35);
    expect(new Set(EPITHETS.map((e) => e.rarity)).size).toBe(4);
    expect(Math.min(...EPITHET_ECLATS)).toBe(1);
    expect(Math.max(...EPITHET_ECLATS)).toBe(5);
    expect(LEGACY_DEF.chroniques.base).toBe(90);
    expect(LEGACY_DEF.alliances.base).toBe(45);
  });
  test('dot : 5 % de l\'Or en stock (R11), 50 au minimum, moitié prix entre joueurs ; 8 cadets', () => {
    const s = newGame(0, 1);
    expect(dowry(s, 'pnj')).toBe(50);
    expect(dowry(s, 'joueur')).toBe(25);
    s.totalEver.or = 100_000; // l'Or produit par le passé ne compte plus
    expect(dowry(s, 'pnj')).toBe(50);
    s.res.or = 40_000;
    expect(dowry(s, 'pnj')).toBe(2000);
    expect(dowry(s, 'joueur')).toBe(1000);
    expect(CADETS_MAX).toBe(8);
  });
  test('consanguinité : +15 % par union de plus avec la même maison, 60 % au plus', () => {
    const s = newGame(0, 1);
    s.upgrades.alliances = 1;
    startLife(s);
    const sp: Spouse = { name: 'Ysolde', sex: 'f', gen: 1, traits: [], vocation: null, house: { id: 'pnj:X', name: 'X', crest: '🦁', color: '#000000' }, origin: 'pnj' };
    const risks: number[] = [];
    for (let i = 0; i < 7; i++) {
      s.res.or = 1e9;
      s.hero = { ...s.hero, spouse: undefined };
      expect(marry(s, sp).ok).toBe(true);
      risks.push(inbreedingRisk(s, sp));
    }
    [0, 0.15, 0.3, 0.45, 0.6, 0.6, 0.6].forEach((r, i) => expect(risks[i]).toBeCloseTo(r, 9));
  });
});

describe('GDD 1 / 3 — économie', () => {
  test('Héritage en racine cubique ; bâtiments ×2 tous les 10 niveaux ; hors ligne 6 h + 2 h/Patience', () => {
    expect(legacyFor(20 * 27)).toBe(3);
    expect(bMult(10, 0.25) / bMult(9, 0.25)).toBeCloseTo((3.5 * 2) / 3.25);
    const s = newGame(0, 1);
    expect(offlineCapSec(s)).toBe(21600);
    s.upgrades.patience = 1;
    expect(offlineCapSec(s)).toBe(28800);
  });
  test('tous les traits référencés existent', () => {
    for (const t of TRAITS) expect(TRAIT[t.id]).toBe(t);
  });
});
