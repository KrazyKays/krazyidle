// Worker du lanceur PBA : charge les profils supplémentaires puis exécute runGame (lab/sim, non modifié).
// Phase 2 : si BAL_OBJ est défini, applique les surcharges en mémoire du Game Balancer (lab/balance/lib.ts).
import { parentPort } from 'node:worker_threads';
import { runGame, type RunOpts } from '../sim/runner';
import { F, resetF } from './pba-profiles';

if (process.env.BAL_OBJ) await import('../balance/lib');

parentPort!.on('message', (o: RunOpts) => {
  resetF();
  const r = runGame(o);
  parentPort!.postMessage({ ...r, frustr: F });
});
