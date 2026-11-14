// B2 : effet d'un bon mariage sur la valeur à 6 h et 12 h (campagne C502, lab/design).
// Joueur épargnant (Alliances et Chroniques en premier) ; « marie » s'unit à chaque vie dès que la dot est payable,
// en choisissant le prétendant de la semaine au meilleur score (traits + vocation de même métier que la lignée).
// Usage : node --import ./lab/sim/register.mjs lab/design/mariage.ts <seeds> <heures> [shard k/n]
import { BUILDINGS, LEGACY, legacyCost } from '../../src/engine/data';
import { canMarry, countyHouses, dowry, marry, suitorFor } from '../../src/engine/alliances';
import { buildingCost, buyBuilding, buyLegacy, canAfford } from '../../src/engine/game';
import { sumMods } from '../../src/engine/sim';
import type { GameState } from '../../src/engine/state';
import { PROFILES } from '../sim/profiles';
import { runGame } from '../sim/runner';

function buySaver(s: GameState) {
  const target = !s.upgrades.alliances ? 'alliances' : !s.upgrades.chroniques ? 'chroniques' : null;
  let bought = true;
  while (bought) {
    bought = false;
    if (target && buyLegacy(s, target)) bought = true;
    if (!target) for (const l of LEGACY) if (legacyCost(l, s.upgrades[l.id] ?? 0) <= s.legacy && buyLegacy(s, l.id)) bought = true;
    for (const b of BUILDINGS) if (canAfford(s, buildingCost(b.id, s.buildings[b.id] ?? 0)) && buyBuilding(s, b.id)) bought = true;
  }
}
const base = PROFILES.experimente;
let unions = 0;
PROFILES['m-sans'] = { ...base, id: 'm-sans', buy: (s) => buySaver(s) };
PROFILES['m-marie'] = {
  ...base, id: 'm-marie',
  buy: (s, c) => {
    if (canMarry(s) && s.res.or >= dowry(s, 'pnj')) {
      const sc = (sp: ReturnType<typeof suitorFor>) => { const m = sumMods(sp.traits); return m.all + m.echo * 0.5 + m.xp * 0.3 + (sp.vocation?.act === s.hero.vocation?.act ? 0.5 : 0) - 0.15 * (s.alliances[sp.house.id]?.count ?? 0); };
      const best = countyHouses(c.now).map((h) => suitorFor(s, h, c.now)).sort((a, b) => sc(b) - sc(a))[0];
      if (marry(s, best).ok) unions++;
    }
    buySaver(s);
  },
};
const seeds = Number(process.argv[2] ?? 20), hours = Number(process.argv[3] ?? 6);
const [k, n] = (process.argv[4] ?? '0/1').split('/').map(Number);
let i = 0;
for (const p of ['m-sans', 'm-marie']) for (let seed = 1; seed <= seeds; seed++) {
  if (i++ % n !== k) continue;
  unions = 0;
  const r = runGame({ profile: p, seed, hours });
  console.log(JSON.stringify({ p, seed, hours, log10: r.log10Value, legacy: r.legacyTotal, gen: r.gen, unions }));
}
