// Modèle analytique d'Échos de Lignée (formules du moteur, sans profil de joueur).
//   node --import ./lab/balance/register.mjs lab/balance/analytic.ts > lab/balance/results/analytic.md
import { ACT, ACTS, BUILDINGS, LEGACY, RES_INFO, TRAIT, VOCATION_BONUS, bMult, legacyCost, skillMult, xpToNext, type ActId, type ResId } from '../../src/engine/data';
import { genHeirs, legacyFor } from '../../src/engine/game';
import { Rng } from '../../src/engine/rng';
import { newGame } from '../../src/engine/state';
import { f } from './lib';

const out: string[] = [];
const p = (s = '') => out.push(s);

// ---------------------------------------------------------------------------
p('## A. Rendement des activités (valeur/s) — runActivity, data.ts:29-55, sim.ts:19-62');
p();
p('Production brute = prodMult × puissance × coef ; consommation = coef_conso × √puissance (la consommation **ne suit pas** prodMult : bâtiments, Prospérité, Harmonie, événements).');
p();
const coef = (a: ActId) => Object.entries(ACT[a].produce).reduce((s, [r, x]) => s + x! * RES_INFO[r as ResId].value, 0);
const cons = (a: ActId) => Object.entries(ACT[a].consume).reduce((s, [r, x]) => s + x! * RES_INFO[r as ResId].value, 0);
p('| activité | valeur brute / unité de puissance | conso. (valeur) × √p | facteur écologique | seuil de rentabilité (M=1) |');
p('|---|---|---|---|---|');
const eco: Record<ActId, string> = { cultiver: 'Flore/62,5 ∈ [0,2 ; 1,6]', chasser: 'Gibier/29 ∈ [0,05 ; 2,2] × vigueur [0,55 ; 1,13]', commercer: '1', etudier: '1', mediter: '1' };
for (const a of ACTS) {
  const c = coef(a), k = cons(a);
  p(`| ${a} | ${f(c, 2)} | ${f(k, 1)} | ${eco[a]} | ${k ? 'p > ' + f((k / c) ** 2, 2) : '—'} |`);
}
p();
p('Valeur nette par seconde selon la puissance p et le multiplicateur de production M (facteur écologique = 1) :');
p();
const Ms = [1, 10, 100];
const ps = [1, 3, 10, 100, 1000];
p(`| activité | ${Ms.flatMap((M) => ps.map((x) => `M=${M} p=${x}`)).join(' | ')} |`);
p(`|---|${Ms.flatMap(() => ps.map(() => '---')).join('|')}|`);
for (const a of ACTS) p(`| ${a} | ${Ms.flatMap((M) => ps.map((x) => f(M * coef(a) * x - cons(a) * Math.sqrt(x), 1))).join(' | ')} |`);
p();
p('Part de la consommation dans la valeur brute (conso / brut) :');
p();
p(`| activité | ${Ms.flatMap((M) => ps.map((x) => `M=${M} p=${x}`)).join(' | ')} |`);
p(`|---|${Ms.flatMap(() => ps.map(() => '---')).join('|')}|`);
for (const a of ['commercer', 'etudier'] as ActId[]) p(`| ${a} | ${Ms.flatMap((M) => ps.map((x) => f((100 * cons(a) * Math.sqrt(x)) / (M * coef(a) * x), 1) + ' %')).join(' | ')} |`);

// ---------------------------------------------------------------------------
p();
p('## B. Courbe de compétence (xpToNext = 5·1,3^n, skillMult = 1 + 0,25n + 0,01n²) — data.ts:66-67');
p();
function lifeCurve(dur: number, xpm: number, start = 0) {
  let lvl = start, xp = 0, sum = 0;
  const dt = 0.1;
  for (let t = 0; t < dur - 1e-9; t += dt) {
    xp += dt * xpm;
    while (xp >= xpToNext(lvl)) { xp -= xpToNext(lvl); lvl++; }
    sum += skillMult(lvl) * dt;
  }
  return { lvl, mean: sum / dur, end: skillMult(lvl) };
}
p('| durée de vie (s) | xp ×1 : niveau final · skillMult moyen | xp ×1,25 (Curieux) | xp ×1,6 (Génie) | xp ×2,24 (Élu+Génie… ×1,4×1,6) | départ niv. 5 (Éveil max) |');
p('|---|---|---|---|---|---|');
for (const d of [60, 90, 120, 180, 240]) {
  const c = (x: number, s = 0) => { const r = lifeCurve(d, x, s); return `${r.lvl} · ${f(r.mean)}`; };
  p(`| ${d} | ${c(1)} | ${c(1.25)} | ${c(1.6)} | ${c(2.24)} | ${c(1, 5)} |`);
}
const r60 = lifeCurve(60, 1).mean, r180 = lifeCurve(180, 1).mean;
p();
p(`Moyenne de puissance d'une vie de 180 s vs 60 s (xp ×1, départ 0) : ×${f(r180 / r60)} (GDD 2.2 annonce ≈ +50 %).`);
p(`Niveau atteint ≈ log(1 + 0,06·t·xp)/log(1,3) : le niveau ne croît que logarithmiquement avec le temps et l'XP.`);

// ---------------------------------------------------------------------------
p();
p('## C. Bâtiments : coût et gain marginal (bMult = (1 + 0,25·niv)·2^⌊niv/10⌋) — data.ts:165-182, game.ts:525-529');
p();
p('| bâtiment | coût niv. 0 (valeur) | croissance | coût niv. 10 | coût niv. 20 | gain du niv. 9→10 | gain 10→11 | gain 19→20 | gain 29→30 | Δcoût/Δlog(mult) moyen 0→30 |');
p('|---|---|---|---|---|---|---|---|---|---|');
const val = (c: Partial<Record<ResId, number>>) => Object.entries(c).reduce((s, [r, x]) => s + x! * RES_INFO[r as ResId].value, 0);
for (const b of BUILDINGS.filter((x) => !x.max)) {
  const cost = (l: number) => val(b.cost) * Math.pow(b.growth, l);
  const g = (l: number) => `×${f(bMult(l + 1, 0.25) / bMult(l, 0.25), 3)}`;
  p(`| ${b.id} | ${f(val(b.cost), 0)} | ${b.growth} | ${cost(10).toExponential(2)} | ${cost(20).toExponential(2)} | ${g(9)} | ${g(10)} | ${g(19)} | ${g(29)} | exposant coût : mult ∝ coût^${f(Math.log(bMult(30, 0.25)) / Math.log(cost(30) / cost(0)), 3)} |`);
}
p();
p('Le niveau 10 (et 20, 30) double le multiplicateur d\'un coup (×2,15 puis ×2,09) alors que les niveaux voisins rapportent ×1,07–1,03 : marches d\'escalier très marquées.');

// ---------------------------------------------------------------------------
p();
p('## D. Héritage : legacyFor = ⌊∛(v/20)⌋ (game.ts:115) et coûts (data.ts:197-211)');
p();
p('| valeur de la vie v | 1e2 | 1e3 | 1e4 | 1e5 | 1e6 | 1e7 | 1e8 |');
p('|---|---|---|---|---|---|---|---|');
p(`| ⚜️ gagnés | ${[2, 3, 4, 5, 6, 7, 8].map((e) => legacyFor(10 ** e)).join(' | ')} |`);
p();
p('Multiplier la valeur d\'une vie par 10 n\'apporte que ×2,15 d\'Héritage ; ×1000 pour ×10.');
p();
p('| amélioration | base | croissance | max | coût total jusqu\'au max (ou 15 niv.) | coût du niv. 10 |');
p('|---|---|---|---|---|---|');
for (const l of LEGACY) {
  const n = l.max ?? 15;
  let tot = 0;
  for (let i = 0; i < n; i++) tot += legacyCost(l, i);
  p(`| ${l.id} | ${l.base} | ${l.growth} | ${l.max ?? '∞'} | ${tot} | ${l.max && l.max <= 10 ? '—' : legacyCost(l, 10)} |`);
}
p();
p('Prospérité (×1,12 par niveau sur TOUTE la production, Échos compris) : coût ×1,45 par niveau. Mémoire du sang (+15 % additif sur la puissance des Échos, soit ×(1+0,15(n+1))/(1+0,15n), décroissant) : coût ×1,55.');
p();
p('| niveau n | coût Prospérité | gain Prospérité | coût Mémoire | gain Mémoire | gain par ⚜️ Prospérité | gain par ⚜️ Mémoire |');
p('|---|---|---|---|---|---|---|');
const pros = LEGACY.find((x) => x.id === 'prosperite')!, mem = LEGACY.find((x) => x.id === 'memoire')!;
for (const n of [0, 2, 5, 8, 10, 12, 14]) {
  const cp = legacyCost(pros, n), cm = legacyCost(mem, n), gm = (1 + 0.15 * (n + 1)) / (1 + 0.15 * n);
  p(`| ${n} | ${cp} | ×1,12 | ${cm} | ×${f(gm, 3)} | ${f((Math.log(1.12) / cp) * 1000, 2)} ‰ log/⚜️ | ${f((Math.log(gm) / cm) * 1000, 2)} ‰ log/⚜️ |`);
}

// ---------------------------------------------------------------------------
p();
p('## E. Génétique (Monte-Carlo sur genHeirs réel, game.ts:399-462)');
p();
p('### E1. Mutations par héritier selon Bonne étoile (formule game.ts:435-441)');
p();
p('| Bonne étoile | mutations/héritier | P(Commun) | P(Rare) | P(Épique) | P(Légendaire) | P(≥1 Légendaire / succession, 3 héritiers) | idem 6 héritiers |');
p('|---|---|---|---|---|---|---|---|');
for (const l of [0, 1, 3, 5]) {
  const w = [60 - 6 * l, 28 + 2 * l, 10 + 3 * l, 2 + l];
  const tot = w.reduce((a, b) => a + b, 0);
  const m = 0.85 + 0.25 + 0.04 * l;
  const pl = w[3] / tot;
  p(`| ${l} | ${f(m)} | ${f(w[0] / tot)} | ${f(w[1] / tot)} | ${f(w[2] / tot)} | ${f(pl, 3)} | ${f(1 - Math.pow(1 - pl, 3 * m), 3)} | ${f(1 - Math.pow(1 - pl, 6 * m), 3)} |`);
}
p();
p('### E2. Survie d\'un trait sélectionné (le joueur choisit toujours un héritier qui le porte)');
p();
p('Lignée simulée : le parent porte le trait ; à chaque succession on garde, s\'il existe, un héritier qui le porte (sinon la lignée le perd). 2 000 lignées × 200 générations, sans conjoint ni Bénédiction.');
p();
p('| trait | Sang fécond (héritiers) | Transmission | P(perte) / génération (régime usé) | générations médianes avant perte | P(encore là après 100 gén.) |');
p('|---|---|---|---|---|---|');
function survive(trait: string, sang: number, trans: number, N = 2000, G = 200) {
  const s = newGame(0, 1);
  s.upgrades = { sang, transmission: trans, etoile: 0 };
  const rng = new Rng(12345 + sang * 7 + trans);
  const lost: number[] = [];
  let alive100 = 0, lossLate = 0, nLate = 0;
  for (let i = 0; i < N; i++) {
    let hero = { ...s.hero, traits: [trait], wear: {} as Record<string, number>, vocation: null, gen: 1, spouse: undefined };
    let g = 0;
    for (; g < G; g++) {
      const heirs = genHeirs(s, hero as any, rng);
      const ok = heirs.filter((h) => h.traits.includes(trait));
      if (g >= 20) { nLate++; if (!ok.length) lossLate++; }
      if (!ok.length) break;
      hero = ok[0] as any;
    }
    lost.push(g);
    if (g >= 100) alive100++;
  }
  lost.sort((a, b) => a - b);
  return { pLate: nLate ? lossLate / nLate : NaN, med: lost[Math.floor(N / 2)], alive100: alive100 / N };
}
for (const t of ['elu', 'sang_dore', 'main_verte']) for (const [sang, tr] of [[0, 0], [3, 5]]) {
  const r = survive(t, sang, tr);
  p(`| ${t} | ${3 + sang} | +${8 * tr} % | ${f(r.pLate, 3)} | ${r.med >= 200 ? '≥ 200' : r.med} | ${f(r.alive100 * 100, 1)} % |`);
}
p();
p(`VOCATION_BONUS = ${VOCATION_BONUS} par rang (rang X : ×${f(1 + 10 * VOCATION_BONUS)}). Trait Élu : ${TRAIT.elu.desc}.`);

console.log(out.join('\n'));
