import './style.css';
import { OFFLINE_MIN_SEC, newRuntime, resumeLife, simulateOffline, startLife, tick } from './engine/game';
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
window.addEventListener('appinstalled', () => {
  deferredInstall = null;
  state.flags.install_done = true;
});

function isStandalone(): boolean {
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true;
}
function isIos(): boolean {
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

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
  installMode: () => {
    if (isStandalone()) return 'installed';
    if (deferredInstall) return 'prompt';
    if (isIos()) return 'ios';
    return null;
  },
  installPrompt: async () => {
    const ev = deferredInstall;
    if (!ev) return false;
    deferredInstall = null;
    await ev.prompt();
    const choice = await Promise.resolve(ev.userChoice).catch(() => null);
    return choice?.outcome === 'accepted';
  },
});

// state.lastTick est l'instant jusqu'où le jeu a réellement été simulé (mis à jour par tick) :
// la sauvegarde ne doit pas l'avancer, sinon le temps passé onglet masqué ou fil gelé est perdu.
function save() {
  if (!saveLocal(state)) toast('⚠️ Sauvegarde impossible (stockage plein ou bloqué)', 'bad');
}

/** Au-delà de cet écart entre l'horloge et le dernier pas simulé, on rattrape par simulation hors ligne. */
const GAP_SEC = 5;

function catchUp() {
  const now = Date.now();
  const elapsed = (now - state.lastTick) / 1000;
  if (elapsed > GAP_SEC) {
    const rep = simulateOffline(state, rt, elapsed, now, GAP_SEC);
    state.lastTick = now;
    if (rep && rep.seconds >= OFFLINE_MIN_SEC) app.showOffline(rep);
  }
}

app.mount(document.getElementById('app')!);

const isNew = !state.flags.started;
if (isNew) {
  app.openIntro(() => {
    state.flags.started = true;
    // Le temps passé dans la cérémonie d'ouverture ne compte pas comme une absence.
    state.lastTick = Date.now();
    startLife(state);
    save();
    // Arrivé par un lien de mariage : on garde la demande sous les yeux après la fondation.
    app.handleDeepLink();
  });
} else {
  state.stats.sessions = (state.stats.sessions ?? 0) + 1;
  if (!state.life && !state.succession) startLife(state);
  // La pause ne survit pas à la fermeture : au lancement, la vie repart toujours.
  resumeLife(state);
  catchUp();
  app.handleDeepLink();
}
window.addEventListener('hashchange', () => { if (state.flags.started) app.handleDeepLink(); });

let last = performance.now();
let acc = 0;
function loop(t: number) {
  const dtReal = Math.min(5, (t - last) / 1000);
  last = t;
  if (state.flags.started && Date.now() - state.lastTick > GAP_SEC * 1000) {
    // Le moteur n'a pas tourné (onglet masqué, fil gelé, veille) : on rattrape d'un bloc.
    catchUp();
    acc = 0;
    // L'horodatage de cette trame peut précéder la fin du gel : sans ce recalage, la trame
    // suivante rejouerait jusqu'à 5 s déjà rattrapées.
    last = performance.now();
  } else if (state.flags.started) {
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
