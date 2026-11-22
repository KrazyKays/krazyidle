// Harmonie mesurée sur une campagne instrumentée (V0) : moyenne temporelle (0,7 + 0,6 × santé), pondérée par
// la valeur produite (arithmétique et géométrique), production du héros, facteur du Domaine sur Récolter.
//   node lab/balance/simplif/harmonie.mjs <id> [...]
import { readFileSync } from 'node:fs';
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sd = (xs) => { const m = mean(xs); return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, xs.length - 1)); };
for (const id of process.argv.slice(2)) {
  const runs = readFileSync(`lab/results/${id}/runs.jsonl`, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const by = {};
  for (const r of runs) (by[r.profile] ??= []).push(r);
  console.log(`\n${id}\n| profil | n | Harmonie (temps) | Harmonie (valeur) | géométrique | héros seul | facteur Domaine sur Récolter (valeur) |\n|---|---|---|---|---|---|---|`);
  const all = { t: [], v: [], g: [], l: [], c: [] };
  for (const [p, rs] of Object.entries(by)) {
    const t = rs.map((r) => 0.7 + 0.6 * r.harmonyAvg), v = rs.map((r) => r.instr.hValue), g = rs.map((r) => r.instr.hGeo), l = rs.map((r) => r.instr.hLife).filter(Number.isFinite), c = rs.map((r) => r.instr.ecoCult).filter(Number.isFinite);
    all.t.push(...t); all.v.push(...v); all.g.push(...g); all.l.push(...l); all.c.push(...c);
    const s = (xs) => `${mean(xs).toFixed(4)} ± ${sd(xs).toFixed(4)}`;
    console.log(`| ${p} | ${rs.length} | ${s(t)} | ${s(v)} | ${s(g)} | ${s(l)} | ${s(c)} |`);
  }
  const s = (xs) => `${mean(xs).toFixed(4)} ± ${sd(xs).toFixed(4)}`;
  console.log(`| **tous** | ${runs.length} | ${s(all.t)} | ${s(all.v)} | ${s(all.g)} | ${s(all.l)} | ${s(all.c)} |`);
}
