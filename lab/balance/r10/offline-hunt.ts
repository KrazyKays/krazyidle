// ⚠️ Outillage d'audit de la 0.3 : il suppose Chasser, l'Affût et les Prédateurs, retirés en 0.4 (TERRE-2 à 4).
// Gardé pour l'historique des campagnes ; il ne tourne plus sur le jeu actuel.
// R10 — l'écart hors ligne / en ligne d'une lignée de chasseurs (test QA offline.test.ts) a-t-il changé ?
// Même protocole que le test, sur 20 graines. Lancer avec et sans BAL_OBJ (anciennes valeurs).
import '../lib';
import { RES, RES_INFO } from '../../../src/engine/data';
import { confirmSuccession, newRuntime, setActivity, simulateOffline, tick } from '../../../src/engine/game';
import type { GameState } from '../../../src/engine/state';
import { clone, playRandom, T0 } from '../../../tests/qa/helpers';
const value = (s: GameState) => RES.reduce((a, r) => a + s.totalEver[r] * RES_INFO[r].value, 0);
const out: number[] = [];
for (let seed = 1; seed <= 20; seed++) {
  const { s: base } = playRandom({ seed: seed === 1 ? 11 : seed + 100, seconds: 3600 });
  if (base.succession) confirmSuccession(base, 0, [...base.echoes, base.succession.newEcho].slice(-2).map((e) => e.id));
  for (const e of base.echoes) e.acts = e.acts.map(() => 1);
  const on = clone(base); const rt = newRuntime(); rt.online = false;
  if (on.life) setActivity(on, 'chasser');
  for (let i = 0; i < 12000; i++) tick(on, rt, 0.1, T0 + i * 100);
  const off = clone(base); if (off.life) setActivity(off, 'chasser');
  simulateOffline(off, newRuntime(), 1200, T0 + 1200_000);
  out.push((value(off) - value(base)) / (value(on) - value(base)) - 1);
}
const m = out.reduce((a, b) => a + b, 0) / out.length;
const sd = Math.sqrt(out.reduce((a, b) => a + (b - m) ** 2, 0) / (out.length - 1));
console.log(`${process.env.BAL_OBJ ? 'anciennes valeurs' : 'R10'} : écart moyen ${(m * 100).toFixed(2)} % ± ${(sd * 100).toFixed(2)} (n=20), max |écart| ${(Math.max(...out.map(Math.abs)) * 100).toFixed(1)} %, graine 11 : ${(out[0] * 100).toFixed(1)} %`);
