// TERRE-5 : calibrage des consignes de Récolter (Semer, Équilibre, Battue) — critères K1 à K4 fixés avant
// mesure dans lab/balance/terre/RESULTATS.md. Domaine seul, héros (+ Échos en Équilibre), 600 s.
// node --import ./lab/sim/register.mjs lab/balance/terre/consignes.ts [--grid] [--dt=0.1]
import { ECO_EQ, POSTURE, ecoStep, harmonyMult, newEco, type Posture } from '../../../src/engine/ecosystem';
import { runActivity, type SimCtx } from '../../../src/engine/sim';

type Strat = { id: string; pick: (g: number, cur: Posture) => Posture };
const fixed = (p: Posture): Strat => ({ id: p, pick: () => p });
/** Battue jusqu'à ce que le Gibier tombe sous lo·G_éq, puis `rest` jusqu'à ce qu'il remonte à hi·G_éq. */
const rot = (rest: Posture, lo: number, hi: number): Strat => ({
  id: `${rest === 'semer' ? 'S' : 'E'}↔B ${lo}/${hi}`,
  pick: (g, cur) => (cur === 'battue' ? (g < lo ? rest : 'battue') : g >= hi ? 'battue' : rest),
});
const STRATS: Strat[] = [fixed('semer'), fixed('equilibre'), fixed('battue')];
for (const rest of ['semer', 'equilibre'] as Posture[]) for (const lo of [0.4, 0.5, 0.7, 0.85]) for (const hi of [0.8, 0.9, 1.0, 1.2, 1.4]) if (hi > lo) STRATS.push(rot(rest, lo, hi));

function run(p: number, echoes: number, st: Strat, dt: number, secs = 600) {
  const eco = newEco();
  const res = { vivres: 0, or: 0, savoir: 0, essence: 0 };
  let hero = 0, all = 0;
  const ctx: SimCtx = {
    res, eco, prodMult: () => harmonyMult(eco), ecoImpactMult: 1, posture: 'equilibre',
    onProduce: (r, a, fromLife) => { if (r !== 'vivres') return; all += a; if (fromLife) hero += a; },
  };
  for (let t = 0; t < secs - 1e-9; t += dt) {
    ctx.posture = st.pick(eco.G / ECO_EQ.G, ctx.posture!);
    ecoStep(eco, dt);
    for (let i = 0; i < echoes; i++) runActivity(ctx, 'cultiver', p, 0.6, dt, false);
    runActivity(ctx, 'cultiver', p, 1, dt, true);
  }
  return { hero: hero / secs / p, all: all / secs / p };
}

const SCEN: [number, number][] = [[1, 0], [5, 0], [20, 0], [1, 4], [5, 4], [20, 4]];

function evaluate(dt: number) {
  const rows = SCEN.map(([p, n]) => {
    const r = Object.fromEntries(STRATS.map((s) => [s.id, run(p, n, s, dt)]));
    const eq = r.equilibre;
    const rots = STRATS.slice(3).map((s) => s.id);
    const best = rots.reduce((a, b) => (r[b].all > r[a].all ? b : a));
    const bestHero = rots.reduce((a, b) => (r[b].hero > r[a].hero ? b : a));
    return {
      p, n,
      semer: r.semer.all / eq.all, battue: r.battue.all / eq.all,
      best, gainAll: r[best].all / eq.all - 1,
      bestHero, gainHero: r[bestHero].hero / eq.hero - 1,
    };
  });
  const k1 = rows.every((x) => x.semer <= 1.03 && x.battue <= 1.03);
  const k2 = rows.every((x) => (x.n === 0 ? x.gainHero >= 0.1 && x.gainHero <= 0.35 : x.gainAll >= 0.03));
  const k3 = rows.every((x) => x.battue <= 0.85);
  return { rows, k1, k2, k3 };
}

const args = process.argv.slice(2);
const dt = Number(args.find((a) => a.startsWith('--dt='))?.slice(5) ?? 0.1);
const pct = (x: number) => `${x >= 0 ? '+' : ''}${(x * 100).toFixed(0)} %`;
if (args.includes('--grid')) {
  const out: string[] = [];
  for (const sy of (process.env.SY ?? '0.5,0.7').split(',').map(Number)) for (const sf of (process.env.SF ?? '3,5,8').split(',').map(Number)) for (const by of (process.env.BY ?? '2.5,3,3.5,4').split(',').map(Number)) for (const bg of (process.env.BG ?? '2,3,4').split(',').map(Number)) {
    Object.assign(POSTURE, { semerYield: sy, semerFlore: sf, battueYield: by, battueGibier: bg });
    const e = evaluate(dt);
    const gh = e.rows.filter((x) => x.n === 0).map((x) => pct(x.gainHero)).join(' ');
    const ga = e.rows.filter((x) => x.n === 4).map((x) => pct(x.gainAll)).join(' ');
    const bt = Math.max(...e.rows.map((x) => x.battue)).toFixed(2), se = Math.max(...e.rows.map((x) => x.semer)).toFixed(2);
    out.push(`${e.k1 && e.k2 && e.k3 ? '✅' : '  '} S ${sy}/${sf} B ${by}/${bg} | K1 ${e.k1 ? 'ok' : 'x '} K2 ${e.k2 ? 'ok' : 'x '} K3 ${e.k3 ? 'ok' : 'x '} | héros seul ${gh} | +4 Échos ${ga} | max Battue ${bt} Semer ${se}`);
  }
  console.log(out.join('\n'));
} else {
  const e = evaluate(dt);
  console.log(`POSTURE ${JSON.stringify(POSTURE)} dt ${dt}`);
  console.log('| puissance | Échos | Semer fixe | Battue fixe | meilleure rotation (tous) | gain tous | meilleure rotation (héros) | gain héros |');
  console.log('|---|---|---|---|---|---|---|---|');
  for (const x of e.rows) console.log(`| ${x.p} | ${x.n} | ${x.semer.toFixed(2)} | ${x.battue.toFixed(2)} | ${x.best} | ${pct(x.gainAll)} | ${x.bestHero} | ${pct(x.gainHero)} |`);
  console.log(`K1 ${e.k1} · K2 ${e.k2} · K3 ${e.k3}`);
}
