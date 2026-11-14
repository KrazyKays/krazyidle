// Données de jeu — tout l'équilibrage est centralisé ici.

export type ResId = 'vivres' | 'or' | 'savoir' | 'essence';
export const RES: ResId[] = ['vivres', 'or', 'savoir', 'essence'];
export const RES_INFO: Record<ResId, { name: string; icon: string; value: number; color: string }> = {
  vivres: { name: 'Vivres', icon: '🌾', value: 1, color: '#9ccc65' },
  or: { name: 'Or', icon: '🪙', value: 2, color: '#ffca28' },
  savoir: { name: 'Savoir', icon: '📜', value: 8, color: '#4fc3f7' },
  essence: { name: 'Essence', icon: '✨', value: 20, color: '#ce93d8' },
};

export type ActId = 'cultiver' | 'chasser' | 'commercer' | 'etudier' | 'mediter';
export const ACTS: ActId[] = ['cultiver', 'chasser', 'commercer', 'etudier', 'mediter'];

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
    id: 'cultiver', name: 'Cultiver', icon: '🌱', color: '#7cb342',
    desc: 'Produit des Vivres selon la Flore du domaine. Fait pousser la Flore.',
    vocation: 'Paysan', vocationF: 'Paysanne', produce: { vivres: 1.2 }, consume: {}, unlockText: '',
  },
  chasser: {
    id: 'chasser', name: 'Chasser', icon: '🏹', color: '#d84315',
    desc: 'Rendement selon le Gibier et sa vigueur : les Prédateurs gardent les hardes saines. Trophées d\'Or s\'ils pullulent.',
    vocation: 'Chasseur', vocationF: 'Chasseresse', produce: { vivres: 2.0 }, consume: {}, unlockText: '',
  },
  commercer: {
    id: 'commercer', name: 'Commercer', icon: '⚖️', color: '#f9a825',
    desc: 'Échange des Vivres contre de l\'Or. Plus rentable avec l\'expérience.',
    vocation: 'Marchand', vocationF: 'Marchande', produce: { or: 1.5 }, consume: { vivres: 3 }, unlockText: 'Récolter 40 Vivres',
  },
  etudier: {
    id: 'etudier', name: 'Étudier', icon: '📖', color: '#0288d1',
    desc: 'Investit de l\'Or dans le Savoir.',
    vocation: 'Érudit', vocationF: 'Érudite', produce: { savoir: 0.6 }, consume: { or: 2 }, unlockText: 'Amasser 50 Or',
  },
  mediter: {
    id: 'mediter', name: 'Méditer', icon: '🕯️', color: '#8e24aa',
    desc: 'Distille de l\'Essence et ramène l\'écosystème vers l\'équilibre.',
    vocation: 'Mystique', produce: { essence: 0.06 }, consume: {}, unlockText: 'Accumuler 25 Savoir',
  },
};

export const ACT_UNLOCK: Record<ActId, { res: ResId | null; amount: number }> = {
  cultiver: { res: null, amount: 0 },
  chasser: { res: null, amount: 0 },
  commercer: { res: 'vivres', amount: 40 },
  etudier: { res: 'or', amount: 50 },
  mediter: { res: 'savoir', amount: 25 },
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
  eco?: number; // réduction d'impact écologique (0.4 = -40%)
  start?: number; // niveaux de départ
  heirs?: number;
  inherit?: number;
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
  { id: 'main_verte', name: 'Main verte', icon: '🌿', rarity: 0, desc: 'Cultiver +40%', mods: { act: { cultiver: 0.4 } } },
  { id: 'oeil_faucon', name: 'Œil de faucon', icon: '🦅', rarity: 0, desc: 'Chasser +40%', mods: { act: { chasser: 0.4 } } },
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
  { id: 'harmonieux', name: 'Harmonieux', nameF: 'Harmonieuse', icon: '☯️', rarity: 1, desc: 'Impact écologique −40%', mods: { eco: 0.4 } },
  { id: 'echo_vibrant', name: 'Écho vibrant', icon: '🔔', rarity: 1, desc: 'Puissance de son Écho +40%', mods: { echo: 0.4 } },
  { id: 'fertile', name: 'Fertile', icon: '👶', rarity: 1, desc: '+1 enfant proposé', mods: { heirs: 1 } },
  { id: 'polyvalent', name: 'Polyvalent', nameF: 'Polyvalente', icon: '🎭', rarity: 1, desc: 'Production +15%', mods: { all: 0.15 } },
  { id: 'maudit', name: 'Maudit', nameF: 'Maudite', icon: '💀', rarity: 1, neg: true, desc: 'Puissance de son Écho −40%', mods: { echo: -0.4 } },
  { id: 'genie', name: 'Génie', icon: '🧠', rarity: 2, desc: 'Expérience +60%', mods: { xp: 0.6 } },
  { id: 'memoire', name: 'Mémoire ancestrale', icon: '🌀', rarity: 2, desc: 'Puissance de son Écho +80%', mods: { echo: 0.8 } },
  { id: 'centenaire', name: 'Centenaire', icon: '⏳', rarity: 2, desc: 'Durée de vie +30 s', mods: { life: 30 } },
  { id: 'sang_dore', name: 'Sang doré', icon: '🩸', rarity: 2, desc: 'Production +35%, transmission +10%', mods: { all: 0.35, inherit: 0.1 } },
  { id: 'elu', name: 'Élu', nameF: 'Élue', icon: '👑', rarity: 3, desc: 'Production +60%, expérience +40%', mods: { all: 0.6, xp: 0.4 } },
  { id: 'eternel', name: 'Éternel', nameF: 'Éternelle', icon: '♾️', rarity: 3, desc: 'Vie +45 s, Écho +50%', mods: { life: 45, echo: 0.5 } },
  { id: 'astres', name: 'Béni des astres', nameF: 'Bénie des astres', icon: '🌠', rarity: 4, shop: true, desc: 'Production +50%, Écho +50%, transmission +20%', mods: { all: 0.5, echo: 0.5, inherit: 0.2 } },
];
export const TRAIT: Record<string, TraitDef> = Object.fromEntries(TRAITS.map((t) => [t.id, t]));

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
  effect: (lvl: number) => string;
}

export const BUILDINGS: BuildingDef[] = [
  { id: 'champs', name: 'Champs', icon: '🌾', desc: 'Cultiver +25% / niv.', cost: { vivres: 25 }, growth: 1.9, effect: (l) => `Cultiver ×${fmtMult(bMult(l, 0.25))}` },
  { id: 'pavillon', name: 'Pavillon de chasse', icon: '🛖', desc: 'Chasser +25% / niv.', cost: { vivres: 40, or: 5 }, growth: 1.9, effect: (l) => `Chasser ×${fmtMult(bMult(l, 0.25))}` },
  { id: 'comptoir', name: 'Comptoir', icon: '🏪', desc: 'Commercer +25% / niv.', cost: { or: 30 }, growth: 2.0, effect: (l) => `Commercer ×${fmtMult(bMult(l, 0.25))}` },
  { id: 'bibliotheque', name: 'Bibliothèque', icon: '🏛️', desc: 'Étudier +25%, XP +10% / niv.', cost: { savoir: 15, or: 40 }, growth: 2.1, effect: (l) => `Étudier ×${fmtMult(bMult(l, 0.25))}, XP +${l * 10}%` },
  { id: 'sanctuaire', name: 'Sanctuaire', icon: '⛩️', desc: 'Méditer +25%, Échos +10% / niv.', cost: { essence: 5, savoir: 20 }, growth: 2.2, effect: (l) => `Méditer ×${fmtMult(bMult(l, 0.25))}, Échos +${l * 10}%` },
  { id: 'clepsydre', name: 'Clepsydre', icon: '⌛', desc: 'Durée de vie +4 s / niv.', cost: { savoir: 40, essence: 8 }, growth: 2.4, max: 15, effect: (l) => `Vie +${l * 4} s` },
  { id: 'garde', name: 'Garde forestier', icon: '🌲', desc: 'Le Domaine se régénère vers l\'équilibre (+0,4 %/s / niv.)', cost: { or: 60, vivres: 100 }, growth: 2.0, max: 10, effect: (l) => `Régénération ${(l * 0.4).toFixed(1).replace('.', ',')} %/s` },
];
export const BUILDING: Record<string, BuildingDef> = Object.fromEntries(BUILDINGS.map((b) => [b.id, b]));
export const BUILDING_FOR_ACT: Record<ActId, string> = {
  cultiver: 'champs', chasser: 'pavillon', commercer: 'comptoir', etudier: 'bibliotheque', mediter: 'sanctuaire',
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
  { id: 'etoile', name: 'Bonne étoile', icon: '🍀', desc: 'Mutations plus rares et positives', base: 8, growth: 2.1, max: 5 },
  { id: 'patience', name: 'Patience', icon: '🌙', desc: 'Temps hors-ligne max +2 h', base: 5, growth: 1.8, max: 9 },
  { id: 'alliances', name: 'Alliances', icon: '💍', desc: 'Débloque les mariages avec les maisons du comté et les lignées d\'autres joueurs', base: 90, growth: 1, max: 1 },
  { id: 'chroniques', name: 'Chroniques', icon: '📜', desc: 'Débloque les Surnoms : chaque vie marquante entre dans la légende et renforce son Écho', base: 160, growth: 1, max: 1 },
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
  { id: 'moisson', name: 'Moisson dorée', icon: '🌻', desc: 'Cultiver ×3', act: { cultiver: 3 }, goal: 'vivres', color: '#9ccc65' },
  { id: 'migration', name: 'Grande migration', icon: '🦌', desc: 'Chasser ×2, le Gibier afflue', act: { chasser: 2 }, goal: 'vivres', color: '#ff7043' },
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
];
/** Prénoms féminins de FIRST_NAMES : le genre d'un personnage en est déduit à sa naissance. */
export const FEMININE_NAMES = new Set([
  'Aliénor', 'Bérénice', 'Clothilde', 'Domitille', 'Ermengarde', 'Guenièvre', 'Isaure', 'Mahaut', 'Mélisende', 'Ombeline',
  'Pétronille', 'Sibylle', 'Ysolde', 'Adélaïde', 'Hildegarde', 'Morgane', 'Séraphine', 'Viviane', 'Iseult', 'Héloïse',
]);
export const isFeminine = (name: string) => FEMININE_NAMES.has(name);

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
