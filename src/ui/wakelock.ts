// Verrou d'éveil de l'écran (API Screen Wake Lock) : tant que le jeu est affiché, l'écran ne
// s'éteint pas. Le navigateur libère le verrou dès que la page est masquée ; on le reprend au retour.

let wanted = false;
let sentinel: { released: boolean; release: () => Promise<void> } | null = null;

export function wakeLockSupported(): boolean {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
}

async function acquire(): Promise<void> {
  if (!wanted || document.hidden || (sentinel && !sentinel.released)) return;
  try {
    sentinel = await (navigator as any).wakeLock.request('screen');
  } catch {
    sentinel = null; // refusé (économie d'énergie, page pas au premier plan…) : on réessaiera au retour
  }
}

/** Active ou désactive le maintien de l'écran allumé ; false si le navigateur ne le permet pas. */
export function setKeepAwake(on: boolean): boolean {
  if (!wakeLockSupported()) return false;
  wanted = on;
  if (on) void acquire();
  else if (sentinel) { void sentinel.release().catch(() => {}); sentinel = null; }
  return true;
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => { if (!document.hidden) void acquire(); });
  // Certains navigateurs (iOS) refusent la demande hors d'un geste du joueur : on retente au premier toucher.
  document.addEventListener('pointerdown', () => { void acquire(); });
}
