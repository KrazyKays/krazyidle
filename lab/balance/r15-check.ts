// R15 — la somme des pts/s affichés sur les cartes d'Écho approche-t-elle la production réelle des Échos ?
// Avant : echoValueRate (valeur de la vie / durée) ; après : echoExpectedRate. 10 parties de 2 h (bot historique).
import { echoExpectedRate, echoValueRate, newRuntime, tick } from '../../src/engine/game';
import { RES, RES_INFO } from '../../src/engine/data';
import { runBot } from '../../tests/bot';
const rows: number[][] = [];
for (let seed = 1; seed <= 10; seed++) {
  const { s } = runBot(2, seed);
  const rt = newRuntime(); rt.online = false;
  const before = s.echoes.reduce((a, e) => a + echoValueRate(e), 0);
  const after = s.echoes.reduce((a, e) => a + echoExpectedRate(s, rt, e), 0);
  s.life = null; // seuls les Échos produisent
  const loop = Math.max(...s.echoes.map((e) => e.acts.length));
  let v = 0;
  for (let i = 0; i < loop * 10; i++) { tick(s, rt, 0.1, i * 100); v += RES.reduce((a, r) => a + rt.tickGross[r] * RES_INFO[r].value, 0); }
  rows.push([before, after, v / (loop)]);
}
const m = (k: number) => rows.reduce((a, r) => a + r[k], 0) / rows.length;
console.log(`Σ cartes avant ${m(0).toFixed(1)} pts/s · après ${m(1).toFixed(1)} pts/s · production réelle des Échos ${m(2).toFixed(1)} pts/s (10 graines, 2 h)`);
console.log('ratios après/réel par graine :', rows.map((r) => (r[1] / r[2]).toFixed(2)).join(' '));
