// Analyse approfondie d'une campagne (runs.jsonl) : usage des mécaniques, sentinelles, corrélations,
// valeurs aberrantes, puissance statistique, courbes horaires. Lecture seule.
//
//   node --import ./lab/sim/register.mjs lab/metrics/analyze.ts <id-campagne> [...]
// Sorties : lab/reports/analysis-<id>.md et lab/reports/analysis-<id>.json
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ACTS, BUILDINGS, LEGACY, TRAITS } from '../../src/engine/data';
import { EPITHETS } from '../../src/engine/epithets';
import type { RunResult } from '../sim/runner';
import { ROOT, byProfile, desc, fmt, loadMeta, loadRuns, pct, pearson, seedsNeeded, spearman } from './lib';

/** Profils « compétents » (référence pour le seuil de sous-utilisation de 5 %). */
export const COMPETENT = ['experimente', 'optimiseur', 'occasionnel'];

export function analyze(id: string) {
  const runs = loadRuns(id);
  const meta = loadMeta(id);
  const P = byProfile(runs);
  const out: any = { id, meta, profiles: {} };
  for (const [p, rs] of Object.entries(P)) {
    const n = rs.length;
    const share = (f: (r: RunResult) => boolean) => rs.filter(f).length / n;
    const o: any = { n };
    // Déblocages : distinguer « jamais » de la durée (la sentinelle -1 fausse les moyennes de summary.md)
    o.unlock = Object.fromEntries(['commercer', 'etudier', 'mediter'].map((a) => {
      const xs = rs.map((r) => r.unlockAt[a]);
      const ok = xs.filter((x) => x >= 0);
      return [a, { never: 1 - ok.length / n, d: desc(ok), naiveMean: xs.reduce((s, x) => s + x, 0) / n }];
    }));
    o.upgradeAt = Object.fromEntries(['alliances', 'chroniques'].map((u) => {
      const ok = rs.map((r) => r.upgradeAt[u]).filter((x) => x !== undefined);
      return [u, { share: ok.length / n, d: desc(ok) }];
    }));
    o.buildings = Object.fromEntries(BUILDINGS.map((b) => [b.id, { used: share((r) => (r.buildings[b.id] ?? 0) > 0), lvl: desc(rs.map((r) => r.buildings[b.id] ?? 0)) }]));
    o.legacy = Object.fromEntries(LEGACY.map((l) => [l.id, { used: share((r) => (r.upgrades[l.id] ?? 0) > 0), lvl: desc(rs.map((r) => r.upgrades[l.id] ?? 0)) }]));
    o.traits = Object.fromEntries(TRAITS.map((t) => [t.id, { present: share((r) => (r.traitFreq60[t.id] ?? 0) > 0), freq: desc(rs.map((r) => r.traitFreq60[t.id] ?? 0)).mean }]));
    o.heroAct = Object.fromEntries(ACTS.map((a) => [a, desc(rs.map((r) => r.heroActShare[a])).mean]));
    o.echoAct = Object.fromEntries(ACTS.map((a) => [a, desc(rs.map((r) => r.echoActShare[a])).mean]));
    o.heroActUsed = Object.fromEntries(ACTS.map((a) => [a, share((r) => r.heroActShare[a] >= 0.05)]));
    o.epithets = {
      found: desc(rs.map((r) => r.epithetsFound)),
      livesShare: desc(rs.map((r) => r.epithetLives / Math.max(1, r.lives))),
      livesShareWithChron: desc(rs.filter((r) => r.upgradeAt.chroniques !== undefined).map((r) => {
        // part des vies surnommées depuis l'achat de Chroniques (approx. : vies postérieures ≈ lives × (1 − t/T))
        const frac = 1 - r.upgradeAt.chroniques / (r.hours * 3600);
        return r.epithetLives / Math.max(1, r.lives * frac);
      })),
    };
    o.kpi = Object.fromEntries((['gen', 'legacyTotal', 'log10Value', 'echoShare', 'harmonyAvg', 'harmonyMin', 'traitCombos60', 'pausedShare', 'married', 'vocationTierMax', 'eclatsEnd', 'eventsDone', 'lives', 'legacyUnspent'] as const)
      .map((k) => [k, desc(rs.map((r) => (r as any)[k] as number))]));
    o.anomalies = rs.reduce((a, r) => a + r.anomalies.length, 0);
    // Corrélations (au sein du profil, entre graines) — corrélation ≠ causalité
    const v = rs.map((r) => r.log10Value);
    o.corr = Object.fromEntries((['echoShare', 'harmonyAvg', 'harmonyMin', 'traitCombos60', 'gen', 'vocationTierMax'] as const).map((k) => {
      const x = rs.map((r) => r[k] as number);
      return [k, { pearson: pearson(x, v), spearman: spearman(x, v) }];
    }));
    // Valeurs aberrantes (|z| > 3) sur log10Value
    const d = o.kpi.log10Value;
    o.outliers = rs.filter((r) => d.sd > 0 && Math.abs((r.log10Value - d.mean) / d.sd) > 3).map((r) => ({ seed: r.seed, log10Value: r.log10Value, z: (r.log10Value - d.mean) / d.sd }));
    // Puissance : graines par groupe pour détecter ±5 % (sur la valeur linéaire : Δlog10 = log10(1,05))
    o.power = {
      log10Value: seedsNeeded(d.sd, Math.log10(1.05)),
      legacyTotal: seedsNeeded(o.kpi.legacyTotal.sd, 0.05 * o.kpi.legacyTotal.mean),
      gen: seedsNeeded(o.kpi.gen.sd, 0.05 * o.kpi.gen.mean),
      echoShare: seedsNeeded(o.kpi.echoShare.sd, 0.05 * o.kpi.echoShare.mean),
      harmonyAvg: seedsNeeded(o.kpi.harmonyAvg.sd, 0.05 * o.kpi.harmonyAvg.mean),
      traitCombos60: seedsNeeded(o.kpi.traitCombos60.sd, 0.05 * o.kpi.traitCombos60.mean),
      'harmonyAvg±0,01': seedsNeeded(o.kpi.harmonyAvg.sd, 0.01),
    };
    // Courbe horaire : médiane et part des parties dont le débit horaire baisse d'une heure à l'autre (« mur »)
    const H = Math.max(...rs.map((r) => r.hourly.length));
    o.hourly = Array.from({ length: H }, (_, i) => {
      const xs = rs.map((r) => r.hourly[i]?.log10Value).filter((x) => x !== undefined) as number[];
      const rate = rs.map((r) => r.hourly[i]?.valueRate).filter((x) => x !== undefined) as number[];
      const gen = rs.map((r) => r.hourly[i]?.gen).filter((x) => x !== undefined) as number[];
      return { h: i + 1, log10Value: desc(xs), log10Rate: desc(rate.map((x) => Math.log10(Math.max(1e-9, x)))), gen: desc(gen) };
    });
    o.rateDrops = share((r) => r.hourly.some((h, i) => i > 0 && h.valueRate < 0.95 * r.hourly[i - 1].valueRate));
    o.rateDropsMean = desc(rs.map((r) => r.hourly.filter((h, i) => i > 0 && h.valueRate < 0.95 * r.hourly[i - 1].valueRate).length)).mean;
    out.profiles[p] = o;
  }
  // Signature de harmonyMin : identique entre profils ? (même valeur pour la même graine)
  const hm: Record<string, Record<number, number>> = {};
  for (const r of runs) (hm[r.profile] ??= {})[r.seed] = r.harmonyMin;
  const prof = Object.keys(hm);
  const same: Record<string, number> = {};
  for (const a of prof) for (const b of prof) if (a < b) {
    const seeds = Object.keys(hm[a]).map(Number).filter((s) => hm[b][s] !== undefined);
    if (seeds.length) same[`${a}~${b}`] = seeds.filter((s) => Math.abs(hm[a][s] - hm[b][s]) < 1e-12).length / seeds.length;
  }
  out.harmonyMinIdentical = same;
  out.epithetsTotal = EPITHETS.length;
  return out;
}

function md(a: any): string {
  const L: string[] = [];
  const m = a.meta;
  L.push(`# Analyse ${a.id}`, '', `> **[SIMULÉ]** — commit \`${m.commit}\`, ${m.runs} parties, graines ${m.seeds}, ${m.hours} h, dt ${m.dt} s, événements ${m.events ? 'oui' : 'non'}. Généré par \`lab/metrics/analyze.ts\`.`, '');
  const ps = Object.keys(a.profiles);
  const row = (cells: string[]) => `| ${cells.join(' | ')} |`;
  L.push('## Déblocages (sentinelle -1 séparée)', '', row(['profil', 'Étudier jamais', 'Étudier p50 (s) réel', 'moy. naïve summary', 'Méditer jamais', 'Méditer p50 réel', 'moy. naïve']), row(Array(7).fill('---')));
  for (const p of ps) { const u = a.profiles[p].unlock; L.push(row([p, pct(u.etudier.never), fmt(u.etudier.d.p50), fmt(u.etudier.naiveMean), pct(u.mediter.never), fmt(u.mediter.d.p50), fmt(u.mediter.naiveMean)])); }
  L.push('', '## Alliances / Chroniques', '', row(['profil', 'Alliances achetées', 'p50 (min)', 'Chroniques achetées', 'p50 (min)', 'surnoms distincts moy.', 'vies surnommées / vies', 'idem après achat', 'mariés moy.']), row(Array(9).fill('---')));
  for (const p of ps) { const o = a.profiles[p]; L.push(row([p, pct(o.upgradeAt.alliances.share), fmt(o.upgradeAt.alliances.d.p50 / 60), pct(o.upgradeAt.chroniques.share), fmt(o.upgradeAt.chroniques.d.p50 / 60), fmt(o.epithets.found.mean), pct(o.epithets.livesShare.mean, 1), pct(o.epithets.livesShareWithChron.mean, 1), fmt(o.kpi.married.mean)])); }
  L.push('', '## Bâtiments : part des parties avec niveau ≥ 1 (niveau moyen)', '', row(['profil', ...BUILDINGS.map((b) => b.id)]), row(Array(BUILDINGS.length + 1).fill('---')));
  for (const p of ps) L.push(row([p, ...BUILDINGS.map((b) => `${pct(a.profiles[p].buildings[b.id].used)} (${fmt(a.profiles[p].buildings[b.id].lvl.mean, 1)})`)]));
  L.push('', '## Améliorations d\'Héritage : part des parties avec niveau ≥ 1 (niveau moyen)', '', row(['profil', ...LEGACY.map((l) => l.id)]), row(Array(LEGACY.length + 1).fill('---')));
  for (const p of ps) L.push(row([p, ...LEGACY.map((l) => `${pct(a.profiles[p].legacy[l.id].used)} (${fmt(a.profiles[p].legacy[l.id].lvl.mean, 1)})`)]));
  L.push('', '## Activités : part du temps héros / part des secondes d\'Échos / parties où l\'activité ≥ 5 % du temps héros', '', row(['profil', ...ACTS]), row(Array(ACTS.length + 1).fill('---')));
  for (const p of ps) L.push(row([p, ...ACTS.map((x) => `${pct(a.profiles[p].heroAct[x])} / ${pct(a.profiles[p].echoAct[x])} / ${pct(a.profiles[p].heroActUsed[x])}`)]));
  L.push('', '## Traits : part des parties où le trait apparaît chez les 60 derniers ancêtres (fréquence moyenne)', '', row(['trait', ...ps]), row(Array(ps.length + 1).fill('---')));
  for (const t of TRAITS) L.push(row([t.id + (t.neg ? ' (−)' : '') + (t.shop ? ' (Bazar)' : ''), ...ps.map((p) => `${pct(a.profiles[p].traits[t.id].present)} (${pct(a.profiles[p].traits[t.id].freq)})`)]));
  L.push('', '## Corrélations avec log10Value (Pearson / Spearman, entre graines d\'un même profil)', '', row(['profil', 'echoShare', 'harmonyAvg', 'harmonyMin', 'traitCombos60', 'gen', 'vocationTierMax']), row(Array(7).fill('---')));
  for (const p of ps) { const c = a.profiles[p].corr; L.push(row([p, ...['echoShare', 'harmonyAvg', 'harmonyMin', 'traitCombos60', 'gen', 'vocationTierMax'].map((k) => `${fmt(c[k].pearson, 2)} / ${fmt(c[k].spearman, 2)}`)])); }
  L.push('', '## Puissance : graines par groupe pour détecter un écart de 5 % (α 0,05, puissance 0,8, comparaison non appariée)', '', row(['profil', 'valeur (×1,05)', 'legacyTotal', 'gen', 'echoShare', 'harmonyAvg', 'traitCombos60', 'harmonyAvg ±0,01']), row(Array(8).fill('---')));
  for (const p of ps) { const w = a.profiles[p].power; L.push(row([p, w.log10Value, w.legacyTotal, w.gen, w.echoShare, w.harmonyAvg, w.traitCombos60, w['harmonyAvg±0,01']].map(String))); }
  L.push('', '## Valeurs aberrantes (|z| > 3 sur log10Value) et baisses de débit horaire', '', row(['profil', 'n aberrantes', 'graines', 'parties avec ≥ 1 baisse > 5 % du débit horaire', 'baisses / partie']), row(Array(5).fill('---')));
  for (const p of ps) { const o = a.profiles[p]; L.push(row([p, String(o.outliers.length), o.outliers.slice(0, 8).map((x: any) => `${x.seed} (z ${x.z.toFixed(1)})`).join(', ') || '—', pct(o.rateDrops), fmt(o.rateDropsMean, 2)])); }
  L.push('', '## Valeur log10 médiane par heure', '', row(['profil', ...a.profiles[ps[0]].hourly.map((h: any) => `h${h.h}`)]), row(Array(a.profiles[ps[0]].hourly.length + 1).fill('---')));
  for (const p of ps) L.push(row([p, ...a.profiles[p].hourly.map((h: any) => fmt(h.log10Value.p50, 2))]));
  L.push('', '## harmonyMin identique (même graine) entre profils', '', row(['paire', 'part des graines identiques']), row(['---', '---']));
  for (const [k, v] of Object.entries(a.harmonyMinIdentical)) L.push(row([k, pct(v as number)]));
  return L.join('\n') + '\n';
}

if (process.argv[1]?.endsWith('analyze.ts')) {
  const ids = process.argv.slice(2);
  if (!ids.length) { console.error('usage : analyze.ts <id> [...]'); process.exit(1); }
  const dir = join(ROOT, 'lab', 'reports');
  mkdirSync(dir, { recursive: true });
  for (const id of ids) {
    const a = analyze(id);
    writeFileSync(join(dir, `analysis-${id}.json`), JSON.stringify(a));
    writeFileSync(join(dir, `analysis-${id}.md`), md(a));
    console.log(`→ lab/reports/analysis-${id}.md`);
  }
}
