// Phase 2 (B3) : quelle touche unique gagne chaque date ? Écart entre dates. 30 dates (1→30/11/2026).
//   node --import ./lab/sim/register.mjs lab/profiles/daily-bykey.ts
import { ACTS } from '../../src/engine/data';
import { replay } from '../../src/engine/daily';
const win: Record<string, number> = {}; const best: number[] = []; const gap: number[] = [];
for (let i = 0; i < 30; i++) {
  const d = new Date(Date.UTC(2026, 10, 1) + i * 86400_000).toISOString().slice(0, 10);
  const m = ACTS.map((_, k) => replay(d, [[0, k]]));
  const s = [...m].sort((a, b) => b - a);
  const k = m.indexOf(s[0]); win[ACTS[k]] = (win[ACTS[k]] ?? 0) + 1; best.push(s[0]); gap.push(s[0] / s[1]);
}
const q = (x: number[], p: number) => [...x].sort((a, b) => a - b)[Math.floor(p * (x.length - 1))];
console.log('touche gagnante par date :', JSON.stringify(win));
console.log(`meilleure touche : min ${Math.min(...best)} p50 ${q(best, .5)} max ${Math.max(...best)} (×${(Math.max(...best) / Math.min(...best)).toFixed(1)} entre dates)`);
console.log(`avance de la meilleure touche sur la 2e : p50 ×${q(gap, .5).toFixed(2)} min ×${Math.min(...gap).toFixed(2)} max ×${Math.max(...gap).toFixed(2)}`);
