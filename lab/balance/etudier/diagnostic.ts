// Diagnostic d'Étudier : la vocation pure est-elle un piège du JEU ou du PROFIL simulé ? (aucune modification du jeu)
//   node --import ./lab/balance/register.mjs lab/balance/etudier/diagnostic.ts --tag=E0 [--seeds=1-40] [--hours=6] [--dt=0.5]
// Variantes d'un joueur de vocation Étudier (toutes gardent Étudier ≥ 50 % de la vie après 30 min, comme mono-etudier) :
//  - base       : mono-etudier (repli sur Commercer/Récolter quand l'Or manque, achats gourmands) ;
//  - reserve-R  : base, mais n'achète pas de bâtiment si l'Or restant tomberait sous R s de consommation d'Étudier ;
//  - part-X     : Étudier jusqu'à X % de la vie ; quand l'Or ne couvre pas 5 s, produit de l'Or (Commercer, sinon Récolter) ;
//                 une fois le quota atteint, Commercer (stock pour la suite) ; achats gourmands ;
//  - part-X+res : part-X avec la réserve d'Or de 60 s.
// Critères (fixés AVANT les mesures, lab/balance/etudier/RESULTATS.md) :
//  D1 — défaut du JEU si la meilleure variante part-X (X < 1) dépasse encore de > 10 % d'Héritage la meilleure variante
//       « vocation pure » (base ou reserve-R) ; défaut du PROFIL si l'écart tombe ≤ 5 % ; entre les deux : mixte.
//  D2 — Étudier faible si sa meilleure variante fait < 0,85 × la médiane d'Héritage des trois autres mono-vocations.
import { mkdirSync, writeFileSync } from 'node:fs';
import { ACT, type ActId } from '../../../src/engine/data';
import { consumeScaleFor, lifePower } from '../../../src/engine/sim';
import type { GameState } from '../../../src/engine/state';
import { PROFILES, arg, parseSeeds, runBal, stats, type BalResult } from '../lib';
import type { Ctx, Profile } from '../../sim/profiles';

const tag = arg('tag', 'E0')!;
const seeds = parseSeeds(arg('seeds', '1-40')!);
const hours = Number(arg('hours', '6'));
const dt = Number(arg('dt', '0.5'));
const base = PROFILES['mono-etudier'];
const orRate = (s: GameState) => (s.life ? ACT.etudier.consume.or! * consumeScaleFor(lifePower(s.life, s.hero, 'etudier')) : 1);

/** Statistique de famine : part des décisions « Étudier voulu » où l'Or ne couvre pas 1 s. */
interface Diag { want: number; starved: number; }

function withReserve(p: Profile, sec: number): Profile {
  return {
    ...p,
    buy(s: GameState, c: Ctx) {
      const keep = Math.min(s.res.or, orRate(s) * sec);
      s.res.or -= keep;
      try { p.buy(s, c); } finally { s.res.or += keep; }
    },
  };
}

function part(X: number, d: Diag): Profile {
  return {
    ...base,
    activity(s: GameState, c: Ctx): ActId {
      if (c.t < 1800 || !s.unlocked.includes('etudier')) return base.activity(s, c);
      const L = s.life!;
      const prodOr = (): ActId => (s.res.vivres >= 5 && s.unlocked.includes('commercer') ? 'commercer' : 'cultiver');
      if (L.timeIn.etudier < X * L.dur + 1) {
        const left = L.dur - L.t, need = X * L.dur + 1 - L.timeIn.etudier;
        d.want++;
        if (s.res.or >= orRate(s) * 5) return 'etudier';
        d.starved++;
        return left - need > 0.5 ? prodOr() : 'etudier';
      }
      return prodOr();
    },
  };
}

function wrapStarve(p: Profile, d: Diag): Profile {
  return { ...p, activity(s, c) { const a = p.activity(s, c); if (c.t >= 1800 && s.unlocked.includes('etudier')) { d.want++; if (a !== 'etudier' || s.res.or < orRate(s)) d.starved++; } return a; } };
}

const m = (xs: number[], dd = 3) => Number(stats(xs).mean.toFixed(dd));
const variants: [string, (d: Diag) => Profile][] = [
  ['base', (d) => wrapStarve(base, d)],
  ['reserve-30', (d) => wrapStarve(withReserve(base, 30), d)],
  ['reserve-60', (d) => wrapStarve(withReserve(base, 60), d)],
  ['reserve-120', (d) => wrapStarve(withReserve(base, 120), d)],
  ...[0.5, 0.6, 0.7, 0.8, 0.9].map((X) => [`part-${X * 100}`, (d: Diag) => part(X, d)] as [string, (d: Diag) => Profile]),
  ...[0.5, 0.7].map((X) => [`part-${X * 100}+res`, (d: Diag) => withReserve(part(X, d), 60)] as [string, (d: Diag) => Profile]),
];
const out: Record<string, any> = { tag, seeds: arg('seeds', '1-40'), hours, dt, variants: {}, others: {} };
const md = [`# ${tag} — diagnostic d'Étudier (dt ${dt}, ${seeds.length} graines, ${hours} h)`, '',
  '| variante | ⚜️ 6 h (moy.) | Δ ⚜️ vs base | log10 valeur | gén. | part Étudier | Étudier voulu mais Or manquant | bâtiments Comptoir / Bibliothèque |', '|---|---|---|---|---|---|---|---|'];
let ref: BalResult[] = [];
for (const [name, mk] of variants) {
  const d: Diag = { want: 0, starved: 0 };
  const res = seeds.map((seed) => runBal({ profile: mk(d), seed, hours, dt }));
  if (name === 'base') ref = res;
  const row = {
    legacy: m(res.map((r) => r.legacyTotal), 0), dleg: m(res.map((r, i) => (r.legacyTotal / Math.max(1, ref[i].legacyTotal) - 1) * 100), 1),
    log10: m(res.map((r) => r.grossLog10), 2), gen: m(res.map((r) => r.gen), 0), etu: m(res.map((r) => r.heroActShare.etudier), 2),
    starved: d.want ? Number((d.starved / d.want).toFixed(2)) : 0,
    comptoir: m(res.map((r) => r.buildings.comptoir ?? 0), 1), biblio: m(res.map((r) => r.buildings.bibliotheque ?? 0), 1),
  };
  out.variants[name] = row;
  md.push(`| ${name} | ${row.legacy} | ${row.dleg} % | ${row.log10} | ${row.gen} | ${row.etu} | ${(row.starved * 100).toFixed(0)} % | ${row.comptoir} / ${row.biblio} |`);
  console.error(md[md.length - 1]);
}
md.push('', '| autre mono-vocation | ⚜️ 6 h (moy.) | log10 valeur |', '|---|---|---|');
for (const a of ['cultiver', 'commercer', 'mediter']) {
  const res = seeds.map((seed) => runBal({ profile: 'mono-' + a, seed, hours, dt }));
  out.others[a] = { legacy: m(res.map((r) => r.legacyTotal), 0), log10: m(res.map((r) => r.grossLog10), 2) };
  md.push(`| mono-${a} | ${out.others[a].legacy} | ${out.others[a].log10} |`);
}
mkdirSync('lab/balance/etudier/results', { recursive: true });
writeFileSync(`lab/balance/etudier/results/${tag}.json`, JSON.stringify(out, null, 1));
writeFileSync(`lab/balance/etudier/results/${tag}.md`, md.join('\n') + '\n');
console.log(md.join('\n'));
