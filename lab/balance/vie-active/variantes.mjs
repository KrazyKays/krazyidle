// Variantes en mémoire de la refacto « vie active » : node lab/balance/vie-active/variantes.mjs <tag>… [-- args mesure.ts]
// Chaque variante = surcharges de littéraux (BAL_PATCH) + d'objets (BAL_OBJ) ; aucun fichier du jeu n'est modifié.
import { spawn } from 'node:child_process';
const LIN = { file: 'sim.ts', from: 'return Math.sqrt(Math.max(power, 0.01));', to: 'return Math.max(power, 0);' };
const echo = (x, sanct = false) => ({ file: 'game.ts', from: "0.4 * (1 + 0.15 * up(s, 'memoire')) * (1 + 0.1 * bl(s, 'sanctuaire'))", to: `${x} * (1 + 0.15 * up(s, 'memoire'))${sanct ? " * (1 + 0.1 * bl(s, 'sanctuaire'))" : ''}` });
const mem = (n, per = 0.15) => ({ file: 'data.ts', from: "base: 5, growth: 1.55 }", to: `base: 5, growth: 1.55, max: ${n} }` });
const crypte = (n) => ({ file: 'data.ts', from: "base: 12, growth: 2.6, max: 6", to: `base: 12, growth: 2.6, max: ${n}` });
const CONS = 'ACT.commercer.consume.vivres=1.5;ACT.etudier.consume.or=1';
export const V = {
  V1: { p: [LIN] },
  V2: { p: [LIN], o: CONS },
  V3: { p: [LIN, echo(0.25)], o: CONS },
  V4: { p: [LIN, echo(0.25), mem(5), crypte(3)], o: CONS },
  V5: { p: [LIN, echo(0.2), mem(5), crypte(3)], o: CONS },
  V6: { p: [LIN, echo(0.15), mem(5), crypte(3)], o: CONS },
  V7: { p: [LIN, echo(0.2), mem(5), crypte(2)], o: CONS },
  V8: { p: [LIN, echo(0.15), mem(3), crypte(2)], o: CONS },
  V9: { p: [LIN, echo(0.1), mem(5), crypte(3)], o: CONS },
  V10: { p: [LIN, echo(0.1), mem(3), crypte(2)], o: CONS },
  V11: { p: [LIN, echo(0.08), mem(3), crypte(2)], o: CONS },
  V12: { p: [LIN, echo(0.12), mem(5), crypte(2)], o: CONS },
  V13: { p: [LIN, echo(0.15), mem(3), crypte(1)], o: CONS },
  V0: { p: [] },
  V15: { p: [LIN, echo(0.12), mem(3), crypte(1)], o: CONS },
  V16: { p: [LIN, echo(0.1), mem(3), crypte(1)], o: CONS },
  V17: { p: [LIN, echo(0.1), mem(3), crypte(1)], o: 'ACT.commercer.consume.vivres=1;ACT.etudier.consume.or=1' },
  V18: { p: [LIN, echo(0.08), mem(3), crypte(2)], o: 'ACT.commercer.consume.vivres=1;ACT.etudier.consume.or=1' },
  V19: { p: [LIN, echo(0.1), mem(3), crypte(1)], o: 'ACT.commercer.consume.vivres=1;ACT.etudier.consume.or=0.7' },
  V14: { p: [LIN, echo(0.2), mem(3), crypte(1)], o: CONS },
};
const argv = process.argv.slice(2);
const k = argv.indexOf('--');
const tags = k < 0 ? argv : argv.slice(0, k);
const extra = k < 0 ? [] : argv.slice(k + 1);
const suffix = (extra.find((a) => a.startsWith('--suffix=')) ?? '').slice(9);
const pass = extra.filter((a) => !a.startsWith('--suffix='));
await Promise.all(tags.map((t) => new Promise((res) => {
  const v = V[t];
  const env = { ...process.env, BAL_PATCH: JSON.stringify(v.p ?? []), BAL_OBJ: v.o ?? '' };
  const c = spawn('node', ['--import', './lab/balance/register.mjs', 'lab/balance/vie-active/mesure.ts', `--tag=${t}${suffix}`, ...pass], { env, stdio: ['ignore', 'pipe', 'inherit'] });
  let o = ''; c.stdout.on('data', (d) => (o += d));
  c.on('close', () => { console.log(o); res(); });
})));
