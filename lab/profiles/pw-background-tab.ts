// Parcours navigateur : que gagne un joueur qui laisse l'onglet en arrière-plan 30 min (bureau) ?
//   (serveur `npx vite --port 5190 --strictPort` lancé à part)
//   node --import ./lab/sim/register.mjs lab/profiles/pw-background-tab.ts [--url=http://localhost:5190/] [--min=30]
// Émulation : horloge Playwright (page.clock) ; onglet masqué = document.hidden vrai + requestAnimationFrame suspendu
// (comportement standard des navigateurs : rAF ne tourne pas dans un onglet masqué, setInterval continue, au pire 1×/min).
import { createRequire } from 'node:module';
import { RES, RES_INFO } from '../../src/engine/data';
import { newRuntime, simulateOffline, startLife, tick } from '../../src/engine/game';
import { Rng } from '../../src/engine/rng';
import { newGame, type GameState } from '../../src/engine/state';
import { PROFILES, type Ctx } from '../sim/profiles';
import './pba-profiles';

const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const arg = (n: string, d: string) => (process.argv.find((x) => x.startsWith(`--${n}=`))?.split('=')[1] ?? d);
const URL0 = arg('url', 'http://localhost:5190/');
const MIN = Number(arg('min', '30'));
const T0 = Date.UTC(2026, 10, 16, 1, 0, 0);
const value = (s: { totalEver: Record<string, number> }) => RES.reduce((a, r) => a + s.totalEver[r] * RES_INFO[r].value, 0);

// État de milieu de partie : 1 h d'opti-fort (dt 0,5), avec 2+ Échos.
const s: GameState = newGame(T0 - 3600_000, 7); const rt = newRuntime(); rt.online = false; startLife(s);
const p = PROFILES['opti-fort']; const c: Ctx = { t: 0, now: T0 - 3600_000, rt, rng: new Rng(1), mem: {} };
while (c.t < 3600) { if (s.life) s.life.act = p.activity(s, c); c.now += 500; tick(s, rt, 0.5, c.now); c.t += 0.5; if (s.succession) p.succession(s, c); if (c.t % 5 === 0) p.buy(s, c); }
s.flags.started = true; s.lastTick = T0;
if (!s.life && !s.succession) startLife(s);
// Référence moteur : ce que rapporte une absence de MIN minutes (onglet fermé puis rouvert).
const ref = structuredClone(s); simulateOffline(ref, newRuntime(), MIN * 60, T0 + MIN * 60_000);
const expected = value(ref) - value(s);

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
await page.clock.install({ time: T0 });
await page.addInitScript(({ save }: { save: string }) => {
  localStorage.setItem('echos-de-lignee-save', save);
  (window as any).__hidden = false;
  const pend: FrameRequestCallback[] = [];
  const orig = window.requestAnimationFrame.bind(window);
  (window as any).requestAnimationFrame = (cb: FrameRequestCallback) => ((window as any).__hidden ? (pend.push(cb), 0) : orig(cb));
  (window as any).__flushRaf = () => { while (pend.length) orig(pend.shift()!); };
  Object.defineProperty(document, 'hidden', { get: () => (window as any).__hidden });
  Object.defineProperty(document, 'visibilityState', { get: () => ((window as any).__hidden ? 'hidden' : 'visible') });
}, { save: JSON.stringify(s) });
await page.goto(URL0);
await page.clock.runFor(5000);
const read = () => page.evaluate(() => { const st = (window as any).krazy.state; return { totalEver: { ...st.totalEver }, lastTick: st.lastTick, life: !!st.life, succ: !!st.succession, now: Date.now() }; });
const a = await read();
// Onglet masqué MIN minutes
await page.evaluate(() => { (window as any).__hidden = true; document.dispatchEvent(new Event('visibilitychange')); });
await page.clock.runFor(MIN * 60_000);
const hiddenEnd = await read();
await page.evaluate(() => { (window as any).__hidden = false; document.dispatchEvent(new Event('visibilitychange')); (window as any).__flushRaf(); });
await page.clock.runFor(2000);
const b = await read();
const offlineModal = await page.evaluate(() => /hors ligne|absence|pendant ton absence/i.test(document.body.innerText));
await browser.close();

const gainedHidden = value(b) - value(a);
console.log(JSON.stringify({
  minutesHidden: MIN,
  lastTickBumpedWhileHidden_s: (hiddenEnd.lastTick - a.lastTick) / 1000,
  elapsedSeenAtReturn_s: (b.now - 2000 - hiddenEnd.lastTick) / 1000,
  gainedHiddenTab: Math.round(gainedHidden),
  expectedIfClosed_engine: Math.round(expected),
  ratio: +(gainedHidden / expected).toFixed(4),
  offlineReportShown: offlineModal,
  lifeAfter: b.life, successionPending: b.succ,
  note: 'gainedHiddenTab inclut ~2 s visibles après le retour ; expected = simulateOffline(MIN min) sur le même état',
}, null, 1));
