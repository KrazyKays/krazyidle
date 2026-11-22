// Données de jeu — tout l'équilibrage est centralisé ici.

export type ResId = 'vivres' | 'or' | 'savoir' | 'essence';
export const RES: ResId[] = ['vivres', 'or', 'savoir', 'essence'];
export const RES_INFO: Record<ResId, { name: string; icon: string; value: number; color: string }> = {
  vivres: { name: 'Vivres', icon: '🌾', value: 1, color: '#9ccc65' },
  or: { name: 'Or', icon: '🪙', value: 2, color: '#ffca28' },
  savoir: { name: 'Savoir', icon: '📜', value: 8, color: '#4fc3f7' },
  essence: { name: 'Essence', icon: '✨', value: 20, color: '#ce93d8' },
};

/**
 * Quatre activités, une par ressource (0.4). « cultiver » est Récolter : le métier de Paysan, qui vit des
 * champs et des bois (Cultiver et Chasser fusionnés, TERRE-4). L'identifiant est resté pour les sauvegardes.
 * 0.5 (SIMPLIF-2) : plus de Domaine ni d'Harmonie (×1,27 en moyenne sur toute la production, et jusqu'à ×1,6
 * sur Récolter) ; les rendements l'intègrent (variante V3-A, lab/balance/simplif/RESULTATS.md).
 */
export type ActId = 'cultiver' | 'commercer' | 'etudier' | 'mediter';
export const ACTS: ActId[] = ['cultiver', 'commercer', 'etudier', 'mediter'];
/** Rang des activités avant la 0.4 (Chasser était le 2ᵉ) → rang actuel : Chasser devient Récolter. */
export const ACT_INDEX_V03 = [0, 0, 1, 2, 3];

export interface ActDef {
  id: ActId;
  name: string;
  icon: string;
  color: string;
  desc: string;
  vocation: string;
  /** forme féminine, si elle diffère */
  vocationF?: string;
  produce: Partial<Record<ResId, number>>;
  consume: Partial<Record<ResId, number>>;
  unlockText: string;
}

export const ACT: Record<ActId, ActDef> = {
  cultiver: {
    id: 'cultiver', name: 'Récolter', icon: '🌾', color: '#7cb342',
    desc: 'Vit des champs et des bois : produit des Vivres sans rien consommer.',
    vocation: 'Paysan', vocationF: 'Paysanne', produce: { vivres: 1.92 }, consume: {}, unlockText: '',
  },
  commercer: {
    id: 'commercer', name: 'Commercer', icon: '⚖️', color: '#f9a825',
    desc: 'Échange des Vivres contre de l\'Or. Plus rentable avec l\'expérience.',
    vocation: 'Marchand', vocationF: 'Marchande', produce: { or: 1.58 }, consume: { vivres: 3 }, unlockText: 'Récolter 40 Vivres',
  },
  etudier: {
    id: 'etudier', name: 'Étudier', icon: '📖', color: '#0288d1',
    desc: 'Investit de l\'Or dans le Savoir.',
    vocation: 'Érudit', vocationF: 'Érudite', produce: { savoir: 0.76 }, consume: { or: 2 }, unlockText: 'Amasser 40 Or',
  },
  mediter: {
    id: 'mediter', name: 'Méditer', icon: '🕯️', color: '#8e24aa',
    desc: 'Distille de l\'Essence dans le silence.',
    vocation: 'Mystique', produce: { essence: 0.127 }, consume: {}, unlockText: 'Accumuler 20 Savoir',
  },
};

export const ACT_UNLOCK: Record<ActId, { res: ResId | null; amount: number }> = {
  cultiver: { res: null, amount: 0 },
  commercer: { res: 'vivres', amount: 40 },
  etudier: { res: 'or', amount: 40 },
  mediter: { res: 'savoir', amount: 20 },
};

// --- Compétences ---------------------------------------------------------
export const xpToNext = (lvl: number) => 5 * Math.pow(1.3, lvl);
export const skillMult = (lvl: number) => 1 + 0.25 * lvl + 0.01 * lvl * lvl;

// --- Traits (gènes) --------------------------------------------------------
export interface Mods {
  act?: Partial<Record<ActId, number>>; // +x (0.4 = +40%)
  all?: number;
  xp?: number;
  life?: number; // secondes
  echo?: number;
  /** usure du sang ralentie : +1 − wear par génération de transmission (Harmonieux 0.5) */
  wear?: number;
  start?: number; // niveaux de départ
  heirs?: number;
  inherit?: number;
  /** pendant la vie du héros, puissance de tous les Échos ×(1 + crypt) (Étoile filante) */
  crypt?: number;
}

export interface TraitDef {
  id: string;
  name: string;
  /** forme féminine, si elle diffère */
  nameF?: string;
  icon: string;
  rarity: 0 | 1 | 2 | 3 | 4; // commun, rare, épique, légendaire, mythique
  neg?: boolean;
  shop?: boolean; // obtenable uniquement au Bazar céleste
  /**
   * Étoile filante : n'apparaît que par mutation, ne se transmet pas (ni aux enfants, ni par une union),
   * ne s'achète pas, et la vie qui la porte ne laisse pas d'Écho.
   */
  nova?: boolean;
  /**
   * Version d'apparition. Les traits ajoutés après la 0.2.2 sont tenus à l'écart du Destin du jour et des
   * maisons du comté, tirés de la même façon pour tous : sans ça, ajouter un trait changerait la partie du
   * jour (codes EL2 déjà partagés) et les maisons de la semaine d'un joueur à l'autre.
   */
  since?: string;
  /** forme mûrie d'un don : n'apparaît que par évolution, jamais par mutation */
  matured?: boolean;
  desc: string;
  mods: Mods;
}

export const RARITY = [
  { name: 'Commun', color: '#b0bec5' },
  { name: 'Rare', color: '#42a5f5' },
  { name: 'Épique', color: '#ab47bc' },
  { name: 'Légendaire', color: '#ffa726' },
  { name: 'Mythique', color: '#ff4081' },
];

export const TRAITS: TraitDef[] = [
  { id: 'main_verte', name: 'Main verte', icon: '🌿', rarity: 0, desc: 'Récolter +40%', mods: { act: { cultiver: 0.4 } } },
  { id: 'langue_argent', name: 'Langue d\'argent', icon: '🗣️', rarity: 0, desc: 'Commercer +40%', mods: { act: { commercer: 0.4 } } },
  { id: 'rat_biblio', name: 'Rat de bibliothèque', icon: '🐭', rarity: 0, desc: 'Étudier +40%', mods: { act: { etudier: 0.4 } } },
  { id: 'ame_calme', name: 'Âme calme', icon: '🍃', rarity: 0, desc: 'Méditer +40%', mods: { act: { mediter: 0.4 } } },
  { id: 'robuste', name: 'Robuste', icon: '💪', rarity: 0, desc: 'Durée de vie +8 s', mods: { life: 8 } },
  { id: 'curieux', name: 'Curieux', nameF: 'Curieuse', icon: '🔍', rarity: 0, desc: 'Expérience +25%', mods: { xp: 0.25 } },
  { id: 'fragile', name: 'Fragile', icon: '🥀', rarity: 0, neg: true, desc: 'Durée de vie −8 s', mods: { life: -8 } },
  { id: 'distrait', name: 'Distrait', nameF: 'Distraite', icon: '💭', rarity: 0, neg: true, desc: 'Expérience −20%', mods: { xp: -0.2 } },
  { id: 'maladroit', name: 'Maladroit', nameF: 'Maladroite', icon: '🤕', rarity: 0, neg: true, desc: 'Production −10%', mods: { all: -0.1 } },
  { id: 'prodige', name: 'Prodige', icon: '⭐', rarity: 1, desc: 'Compétences niveau +1 au départ', mods: { start: 1 } },
  { id: 'longevite', name: 'Longévité', icon: '🐢', rarity: 1, desc: 'Durée de vie +15 s', mods: { life: 15 } },
  { id: 'harmonieux', name: 'Harmonieux', nameF: 'Harmonieuse', icon: '☯️', rarity: 1, desc: 'Ses dons s\'usent deux fois moins vite', mods: { wear: 0.5 } },
  { id: 'echo_vibrant', name: 'Écho vibrant', icon: '🔔', rarity: 1, desc: 'Puissance de son Écho +40%', mods: { echo: 0.4 } },
  { id: 'fertile', name: 'Fertile', icon: '👶', rarity: 1, desc: '+1 enfant proposé', mods: { heirs: 1 } },
  { id: 'polyvalent', name: 'Polyvalent', nameF: 'Polyvalente', icon: '🎭', rarity: 1, desc: 'Production +15%', mods: { all: 0.15 } },
  { id: 'maudit', name: 'Maudit', nameF: 'Maudite', icon: '💀', rarity: 1, neg: true, desc: 'Puissance de son Écho −40%', mods: { echo: -0.4 } },
  { id: 'genie', name: 'Génie', icon: '🧠', rarity: 2, desc: 'Expérience +60%', mods: { xp: 0.6 } },
  { id: 'memoire', name: 'Mémoire ancestrale', icon: '🌀', rarity: 2, desc: 'Puissance de son Écho +80%', mods: { echo: 0.8 } },
  { id: 'centenaire', name: 'Centenaire', icon: '⏳', rarity: 2, desc: 'Durée de vie +30 s', mods: { life: 30 } },
  { id: 'sang_dore', name: 'Sang doré', icon: '🩸', rarity: 2, desc: 'Production +60%, transmission +10%', mods: { all: 0.6, inherit: 0.1 } },
  { id: 'elu', name: 'Élu', nameF: 'Élue', icon: '👑', rarity: 3, desc: 'Production +80%, expérience +40%', mods: { all: 0.8, xp: 0.4 } },
  { id: 'eternel', name: 'Éternel', nameF: 'Éternelle', icon: '♾️', rarity: 3, desc: 'Vie +45 s, Écho +50%', mods: { life: 45, echo: 0.5 } },
  { id: 'astres', name: 'Béni des astres', nameF: 'Bénie des astres', icon: '🌠', rarity: 4, shop: true, desc: 'Production +50%, Écho +50%, transmission +20%', mods: { all: 0.5, echo: 0.5, inherit: 0.2 } },
  // --- 0.3 ---
  // Formes mûries des dons d'activité (voir evolution.ts) : elles ne naissent pas par mutation.
  { id: 'seve', name: 'Sève de la terre', icon: '🌱', rarity: 1, since: '0.3', matured: true, desc: 'Récolter +90%', mods: { act: { cultiver: 0.9 } } },
  { id: 'langue_or', name: 'Langue d\'or', icon: '🪙', rarity: 1, since: '0.3', matured: true, desc: 'Commercer +90%', mods: { act: { commercer: 0.9 } } },
  { id: 'encyclopedique', name: 'Esprit encyclopédique', icon: '📚', rarity: 1, since: '0.3', matured: true, desc: 'Étudier +90%', mods: { act: { etudier: 0.9 } } },
  { id: 'troisieme_oeil', name: 'Troisième œil', icon: '👁️', rarity: 1, since: '0.3', matured: true, desc: 'Méditer +90%', mods: { act: { mediter: 0.9 } } },
  { id: 'etoile_filante', name: 'Étoile filante', icon: '💫', rarity: 3, nova: true, since: '0.3', desc: 'Tous les Échos ×2 pendant sa vie. Ne se transmet pas, ne laisse pas d\'Écho', mods: { crypt: 1 } },
];
export const TRAIT: Record<string, TraitDef> = Object.fromEntries(TRAITS.map((t) => [t.id, t]));
/** Traits fusionnés en 0.4 (dons de chasse → dons de récolte) : appliqué aux sauvegardes. */
export const TRAIT_RENAMED_V04: Record<string, string> = { oeil_faucon: 'main_verte', pas_loup: 'seve' };

// --- Génome : budget et usure du sang ---------------------------------------
/** Poids génétique total des traits positifs qu'un héritier peut porter (hors Bénédictions). */
export const GENOME_BUDGET = 6;
/** Poids par rareté : Commun, Rare, Épique, Légendaire, Mythique. Les traits négatifs ne pèsent rien. */
export const TRAIT_WEIGHT = [1, 1, 2, 3, 4];
export function traitWeight(id: string): number {
  const t = TRAIT[id];
  return !t || t.neg ? 0 : TRAIT_WEIGHT[t.rarity];
}
export function genomeWeight(ids: string[]): number {
  return ids.reduce((a, id) => a + traitWeight(id), 0);
}
/** Chaque génération de transmission d'un même don réduit sa chance de passer de 6 % (×0,3 au plus bas). */
export const WEAR_STEP = 0.06;
export const WEAR_FLOOR = 0.3;
export function wearMult(w: number): number {
  return Math.max(WEAR_FLOOR, 1 - WEAR_STEP * Math.max(0, w));
}

// --- Mutations et évolution (0.3) -------------------------------------------
/**
 * Poids des raretés d'une mutation (Commun, Rare, Épique, Légendaire) selon Bonne étoile. Depuis la 0.3, une
 * mutation ne donne plus de légendaire, et l'épique se fait rare : les grands dons se méritent par l'évolution
 * (avant : 60/28/10/2, +3 épique et +1 légendaire par niveau ; une succession de fin de partie montrait un
 * légendaire environ 4 fois sur 10).
 */
export function mutationWeights(luck: number): number[] {
  return [64 - 4 * luck, 30 + 3 * luck, 6 + 1 * luck, 0];
}
/**
 * Chance qu'un don mûr passe à l'enfant sous sa forme supérieure, puis bonus par niveau de Bonne étoile.
 * Retenue en mémoire parmi 0,25 / 0,4 / 0,6 et six variantes (lab/balance/evo/RESULTATS.md). En compensation
 * de la rareté du légendaire (Élu était porté par 82 à 86 % des héros des profils avancés), Sang doré passe
 * de +35 % à +60 % de production et Élu de +60 % à +80 %.
 */
export const EVO_CHANCE = 0.25;
export const EVO_LUCK = 0.08;
/** Vers le légendaire, la chance est multipliée par ce facteur : le sommet doit rester un événement. */
export const EVO_LEGENDARY = 0.5;
/** Chance qu'une succession compte une Étoile filante parmi les enfants, puis bonus par niveau de Bonne étoile. */
export const NOVA_CHANCE = 0.002;
export const NOVA_LUCK = 0.0004;

export const VOCATION_BONUS = 0.2; // par rang
export const VOCATION_MAX = 10;

// --- Bâtiments du Domaine -----------------------------------------------
export interface BuildingDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  cost: Partial<Record<ResId, number>>;
  growth: number;
  max?: number;
  /** génération à partir de laquelle le bâtiment peut être bâti (et apparaît) */
  minGen?: number;
  effect: (lvl: number) => string;
}

export const BUILDINGS: BuildingDef[] = [
  { id: 'champs', name: 'Champs et garennes', icon: '🌾', desc: 'Récolter +25% / niv.', cost: { vivres: 25 }, growth: 1.9, effect: (l) => `Récolter ×${fmtMult(bMult(l, 0.25))}` },
  { id: 'comptoir', name: 'Comptoir', icon: '🏪', desc: 'Commercer +25% / niv.', cost: { or: 30 }, growth: 2.0, effect: (l) => `Commercer ×${fmtMult(bMult(l, 0.25))}` },
  { id: 'bibliotheque', name: 'Bibliothèque', icon: '🏛️', desc: 'Étudier +25%, XP +10% / niv.', cost: { savoir: 15, or: 40 }, growth: 2.1, effect: (l) => `Étudier ×${fmtMult(bMult(l, 0.25))}, XP +${l * 10}%` },
  { id: 'sanctuaire', name: 'Sanctuaire', icon: '⛩️', desc: 'Méditer +25%, Échos +10% / niv.', cost: { essence: 5 }, growth: 2.2, effect: (l) => `Méditer ×${fmtMult(bMult(l, 0.25))}, Échos +${l * 10}%` },
  { id: 'clepsydre', name: 'Clepsydre', icon: '⌛', desc: 'Durée de vie +4 s / niv.', cost: { savoir: 40, essence: 8 }, growth: 2.4, max: 15, effect: (l) => `Vie +${l * 4} s` },
];
export const BUILDING: Record<string, BuildingDef> = Object.fromEntries(BUILDINGS.map((b) => [b.id, b]));
export const BUILDING_FOR_ACT: Record<ActId, string> = {
  cultiver: 'champs', commercer: 'comptoir', etudier: 'bibliotheque', mediter: 'sanctuaire',
};

/** Multiplicateur de bâtiment : +x par niveau, ×2 tous les 10 niveaux. */
export function bMult(lvl: number, per: number) {
  return (1 + per * lvl) * Math.pow(2, Math.floor(lvl / 10));
}
function fmtMult(x: number) {
  return x < 10 ? x.toFixed(2) : x.toFixed(1);
}

// --- Arbre de Lignée (prestige) ------------------------------------------
export interface LegacyDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  base: number;
  growth: number;
  max?: number;
}
export const LEGACY: LegacyDef[] = [
  { id: 'prosperite', name: 'Prospérité', icon: '🌞', desc: 'Toute production ×1.12 / niv.', base: 3, growth: 1.45 },
  { id: 'longevite', name: 'Sève éternelle', icon: '🌳', desc: 'Durée de vie +8 s / niv.', base: 4, growth: 1.65, max: 12 },
  { id: 'memoire', name: 'Mémoire du sang', icon: '🌀', desc: 'Puissance des Échos +15% / niv.', base: 5, growth: 1.55 },
  { id: 'crypte', name: 'Crypte ancestrale', icon: '⚰️', desc: '+1 emplacement d\'Écho', base: 12, growth: 2.6, max: 6 },
  { id: 'eveil', name: 'Éveil précoce', icon: '🌅', desc: 'Toutes compétences niv. +1 au départ', base: 10, growth: 2.2, max: 6 },
  { id: 'transmission', name: 'Transmission', icon: '🧬', desc: 'Chance d\'hériter des traits +8%', base: 6, growth: 1.9, max: 5 },
  { id: 'sang', name: 'Sang fécond', icon: '👪', desc: '+1 enfant proposé', base: 9, growth: 2.8, max: 3 },
  { id: 'etoile', name: 'Bonne étoile', icon: '🍀', desc: 'Mutations plus rares et positives, dons qui mûrissent plus souvent', base: 8, growth: 2.1, max: 5 },
  { id: 'patience', name: 'Patience', icon: '🌙', desc: 'Temps hors-ligne max +2 h', base: 5, growth: 1.8, max: 9 },
  { id: 'alliances', name: 'Alliances', icon: '💍', desc: 'Débloque les mariages avec les maisons du comté et les lignées d\'autres joueurs', base: 45, growth: 1, max: 1 },
  { id: 'chroniques', name: 'Chroniques', icon: '📜', desc: 'Débloque les Surnoms : chaque vie marquante entre dans la légende et renforce son Écho', base: 90, growth: 1, max: 1 },
];
export const LEGACY_DEF: Record<string, LegacyDef> = Object.fromEntries(LEGACY.map((l) => [l.id, l]));
export const legacyCost = (d: LegacyDef, lvl: number) => Math.ceil(d.base * Math.pow(d.growth, lvl));

// --- Événements planifiés -------------------------------------------------
export interface EventDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  act?: Partial<Record<ActId, number>>; // multiplicateurs
  xp?: number;
  echo?: number;
  goal: ResId;
  color: string;
}
export const EVENTS: EventDef[] = [
  { id: 'maree', name: 'Marée d\'or', icon: '🌊', desc: 'Commercer ×3', act: { commercer: 3 }, goal: 'or', color: '#ffca28' },
  { id: 'moisson', name: 'Moisson dorée', icon: '🌻', desc: 'Récolter ×3', act: { cultiver: 3 }, goal: 'vivres', color: '#9ccc65' },
  // 0.5 (SIMPLIF-3) : « Grande migration » (Gibier) devient le Grand marché ; l'identifiant reste (Almanach, calendrier).
  { id: 'migration', name: 'Grand marché', icon: '🎪', desc: 'Commercer ×2, dot ÷2', act: { commercer: 2 }, goal: 'or', color: '#ff7043' },
  { id: 'eclipse', name: 'Éclipse', icon: '🌑', desc: 'Méditer ×3, Échos ×1.5', act: { mediter: 3 }, echo: 1.5, goal: 'essence', color: '#ba68c8' },
  { id: 'comete', name: 'Comète savante', icon: '☄️', desc: 'Étudier ×2, XP ×3', act: { etudier: 2 }, xp: 3, goal: 'savoir', color: '#4fc3f7' },
  { id: 'concile', name: 'Concile des ancêtres', icon: '🕯️', desc: 'Échos ×2.5', echo: 2.5, goal: 'or', color: '#e0e0e0' },
];
export const EVENT_DEF: Record<string, EventDef> = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
/** Heures UTC de début des événements (toutes les 4 h) et durée. */
export const EVENT_HOURS_UTC = [0, 4, 8, 12, 16, 20];
export const EVENT_DURATION_MIN = 45;

// --- Noms ------------------------------------------------------------------
export const FIRST_NAMES = [
  'Aliénor', 'Aymeric', 'Bérénice', 'Bertrand', 'Clothilde', 'Clovis', 'Domitille', 'Enguerrand', 'Ermengarde', 'Gaspard',
  'Guenièvre', 'Hugues', 'Isaure', 'Jehan', 'Léodegar', 'Mahaut', 'Mélisende', 'Ombeline', 'Perceval', 'Pétronille',
  'Roland', 'Sibylle', 'Tancrède', 'Thibaut', 'Ysolde', 'Yvain', 'Adélaïde', 'Godefroy', 'Hildegarde', 'Lancelot',
  'Morgane', 'Rodolphe', 'Séraphine', 'Tristan', 'Viviane', 'Baudouin', 'Iseult', 'Gauvain', 'Héloïse', 'Arnaud',
  'Aude', 'Alix', 'Azalaïs', 'Aénor', 'Béatrix', 'Blanche', 'Brunehaut', 'Constance', 'Cunégonde', 'Ermessende',
  'Esclarmonde', 'Frédégonde', 'Gersende', 'Jehanne', 'Odile', 'Oriane', 'Philippa', 'Radegonde', 'Richilde', 'Sancie',
  'Aimery', 'Amaury', 'Anseau', 'Archambaud', 'Bohémond', 'Eudes', 'Évrard', 'Foulques', 'Galaad', 'Gautier',
  'Géraud', 'Hardouin', 'Josselin', 'Lothaire', 'Mérovée', 'Odon', 'Raimbaut', 'Renaud', 'Thierry', 'Ulric',
];
/**
 * Les 40 premiers prénoms (ceux de la 0.2.2) : le héros du Destin du jour y reste tiré, pour qu'il porte
 * le même prénom chez tous les joueurs, quelle que soit leur version.
 */
export const DAILY_NAMES = FIRST_NAMES.slice(0, 40);
/** Prénoms féminins de FIRST_NAMES : le genre d'un personnage en est déduit à sa naissance. */
export const FEMININE_NAMES = new Set([
  'Aliénor', 'Bérénice', 'Clothilde', 'Domitille', 'Ermengarde', 'Guenièvre', 'Isaure', 'Mahaut', 'Mélisende', 'Ombeline',
  'Pétronille', 'Sibylle', 'Ysolde', 'Adélaïde', 'Hildegarde', 'Morgane', 'Séraphine', 'Viviane', 'Iseult', 'Héloïse',
  'Aude', 'Alix', 'Azalaïs', 'Aénor', 'Béatrix', 'Blanche', 'Brunehaut', 'Constance', 'Cunégonde', 'Ermessende',
  'Esclarmonde', 'Frédégonde', 'Gersende', 'Jehanne', 'Odile', 'Oriane', 'Philippa', 'Radegonde', 'Richilde', 'Sancie',
]);
export const isFeminine = (name: string) => FEMININE_NAMES.has(name) || name === 'Jolyne';

// --- Easter egg : la Maison Joestar ----------------------------------------
/**
 * Dans une maison nommée Joestar, un enfant de chaque génération porte le prénom du JoJo de la partie
 * correspondante (génération I = Jonathan, II = Joseph…), puis le cycle reprend. Purement cosmétique.
 */
export const JOJO_LINE = ['Jonathan', 'Joseph', 'Jotaro', 'Josuke', 'Giorno', 'Jolyne', 'Johnny', 'Josuke', 'Jodio'];
/** « Joestar », « JOESTAR », « Joëstar », « Joe Star »… */
export const isJoestar = (house: string) => house.normalize('NFD').replace(/[^a-z]/gi, '').toLowerCase() === 'joestar';
export const isJojo = (name: string) => JOJO_LINE.includes(name);

// --- Accords ---------------------------------------------------------------
export type Sex = 'f' | 'm';
/** Tout ce qui porte un prénom : héros, héritier, Écho, ancêtre, Destin du jour. */
export interface Named { name: string; sex?: Sex }
export const sexFor = (name: string): Sex => (isFeminine(name) ? 'f' : 'm');
/** Le genre stocké, ou à défaut celui du prénom (anciennes sauvegardes). */
export const sexOf = (p: Named): Sex => p.sex ?? sexFor(p.name);
/** Accorde selon le personnage : acc(hero, 'Élu', 'Élue'). */
export const acc = (p: Named, m: string, f: string) => (sexOf(p) === 'f' ? f : m);
/** Nom d'un trait accordé au personnage ; sans personnage, les deux formes. */
export function traitName(t: TraitDef, p?: Named | null): string {
  if (!t.nameF) return t.name;
  return p ? acc(p, t.name, t.nameF) : `${t.name} / ${t.nameF}`;
}
/** Titre de vocation (« Paysanne III ») accordé au personnage. */
export function vocationName(v: { act: ActId; tier: number }, p: Named, roman: (n: number) => string): string {
  const d = ACT[v.act];
  return `${d.vocationF ? acc(p, d.vocation, d.vocationF) : d.vocation} ${roman(v.tier)}`;
}
export const HOUSE_NAMES = [
  'Valombre', 'Hautecour', 'Dorval', 'Montfaucon', 'Bellerive', 'Aubépine', 'Grisemont', 'Ventadour', 'Châtelfort', 'Clairval',
  'Brumefer', 'Corbenay', 'Sombreval', 'Ardanel', 'Fontclaire', 'Rochebrune', 'Givremont', 'Lunebois', 'Morvenant', 'Saint-Aubrac',
];
export const CRESTS = ['🦁', '🦅', '🐺', '🐉', '🦌', '🌙', '☀️', '🌹', '🦉', '🐻', '⚔️', '🗝️'];
export const CREST_COLORS = ['#c62828', '#1565c0', '#2e7d32', '#6a1b9a', '#ef6c00', '#37474f', '#ad1457', '#00838f'];
