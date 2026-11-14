// La présélection des Échos (pts/s = valeur ÷ durée) ignore la force propre de l'Écho (traits « Écho vibrant »,
// « Mémoire ancestrale », « Éternel », « Maudit ») et son surnom. Que coûte cette omission ?
// Compare : tri par pts/s (comme l'interface) vs tri par pts/s × (1 + force) × (1 + puissance du surnom).
// Usage : node --import ./lab/sim/register.mjs lab/design/echo-select.ts [seeds=30] [hours=6]
import { BUILDINGS, LEGACY, legacyCost } from '../../src/engine/data';
import { buildingCost, buyBuilding, buyLegacy, canAfford, confirmSuccession, echoSlots, echoValueRate } from '../../src/engine/game';
import { EPITHET } from '../../src/engine/epithets';
import { sumMods } from '../../src/engine/sim';
import type { Echo, GameState, Hero } from '../../src/engine/state';
import { PROFILES } from '../sim/profiles';
import { runGame } from '../sim/runner';

const score = (h: Hero) => { const m = sumMods(h.traits); return m.all + m.xp * 0.5 + (h.vocation ? h.vocation.tier * 0.2 : 0); };
const trueRate = (e: Echo) => echoValueRate(e) * Math.max(0.2, 1 + e.strength) * (1 + (EPITHET[e.epithet ?? '']?.mods.pow ?? 0));
let disagree = 0, total = 0;
function succ(s: GameState, key: (e: Echo) => number) {
  const sc = s.succession!;
  let idx = 0;
  sc.heirs.forEach((h, i) => { if (score(h) > score(sc.heirs[idx])) idx = i; });
  const all = [...s.echoes, sc.newEcho];
  const a = [...all].sort((x, y) => echoValueRate(y) - echoValueRate(x)).slice(0, echoSlots(s)).map((e) => e.id).sort().join();
  const b = [...all].sort((x, y) => trueRate(y) - trueRate(x)).slice(0, echoSlots(s)).map((e) => e.id).sort().join();
  total++; if (a !== b) disagree++;
  all.sort((x, y) => key(y) - key(x));
  confirmSuccession(s, idx, all.slice(0, echoSlots(s)).map((e) => e.id));
}
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
PROFILES['es-ui'] = { ...base, id: 'es-ui', succession: (s) => succ(s, echoValueRate), buy: buySaver };
PROFILES['es-vrai'] = { ...base, id: 'es-vrai', succession: (s) => succ(s, trueRate), buy: buySaver };
const seeds = Number(process.argv[2] ?? 30), hours = Number(process.argv[3] ?? 6);
const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
const sd = (a: number[]) => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) ** 2))); };
const res: Record<string, number[]> = {};
for (const id of ['es-ui', 'es-vrai']) {
  disagree = 0; total = 0;
  res[id] = [];
  for (let seed = 1; seed <= seeds; seed++) res[id].push(runGame({ profile: id, seed, hours }).log10Value);
  console.log(`${id} : log10V ${mean(res[id]).toFixed(3)} ± ${sd(res[id]).toFixed(3)} · successions où les deux tris divergent : ${(disagree / total * 100).toFixed(1)} %`);
}
const d = (mean(res['es-vrai']) - mean(res['es-ui'])) / Math.sqrt((sd(res['es-vrai']) ** 2 + sd(res['es-ui']) ** 2) / 2);
console.log(`Écart : ×${Math.pow(10, mean(res['es-vrai']) - mean(res['es-ui'])).toFixed(3)} (d = ${d.toFixed(2)})`);
