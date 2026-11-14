// Robustesse des mesures : effet du pas dt, stabilité selon l'horizon, reproductibilité, convergence en graines.
//
//   node --import ./lab/sim/register.mjs lab/metrics/robustness.ts
// Lit C000, C401 (dt 0,1), C402 (12 h), C403 (rejeu au HEAD). Sortie : lab/reports/robustness.md + .json
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { RunResult } from '../sim/runner';
import { ROOT, byProfile, desc, fmt, loadMeta, loadRuns, pairedZ, pct, spearman } from './lib';

const has = (id: string) => existsSync(join(ROOT, 'lab', 'results', id, 'runs.jsonl'));
const L: string[] = ['# Robustesse des mesures', '', '> **[SIMULÉ]** — généré par `lab/metrics/robustness.ts`.', ''];
const J: any = {};
const C000 = byProfile(loadRuns('C000-reference-sans-evenements'));

// 1. Pas de temps : apparié sur les mêmes graines
if (has('C401-dt01-vs-dt05')) {
  const m = loadMeta('C401-dt01-vs-dt05');
  const D = byProfile(loadRuns('C401-dt01-vs-dt05'));
  L.push('## 1. Effet du pas dt (0,1 s contre 0,5 s, mêmes graines, appariés)', '', `C401 : commit \`${m.commit}\`, graines ${m.seeds}, ${m.hours} h. Référence : mêmes graines extraites de C000 (dt 0,5).`, '',
    '| profil | KPI | dt 0,5 moy. | dt 0,1 moy. | Δ | Δ en % de valeur ou relatif | z apparié | corr. de rang entre graines |', '|---|---|---|---|---|---|---|---|');
  J.dt = {};
  for (const [p, rs] of Object.entries(D)) {
    const base = new Map(C000[p].map((r) => [r.seed, r]));
    const pairs = rs.filter((r) => base.has(r.seed));
    J.dt[p] = {};
    for (const k of ['log10Value', 'gen', 'legacyTotal', 'echoShare', 'harmonyAvg', 'harmonyMin', 'traitCombos60', 'epithetsFound'] as const) {
      const a = pairs.map((r) => base.get(r.seed)![k] as number), b = pairs.map((r) => r[k] as number);
      const A = desc(a), B = desc(b), d = B.mean - A.mean;
      const rel = k === 'log10Value' ? 10 ** d - 1 : d / Math.abs(A.mean || 1);
      J.dt[p][k] = { a: A.mean, b: B.mean, d, rel, z: pairedZ(a, b), rho: spearman(a, b) };
      L.push(`| ${p} | ${k} | ${fmt(A.mean)} | ${fmt(B.mean)} | ${fmt(d)} | ${pct(rel, 1)} | ${fmt(pairedZ(a, b), 1)} | ${fmt(spearman(a, b), 2)} |`);
    }
  }
  L.push('');
}

// 2. Horizon : classement des profils à 3 h, 6 h, 12 h (mêmes parties de 12 h)
if (has('C402-horizon-12h')) {
  const m = loadMeta('C402-horizon-12h');
  const H = byProfile(loadRuns('C402-horizon-12h'));
  const at = (rs: RunResult[], h: number) => desc(rs.map((r) => r.hourly.find((x) => x.h === h)?.log10Value ?? NaN)).mean;
  const hs = [1, 2, 3, 6, 9, 12];
  L.push('## 2. Stabilité selon l\'horizon (C402, 12 h)', '', `C402 : commit \`${m.commit}\`, graines ${m.seeds}, dt ${m.dt}. log10 de la valeur cumulée (moyenne), rang entre parenthèses.`, '',
    `| profil | ${hs.map((h) => `${h} h`).join(' | ')} |`, `|---|${hs.map(() => '---').join('|')}|`);
  const tab: Record<string, number[]> = {};
  for (const [p, rs] of Object.entries(H)) tab[p] = hs.map((h) => at(rs, h));
  const rank = (i: number) => Object.fromEntries(Object.entries(tab).sort((a, b) => b[1][i] - a[1][i]).map(([p], j) => [p, j + 1]));
  const R = hs.map((_, i) => rank(i));
  for (const p of Object.keys(tab).sort((a, b) => R[3][a] - R[3][b])) L.push(`| ${p} | ${tab[p].map((v, i) => `${fmt(v, 2)} (${R[i][p]})`).join(' | ')} |`);
  const ps = Object.keys(tab);
  const rho = (i: number, j: number) => spearman(ps.map((p) => tab[p][i]), ps.map((p) => tab[p][j]));
  L.push('', `Corrélation de rang des profils : 3 h ↔ 6 h = ${fmt(rho(2, 3), 2)} · 6 h ↔ 12 h = ${fmt(rho(3, 5), 2)} · 3 h ↔ 12 h = ${fmt(rho(2, 5), 2)}.`, '');
  // Écart chasseur / paysan et ratio mono max/min par horizon
  const mono = ps.filter((p) => p.startsWith('mono-'));
  L.push('| horizon | chasser / cultiver (valeur) | meilleure / pire vocation mono | gen experimente | legacyTotal experimente |', '|---|---|---|---|---|');
  J.horizon = { tab, hs };
  for (let i = 0; i < hs.length; i++) {
    const v = mono.map((p) => tab[p][i]);
    const ex = H.experimente?.map((r) => r.hourly.find((x) => x.h === hs[i])) ?? [];
    L.push(`| ${hs[i]} h | ${pct(10 ** (tab['mono-chasser'][i] - tab['mono-cultiver'][i]))} | ×${fmt(10 ** (Math.max(...v) - Math.min(...v)), 1)} | ${fmt(desc(ex.map((x) => x?.gen ?? NaN)).mean)} | ${fmt(desc(ex.map((x) => x?.legacyTotal ?? NaN)).mean)} |`);
  }
  // Fin de partie à 12 h
  L.push('', '| profil (12 h) | Chroniques achetées | surnoms distincts moy. | traitCombos60 | harmonyAvg | echoShare |', '|---|---|---|---|---|---|');
  for (const [p, rs] of Object.entries(H)) L.push(`| ${p} | ${pct(rs.filter((r) => r.upgradeAt.chroniques !== undefined).length / rs.length)} | ${fmt(desc(rs.map((r) => r.epithetsFound)).mean, 2)} | ${fmt(desc(rs.map((r) => r.traitCombos60)).mean, 1)} | ${fmt(desc(rs.map((r) => r.harmonyAvg)).mean)} | ${fmt(desc(rs.map((r) => r.echoShare)).mean)} |`);
  L.push('');
}

// 3. Reproductibilité : rejeu au HEAD des mêmes graines
if (has('C403-reproductibilite-HEAD')) {
  const m = loadMeta('C403-reproductibilite-HEAD');
  const rs = loadRuns('C403-reproductibilite-HEAD');
  let same = 0, n = 0;
  const keys = ['log10Value', 'gen', 'legacyTotal', 'echoShare', 'harmonyAvg', 'harmonyMin', 'traitCombos60'] as const;
  for (const r of rs) {
    const b = C000[r.profile].find((x) => x.seed === r.seed)!;
    n++; if (keys.every((k) => r[k] === b[k]) && JSON.stringify(r.hourly) === JSON.stringify(b.hourly)) same++;
  }
  J.repro = { same, n, commit: m.commit };
  L.push('## 3. Reproductibilité', '', `C403 (commit \`${m.commit}\`, graines ${m.seeds}, profils ${m.profiles.join(', ')}) contre C000 (commit a53d1b5) : **${same}/${n}** parties identiques au bit près sur ${keys.join(', ')} et la courbe horaire.`, '');
}

// 4. Convergence : demi-largeur de l'IC95 de la moyenne de log10Value en fonction du nombre de graines
L.push('## 4. Convergence en graines (C000)', '', 'Demi-largeur de l\'IC à 95 % de la moyenne, exprimée en % de valeur produite (10^(1,96·σ/√n) − 1).', '', '| profil | σ log10 | n = 20 | n = 50 | n = 100 | n = 200 | graines pour ±2,5 % |', '|---|---|---|---|---|---|---|');
J.conv = {};
for (const [p, rs] of Object.entries(C000)) {
  const sd = desc(rs.map((r) => r.log10Value)).sd;
  const hw = (n: number) => 10 ** (1.96 * sd / Math.sqrt(n)) - 1;
  const need = Math.ceil((1.96 * sd / Math.log10(1.025)) ** 2);
  J.conv[p] = { sd, need };
  L.push(`| ${p} | ${fmt(sd)} | ${pct(hw(20), 1)} | ${pct(hw(50), 1)} | ${pct(hw(100), 1)} | ${pct(hw(200), 1)} | ${need} |`);
}
L.push('');

mkdirSync(join(ROOT, 'lab', 'reports'), { recursive: true });
writeFileSync(join(ROOT, 'lab', 'reports', 'robustness.md'), L.join('\n') + '\n');
writeFileSync(join(ROOT, 'lab', 'reports', 'robustness.json'), JSON.stringify(J));
console.log(L.join('\n'));
