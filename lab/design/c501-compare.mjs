// Compare C501 (correctif BAL-01/02 en mémoire) à C000 sur les mêmes graines. Usage : node lab/design/c501-compare.mjs
import fs from 'node:fs';
const read = (f) => fs.readFileSync(f, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const fix = [...read('lab/design/results/C501-fix1-0.jsonl'), ...read('lab/design/results/C501-fix1-1.jsonl')];
const ref = read('lab/results/C000-reference-sans-evenements/runs.jsonl');
console.log('clés :', Object.keys(fix[0]).join(','));
for (const p of ['optimiseur', 'debutant']) {
  const F = fix.filter((r) => r.profile === p), d = [];
  const sh = {};
  for (const r of F) {
    const b = ref.find((x) => x.profile === p && x.seed === r.seed);
    d.push(r.grossLog10 - b.log10Value);
    for (const [k, v] of Object.entries(r.heroActShare ?? {})) (sh[k] ??= [0, 0])[0] += v / F.length;
    for (const [k, v] of Object.entries(b.heroActShare)) (sh[k] ??= [0, 0])[1] += v / F.length;
  }
  const m = d.reduce((a, b) => a + b, 0) / d.length, s = Math.sqrt(d.reduce((a, b) => a + (b - m) ** 2, 0) / d.length);
  console.log(`${p} : Δlog10 ${m.toFixed(3)} ± ${s.toFixed(3)} (n=${d.length}) · temps héros fix/C000 : ` + Object.entries(sh).map(([k, [a, b]]) => `${k} ${(a * 100).toFixed(0)}/${(b * 100).toFixed(0)} %`).join(' '));
}
const med = (a) => { const s = a.filter((x) => x >= 0).sort((x, y) => x - y); return s.length ? `${s[Math.floor(s.length / 2)]} s (${s.length}/${a.length})` : `jamais (0/${a.length})`; };
for (const p of ['optimiseur', 'debutant']) for (const a of ['etudier', 'mediter']) {
  const F = fix.filter((r) => r.profile === p);
  const B = F.map((r) => ref.find((x) => x.profile === p && x.seed === r.seed));
  console.log(`${p} déblocage ${a} : fix ${med(F.map((r) => r.unlockAt[a]))} · C000 ${med(B.map((r) => r.unlockAt[a]))}`);
}
