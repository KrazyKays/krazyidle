// Worker du lanceur PBA : charge les profils supplémentaires puis exécute runGame (lab/sim, non modifié).
import { parentPort } from 'node:worker_threads';
import { runGame, type RunOpts } from '../sim/runner';
import { F, resetF } from './pba-profiles';

parentPort!.on('message', (o: RunOpts) => {
  resetF();
  const r = runGame(o);
  parentPort!.postMessage({ ...r, frustr: F });
});
