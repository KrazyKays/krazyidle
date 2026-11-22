import { runGame } from '../sim/runner';
for (const p of ['experimente', 'debutant', 'optimiseur', 'occasionnel']) {
  const rows: number[][] = [];
  for (let seed = 1; seed <= 30; seed++) rows.push(runGame({ profile: p, seed, hours: 6 }).hourly.map((h) => h.gen));
  const med = rows[0].map((_, i) => rows.map((r) => r[i]).sort((a, b) => a - b)[15]);
  console.log(p, 'gen médiane par heure', med.join(' '));
}
