// Agrège une ou plusieurs campagnes (runs.jsonl) : indicateurs clés + frustrations, par profil.
//   node lab/profiles/analyze.mjs <dossier ou runs.jsonl>...
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const rows = [];
for (const a of process.argv.slice(2)) {
  const f = existsSync(join(a, 'runs.jsonl')) ? join(a, 'runs.jsonl') : a;
  for (const l of readFileSync(f, 'utf8').trim().split('\n')) rows.push(JSON.parse(l));
}
const by = {};
for (const r of rows) (by[r.profile] ??= []).push(r);
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
const q = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const pct = (x) => (100 * x).toFixed(1) + ' %';
const out = [];
out.push('| profil | n | gen | ⚜️ total (p10–p90) | log10 valeur (p10–p90) | Alliances (part, méd. h) | Chroniques (part, méd. h) | mariages | ✦ fin | évts Or | surnoms/vie | pause | voc. perdue/succ. | héritiers tous ≥1 négatif | effondrement (vies Harm.min≤0,3) | attente succession (s/vie) |');
out.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const [p, rs] of Object.entries(by)) {
  const up = (k) => { const v = rs.map((r) => r.upgradeAt[k]).filter((x) => x !== undefined); return `${pct(v.length / rs.length)}, ${v.length ? (q(v, 0.5) / 3600).toFixed(2) : '—'}`; };
  const fr = rs.map((r) => r.frustr).filter(Boolean);
  const succ = mean(fr.map((f) => f.successions)) || 1;
  const L = rs.map((r) => r.legacyTotal), V = rs.map((r) => r.log10Value);
  const evOr = fr.length ? mean(fr.map((f) => Object.values(f.evMap).filter((e) => e.tier >= 3).length)).toFixed(2) + '/' + mean(fr.map((f) => Object.keys(f.evMap).length)).toFixed(1) : mean(rs.map((r) => r.eventsDone)).toFixed(2);
  out.push(`| ${p} | ${rs.length} | ${mean(rs.map((r) => r.gen)).toFixed(0)} | ${mean(L).toFixed(0)} (${q(L, .1)}–${q(L, .9)}) | ${mean(V).toFixed(2)} (${q(V, .1).toFixed(2)}–${q(V, .9).toFixed(2)}) | ${up('alliances')} | ${up('chroniques')} | ${mean(rs.map((r) => r.married)).toFixed(1)} | ${mean(rs.map((r) => r.eclatsEnd)).toFixed(1)} | ${evOr} | ${(mean(rs.map((r) => r.epithetLives / Math.max(1, r.lives)))).toFixed(2)} | ${pct(mean(rs.map((r) => r.pausedShare)))} | ${fr.length ? pct(mean(fr.map((f) => f.vocLost / Math.max(1, f.successions)))) : '—'} | ${fr.length ? pct(mean(fr.map((f) => f.heirsAllBad / Math.max(1, f.successions)))) : '—'} | ${fr.length ? mean(fr.map((f) => f.collapse)).toFixed(1) : '—'} | ${fr.length ? (mean(fr.map((f) => f.pendingSec)) / succ).toFixed(1) : '—'} |`);
}
console.log(out.join('\n'));
// surnoms
console.log('\nSurnoms (vies surnommées, moyenne par partie) :');
for (const [p, rs] of Object.entries(by)) {
  const ep = {};
  for (const r of rs) for (const [k, v] of Object.entries(r.frustr?.epithets ?? {})) ep[k] = (ep[k] ?? 0) + v / rs.length;
  const top = Object.entries(ep).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k} ${v.toFixed(1)}`).join(', ');
  if (top) console.log(`- ${p} : ${top}`);
}
// courbe horaire
console.log('\nlog10 valeur par heure (moyenne) :');
for (const [p, rs] of Object.entries(by)) {
  const H = Math.max(...rs.map((r) => r.hourly.length));
  const pts = []; for (let h = 0; h < H; h++) pts.push(mean(rs.map((r) => r.hourly[h]?.log10Value).filter((x) => x !== undefined)).toFixed(2));
  console.log(`- ${p} : ${pts.join(' · ')}`);
}
