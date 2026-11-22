// Garde-fous d'équilibrage (voir lab/metrics/KPIS.md) : décide si une campagne candidate est acceptable
// face à une référence. Complète `npm run sim:compare` (qui ne fait qu'afficher des écarts).
//
//   node --import ./lab/sim/register.mjs lab/metrics/guardrails.ts <id-référence> <id-candidat> [--force] [--json]
//   (les deux campagnes doivent avoir leur runs.jsonl dans lab/results/<id>/)
//
// Code de sortie : 0 = OK, 1 = au moins un garde-fou ROUGE (retour arrière recommandé), 2 = campagnes incomparables.
// Règle d'un garde-fou relatif : ROUGE si l'écart dépasse le seuil ET est statistiquement net (|z| ≥ 3, test de Welch
// ou apparié si mêmes graines). ORANGE si l'écart dépasse le seuil sans être net (mesure à refaire avec plus de graines).
import type { RunResult } from '../sim/runner';
import { byProfile, desc, loadMeta, loadRuns, pairedZ, welchZ } from './lib';

/** KPI dérivés d'une partie. */
export function kpis(r: RunResult): Record<string, number> {
  const T = r.hours * 3600;
  const chron = r.upgradeAt.chroniques;
  return {
    anomalies: r.anomalies.length,
    log10Value: r.log10Value,
    gen: r.gen,
    legacyTotal: r.legacyTotal,
    echoShare: r.echoShare,
    harmonyAvg: r.harmonyAvg,
    traitCombos60: r.traitCombos60,
    'unlock.commercer': r.unlockAt.commercer,
    'unlock.etudier': r.unlockAt.etudier,
    'unlock.mediter': r.unlockAt.mediter,
    'never.etudier': r.unlockAt.etudier < 0 ? 1 : 0,
    'upgradeAt.alliances': r.upgradeAt.alliances ?? NaN,
    'upgradeAt.chroniques': chron ?? NaN,
    'has.chroniques': chron !== undefined ? 1 : 0,
    epithetsFound: r.epithetsFound,
    epithetLivesShare: chron !== undefined && T - chron > 600 ? r.epithetLives / Math.max(1, r.lives * (1 - chron / T)) : NaN,
    eventsDone: r.eventsDone,
  };
}

type Kind = 'range' | 'delta';
interface Rule {
  kpi: string; kind: Kind; profiles: string[];
  /** plage absolue sur la moyenne (range) */
  min?: number; max?: number;
  /** stat de la plage : moyenne (défaut), p90 ou part de parties */
  stat?: 'mean' | 'p90' | 'p10';
  /** écart maximal toléré (delta) : relatif (rel) ou absolu (abs), dans le sens défavorable */
  rel?: number; abs?: number; dir?: 'down' | 'up' | 'both';
  why: string;
}

const CORE = ['experimente', 'optimiseur'];
// 0.4 : plus de mono-chasser (Chasser fusionné dans Récolter, profil mono-cultiver).
const CONT = ['experimente', 'optimiseur', 'debutant', 'mono-cultiver', 'mono-commercer', 'mono-etudier', 'mono-mediter'];
const ALL = [...CONT, 'occasionnel'];

export const RULES: Rule[] = [
  { kpi: 'anomalies', kind: 'range', profiles: ALL, max: 0, stat: 'p90', why: 'Robustesse : 0 NaN/Infinity/négatif (max sur toutes les parties).' },
  // Puissance économique
  { kpi: 'log10Value', kind: 'delta', profiles: [...CORE, 'occasionnel', 'debutant'], abs: Math.log10(1.10), dir: 'down', why: 'Perte de plus de 10 % de valeur produite.' },
  { kpi: 'log10Value', kind: 'delta', profiles: [...CORE, 'occasionnel', 'debutant'], abs: Math.log10(2), dir: 'up', why: 'Inflation : valeur ×2 en 6 h (les coûts ×1,9–2,4 ne suivent plus).' },
  { kpi: 'gen', kind: 'delta', profiles: ALL, rel: 0.05, dir: 'both', why: 'Tempo dynastique : ±5 % de générations.' },
  { kpi: 'legacyTotal', kind: 'delta', profiles: ALL, rel: 0.15, dir: 'both', why: 'Boucle longue : ±15 % d\'Héritage.' },
  // Piliers
  { kpi: 'echoShare', kind: 'range', profiles: CONT, min: 0.6, max: 0.97, why: 'Pilier 1 : les Échos portent la production sans rendre le héros inutile (profils en continu uniquement).' },
  { kpi: 'echoShare', kind: 'delta', profiles: CONT, abs: 0.03, dir: 'both', why: 'Part des Échos : ±3 points.' },
  { kpi: 'harmonyAvg', kind: 'range', profiles: ['experimente'], min: 0.9, why: 'Le joueur de référence garde le Domaine sain.' },
  { kpi: 'harmonyAvg', kind: 'range', profiles: ['optimiseur', 'mono-cultiver'], min: 0.8, why: 'Une stratégie gourmande dégrade le Domaine sans l\'effondrer (×0,7 = plancher).' },
  { kpi: 'harmonyAvg', kind: 'delta', profiles: ALL, abs: 0.03, dir: 'down', why: 'Harmonie : −3 points.' },
  { kpi: 'traitCombos60', kind: 'range', profiles: ['experimente', 'debutant'], min: 20, why: 'Budget génétique (GDD 2.3 : 27–30 à 8 h) : pas de retour à 2–5 combinaisons.' },
  { kpi: 'traitCombos60', kind: 'delta', profiles: ['experimente', 'optimiseur'], rel: 0.2, dir: 'down', why: 'Diversité génétique : −20 %.' },
  // Onboarding
  { kpi: 'unlock.commercer', kind: 'range', profiles: ['experimente', 'debutant'], max: 60, stat: 'p90', why: 'Commercer en moins d\'1 min (p90).' },
  { kpi: 'unlock.etudier', kind: 'range', profiles: ['experimente'], max: 180, stat: 'p90', why: 'Étudier en moins de 3 min (p90) pour le joueur de référence.' },
  { kpi: 'unlock.mediter', kind: 'range', profiles: ['experimente'], max: 300, stat: 'p90', why: 'Méditer en moins de 5 min (p90).' },
  { kpi: 'unlock.etudier', kind: 'range', profiles: ['debutant'], max: 1800, stat: 'p90', why: 'Même un débutant voit Étudier dans la 1re demi-heure.' },
  // Fin de partie
  { kpi: 'upgradeAt.alliances', kind: 'range', profiles: ['experimente'], min: 3600, max: 5 * 3600, stat: 'mean', why: 'Alliances (90 ⚜️) atteintes entre 1 h et 5 h.' },
  { kpi: 'has.chroniques', kind: 'range', profiles: ['experimente', 'optimiseur'], min: 0.9, why: 'Chroniques (160 ⚜️) achetées dans 90 % des parties de 6 h d\'un joueur compétent.' },
  { kpi: 'epithetLivesShare', kind: 'range', profiles: CONT, min: 0.3, max: 0.7, why: 'GDD 2.6 : ~50 % des vies surnommées après l\'achat de Chroniques.' },
  { kpi: 'epithetsFound', kind: 'range', profiles: ['optimiseur', 'mono-cultiver', 'mono-commercer'], min: 3, why: 'Au moins 3 surnoms distincts en 6 h quand Chroniques est acquis (34 au catalogue en 0.4).' },
];

/** Garde-fous inter-profils (sur une seule campagne). */
export const CROSS = [
  { id: 'mono.ratio', why: 'Aucune vocation à plus de ×10 de valeur de la meilleure (critère du protocole).', max: 10 },
];

function rangeValue(rule: Rule, rs: RunResult[]) {
  const x = rs.map((r) => kpis(r)[rule.kpi]);
  if (rule.kpi === 'anomalies') return Math.max(...x);
  if (rule.stat === 'p90') return desc(x.map((v) => (rule.kpi.startsWith('unlock.') && v < 0 ? 1e12 : v))).p90; // jamais = +∞
  if (rule.stat === 'p10') return desc(x).p10;
  return desc(x.filter(Number.isFinite)).mean;
}
const inRange = (rule: Rule, v: number) => (rule.min === undefined || v >= rule.min) && (rule.max === undefined || v <= rule.max);

/** DETTE = garde-fou déjà hors plage dans la référence (dette connue) : ne bloque pas, mais ne doit pas empirer. */
export interface Verdict { level: 'VERT' | 'ORANGE' | 'ROUGE' | 'DETTE' | 'n/a'; profile: string; kpi: string; rule: string; ref?: number; cand: number; z?: number; why: string }

export function evaluate(refRuns: RunResult[] | null, candRuns: RunResult[]): Verdict[] {
  const C = byProfile(candRuns), R = refRuns ? byProfile(refRuns) : {};
  const out: Verdict[] = [];
  for (const rule of RULES) for (const p of rule.profiles) {
    const cr = C[p]; if (!cr) continue;
    const cx = cr.map((r) => kpis(r)[rule.kpi]);
    if (rule.kind === 'range') {
      const v = rangeValue(rule, cr);
      const rv = R[p] ? rangeValue(rule, R[p]) : undefined;
      const ok = inRange(rule, v);
      const debt = !ok && rv !== undefined && Number.isFinite(rv) && !inRange(rule, rv);
      const level = !Number.isFinite(v) ? 'n/a' : ok ? 'VERT' : debt ? 'DETTE' : 'ROUGE';
      out.push({ level, profile: p, kpi: rule.kpi, rule: `${rule.stat ?? 'moy.'} ∈ [${rule.min ?? '−∞'} ; ${rule.max ?? '+∞'}]`, ref: rv, cand: v, why: rule.why });
    } else {
      const rr = R[p]; if (!rr) continue;
      const rx = rr.map((r) => kpis(r)[rule.kpi]);
      const a = desc(rx), b = desc(cx);
      const delta = b.mean - a.mean;
      const lim = rule.rel !== undefined ? rule.rel * Math.abs(a.mean) : rule.abs!;
      const bad = (rule.dir === 'down' && delta < -lim) || (rule.dir === 'up' && delta > lim) || (rule.dir === 'both' && Math.abs(delta) > lim);
      const sameSeeds = rr.length === cr.length && rr.every((r, i) => r.seed === cr[i].seed);
      const z = sameSeeds ? pairedZ(rx, cx) : welchZ(rx, cx);
      out.push({ level: !bad ? 'VERT' : Math.abs(z) >= 3 ? 'ROUGE' : 'ORANGE', profile: p, kpi: rule.kpi, rule: `Δ ${rule.dir} ≤ ${rule.rel !== undefined ? (rule.rel * 100) + ' %' : rule.abs!.toPrecision(3)}`, ref: a.mean, cand: b.mean, z, why: rule.why });
    }
  }
  // Inter-profils
  const mono = Object.keys(C).filter((p) => p.startsWith('mono-'));
  if (mono.length >= 2) {
    const m = Object.fromEntries(mono.map((p) => [p, desc(C[p].map((r) => r.log10Value)).mean]));
    const vals = Object.values(m);
    const ratio = 10 ** (Math.max(...vals) - Math.min(...vals));
    out.push({ level: ratio <= 10 ? 'VERT' : 'DETTE', profile: mono.join('/'), kpi: 'mono.ratio', rule: '≤ ×10', cand: ratio, why: CROSS[0].why + ' (inter-profils : signalé, non bloquant)' });
  }
  return out;
}

if (process.argv[1]?.endsWith('guardrails.ts')) {
  const [refId, candId] = process.argv.slice(2).filter((x) => !x.startsWith('--'));
  if (!candId) { console.error('usage : guardrails.ts <id-référence> <id-candidat> [--force] [--json]'); process.exit(2); }
  const mr = loadMeta(refId), mc = loadMeta(candId);
  const mismatch = (['hours', 'dt', 'events'] as const).filter((k) => mr[k] !== mc[k]);
  if (mismatch.length && !process.argv.includes('--force')) {
    console.error(`Campagnes incomparables (${mismatch.map((k) => `${k} : ${mr[k]} ≠ ${mc[k]}`).join(', ')}). --force pour passer outre.`);
    process.exit(2);
  }
  const v = evaluate(loadRuns(refId), loadRuns(candId));
  if (process.argv.includes('--json')) console.log(JSON.stringify(v, null, 1));
  else {
    console.log(`Garde-fous : référence ${refId} (${mr.commit}, graines ${mr.seeds}) → candidat ${candId} (${mc.commit}, graines ${mc.seeds})\n`);
    console.log('| niveau | profil | KPI | règle | réf. | cand. | z | pourquoi |\n|---|---|---|---|---|---|---|---|');
    const f = (x?: number) => (x === undefined || !Number.isFinite(x) ? '—' : Math.abs(x) >= 100 ? x.toFixed(0) : x.toPrecision(4));
    for (const x of v) console.log(`| ${x.level} | ${x.profile} | ${x.kpi} | ${x.rule} | ${f(x.ref)} | ${f(x.cand)} | ${x.z === undefined ? '—' : x.z.toFixed(1)} | ${x.why} |`);
    const n = (l: string) => v.filter((x) => x.level === l).length;
    console.log(`\nVERT ${n('VERT')} · ORANGE ${n('ORANGE')} · ROUGE ${n('ROUGE')} · DETTE ${n('DETTE')} · n/a ${n('n/a')}`);
  }
  process.exit(v.some((x) => x.level === 'ROUGE') ? 1 : 0);
}
