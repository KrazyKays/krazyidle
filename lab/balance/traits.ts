// Valeur des traits : contrefactuel « la lignée porte TOUJOURS le trait X » (ajouté hors budget à chaque héritier
// juste après la succession, puis la vie est relancée pour recalculer durée et niveaux de départ).
//   node --import ./lab/balance/register.mjs lab/balance/traits.ts [--seeds=1-30] [--hours=4] [--shard=0/2]
//   node --import ./lab/balance/register.mjs lab/balance/traits.ts --summarize
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { TRAIT } from '../../src/engine/data';
import { startLife } from '../../src/engine/game';
import { arg, f, parseSeeds, runBal, stats } from './lib';
import './profiles-extra';

const OUT = arg('out', 'lab/balance/results/traits-runs.jsonl')!;
const ONLY = arg('only')?.split(',');
const CASES: [string, string[]][] = [
  ['mono-commercer', ['', 'langue_argent', 'polyvalent', 'robuste', 'curieux', 'echo_vibrant', 'prodige', 'harmonieux', 'fertile', 'longevite', 'genie', 'memoire', 'centenaire', 'sang_dore', 'elu', 'eternel', 'main_verte']],
  ['mono-cultiver', ['', 'main_verte', 'polyvalent', 'robuste', 'curieux', 'echo_vibrant', 'harmonieux', 'elu']],
];

if (arg('summarize')) {
  const rows = readFileSync(OUT, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const o: string[] = [`# Valeur d'un trait porté en permanence — ${rows[0].hours} h, dt 0,5, sans événements, graines appariées\n`];
  for (const [p] of CASES) {
    const base = new Map(rows.filter((r) => r.profile === p && r.trait === '').map((r) => [r.seed, r]));
    o.push(`## ${p} (n = ${base.size})\n`);
    o.push('| trait | effet | Δ log10 valeur nette (moy ± é.-t.) | ratio de valeur | Δ Héritage % | Δ générations % |');
    o.push('|---|---|---|---|---|---|');
    const T = [...new Set(rows.filter((r) => r.profile === p && r.trait).map((r) => r.trait))];
    const lines = T.map((t) => {
      const xs = rows.filter((r) => r.profile === p && r.trait === t);
      const d = stats(xs.map((r) => r.netLog10 - base.get(r.seed)!.netLog10));
      const L = stats(xs.map((r) => (100 * (r.legacyTotal - base.get(r.seed)!.legacyTotal)) / base.get(r.seed)!.legacyTotal));
      const G = stats(xs.map((r) => (100 * (r.gen - base.get(r.seed)!.gen)) / base.get(r.seed)!.gen));
      return { d: d.mean, line: `| ${t} | ${TRAIT[t].desc} | ${d.mean >= 0 ? '+' : ''}${f(d.mean, 3)} ± ${f(d.sd, 3)} | ×${f(10 ** d.mean, 2)} | ${f(L.mean, 1)} | ${f(G.mean, 1)} |` };
    }).sort((a, b) => b.d - a.d);
    for (const l of lines) o.push(l.line);
    o.push('');
  }
  writeFileSync(OUT.replace(/-runs\.jsonl$/, '.md'), o.join('\n'));
  console.log(o.join('\n'));
} else {
  const seeds = parseSeeds(arg('seeds', '1-30')!);
  const hours = Number(arg('hours', '4'));
  const [K, N] = arg('shard', '0/1')!.split('/').map(Number);
  let i = 0;
  for (const [p, traits] of CASES) for (const t of traits) for (const seed of seeds) {
    if (ONLY && !ONLY.includes(`${p}:${t}`)) continue;
    if (i++ % N !== K) continue;
    const r = runBal({
      profile: p, seed, hours,
      afterSuccession: t ? (s) => { if (!s.hero.traits.includes(t)) { s.hero.traits.push(t); startLife(s); } } : undefined,
    });
    appendFileSync(OUT, JSON.stringify({ profile: p, trait: t, seed, hours, netLog10: r.netLog10, legacyTotal: r.legacyTotal, gen: r.gen }) + '\n');
  }
}
