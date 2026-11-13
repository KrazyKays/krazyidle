// Noyau de simulation partagé par la partie principale, les Échos et le Défi du jour.
import { ACT, ACTS, RES_INFO, TRAIT, VOCATION_BONUS, skillMult, xpToNext, type ActId, type Mods, type ResId } from './data';
import { TROPHY_OR, ecoFactor, ecoImpact, ecoPressure, trophyFactor, type Eco } from './ecosystem';
import type { Hero, LifeState } from './state';

export interface SimCtx {
  res: Record<ResId, number>;
  eco: Eco;
  prodMult: (a: ActId) => number;
  ecoImpactMult: number;
  onProduce?: (r: ResId, amt: number, fromLife: boolean, act: ActId) => void;
}

export const ECHO_ECO_STRENGTH = 0.6;

/** Exécute une activité pendant dt. Retourne la fraction effectivement réalisée (ressources consommées). */
export function runActivity(ctx: SimCtx, act: ActId, power: number, ecoStrength: number, dt: number, fromLife: boolean): number {
  const def = ACT[act];
  let frac = 1;
  const consumeScale = Math.sqrt(Math.max(power, 0.01));
  for (const r in def.consume) {
    const need = def.consume[r as ResId]! * consumeScale * dt;
    if (need > 0) frac = Math.min(frac, ctx.res[r as ResId] / need);
  }
  if (frac <= 0) return 0;
  frac = Math.min(1, frac);
  for (const r in def.consume) {
    const need = def.consume[r as ResId]! * consumeScale * dt * frac;
    ctx.res[r as ResId] = Math.max(0, ctx.res[r as ResId] - need);
  }
  const base = ctx.prodMult(act) * power * frac * dt;
  const mult = base * ecoFactor(act, ctx.eco);
  for (const r in def.produce) {
    const amt = def.produce[r as ResId]! * mult;
    ctx.res[r as ResId] += amt;
    ctx.onProduce?.(r as ResId, amt, fromLife, act);
  }
  if (act === 'chasser') {
    const tro = TROPHY_OR * trophyFactor(ctx.eco) * base;
    if (tro > 0) {
      ctx.res.or += tro;
      ctx.onProduce?.('or', tro, fromLife, act);
    }
  }
  ecoImpact(ctx.eco, act, ecoStrength * ecoPressure(power) * frac * ctx.ecoImpactMult, dt);
  return frac;
}

export function sumMods(traitIds: string[]): Required<Omit<Mods, 'act'>> & { act: Record<ActId, number> } {
  const out = { all: 0, xp: 0, life: 0, echo: 0, eco: 0, start: 0, heirs: 0, inherit: 0, act: { cultiver: 0, chasser: 0, commercer: 0, etudier: 0, mediter: 0 } };
  for (const id of traitIds) {
    const m = TRAIT[id]?.mods;
    if (!m) continue;
    out.all += m.all ?? 0;
    out.xp += m.xp ?? 0;
    out.life += m.life ?? 0;
    out.echo += m.echo ?? 0;
    out.eco += m.eco ?? 0;
    out.start += m.start ?? 0;
    out.heirs += m.heirs ?? 0;
    out.inherit += m.inherit ?? 0;
    if (m.act) for (const a of ACTS) out.act[a] += m.act[a] ?? 0;
  }
  return out;
}

/** Puissance propre au héros (traits + vocation) pour une activité. */
export function heroActMult(hero: Pick<Hero, 'traits' | 'vocation'>, a: ActId): number {
  const m = sumMods(hero.traits);
  let x = Math.max(0.1, 1 + m.all + m.act[a]);
  if (hero.vocation && hero.vocation.act === a) x *= 1 + VOCATION_BONUS * hero.vocation.tier;
  return x;
}

export function lifePower(life: LifeState, hero: Pick<Hero, 'traits' | 'vocation'>, a: ActId): number {
  return skillMult(life.lvl[a]) * heroActMult(hero, a);
}

/** Avance la vie du héros de dt secondes. */
export function lifeTick(ctx: SimCtx, life: LifeState, hero: Pick<Hero, 'traits' | 'vocation'>, xpMult: number, dt: number) {
  const step = Math.min(dt, life.dur - life.t);
  if (step <= 0) return;
  const a = life.act;
  let p = 0;
  if (a) {
    p = lifePower(life, hero, a);
    const frac = runActivity(ctx, a, p, 1, step, true);
    life.xp[a] += step * xpMult * (0.25 + 0.75 * frac);
    while (life.xp[a] >= xpToNext(life.lvl[a])) {
      life.xp[a] -= xpToNext(life.lvl[a]);
      life.lvl[a]++;
    }
    life.timeIn[a] += step;
  }
  life.t += step;
  // Une entrée par seconde écoulée. On se base sur la longueur déjà enregistrée
  // (et non sur floor(t) avant le pas) : avec des pas de 0.1 s, t vaut souvent
  // 2.9999999999999996, ce qui faisait enregistrer certaines secondes deux fois.
  const after = Math.floor(life.t + 1e-6);
  while (life.rec.length < after) {
    life.rec.push(a ? ACTS.indexOf(a) : -1);
    life.pow.push(a ? Math.round(p * 1000) / 1000 : 0);
  }
}

export function valueOf(r: ResId, amt: number) {
  return amt * RES_INFO[r].value;
}
