// Tension des choix (GD) : l'héritier et les Échos comptent-ils ? Quand Alliances/Chroniques deviennent-elles accessibles à un joueur qui épargne ?
// Usage : node --import ./lab/sim/register.mjs lab/design/choix.ts [seeds=40] [hours=6]
// Ne modifie ni le jeu ni lab/sim : ajoute des profils dérivés de « experimente ».
import { BUILDINGS, LEGACY, legacyCost } from '../../src/engine/data';
import { buildingCost, buyBuilding, buyLegacy, canAfford, confirmSuccession, echoSlots, echoValueRate } from '../../src/engine/game';
import { sumMods } from '../../src/engine/sim';
import { PROFILES, type Profile } from '../sim/profiles';
import { runGame } from '../sim/runner';
import type { GameState, Hero } from '../../src/engine/state';

const base = PROFILES.experimente;
const score = (h: Hero) => { const m = sumMods(h.traits); return m.all + m.xp * 0.5 + (h.vocation ? h.vocation.tier * 0.2 : 0); };
function succ(s: GameState, heir: 'best' | 'first' | 'worst', echo: 'value' | 'rate' | 'recent') {
  const sc = s.succession!;
  let idx = 0;
  if (heir !== 'first') sc.heirs.forEach((h, i) => { const better = heir === 'best' ? score(h) > score(sc.heirs[idx]) : score(h) < score(sc.heirs[idx]); if (better) idx = i; });
  const all = [...s.echoes, sc.newEcho];
  const key = echo === 'rate' ? (e: any) => echoValueRate(e) : echo === 'value' ? (e: any) => e.value : (e: any) => e.id;
  all.sort((a, b) => key(b) - key(a));
  confirmSuccession(s, idx, all.slice(0, echoSlots(s)).map((e) => e.id));
}
const mk = (id: string, over: Partial<Profile>): void => { PROFILES[id] = { ...base, id, desc: id, ...over }; };
mk('x-heirFirst', { succession: (s) => succ(s, 'first', 'value') });
mk('x-heirWorst', { succession: (s) => succ(s, 'worst', 'value') });
mk('x-echoRate', { succession: (s) => succ(s, 'best', 'rate') });
mk('x-echoRecent', { succession: (s) => succ(s, 'best', 'recent') });
function buyWith(s: GameState, cheapBelow: number) {
  const target = !s.upgrades.alliances ? 'alliances' : !s.upgrades.chroniques ? 'chroniques' : null;
  let bought = true;
  while (bought) {
    bought = false;
    if (target && buyLegacy(s, target)) bought = true;
    for (const l of LEGACY) { const c = legacyCost(l, s.upgrades[l.id] ?? 0); if ((!target || c < cheapBelow) && c <= s.legacy && buyLegacy(s, l.id)) bought = true; }
    for (const b of BUILDINGS) if (canAfford(s, buildingCost(b.id, s.buildings[b.id] ?? 0)) && buyBuilding(s, b.id)) bought = true;
  }
}
// Épargnant strict : n'achète rien d'autre en Héritage avant Alliances puis Chroniques.
mk('x-econome', { buy: (s) => buyWith(s, 0) });
// Épargnant modéré : continue d'acheter les améliorations à moins de 20 ⚜️.
mk('x-econome20', { buy: (s) => buyWith(s, 20) });

const seeds = Number(process.argv[2] ?? 40), hours = Number(process.argv[3] ?? 6);
const ids = ['experimente', 'x-heirFirst', 'x-heirWorst', 'x-echoRate', 'x-echoRecent', 'x-econome', 'x-econome20'];
const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
const sd = (a: number[]) => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) ** 2))); };
const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
let refV: number[] = [];
console.log(`seeds 1-${seeds}, ${hours} h, dt 0.5, sans événements`);
for (const id of ids) {
  const rs = [] as ReturnType<typeof runGame>[];
  for (let seed = 1; seed <= seeds; seed++) rs.push(runGame({ profile: id, seed, hours }));
  const v = rs.map((r) => r.log10Value), L = rs.map((r) => r.legacyTotal);
  if (id === 'experimente') refV = v;
  const d = (mean(v) - mean(refV)) / (Math.sqrt((sd(v) ** 2 + sd(refV) ** 2) / 2) || 1);
  const al = rs.map((r) => r.upgradeAt.alliances ?? -1).filter((x) => x >= 0), ch = rs.map((r) => r.upgradeAt.chroniques ?? -1).filter((x) => x >= 0);
  const ep = rs.map((r) => r.epithetsFound), el = rs.map((r) => r.epithetLives / Math.max(1, r.lives));
  console.log(`${id.padEnd(14)} log10V ${mean(v).toFixed(3)} (×${Math.pow(10, mean(v) - mean(refV)).toFixed(2)}, d=${d.toFixed(2)}) ⚜${mean(L).toFixed(0)} gen ${mean(rs.map((r) => r.gen)).toFixed(0)} | Alliances ${al.length}/${seeds} méd ${al.length ? (med(al) / 60).toFixed(0) : '-'} min | Chroniques ${ch.length}/${seeds} méd ${ch.length ? (med(ch) / 60).toFixed(0) : '-'} min | surnoms distincts moy ${mean(ep).toFixed(1)} (max ${Math.max(...ep)}) · vies surnommées ${(mean(el) * 100).toFixed(0)} %`);
}
