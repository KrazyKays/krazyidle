// Commande du comté : calibrage sur N dates [SIMULÉ]. Critères fixés avant mesure :
//  1. Or faisable 100 % des jours (le solveur livre avant le seuil d'Or, par construction s'il livre) ;
//  2. aucune activité seule ne livre ;
//  3. Bronze par une règle naïve ≥ 70 % des jours ;
//  4. Or obtenu au premier essai par les profils « raisonnables » < 10 % ;
//  5. âge de livraison du solveur entre 50 et 75 ans.
// Profils : naïf = Cultiver → Commercer → Étudier → Méditer en parts égales (22 s), sans lire la commande ;
// raisonnables = joueur réactif réglé par défaut (relit toutes les 5 s), deux réglages de seuils (0.5 : plus de consignes).
import { DAILY_CHOICES, DAILY_DUR, dailySetup, dailySolution, dailyTiers, playActions, reactivePlay } from '../../../src/engine/daily';
const N = +(process.argv[2] ?? 365);
const V = process.argv.includes('-v');
const dates = Array.from({ length: N }, (_, i) => new Date(Date.UTC(2026, 10, 1) + i * 86400e3).toISOString().slice(0, 10));
let gold = 0, single = 0, inRange = 0;
const naive = [0, 0, 0, 0], reas = [0, 0, 0, 0];
const ages: number[] = [], ms: number[] = [], sw: number[] = [];
for (const d of dates) {
  const t0 = performance.now();
  const setup = dailySetup(d);
  const sol = dailySolution(d);
  const tiers = dailyTiers(d);
  ms.push(performance.now() - t0);
  const age = sol.tick / 10;
  const med = (tick: number | null) => (tick === null ? 0 : tiers.filter((x) => tick / 10 <= x).length);
  if (sol.delivered && age <= tiers[2]) gold++;
  if (sol.delivered && age >= 50 && age <= 75) inRange++;
  ages.push(sol.delivered ? age : 999);
  sw.push(sol.actions.length);
  for (let a = 0; a < DAILY_CHOICES.length; a++) if (playActions(setup, [[0, a]]).delivered) { single++; break; }
  naive[med(playActions(setup, [[0, 0], [220, 1], [440, 2], [660, 3]]).deliveredTick)]++;
  for (const [orMin, vivMin] of [[10, 15], [6, 10]]) reas[med(reactivePlay(setup, 'cultiver', 5, orMin, vivMin).deliveredTick)]++;
  if (V) console.log(d, JSON.stringify(setup.order), setup.mods.map((m) => m.id).join(','), 'solveur', age, 'paliers', tiers.join('/'), 'changements', sol.actions.length, ms[ms.length - 1].toFixed(0) + ' ms');
}
const q = (a: number[], p: number) => [...a].sort((x, y) => x - y)[Math.floor(p * (a.length - 1))];
const pc = (a: number[], n: number) => `aucune ${a[0]} · 🥉 ${a[1]} · 🥈 ${a[2]} · 🥇 ${a[3]} (≥ Bronze ${((1 - a[0] / n) * 100).toFixed(0)} %, Or ${(a[3] / n * 100).toFixed(0)} %)`;
console.log(`dates ${N} · [1] Or faisable ${gold}/${N} · [2] une activité seule livre ${single} jours · [5] âge solveur dans [50,75] ${inRange}/${N}`);
console.log(`[3] naïf : ${pc(naive, N)}`);
console.log(`[4] réactif par défaut (2 profils × ${N}) : ${pc(reas, 2 * N)}`);
console.log(`âge solveur : min ${q(ages, 0)} · q10 ${q(ages, 0.1)} · médiane ${q(ages, 0.5)} · q90 ${q(ages, 0.9)} · max ${q(ages, 1)} (vie ${DAILY_DUR}) · changements d'activité du solveur : médiane ${q(sw, 0.5)}, q90 ${q(sw, 0.9)}`);
console.log(`coût dailySetup + solveur (Node) : médiane ${q(ms, 0.5).toFixed(0)} ms · q90 ${q(ms, 0.9).toFixed(0)} ms · max ${q(ms, 1).toFixed(0)} ms`);
