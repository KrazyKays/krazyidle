// Lanceur de campagnes de simulation (parallèle, graines reproductibles).
//
//   npm run sim -- --profiles=experimente,optimiseur --seeds=1-200 --hours=6 [--dt=0.5] [--events] [--id=nom] [--workers=4]
//
// Sorties : lab/results/<id>/runs.jsonl (une partie par ligne), summary.json, summary.md, meta.json.
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import { PROFILES } from './profiles';
import type { RunOpts, RunResult } from './runner';
import { summarize, summaryMarkdown } from './stats';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');

function arg(name: string, def?: string): string | undefined {
  const a = process.argv.find((x) => x === `--${name}` || x.startsWith(`--${name}=`));
  if (!a) return def;
  return a.includes('=') ? a.slice(a.indexOf('=') + 1) : 'true';
}

function parseSeeds(spec: string): number[] {
  const out: number[] = [];
  for (const part of spec.split(',')) {
    const [a, b] = part.split('-').map(Number);
    if (b === undefined) out.push(a); else for (let i = a; i <= b; i++) out.push(i);
  }
  return out;
}

async function main() {
  if (arg('list')) {
    for (const p of Object.values(PROFILES)) console.log(`${p.id.padEnd(16)} ${p.desc}`);
    return;
  }
  const profiles = (arg('profiles', 'experimente') as string).split(',');
  const seeds = parseSeeds(arg('seeds', '1-20') as string);
  const hours = Number(arg('hours', '6'));
  const dt = Number(arg('dt', '0.5'));
  const events = arg('events') === 'true';
  const workers = Math.max(1, Math.min(Number(arg('workers', String(availableParallelism()))), 16));
  const commit = (() => { try { return execSync('git rev-parse --short HEAD', { cwd: root }).toString().trim(); } catch { return 'inconnu'; } })();
  const dirty = (() => { try { return execSync('git status --porcelain -- src', { cwd: root }).toString().trim().length > 0; } catch { return false; } })();
  const id = arg('id') ?? `${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '')}-${profiles.join('+')}`;
  const outDir = join(root, 'lab', 'results', id);
  mkdirSync(outDir, { recursive: true });

  const jobs: RunOpts[] = [];
  for (const p of profiles) for (const seed of seeds) jobs.push({ profile: p, seed, hours, dt, events });
  const t0 = Date.now();
  const results: RunResult[] = [];
  let next = 0, done = 0;
  await new Promise<void>((resolve, reject) => {
    let alive = 0;
    const spawn = () => {
      if (next >= jobs.length) { if (alive === 0) resolve(); return; }
      alive++;
      const w = new Worker(join(here, 'worker.ts'), { execArgv: ['--import', join(here, 'register.mjs')] });
      const feed = () => {
        if (next >= jobs.length) { w.terminate(); return; }
        w.postMessage(jobs[next++]);
      };
      w.on('message', (r: RunResult) => {
        results.push(r);
        done++;
        if (done % Math.max(1, Math.floor(jobs.length / 10)) === 0) process.stderr.write(`  ${done}/${jobs.length}\n`);
        feed();
      });
      w.on('error', reject);
      w.on('exit', () => { alive--; if (alive === 0 && next >= jobs.length) resolve(); });
      feed();
    };
    for (let i = 0; i < Math.min(workers, jobs.length); i++) spawn();
  });
  results.sort((a, b) => a.profile.localeCompare(b.profile) || a.seed - b.seed);
  const meta = { id, commit, srcDirty: dirty, date: new Date().toISOString(), profiles, seeds: arg('seeds', '1-20'), hours, dt, events, runs: results.length, wallMs: Date.now() - t0, command: 'npm run sim -- ' + process.argv.slice(2).join(' ') };
  writeFileSync(join(outDir, 'runs.jsonl'), results.map((r) => JSON.stringify(r)).join('\n') + '\n');
  const summary = summarize(results);
  writeFileSync(join(outDir, 'summary.json'), JSON.stringify({ meta, summary }, null, 1));
  writeFileSync(join(outDir, 'meta.json'), JSON.stringify(meta, null, 1));
  const md = summaryMarkdown(meta, summary);
  writeFileSync(join(outDir, 'summary.md'), md);
  console.log(md);
  console.log(`\n→ ${outDir} (${results.length} parties, ${((Date.now() - t0) / 1000).toFixed(1)} s)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
