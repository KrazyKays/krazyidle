// Instrumentation GD : nouveautés (plateaux), surnoms découverts, Affût, événements, tension du choix d'héritier.
// Les profils de lab/sim sont enveloppés (sans les modifier) pour observer l'état à chaque décision.
// Usage : node --import ./lab/sim/register.mjs lab/design/instrument.ts <profil> <seeds> <heures> [events] [econome]
import { BUILDINGS, LEGACY, legacyCost } from '../../src/engine/data';
import { buildingCost, buyBuilding, buyLegacy, canAfford } from '../../src/engine/game';
import { EPITHETS } from '../../src/engine/epithets';
import { sumMods } from '../../src/engine/sim';
import { PROFILES, feasible, type Profile } from '../sim/profiles';
import { runGame } from '../sim/runner';
import type { GameState, Hero } from '../../src/engine/state';

const [pid = 'experimente', nSeeds = '20', hrs = '6', ev = '0', eco = '0'] = process.argv.slice(2);
const base = PROFILES[pid];
const econome = eco === '1';
const events = ev === '1';

const score = (h: Hero) => { const m = sumMods(h.traits); return m.all + m.xp * 0.5 + (h.vocation ? h.vocation.tier * 0.2 : 0); };
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

const seeds = Number(nSeeds), hours = Number(hrs);
const epAll: Record<string, number> = {};
const epRuns: Record<string, number> = {};
let gapsMax: number[] = [];
const allGaps: number[] = [];
let affutOn = 0, affutN = 0, affutToggles = 0;
const evStats: Record<string, { n: number; tiers: number[] }> = {};
let succN = 0, obvious = 0, top2gap: number[] = [];
for (let seed = 1; seed <= seeds; seed++) {
  let t = 0;
  const firsts: number[] = [0];
  const seen = new Set<string>();
  let lastOn: boolean | null = null;
  let lastState: GameState | null = null;
  const note = (k: string, tt: number) => { if (!seen.has(k)) { seen.add(k); firsts.push(tt); } };
  const p: Profile = {
    ...base,
    id: 'instr',
    activity: (s, c) => {
      t = c.t; lastState = s;
      affutN++; if (s.hunt.on) affutOn++;
      if (lastOn !== null && lastOn !== s.hunt.on) affutToggles++;
      lastOn = s.hunt.on;
      for (const a of s.unlocked) note('act:' + a, c.t);
      // ADAPT=1 : pendant un événement, le héros pratique l'activité favorisée (Concile : Commercer, objectif Or).
      const evd = process.env.ADAPT === '1' ? c.rt.event?.def : undefined;
      if (evd) {
        const want = (Object.keys(evd.act ?? {})[0] ?? 'commercer') as any;
        if (s.unlocked.includes(want)) return feasible(s, want);
      }
      return base.activity(s, c);
    },
    succession: (s, c) => {
      const hs = s.succession!.heirs.map(score).sort((a, b) => b - a);
      succN++;
      top2gap.push(hs[0] - (hs[1] ?? hs[0]));
      if (hs[0] - (hs[1] ?? hs[0]) >= 0.3) obvious++;
      base.succession(s, c);
      for (const e of Object.keys(s.epithets)) note('ep:' + e, c.t);
      if (s.hero.spouse) note('mariage', c.t);
    },
    buy: (s, c) => {
      if (econome) buySaver(s); else base.buy(s, c);
      for (const k of Object.keys(s.upgrades)) note('up:' + k, c.t);
      for (const k of Object.keys(s.buildings)) note('b:' + k, c.t);
      lastState = s;
    },
  };
  PROFILES.instr = p;
  const r = runGame({ profile: 'instr', seed, hours, events });
  const st = lastState as GameState | null;
  if (st) {
    for (const [k, n] of Object.entries(st.epithets)) { epAll[k] = (epAll[k] ?? 0) + n; epRuns[k] = (epRuns[k] ?? 0) + 1; }
    for (const [key, ep] of Object.entries(st.events)) {
      // key = AAAA-MM-JJTHH ; on retrouve le type via le hash du moteur
      const { activeEvent } = await import('../../src/engine/events');
      const [d, hh] = key.split('T');
      const w = activeEvent(Date.parse(d + 'T' + hh + ':00:00Z') + 60_000);
      const id = w?.def.id ?? '?';
      (evStats[id] ??= { n: 0, tiers: [0, 0, 0, 0] }).n++;
      evStats[id].tiers[ep.tier]++;
    }
  }
  firsts.push(r.hours * 3600);
  firsts.sort((a, b) => a - b);
  let gmax = 0;
  for (let i = 1; i < firsts.length; i++) { const g = firsts[i] - firsts[i - 1]; allGaps.push(g); gmax = Math.max(gmax, g); }
  gapsMax.push(gmax);
}
const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
console.log(`profil ${pid}${econome ? ' (achats épargnants)' : ''} · graines 1-${seeds} · ${hours} h · événements ${events ? 'oui' : 'non'} · dt 0.5`);
console.log(`Plus long plateau sans nouveauté (1re activité, 1er niveau d'amélioration, 1er bâtiment, 1er surnom, 1er mariage) : médiane ${(med(gapsMax) / 60).toFixed(0)} min, max ${(Math.max(...gapsMax) / 60).toFixed(0)} min`);
console.log(`Successions : ${succN} · héritier « évident » (écart de score ≥ 0,3 avec le 2e) : ${(obvious / Math.max(1, succN) * 100).toFixed(0)} % · écart médian ${med(top2gap).toFixed(2)}`);
console.log(`Affût actif ${(affutOn / Math.max(1, affutN) * 100).toFixed(1)} % des décisions · bascules ${(affutToggles / seeds).toFixed(1)} par partie`);
const found = Object.keys(epRuns).length;
console.log(`Surnoms découverts (au moins une partie) : ${found}/${EPITHETS.length}`);
console.log('  ' + EPITHETS.map((e) => `${e.id}:${epRuns[e.id] ? `${epRuns[e.id]}p/${epAll[e.id]}v` : '—'}`).join(' '));
for (const [id, x] of Object.entries(evStats)) console.log(`Événement ${id} : ${x.n} fenêtres · paliers atteints 0/1/2/3 = ${x.tiers.join('/')}`);
