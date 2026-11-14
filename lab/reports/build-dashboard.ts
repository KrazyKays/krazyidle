// Génère lab/reports/dashboard.html : tableau de bord autonome (aucune ressource réseau, SVG inline,
// thème clair/sombre) à partir des runs.jsonl des campagnes. Relançable à volonté.
//
//   node --import ./lab/sim/register.mjs lab/reports/build-dashboard.ts [--ref=<id>] [--cand=<id>]
// Par défaut : référence = candidat = C000 (état initial) ; C001, C401, C402, C404 utilisés s'ils existent.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ACTS, BUILDINGS, LEGACY } from '../../src/engine/data';
import { analyze } from '../metrics/analyze';
import { evaluate } from '../metrics/guardrails';
import { ROOT, byProfile, desc, loadMeta, loadRuns } from '../metrics/lib';

const arg = (n: string, d: string) => process.argv.find((x) => x.startsWith(`--${n}=`))?.slice(n.length + 3) ?? d;
const REF = arg('ref', 'C000-reference-sans-evenements');
const CAND = arg('cand', REF);
const has = (id: string) => existsSync(join(ROOT, 'lab', 'results', id, 'runs.jsonl'));

const esc = (s: unknown) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const f = (x: number, d = 2) => (!Number.isFinite(x) ? '—' : Math.abs(x) >= 1000 ? Math.round(x).toLocaleString('fr-FR') : x.toFixed(d).replace('.', ','));
const pc = (x: number, d = 0) => (Number.isFinite(x) ? (x * 100).toFixed(d).replace('.', ',') + ' %' : '—');

const A = analyze(CAND);
const metaC = loadMeta(CAND), metaR = loadMeta(REF);
const profiles = Object.keys(A.profiles);
const verdicts = evaluate(loadRuns(REF), loadRuns(CAND));

// ---------------------------------------------------------------- graphiques SVG
const W = 720;
/** Courbes : une ligne par série, axe Y unique. points[i] = [x, y]. */
function lineChart(id: string, series: { name: string; slot: number; pts: [number, number][] }[], xLabel: string, yLabel: string, xTicks: number[]) {
  const H = 260, m = { l: 44, r: 120, t: 12, b: 34 };
  const xs = series.flatMap((s) => s.pts.map((p) => p[0])), ys = series.flatMap((s) => s.pts.map((p) => p[1]));
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
  const X = (x: number) => m.l + ((x - x0) / (x1 - x0 || 1)) * (W - m.l - m.r);
  const Y = (y: number) => H - m.b - ((y - y0) / (y1 - y0 || 1)) * (H - m.t - m.b);
  const g: string[] = [];
  for (let y = y0; y <= y1; y++) g.push(`<line class="grid" x1="${m.l}" x2="${W - m.r}" y1="${Y(y)}" y2="${Y(y)}"/><text class="tick" x="${m.l - 6}" y="${Y(y) + 4}" text-anchor="end">${y}</text>`);
  for (const x of xTicks) g.push(`<text class="tick" x="${X(x)}" y="${H - m.b + 16}" text-anchor="middle">${x}</text>`);
  g.push(`<line class="axis" x1="${m.l}" x2="${W - m.r}" y1="${H - m.b}" y2="${H - m.b}"/>`);
  g.push(`<text class="axlab" x="${(m.l + W - m.r) / 2}" y="${H - 4}" text-anchor="middle">${esc(xLabel)}</text>`);
  g.push(`<text class="axlab" x="${m.l + 6}" y="${m.t + 10}">${esc(yLabel)}</text>`);
  // libellés directs en bout de ligne, écartés pour ne pas se chevaucher
  const ends = series.map((s) => ({ s, y: Y(s.pts[s.pts.length - 1][1]) })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 14) ends[i].y = ends[i - 1].y + 14;
  for (const s of series) {
    const d = s.pts.map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join('');
    g.push(`<path d="${d}" fill="none" stroke="var(--s${s.slot})" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`);
    const last = s.pts[s.pts.length - 1];
    g.push(`<circle cx="${X(last[0])}" cy="${Y(last[1])}" r="4" fill="var(--s${s.slot})" stroke="var(--surface)" stroke-width="2"/>`);
  }
  for (const e of ends) g.push(`<text class="dlab" x="${W - m.r + 10}" y="${e.y + 4}">${esc(e.s.name)}</text>`);
  const data = JSON.stringify({ x0, x1, l: m.l, r: W - m.r, xs: series[0].pts.map((p) => p[0]), series: series.map((s) => ({ name: s.name, slot: s.slot, y: s.pts.map((p) => p[1]) })) });
  return `<div class="chart" data-line='${esc(data)}'><svg id="${id}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(yLabel)} en fonction de ${esc(xLabel)}">${g.join('')}<line class="xhair" x1="0" x2="0" y1="${m.t}" y2="${H - m.b}" visibility="hidden"/><rect class="hit" x="${m.l}" y="${m.t}" width="${W - m.l - m.r}" height="${H - m.t - m.b}" fill="transparent"/></svg></div>`;
}

/** Barres horizontales classées avec intervalle p10–p90 (une seule série → une seule couleur). */
function rangeBars(rows: { name: string; mean: number; p10: number; p90: number; note?: string }[], unit: string) {
  const rowH = 30, m = { l: 130, r: 70, t: 6, b: 28 };
  const H = m.t + m.b + rows.length * rowH;
  const lo = Math.floor(Math.min(...rows.map((r) => r.p10))), hi = Math.ceil(Math.max(...rows.map((r) => r.p90)));
  const X = (x: number) => m.l + ((x - lo) / (hi - lo || 1)) * (W - m.l - m.r);
  const g: string[] = [];
  for (let x = lo; x <= hi; x++) g.push(`<line class="grid" x1="${X(x)}" x2="${X(x)}" y1="${m.t}" y2="${H - m.b}"/><text class="tick" x="${X(x)}" y="${H - m.b + 16}" text-anchor="middle">${x}</text>`);
  rows.forEach((r, i) => {
    const y = m.t + i * rowH + rowH / 2;
    g.push(`<g class="bar" tabindex="0" data-tip="${esc(`${r.name} · moy. ${f(r.mean)} · p10 ${f(r.p10)} · p90 ${f(r.p90)} ${unit}`)}">`);
    g.push(`<rect x="0" y="${y - rowH / 2}" width="${W}" height="${rowH}" fill="transparent"/>`);
    g.push(`<text class="cat" x="${m.l - 8}" y="${y + 4}" text-anchor="end">${esc(r.name)}</text>`);
    g.push(`<rect x="${X(lo)}" y="${y - 6}" width="${Math.max(2, X(r.mean) - X(lo))}" height="12" rx="4" fill="var(--s1)"/>`);
    g.push(`<line x1="${X(r.p10)}" x2="${X(r.p90)}" y1="${y}" y2="${y}" stroke="var(--ink)" stroke-width="1.5"/><line x1="${X(r.p10)}" x2="${X(r.p10)}" y1="${y - 5}" y2="${y + 5}" stroke="var(--ink)" stroke-width="1.5"/><line x1="${X(r.p90)}" x2="${X(r.p90)}" y1="${y - 5}" y2="${y + 5}" stroke="var(--ink)" stroke-width="1.5"/>`);
    g.push(`<text class="val" x="${W - m.r + 8}" y="${y + 4}">${f(r.mean)}</text></g>`);
  });
  g.push(`<text class="axlab" x="${(m.l + W - m.r) / 2}" y="${H - 2}" text-anchor="middle">${esc(unit)}</text>`);
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Classement par ${esc(unit)}">${g.join('')}</svg></div>`;
}

/** Carte de chaleur séquentielle (un seul bleu) : part des parties qui utilisent la mécanique. */
function heatmap(rowsNames: string[], cols: { key: string; label: string }[], val: (p: string, k: string) => number) {
  const cw = 44, ch = 26, m = { l: 120, t: 96 };
  const Wd = m.l + cols.length * cw + 4, H = m.t + rowsNames.length * ch + 4;
  const steps = ['--q0', '--q1', '--q2', '--q3', '--q4'];
  const g: string[] = [];
  cols.forEach((c, j) => g.push(`<text class="tick" transform="translate(${m.l + j * cw + cw / 2 + 4},${m.t - 6}) rotate(-55)">${esc(c.label)}</text>`));
  rowsNames.forEach((p, i) => {
    g.push(`<text class="cat" x="${m.l - 8}" y="${m.t + i * ch + ch / 2 + 4}" text-anchor="end">${esc(p)}</text>`);
    cols.forEach((c, j) => {
      const v = val(p, c.key);
      const s = v < 0.05 ? 0 : v < 0.25 ? 1 : v < 0.5 ? 2 : v < 0.9 ? 3 : 4;
      const x = m.l + j * cw, y = m.t + i * ch;
      g.push(`<g class="cell" tabindex="0" data-tip="${esc(`${p} · ${c.label} : ${pc(v)} des parties`)}"><rect x="${x + 1}" y="${y + 1}" width="${cw - 2}" height="${ch - 2}" rx="3" fill="var(${steps[s]})"${v < 0.05 ? ' class="under"' : ''}/><text x="${x + cw / 2}" y="${y + ch / 2 + 4}" text-anchor="middle" class="${s >= 3 ? 'onfill' : 'infill'}">${Math.round(v * 100)}</text></g>`);
    });
  });
  return `<div class="chart scroll"><svg viewBox="0 0 ${Wd} ${H}" style="min-width:${Wd}px" role="img" aria-label="Taux d'utilisation des mécaniques par profil">${g.join('')}</svg></div>`;
}

const table = (head: string[], rows: string[][], cls = '') => `<div class="tw"><table class="${cls}"><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;

// ---------------------------------------------------------------- contenu
const sections: string[] = [];
const nV = (l: string) => verdicts.filter((v) => v.level === l).length;
const totalAnom = profiles.reduce((a, p) => a + A.profiles[p].anomalies, 0);
sections.push(`<div class="tiles">
<div class="tile"><div class="tv">${metaC.runs}</div><div class="tl">parties dans ${esc(CAND)}</div></div>
<div class="tile"><div class="tv">${totalAnom}</div><div class="tl">anomalies (NaN, négatifs) — garde-fou : 0</div></div>
<div class="tile"><div class="tv">${nV('ROUGE')}</div><div class="tl"><span class="st crit">✕ ROUGE</span> garde-fous franchis</div></div>
<div class="tile"><div class="tv">${nV('DETTE')}</div><div class="tl"><span class="st warn">! DETTE</span> hors plage dès la référence</div></div>
<div class="tile"><div class="tv">${nV('VERT')}</div><div class="tl"><span class="st good">✓ VERT</span> garde-fous respectés</div></div>
</div>`);

// Progression
if (has('C402-horizon-12h')) {
  const H = byProfile(loadRuns('C402-horizon-12h'));
  const mk = (p: string, slot: number) => ({ name: p, slot, pts: Array.from({ length: 12 }, (_, i) => [i + 1, desc(H[p].map((r) => r.hourly[i]?.log10Value ?? NaN)).p50] as [number, number]) });
  sections.push(`<section><h2>Progression sur 12 h</h2><p class="sub">log10 de la valeur cumulée produite, médiane par heure — C402, 50 graines, dt 0,5 s. Profils « joueurs » ; le profil occasionnel n'a pas de courbe horaire (le runner saute les heures passées hors ligne).</p>
  ${lineChart('prog', [mk('optimiseur', 1), mk('experimente', 2), mk('debutant', 3)], 'heures de jeu', 'log10 valeur', [1, 2, 3, 4, 6, 8, 10, 12])}
  <div class="legend"><span><i style="--c:var(--s1)"></i>optimiseur</span><span><i style="--c:var(--s2)"></i>experimente</span><span><i style="--c:var(--s3)"></i>debutant</span></div>
  ${table(['profil', ...[1, 2, 3, 6, 9, 12].map((h) => `${h} h`)], ['optimiseur', 'experimente', 'debutant', 'mono-commercer', 'mono-cultiver', 'mono-chasser', 'mono-etudier', 'mono-mediter'].filter((p) => H[p]).map((p) => [esc(p), ...[1, 2, 3, 6, 9, 12].map((h) => f(desc(H[p].map((r) => r.hourly[h - 1]?.log10Value ?? NaN)).p50))]), 'num')}</section>`);
}

// Valeur par profil
sections.push(`<section><h2>Valeur produite en 6 h par profil</h2><p class="sub">log10 de la valeur cumulée — barre = moyenne, trait = p10 à p90 — ${esc(CAND)}, n = 200 par profil.</p>
${rangeBars(profiles.map((p) => ({ name: p, ...A.profiles[p].kpi.log10Value })).sort((a, b) => b.mean - a.mean), 'log10 valeur')}
${table(['profil', 'n', 'log10 valeur moy. ± é.-t.', 'IC95', 'gen', 'Héritage', 'part Échos', 'Harmonie moy.', 'combinaisons de traits'], profiles.map((p) => { const k = A.profiles[p].kpi; return [esc(p), String(k.log10Value.n), `${f(k.log10Value.mean, 3)} ± ${f(k.log10Value.sd, 3)}`, `± ${f(k.log10Value.ci95, 3)}`, f(k.gen.mean, 1), f(k.legacyTotal.mean, 0), pc(k.echoShare.mean, 1), f(k.harmonyAvg.mean, 3), f(k.traitCombos60.mean, 1)]; }), 'num')}</section>`);

// Garde-fous
const lv = (l: string) => (l === 'VERT' ? '<span class="st good">✓ VERT</span>' : l === 'ROUGE' ? '<span class="st crit">✕ ROUGE</span>' : l === 'DETTE' ? '<span class="st warn">! DETTE</span>' : l === 'ORANGE' ? '<span class="st ser">? ORANGE</span>' : '<span class="st na">– n/a</span>');
const order = { ROUGE: 0, ORANGE: 1, DETTE: 2, 'n/a': 3, VERT: 4 } as const;
sections.push(`<section><h2>Garde-fous</h2><p class="sub">Référence ${esc(REF)} (${esc(metaR.commit)}) → candidat ${esc(CAND)} (${esc(metaC.commit)}). Règles : <code>lab/metrics/guardrails.ts</code>, justifiées dans <code>lab/metrics/KPIS.md</code>. ROUGE = écart au-delà du seuil et |z| ≥ 3 → retour arrière.</p>
${table(['niveau', 'profil', 'KPI', 'règle', 'réf.', 'cand.', 'z', 'pourquoi'], [...verdicts].sort((a, b) => order[a.level] - order[b.level]).map((v) => [lv(v.level), esc(v.profile), `<code>${esc(v.kpi)}</code>`, esc(v.rule), f(v.ref ?? NaN, 3), f(v.cand, 3), v.z === undefined ? '—' : f(v.z, 1), esc(v.why)]))}</section>`);

// Usage des mécaniques
const cols = [
  ...ACTS.map((a) => ({ key: 'act.' + a, label: a })),
  ...BUILDINGS.map((b) => ({ key: 'bld.' + b.id, label: b.id })),
  ...LEGACY.map((l) => ({ key: 'upg.' + l.id, label: l.id })),
  { key: 'married', label: 'mariage' }, { key: 'epithet', label: 'surnom' }, { key: 'paused', label: 'pause' },
];
const runsC = byProfile(loadRuns(CAND));
const usage = (p: string, k: string) => {
  const o = A.profiles[p];
  if (k.startsWith('act.')) return o.heroActUsed[k.slice(4)];
  if (k.startsWith('bld.')) return o.buildings[k.slice(4)].used;
  if (k.startsWith('upg.')) return o.legacy[k.slice(4)].used;
  const rs = runsC[p];
  if (k === 'married') return rs.filter((r) => r.married > 0).length / rs.length;
  if (k === 'epithet') return rs.filter((r) => r.epithetLives > 0).length / rs.length;
  if (k === 'paused') return rs.filter((r) => r.pausedShare > 0.01).length / rs.length;
  return NaN;
};
sections.push(`<section><h2>Utilisation des mécaniques</h2><p class="sub">Part des parties (en %) où la mécanique est utilisée : activité ≥ 5 % du temps du héros, bâtiment ou amélioration de niveau ≥ 1, au moins un mariage, une vie surnommée, une pause > 1 %. Cases cerclées : &lt; 5 % (sous-utilisée).</p>
${heatmap(profiles, cols, usage)}
<div class="legend seq"><span><i style="--c:var(--q0)"></i>&lt; 5 %</span><span><i style="--c:var(--q1)"></i>5–25 %</span><span><i style="--c:var(--q2)"></i>25–50 %</span><span><i style="--c:var(--q3)"></i>50–90 %</span><span><i style="--c:var(--q4)"></i>≥ 90 %</span></div>
${table(['mécanique', ...profiles], cols.map((c) => [esc(c.label), ...profiles.map((p) => pc(usage(p, c.key)))]), 'num small')}</section>`);

// Sentinelles et déblocages
sections.push(`<section><h2>Déblocages (la sentinelle « jamais » séparée)</h2><p class="sub">summary.md fait la moyenne des −1 (« jamais ») avec les durées : la colonne « moy. summary » est fausse dès qu'un profil ne débloque pas.</p>
${table(['profil', 'Étudier : jamais', 'p50 réel (s)', 'p90 réel (s)', 'moy. summary', 'Méditer : jamais', 'p50 réel (s)', 'moy. summary'], profiles.map((p) => { const u = A.profiles[p].unlock; return [esc(p), pc(u.etudier.never), f(u.etudier.d.p50, 0), f(u.etudier.d.p90, 0), f(u.etudier.naiveMean, 1), pc(u.mediter.never), f(u.mediter.d.p50, 0), f(u.mediter.naiveMean, 1)]; }), 'num')}</section>`);

// Fin de partie
sections.push(`<section><h2>Fin de partie : Alliances, Chroniques, surnoms</h2>
${table(['profil', 'Alliances', 'achat p50 (min)', 'Chroniques', 'achat p50 (min)', 'surnoms distincts', 'vies surnommées (après achat)', 'mariages moy.'], profiles.map((p) => { const o = A.profiles[p]; return [esc(p), pc(o.upgradeAt.alliances.share), f(o.upgradeAt.alliances.d.p50 / 60, 0), pc(o.upgradeAt.chroniques.share), f(o.upgradeAt.chroniques.d.p50 / 60, 0), f(o.epithets.found.mean, 2), pc(o.epithets.livesShareWithChron.mean, 0), f(o.kpi.married.mean, 2)]; }), 'num')}
${extraEpithets()}</section>`);

function extraEpithets() {
  const id = 'C404-kpi-additionnels';
  const p = join(ROOT, 'lab', 'results', id, 'extra.jsonl');
  if (!existsSync(p)) return '';
  const ex = readFileSync(p, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const by: Record<string, any[]> = {};
  for (const e of ex) (by[e.profile] ??= []).push(e);
  const ids = new Set<string>();
  for (const e of ex) for (const k in e.epithetById) ids.add(k);
  const rows = Object.entries(by).map(([pr, es]) => {
    const tot: Record<string, number> = {}; let n = 0;
    for (const e of es) for (const [k, v] of Object.entries(e.epithetById as Record<string, number>)) { tot[k] = (tot[k] ?? 0) + v; n += v; }
    return [esc(pr), String(n), ...[...ids].map((k) => (n ? pc((tot[k] ?? 0) / n) : '—'))];
  });
  const rows2 = Object.entries(by).map(([pr, es]) => [esc(pr), f(desc(es.map((e) => e.echoShareOnline)).mean, 3), f(desc(es.map((e) => e.echoShareAll)).mean, 3), pc(desc(es.map((e) => e.offlineShareOfValue)).mean), f(desc(es.map((e) => e.harmonyMin)).mean, 3), f(desc(es.map((e) => e.harmonyMinAt / 60)).p50, 0), f(desc(es.map((e) => e.harmonyMinAfter30)).mean, 3), f(desc(es.map((e) => e.harmonyP05)).mean, 3)]);
  return `<h3>Surnoms attribués, par identifiant (C404, collecteur additionnel)</h3>${table(['profil', 'vies surnommées', ...[...ids]], rows, 'num small')}
  <h3>KPI corrigés (C404)</h3><p class="sub">Part des Échos mesurée aussi hors ligne ; Harmonie minimale hors première demi-heure et p05 pondéré dans le temps.</p>
  ${table(['profil', 'part Échos (runner)', 'part Échos (avec hors ligne)', 'valeur produite hors ligne', 'harmonyMin', 'instant du min. p50 (min)', 'min. après 30 min', 'Harmonie p05'], rows2, 'num')}`;
}

// Robustesse
const rob = join(ROOT, 'lab', 'reports', 'robustness.json');
if (existsSync(rob)) {
  const R = JSON.parse(readFileSync(rob, 'utf8'));
  if (R.dt) sections.push(`<section><h2>Effet du pas de temps (dt 0,1 s contre 0,5 s)</h2><p class="sub">C401 contre C000, graines 1–40 appariées, 6 h. Δ valeur en % de valeur produite ; z apparié (|z| ≥ 3 = écart net).</p>
  ${table(['profil', 'Δ valeur', 'z', 'Δ gen', 'Δ harmonyAvg', 'z', 'Δ harmonyMin', 'z', 'Δ traitCombos60'], Object.entries(R.dt).map(([p, d]: [string, any]) => [esc(p), pc(d.log10Value.rel, 1), f(d.log10Value.z, 1), pc(d.gen.rel, 1), f(d.harmonyAvg.d, 3), f(d.harmonyAvg.z, 1), f(d.harmonyMin.d, 3), f(d.harmonyMin.z, 1), pc(d.traitCombos60.rel, 1)]), 'num')}</section>`);
  if (R.conv) sections.push(`<section><h2>Combien de graines ?</h2><p class="sub">Graines nécessaires pour une moyenne de valeur à ± 2,5 % (IC95), et par groupe pour détecter un écart de 5 % (α 0,05, puissance 0,8, non apparié).</p>
  ${table(['profil', 'σ log10 valeur', 'graines pour ± 2,5 %', 'graines/groupe pour 5 %'], Object.entries(R.conv).map(([p, c]: [string, any]) => [esc(p), f(c.sd, 3), String(c.need), String(A.profiles[p]?.power.log10Value ?? '—')]), 'num')}</section>`);
}

sections.push(`<section><h2>Sources</h2><p class="sub">Toutes les valeurs sont <strong>[SIMULÉES]</strong> : profils automatiques (<code>lab/sim/profiles.ts</code>), pas de vrais joueurs. Commande : <code>${esc(metaC.command)}</code> · commit ${esc(metaC.commit)} · dt ${metaC.dt} s · ${metaC.hours} h · événements ${metaC.events ? 'oui' : 'non'}. Généré le ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC par <code>lab/reports/build-dashboard.ts</code>.</p></section>`);

// ---------------------------------------------------------------- page
const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tableau de bord d'équilibrage</title>
<style>
:root{color-scheme:light;--page:#f9f9f7;--surface:#fcfcfb;--ink:#0b0b0b;--ink2:#52514e;--muted:#898781;--grid:#e1e0d9;--axis:#c3c2b7;--ring:rgba(11,11,11,.10);
--s1:#2a78d6;--s2:#eb6834;--s3:#1baf7a;--q0:#f0efec;--q1:#cde2fb;--q2:#86b6ef;--q3:#2a78d6;--q4:#184f95;
--onq:#fff;--good:#0ca30c;--warn:#fab219;--ser:#ec835a;--crit:#d03b3b}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){color-scheme:dark;--page:#0d0d0d;--surface:#1a1a19;--ink:#f0efec;--ink2:#c3c2b7;--muted:#898781;--grid:#2c2c2a;--axis:#383835;--ring:rgba(255,255,255,.10);
--s1:#3987e5;--s2:#d95926;--s3:#199e70;--q0:#2c2c2a;--q1:#104281;--q2:#1c5cab;--q3:#6da7ec;--q4:#b7d3f6;--onq:#0b0b0b}}
:root[data-theme="dark"]{color-scheme:dark;--page:#0d0d0d;--surface:#1a1a19;--ink:#f0efec;--ink2:#c3c2b7;--muted:#898781;--grid:#2c2c2a;--axis:#383835;--ring:rgba(255,255,255,.10);
--s1:#3987e5;--s2:#d95926;--s3:#199e70;--q0:#2c2c2a;--q1:#104281;--q2:#1c5cab;--q3:#6da7ec;--q4:#b7d3f6;--onq:#0b0b0b}
*{box-sizing:border-box}
body{margin:0;background:var(--page);color:var(--ink);font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:1000px;margin:0 auto;padding:24px 16px 48px}
h1{font-size:22px;margin:0 0 4px}h2{font-size:17px;margin:0 0 4px}h3{font-size:14px;margin:18px 0 6px}
.sub{color:var(--ink2);margin:0 0 12px}
section,.tile{background:var(--surface);border:1px solid var(--ring);border-radius:10px}
section{padding:16px;margin:16px 0}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin:16px 0}
.tile{padding:12px 14px}.tv{font-size:28px;font-weight:600}.tl{color:var(--ink2);font-size:13px}
.chart{width:100%}.chart svg{width:100%;height:auto;display:block}.scroll{overflow-x:auto}
.grid{stroke:var(--grid);stroke-width:1}.axis{stroke:var(--axis);stroke-width:1}
.tick{fill:var(--muted);font-size:11px;font-variant-numeric:tabular-nums}.axlab{fill:var(--muted);font-size:11px}
.dlab,.cat{fill:var(--ink2);font-size:12px}.val{fill:var(--ink);font-size:12px;font-variant-numeric:tabular-nums}
.xhair{stroke:var(--muted);stroke-width:1}
.infill{fill:var(--ink);font-size:11px}.onfill{fill:var(--onq);font-size:11px}
rect.under{stroke:var(--crit);stroke-width:1.5}
.bar:hover>rect:first-child,.bar:focus>rect:first-child{fill:var(--grid)}
.cell:hover rect,.cell:focus rect{stroke:var(--ink);stroke-width:1.5}
.legend{display:flex;flex-wrap:wrap;gap:14px;color:var(--ink2);font-size:12px;margin:6px 0 10px}
.legend i{display:inline-block;width:16px;height:2px;background:var(--c);vertical-align:middle;margin-right:6px}
.legend.seq i{height:10px;width:14px;border-radius:2px;border:1px solid var(--ring)}
.tw{overflow-x:auto;margin-top:8px}
table{border-collapse:collapse;width:100%;font-size:12.5px}
th,td{text-align:left;padding:5px 8px;border-bottom:1px solid var(--grid);vertical-align:top}
th{color:var(--ink2);font-weight:600}
table.num td{font-variant-numeric:tabular-nums}td code{overflow-wrap:normal;white-space:nowrap}table.small{font-size:11.5px}
code{font-size:12px;background:var(--q0);padding:0 3px;border-radius:3px;overflow-wrap:anywhere}
.st{display:inline-block;font-size:11.5px;font-weight:600;white-space:nowrap;padding:0 6px;border-radius:4px;border-left:3px solid var(--c)}
.st.good{--c:var(--good)}.st.warn{--c:var(--warn)}.st.ser{--c:var(--ser)}.st.crit{--c:var(--crit)}.st.na{--c:var(--muted)}
#tip{position:fixed;pointer-events:none;background:var(--surface);color:var(--ink);border:1px solid var(--ring);border-radius:6px;padding:6px 9px;font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,.15);display:none;z-index:9;max-width:280px}
#tip b{font-variant-numeric:tabular-nums}#tip .k{display:inline-block;width:12px;height:2px;margin-right:6px;vertical-align:middle}
</style></head><body><main>
<h1>Tableau de bord d'équilibrage — Échos de Lignée</h1>
<p class="sub">Campagne ${esc(CAND)} · commit ${esc(metaC.commit)} · ${metaC.runs} parties · ${metaC.hours} h · dt ${metaC.dt} s · graines ${esc(metaC.seeds)} · données <strong>[SIMULÉES]</strong>.</p>
${sections.join('\n')}
</main><div id="tip" role="tooltip"></div>
<script>
(function(){
  var tip=document.getElementById('tip');
  function show(e,build){tip.textContent='';build(tip);tip.style.display='block';var x=(e.clientX||0)+14,y=(e.clientY||0)+14;if(x+tip.offsetWidth>innerWidth-8)x=innerWidth-tip.offsetWidth-8;tip.style.left=x+'px';tip.style.top=y+'px';}
  function hide(){tip.style.display='none';}
  document.querySelectorAll('[data-tip]').forEach(function(el){
    var f=function(e){if(e.type==='focus'){var r=el.getBoundingClientRect();e={clientX:r.right,clientY:r.top};}show(e,function(t){t.textContent=el.getAttribute('data-tip');});};
    el.addEventListener('pointermove',f);el.addEventListener('focus',f);el.addEventListener('pointerleave',hide);el.addEventListener('blur',hide);
  });
  document.querySelectorAll('[data-line]').forEach(function(box){
    var d=JSON.parse(box.getAttribute('data-line'));var svg=box.querySelector('svg');var xh=svg.querySelector('.xhair');var hit=svg.querySelector('.hit');
    hit.addEventListener('pointermove',function(e){
      var pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;var p=pt.matrixTransform(svg.getScreenCTM().inverse());
      var xv=d.x0+(p.x-d.l)/(d.r-d.l)*(d.x1-d.x0);var i=0,best=1e9;d.xs.forEach(function(x,j){if(Math.abs(x-xv)<best){best=Math.abs(x-xv);i=j;}});
      var X=d.l+(d.xs[i]-d.x0)/(d.x1-d.x0)*(d.r-d.l);xh.setAttribute('x1',X);xh.setAttribute('x2',X);xh.setAttribute('visibility','visible');
      show(e,function(t){var h=document.createElement('div');h.textContent=d.xs[i]+' h';t.appendChild(h);
        d.series.map(function(s){return s;}).sort(function(a,b){return b.y[i]-a.y[i];}).forEach(function(s){var r=document.createElement('div');var k=document.createElement('span');k.className='k';k.style.background='var(--s'+s.slot+')';var b=document.createElement('b');b.textContent=s.y[i].toFixed(2).replace('.',',');r.appendChild(k);r.appendChild(b);r.appendChild(document.createTextNode(' '+s.name));t.appendChild(r);});});
    });
    hit.addEventListener('pointerleave',function(){xh.setAttribute('visibility','hidden');hide();});
  });
})();
</script></body></html>
`;
writeFileSync(join(ROOT, 'lab', 'reports', 'dashboard.html'), html);
console.log(`→ lab/reports/dashboard.html (${(html.length / 1024).toFixed(0)} Ko) · référence ${REF} · candidat ${CAND}`);
