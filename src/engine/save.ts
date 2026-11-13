import { newGame, SAVE_VERSION, type GameState } from './state';

export const SAVE_KEY = 'echos-de-lignee-save';
/** Sauvegardes d'avant la sortie (0.1.0) : effacées, tout le monde repart de zéro. */
const OBSOLETE_KEYS = ['krazyidle-save-v1'];

export function serialize(s: GameState): string {
  return JSON.stringify(s);
}

export function deserialize(json: string): GameState | null {
  try {
    const d = JSON.parse(json);
    if (!d || typeof d !== 'object' || typeof d.v !== 'number' || !d.hero) return null;
    return migrate(d);
  } catch {
    return null;
  }
}

/** Fusionne avec une partie neuve pour combler les champs ajoutés dans les versions ultérieures. */
function migrate(d: any): GameState {
  const base = newGame(d.createdAt ?? Date.now(), d.seed ?? 1);
  const s = { ...base, ...d } as GameState;
  s.res = { ...base.res, ...d.res };
  s.totalEver = { ...base.totalEver, ...d.totalEver };
  s.settings = { ...base.settings, ...d.settings };
  s.stats = { ...base.stats, ...d.stats };
  s.lineage = { ...base.lineage, ...d.lineage };
  s.v = SAVE_VERSION;
  return s;
}

export function exportSave(s: GameState): string {
  return btoa(unescape(encodeURIComponent(serialize(s))));
}

export function importSave(code: string): GameState | null {
  try {
    return deserialize(decodeURIComponent(escape(atob(code.trim()))));
  } catch {
    return null;
  }
}

export function loadLocal(): GameState | null {
  try {
    for (const k of OBSOLETE_KEYS) localStorage.removeItem(k);
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? deserialize(raw) : null;
  } catch {
    return null;
  }
}

export function saveLocal(s: GameState): boolean {
  try {
    localStorage.setItem(SAVE_KEY, serialize(s));
    return true;
  } catch {
    return false;
  }
}
