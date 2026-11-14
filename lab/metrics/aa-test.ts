// Test A/A de `npm run sim:compare` : on coupe une campagne en deux moitiés de graines (même code, même commit)
// et on regarde ce que la règle d'affichage de lab/sim/compare.ts (|Δ| > 5 % ou |d| > 0,3) signale.
// Tout signalement est un faux positif. Compare aussi la règle proposée (garde-fous, lab/metrics/guardrails.ts).
//
//   node --import ./lab/sim/register.mjs lab/metrics/aa-test.ts <id-campagne> [<id-campagne>…]
import { compare, summarize } from '../sim/stats';
import { loadRuns } from './lib';

for (const id of process.argv.slice(2)) {
  const rs = loadRuns(id);
  const seeds = [...new Set(rs.map((r) => r.seed))].sort((a, b) => a - b);
  const half = seeds[Math.floor(seeds.length / 2)];
  const A = summarize(rs.filter((r) => r.seed < half));
  const B = summarize(rs.filter((r) => r.seed >= half));
  const rows = compare(A, B);
  const flagged = rows.filter((r) => Math.abs(r.rel) > 0.05 || Math.abs(r.d) > 0.3);
  const byKey: Record<string, number> = {};
  for (const r of flagged) byKey[r.key.replace(/^(bld|upg|heroAct|echoAct|unlock|h\d+)\..*/, '$1.*')] = (byKey[r.key.replace(/^(bld|upg|heroAct|echoAct|unlock|h\d+)\..*/, '$1.*')] ?? 0) + 1;
  const infD = rows.filter((r) => !Number.isFinite(r.d) || Math.abs(r.d) > 1e6).length;
  console.log(`## A/A ${id} : graines < ${half} contre ≥ ${half}`);
  console.log(`lignes comparées : ${rows.length} · signalées par compare.ts : ${flagged.length} (${(100 * flagged.length / rows.length).toFixed(1)} %) · d infini/absurde (é.-t. nul) : ${infD}`);
  console.log('par famille :', JSON.stringify(byKey));
  const main = ['gen', 'legacyTotal', 'log10Value', 'echoShare', 'harmonyAvg', 'harmonyMin', 'traitCombos60'];
  console.log('| profil | indicateur | A | B | Δ % | d |');
  for (const r of flagged.filter((r) => main.includes(r.key))) console.log(`| ${r.profile} | ${r.key} | ${r.base.toPrecision(4)} | ${r.cand.toPrecision(4)} | ${(r.rel * 100).toFixed(1)} | ${r.d.toFixed(2)} |`);
  console.log('');
}
