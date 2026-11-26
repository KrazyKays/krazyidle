// Compagnonnage — phase 1 : coût de la visée contre un joueur concentré (mono-<vocation>) et récompense simulée
// EN MÉMOIRE (le jeu n'est pas modifié : la récompense est versée par l'enveloppe du profil).
//   node --import ./lab/balance/register.mjs lab/balance/compagnonnage/recompense.ts --tag=C1 [--seeds=1-40] [--n=0,15,30,60] [--from=2]
// Récompense testée (modèle R-base) : N secondes du débit de la vie EN COURS hors événements
// (life.baseValue / life.t au moment où la paire se forme), répartie À VALEUR ÉGALE entre les deux ressources
// de la paire (RES_INFO.value). Versée une fois par vie, ne compte pas dans life.value (pas d'Héritage direct).
import { mkdirSync, writeFileSync } from 'node:fs';
import { ACT, ACTS, RES_INFO, type ActId, type ResId } from '../../../src/engine/data';
import type { GameState, LifeState } from '../../../src/engine/state';
import { PROFILES, arg, parseSeeds, runBal, stats, type BalResult } from '../lib';
import type { Profile } from '../../sim/profiles';

const tag = arg('tag', 'C1')!;
const seeds = parseSeeds(arg('seeds', '1-40')!);
const hours = Number(arg('hours', '6'));
const dt = Number(arg('dt', '0.5'));
const from = Number(arg('from', '2')) * 3600;
const Ns = arg('n', '0,15,30,60')!.split(',').map(Number);
const bases = arg('bases', ACTS.join(','))!.split(',') as ActId[];
const V = 0.5, S = Number(arg('share', '0.3'));
/** --legacy=1 : la récompense compte aussi dans life.value (donc dans l'Héritage de la vie), variante R-héritage. */
const toLegacy = arg('legacy', '0') === '1';
const resOf = (a: ActId) => Object.keys(ACT[a].produce)[0] as ResId;

function targeted(p: Profile, pair: [ActId, ActId], N: number, log: { ok: number; lives: Set<LifeState>; reward: number[]; lifeVal: number[] }): Profile {
  const paid = new WeakSet<LifeState>();
  return {
    ...p,
    activity(s: GameState, c) {
      const L = s.life!;
      const [a, b] = pair;
      if (c.t >= from && s.unlocked.includes(a) && s.unlocked.includes(b)) {
        log.lives.add(L);
        if (!paid.has(L) && L.timeIn[a] >= V * L.dur - 1e-6 && L.timeIn[b] >= S * L.dur - 1e-6) {
          paid.add(L); log.ok++;
          const R = N * (L.baseValue ?? L.value) / Math.max(1, L.t);
          for (const act of pair) { const r = resOf(act); const q = R / 2 / RES_INFO[r].value; s.res[r] += q; s.totalEver[r] += q; }
          if (toLegacy) L.value += R;
          log.reward.push(R); log.lifeVal.push(L.baseValue ?? L.value);
        }
        if (L.timeIn[a] < V * L.dur + 0.5) return a;
        if (L.timeIn[b] < S * L.dur + 0.5) return b;
      }
      return p.activity(s, c);
    },
  };
}

const m = (xs: number[], d = 3) => Number(stats(xs).mean.toFixed(d));
const out: Record<string, any> = { tag, toLegacy, seeds: arg('seeds'), hours, dt, from: from / 3600, Ns, rows: [] };
const md = [`# ${tag} — coût de la visée et récompense R-base (dt ${dt}, ${seeds.length} graines, ${hours} h, visée dès h${from / 3600}, 2e à ${S * 100} %${toLegacy ? ', récompense comptée dans l\'Héritage' : ''})`, '',
  '| base | 2e vocation | N (s) | vies visées réussies | récompense ÷ valeur de la vie | Δ ⚜️ (%) | Δ log10 valeur brute | Δ gén. |', '|---|---|---|---|---|---|---|---|'];
for (const a of bases) {
  const pid = 'mono-' + a;
  const ref: BalResult[] = seeds.map((seed) => runBal({ profile: pid, seed, hours, dt }));
  for (const b of ACTS.filter((x) => x !== a)) for (const N of Ns) {
    const log = { ok: 0, lives: new Set<LifeState>(), reward: [] as number[], lifeVal: [] as number[] };
    const res = seeds.map((seed) => runBal({ profile: targeted(PROFILES[pid], [a, b], N, log), seed, hours, dt }));
    const row = {
      base: pid, second: b, N, okShare: log.lives.size ? log.ok / log.lives.size : 0,
      rewardShare: log.reward.length ? m(log.reward.map((r, i) => r / Math.max(1, log.lifeVal[i])), 2) : 0,
      dleg: m(res.map((r, i) => (r.legacyTotal / Math.max(1, ref[i].legacyTotal) - 1) * 100), 1),
      dlog: m(res.map((r, i) => r.grossLog10 - ref[i].grossLog10)),
      dgen: m(res.map((r, i) => r.gen - ref[i].gen), 1),
    };
    out.rows.push(row);
    md.push(`| ${pid} | ${b} | ${N} | ${(row.okShare * 100).toFixed(0)} % | ${row.rewardShare} | ${row.dleg} | ${row.dlog} | ${row.dgen} |`);
    console.error(md[md.length - 1]);
  }
}
mkdirSync('lab/balance/compagnonnage/results', { recursive: true });
writeFileSync(`lab/balance/compagnonnage/results/${tag}.json`, JSON.stringify(out, null, 1));
writeFileSync(`lab/balance/compagnonnage/results/${tag}.md`, md.join('\n') + '\n');
console.log(md.join('\n'));
