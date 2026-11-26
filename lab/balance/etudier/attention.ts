// Coût en attention d'un Érudit : changements d'activité par vie (life.st.sw) selon la façon de jouer. Aucune modification du jeu.
//   node --import ./lab/balance/register.mjs lab/balance/etudier/attention.ts [--seeds=1-20] [--dt=0.5]
// - afk-etudier : après 30 min, Étudier toute la vie, sans jamais changer (joueur absent entre deux successions) ;
// - mono-etudier : repli au coup par coup quand l'Or manque ;
// - blocs-B : Étudier, et quand l'Or manque, Commercer (sinon Récolter) au moins B s d'affilée avant de revenir ; quota d'Étudier 55 %.
// Référence AFK des autres vocations : mono-cultiver (Récolter ne consomme rien : zéro changement nécessaire).
import { writeFileSync } from 'node:fs';
import type { ActId } from '../../../src/engine/data';
import type { GameState, LifeState } from '../../../src/engine/state';
import { PROFILES, arg, parseSeeds, runBal, stats } from '../lib';
import type { Ctx, Profile } from '../../sim/profiles';

const seeds = parseSeeds(arg('seeds', '1-20')!);
const dt = Number(arg('dt', '0.5'));
const base = PROFILES['mono-etudier'];
const m = (xs: number[], d = 1) => Number(stats(xs).mean.toFixed(d));

function counting(p: Profile, lives: Set<LifeState>): Profile {
  return { ...p, activity(s, c) { if (c.t >= 1800) lives.add(s.life!); return p.activity(s, c); } };
}
const afk: Profile = { ...base, activity: (s, c) => (c.t < 1800 || !s.unlocked.includes('etudier') ? base.activity(s, c) : 'etudier') };
function blocs(B: number): Profile {
  return {
    ...base,
    activity(s: GameState, c: Ctx): ActId {
      if (c.t < 1800 || !s.unlocked.includes('etudier')) return base.activity(s, c);
      const L = s.life!;
      if (c.mem.until && c.t < c.mem.until && c.mem.life === L) return c.mem.act;
      const or = s.res.or >= 5;
      if (L.timeIn.etudier < 0.55 * L.dur + 1 && or) return 'etudier';
      const a: ActId = s.res.vivres >= 5 && s.unlocked.includes('commercer') ? 'commercer' : 'cultiver';
      c.mem.until = c.t + B; c.mem.act = a; c.mem.life = L;
      return a;
    },
  };
}
const variants: [string, Profile][] = [['afk-etudier', afk], ['mono-etudier', base], ['blocs-5', blocs(5)], ['blocs-15', blocs(15)], ['blocs-30', blocs(30)], ['mono-cultiver (réf.)', PROFILES['mono-cultiver']]];
const md = [`# Attention d'un Érudit (dt ${dt}, ${seeds.length} graines, 6 h) [SIMULÉ]`, '', '| façon de jouer | ⚜️ 6 h | changements d\'activité par vie (moy.) | part Étudier |', '|---|---|---|---|'];
for (const [name, p] of variants) {
  const lives = new Set<LifeState>();
  const res = seeds.map((seed) => runBal({ profile: counting(p, lives), seed, hours: 6, dt }));
  const sw = [...lives].filter((L) => L.t >= L.dur - 1e-6).map((L) => L.st?.sw ?? 0);
  md.push(`| ${name} | ${m(res.map((r) => r.legacyTotal), 0)} | ${m(sw)} | ${m(res.map((r) => r.heroActShare.etudier), 2)} |`);
}
writeFileSync('lab/balance/etudier/results/attention.md', md.join('\n') + '\n');
console.log(md.join('\n'));
