import './style.css';
import { newRuntime, resumeLife, simulateOffline, startLife, tick } from './engine/game';
import { loadLocal, saveLocal, SAVE_KEY } from './engine/save';
import { newGame, type GameState } from './engine/state';
import { App } from './ui/app';
import { closeTopModal, toast } from './ui/dom';

const STEP = 0.1; // pas de simulation fixe (s)

let state: GameState = loadLocal() ?? newGame();
const rt = newRuntime();
let deferredInstall: any = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstall = e;
});

const app = new App(state, rt, {
  save: () => save(),
  reset: () => {
    try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
    location.reload();
  },
  replaceState: (s) => {
    saveLocal(s);
    location.reload();
  },
  installPrompt: () => {
    if (!deferredInstall) return null;
    const p = deferredInstall.prompt();
    deferredInstall = null;
    return Promise.resolve(p).then(() => true);
  },
});
Object.defineProperty(app.hooks, 'installPrompt', { get: () => (deferredInstall ? () => { deferredInstall.prompt(); deferredInstall = null; return Promise.resolve(true); } : null) });

function save() {
  state.lastTick = Date.now();
  if (!saveLocal(state)) toast('⚠️ Sauvegarde impossible (stockage plein ou bloqué)', 'bad');
}

function catchUp() {
  const now = Date.now();
  const elapsed = (now - state.lastTick) / 1000;
  if (elapsed > 30) {
    const rep = simulateOffline(state, rt, elapsed, now);
    state.lastTick = now;
    if (rep) app.showOffline(rep);
  }
}

app.mount(document.getElementById('app')!);

const isNew = !state.flags.started;
if (isNew) {
  app.openIntro(() => {
    state.flags.started = true;
    startLife(state);
    save();
  });
} else {
  if (!state.life && !state.succession) startLife(state);
  // La pause ne survit pas à la fermeture : au lancement, la vie repart toujours.
  resumeLife(state);
  catchUp();
}

let last = performance.now();
let acc = 0;
function loop(t: number) {
  const dtReal = Math.min(5, (t - last) / 1000);
  last = t;
  if (state.flags.started) {
    acc += dtReal;
    let n = 0;
    while (acc >= STEP && n < 60) {
      tick(state, rt, STEP, Date.now());
      acc -= STEP;
      n++;
    }
    if (n >= 60) acc = 0;
    app.dailyStep(dtReal);
  }
  app.frame(Date.now());
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

setInterval(() => { if (state.flags.started) save(); }, 10_000);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { if (state.flags.started) save(); }
  else if (state.flags.started) { catchUp(); last = performance.now(); }
});
window.addEventListener('pagehide', () => { if (state.flags.started) save(); });
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeTopModal(); });

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

// debug console
(window as any).krazy = { get state() { return state; }, rt };
