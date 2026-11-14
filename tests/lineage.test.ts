// Génome (budget, usure du sang), Affût de chasse et mesure des Échos en pts/s.
import { describe, expect, it, test } from 'vitest';
import { BUILDINGS, GENOME_BUDGET, LEGACY, RES, RES_INFO, TRAIT, genomeWeight, legacyCost, wearMult, type ActId } from '../src/engine/data';
import { AFFUT_ENTER, ECO_EQ, newEco } from '../src/engine/ecosystem';
import {
  buildingCost, buyBuilding, buyLegacy, canAfford, confirmSuccession, echoSlots, echoValueRate, expressGenome, genHeirs, heroWear, makeCtx, newRuntime, setActivity, startLife, tick,
} from '../src/engine/game';
import { Rng } from '../src/engine/rng';
import { importSave, exportSave } from '../src/engine/save';
import { runActivity } from '../src/engine/sim';
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

describe('Affût', () => {
  it('en disette, la chasse épargne le Gibier et met le butin en réserve', () => {
    const s = newGame(0, 1);
    const rt = newRuntime();
    s.eco = { ...newEco(), G: ECO_EQ.G * (AFFUT_ENTER - 0.2) };
    tick(s, rt, 0.1, 100);
    expect(s.hunt.on).toBe(true);
    const ctx = makeCtx(s, rt);
    const g0 = s.eco.G;
    runActivity(ctx, 'chasser', 5, 1, 1, false);
    expect(s.hunt.affut).toBeGreaterThan(0);
    const spared = g0 - s.eco.G;
    const s2 = newGame(0, 1);
    s2.eco = { ...newEco(), G: g0 };
    runActivity(makeCtx(s2, rt), 'chasser', 5, 1, 1, false);
    expect(spared).toBeLessThan((g0 - s2.eco.G) * 0.1);
  });

  it('la réserve se change en Or quand la chasse rouvre', () => {
    const s = newGame(0, 1);
    const rt = newRuntime();
    s.hunt = { affut: 100, on: false };
    const or0 = s.res.or;
    runActivity(makeCtx(s, rt), 'chasser', 5, 1, 1, false);
    expect(s.hunt.affut).toBeLessThan(100);
    expect(s.res.or).toBeGreaterThan(or0);
  });

  it('les anciennes sauvegardes reçoivent une réserve vide', () => {
    const s = newGame(0, 1) as any;
    delete s.hunt;
    expect(importSave(exportSave(s))!.hunt).toEqual({ affut: 0, on: false });
  });
});

describe('Échos', () => {
  it('la valeur d\'un Écho se mesure par seconde de boucle', () => {
    expect(echoValueRate({ value: 600, acts: new Array(60).fill(0) })).toBe(10);
    expect(echoValueRate({ value: 600, acts: [] })).toBe(0);
  });
});

/** Partie de 3 h : 30 min à cultiver, puis une seule activité. Renvoie la valeur produite ensuite. */
function monoRun(main: ActId, seed: number) {
  const s = newGame(0, seed);
  const rt = newRuntime();
  rt.online = false;
  startLife(s);
  let now = 0, start = 0;
  const value = () => RES.reduce((v, r) => v + s.totalEver[r] * RES_INFO[r].value, 0);
  for (let t = 0; t < 3 * 3600; t += 0.5) {
    now += 500;
    if (s.life) setActivity(s, t < 1800 ? 'cultiver' : main);
    tick(s, rt, 0.5, now);
    if (t === 1800) start = value();
    if (s.succession) {
      const all = [...s.echoes, s.succession.newEcho].sort((a, b) => echoValueRate(b) - echoValueRate(a)).slice(0, echoSlots(s));
      confirmSuccession(s, 0, all.map((e) => e.id));
    }
    if (Math.floor(t) % 5 === 0) {
      let bought = true;
      while (bought) {
        bought = false;
        for (const l of LEGACY) if (legacyCost(l, s.upgrades[l.id] ?? 0) <= s.legacy && buyLegacy(s, l.id)) bought = true;
        for (const b of BUILDINGS) if (canAfford(s, buildingCost(b.id, s.buildings[b.id] ?? 0)) && buyBuilding(s, b.id)) bought = true;
      }
    }
  }
  return value() - start;
}

test('une lignée de chasseurs reste compétitive face aux paysans', () => {
  // Avant l'Affût, une lignée de chasseurs produisait 2 à 6 % de ce que produisent les paysans.
  const seeds = [3, 5, 8, 11, 13];
  const ratios = seeds.map((seed) => monoRun('chasser', seed) / monoRun('cultiver', seed));
  const mean = ratios.reduce((a, b) => a + b, 0) / ratios.length;
  expect(Math.min(...ratios)).toBeGreaterThan(0.25);
  expect(mean).toBeGreaterThan(0.5);
  expect(mean).toBeLessThan(1.3);
}, 120_000);
