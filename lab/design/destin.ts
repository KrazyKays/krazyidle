// Destin du jour : y a-t-il une stratégie évidente ? Scores de stratégies simples sur 60 dates.
// Usage : node --import ./lab/sim/register.mjs lab/design/destin.ts [jours=60]
import { ACTS, RES_INFO, type ActId } from '../../src/engine/data';
import { DAILY_TIERS, DailyRun, dailySetup } from '../../src/engine/daily';
import { ecoFactor } from '../../src/engine/ecosystem';
import { lifePower } from '../../src/engine/sim';

type Strat = (r: DailyRun) => ActId | null;
const can = (r: DailyRun, a: ActId) => (a === 'commercer' ? r.res.vivres > 3 : a === 'etudier' ? r.res.or > 2 : true);
const mono = (a: ActId): Strat => (r) => (can(r, a) ? a : 'cultiver');
// Glouton : meilleure valeur nette instantanée.
const greedy: Strat = (r) => {
  let best: ActId = 'cultiver', bv = -Infinity;
  for (const a of ACTS) {
    if (!can(r, a)) continue;
    const p = lifePower(r.life, r.hero, a);
    const prod = { cultiver: 1.2, chasser: 2, commercer: 1.5 * 2, etudier: 0.6 * 8, mediter: 0.06 * 20 }[a];
    const cons = { cultiver: 0, chasser: 0, commercer: 3, etudier: 2 * 2, mediter: 0 }[a] * Math.sqrt(p);
    const v = r.ctx.prodMult(a) * p * ecoFactor(a, r.eco) * prod - cons;
    if (v > bv) { bv = v; best = a; }
  }
  return best;
};
// Chaîne : Cultiver 30 s → Commercer 30 s → Étudier 30 s.
const chain: Strat = (r) => { const t = r.tickN * 0.1; const a: ActId = t < 30 ? 'cultiver' : t < 60 ? 'commercer' : 'etudier'; return can(r, a) ? a : 'cultiver'; };
const strats: Record<string, Strat> = { ...Object.fromEntries(ACTS.map((a) => ['mono-' + a, mono(a)])), glouton: greedy, chaine: chain };
const days = Number(process.argv[2] ?? 60);
const wins: Record<string, number> = {};
const scores: Record<string, number[]> = {};
let gold = 0;
for (let d = 0; d < days; d++) {
  const date = new Date(Date.UTC(2026, 10, 1) + d * 86400_000).toISOString().slice(0, 10);
  let best = '', bs = -1;
  for (const [id, f] of Object.entries(strats)) {
    const r = new DailyRun(dailySetup(date));
    while (!r.done) { const a = f(r); if (a !== r.life.act) r.setAct(a); r.step(); }
    const sc = r.score();
    (scores[id] ??= []).push(sc);
    if (sc > bs) { bs = sc; best = id; }
  }
  wins[best] = (wins[best] ?? 0) + 1;
  if (bs >= DAILY_TIERS[2]) gold++;
}
const med = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
for (const [id, s] of Object.entries(scores)) console.log(`${id.padEnd(16)} médiane ${med(s)} · min ${Math.min(...s)} · max ${Math.max(...s)} · meilleure stratégie ${wins[id] ?? 0}/${days} jours`);
console.log(`Jours où la meilleure stratégie simple atteint l'Or (${DAILY_TIERS[2]}) : ${gold}/${days}`);
void RES_INFO;
