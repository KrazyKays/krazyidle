// Compagnonnage — C4 : calibrage de k (Héritage de la vie ×k, appliqué exactement à la succession) contre un Érudit bien joué.
//   node --import ./lab/balance/register.mjs lab/balance/compagnonnage/calibrage.ts --k=1.2 [--seeds=1-40] [--dt=0.5] [--tag=C4-k1.2]
// Un fichier par k ; la paire Notaire (commercer+etudier) est calculée au même k : on compose (k, kN) ensuite avec choix.ts.
import { mkdirSync, writeFileSync } from 'node:fs';
import { ACT, ACTS, type ActId, type ResId } from '../../../src/engine/data';
import { consumeScaleFor, lifePower } from '../../../src/engine/sim';
import type { GameState, LifeState } from '../../../src/engine/state';
import { PROFILES, arg, parseSeeds, runBal, stats, type BalResult } from '../lib';
import type { Ctx, Profile } from '../../sim/profiles';

const k = Number(arg('k', '1'));
const tag = arg('tag', `C4-k${k}`)!;
const seeds = parseSeeds(arg('seeds', '1-40')!);
const hours = 6, from = 2 * 3600;
const dt = Number(arg('dt', '0.5'));
const V = 0.5, S = 0.3;
const INPUT: Partial<Record<ActId, ResId>> = { commercer: 'vivres', etudier: 'or' };
const orFor = (s: GameState): ActId => (s.res.vivres >= 5 && s.unlocked.includes('commercer') ? 'commercer' : 'cultiver');

/** Meilleur Érudit d'E1 (lab/balance/etudier/attention.ts, blocs-30). */
const mono = PROFILES['mono-etudier'];
const erudit: Profile = {
  ...mono, id: 'erudit',
  activity(s: GameState, c: Ctx): ActId {
    if (c.t < 1800 || !s.unlocked.includes('etudier')) return mono.activity(s, c);
    const L = s.life!;
    if (c.mem.until && c.t < c.mem.until && c.mem.life === L) return c.mem.act;
    if (L.timeIn.etudier < 0.55 * L.dur + 1 && s.res.or >= 5) return 'etudier';
    const a = orFor(s);
    c.mem.until = c.t + 30; c.mem.act = a; c.mem.life = L;
    return a;
  },
};
const BASES: [ActId, Profile][] = [['cultiver', PROFILES['mono-cultiver']], ['commercer', PROFILES['mono-commercer']], ['etudier', erudit], ['mediter', PROFILES['mono-mediter']]];

function smartPick(s: GameState, L: LifeState, a: ActId, b: ActId): ActId | null {
  const needA = Math.max(0, V * L.dur + 1 - L.timeIn[a]), needB = Math.max(0, S * L.dur + 1 - L.timeIn[b]);
  if (needA <= 0.5 && needB <= 0.5) return null;
  const free = L.dur - L.t - needA - needB;
  const covered = (t: ActId) => { const r = INPUT[t]; if (!r) return true; return s.res[r] >= Object.values(ACT[t].consume)[0]! * consumeScaleFor(lifePower(L, s.hero, t)) * 5; };
  const targets = ([[a, needA], [b, needB]] as [ActId, number][]).filter(([, n]) => n > 0.5).map(([t]) => t);
  for (const t of targets) if (covered(t)) return t;
  if (free > 0.5) return INPUT[targets[0]] === 'vivres' ? 'cultiver' : orFor(s);
  return targets[0];
}

const formed = (L: LifeState, a: ActId, b: ActId) => L.timeIn[a] >= V * L.dur - 1e-6 && L.timeIn[b] >= S * L.dur - 1e-6;
const formedAny = (L: LifeState) => { const t = ACTS.map((x) => L.timeIn[x] / L.dur).sort((x, y) => y - x); return t[0] >= V - 1e-6 && t[1] >= S - 1e-6; };

/** Enveloppe : vise la paire (si `pair`), multiplie par k l'Héritage de la vie qui l'a formée, compte les vies. */
function wrap(p: Profile, pair: [ActId, ActId] | null, log: { lives: number; ok: number; passive: number }): Profile {
  let cur: LifeState | null = null;
  return {
    ...p,
    activity(s, c) {
      const L = s.life!;
      cur = L;
      if (pair && c.t >= from && s.unlocked.includes(pair[0]) && s.unlocked.includes(pair[1])) {
        const x = smartPick(s, L, pair[0], pair[1]);
        if (x) return x;
      }
      return p.activity(s, c);
    },
    succession(s, c) {
      const L = cur;
      if (L && s.succession && c.t >= from) {
        log.lives++;
        if (formedAny(L)) log.passive++;
        if (pair && formed(L, pair[0], pair[1])) { log.ok++; s.succession.legacyGain = Math.floor(s.succession.legacyGain * k); }
      }
      cur = null;
      p.succession(s, c);
    },
  };
}

const mean = (xs: number[], d = 1) => Number(stats(xs).mean.toFixed(d));
const out: Record<string, any> = { tag, k, seeds: arg('seeds', '1-40'), dt, refs: {}, rows: [] };
const md = [`# ${tag} — Héritage ×${k} (dt ${dt}, ${seeds.length} graines, 6 h, visée réaliste dès h2)`, '',
  '| vocation | 2e | Notaire | paires formées | Δ ⚜️ (%) | Δ gén. |', '|---|---|---|---|---|---|'];
for (const [a, p] of BASES) {
  const rl = { lives: 0, ok: 0, passive: 0 };
  const ref: BalResult[] = seeds.map((seed) => runBal({ profile: wrap(p, null, rl), seed, hours, dt }));
  out.refs[a] = { legacy: mean(ref.map((r) => r.legacyTotal), 0), passive: Number((rl.passive / Math.max(1, rl.lives)).toFixed(3)) };
  for (const b of ACTS.filter((x) => x !== a)) {
    const log = { lives: 0, ok: 0, passive: 0 };
    const res = seeds.map((seed) => runBal({ profile: wrap(p, [a, b], log), seed, hours, dt }));
    const notaire = [a, b].includes('commercer') && [a, b].includes('etudier');
    const row = { a, b, notaire, ok: Number((log.ok / Math.max(1, log.lives)).toFixed(3)),
      dleg: mean(res.map((r, i) => (r.legacyTotal / Math.max(1, ref[i].legacyTotal) - 1) * 100)), dgen: mean(res.map((r, i) => r.gen - ref[i].gen)) };
    out.rows.push(row);
    md.push(`| ${a} | ${b} | ${notaire ? 'oui' : ''} | ${(row.ok * 100).toFixed(0)} % | ${row.dleg} | ${row.dgen} |`);
  }
}
md.push('', '| base sans visée | ⚜️ 6 h | vies 50 + 30 sans viser (K1) |', '|---|---|---|');
for (const [a, x] of Object.entries(out.refs) as [string, any][]) md.push(`| ${a} | ${x.legacy} | ${(x.passive * 100).toFixed(1)} % |`);
mkdirSync('lab/balance/compagnonnage/results', { recursive: true });
writeFileSync(`lab/balance/compagnonnage/results/${tag}.json`, JSON.stringify(out, null, 1));
writeFileSync(`lab/balance/compagnonnage/results/${tag}.md`, md.join('\n') + '\n');
console.log(md.join('\n'));
