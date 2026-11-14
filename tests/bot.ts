// Bot de test d'équilibrage : joue de façon raisonnable et gourmande.
import { ACTS, BUILDINGS, LEGACY, RES, legacyCost, type ActId } from '../src/engine/data';
import {
  buildingCost, buyBuilding, buyLegacy, canAfford, confirmSuccession, echoSlots, newRuntime, setActivity, startLife, tick,
} from '../src/engine/game';
import { newGame, type GameState } from '../src/engine/state';
import { sumMods } from '../src/engine/sim';

export function runBot(hours: number, seed = 42, log = false, setup?: (s: GameState) => void) {
  const s: GameState = newGame(0, seed);
  setup?.(s);
  const rt = newRuntime();
  rt.online = false; // pas d'événements pour la mesure de base
  startLife(s);
  const snaps: any[] = [];
  let now = 0;
  const total = hours * 3600;
  for (let t = 0; t < total; t += 0.5) {
    now += 500;
    if (s.life) {
      const life = s.life;
      const main = pickMain(s);
      const frac = life.t / life.dur;
      let a: ActId = main;
      if (main === 'commercer' && s.res.vivres < 5) a = 'cultiver';
      if (main === 'etudier' && s.res.or < 5) a = s.res.vivres > 10 && s.unlocked.includes('commercer') ? 'commercer' : 'cultiver';
      if (frac > 0.7) a = s.unlocked.includes('commercer') && s.res.vivres > 20 ? 'commercer' : 'cultiver';
      setActivity(s, a);
    }
    tick(s, rt, 0.5, now);
    if (s.succession) {
      const sc = s.succession;
      const best = sc.heirs.map((h, i) => [sumMods(h.traits).all + sumMods(h.traits).xp * 0.5 + (h.vocation ? h.vocation.tier * 0.2 : 0), i]).sort((a, b) => b[0] - a[0])[0][1];
      const all = [...s.echoes, sc.newEcho].sort((a, b) => b.value - a.value).slice(0, echoSlots(s));
      confirmSuccession(s, best, all.map((e) => e.id));
    }
    if (Math.floor(t) % 5 === 0) {
      // achats
      let bought = true;
      while (bought) {
        bought = false;
        for (const l of LEGACY) if (legacyCost(l, s.upgrades[l.id] ?? 0) <= s.legacy && buyLegacy(s, l.id)) bought = true;
        const cands = BUILDINGS.filter((b) => canAfford(s, buildingCost(b.id, s.buildings[b.id] ?? 0)));
        for (const b of cands) if (buyBuilding(s, b.id)) bought = true;
      }
    }
    if (t % 1800 === 0) {
      const snap = { h: (t / 3600).toFixed(1), gen: s.hero.gen, res: RES.map((r) => s.res[r].toExponential(2)).join(' '), echoes: s.echoes.length, legacy: s.legacyTotal, b: JSON.stringify(s.buildings), u: JSON.stringify(s.upgrades), unl: s.unlocked.length, eco: `${s.eco.F.toFixed(0)}/${s.eco.G.toFixed(0)}/${s.eco.P.toFixed(0)}`, echoRate: rt.echoRate.toFixed(1) };
      snaps.push(snap);
      if (log) console.log(JSON.stringify(snap));
    }
  }
  return { s, snaps };
}

function pickMain(s: GameState): ActId {
  const u = s.unlocked;
  const g = s.hero.gen;
  if (s.hero.vocation && g % 3 !== 0) return s.hero.vocation.act;
  const order: ActId[] = ['cultiver', 'commercer', 'etudier', 'mediter', 'chasser'];
  const avail = order.filter((a) => u.includes(a));
  return avail[g % avail.length] ?? ACTS[0];
}
