// Compare une campagne à une référence.
//   npm run sim:compare -- lab/baselines/<ref>.json lab/results/<id>/summary.json [--all]
// Affiche les indicateurs dont la moyenne change de plus de 5 % ou dont la taille d'effet |d| > 0.3.
import { readFileSync } from 'node:fs';
import { compare } from './stats';

const [a, b] = process.argv.slice(2).filter((x) => !x.startsWith('--'));
const all = process.argv.includes('--all');
if (!a || !b) { console.error('usage : compare <reference.json> <candidat.json>'); process.exit(1); }
const base = JSON.parse(readFileSync(a, 'utf8'));
const cand = JSON.parse(readFileSync(b, 'utf8'));
const rows = compare(base.summary, cand.summary);
console.log(`Référence ${base.meta.id} (${base.meta.commit}) → candidat ${cand.meta.id} (${cand.meta.commit})\n`);
console.log('| profil | indicateur | réf. | cand. | Δ % | d |\n|---|---|---|---|---|---|');
for (const r of rows) {
  if (!all && !(Math.abs(r.rel) > 0.05 || Math.abs(r.d) > 0.3)) continue;
  console.log(`| ${r.profile} | ${r.key} | ${r.base.toPrecision(4)} | ${r.cand.toPrecision(4)} | ${(r.rel * 100).toFixed(1)} | ${r.d.toFixed(2)} |`);
}
