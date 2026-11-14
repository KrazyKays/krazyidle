// Collecteur additionnel du Game Data Analyst : KPI que lab/sim/runner.ts ne collecte pas.
// Reproduit la boucle de runGame (mêmes graines, mêmes profils, même ordre d'appels) sans modifier lab/sim/,
// et mesure en plus :
//   - harmonie : instant du minimum, minimum après la 1re demi-heure, p05 pondéré dans le temps ;
//   - part des Échos y compris hors ligne (ticks hors ligne rejoués un par un, comme simulateOffline) ;
//   - surnoms : histogramme par identifiant (vies des ancêtres) ;
//   - Échos en fin de partie : activité dominante, nombre, surnommés ;
//   - durée moyenne des vies (en secondes de jeu).
//
//   node --import ./lab/sim/register.mjs lab/metrics/collect-extra.ts --profiles=a,b --seeds=1-50 --hours=6 [--dt=0.5] [--events] --id=C4xx-nom [--workers=2]
// Sortie : lab/results/<id>/extra.jsonl + extra-meta.json (+ vérification : log10Value identique à runGame).
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Worker, isMainThread, parentPort } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { ACTS, RES, RES_INFO } from '../../src/engine/data';
import { newRuntime, offlineCapSec, setActivity, startLife, tick } from '../../src/engine/game';
import { ecoHealth } from '../../src/engine/ecosystem';
import { Rng } from '../../src/engine/rng';
import { newGame, type GameState } from '../../src/engine/state';
import { PROFILES, type Ctx } from '../sim/profiles';
import { ROOT } from './lib';

export interface ExtraOpts { profile: string; seed: number; hours: number; dt: number; events: boolean }
export interface Extra {
  profile: string; seed: number; log10Value: number;
  harmonyMin: number; harmonyMinAt: number; harmonyMinAfter30: number; harmonyP05: number; harmonyAvg: number;
  /** part des Échos (online seulement, comme runner.ts) */
  echoShareOnline: number;
  /** part des Échos y compris hors ligne */
  echoShareAll: number;
  offlineShareOfValue: number;
  epithetById: Record<string, number>;
  lives: number; lifeSecMean: number;
  echoesEnd: number; echoesEndDominant: Record<string, number>; echoesEndWithEpithet: number;
  successionWaitSec: number;
}

const totalValue = (s: GameState) => RES.reduce((a, r) => a + s.totalEver[r] * RES_INFO[r].value, 0);
const gross = (rt: ReturnType<typeof newRuntime>) => RES.reduce((a, r) => a + rt.tickGross[r] * RES_INFO[r].value, 0);

export function runExtra(o: ExtraOpts): Extra {
  const prof = PROFILES[o.profile];
  const dt = o.dt, start = Date.UTC(2026, 10, 16);
  const s = newGame(start, o.seed);
  const rt = newRuntime();
  rt.online = o.events;
  startLife(s);
  const c: Ctx = { t: 0, now: start, rt, rng: new Rng(o.seed ^ 0x9e3779b9), mem: {} };
  const total = o.hours * 3600;
  let nextDecide = 0, nextBuy = 0, succAt = -1;
  let sessionEnd = prof.sessions ? prof.sessions[0] * 60 : Infinity;
  let hMin = 1, hMinAt = 0, hMin30 = 1, hSum = 0, hN = 0;
  const hHist = new Float64Array(201); // histogramme pondéré par le temps, pas de 0,005
  let echoOn = 0, allOn = 0, echoOff = 0, allOff = 0, succWait = 0;
  const obsH = (h: number, w: number, t: number) => {
    hSum += h * w; hN += w; hHist[Math.max(0, Math.min(200, Math.round(h * 200)))] += w;
    if (h < hMin) { hMin = h; hMinAt = t; }
    if (t >= 1800) hMin30 = Math.min(hMin30, h);
  };
  while (c.t < total) {
    if (c.t >= sessionEnd && prof.sessions) {
      const off = Math.min(prof.sessions[1] * 3600, total - c.t);
      // = simulateOffline(s, rt, off, c.now + off*1000), rejoué tick par tick pour mesurer la part des Échos
      const sec = Math.min(off, offlineCapSec(s));
      if (sec >= 30) {
        rt.online = false;
        const t0 = c.now + off * 1000 - sec * 1000;
        const steps = Math.floor(sec);
        for (let i = 0; i < steps; i++) {
          const echo0 = rt.echoRate;
          tick(s, rt, 1, t0 + i * 1000);
          allOff += gross(rt);
          // echoRate est une moyenne glissante (k = 1/3 à dt 1) : on inverse le lissage pour retrouver le brut du tick
          echoOff += echo0 + (rt.echoRate - echo0) * 3;
          if (s.succession) succWait += 1;
          obsH(ecoHealth(s.eco), 1, c.t + i);
        }
        rt.online = true;
      }
      c.t += off; c.now += off * 1000;
      rt.online = o.events;
      sessionEnd = c.t + prof.sessions[0] * 60;
      nextDecide = nextBuy = c.t;
      if (s.succession) succAt = c.t;
      continue;
    }
    if (s.life && c.t >= nextDecide) {
      const a = prof.activity(s, c);
      if (a !== s.life.act) setActivity(s, a);
      nextDecide = c.t + prof.decideEvery;
    }
    c.now += dt * 1000;
    tick(s, rt, dt, c.now);
    c.t += dt;
    allOn += gross(rt); echoOn += rt.echoRate * dt;
    obsH(ecoHealth(s.eco), dt, c.t);
    if (s.succession) {
      succWait += dt;
      if (succAt < 0) succAt = c.t + prof.successionDelay;
      if (c.t >= succAt) { prof.succession(s, c); succAt = -1; }
    }
    if (c.t >= nextBuy) { prof.buy(s, c); nextBuy = c.t + prof.buyEvery; }
  }
  let acc = 0, p05 = 0;
  for (let i = 0; i <= 200; i++) { acc += hHist[i]; if (acc >= 0.05 * hN) { p05 = i / 200; break; } }
  const epithetById: Record<string, number> = {};
  for (const a of s.ancestors) if (a.epithet) epithetById[a.epithet] = (epithetById[a.epithet] ?? 0) + 1;
  const dom: Record<string, number> = Object.fromEntries(ACTS.map((a) => [a, 0]));
  for (const e of s.echoes) {
    const cnt = new Array(ACTS.length).fill(0);
    for (const x of e.acts) if (x >= 0) cnt[x]++;
    dom[ACTS[cnt.indexOf(Math.max(...cnt))]]++;
  }
  const lives = s.stats.lives;
  return {
    profile: o.profile, seed: o.seed, log10Value: Math.log10(Math.max(1, totalValue(s))),
    harmonyMin: hMin, harmonyMinAt: hMinAt, harmonyMinAfter30: hMin30, harmonyP05: p05, harmonyAvg: hN ? hSum / hN : 0,
    echoShareOnline: allOn > 0 ? echoOn / allOn : 0,
    echoShareAll: allOn + allOff > 0 ? (echoOn + echoOff) / (allOn + allOff) : 0,
    offlineShareOfValue: allOn + allOff > 0 ? allOff / (allOn + allOff) : 0,
    epithetById, lives,
    lifeSecMean: lives ? (total - succWait) / lives : 0,
    echoesEnd: s.echoes.length, echoesEndDominant: dom, echoesEndWithEpithet: s.echoes.filter((e) => (e as any).epithet).length,
    successionWaitSec: succWait,
  };
}

function parseSeeds(spec: string): number[] {
  const out: number[] = [];
  for (const part of spec.split(',')) { const [a, b] = part.split('-').map(Number); if (b === undefined) out.push(a); else for (let i = a; i <= b; i++) out.push(i); }
  return out;
}

const self = fileURLToPath(import.meta.url);
if (!isMainThread) {
  parentPort!.on('message', (o: ExtraOpts) => parentPort!.postMessage(runExtra(o)));
} else if (process.argv[1] && fileURLToPath(new URL(process.argv[1], 'file://')).endsWith('collect-extra.ts')) {
  const arg = (n: string, d?: string) => { const a = process.argv.find((x) => x === `--${n}` || x.startsWith(`--${n}=`)); return a ? (a.includes('=') ? a.slice(a.indexOf('=') + 1) : 'true') : d; };
  const profiles = arg('profiles', 'experimente')!.split(',');
  const seeds = parseSeeds(arg('seeds', '1-20')!);
  const hours = Number(arg('hours', '6')), dt = Number(arg('dt', '0.5')), events = arg('events') === 'true';
  const workers = Math.max(1, Math.min(Number(arg('workers', '2')), 4));
  const id = arg('id') ?? 'C4xx-extra';
  const jobs: ExtraOpts[] = [];
  for (const p of profiles) for (const seed of seeds) jobs.push({ profile: p, seed, hours, dt, events });
  const res: Extra[] = [];
  const t0 = Date.now();
  let next = 0;
  await new Promise<void>((resolve, reject) => {
    let alive = 0;
    for (let i = 0; i < Math.min(workers, jobs.length); i++) {
      alive++;
      const w = new Worker(self, { execArgv: ['--import', join(ROOT, 'lab', 'sim', 'register.mjs')] });
      const feed = () => { if (next >= jobs.length) { w.terminate(); return; } w.postMessage(jobs[next++]); };
      w.on('message', (r: Extra) => { res.push(r); feed(); });
      w.on('error', reject);
      w.on('exit', () => { if (--alive === 0) resolve(); });
      feed();
    }
  });
  res.sort((a, b) => a.profile.localeCompare(b.profile) || a.seed - b.seed);
  const dir = join(ROOT, 'lab', 'results', id);
  mkdirSync(dir, { recursive: true });
  const commit = (() => { try { return execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch { return '?'; } })();
  writeFileSync(join(dir, 'extra.jsonl'), res.map((r) => JSON.stringify(r)).join('\n') + '\n');
  writeFileSync(join(dir, 'extra-meta.json'), JSON.stringify({ id, commit, profiles, seeds: arg('seeds', '1-20'), hours, dt, events, runs: res.length, wallMs: Date.now() - t0, command: 'node --import ./lab/sim/register.mjs lab/metrics/collect-extra.ts ' + process.argv.slice(2).join(' ') }, null, 1));
  console.log(`→ ${dir}/extra.jsonl (${res.length} parties, ${((Date.now() - t0) / 1000).toFixed(1)} s)`);
}
