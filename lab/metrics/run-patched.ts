// Campagne au format RunResult (lab/sim/runner.ts) avec surcharges en mémoire du Game Balancer (BAL_OBJ),
// pour passer lab/metrics/guardrails.ts sur une correction candidate sans toucher src/.
//
//   BAL_OBJ='ACT.commercer.produce.or=1.1;…' node --import ./lab/balance/register.mjs lab/metrics/run-patched.ts \
//     --profiles=a,b --seeds=1-100 --hours=6 --id=C4xx-nom --shard=0/2   (lancer un processus par shard)
//   puis : node --import ./lab/sim/register.mjs lab/metrics/run-patched.ts --merge --id=C4xx-nom
import { execSync } from 'node:child_process';
import { appendFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './lib';

const arg = (n: string, d?: string) => { const a = process.argv.find((x) => x === `--${n}` || x.startsWith(`--${n}=`)); return a ? (a.includes('=') ? a.slice(a.indexOf('=') + 1) : 'true') : d; };
const id = arg('id')!;
const dir = join(ROOT, 'lab', 'results', id);
mkdirSync(dir, { recursive: true });

if (arg('merge')) {
  const { summarize, summaryMarkdown } = await import('../sim/stats');
  const parts = readdirSync(dir).filter((f) => f.startsWith('part-'));
  const runs = parts.flatMap((f) => readFileSync(join(dir, f), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)));
  runs.sort((a, b) => a.profile.localeCompare(b.profile) || a.seed - b.seed);
  const m0 = JSON.parse(readFileSync(join(dir, 'part-meta.json'), 'utf8'));
  const meta = { ...m0, runs: runs.length };
  writeFileSync(join(dir, 'runs.jsonl'), runs.map((r) => JSON.stringify(r)).join('\n') + '\n');
  const summary = summarize(runs);
  writeFileSync(join(dir, 'summary.json'), JSON.stringify({ meta, summary }, null, 1));
  writeFileSync(join(dir, 'meta.json'), JSON.stringify(meta, null, 1));
  writeFileSync(join(dir, 'summary.md'), summaryMarkdown(meta, summary));
  console.log(`→ ${dir} (${runs.length} parties)`);
} else {
  await import('../balance/lib'); // applique BAL_OBJ aux objets de données en mémoire
  const { runGame } = await import('../sim/runner');
  const profiles = arg('profiles', 'experimente')!.split(',');
  const seeds: number[] = [];
  for (const p of arg('seeds', '1-20')!.split(',')) { const [a, b] = p.split('-').map(Number); if (b === undefined) seeds.push(a); else for (let i = a; i <= b; i++) seeds.push(i); }
  const hours = Number(arg('hours', '6')), dt = Number(arg('dt', '0.5'));
  const [k, n] = arg('shard', '0/1')!.split('/').map(Number);
  const commit = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim();
  writeFileSync(join(dir, 'part-meta.json'), JSON.stringify({ id, commit, srcDirty: false, patch: process.env.BAL_OBJ ?? '', profiles, seeds: arg('seeds'), hours, dt, events: false, date: new Date().toISOString(), wallMs: 0, command: `BAL_OBJ='${process.env.BAL_OBJ ?? ''}' node --import ./lab/balance/register.mjs lab/metrics/run-patched.ts ${process.argv.slice(2).join(' ')}` }, null, 1));
  const out = join(dir, `part-${k}.jsonl`);
  writeFileSync(out, '');
  let i = 0;
  for (const p of profiles) for (const seed of seeds) {
    if (i++ % n !== k) continue;
    appendFileSync(out, JSON.stringify(runGame({ profile: p, seed, hours, dt })) + '\n');
  }
}
