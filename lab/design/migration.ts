// Pourquoi « Grande migration » n'est jamais validée ? Trace objectif / progression / part de l'Or dans la production.
// Usage : node --import ./lab/sim/register.mjs lab/design/migration.ts [profil=mono-chasser] [seed=1]
import { RES, RES_INFO } from '../../src/engine/data';
import { activeEvent } from '../../src/engine/events';
import { PROFILES, feasible, type Profile } from '../sim/profiles';
import { runGame } from '../sim/runner';

const pid = process.argv[2] ?? 'mono-chasser', seed = Number(process.argv[3] ?? 1);
const base = PROFILES[pid];
let lastKey = '';
const p: Profile = {
  ...base, id: 'mig',
  activity: (s, c) => {
    const ev = c.rt.event;
    if (ev) {
      const ep = s.events[ev.key];
      const val = RES.reduce((a, r) => a + c.rt.rate[r] * RES_INFO[r].value, 0);
      const orShare = (c.rt.rate.or * RES_INFO.or.value) / Math.max(1e-9, val);
      const goalShare = (c.rt.rate[ev.def.goal] * RES_INFO[ev.def.goal].value) / Math.max(1e-9, val);
      const k = ev.key + Math.floor((c.now - ev.start) / 600_000);
      if (k !== lastKey) {
        lastKey = k;
        console.log(`${ev.def.id.padEnd(10)} +${String(Math.floor((c.now - ev.start) / 60000)).padStart(2)} min  objectif ${ep?.target} ${ev.def.goal} · progression ${ep?.progress.toFixed(0)} (${((ep?.progress ?? 0) / (ep?.target ?? 1) * 100).toFixed(0)} % du Bronze) · part de la valeur produite en ${ev.def.goal} ${(goalShare * 100).toFixed(0)} % · en Or ${(orShare * 100).toFixed(0)} % · affût ${s.hunt.on ? 'oui' : 'non'} · Gibier ${s.eco.G.toFixed(1)}`);
      }
      const want = (Object.keys(ev.def.act ?? {})[0] ?? 'commercer') as any;
      if (s.unlocked.includes(want)) return feasible(s, want);
    }
    return base.activity(s, c);
  },
};
PROFILES.mig = p;
runGame({ profile: 'mig', seed, hours: 24, events: true });
void activeEvent;
