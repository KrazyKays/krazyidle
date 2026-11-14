// Statistiques descriptives et comparaison de campagnes.
import type { RunResult } from './runner';

export interface Dist { n: number; mean: number; sd: number; min: number; p10: number; p50: number; p90: number; max: number }

export function dist(xs: number[]): Dist {
  const v = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  const n = v.length;
  if (!n) return { n: 0, mean: NaN, sd: NaN, min: NaN, p10: NaN, p50: NaN, p90: NaN, max: NaN };
  const mean = v.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, n - 1));
  const q = (p: number) => v[Math.min(n - 1, Math.max(0, Math.round(p * (n - 1))))];
  return { n, mean, sd, min: v[0], p10: q(0.1), p50: q(0.5), p90: q(0.9), max: v[n - 1] };
}

/** Indicateurs scalaires extraits d'une partie (clé → valeur). */
export function scalars(r: RunResult): Record<string, number> {
  const o: Record<string, number> = {
    gen: r.gen, legacyTotal: r.legacyTotal, log10Value: r.log10Value, echoShare: r.echoShare,
    harmonyAvg: r.harmonyAvg, harmonyMin: r.harmonyMin, pausedShare: r.pausedShare, traitCombos60: r.traitCombos60,
    epithetsFound: r.epithetsFound, eclatsEnd: r.eclatsEnd, eventsDone: r.eventsDone, married: r.married, vocationTierMax: r.vocationTierMax,
    anomalies: r.anomalies.length,
  };
  // « jamais » (-1) n'entre pas dans la moyenne du délai : il est compté à part dans never.* (DATA-02).
  for (const [a, t] of Object.entries(r.unlockAt)) {
    if (a === 'cultiver' || a === 'chasser') continue;
    o[`never.${a}`] = t < 0 ? 1 : 0;
    o[`unlock.${a}`] = t < 0 ? NaN : t;
  }
  for (const u of ['alliances', 'chroniques']) { const t = r.upgradeAt[u]; o[`never.${u}`] = t === undefined ? 1 : 0; o[`upgradeAt.${u}`] = t ?? NaN; }
  o.lives = r.lives; o.epithetLives = r.epithetLives;
  for (const [a, x] of Object.entries(r.heroActShare)) o[`heroAct.${a}`] = x;
  for (const [a, x] of Object.entries(r.echoActShare)) o[`echoAct.${a}`] = x;
  for (const [b, x] of Object.entries(r.buildings)) o[`bld.${b}`] = x;
  for (const [u, x] of Object.entries(r.upgrades)) o[`upg.${u}`] = x;
  for (const h of r.hourly) o[`h${h.h}.log10Value`] = h.log10Value;
  return o;
}

export type Summary = Record<string, Record<string, Dist>>;

export function summarize(results: RunResult[]): Summary {
  const by: Record<string, RunResult[]> = {};
  for (const r of results) (by[r.profile] ??= []).push(r);
  const out: Summary = {};
  for (const [p, rs] of Object.entries(by)) {
    const keys = new Set<string>();
    const rows = rs.map(scalars);
    for (const row of rows) for (const k in row) keys.add(k);
    out[p] = {};
    // NaN = valeur absente (ex. jamais débloqué) : exclue de la distribution, n la reflète.
    for (const k of [...keys].sort()) out[p][k] = dist(rows.map((row) => (k in row ? row[k] : NaN)));
  }
  return out;
}

const f = (x: number) => (!Number.isFinite(x) ? '—' : Math.abs(x) >= 1000 ? x.toFixed(0) : Math.abs(x) >= 10 ? x.toFixed(1) : x.toFixed(3));

export function summaryMarkdown(meta: any, s: Summary): string {
  const lines = [`# Campagne ${meta.id}`, '', `- Commit : \`${meta.commit}\`${meta.srcDirty ? ' (**src/ modifié**)' : ''}`, `- Commande : \`${meta.command}\``, `- ${meta.runs} parties · ${meta.hours} h · dt ${meta.dt} s · événements ${meta.events ? 'oui' : 'non'} · ${(meta.wallMs / 1000).toFixed(1)} s`, '', '> Résultats **[SIMULÉS]** : profils automatiques, pas de vrais joueurs. `never.*` = part des parties sans déblocage ; `unlock.*` / `upgradeAt.*` ne portent que sur les parties qui débloquent (n). Décision avant/après : `npm run sim:guard` (pas `sim:compare`).', ''];
  const main = ['gen', 'legacyTotal', 'log10Value', 'echoShare', 'harmonyAvg', 'traitCombos60', 'epithetsFound', 'eventsDone', 'unlock.commercer', 'unlock.etudier', 'never.etudier', 'unlock.mediter', 'never.mediter', 'upgradeAt.alliances', 'never.alliances', 'upgradeAt.chroniques', 'never.chroniques', 'anomalies'];
  for (const [p, d] of Object.entries(s)) {
    lines.push(`## ${p}`, '', '| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |', '|---|---|---|---|---|---|---|---|---|');
    for (const k of main) if (d[k]) { const x = d[k]; lines.push(`| ${k} | ${x.n} | ${f(x.mean)} | ${f(x.sd)} | ${f(x.p10)} | ${f(x.p50)} | ${f(x.p90)} | ${f(x.min)} | ${f(x.max)} |`); }
    const acts = Object.keys(d).filter((k) => k.startsWith('heroAct.')).map((k) => `${k.slice(8)} ${(d[k].mean * 100).toFixed(0)} %`).join(' · ');
    lines.push('', `Temps héros : ${acts}`, '');
  }
  return lines.join('\n');
}

/** Compare deux résumés (référence vs candidat) : écart relatif des moyennes et taille d'effet. */
export function compare(base: Summary, cand: Summary, keys?: string[]) {
  const rows: { profile: string; key: string; base: number; cand: number; delta: number; rel: number; d: number }[] = [];
  for (const p of Object.keys(base)) {
    if (!cand[p]) continue;
    for (const k of keys ?? Object.keys(base[p])) {
      const a = base[p][k], b = cand[p][k];
      if (!a || !b) continue;
      const pooled = Math.sqrt(((a.sd || 0) ** 2 + (b.sd || 0) ** 2) / 2) || 1e-9;
      rows.push({ profile: p, key: k, base: a.mean, cand: b.mean, delta: b.mean - a.mean, rel: a.mean ? (b.mean - a.mean) / Math.abs(a.mean) : NaN, d: (b.mean - a.mean) / pooled });
    }
  }
  return rows;
}
