// Compagnonnage — C5 : visée réaliste avec le VRAI moteur (COMP-1 : Héritage ×k, lot, échange d'expérience, boost de l'Écho).
//   [BAL_PATCH=… COMPAGNON_ECHO] node --import ./lab/balance/register.mjs lab/balance/compagnonnage/reel.ts --tag=C5-e0.15 [--seeds=1-40] [--dt=0.5]
// Pour comparer à C4, l'amélioration est offerte à h2 aux deux bras (référence et visée) : seul l'effet de la visée est mesuré.
import { mkdirSync, writeFileSync } from 'node:fs';
import { ACT, ACTS, COMPAGNON_ECHO, PAIR_DEF, type ActId, type ResId } from '../../../src/engine/data';
import { pairId } from '../../../src/engine/game';
import { consumeScaleFor, lifePower } from '../../../src/engine/sim';
import type { GameState, LifeState } from '../../../src/engine/state';
import { PROFILES, arg, parseSeeds, runBal, stats, type BalResult } from '../lib';
import type { Ctx, Profile } from '../../sim/profiles';

const tag = arg('tag', `C5-e${COMPAGNON_ECHO}`)!;
const seeds = parseSeeds(arg('seeds', '1-40')!);
const dt = Number(arg('dt', '0.5'));
const from = 2 * 3600, V = 0.5, S = 0.3;
const INPUT: Partial<Record<ActId, ResId>> = { commercer: 'vivres', etudier: 'or' };
const orFor = (s: GameState): ActId => (s.res.vivres >= 5 && s.unlocked.includes('commercer') ? 'commercer' : 'cultiver');
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
function wrap(p: Profile, pair: [ActId, ActId] | null, log: { lives: Set<LifeState>; comp: Set<LifeState>; echoComp: number[] }): Profile {
  return {
    ...p,
    activity(s, c) {
      if (c.t >= from) s.upgrades.compagnonnage = 1;
      const L = s.life!;
      if (c.t >= from) { log.lives.add(L); }
      if (pair && c.t >= from && s.unlocked.includes(pair[0]) && s.unlocked.includes(pair[1])) { const x = smartPick(s, L, pair[0], pair[1]); if (x) return x; }
      return p.activity(s, c);
    },
    succession(s, c) {
      p.succession(s, c);
      if (c.t >= from) log.echoComp.push(s.echoes.filter((e) => e.comp).length / Math.max(1, s.echoes.length));
    },
  };
}
const mean = (xs: number[], d = 1) => Number(stats(xs).mean.toFixed(d));
const out: Record<string, any> = { tag, echo: COMPAGNON_ECHO, seeds: arg('seeds', '1-40'), dt, rows: [] };
const md = [`# ${tag} — vrai moteur, boost de l'Écho ${COMPAGNON_ECHO} (dt ${dt}, ${seeds.length} graines, 6 h, visée dès h2)`, '',
  '| vocation | 2e | naturelle | paires formées | Δ ⚜️ (%) | Δ log10 valeur | part d\'Échos compagnons (crypte) |', '|---|---|---|---|---|---|---|'];
for (const [a, p] of BASES) {
  const rl = { lives: new Set<LifeState>(), comp: new Set<LifeState>(), echoComp: [] as number[] };
  const ref: BalResult[] = seeds.map((seed) => runBal({ profile: wrap(p, null, rl), seed, hours: 6, dt }));
  for (const b of ACTS.filter((x) => x !== a)) {
    const log = { lives: new Set<LifeState>(), comp: new Set<LifeState>(), echoComp: [] as number[] };
    const res = seeds.map((seed) => runBal({ profile: wrap(p, [a, b], log), seed, hours: 6, dt }));
    const id = pairId(a, b);
    const ok = [...log.lives].filter((L) => L.comp === id).length / Math.max(1, log.lives.size);
    const row = { a, b, naturel: !!PAIR_DEF[id].naturel, ok: Number(ok.toFixed(3)),
      dleg: mean(res.map((r, i) => (r.legacyTotal / Math.max(1, ref[i].legacyTotal) - 1) * 100)),
      dlog: mean(res.map((r, i) => r.grossLog10 - ref[i].grossLog10), 3), echoComp: mean(log.echoComp, 2) };
    out.rows.push(row);
    md.push(`| ${a} | ${b} | ${row.naturel ? 'oui' : ''} | ${(ok * 100).toFixed(0)} % | ${row.dleg} | ${row.dlog} | ${row.echoComp} |`);
  }
}
const v = out.rows.map((r: any) => r.dleg);
const bad = out.rows.filter((r: any) => (r.naturel ? r.dleg < 0 || r.dleg > 15 : r.dleg < 3 || r.dleg > 15));
md.push('', `Hors bornes : ${bad.length ? bad.map((r: any) => `${r.a} → ${r.b} (${r.dleg})`).join(', ') : 'aucune'} ; écart ${(Math.max(...v) - Math.min(...v)).toFixed(1)} points.`);
mkdirSync('lab/balance/compagnonnage/results', { recursive: true });
writeFileSync(`lab/balance/compagnonnage/results/${tag}.json`, JSON.stringify(out, null, 1));
writeFileSync(`lab/balance/compagnonnage/results/${tag}.md`, md.join('\n') + '\n');
console.log(md.join('\n'));
