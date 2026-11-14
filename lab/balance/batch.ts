// Lot de parties runBal (valeur brute ET nette) → JSONL sur stdout.
//   node --import ./lab/balance/register.mjs lab/balance/batch.ts --profiles=a,b --seeds=1-200 --hours=6 [--dt=0.5] [--events] [--shard=0/2]
// BAL_OBJ / BAL_PATCH (env) appliquent des surcharges en mémoire ; --tag=… est recopié dans chaque ligne.
import { arg, parseSeeds, runBal } from './lib';
import './profiles-extra';

const profiles = (arg('profiles', 'experimente') as string).split(',');
const seeds = parseSeeds(arg('seeds', '1-20') as string);
const hours = Number(arg('hours', '6'));
const dt = Number(arg('dt', '0.5'));
const events = arg('events') === 'true';
const [k, n] = (arg('shard', '0/1') as string).split('/').map(Number);
const tag = arg('tag', '');
let i = 0;
for (const p of profiles) for (const seed of seeds) {
  if (i++ % n !== k) continue;
  const r = runBal({ profile: p, seed, hours, dt, events });
  process.stdout.write(JSON.stringify({ tag, ...r }) + '\n');
}
