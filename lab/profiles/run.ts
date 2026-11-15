// Lanceur de campagnes du Player Behavior Analyst (profils de lab/profiles/pba-profiles.ts + profils de référence).
//   node --import ./lab/sim/register.mjs lab/profiles/run.ts --profiles=a,b --seeds=1-100 --hours=6 [--dt=0.5] [--events] --id=C3xx-nom [--workers=2]
// Sorties : lab/profiles/results/<id>/ (runs.jsonl avec le champ `frustr`, summary.md, summary.json).
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import type { RunOpts, RunResult } from '../sim/runner';
import { summarize, summaryMarkdown } from '../sim/stats';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const arg = (n: string, d?: string) => { const a = process.argv.find((x) => x === `--${n}` || x.startsWith(`--${n}=`)); return a ? (a.includes('=') ? a.slice(a.indexOf('=') + 1) : 'true') : d; };
const seedsOf = (spec: string) => spec.split(',').flatMap((p) => { const [a, b] = p.split('-').map(Number); return b === undefined ? [a] : Array.from({ length: b - a + 1 }, (_, i) => a + i); });

const profiles = arg('profiles', 'opti-fort')!.split(',');
const seeds = seedsOf(arg('seeds', '1-20')!);
const hours = Number(arg('hours', '6')), dt = Number(arg('dt', '0.5')), events = arg('events') === 'true';
const workers = Number(arg('workers', '2'));
const id = arg('id', 'C3xx-test')!;
const commit = execSync('git rev-parse --short HEAD', { cwd: root }).toString().trim();
const outDir = join(here, 'results', id);
mkdirSync(outDir, { recursive: true });
const startH = Number(arg('startH', '0')); // heure UTC de début, le lundi 16/11/2026 (0 = réglage par défaut du runner)
const start = Date.UTC(2026, 10, 16) + startH * 3600_000;
const jobs: RunOpts[] = profiles.flatMap((p) => seeds.map((seed) => ({ profile: p, seed, hours, dt, events, start })));
const t0 = Date.now();
const results: (RunResult & { frustr: any })[] = [];
let next = 0;
await new Promise<void>((resolve, reject) => {
  let alive = 0;
  for (let i = 0; i < Math.min(workers, jobs.length); i++) {
    alive++;
    // Hérite du chargeur parent (lab/balance/register.mjs pour BAL_PATCH), sinon chargeur de base.
    const loader = process.execArgv.some((a) => a.includes('register.mjs')) ? process.execArgv : ['--import', join(root, 'lab', 'sim', 'register.mjs')];
    const w = new Worker(join(here, 'worker.ts'), { execArgv: loader });
    const feed = () => { if (next >= jobs.length) { w.terminate(); return; } w.postMessage(jobs[next++]); };
    w.on('message', (r) => { results.push(r); if (results.length % 50 === 0) process.stderr.write(`  ${results.length}/${jobs.length}\n`); feed(); });
    w.on('error', reject);
    w.on('exit', () => { if (--alive === 0) resolve(); });
    feed();
  }
});
results.sort((a, b) => a.profile.localeCompare(b.profile) || a.seed - b.seed);
const meta = { id, commit, date: new Date().toISOString(), profiles, seeds: arg('seeds', '1-20'), hours, dt, events, startH, balObj: process.env.BAL_OBJ ?? '', runs: results.length, wallMs: Date.now() - t0,
  command: 'node --import ./lab/sim/register.mjs lab/profiles/run.ts ' + process.argv.slice(2).join(' ') };
writeFileSync(join(outDir, 'runs.jsonl'), results.map((r) => JSON.stringify(r)).join('\n') + '\n');
const summary = summarize(results);
writeFileSync(join(outDir, 'summary.json'), JSON.stringify({ meta, summary }, null, 1));
writeFileSync(join(outDir, 'summary.md'), summaryMarkdown(meta as any, summary));
console.log(`→ ${outDir} (${results.length} parties, ${((Date.now() - t0) / 1000).toFixed(1)} s)`);
