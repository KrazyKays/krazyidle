// Compagnonnage — C5 : à quelle heure chaque profil achète-t-il le Compagnonnage, selon son prix ? (vrai moteur, COMP-1)
//   BAL_OBJ=LEGACY.compagnonnage.base=200 node --import ./lab/balance/register.mjs lab/balance/compagnonnage/prix.ts [--seeds=1-40]
import { mkdirSync, writeFileSync } from 'node:fs';
import { LEGACY_DEF } from '../../../src/engine/data';
import { runGame } from '../../sim/runner';
import { arg, parseSeeds, stats } from '../lib';

const seeds = parseSeeds(arg('seeds', '1-40')!);
const profiles = arg('profiles', 'experimente,optimiseur,debutant,occasionnel,mono-cultiver,mono-etudier')!.split(',');
const price = LEGACY_DEF.compagnonnage.base;
const md = [`## prix ${price} ⚜️`, '', '| profil | achat Compagnonnage (h, p50) | part des parties | Chroniques (h, p50) | après Chroniques |', '|---|---|---|---|---|'];
const out: Record<string, any> = { price, profiles: {} };
for (const p of profiles) {
  const runs = seeds.map((seed) => runGame({ profile: p, seed, hours: 6, dt: 0.5 }));
  const at = (k: string) => runs.map((r) => (r.upgradeAt[k] ?? Infinity) / 3600);
  const comp = at('compagnonnage'), chro = at('chroniques');
  const p50 = (xs: number[]) => stats(xs.map((x) => (Number.isFinite(x) ? x : 99))).p50;
  const row = { comp: p50(comp), share: comp.filter(Number.isFinite).length / runs.length, chro: p50(chro), after: p50(comp) >= p50(chro) };
  out.profiles[p] = row;
  const f = (x: number) => (x >= 99 ? 'jamais' : x.toFixed(2));
  md.push(`| ${p} | ${f(row.comp)} | ${(row.share * 100).toFixed(0)} % | ${f(row.chro)} | ${row.after ? '✓' : '✗'} |`);
}
mkdirSync('lab/balance/compagnonnage/results', { recursive: true });
writeFileSync(`lab/balance/compagnonnage/results/C5-prix-${price}.json`, JSON.stringify(out, null, 1));
writeFileSync(`lab/balance/compagnonnage/results/C5-prix-${price}.md`, md.join('\n') + '\n');
console.log(md.join('\n'));
