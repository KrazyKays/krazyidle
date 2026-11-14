// Analyse rythme/déblocages des campagnes de référence (C000, C001). Lecture seule.
// Usage : node lab/design/analyse-ref.mjs lab/results/C000-reference-sans-evenements/runs.jsonl
import fs from 'node:fs';
const f = process.argv[2];
const runs = fs.readFileSync(f, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const by = {};
for (const r of runs) (by[r.profile] ??= []).push(r);
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : NaN; };
const fmt = (x) => (x < 0 ? 'jamais' : (x / 60).toFixed(1) + ' min');
for (const [p, rs] of Object.entries(by)) {
  const out = [p, `n=${rs.length}`];
  for (const k of ['prosperite', 'crypte', 'alliances', 'chroniques']) {
    const v = rs.map((r) => r.upgradeAt[k] ?? -1);
    const got = v.filter((x) => x >= 0);
    out.push(`${k}: ${got.length}/${rs.length} p50=${got.length ? fmt(q(got, 0.5)) : '-'} p90=${got.length ? fmt(q(got, 0.9)) : '-'}`);
  }
  out.push(`epithetLives moy=${(rs.reduce((a, r) => a + r.epithetLives, 0) / rs.length).toFixed(1)}`);
  out.push(`epithetsFound moy=${(rs.reduce((a, r) => a + r.epithetsFound, 0) / rs.length).toFixed(2)}`);
  out.push(`married moy=${(rs.reduce((a, r) => a + r.married, 0) / rs.length).toFixed(1)}`);
  out.push(`vocMax p50=${q(rs.map((r) => r.vocationTierMax), 0.5)}`);
  out.push(`legacyUnspent p50=${q(rs.map((r) => r.legacyUnspent), 0.5)}`);
  out.push(`eclatsEnd p50=${q(rs.map((r) => r.eclatsEnd), 0.5)}`);
  out.push(`paused moy=${(rs.reduce((a, r) => a + r.pausedShare, 0) / rs.length).toFixed(3)}`);
  // rythme horaire
  const H = rs[0].hourly.length;
  const hr = [];
  for (let h = 0; h < H; h++) {
    const g = q(rs.map((r) => r.hourly[h]?.gen ?? 0), 0.5);
    const L = q(rs.map((r) => r.hourly[h]?.legacyTotal ?? 0), 0.5);
    const v = q(rs.map((r) => r.hourly[h]?.log10Value ?? 0), 0.5);
    hr.push(`h${h + 1}: gen ${g} ⚜${L} log10V ${v.toFixed(2)}`);
  }
  out.push(hr.join(' | '));
  // durée de vie moyenne implicite (temps en ligne / vies)
  console.log(out.join('\n  '));
  // niveaux finaux d'améliorations
  const ups = {};
  for (const r of rs) for (const [k, v] of Object.entries(r.upgrades)) (ups[k] ??= []).push(v);
  console.log('  upgrades p50 : ' + Object.entries(ups).map(([k, v]) => `${k}=${q(v, 0.5)}(${v.length})`).join(' '));
  const bs = {};
  for (const r of rs) for (const [k, v] of Object.entries(r.buildings)) (bs[k] ??= []).push(v);
  console.log('  bâtiments p50 : ' + Object.entries(bs).map(([k, v]) => `${k}=${q(v, 0.5)}`).join(' '));
  const ea = {};
  for (const r of rs) for (const [k, v] of Object.entries(r.echoActShare)) (ea[k] ??= []).push(v);
  console.log('  Échos (part activité, moy) : ' + Object.entries(ea).map(([k, v]) => `${k}=${(v.reduce((a, b) => a + b, 0) / v.length * 100).toFixed(0)}%`).join(' '));
}
