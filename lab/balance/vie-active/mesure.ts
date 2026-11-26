// Refacto « vie active » : indicateurs de décision (lab/design/REFACTO-vie-active.md § 6).
//   [BAL_PATCH=…] [BAL_OBJ=…] node --import ./lab/balance/register.mjs lab/balance/vie-active/mesure.ts \
//     --tag=V0 [--profiles=experimente,optimiseur] [--seeds=1-40] [--ratio-seeds=1-20] [--hours=6] [--dt=0.5]
// Sorties : lab/balance/vie-active/results/<tag>.json (+ résumé à l'écran).
//  - heroShare : part de la production brute (valeur) venant du héros vivant = 1 − echoShare (runGame) ;
//  - ratio : débit net d'une heure jouée / débit net d'une heure hors ligne (simulateOffline), même état de départ
//    (clone à l'heure h), sans événements ; les achats ne comptent pas (seuls les ticks sont mesurés).
import { mkdirSync, writeFileSync } from 'node:fs';
import { newRuntime, setActivity, simulateOffline, tick } from '../../../src/engine/game';
import { Rng } from '../../../src/engine/rng';
import type { GameState } from '../../../src/engine/state';
import { runGame } from '../../sim/runner';
import { PROFILES, arg, parseSeeds, runBal, stats, wealth } from '../lib';

const tag = arg('tag', 'V0')!;
const profiles = arg('profiles', 'experimente,optimiseur,debutant,occasionnel,mono-cultiver,mono-commercer,mono-etudier,mono-mediter')!.split(',');
const seeds = parseSeeds(arg('seeds', '1-40')!);
const ratioSeeds = parseSeeds(arg('ratio-seeds', '1-20')!);
const ratioProfiles = arg('ratio-profiles', 'experimente,optimiseur')!.split(',').filter(Boolean);
const hours = Number(arg('hours', '6'));
const dt = Number(arg('dt', '0.5'));
const ratioHours = [1, 3, 5];

const out: Record<string, any> = { tag, patch: process.env.BAL_PATCH ?? '', obj: process.env.BAL_OBJ ?? '', seeds: arg('seeds', '1-40'), hours, dt, profiles: {} };
const m = (xs: number[], d = 3) => Number(stats(xs).mean.toFixed(d));

for (const p of profiles) {
  const runs = seeds.map((seed) => runGame({ profile: p, seed, hours, dt }));
  const at = (k: string) => runs.map((r) => (r.upgradeAt[k] ?? -1) / 3600).filter((x) => x >= 0);
  const acts = ['cultiver', 'commercer', 'etudier', 'mediter'];
  out.profiles[p] = {
    heroShare: m(runs.map((r) => 1 - r.echoShare)),
    legacy: m(runs.map((r) => r.legacyTotal), 0),
    log10Value: m(runs.map((r) => r.log10Value), 2),
    gen: m(runs.map((r) => r.gen), 0),
    alliancesH: at('alliances').length ? m(at('alliances'), 2) : null, alliancesN: at('alliances').length / runs.length,
    chroniquesH: at('chroniques').length ? m(at('chroniques'), 2) : null, chroniquesN: at('chroniques').length / runs.length,
    heroAct: Object.fromEntries(acts.map((a) => [a, m(runs.map((r) => r.heroActShare[a]), 2)])),
    crypte: m(runs.map((r) => r.upgrades.crypte ?? 0), 1), memoire: m(runs.map((r) => r.upgrades.memoire ?? 0), 1),
    prosperite: m(runs.map((r) => r.upgrades.prosperite ?? 0), 1),
    anomalies: runs.reduce((a, r) => a + r.anomalies.length, 0),
  };
}

for (const p of ratioProfiles) {
  const rows: { h: number; ratio: number }[] = [];
  for (const seed of ratioSeeds) {
    const snaps: { h: number; s: GameState }[] = [];
    runBal({ profile: p, seed, hours: Math.max(...ratioHours), dt, onHour: (s, h) => { if (ratioHours.includes(h)) snaps.push({ h, s: structuredClone(s) }); } });
    for (const sn of snaps) {
      const now0 = Date.UTC(2026, 10, 16) + sn.h * 3600_000;
      const a: GameState = structuredClone(sn.s);
      const rt = newRuntime(); rt.online = false;
      const P = PROFILES[p];
      const c = { t: 1e9, now: now0, rt, rng: new Rng(seed), mem: {} };
      let netOn = 0;
      for (let t = 0; t < 3600; t += dt) {
        if (a.life) { const x = P.activity(a, c as any); if (x !== a.life.act) setActivity(a, x); }
        c.now += dt * 1000;
        const w0 = wealth(a); tick(a, rt, dt, c.now); netOn += wealth(a) - w0;
        if (a.succession) P.succession(a, c as any);
        if (Math.round(t / dt) % Math.round(5 / dt) === 0) P.buy(a, c as any);
      }
      const b: GameState = structuredClone(sn.s);
      const w0 = wealth(b);
      simulateOffline(b, newRuntime(), 3600, now0 + 3600_000);
      const netOff = wealth(b) - w0;
      rows.push({ h: sn.h, ratio: netOn / Math.max(1e-9, netOff) });
    }
  }
  out.profiles[p].ratio = Object.fromEntries(ratioHours.map((h) => [h, Number(stats(rows.filter((r) => r.h === h).map((r) => r.ratio)).p50.toFixed(2))]));
}

mkdirSync('lab/balance/vie-active/results', { recursive: true });
writeFileSync(`lab/balance/vie-active/results/${tag}.json`, JSON.stringify(out, null, 1));
const lines = [`## ${tag}  ${out.patch ? 'BAL_PATCH ' + out.patch.slice(0, 160) : ''} ${out.obj}`];
lines.push('| profil | héros | ratio h1/h3/h5 (méd.) | ⚜️ 6 h | log10 val. | gén. | Alliances (h, part) | Chroniques (h, part) | 🌾/⚖️/📖/🕯️ héros | crypte/mém./prosp. |');
lines.push('|---|---|---|---|---|---|---|---|---|---|');
for (const p of profiles) {
  const x = out.profiles[p];
  const r = x.ratio ? `${x.ratio[1]} / ${x.ratio[3]} / ${x.ratio[5]}` : '—';
  lines.push(`| ${p} | ${x.heroShare} | ${r} | ${x.legacy} | ${x.log10Value} | ${x.gen} | ${x.alliancesH ?? '—'} (${x.alliancesN.toFixed(2)}) | ${x.chroniquesH ?? '—'} (${x.chroniquesN.toFixed(2)}) | ${Object.values(x.heroAct).join('/')} | ${x.crypte}/${x.memoire}/${x.prosperite} |`);
}
console.log(lines.join('\n'));
writeFileSync(`lab/balance/vie-active/results/${tag}.md`, lines.join('\n') + '\n');
