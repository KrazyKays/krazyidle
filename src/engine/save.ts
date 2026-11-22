import { sexOf } from './data';
import { rebuildRanks } from './names';
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
  s.hunt = { ...base.hunt, ...d.hunt };
  // 0.4 : plus de Prédateurs ; un surnom retiré disparaît des Échos et des ancêtres (TERRE-2).
  s.eco = { F: d.eco?.F ?? base.eco.F, G: d.eco?.G ?? base.eco.G };
  const gone = new Set(['tueur_loups']);
  for (const p of [...(s.echoes ?? []), ...(s.ancestors ?? [])] as { epithet?: string }[]) if (p.epithet && gone.has(p.epithet)) delete p.epithet;
  if (s.epithets) for (const id of gone) delete s.epithets[id];
  // Genre des personnages : absent des sauvegardes d'avant, déduit du prénom.
  const sexed = (p: { name: string; sex?: 'f' | 'm' } | null | undefined) => { if (p && !p.sex) p.sex = sexOf(p); };
  sexed(s.hero);
  s.echoes?.forEach(sexed);
  s.ancestors?.forEach(sexed);
  if (s.succession) { s.succession.heirs?.forEach(sexed); sexed(s.succession.newEcho); sexed(s.succession.ancestor); }
  // Numérotation dynastique : absente des sauvegardes d'avant, recalculée d'après la généalogie.
  if (!d.lineage?.names) rebuildRanks(s);
  s.v = SAVE_VERSION;
  return s;
}

export function exportSave(s: GameState): string {
  return btoa(unescape(encodeURIComponent(serialize(s))));
}

/**
 * Une sauvegarde importée doit pouvoir être jouée : sinon elle serait écrite puis ferait planter chaque
 * lancement (QA-02). On ne vérifie que ce que le moteur lit sans garde ; la sauvegarde locale n'est pas
 * soumise à ce contrôle, pour ne jamais écarter la partie d'un joueur.
 */
export function isPlayable(s: GameState): boolean {
  const num = (x: unknown) => typeof x === 'number' && Number.isFinite(x);
  const strs = (x: unknown) => Array.isArray(x) && x.every((t) => typeof t === 'string');
  const nums = (x: unknown) => Array.isArray(x) && x.every((t) => typeof t === 'number');
  const obj = (x: unknown) => !!x && typeof x === 'object' && !Array.isArray(x);
  const hero = (h: any) => obj(h) && typeof h.name === 'string' && num(h.gen) && strs(h.traits);
  const acts = (r: any) => obj(r) && Object.values(r).every(num);
  if (!hero(s.hero) || !obj(s.res) || !Object.values(s.res).every(num)) return false;
  if (!strs(s.unlocked) || !obj(s.buildings) || !obj(s.upgrades) || !Array.isArray(s.ancestors)) return false;
  if (!Array.isArray(s.echoes) || !s.echoes.every((e: any) => obj(e) && nums(e.acts) && nums(e.pow) && num(e.pos))) return false;
  const l: any = s.life;
  if (l && !(obj(l) && num(l.t) && num(l.dur) && acts(l.lvl) && acts(l.xp) && acts(l.timeIn) && nums(l.rec) && nums(l.pow))) return false;
  const sc: any = s.succession;
  if (sc && !(obj(sc) && Array.isArray(sc.heirs) && sc.heirs.length > 0 && sc.heirs.every(hero) && obj(sc.newEcho))) return false;
  return true;
}

export function importSave(code: string): GameState | null {
  try {
    const s = deserialize(decodeURIComponent(escape(atob(code.trim()))));
    return s && isPlayable(s) ? s : null;
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
