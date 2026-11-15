import { parentPort } from 'node:worker_threads';
import { runGame, type RunOpts } from './runner';

// Surcharges d'objets en mémoire (BAL_OBJ, lab/balance/lib.ts), comme le lanceur de lab/profiles.
if (process.env.BAL_OBJ) await import('../balance/lib');

parentPort!.on('message', (o: RunOpts) => {
  parentPort!.postMessage(runGame(o));
});
