// TERRE-4 : règle de partage champs/chasse de Récolter (Équilibre), comparée en mémoire à l'ancien Cultiver.
// node --import ./lab/sim/register.mjs lab/balance/terre/partage.ts — résultats : lab/balance/terre/RESULTATS.md
import { ECO_EQ, ecoStep, harmonyMult, newEco, ecoPressure } from '../../../src/engine/ecosystem';
const cl = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const V: Record<string, (f: number, g: number) => number> = {
  A: (f, g) => g / (f + g),
  B: (f, g) => cl(0.5 * g * g, 0, 1),
  C: (f, g) => cl(g - 0.5, 0, 1),
  D: (f, g) => cl(0.5 + 1.5 * (g - 1), 0, 1),
  E: (f, g) => cl(0.5 + 1.0 * (g - 1) + 0.5 * (f - 1), 0, 1),
};
function sim(n: number, p: number, hs: (f: number, g: number) => number, secs = 600) {
  const e = newEco(); let got = 0;
  for (let t = 0; t < secs; t += 0.1) {
    ecoStep(e, 0.1);
    for (let i = 0; i < n; i++) {
      const f = cl(e.F / ECO_EQ.F, 0.2, 1.6), g = cl(e.G / ECO_EQ.G, 0.05, 2.2);
      const h = hs(e.F / ECO_EQ.F, e.G / ECO_EQ.G);
      got += 1.2 * p * harmonyMult(e) * ((1 - h) * f + h * g) * 0.1;
      const s = (i ? 0.6 : 1) * ecoPressure(p) * 0.1;
      e.F = Math.min(140, e.F + 0.35 * (1 - h) * s);
      e.G = Math.max(0.2, e.G - 0.035 * e.G * h * s);
    }
  }
  return `F ${e.F.toFixed(0)} G ${e.G.toFixed(0)} harm ${harmonyMult(e).toFixed(2)} rate/p ${(got / secs / p).toFixed(2)}`;
}
for (const k of Object.keys(V)) for (const [n, p] of [[1, 1], [4, 100], [8, 100], [8, 1e4], [8, 1e6]]) console.log(k, n, p, sim(n, p, V[k]));
