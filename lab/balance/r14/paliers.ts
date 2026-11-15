// R14 — paliers relatifs du Destin du jour sur 60 dates : part des jours où chaque palier est atteignable
// par des familles de stratégies simples (minorant de l'optimum) et par une règle universelle sans adaptation.
// Cibles fixées à l'avance : Or atteignable (par une stratégie réglée) 20 à 40 % des jours ;
// Bronze atteint par la règle universelle >= 50 % des jours ; Argent = trouver la meilleure activité (par construction).
import { ACTS, type ActId } from '../../../src/engine/data';
import { DailyRun, DAILY_TIERS_FIXED, dailySetup, dailyTiers } from '../../../src/engine/daily';
const play = (date: string, plan: (t: number, r: DailyRun) => ActId) => {
  const r = new DailyRun(dailySetup(date));
  while (!r.done) { const a = plan(r.tickN * 0.1, r); if (a !== r.life.act) r.setAct(a); r.step(); }
  return r.score();
};
const feas = (a: ActId, r: DailyRun): ActId => (a === 'commercer' && r.res.vivres < 0.5 ? 'cultiver' : a === 'etudier' && r.res.or < 0.5 ? 'commercer' : a);
const dates = Array.from({ length: 60 }, (_, i) => new Date(Date.UTC(2026, 10, 1) + i * 86400e3).toISOString().slice(0, 10));
let gold = 0, silverU = 0, bronzeU = 0, goldFixed = 0;
const rows: string[] = [];
for (const d of dates) {
  const [b, s, g] = dailyTiers(d);
  let best = 0;
  for (const a of ACTS) best = Math.max(best, play(d, () => a));
  for (const a of ACTS) for (const c of ACTS) if (a !== c) for (let t = 5; t <= 85; t += 5) best = Math.max(best, play(d, (x, r) => feas(x < t ? a : c, r)));
  for (const a of ['cultiver', 'chasser'] as ActId[]) for (let t1 = 10; t1 <= 50; t1 += 5) for (let t2 = t1 + 10; t2 <= 80; t2 += 5)
    best = Math.max(best, play(d, (x, r) => feas(x < t1 ? a : x < t2 ? 'commercer' : 'etudier', r)));
  const uni = play(d, (x, r) => feas(x < 30 ? 'cultiver' : x < 60 ? 'commercer' : 'etudier', r));
  if (best >= g) gold++; if (uni >= b) bronzeU++; if (uni >= s) silverU++; if (best >= DAILY_TIERS_FIXED[2]) goldFixed++;
  rows.push(`| ${d} | ${b} / ${s} / ${g} | ${best} | ${(best / s).toFixed(2)} | ${uni} |`);
}
console.log('| date | paliers (B/A/O) | meilleure stratégie simple | ÷ référence | règle universelle |\n|---|---|---|---|---|\n' + rows.join('\n'));
console.log(`\nOr atteignable (stratégie simple réglée) : ${gold}/60 = ${(gold / 60 * 100).toFixed(0)} % (paliers fixes 800 : ${goldFixed}/60)`);
console.log(`Règle universelle : Bronze ${bronzeU}/60 = ${(bronzeU / 60 * 100).toFixed(0)} %, Argent ${silverU}/60`);
