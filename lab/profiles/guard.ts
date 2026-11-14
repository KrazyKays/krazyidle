// Garde-fous (lab/metrics/guardrails.ts, fonction evaluate) appliqués aux campagnes PBA, profils i-* renommés.
//   node --import ./lab/sim/register.mjs lab/profiles/guard.ts <cand-id> <ref-id>[,<ref-id>…]
import { readFileSync } from 'node:fs';
import { evaluate } from '../metrics/guardrails';
const load = (id: string) => readFileSync(`lab/profiles/results/${id}/runs.jsonl`, 'utf8').trim().split('\n').map((l) => JSON.parse(l))
  .filter((r) => r.profile.startsWith('i-')).map((r) => ({ ...r, profile: r.profile.slice(2) }))
  .sort((a, b) => a.profile.localeCompare(b.profile) || a.seed - b.seed);
const [cand, refs] = process.argv.slice(2);
const ref = refs.split(',').flatMap(load).sort((a, b) => a.profile.localeCompare(b.profile) || a.seed - b.seed);
const v = evaluate(ref, load(cand));
const f = (x?: number) => (x === undefined || !Number.isFinite(x) ? '—' : Math.abs(x) >= 100 ? x.toFixed(0) : x.toPrecision(4));
for (const x of v.filter((x) => x.level !== 'VERT')) console.log(`| ${x.level} | ${x.profile} | ${x.kpi} | ${x.rule} | ${f(x.ref)} | ${f(x.cand)} | ${x.z === undefined ? '—' : x.z.toFixed(1)} |`);
const n = (l: string) => v.filter((x) => x.level === l).length;
console.log(`VERT ${n('VERT')} · ORANGE ${n('ORANGE')} · ROUGE ${n('ROUGE')} · DETTE ${n('DETTE')} · n/a ${n('n/a')}`);
