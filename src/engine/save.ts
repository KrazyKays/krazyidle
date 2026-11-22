import { ACT_INDEX_V03, TRAIT_RENAMED_V04, sexOf, type ResId } from './data';
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
  // 0.4 : plus d'Affût (TERRE-3) ni de Prédateurs ; un surnom retiré disparaît des Échos et des ancêtres (TERRE-2).
  // 0.5 : plus de Domaine (SIMPLIF-2) ; le Garde forestier est remboursé.
  delete (s as { eco?: unknown }).eco;
  refundGarde(s);
  if (s.life?.st) for (const k of ['hs', 'hn', 'hm']) delete (s.life.st as unknown as Record<string, unknown>)[k];
  // 0.5 : plus de consignes de Récolter (SIMPLIF-1) : leurs surnoms disparaissent aussi.
  const gone = new Set(['tueur_loups', 'pelletier', 'veneur', 'boucher', 'semeur', 'grand_veneur']);
  for (const p of [...(s.echoes ?? []), ...(s.ancestors ?? [])] as { epithet?: string }[]) if (p.epithet && gone.has(p.epithet)) delete p.epithet;
  if (s.epithets) for (const id of gone) delete s.epithets[id];
  delete (s as { hunt?: unknown }).hunt;
  delete (s as { posture?: unknown }).posture;
  if (s.life) delete (s.life as { post?: unknown }).post;
  if ((d.v ?? 0) < 3) mergeLandV04(s);
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

/** Garde forestier (0.4, coût 60 Or + 100 Vivres, ×2 par niveau) : retiré en 0.5, ses niveaux sont remboursés. */
export function refundGarde(s: GameState) {
  const lvl = s.buildings?.garde ?? 0;
  if (!s.buildings || s.buildings.garde === undefined) return;
  const back: Partial<Record<ResId, number>> = { or: 0, vivres: 0 };
  for (let i = 0; i < lvl; i++) { back.or! += Math.ceil(60 * Math.pow(2, i)); back.vivres! += Math.ceil(100 * Math.pow(2, i)); }
  s.res.or += back.or!;
  s.res.vivres += back.vivres!;
  delete s.buildings.garde;
}

/**
 * 0.4 (TERRE-4) : Cultiver et Chasser ne font plus qu'un métier, Récolter (identifiant « cultiver »).
 * Vocations, compétences, rangs d'activité des Échos, dons de chasse, bâtiment et hauts faits sont repris.
 */
export function mergeLandV04(s: any) {
  const act = (a: unknown) => (a === 'chasser' ? 'cultiver' : a);
  const voc = (v: any) => { if (v?.act) v.act = act(v.act); };
  const traits = (t: unknown) => (Array.isArray(t) ? [...new Set(t.map((x: string) => TRAIT_RENAMED_V04[x] ?? x))] : t);
  const wear = (w: any) => {
    if (!w) return w;
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(w)) { const kk = TRAIT_RENAMED_V04[k] ?? k; out[kk] = Math.max(out[kk] ?? 0, v as number); }
    return out;
  };
  const idx = (r: unknown) => (Array.isArray(r) ? r.map((i: number) => (i >= 0 ? ACT_INDEX_V03[i] ?? 0 : i)) : r);
  const person = (p: any) => {
    if (!p) return;
    if (p.traits) p.traits = traits(p.traits);
    if (p.wear) p.wear = wear(p.wear);
    if (p.evolved) p.evolved = traits(p.evolved);
    voc(p.vocation);
    if (p.dominant) p.dominant = act(p.dominant);
    if (p.spouse) { p.spouse.traits = traits(p.spouse.traits); voc(p.spouse.vocation); }
    if (p.acts) p.acts = idx(p.acts);
  };
  person(s.hero);
  s.echoes?.forEach(person);
  s.ancestors?.forEach(person);
  s.cadets?.forEach(person);
  if (s.succession) {
    const sc = s.succession;
    sc.heirs?.forEach(person);
    person(sc.newEcho);
    person(sc.ancestor);
    voc(sc.vocationEarned);
    if (sc.ripe) sc.ripe = Object.fromEntries(Object.entries(sc.ripe).map(([k, v]) => [TRAIT_RENAMED_V04[k] ?? k, TRAIT_RENAMED_V04[v as string] ?? v]));
  }
  if (s.blessings) s.blessings = (s.blessings as string[]).map((x) => TRAIT_RENAMED_V04[x] ?? x);
  if (s.life) {
    const l = s.life;
    l.rec = idx(l.rec);
    l.act = act(l.act);
    l.lastAct = act(l.lastAct);
    if (l.lvl?.chasser !== undefined) {
      const hunt = l.lvl.chasser > (l.lvl.cultiver ?? 0);
      if (hunt) { l.lvl.cultiver = l.lvl.chasser; l.xp.cultiver = l.xp.chasser; }
      l.timeIn.cultiver = (l.timeIn.cultiver ?? 0) + (l.timeIn.chasser ?? 0);
      delete l.lvl.chasser; delete l.xp.chasser; delete l.timeIn.chasser;
    }
  }
  s.unlocked = [...new Set((s.unlocked ?? []).map(act))];
  if (!s.unlocked.includes('cultiver')) s.unlocked.unshift('cultiver');
  if (s.buildings?.pavillon !== undefined) {
    s.buildings.champs = Math.max(s.buildings.champs ?? 0, s.buildings.pavillon);
    delete s.buildings.pavillon;
  }
  if (s.feats) {
    const ren: Record<string, string> = { cinq_metiers: 'quatre_metiers', chasse_raisonnee: 'recolte_raisonnee' };
    s.feats = Object.fromEntries(Object.entries(s.feats).map(([k, v]) => [ren[k] ?? k, v]));
  }
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
