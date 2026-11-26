// Compagnonnage (double vocation) — phase 0 : état des lieux AVANT tout chiffrage (aucune modification du jeu).
//   node --import ./lab/balance/register.mjs lab/balance/compagnonnage/etat-des-lieux.ts \
//     --tag=C0 [--profiles=experimente,optimiseur,debutant,occasionnel] [--seeds=1-40] [--hours=6] [--dt=0.5] [--from=2]
// Mesures :
//  A. passif : part des vies qui remplissent DÉJÀ 50 % + 30 % sans le viser (par profil, par paire) ;
//     débit de valeur d'une vie (valeur / s, hors événements) ; Héritage cumulé par heure (prix).
//  B. coût : profil de base qui VISE une paire (A à 50 %, puis B à 30 %, puis le reste à sa guise) à partir
//     de l'heure --from, SANS récompense : écart de valeur et d'Héritage à 6 h = ce que la récompense doit compenser.
import { mkdirSync, writeFileSync } from 'node:fs';
import { ACTS, type ActId } from '../../../src/engine/data';
import type { GameState, LifeState } from '../../../src/engine/state';
import { PROFILES, arg, parseSeeds, runBal, stats, type BalResult } from '../lib';
import type { Profile } from '../../sim/profiles';

const tag = arg('tag', 'C0')!;
const profiles = arg('profiles', 'experimente,optimiseur,debutant,occasionnel')!.split(',');
const costBases = arg('cost-bases', 'experimente,optimiseur')!.split(',').filter(Boolean);
const seeds = parseSeeds(arg('seeds', '1-40')!);
const hours = Number(arg('hours', '6'));
const dt = Number(arg('dt', '0.5'));
const from = Number(arg('from', '2')) * 3600;
const V = 0.5, S = 0.3;
const PAIRS: [ActId, ActId][] = [];
for (let i = 0; i < ACTS.length; i++) for (let j = i + 1; j < ACTS.length; j++) PAIRS.push([ACTS[i], ACTS[j]]);
const key = (a: ActId, b: ActId) => [a, b].sort((x, y) => ACTS.indexOf(x) - ACTS.indexOf(y)).join('+');

interface LifeRow { gen: number; t0: number; dur: number; value: number; base: number; top: [ActId, number][]; pair: string | null; }

/** Enveloppe un profil pour garder une référence à chaque vie (l'objet garde son état final après la mort). */
function tracked(p: Profile, lives: Map<LifeState, { gen: number; t0: number }>, target?: [ActId, ActId]): Profile {
  return {
    ...p,
    activity(s: GameState, c) {
      const L = s.life!;
      if (!lives.has(L)) lives.set(L, { gen: s.hero.gen, t0: c.t });
      if (target && c.t >= from && s.unlocked.includes(target[0]) && s.unlocked.includes(target[1])) {
        const [a, b] = target;
        if (L.timeIn[a] < V * L.dur + 0.5) return a;
        if (L.timeIn[b] < S * L.dur + 0.5) return b;
      }
      return p.activity(s, c);
    },
  };
}

function rows(lives: Map<LifeState, { gen: number; t0: number }>): LifeRow[] {
  const out: LifeRow[] = [];
  for (const [L, m] of lives) {
    if (L.t < L.dur - 1e-6) continue; // vie inachevée en fin de run
    const top = ACTS.map((a) => [a, L.timeIn[a] / L.dur] as [ActId, number]).sort((x, y) => y[1] - x[1]);
    const ok = top[0][1] >= V - 1e-6 && top[1][1] >= S - 1e-6;
    out.push({ gen: m.gen, t0: m.t0, dur: L.dur, value: L.value, base: L.baseValue ?? L.value, top, pair: ok ? key(top[0][0], top[1][0]) : null });
  }
  return out;
}

const m = (xs: number[], d = 3) => Number(stats(xs).mean.toFixed(d));
const p50 = (xs: number[], d = 3) => Number(stats(xs).p50.toFixed(d));
const out: Record<string, any> = { tag, seeds: arg('seeds', '1-40'), hours, dt, from: from / 3600, passive: {}, cost: {} };
const md: string[] = [`# ${tag} — état des lieux du Compagnonnage (dt ${dt}, ${seeds.length} graines, ${hours} h)`, ''];

// A. passif
md.push('## A. Vies qui remplissent déjà 50 % + 30 % sans le viser', '', '| profil | vies/run | part 50+30 (toutes) | part 50+30 (après h' + from / 3600 + ') | 2e activité p50 | paires (après h' + from / 3600 + ') | débit vie p50 (val/s, hors év.) | ⚜️ cumulé h1…h6 (p50) |', '|---|---|---|---|---|---|---|---|');
const baseRuns: Record<string, BalResult[]> = {};
for (const p of profiles) {
  const all: LifeRow[] = [];
  const leg: number[][] = [];
  baseRuns[p] = [];
  for (const seed of seeds) {
    const lives = new Map();
    const legH: number[] = [];
    const r = runBal({ profile: tracked(PROFILES[p], lives), seed, hours, dt, onHour: (s) => legH.push(s.legacyTotal) });
    baseRuns[p].push(r);
    leg.push(legH);
    all.push(...rows(lives));
  }
  const late = all.filter((x) => x.t0 >= from);
  const pairs: Record<string, number> = {};
  for (const x of late) if (x.pair) pairs[x.pair] = (pairs[x.pair] ?? 0) + 1;
  const rate = late.map((x) => x.base / x.dur);
  const legP50 = Array.from({ length: hours }, (_, h) => p50(leg.map((l) => l[h] ?? NaN), 0));
  out.passive[p] = {
    livesPerRun: all.length / seeds.length, share: m(all.map((x) => (x.pair ? 1 : 0))), shareLate: m(late.map((x) => (x.pair ? 1 : 0))),
    second: p50(late.map((x) => x.top[1][1]), 2), pairs, rateP50: p50(rate, 2), rateP10: Number(stats(rate).p10.toFixed(2)), rateP90: Number(stats(rate).p90.toFixed(2)),
    legacyP50: legP50, chroniquesH: p50(baseRuns[p].map((r) => r.upgrades.chroniques ? 1 : 0)),
  };
  const x = out.passive[p];
  md.push(`| ${p} | ${x.livesPerRun.toFixed(1)} | ${x.share} | ${x.shareLate} | ${x.second} | ${Object.entries(pairs).map(([k, v]) => `${k} ${v}`).join(', ') || '—'} | ${x.rateP50} (p10 ${x.rateP10} · p90 ${x.rateP90}) | ${legP50.join(' / ')} |`);
}

// B. coût de la visée, sans récompense
md.push('', `## B. Coût de la visée (dès h${from / 3600}, sans récompense) — écart à 6 h vs le même profil sans visée, mêmes graines`, '', '| base | vocation → 2e | vies visées réussies | Δ log10 valeur brute | Δ ⚜️ (%) | Δ gén. | valeur/vie visée ÷ valeur/vie de base (même période) |', '|---|---|---|---|---|---|---|');
for (const p of costBases) {
  const b = baseRuns[p] ?? seeds.map((seed) => runBal({ profile: p, seed, hours, dt }));
  out.cost[p] = {};
  const baseLate: number[] = [];
  for (const seed of seeds) {
    const lives = new Map();
    runBal({ profile: tracked(PROFILES[p], lives), seed, hours, dt });
    for (const x of rows(lives)) if (x.t0 >= from) baseLate.push(x.base);
  }
  for (const [a0, b0] of PAIRS) for (const [a, bb] of [[a0, b0], [b0, a0]] as [ActId, ActId][]) {
    const res: BalResult[] = [];
    const late: LifeRow[] = [];
    for (const seed of seeds) {
      const lives = new Map();
      res.push(runBal({ profile: tracked(PROFILES[p], lives, [a, bb]), seed, hours, dt }));
      late.push(...rows(lives).filter((x) => x.t0 >= from));
    }
    const ok = late.filter((x) => x.pair === key(a, bb));
    const dlog = m(res.map((r, i) => r.grossLog10 - b[i].grossLog10));
    const dleg = m(res.map((r, i) => (r.legacyTotal / Math.max(1, b[i].legacyTotal) - 1) * 100), 1);
    const dgen = m(res.map((r, i) => r.gen - b[i].gen), 1);
    const ratio = Number((stats(late.map((x) => x.base)).p50 / stats(baseLate).p50).toFixed(2));
    out.cost[p][`${a}>${bb}`] = { okShare: m(late.map((x) => (x.pair === key(a, bb) ? 1 : 0))), lives: late.length / seeds.length, dlog, dleg, dgen, ratio, okN: ok.length };
    md.push(`| ${p} | ${a} → ${bb} | ${(out.cost[p][`${a}>${bb}`].okShare * 100).toFixed(0)} % (${(late.length / seeds.length).toFixed(1)} vies/run) | ${dlog} | ${dleg} | ${dgen} | ${ratio} |`);
  }
}

mkdirSync('lab/balance/compagnonnage/results', { recursive: true });
writeFileSync(`lab/balance/compagnonnage/results/${tag}.json`, JSON.stringify(out, null, 1));
writeFileSync(`lab/balance/compagnonnage/results/${tag}.md`, md.join('\n') + '\n');
console.log(md.join('\n'));
