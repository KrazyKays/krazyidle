// Produit des sauvegardes de milieu de partie avec le vrai moteur (pour les captures Playwright).
// Usage : node --import ./lab/sim/register.mjs lab/design/gen-save.ts <profil> <minutes> <sortie.json> [econome]
import { writeFileSync } from 'node:fs';
import { BUILDINGS, LEGACY, legacyCost } from '../../src/engine/data';
import { buildingCost, buyBuilding, buyLegacy, canAfford } from '../../src/engine/game';
import { serialize } from '../../src/engine/save';
import type { GameState } from '../../src/engine/state';
import { PROFILES, type Profile } from '../sim/profiles';
import { runGame } from '../sim/runner';

const [pid = 'experimente', min = '90', out = 'lab/design/captures/state.json', eco = '0'] = process.argv.slice(2);
const base = PROFILES[pid];
let st: GameState | null = null;
const p: Profile = {
  ...base, id: 'gen',
  activity: (s, c) => { st = s; return base.activity(s, c); },
  // On laisse la dernière succession en attente pour pouvoir capturer la modale.
  succession: (s, c) => { if (c.t < Number(min) * 60 - 200) base.succession(s, c); },
  buy: (s, c) => {
    st = s;
    if (eco !== '1') return base.buy(s, c);
    const target = !s.upgrades.alliances ? 'alliances' : !s.upgrades.chroniques ? 'chroniques' : null;
    if (target) buyLegacy(s, target);
    else for (const l of LEGACY) if (legacyCost(l, s.upgrades[l.id] ?? 0) <= s.legacy) buyLegacy(s, l.id);
    for (const b of BUILDINGS) while (canAfford(s, buildingCost(b.id, s.buildings[b.id] ?? 0)) && buyBuilding(s, b.id));
  },
};
PROFILES.gen = p;
runGame({ profile: 'gen', seed: 7, hours: Number(min) / 60 });
const s = st as unknown as GameState;
s.flags.started = true;
for (const k of ['start', 'pause', 'echo', 'echo2', 'build', 'legacy', 'voc', 'eco', 'destin']) s.flags['hint_' + k] = true;
writeFileSync(out, serialize(s));
console.log(`${out} : gén. ${s.hero.gen}, ⚜${Math.floor(s.legacy)} (total ${s.legacyTotal}), succession ${s.succession ? 'en attente' : 'non'}, améliorations ${JSON.stringify(s.upgrades)}`);
