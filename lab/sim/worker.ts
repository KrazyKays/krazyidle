import { parentPort } from 'node:worker_threads';
import { runGame, type RunOpts } from './runner';

parentPort!.on('message', (o: RunOpts) => {
  parentPort!.postMessage(runGame(o));
});
