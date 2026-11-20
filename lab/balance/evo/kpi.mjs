// Critères du lot 0.3 (lab/design/EVO-0.3-criteres.md) à partir d'un ou plusieurs runs.jsonl.
//   node lab/balance/evo/kpi.mjs lab/results/<id>/runs.jsonl [...]
import { readFileSync } from 'node:fs';
for (const f of process.argv.slice(2)) {
  const runs = readFileSync(f, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const by = {};
  for (const r of runs) (by[r.profile] ??= []).push(r);
  console.log(`\n${f}`);
  console.log('profil'.padEnd(14), 'succ', 'offreLég', 'offreÉpi', 'mutÉpi', 'mutLég(hors nova)', 'hérosLég', 'parties≥1évo', 'parties≥1lég.évo', 'parties nova proposée', 'novas vécues', 'Éclats fin', 'log10 valeur');
  for (const [p, rs] of Object.entries(by)) {
    const t = rs.map((r) => r.traits ?? {});
    const sum = (k) => t.reduce((a, x) => a + (x[k] ?? 0), 0);
    const share = (pred) => (rs.filter(pred).length / rs.length * 100).toFixed(1) + ' %';
    const succ = sum('succ');
    const pct = (k) => succ ? (sum(k) / succ * 100).toFixed(1) + ' %' : '–';
    const mean = (fn) => (rs.reduce((a, r) => a + fn(r), 0) / rs.length).toFixed(3);
    console.log(p.padEnd(14), succ, pct('offerLeg'), pct('offerEpic'), pct('offerEpicMut'), pct('offerLegMut'), pct('heroLeg'),
      share((r) => (r.traits?.evo ?? 0) > 0), share((r) => (r.traits?.evoLeg ?? 0) > 0), share((r) => (r.traits?.novaOffered ?? 0) > 0), sum('novaLived'),
      mean((r) => r.eclatsEnd), mean((r) => r.log10Value));
  }
}
