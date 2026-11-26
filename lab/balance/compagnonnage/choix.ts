// Compagnonnage — C4 : applique la règle de choix fixée AVANT les mesures (RESULTATS.md, § C4) aux fichiers results/C4-k*.json.
//   node --import ./lab/balance/register.mjs lab/balance/compagnonnage/choix.ts
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const dir = 'lab/balance/compagnonnage/results';
const files = readdirSync(dir).filter((f) => /^C4-k[\d.]+\.json$/.test(f));
const byK = new Map<number, any>(files.map((f) => { const j = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')); return [j.k, j]; }));
const ks = [...byK.keys()].sort((a, b) => a - b);
type Row = { a: string; b: string; notaire: boolean; dleg: number };
const cands: { k: number; kN: number; out: number; spread: number; rows: Row[] }[] = [];
for (const k of ks) for (const kN of ks) {
  if (kN > k || k > 1.3) continue; // kN réduit ; K4 : k ≤ 1,3
  const rows: Row[] = [...byK.get(k).rows.filter((r: Row) => !r.notaire), ...byK.get(kN).rows.filter((r: Row) => r.notaire)];
  const outN = rows.filter((r) => (r.notaire ? r.dleg < 0 || r.dleg > 15 : r.dleg < 3 || r.dleg > 15)).length;
  const v = rows.map((r) => r.dleg);
  const spread = Math.max(...v) - Math.min(...v);
  cands.push({ k, kN, out: outN + (spread > 20 ? 1 : 0), spread, rows });
}
const ok = cands.filter((c) => c.out === 0).sort((x, y) => x.k - y.k || x.kN - y.kN);
const best = ok[0] ?? [...cands].sort((x, y) => x.out - y.out || x.spread - y.spread || x.k - y.k)[0];
const md = [`# C4 — choix de (k, kN) selon la règle fixée avant les mesures`, '',
  ok.length ? `Couples qui tiennent K2 et K3 : ${ok.map((c) => `(${c.k} ; ${c.kN})`).join(', ')}.` : '**Aucun couple ne tient K2 et K3** : couple retenu = le moins de combinaisons hors bornes.',
  '', `**Retenu : k = ${best.k}, kN = ${best.kN}** — ${best.out} hors bornes, écart ${best.spread.toFixed(1)} points.`, '',
  '| vocation | 2e | Notaire | Δ ⚜️ (%) | dans les bornes |', '|---|---|---|---|---|',
  ...best.rows.map((r) => `| ${r.a} | ${r.b} | ${r.notaire ? 'oui' : ''} | ${r.dleg} | ${(r.notaire ? r.dleg >= 0 && r.dleg <= 15 : r.dleg >= 3 && r.dleg <= 15) ? '✓' : '✗'} |`),
  '', '## Toutes les valeurs de k (Δ ⚜️ %, Notaire compris au même k)', '', `| vocation → 2e | ${ks.join(' | ')} |`, `|---|${ks.map(() => '---').join('|')}|`,
  ...byK.get(ks[0]).rows.map((r: Row, i: number) => `| ${r.a} → ${r.b}${r.notaire ? ' (N)' : ''} | ${ks.map((k) => byK.get(k).rows[i].dleg).join(' | ')} |`)];
writeFileSync(`${dir}/C4-choix.md`, md.join('\n') + '\n');
console.log(md.join('\n'));
