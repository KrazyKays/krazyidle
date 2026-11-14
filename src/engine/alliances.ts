// Alliances : mariages avec les maisons du comté (PNJ, les mêmes pour tous chaque semaine)
// ou avec la lignée d'un autre joueur, par échange de codes, sans serveur.
// Débloqué par l'amélioration d'Héritage « Alliances ». Une union par vie.
import { ACTS, CRESTS, CREST_COLORS, FIRST_NAMES, HOUSE_NAMES, TRAIT, TRAITS, VOCATION_MAX, sexFor, type ActId } from './data';
import { EPITHETS } from './epithets';
import { hashStr, Rng } from './rng';
import type { Alliance, GameState, Hero, HouseRef, Spouse } from './state';

export const PARTITION_IDS = ['plein', 'parti', 'coupe', 'tranche', 'chevron', 'ecartele'];

export function alliancesUnlocked(s: GameState): boolean {
  return (s.upgrades.alliances ?? 0) > 0;
}

export function ownHouse(s: GameState): HouseRef {
  const l = s.lineage;
  return { id: s.houseId, name: l.name, crest: l.crest, color: l.color, partition: l.partition ?? 'plein' };
}

/** Le héros vivant peut-il encore se marier ? */
export function canMarry(s: GameState): boolean {
  return alliancesUnlocked(s) && !!s.life && !s.hero.spouse;
}

/** Dot en Or : suit l'économie de la lignée. Réduite de moitié entre joueurs, pour encourager les échanges. */
export function dowry(s: GameState, origin: Spouse['origin']): number {
  const base = Math.max(50, Math.round(s.totalEver.or * 0.02));
  return origin === 'joueur' ? Math.round(base / 2) : base;
}

// ---------------------------------------------------------------------------
// Maisons du comté (PNJ)
const WEEK_MS = 7 * 86400_000;
/** Lundi 1er janvier 2024, 0 h UTC : les semaines commencent le lundi. */
const WEEK0 = Date.UTC(2024, 0, 1);
export function weekIndex(now: number): number {
  return Math.floor((now - WEEK0) / WEEK_MS);
}
export function weekEnd(now: number): number {
  return WEEK0 + (weekIndex(now) + 1) * WEEK_MS;
}

export interface CountyHouse {
  house: HouseRef;
  /** activité de prédilection : ses prétendants en ont la vocation */
  spec: ActId;
  /** don de la semaine, porté par tous ses prétendants (le même pour tous les joueurs) */
  gift: string;
}

/** Trois maisons par semaine, identiques pour tous les joueurs. */
export function countyHouses(now: number): CountyHouse[] {
  const w = weekIndex(now);
  const rng = new Rng(hashStr('maisons:' + w));
  const names = [...HOUSE_NAMES];
  const acts = [...ACTS];
  const gifts = TRAITS.filter((t) => !t.neg && !t.shop && t.rarity >= 1 && t.rarity <= 3);
  const out: CountyHouse[] = [];
  for (let i = 0; i < 3; i++) {
    const name = names.splice(rng.int(names.length), 1)[0];
    const spec = acts.splice(rng.int(acts.length), 1)[0];
    // Une maison prestigieuse par semaine : son don est plus rare.
    const pool = gifts.filter((t) => (i === 0 ? t.rarity >= 2 : t.rarity <= 2));
    out.push({
      house: { id: 'pnj:' + name, name, crest: rng.pick(CRESTS), color: rng.pick(CREST_COLORS), partition: rng.pick(PARTITION_IDS) },
      spec,
      gift: rng.pick(pool).id,
    });
  }
  return out;
}

/** Prétendant proposé par une maison du comté au héros actuel (stable pendant toute sa vie). */
export function suitorFor(s: GameState, ch: CountyHouse, now: number): Spouse {
  const rng = new Rng(hashStr(`pretendant:${weekIndex(now)}:${ch.house.id}:${s.houseId}:${s.hero.id}`));
  const gen = s.hero.gen;
  const name = rng.pick(FIRST_NAMES);
  const traits = [ch.gift];
  const rar = Math.min(3, rng.weighted([60, 30 + gen / 4, 8 + gen / 8, 1 + gen / 30]));
  const pool = TRAITS.filter((t) => !t.neg && !t.shop && t.rarity === rar && !traits.includes(t.id));
  if (pool.length) traits.push(rng.pick(pool).id);
  if (rng.chance(0.2)) {
    const neg = TRAITS.filter((t) => t.neg && t.rarity === 0);
    traits.push(rng.pick(neg).id);
  }
  const tier = Math.max(1, Math.min(6, 1 + Math.floor(gen / 12) + rng.int(2)));
  return { name, sex: sexFor(name), gen, traits, vocation: { act: ch.spec, tier }, house: ch.house, origin: 'pnj' };
}

// ---------------------------------------------------------------------------
// Union
export type MarryResult = { ok: true } | { ok: false; reason: string };

export function marry(s: GameState, spouse: Spouse): MarryResult {
  if (!alliancesUnlocked(s)) return { ok: false, reason: 'Les Alliances ne sont pas encore débloquées.' };
  if (!s.life) return { ok: false, reason: 'Il faut un héros vivant pour célébrer une union.' };
  if (s.hero.spouse) return { ok: false, reason: 'Une seule union par vie.' };
  if (spouse.house.id === s.houseId) return { ok: false, reason: 'On ne se marie pas dans sa propre maison.' };
  const cost = dowry(s, spouse.origin);
  if (s.res.or < cost) return { ok: false, reason: `Dot insuffisante : il faut ${cost} Or.` };
  s.res.or -= cost;
  s.hero.spouse = spouse;
  const a: Alliance = s.alliances[spouse.house.id] ?? { house: spouse.house, origin: spouse.origin, count: 0, lastGen: 0 };
  a.house = spouse.house; // le blason a pu changer depuis
  a.count++;
  a.lastGen = s.hero.gen;
  s.alliances[spouse.house.id] = a;
  return { ok: true };
}

/** Une alliance est scellée quand chaque maison a proposé un cadet à l'autre. */
export function isSealed(a: Alliance): boolean {
  return a.origin === 'joueur' && a.count > 0 && (!!a.sent || !!a.replied);
}

/** Risque de mutation négative supplémentaire chez les enfants : +15 % par union de trop avec la même maison. */
export function inbreedingRisk(s: GameState, spouse: Spouse | undefined): number {
  if (!spouse) return 0;
  const n = s.alliances[spouse.house.id]?.count ?? 1;
  return Math.min(0.6, 0.15 * Math.max(0, n - 1));
}

// ---------------------------------------------------------------------------
// Cadets : les enfants non choisis à la succession, que l'on peut marier ailleurs.
export const CADETS_MAX = 8;

export function addCadets(s: GameState, heirs: Hero[]) {
  if (!alliancesUnlocked(s)) return;
  for (const h of heirs) s.cadets.push({ ...h, spouse: undefined });
  while (s.cadets.length > CADETS_MAX) s.cadets.shift();
}

// ---------------------------------------------------------------------------
// Codes d'alliance : « AL1-<données>-<contrôle> », en base64 url-safe.
// Sans serveur, rien n'empêche de fabriquer un code : on borne donc ce qu'il peut apporter.
const PREFIX = 'AL1';
const SALT = 'sablier-des-ancetres';

interface Payload {
  house: HouseRef;
  name: string;
  sex: 'f' | 'm';
  gen: number;
  traits: string[];
  vocation: { act: ActId; tier: number } | null;
  epithet?: string;
  /** maison à laquelle ce code répond */
  re?: string;
  nonce: number;
}

function b64e(str: string): string {
  return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '.').replace(/\//g, '_').replace(/=+$/, '');
}
function b64d(str: string): string {
  const b = str.replace(/\./g, '+').replace(/_/g, '/');
  return decodeURIComponent(escape(atob(b + '='.repeat((4 - (b.length % 4)) % 4))));
}
const check = (data: string) => hashStr(data + SALT).toString(36);

export function encodeProposal(s: GameState, cadet: Hero, re?: string, nonce = Date.now() % 1e6): string {
  const h = ownHouse(s);
  const arr = [
    h.id, h.name, CRESTS.indexOf(h.crest), h.color, PARTITION_IDS.indexOf(h.partition ?? 'plein'),
    cadet.name, cadet.sex === 'f' ? 1 : 0, cadet.gen,
    cadet.traits.map((t) => TRAITS.findIndex((x) => x.id === t)).filter((i) => i >= 0),
    cadet.vocation ? ACTS.indexOf(cadet.vocation.act) : -1, cadet.vocation?.tier ?? 0,
    -1, re ?? '', nonce,
  ];
  const data = b64e(JSON.stringify(arr));
  return `${PREFIX}-${data}-${check(data)}`;
}

/** Lit un code. Retourne null s'il est illisible ou altéré. */
export function decodeProposal(code: string): Payload | null {
  try {
    const m = code.trim().match(/AL1-([A-Za-z0-9._]+)-([a-z0-9]+)/);
    if (!m || check(m[1]) !== m[2]) return null;
    const a = JSON.parse(b64d(m[1]));
    if (!Array.isArray(a) || a.length < 14) return null;
    const [hid, hname, ci, color, pi, name, sx, gen, tr, va, vt, ei, re, nonce] = a;
    const clean = (x: unknown, n: number) => String(x ?? '').replace(/[<>]/g, '').trim().slice(0, n);
    const house: HouseRef = {
      id: clean(hid, 24),
      name: clean(hname, 20) || 'Sansnom',
      crest: CRESTS[ci] ?? CRESTS[0],
      color: /^#[0-9a-f]{6}$/i.test(String(color)) ? String(color) : CREST_COLORS[0],
      partition: PARTITION_IDS[pi] ?? 'plein',
    };
    if (!house.id || house.id.startsWith('pnj:')) return null;
    const nm = clean(name, 20);
    if (!nm) return null;
    const traits = (Array.isArray(tr) ? tr : []).map((i: number) => TRAITS[i]?.id).filter((t: string | undefined): t is string => !!t);
    const act = ACTS[va];
    return {
      house, name: nm, sex: sx === 1 ? 'f' : 'm', gen: Math.max(1, Math.floor(Number(gen) || 1)),
      traits: [...new Set(traits)],
      vocation: act ? { act, tier: Math.max(1, Math.min(VOCATION_MAX, Math.floor(Number(vt) || 1))) } : null,
      epithet: EPITHETS[ei]?.id, re: re ? clean(re, 24) : undefined, nonce: Number(nonce) || 0,
    };
  } catch {
    return null;
  }
}

/**
 * Prétendant tiré d'un code, borné : pas de traits du Bazar, un seul trait légendaire au plus,
 * quatre traits au plus, vocation au plus deux rangs au-dessus de celle du héros.
 */
export function suitorFromCode(s: GameState, p: Payload): Spouse {
  let legendary = 0;
  const traits: string[] = [];
  for (const id of p.traits) {
    const t = TRAIT[id];
    if (!t || t.shop) continue;
    if (t.rarity >= 3 && legendary++ >= 1) continue;
    if (traits.length < 4) traits.push(id);
  }
  const cap = Math.min(VOCATION_MAX, (s.hero.vocation?.tier ?? 0) + 2);
  const vocation = p.vocation ? { act: p.vocation.act, tier: Math.min(cap, p.vocation.tier) } : null;
  return { name: p.name, sex: p.sex, gen: p.gen, traits, vocation, epithet: p.epithet, house: p.house, origin: 'joueur' };
}

export const codeKey = (code: string) => hashStr(code.trim().replace(/^.*?(AL1-)/, '$1')).toString(36);

export type ReadResult = { ok: true; suitor: Spouse; payload: Payload } | { ok: false; reason: string };

/** Vérifie un code reçu sans rien modifier (aperçu avant d'accepter). */
export function readProposal(s: GameState, code: string): ReadResult {
  const p = decodeProposal(code);
  if (!p) return { ok: false, reason: 'Ce code est illisible ou a été altéré.' };
  if (p.house.id === s.houseId) return { ok: false, reason: 'Ce cadet vient de ta propre maison !' };
  if (s.usedCodes.includes(codeKey(code))) return { ok: false, reason: 'Tu as déjà accepté cette demande.' };
  return { ok: true, suitor: suitorFromCode(s, p), payload: p };
}

/** Accepte une demande en mariage reçue d'un autre joueur pour le héros vivant. */
export function acceptProposal(s: GameState, code: string): MarryResult & { house?: HouseRef } {
  const r = readProposal(s, code);
  if (!r.ok) return r;
  const res = marry(s, r.suitor);
  if (!res.ok) return res;
  s.usedCodes.push(codeKey(code));
  while (s.usedCodes.length > 300) s.usedCodes.shift();
  if (r.payload.re === s.houseId) s.alliances[r.suitor.house.id].replied = true;
  return { ok: true, house: r.suitor.house };
}

/** Code de proposition pour un cadet. `re` : maison à laquelle on répond (alliance scellée). */
export function proposeCadet(s: GameState, cadetId: number, re?: string): string | null {
  const c = s.cadets.find((x) => x.id === cadetId);
  if (!c) return null;
  if (re && s.alliances[re]) s.alliances[re].sent = true;
  return encodeProposal(s, c, re);
}
