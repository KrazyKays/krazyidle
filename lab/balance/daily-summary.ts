// Synthèse de la recherche Destin du jour + test d'une règle universelle (mêmes temps de bascule pour toutes les dates).
//   node --import ./lab/balance/register.mjs lab/balance/daily-summary.ts lab/balance/results/daily-search.jsonl
import { readFileSync, writeFileSync } from 'node:fs';
import { ACTS, type ActId } from '../../src/engine/data';
import { DAILY_DT, DailyRun, dailySetup } from '../../src/engine/daily';
import { f, stats } from './lib';

const rows = readFileSync(process.argv[2], 'utf8').trim().split('\n').map((l) => JSON.parse(l)).sort((a, b) => a.date.localeCompare(b.date));
const I = (a: ActId) => ACTS.indexOf(a);
function rule(date: string, t1: number, t2: number, first: ActId = 'cultiver') {
  const r = new DailyRun(dailySetup(date));
  const SEG = Math.round(1 / DAILY_DT);
  let sec = 0;
  while (!r.done) {
    if (r.tickN % SEG === 0) {
      let a = sec < t1 ? I(first) : sec < t2 ? I('commercer') : I('etudier');
      if (a === I('commercer') && r.res.vivres < 0.5) a = I('cultiver');
      if (a === I('etudier') && r.res.or < 0.5) a = r.res.vivres >= 0.5 ? I('commercer') : I('cultiver');
      r.setAct(ACTS[a]);
      sec++;
    }
    r.step();
  }
  return r.score();
}
// Règle universelle : (t1, t2) qui maximise la moyenne des scores sur toutes les dates
let best = { t1: 0, t2: 0, mean: -1, scores: [] as number[] };
for (let t1 = 5; t1 <= 70; t1 += 5) for (let t2 = t1 + 5; t2 <= 90; t2 += 5) {
  const sc = rows.map((r) => rule(r.date, t1, t2));
  const m = sc.reduce((a, b) => a + b, 0) / sc.length;
  if (m > best.mean) best = { t1, t2, mean: m, scores: sc };
}
const o: string[] = [];
o.push(`# Destin du jour — ${rows.length} dates (${rows[0].date} → ${rows[rows.length - 1].date})\n`);
o.push(`Méthodes : 5 stratégies constantes, 3 familles de bascule réglées par date (grille 5 s), recherche aléatoire, évolutionnaire (µ+λ, population 40, amorcée par les heuristiques), escalade ; budget total ${''}par date indiqué dans la commande. Meilleur plan rejoué via \`replay()\` et code vérifié par \`verifyCode()\`.\n`);
o.push('| date | traits | modificateurs | meilleure constante | meilleure bascule réglée | règle universelle | meilleur trouvé | replay OK | palier atteint |');
o.push('|---|---|---|---|---|---|---|---|---|');
rows.forEach((r, i) => {
  const cons = r.heuristics.filter((h: any) => h.name.startsWith('constant')).sort((a: any, b: any) => b.score - a.score)[0];
  const sw = r.heuristics.filter((h: any) => !h.name.startsWith('constant')).sort((a: any, b: any) => b.score - a.score)[0];
  const tier = r.best >= 800 ? 'Or' : r.best >= 500 ? 'Argent' : r.best >= 250 ? 'Bronze' : '—';
  o.push(`| ${r.date} | ${r.traits.join(', ')} | ${r.mods.join(', ')} | ${cons.name.slice(9)} ${cons.score} | ${sw.score} (${sw.name}) | ${best.scores[i]} | **${r.best}** | ${r.replayOk ? 'oui' : 'NON'} | ${tier} |`);
});
const B = stats(rows.map((r) => r.best));
const C = stats(rows.map((r) => Math.max(...r.heuristics.filter((h: any) => h.name.startsWith('constant')).map((h: any) => h.score))));
const ratioU = stats(rows.map((r, i) => best.scores[i] / r.best));
o.push('');
o.push(`- Meilleur score trouvé : ${f(B.mean, 0)} ± ${f(B.sd, 0)} (min ${B.min}, p50 ${B.p50}, max ${B.max}). Dates ≥ 800 (Or) : ${rows.filter((r) => r.best >= 800).length}/${rows.length} ; ≥ 500 : ${rows.filter((r) => r.best >= 500).length}/${rows.length} ; ≥ 250 : ${rows.filter((r) => r.best >= 250).length}/${rows.length}.`);
o.push(`- Meilleure stratégie constante : ${f(C.mean, 0)} ± ${f(C.sd, 0)} (min ${C.min}, max ${C.max}).`);
o.push(`- Règle universelle « Cultiver jusqu'à ${best.t1} s → Commercer jusqu'à ${best.t2} s → Étudier » (mêmes temps tous les jours, aucune adaptation) : ${f(best.mean, 0)} en moyenne, soit ${f(100 * ratioU.mean, 1)} % ± ${f(100 * ratioU.sd, 1)} du meilleur trouvé (min ${f(100 * ratioU.min, 1)} %). Paliers de cette règle : ≥ 500 sur ${best.scores.filter((x) => x >= 500).length}/${rows.length}, ≥ 800 sur ${best.scores.filter((x) => x >= 800).length}/${rows.length}.`);
const wonBy: Record<string, number> = {};
for (const r of rows) { const b = [...r.heuristics].sort((a: any, c: any) => c.score - a.score)[0]; const fam = b.name.split('@')[0]; wonBy[fam] = (wonBy[fam] ?? 0) + 1; }
o.push(`- Famille heuristique gagnante par date : ${JSON.stringify(wonBy)}.`);
o.push(`- Écart meilleur trouvé / meilleure heuristique : ${f(stats(rows.map((r) => r.best / Math.max(...r.heuristics.map((h: any) => h.score)))).mean, 3)} (moyenne des ratios).`);
o.push('\nPlans optimaux trouvés (activité×secondes) :\n');
for (const r of rows) o.push(`- ${r.date} (${r.best}) : ${r.bestPlan}`);
writeFileSync('lab/balance/results/daily.md', o.join('\n') + '\n');
console.log(o.join('\n'));
