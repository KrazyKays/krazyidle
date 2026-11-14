// QA — mesures chiffrées citées dans audits/2026-11-14/qa-engineer.md.
// node --import ./lab/sim/register.mjs tests/qa/measure.ts
import { RES, RES_INFO } from '../../src/engine/data';
import { confirmSuccession, genHeirs, newRuntime, setActivity, simulateOffline, tick } from '../../src/engine/game';
import { upcomingEvents } from '../../src/engine/events';
import { Rng } from '../../src/engine/rng';
import { newGame, type GameState } from '../../src/engine/state';
import { clone, playRandom, T0 } from './helpers';

const value = (s: GameState) => RES.reduce((a, r) => a + s.totalEver[r] * RES_INFO[r].value, 0);
function midGame(seed: number) {
  const { s } = playRandom({ seed, seconds: 3600 });
  if (s.succession) confirmSuccession(s, 0, [...s.echoes, s.succession.newEcho].slice(-2).map((e) => e.id));
  return s;
}
function runFor(s: GameState, sec: number, dt: number) {
  const rt = newRuntime(); rt.online = false;
  for (let i = 0; i < Math.round(sec / dt); i++) tick(s, rt, dt, T0 + i * dt * 1000);
  return s;
}

console.log('## Hors ligne (1 s) / en ligne (0,1 s), 30 min, joueur absent');
for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
  const base = midGame(seed);
  const on = runFor(clone(base), 1800, 0.1);
  const off = clone(base);
  simulateOffline(off, newRuntime(), 1800, T0 + 1800_000);
  const r = (value(off) - value(base)) / (value(on) - value(base));
  console.log(`graine ${seed}: ratio ${r.toFixed(4)}`);
}

console.log('## Sensibilité au pas, 20 min, même état');
for (const seed of [21, 22, 23]) {
  const base = midGame(seed);
  const g = [0.1, 0.5, 1].map((dt) => value(runFor(clone(base), 1200, dt)) - value(base));
  console.log(`graine ${seed}: dt0.5/dt0.1 ${(g[1] / g[0]).toFixed(4)} · dt1/dt0.1 ${(g[2] / g[0]).toFixed(4)}`);
}

console.log('## QA-03 : objectif d\'événement, Runtime chaud vs neuf');
const w = upcomingEvents(Date.UTC(2026, 10, 16), 200).find((x) => x.def.id === 'moisson')!;
for (const seed of [31, 32, 33]) {
  const { s } = playRandom({ seed, seconds: 2 * 3600 });
  if (s.succession) confirmSuccession(s, 0, s.echoes.map((e) => e.id).slice(0, 2));
  setActivity(s, 'cultiver');
  const warm = clone(s);
  const rtW = newRuntime();
  for (let i = 0; i < 601; i++) tick(warm, rtW, 0.1, w.start - 60_000 + i * 100);
  const rtC = newRuntime();
  tick(s, rtC, 0.1, w.start);
  let t = 0;
  while (s.events[w.key].tier < 3 && t < 2700) { tick(s, rtC, 0.1, w.start + 100 + t * 100); if (s.succession) confirmSuccession(s, 0, []); if (s.life && s.life.act !== 'cultiver') setActivity(s, 'cultiver'); t++; }
  console.log(`graine ${seed}: objectif chaud ${warm.events[w.key].target} · neuf ${clone(s).events[w.key].target} · palier Or en ${(t / 10).toFixed(1)} s (neuf)`);
}

console.log('## QA-05 : héritiers sans mutation');
{
  const s = newGame(0, 7);
  const parent = { ...s.hero, traits: [] as string[], vocation: null };
  const rng = new Rng(123);
  let zero = 0, n = 0;
  for (let i = 0; i < 5000; i++) for (const h of genHeirs(s, parent, rng)) { n++; if (!h.traits.length) zero++; }
  console.log(`${zero}/${n} = ${(100 * zero / n).toFixed(2)} % (théorie 0,15 × 0,75 = 11,25 %)`);
}
