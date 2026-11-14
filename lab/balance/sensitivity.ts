// Sensibilité un-paramètre-à-la-fois (±25 %, ±50 %), surcharges EN MÉMOIRE uniquement
// (BAL_PATCH : littéraux réécrits au chargement ; BAL_OBJ : objets exportés modifiés au démarrage).
//   node --import ./lab/balance/register.mjs lab/balance/sensitivity.ts [--seeds=1-30] [--hours=4] [--profiles=experimente,mono-commercer] [--jobs=2]
//   node --import ./lab/balance/register.mjs lab/balance/sensitivity.ts --summarize
// Convention : pour un facteur de croissance ou multiplicatif x (1,3 ; 1,12 ; 1,9…), la variation porte sur (x − 1).
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { BUILDINGS, LEGACY_DEF } from '../../src/engine/data';
import { arg, f, stats } from './lib';

const OUT = 'lab/balance/results/sensitivity-runs.jsonl';
const seeds = arg('seeds', '1-30')!;
const hours = arg('hours', '4')!;
const profiles = arg('profiles', 'experimente,mono-commercer')!;
const jobs = Number(arg('jobs', '2'));
const K = [0.5, 0.75, 1.25, 1.5];
const r = (x: number) => Math.round(x * 1e6) / 1e6;
const g1 = (x: number, k: number) => r(1 + (x - 1) * k);

interface Variant { id: string; param: string; base: string; value: string; patch?: object[]; obj?: string }
const V: Variant[] = [{ id: 'base', param: 'base', base: '', value: '' }];
function src(param: string, file: string, base: number, mk: (v: number) => [string, string], kind: 'lin' | 'growth' = 'lin') {
  for (const k of K) {
    const v = kind === 'growth' ? g1(base, k) : r(base * k);
    const [from, to] = mk(v);
    V.push({ id: `${param}@${k}`, param, base: String(base), value: String(v), patch: [{ file, from: mk(base)[0], to }] });
    void from;
  }
}
function obj(param: string, base: number, mk: (v: number) => string, kind: 'lin' | 'growth' = 'lin') {
  for (const k of K) {
    const v = kind === 'growth' ? g1(base, k) : r(base * k);
    V.push({ id: `${param}@${k}`, param, base: String(base), value: String(v), obj: mk(v) });
  }
}
// --- game.ts
src('echoBase', 'game.ts', 0.4, (v) => ["let m = 0.4 * (1 + 0.15", `let m = ${v} * (1 + 0.15`]);
src('memoire', 'game.ts', 0.15, (v) => ["0.4 * (1 + 0.15 * up(s, 'memoire'))", `0.4 * (1 + ${v} * up(s, 'memoire'))`]);
src('prosperiteMult', 'game.ts', 1.12, (v) => ["Math.pow(1.12, up(s, 'prosperite'))", `Math.pow(${v}, up(s, 'prosperite'))`], 'growth');
src('vieBase', 'game.ts', 60, (v) => ['60 + m.life', `${v} + m.life`]);
src('legacyDiv', 'game.ts', 20, (v) => ['Math.cbrt(value / 20)', `Math.cbrt(value / ${v})`]);
src('bMultParNiv', 'game.ts', 0.25, (v) => ['bMult(bl(s, BUILDING_FOR_ACT[a]), 0.25)', `bMult(bl(s, BUILDING_FOR_ACT[a]), ${v})`]);
// --- data.ts
src('xpCroissance', 'data.ts', 1.3, (v) => ['5 * Math.pow(1.3, lvl)', `5 * Math.pow(${v}, lvl)`], 'growth');
src('skillPente', 'data.ts', 0.25, (v) => ['1 + 0.25 * lvl + 0.01 * lvl * lvl', `1 + ${v} * lvl + 0.01 * lvl * lvl`]);
src('vocationBonus', 'data.ts', 0.2, (v) => ['VOCATION_BONUS = 0.2', `VOCATION_BONUS = ${v}`]);
src('bMultDoublement', 'data.ts', 2, (v) => ['Math.pow(2, Math.floor(lvl / 10))', `Math.pow(${v}, Math.floor(lvl / 10))`], 'growth');
src('budgetGenome', 'data.ts', 6, (v) => ['GENOME_BUDGET = 6', `GENOME_BUDGET = ${v}`]);
// --- sim.ts / ecosystem.ts
src('echoEcoForce', 'sim.ts', 0.6, (v) => ['ECHO_ECO_STRENGTH = 0.6', `ECHO_ECO_STRENGTH = ${v}`]);
src('harmonieAmpl', 'ecosystem.ts', 0.6, (v) => ['0.7 + 0.6 * ecoHealth(e)', `${r(1 - v / 2)} + ${v} * ecoHealth(e)`]);
// --- objets
for (const k of K) {
  V.push({ id: `croissanceBatiments@${k}`, param: 'croissanceBatiments', base: '1,9–2,4', value: `(g−1)×${k}`, obj: BUILDINGS.map((b) => `BUILDING.${b.id}.growth=${g1(b.growth, k)}`).join(';') });
}
obj('prosperiteCout', LEGACY_DEF.prosperite.growth, (v) => `LEGACY.prosperite.growth=${v}`, 'growth');
obj('prod.cultiver', 1.2, (v) => `ACT.cultiver.produce.vivres=${v}`);
obj('prod.chasser', 2.0, (v) => `ACT.chasser.produce.vivres=${v}`);
obj('prod.commercer', 1.5, (v) => `ACT.commercer.produce.or=${v}`);
obj('prod.etudier', 0.6, (v) => `ACT.etudier.produce.savoir=${v}`);
obj('prod.mediter', 0.06, (v) => `ACT.mediter.produce.essence=${v}`);
obj('conso.commercer', 3, (v) => `ACT.commercer.consume.vivres=${v}`);
obj('conso.etudier', 2, (v) => `ACT.etudier.consume.or=${v}`);
obj('elu.all', 0.6, (v) => `TRAIT.elu.mods.all=${v}`);

function runVariant(v: Variant): Promise<void> {
  return new Promise((res, rej) => {
    const env = { ...process.env, BAL_PATCH: JSON.stringify(v.patch ?? []), BAL_OBJ: v.obj ?? '' };
    const p = spawn('node', ['--import', './lab/balance/register.mjs', 'lab/balance/batch.ts', `--profiles=${profiles}`, `--seeds=${seeds}`, `--hours=${hours}`, `--tag=${v.id}`], { env });
    let buf = '', err = '';
    p.stdout.on('data', (d) => (buf += d));
    p.stderr.on('data', (d) => (err += d));
    p.on('close', (code) => {
      if (code !== 0) return rej(new Error(v.id + ' : ' + err));
      const lines = buf.trim().split('\n').map((l) => { const o = JSON.parse(l); delete o.hourly; delete o.buildings; delete o.upgrades; delete o.unlockAt; return JSON.stringify({ ...o, param: v.param, base: v.base, value: v.value }); });
      appendFileSync(OUT, lines.join('\n') + '\n');
      process.stderr.write(`  ${v.id} ok\n`);
      res();
    });
  });
}

async function main() {
  const done = new Set<string>();
  if (existsSync(OUT)) for (const l of readFileSync(OUT, 'utf8').trim().split('\n').filter(Boolean)) done.add(JSON.parse(l).tag);
  const todo = V.filter((v) => !done.has(v.id));
  process.stderr.write(`${todo.length} variantes à exécuter (${done.size} déjà faites)\n`);
  let i = 0;
  await Promise.all(Array.from({ length: jobs }, async () => { while (i < todo.length) await runVariant(todo[i++]); }));
}

function summarize() {
  const rows = readFileSync(OUT, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const P = [...new Set(rows.map((x) => x.profile))];
  const key = (x: any) => `${x.profile}|${x.seed}`;
  const base = new Map(rows.filter((x) => x.tag === 'base').map((x) => [key(x), x]));
  const out: string[] = [];
  const n = rows.filter((x) => x.tag === 'base' && x.profile === P[0]).length;
  out.push(`# Sensibilité — ${n} graines appariées par variante et par profil, ${rows[0].hours} h, dt ${rows[0].dt}, sans événements\n`);
  out.push('Δ = variante − référence sur la même graine (moyenne ± é.-t. des Δ). Valeur nette en log10 (+0,30 = ×2). Héritage et générations en %.\n');
  for (const p of P) {
    const b = rows.filter((x) => x.tag === 'base' && x.profile === p);
    out.push(`## ${p} (référence : log10 nette ${f(stats(b.map((x) => x.netLog10)).mean, 3)} ± ${f(stats(b.map((x) => x.netLog10)).sd, 3)}, Héritage ${f(stats(b.map((x) => x.legacyTotal)).mean, 0)}, gén. ${f(stats(b.map((x) => x.gen)).mean, 1)})\n`);
    out.push('| paramètre | valeur actuelle | ×0,5 | ×0,75 | ×1,25 | ×1,5 | élasticité log10 (±25 %) | Héritage ×0,5 / ×1,5 | gén. ×0,5 / ×1,5 |');
    out.push('|---|---|---|---|---|---|---|---|---|');
    const params = [...new Set(rows.filter((x) => x.tag !== 'base').map((x) => x.param))];
    const table: { p: string; line: string; el: number }[] = [];
    for (const prm of params) {
      const cell = (k: number, field: string, pct = false) => {
        const xs = rows.filter((x) => x.tag === `${prm}@${k}` && x.profile === p);
        const d = xs.map((x) => { const bb = base.get(key(x))!; return pct ? (100 * (x[field] - bb[field])) / bb[field] : x[field] - bb[field]; });
        return stats(d);
      };
      const c = K.map((k) => cell(k, 'netLog10'));
      const el = (c[2].mean - c[1].mean) / 2; // Δlog10 pour ±25 % → par « 25 % »
      const any = rows.find((x) => x.param === prm)!;
      const L = [0.5, 1.5].map((k) => f(cell(k, 'legacyTotal', true).mean, 0) + ' %').join(' / ');
      const Gn = [0.5, 1.5].map((k) => f(cell(k, 'gen', true).mean, 0) + ' %').join(' / ');
      table.push({ p: prm, el, line: `| ${prm} | ${any.base} | ${c.map((s) => `${s.mean >= 0 ? '+' : ''}${f(s.mean, 3)} ± ${f(s.sd, 3)}`).join(' | ')} | ${f(el, 3)} | ${L} | ${Gn} |` });
    }
    table.sort((a, b) => Math.abs(b.el) - Math.abs(a.el));
    for (const t of table) out.push(t.line);
    out.push('');
  }
  const txt = out.join('\n');
  writeFileSync('lab/balance/results/sensitivity.md', txt);
  console.log(txt);
}

function check() {
  let bad = 0;
  const dir = new URL('../../src/engine/', import.meta.url);
  for (const v of V) for (const pt of (v.patch ?? []) as { file: string; from: string }[]) {
    const n = readFileSync(new URL(pt.file, dir), 'utf8').split(pt.from).length - 1;
    if (n !== 1) { bad++; console.log('MOTIF', v.id, pt.from, n); }
  }
  console.log(`${V.length} variantes, ${bad} motif(s) invalide(s)`);
}

if (arg('check')) check(); else if (arg('summarize')) summarize(); else main().then(summarize);
