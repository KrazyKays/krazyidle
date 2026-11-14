// QA phase 2 (B4) — le moteur est-il sensible à dt sur une lignée de chasseurs (Affût) ?
// node --import ./lab/sim/register.mjs tests/qa/dt-chasse.ts
import { RES, RES_INFO } from '../../src/engine/data';
import { confirmSuccession, newRuntime, setActivity, tick } from '../../src/engine/game';
import type { GameState } from '../../src/engine/state';
import { clone, playRandom, T0 } from './helpers';

const value = (s: GameState) => RES.reduce((a, r) => a + s.totalEver[r] * RES_INFO[r].value, 0);

for (const seed of [11, 12, 13, 14, 15]) {
  const { s: base } = playRandom({ seed, seconds: 3600 });
  if (base.succession) confirmSuccession(base, 0, [...base.echoes, base.succession.newEcho].slice(-2).map((e) => e.id));
  for (const e of base.echoes) e.acts = e.acts.map(() => 1); // Échos chasseurs
  const res: string[] = [];
  const g: number[] = [];
  for (const dt of [0.1, 0.5, 1]) {
    const s = clone(base);
    const rt = newRuntime(); rt.online = false;
    let affut = 0, gMin = 1e9;
    const n = Math.round(1800 / dt);
    for (let i = 0; i < n; i++) {
      if (s.life && s.life.act !== 'chasser') setActivity(s, 'chasser');
      tick(s, rt, dt, T0 + i * dt * 1000);
      if (s.succession) confirmSuccession(s, 0, s.echoes.map((e) => e.id));
      if (s.hunt.on) affut += dt;
      gMin = Math.min(gMin, s.eco.G);
    }
    g.push(value(s) - value(base));
    res.push(`dt ${dt}: Affût ${(100 * affut / 1800).toFixed(1)} % du temps, G min ${gMin.toFixed(2)}`);
  }
  console.log(`graine ${seed}: valeur dt0.5/dt0.1 ${(g[1] / g[0]).toFixed(4)}, dt1/dt0.1 ${(g[2] / g[0]).toFixed(4)} · ${res.join(' · ')}`);
}
