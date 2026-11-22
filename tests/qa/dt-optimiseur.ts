// QA phase 2 (B4) — d'où vient la sensibilité de l'optimiseur à dt ?
// node --import ./lab/sim/register.mjs tests/qa/dt-optimiseur.ts
// Rejoue la règle de décision de l'optimiseur (actNetValue toutes les 1 s, contrainte de vocation)
// sur les premières vies, et mesure à quelle distance du seuil de vocation (50 %) se joue la part de Chasser.
import { ACTS, type ActId } from '../../src/engine/data';
import { confirmSuccession, newRuntime, setActivity, startLife, tick } from '../../src/engine/game';
import { newGame } from '../../src/engine/state';
import { actNetValue, feasible } from '../../lab/sim/profiles';

function run(seed: number, dt: number, lives: number) {
  const s = newGame(0, seed);
  const rt = newRuntime(); rt.online = false;
  startLife(s);
  let t = 0, next = 0, now = Date.UTC(2026, 10, 16, 2);
  const out: { share: number; voc: string }[] = [];
  while (out.length < lives) {
    if (s.life && t >= next) {
      const life = s.life, v = s.hero.vocation?.act;
      let best: ActId = 'cultiver', bv = -Infinity;
      if (v && life.timeIn[v] < life.dur * 0.5 && life.timeIn[v] + (life.dur - life.t) <= life.dur * 0.5 + 2) best = feasible(s, v);
      else for (const a of ACTS) { const x = actNetValue(s, rt, a); if (x > bv && feasible(s, a) === a) { bv = x; best = a; } }
      if (best !== life.act) setActivity(s, best);
      next = t + 1;
    }
    tick(s, rt, dt, (now += dt * 1000));
    t += dt;
    if (s.succession) {
      const sc = s.succession;
      out.push({ share: sc.ancestor.dominant === 'cultiver' ? 1 : 0, voc: sc.vocationEarned ? `${sc.vocationEarned.act}${sc.vocationEarned.tier}` : '-' });
      (out[out.length - 1] as any).ch = 0;
      confirmSuccession(s, 0, [sc.newEcho.id]);
    }
  }
  return out;
}

// Part de Chasser dans la 1re vie et vocation obtenue, par graine.
const lives = 3;
let diff = 0;
const rows: string[] = [];
for (let seed = 1; seed <= 30; seed++) {
  const a = run(seed, 0.1, lives).map((x) => x.voc).join(','), b = run(seed, 0.5, lives).map((x) => x.voc).join(',');
  if (a !== b) diff++;
  rows.push(`graine ${seed}: dt0.1 ${a} | dt0.5 ${b}`);
}
console.log(rows.join('\n'));
console.log(`vocations des ${lives} premières vies différentes entre dt 0,1 et 0,5 : ${diff}/30 graines`);
