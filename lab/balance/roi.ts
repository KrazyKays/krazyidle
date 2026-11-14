// Retour sur investissement des bâtiments et des améliorations d'Héritage, mesuré sur le vrai moteur :
// à l'heure h d'une partie (profil donné), on clone l'état, on offre +1 niveau (sans le payer) et on compare
// la valeur nette produite pendant W secondes contre le clone de référence (même graine → mêmes héritiers).
//   node --import ./lab/balance/register.mjs lab/balance/roi.ts [--profiles=experimente,mono-commercer] [--seeds=1-20] [--hours=1,3,5] [--window=600]
import { writeFileSync } from 'node:fs';
import { BUILDINGS, LEGACY, RES_INFO, legacyCost, type ResId } from '../../src/engine/data';
import { buildingCost, newRuntime, setActivity, tick } from '../../src/engine/game';
import { Rng } from '../../src/engine/rng';
import type { GameState } from '../../src/engine/state';
import { PROFILES, arg, f, parseSeeds, runBal, stats, wealth } from './lib';

const profiles = arg('profiles', 'experimente,mono-commercer')!.split(',');
const seeds = parseSeeds(arg('seeds', '1-20')!);
const hours = arg('hours', '1,3,5')!.split(',').map(Number);
const W = Number(arg('window', '600'));
const dt = 0.5;

function play(s0: GameState, prof: string, now0: number, mod?: (s: GameState) => void) {
  const s: GameState = structuredClone(s0);
  mod?.(s);
  const P = PROFILES[prof];
  const rt = newRuntime(); rt.online = false;
  const c = { t: 0, now: now0, rt, rng: new Rng(1), mem: {} };
  let net = 0, legacy0 = s.legacyTotal;
  for (let t = 0; t < W; t += dt) {
    if (s.life) { const a = P.activity(s, { ...c, t: 1e9 }); if (a !== s.life.act) setActivity(s, a); }
    c.now += dt * 1000;
    const w0 = wealth(s);
    tick(s, rt, dt, c.now);
    net += wealth(s) - w0;
    if (s.succession) P.succession(s, c as any);
  }
  return { rate: net / W, legacy: s.legacyTotal - legacy0 };
}
const costValue = (c: Partial<Record<ResId, number>>) => Object.entries(c).reduce((a, [r, x]) => a + x! * RES_INFO[r as ResId].value, 0);

const rows: any[] = [];
for (const prof of profiles) for (const seed of seeds) {
  const snaps: { h: number; s: GameState; now: number }[] = [];
  runBal({ profile: prof, seed, hours: Math.max(...hours), onHour: (s, h) => { if (hours.includes(h)) snaps.push({ h, s: structuredClone(s), now: Date.UTC(2026, 10, 16) + h * 3600_000 }); } });
  for (const sn of snaps) {
    const base = play(sn.s, prof, sn.now);
    const legacyRate = base.legacy / W; // ⚜️/s
    for (const b of BUILDINGS) {
      const lvl = sn.s.buildings[b.id] ?? 0;
      if (b.max !== undefined && lvl >= b.max) continue;
      const r = play(sn.s, prof, sn.now, (s) => { s.buildings[b.id] = lvl + 1; if (b.id === 'clepsydre' && s.life) s.life.dur += 4; });
      const cost = costValue(buildingCost(b.id, lvl));
      const gain = r.rate - base.rate;
      rows.push({ prof, seed, h: sn.h, kind: 'bâtiment', id: b.id, lvl, gainPct: (100 * gain) / base.rate, payback: gain > 0 ? cost / gain : Infinity });
    }
    for (const l of LEGACY) {
      const lvl = sn.s.upgrades[l.id] ?? 0;
      if (l.max !== undefined && lvl >= l.max) continue;
      const r = play(sn.s, prof, sn.now, (s) => { s.upgrades[l.id] = lvl + 1; if (l.id === 'longevite' && s.life) s.life.dur += 8; });
      const cost = legacyCost(l, lvl);
      const gain = r.rate - base.rate;
      rows.push({ prof, seed, h: sn.h, kind: 'Héritage', id: l.id, lvl, gainPct: (100 * gain) / base.rate, costL: cost, legacySec: legacyRate > 0 ? cost / legacyRate : Infinity, pctPerL: (100 * gain) / base.rate / cost });
    }
  }
}

const o: string[] = [`# ROI marginal mesuré — fenêtre ${W} s après l'heure h, dt ${dt}, sans événements, graines ${arg('seeds', '1-20')}\n`];
o.push('Gain = variation de la valeur nette produite par seconde pendant la fenêtre (Échos compris). Retour = coût (valeur) / gain (s). Pour l\'Héritage : coût en ⚜️, « délai » = ⚜️ / revenu d\'Héritage mesuré sur la fenêtre de référence.\n');
for (const prof of profiles) for (const h of hours) {
  o.push(`## ${prof} — heure ${h}\n`);
  o.push('| type | élément | niveau médian | gain de production (moy %) | retour médian (s) ou délai d\'Héritage (s) | gain % par ⚜️ |');
  o.push('|---|---|---|---|---|---|');
  const R = rows.filter((r) => r.prof === prof && r.h === h);
  const ids = [...new Set(R.map((r) => `${r.kind}|${r.id}`))];
  for (const k of ids) {
    const xs = R.filter((r) => `${r.kind}|${r.id}` === k);
    const [kind, id] = k.split('|');
    const lv = stats(xs.map((r) => r.lvl)).p50, g = stats(xs.map((r) => r.gainPct));
    const pb = kind === 'bâtiment' ? stats(xs.map((r) => r.payback)).p50 : stats(xs.map((r) => r.legacySec)).p50;
    o.push(`| ${kind} | ${id} | ${lv} | ${f(g.mean, 2)} ± ${f(g.sd, 2)} | ${Number.isFinite(pb) ? f(pb, 0) : '∞ (gain ≤ 0)'} | ${kind === 'Héritage' ? f(stats(xs.map((r) => r.pctPerL)).mean, 3) : ''} |`);
  }
  o.push('');
}
writeFileSync('lab/balance/results/roi.md', o.join('\n'));
writeFileSync('lab/balance/results/roi-runs.json', JSON.stringify(rows));
console.log(o.join('\n'));
