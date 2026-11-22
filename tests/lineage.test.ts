// Génome (budget, usure du sang) et mesure des Échos en pts/s.
import { describe, expect, it } from 'vitest';
import { GENOME_BUDGET, TRAIT, genomeWeight, wearMult } from '../src/engine/data';
import {
  echoValueRate, expressGenome, genHeirs, heroWear,
} from '../src/engine/game';
import { Rng } from '../src/engine/rng';
import { importSave, exportSave } from '../src/engine/save';
import { newGame, type Hero } from '../src/engine/state';

const LEGENDS = ['elu', 'eternel', 'sang_dore', 'centenaire'];

describe('génome', () => {
  it('les dons positifs tiennent dans le budget génétique', () => {
    const rng = new Rng(9);
    for (let i = 0; i < 200; i++) {
      const out = expressGenome([...LEGENDS, 'prodige', 'main_verte', 'fragile'], rng);
      expect(genomeWeight(out)).toBeLessThanOrEqual(GENOME_BUDGET);
      expect(out.length).toBeLessThanOrEqual(4);
    }
  });

  it('Élu, Éternel, Sang doré et Centenaire ne tiennent plus ensemble', () => {
    expect(genomeWeight(LEGENDS)).toBeGreaterThan(GENOME_BUDGET);
  });

  it('les héritiers respectent le budget, Bénédictions en sus', () => {
    const s = newGame(0, 3);
    const parent: Hero = { ...s.hero, traits: ['elu', 'centenaire', 'prodige'] };
    s.blessings = ['eternel'];
    const heirs = genHeirs(s, parent, new Rng(1));
    for (const h of heirs) expect(genomeWeight(h.traits.filter((t) => t !== 'eternel'))).toBeLessThanOrEqual(GENOME_BUDGET);
    expect(heirs.every((h) => h.traits.includes('eternel'))).toBe(true);
  });
});

describe('usure du sang', () => {
  it('chaque génération de transmission réduit la chance de passer', () => {
    expect(wearMult(0)).toBe(1);
    expect(wearMult(5)).toBeCloseTo(0.7);
    expect(wearMult(50)).toBeCloseTo(0.3);
  });

  it('un don hérité s\'use d\'une génération, une alliance divise l\'usure par deux', () => {
    const s = newGame(0, 3);
    s.upgrades.transmission = 5;
    const parent: Hero = { ...s.hero, traits: ['elu'], wear: { elu: 6 } };
    const many = (p: Hero) => [1, 2, 3, 4, 5, 6, 7, 8].flatMap((k) => genHeirs(s, p, new Rng(k))).filter((h) => h.traits.includes('elu'));
    const solo = many(parent);
    expect(solo.length).toBeGreaterThan(0);
    // (un Élu né d'une mutation est du sang neuf, sans usure)
    for (const h of solo) expect([7, undefined]).toContain(h.wear?.elu);
    expect(solo.some((h) => h.wear?.elu === 7)).toBe(true);
    const married: Hero = { ...parent, spouse: { name: 'Ysolde', sex: 'f', gen: 1, traits: [], vocation: null, house: { id: 'x', name: 'X', crest: 'lion', color: '#000' }, origin: 'pnj' } };
    const kids = many(married);
    expect(kids.length).toBeGreaterThan(0);
    for (const h of kids) expect([4, undefined]).toContain(h.wear?.elu);
    expect(kids.some((h) => h.wear?.elu === 4)).toBe(true);
  });

  it('les anciennes sauvegardes déduisent l\'usure de la généalogie', () => {
    const s = newGame(0, 3);
    s.hero.traits = ['elu', 'prodige'];
    delete s.hero.wear;
    const anc = (traits: string[]) => ({ id: 0, name: 'A', gen: 1, traits, vocation: null, value: 0, legacy: 0, dominant: null, diedAt: 0 });
    s.ancestors = [anc(['prodige']), anc(['elu']), anc(['elu', 'prodige']), anc(['elu'])];
    expect(heroWear(s, s.hero)).toEqual({ elu: 3 });
  });

  it('l\'usure survit à l\'export', () => {
    const s = newGame(0, 3);
    s.hero.wear = { elu: 4 };
    expect(importSave(exportSave(s))!.hero.wear).toEqual({ elu: 4 });
    expect(TRAIT.elu).toBeTruthy();
  });
});

describe('Échos', () => {
  it('la valeur d\'un Écho se mesure par seconde de boucle', () => {
    expect(echoValueRate({ value: 600, acts: new Array(60).fill(0) })).toBe(10);
    expect(echoValueRate({ value: 600, acts: [] })).toBe(0);
  });
});
