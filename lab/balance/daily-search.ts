// Destin du jour : recherche du score maximal par plusieurs méthodes, sur N dates.
//   node --import ./lab/balance/register.mjs lab/balance/daily-search.ts --from=2026-11-01 --days=14 [--shard=0/2] [--evals=6000]
// Chaque plan = une activité par seconde (90 gènes). Le meilleur plan est rejoué par replay() (code vérifiable).
import { ACTS, type ActId } from '../../src/engine/data';
import { DAILY_DT, DAILY_DUR, DAILY_TIERS, DailyRun, dailySetup, encodeRun, replay, verifyCode } from '../../src/engine/daily';
import { Rng } from '../../src/engine/rng';
import { arg } from './lib';

const from = arg('from', '2026-11-01')!;
const days = Number(arg('days', '14'));
const [K, N] = (arg('shard', '0/1') as string).split('/').map(Number);
const EVALS = Number(arg('evals', '6000'));
const SEG = Math.round(1 / DAILY_DT); // ticks par gène (1 s)
const G = DAILY_DUR; // 90 gènes

function run(date: string, plan: number[] | ((r: DailyRun, sec: number) => number)) {
  const r = new DailyRun(dailySetup(date));
  let sec = 0;
  const used: number[] = [];
  while (!r.done) {
    if (r.tickN % SEG === 0) {
      const a = typeof plan === 'function' ? plan(r, sec) : plan[sec];
      r.setAct(a >= 0 ? ACTS[a] : null);
      used.push(a);
      sec++;
    }
    r.step();
  }
  return { score: r.score(), actions: r.actions, plan: used };
}
const score = (date: string, plan: number[]) => run(date, plan).score;

const I = (a: ActId) => ACTS.indexOf(a);
// Faisabilité : Commercer sans Vivres / Étudier sans Or ne produit rien → bascule.
const feas = (r: DailyRun, a: number) => {
  if (a === I('commercer') && r.res.vivres < 0.5) return I('cultiver');
  if (a === I('etudier') && r.res.or < 0.5) return r.res.vivres >= 0.5 ? I('commercer') : I('cultiver');
  return a;
};

interface Res { name: string; score: number; plan?: number[] }
const R = (name: string, x: { score: number; plan: number[] }): Res => ({ name, score: x.score, plan: x.plan });

function heuristics(date: string): Res[] {
  const out: Res[] = [];
  for (const a of ACTS) out.push(R(`constant:${a}`, run(date, (r) => feas(r, I(a)))));
  // Cultiver puis Commercer (bascule à t), puis Étudier sur la fin
  let best: Res = { name: '', score: -1 };
  for (let t1 = 10; t1 <= 80; t1 += 5) {
    const x = run(date, (r, sec) => feas(r, sec < t1 ? I('cultiver') : I('commercer')));
    if (x.score > best.score) best = R(`cultiver→commercer@${t1}s`, x);
  }
  out.push(best);
  best = { name: '', score: -1 } as Res;
  for (let t1 = 10; t1 <= 70; t1 += 5) for (let t2 = t1 + 5; t2 <= 85; t2 += 5) {
    const x = run(date, (r, sec) => feas(r, sec < t1 ? I('cultiver') : sec < t2 ? I('commercer') : I('etudier')));
    if (x.score > best.score) best = R(`cultiver→commercer@${t1}→étudier@${t2}`, x);
  }
  out.push(best);
  best = { name: '', score: -1 } as Res;
  for (let t1 = 10; t1 <= 80; t1 += 5) {
    const x = run(date, (r, sec) => feas(r, sec < t1 ? I('chasser') : I('commercer')));
    if (x.score > best.score) best = R(`chasser→commercer@${t1}s`, x);
  }
  out.push(best);
  return out;
}

function randPlan(rng: Rng): number[] {
  const k = 1 + rng.int(5);
  const cuts = [0, ...Array.from({ length: k - 1 }, () => rng.int(G)).sort((a, b) => a - b), G];
  const p: number[] = [];
  for (let i = 0; i < k; i++) { const a = rng.int(5); for (let j = cuts[i]; j < cuts[i + 1]; j++) p.push(a); }
  return p;
}
function mutate(p: number[], rng: Rng): number[] {
  const q = p.slice();
  const n = 1 + rng.int(3);
  for (let k = 0; k < n; k++) {
    const i = rng.int(G), len = 1 + rng.int(rng.chance(0.5) ? 4 : 25), a = rng.int(5);
    for (let j = i; j < Math.min(G, i + len); j++) q[j] = a;
  }
  return q;
}

function search(date: string, seed: number, seedsPlans: number[][]): { random: Res; evo: Res; climb: Res } {
  const rng = new Rng(seed);
  const budgetR = Math.floor(EVALS / 3);
  let bestR: Res = { name: 'aléatoire', score: -1 };
  for (let i = 0; i < budgetR; i++) { const p = randPlan(rng); const s = score(date, p); if (s > bestR.score) bestR = { name: 'aléatoire', score: s, plan: p }; }
  // Évolutionnaire (µ+λ) : population 40, élitisme
  let pop = Array.from({ length: 40 }, (_, i) => { const p = i < seedsPlans.length ? seedsPlans[i].slice() : randPlan(rng); return { p, s: score(date, p) }; });
  let evals = 40;
  while (evals < budgetR) {
    pop.sort((a, b) => b.s - a.s);
    const parents = pop.slice(0, 10);
    const kids = [];
    for (let i = 0; i < 30; i++) {
      const a = parents[rng.int(10)].p, b = parents[rng.int(10)].p;
      const cut = rng.int(G);
      const child = mutate(rng.chance(0.5) ? [...a.slice(0, cut), ...b.slice(cut)] : a, rng);
      kids.push({ p: child, s: score(date, child) });
      evals++;
    }
    pop = [...parents, ...kids];
  }
  pop.sort((a, b) => b.s - a.s);
  const evo: Res = { name: 'évolutionnaire', score: pop[0].s, plan: pop[0].p };
  // Escalade (hill-climbing) à partir du meilleur trouvé
  let cur = (evo.score >= bestR.score ? evo : bestR).plan!.slice(), cs = Math.max(evo.score, bestR.score);
  for (let i = 0; i < budgetR; i++) { const q = mutate(cur, rng); const s = score(date, q); if (s >= cs) { cur = q; cs = s; } }
  return { random: bestR, evo, climb: { name: 'escalade', score: cs, plan: cur } };
}

const compress = (p: number[]) => {
  const out: string[] = [];
  let i = 0;
  while (i < p.length) { let j = i; while (j < p.length && p[j] === p[i]) j++; out.push(`${ACTS[p[i]].slice(0, 4)}×${j - i}`); i = j; }
  return out.join(' ');
};

const d0 = new Date(from + 'T00:00:00Z').getTime();
const rows: any[] = [];
for (let d = 0; d < days; d++) {
  if (d % N !== K) continue;
  const date = new Date(d0 + d * 86400_000).toISOString().slice(0, 10);
  const st = dailySetup(date);
  const h = heuristics(date);
  const sr = search(date, 1000 + d, h.filter((x) => x.plan).map((x) => x.plan!));
  const best = [sr.random, sr.evo, sr.climb].reduce((a, b) => (b.score > a.score ? b : a));
  const rp = run(date, best.plan!);
  const code = encodeRun(date, rp.actions, rp.score);
  const v = verifyCode(code);
  rows.push({
    date, traits: st.traits, mods: st.mods.map((m) => m.id), startVivres: st.startRes.vivres,
    heuristics: h.map(({ name, score }) => ({ name, score })), random: sr.random.score, evo: sr.evo.score, climb: sr.climb.score, best: best.score,
    bestPlan: compress(best.plan!), replayOk: v?.ok === true && replay(date, rp.actions) === rp.score, code,
    tiers: DAILY_TIERS,
  });
  process.stdout.write(JSON.stringify(rows[rows.length - 1]) + '\n');
}
