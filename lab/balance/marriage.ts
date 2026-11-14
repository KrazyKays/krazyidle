// B2 — Effet d'un mariage systématique sur la valeur à 6 h et 12 h (mono-commercer).
// Variantes : base (jamais), marie (achat normal d'Alliances par l'Héritage gourmand, puis mariage à chaque vie dès que la dot
// est payable, maison la moins épousée parmi les 3 de la semaine → consanguinité minimale), gratuit (Alliances offertes à la
// 1re succession, sans mariage : isole l'effet des 90 ⚜️), marie-gratuit (Alliances offertes + mariage).
//   node --import ./lab/balance/register.mjs lab/balance/marriage.ts --seeds=1-40 --hours=12 [--shard=0/2] > out.jsonl
//   node --import ./lab/balance/register.mjs lab/balance/marriage.ts --summarize file.jsonl
import { readFileSync, writeFileSync } from 'node:fs';
import { canMarry, countyHouses, dowry, marry, suitorFor } from '../../src/engine/alliances';
import type { GameState } from '../../src/engine/state';
import { PROFILES, arg, f, parseSeeds, runBal, stats } from './lib';
import type { Profile } from '../sim/profiles';

const BASE = PROFILES['mono-commercer'];
let clock = 0;
function marryBest(s: GameState) {
  if (!canMarry(s) || s.res.or < dowry(s, 'pnj')) return;
  const hs = countyHouses(clock);
  const ch = [...hs].sort((a, b) => (s.alliances[a.house.id]?.count ?? 0) - (s.alliances[b.house.id]?.count ?? 0))[0];
  marry(s, suitorFor(s, ch, clock));
}
const withMarriage: Profile = { ...BASE, id: 'mono-commercer+mariage', buy: (s, c) => { BASE.buy(s, c); clock = c.now; marryBest(s); } };
const VAR: Record<string, { profile: Profile; free: boolean }> = {
  base: { profile: BASE, free: false },
  marie: { profile: withMarriage, free: false },
  gratuit: { profile: BASE, free: true },
  'marie-gratuit': { profile: withMarriage, free: true },
};

if (arg('summarize')) {
  const rows = readFileSync(process.argv[process.argv.length - 1], 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const base = new Map(rows.filter((r) => r.v === 'base').map((r) => [r.seed, r]));
  const o = [`# B2 — Mariage systématique, mono-commercer, ${base.size} graines appariées, dt 0,5, sans événements\n`,
    '| variante | Δ log10 nette à 6 h | Δ log10 nette à 12 h | Δ Héritage 12 h | mariages (moy) | accès aux Alliances (heure, p50, résolution 1 h) |', '|---|---|---|---|---|---|'];
  for (const v of Object.keys(VAR)) {
    const R = rows.filter((r) => r.v === v);
    const d = (h: number) => stats(R.map((r) => r.net[h] - base.get(r.seed)!.net[h]));
    const L = stats(R.map((r) => (100 * (r.legacy - base.get(r.seed)!.legacy)) / base.get(r.seed)!.legacy));
    o.push(`| ${v} | ${f(d(6).mean, 3)} ± ${f(d(6).sd, 3)} | ${f(d(12).mean, 3)} ± ${f(d(12).sd, 3)} | ${f(L.mean, 1)} % | ${f(stats(R.map((r) => r.married)).mean, 0)} | ${f(stats(R.map((r) => r.alliAt / 3600)).p50, 0)} |`);
  }
  writeFileSync('lab/balance/results/marriage.md', o.join('\n') + '\n');
  console.log(o.join('\n'));
} else {
  const seeds = parseSeeds(arg('seeds', '1-40')!);
  const hours = Number(arg('hours', '12'));
  const [K, N] = arg('shard', '0/1')!.split('/').map(Number);
  let i = 0;
  for (const v of Object.keys(VAR)) for (const seed of seeds) {
    if (i++ % N !== K) continue;
    const { profile, free } = VAR[v];
    let married = 0, alliAt = -1, t = 0;
    const net: Record<number, number> = {};
    const r = runBal({
      profile, seed, hours,
      afterSuccession: (s) => {
        if (free && !s.upgrades.alliances) s.upgrades.alliances = 1;
        if (s.ancestors[s.ancestors.length - 1]?.spouse) married++;
        if (alliAt < 0 && s.upgrades.alliances) alliAt = t;
      },
      onHour: (_s, h) => { t = h * 3600; },
    });
    for (const h of r.hourly) net[h.h] = h.net;
    process.stdout.write(JSON.stringify({ v, seed, net, legacy: r.legacyTotal, married, alliAt: alliAt < 0 ? NaN : alliAt }) + '\n');
  }
}
