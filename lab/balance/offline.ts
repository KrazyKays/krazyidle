// Rendement hors ligne vs en ligne : à l'heure h d'une partie, on clone l'état puis on compare
// 1 h jouée (profil) à 1 h de simulateOffline (moteur réel : pas d'1 s, Échos seuls après la mort du héros).
//   node --import ./lab/balance/register.mjs lab/balance/offline.ts [--profile=experimente] [--seeds=1-20] [--hours=1,3,5]
import { writeFileSync } from 'node:fs';
import { newRuntime, setActivity, simulateOffline, tick } from '../../src/engine/game';
import { Rng } from '../../src/engine/rng';
import type { GameState } from '../../src/engine/state';
import { PROFILES, arg, f, parseSeeds, runBal, stats, wealth } from './lib';

const prof = arg('profile', 'experimente')!;
const seeds = parseSeeds(arg('seeds', '1-20')!);
const hours = arg('hours', '1,3,5')!.split(',').map(Number);
const D = 3600;
const rows: { h: number; ratio: number; legOn: number; legOff: number }[] = [];
for (const seed of seeds) {
  const snaps: { h: number; s: GameState }[] = [];
  runBal({ profile: prof, seed, hours: Math.max(...hours), onHour: (s, h) => { if (hours.includes(h)) snaps.push({ h, s: structuredClone(s) }); } });
  for (const sn of snaps) {
    const now0 = Date.UTC(2026, 10, 16) + sn.h * 3600_000;
    // en ligne
    const a: GameState = structuredClone(sn.s);
    const rt = newRuntime(); rt.online = false;
    const P = PROFILES[prof];
    const c = { t: 1e9, now: now0, rt, rng: new Rng(seed), mem: {} };
    let netOn = 0;
    const l0 = a.legacyTotal;
    for (let t = 0; t < D; t += 0.5) {
      if (a.life) { const x = P.activity(a, c as any); if (x !== a.life.act) setActivity(a, x); }
      c.now += 500;
      const w0 = wealth(a); tick(a, rt, 0.5, c.now); netOn += wealth(a) - w0;
      if (a.succession) P.succession(a, c as any);
      if (t % 5 === 0) P.buy(a, c as any);
    }
    // hors ligne
    const b: GameState = structuredClone(sn.s);
    const rt2 = newRuntime();
    const w0 = wealth(b);
    simulateOffline(b, rt2, D, now0 + D * 1000);
    const netOff = wealth(b) - w0;
    rows.push({ h: sn.h, ratio: netOff / netOn, legOn: a.legacyTotal - l0, legOff: b.legacyTotal - sn.s.legacyTotal });
  }
}
const o = [`# Hors ligne vs en ligne — profil ${prof}, ${seeds.length} graines, 1 h à partir de l'heure h\n`, '| heure | valeur nette hors ligne / en ligne (moy ± é.-t., p10–p90) | ⚜️ gagnés en ligne | ⚜️ gagnés hors ligne |', '|---|---|---|---|'];
for (const h of hours) {
  const R = rows.filter((r) => r.h === h);
  const s = stats(R.map((r) => r.ratio));
  o.push(`| ${h} | ${f(s.mean, 3)} ± ${f(s.sd, 3)} (${f(s.p10, 3)}–${f(s.p90, 3)}) | ${f(stats(R.map((r) => r.legOn)).mean, 0)} | ${f(stats(R.map((r) => r.legOff)).mean, 0)} |`);
}
writeFileSync(`lab/balance/results/offline-${prof}.md`, o.join('\n') + '\n');
console.log(o.join('\n'));
