// Worker du chantier A : runGame + mesures d'instrumentation (variants.mjs, instr()).
import { parentPort } from 'node:worker_threads';
import { runGame, type RunOpts } from '../../sim/runner';

parentPort!.on('message', (o: RunOpts) => {
  const I = { w: 0, hw: 0, lhw: 0, hl: 0, hlw: 0, cb: 0, ce: 0 };
  (globalThis as any).__I = I;
  const r: any = runGame(o);
  r.instr = {
    hValue: I.w ? I.hw / I.w : NaN, // Harmonie moyenne pondérée par la valeur produite (héros + Échos)
    hGeo: I.w ? Math.exp(I.lhw / I.w) : NaN, // moyenne géométrique pondérée
    hLife: I.hl ? I.hlw / I.hl : NaN, // idem, production du héros seul
    ecoCult: I.cb ? I.ce / I.cb : NaN, // facteur moyen du Domaine sur Récolter (pondéré)
  };
  parentPort!.postMessage(r);
});
