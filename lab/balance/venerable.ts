// B10 — Distribution des surnoms (60 derniers ancêtres… et toutes les vies gardées) et valeur, avec/sans correction en mémoire.
// Correction testée (BAL_PATCH sur game.ts:394) : « le Vénérable » seulement pour la vie qui ATTEINT le rang X
// (si le héros était déjà rang X, la vie est rapportée au rang 9 pour les surnoms ; la vocation réelle n'est pas touchée).
//   node --import ./lab/balance/register.mjs lab/balance/venerable.ts --tag=base --seeds=1-50 --hours=6 [--shard=0/2] >> out.jsonl
//   BAL_PATCH='[{"file":"game.ts","from":"vocTier: voc?.tier ?? 0,","to":"vocTier: (voc?.tier ?? 0) >= 10 && (hero.vocation?.tier ?? 0) >= 10 ? 9 : voc?.tier ?? 0,"}]' … --tag=fix
//   node --import ./lab/balance/register.mjs lab/balance/venerable.ts --summarize out.jsonl
import { readFileSync, writeFileSync } from 'node:fs';
import { arg, f, parseSeeds, runBal, stats } from './lib';

const PROFS = (arg('profiles', 'mono-cultiver,mono-commercer,mono-chasser,experimente') as string).split(',');
if (arg('summarize')) {
  const rows = readFileSync(process.argv[process.argv.length - 1], 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const o = ['# B10 — « le Vénérable » : référence vs correction « au passage du rang X » — 6 h, dt 0,5, sans événements\n',
    '| profil | variante | log10 nette | Δ vs base | surnoms distincts | vies surnommées / vies (après Chroniques) | part du surnom n°1 | top 3 |', '|---|---|---|---|---|---|---|---|'];
  for (const p of PROFS) for (const v of ['base', 'fix']) {
    const R = rows.filter((r) => r.profile === p && r.tag === v);
    if (!R.length) continue;
    const B = new Map(rows.filter((r) => r.profile === p && r.tag === 'base').map((r) => [r.seed, r]));
    const cnt: Record<string, number> = {};
    let named = 0, livesAfter = 0;
    for (const r of R) { for (const [k, n] of Object.entries(r.ep as Record<string, number>)) { cnt[k] = (cnt[k] ?? 0) + n; named += n; } livesAfter += r.livesAfter; }
    const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]);
    o.push(`| ${p} | ${v} | ${f(stats(R.map((r) => r.netLog10)).mean, 3)} | ${v === 'fix' ? f(stats(R.map((r) => r.netLog10 - B.get(r.seed).netLog10)).mean, 3) + ' ± ' + f(stats(R.map((r) => r.netLog10 - B.get(r.seed).netLog10)).sd, 3) : '—'} | ${f(stats(R.map((r) => Object.keys(r.ep).length)).mean, 1)} | ${f((100 * named) / Math.max(1, livesAfter), 0)} % | ${top[0] ? `${top[0][0]} ${f((100 * top[0][1]) / named, 0)} %` : '—'} | ${top.slice(0, 3).map(([k, n]) => `${k} ${n}`).join(', ')} |`);
  }
  writeFileSync('lab/balance/results/venerable.md', o.join('\n') + '\n');
  console.log(o.join('\n'));
} else {
  const seeds = parseSeeds(arg('seeds', '1-50')!);
  const hours = Number(arg('hours', '6'));
  const tag = arg('tag', 'base');
  const [K, N] = arg('shard', '0/1')!.split('/').map(Number);
  let i = 0;
  for (const p of PROFS) for (const seed of seeds) {
    if (i++ % N !== K) continue;
    let ep: Record<string, number> = {}, livesAfter = 0;
    const r = runBal({
      profile: p, seed, hours,
      onHour: (s, h) => {
        if (h !== hours) return;
        const first = s.ancestors.findIndex((a) => a.epithet);
        for (const a of s.ancestors.slice(first < 0 ? s.ancestors.length : first)) { livesAfter++; if (a.epithet) ep[a.epithet] = (ep[a.epithet] ?? 0) + 1; }
      },
    });
    process.stdout.write(JSON.stringify({ tag, profile: p, seed, netLog10: r.netLog10, ep, livesAfter }) + '\n');
  }
}
