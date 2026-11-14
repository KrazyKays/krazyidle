// Profils supplémentaires du Game Balancer (ajoutés en mémoire à PROFILES, lab/sim/profiles.ts n'est pas modifié).
// Hypothèses : mêmes temps de réaction et même succession que les profils mono (decideEvery 1 s, achats toutes les 5 s,
// héritier = heirScoreBot (all + 0,5·xp + 0,2·rang de vocation), Échos gardés par pts/s).
import { ACTS, BUILDINGS, LEGACY, legacyCost, type ActId } from '../../src/engine/data';
import { buildingCost, buyBuilding, buyLegacy, canAfford, confirmSuccession, echoSlots, echoValueRate } from '../../src/engine/game';
import { sumMods } from '../../src/engine/sim';
import type { GameState, Hero } from '../../src/engine/state';
import { PROFILES, feasible, type Profile } from '../sim/profiles';

const has = (s: GameState, a: ActId) => s.unlocked.includes(a);
const heirScore = (h: Hero) => { const m = sumMods(h.traits); return m.all + m.xp * 0.5 + (h.vocation ? h.vocation.tier * 0.2 : 0); };
function succ(s: GameState) {
  const sc = s.succession!;
  let best = 0;
  sc.heirs.forEach((h, i) => { if (heirScore(h) > heirScore(sc.heirs[best])) best = i; });
  const all = [...s.echoes, sc.newEcho].sort((a, b) => echoValueRate(b) - echoValueRate(a));
  confirmSuccession(s, best, all.slice(0, echoSlots(s)).map((e) => e.id));
}
function greedy(s: GameState, only?: string[]) {
  let bought = true;
  while (bought) {
    bought = false;
    for (const l of LEGACY) if (legacyCost(l, s.upgrades[l.id] ?? 0) <= s.legacy && buyLegacy(s, l.id)) bought = true;
    for (const b of BUILDINGS) {
      if (only && !only.includes(b.id)) continue;
      if (canAfford(s, buildingCost(b.id, s.buildings[b.id] ?? 0)) && buyBuilding(s, b.id)) bought = true;
    }
  }
}
// Même amorçage que les profils mono : 30 min de bot « expérimenté » (déblocages), puis la stratégie.
const boot = PROFILES['mono-cultiver'].activity;

function mk(id: string, desc: string, act: (s: GameState) => ActId, only?: string[]): Profile {
  return {
    id, desc, decideEvery: 1, buyEvery: 5, successionDelay: 0,
    activity: (s, c) => (c.t < 1800 ? boot(s, c) : act(s)),
    succession: succ,
    buy: (s) => greedy(s, only),
  };
}

const NON_ACT = ['garde', 'clepsydre'];
// Concentration des achats : seul le bâtiment de l'activité (+ Garde, Clepsydre).
for (const [a, b] of [['commercer', 'comptoir'], ['cultiver', 'champs']] as [ActId, string][]) {
  PROFILES['focus-' + a] = mk('focus-' + a, `mono-${a}, mais n'achète que ${b} + Garde + Clepsydre (Héritage gourmand)`, (s) => (has(s, a) ? feasible(s, a) : 'cultiver'), [b, ...NON_ACT]);
}
// Vie partagée : la première moitié (+2 s, vocation) sur A, le reste sur B.
function split(a: ActId, b: ActId) {
  return (s: GameState): ActId => {
    const l = s.life!;
    const first = l.t < l.dur * 0.5 + 2 ? a : b;
    return has(s, first) ? feasible(s, first) : 'cultiver';
  };
}
PROFILES['split-com-etu'] = mk('split-com-etu', 'Commercer la 1re moitié de vie (vocation Marchand), Étudier ensuite', split('commercer', 'etudier'));
PROFILES['split-etu-com'] = mk('split-etu-com', 'Étudier la 1re moitié de vie (vocation Érudit), Commercer ensuite', split('etudier', 'commercer'));
PROFILES['split-com-med'] = mk('split-com-med', 'Commercer la 1re moitié de vie, Méditer ensuite', split('commercer', 'mediter'));
// Étudier avec réserve d'Or : commerce dès que l'Or < 200 (alimentation de la chaîne).
PROFILES['etudier-stock'] = mk('etudier-stock', 'Étudier tant que Or ≥ 200, sinon Commercer (Vivres ≥ 5) ou Cultiver', (s) => {
  if (!has(s, 'etudier')) return 'cultiver';
  if (s.res.or >= 200) return 'etudier';
  return s.res.vivres >= 5 && has(s, 'commercer') ? 'commercer' : 'cultiver';
});
export const EXTRA = Object.keys(PROFILES).filter((k) => /^(focus|split|etudier-stock)/.test(k));
export { ACTS };
