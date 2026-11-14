// Surnoms (Chroniques) : à sa mort, une vie marquante reçoit un surnom qui suit son Écho pour toujours.
// Débloqué par l'amélioration d'Héritage « Chroniques ». Les conditions restent cachées : le Codex
// n'en montre qu'un indice, pour qu'on découvre les surnoms en jouant plutôt qu'en cochant une liste.
import { ACTS, sexOf, type ActId, type Named } from './data';

/** Ce que l'on sait d'une vie au moment de sa mort. */
export interface LifeFacts {
  /** part de la vie passée dans chaque activité (0..1) */
  share: Record<ActId, number>;
  /** nombre d'activités pratiquées au moins 10 % du temps */
  used: number;
  switches: number;
  harmonyAvg: number;
  harmonyMin: number;
  value: number;
  /** valeur de la vie du parent (0 pour la première) */
  parentValue: number;
  /** meilleure vie de la lignée avant celle-ci */
  bestBefore: number;
  gen: number;
  traits: string[];
  negTraits: number;
  /** rang de vocation transmis (0 = aucun) */
  vocTier: number;
  /** durée de la vie rapportée à une vie sans traits ni Temps suspendu (1 = normale) */
  durRatio: number;
  extended: boolean;
  spouse: 'pnj' | 'joueur' | null;
  /** meilleur palier d'événement atteint (0..3) */
  eventTier: number;
  builds: number;
  /** Gibier et Prédateurs à la mort */
  game: number;
  predators: number;
}

/** Effet sur l'Écho : puissance globale, puissance par activité, impact sur le Domaine (+0.5 = +50 %). */
export interface EpithetMods {
  pow?: number;
  act?: Partial<Record<ActId, number>>;
  eco?: number;
}

export interface EpithetDef {
  id: string;
  /** avec l'article : « le Juste », « l'Ermite » */
  name: string;
  nameF?: string;
  icon: string;
  /** 0 commun · 1 rare · 2 épique · 3 légendaire */
  rarity: 0 | 1 | 2 | 3;
  hint: string;
  test: (f: LifeFacts) => boolean;
  mods: EpithetMods;
}

// La production croît vite : battre le record de peu est banal. Il faut l'écraser.
const isRecord = (f: LifeFacts, x = 1.5) => f.bestBefore > 0 && f.value >= x * f.bestBefore;
/** A vécu de la terre et des bois (Cultiver + Chasser) : l'Harmonie compte vraiment. */
const worksLand = (f: LifeFacts) => f.share.cultiver + f.share.chasser >= 0.5;

// Ordre = priorité à rareté égale : les conditions les plus précises d'abord.
export const EPITHETS: EpithetDef[] = [
  // --- Légendaires
  { id: 'maudit_glorieux', name: 'le Maudit glorieux', nameF: 'la Maudite glorieuse', icon: '💀', rarity: 3, hint: 'Porter la malédiction… et surpasser pourtant tous les ancêtres.', test: (f) => f.traits.includes('maudit') && isRecord(f), mods: { pow: 0.5 } },
  { id: 'glorieux', name: 'le Glorieux', nameF: 'la Glorieuse', icon: '☀️', rarity: 3, hint: 'Doubler la gloire de tous les ancêtres en vivant de la terre, sans troubler la paix des bois.', test: (f) => isRecord(f, 2) && worksLand(f) && f.harmonyAvg >= 0.95 && f.gen >= 10, mods: { pow: 0.3, eco: -0.3 } },
  { id: 'phenix', name: 'le Phénix', nameF: 'la Phénix', icon: '🪶', rarity: 3, hint: 'Renaître des cendres d\'un parent qui n\'a rien laissé.', test: (f) => f.parentValue > 0 && f.value >= 5 * f.parentValue && f.gen >= 10, mods: { pow: 0.35 } },
  // --- Épiques
  { id: 'grand', name: 'le Grand', nameF: 'la Grande', icon: '👑', rarity: 2, hint: 'Faire bien mieux que tous ceux qui sont venus avant.', test: (f) => isRecord(f) && f.gen >= 5, mods: { pow: 0.15 } },
  { id: 'venerable', name: 'le Vénérable', nameF: 'la Vénérable', icon: '🎖️', rarity: 2, hint: 'Porter un métier jusqu\'à son plus haut rang.', test: (f) => f.vocTier >= 10, mods: { pow: 0.15 } },
  { id: 'patriarche', name: 'le Patriarche', nameF: 'la Matriarche', icon: '🏰', rarity: 2, hint: 'Naître à un âge rond de la lignée : un quart de siècle, puis encore.', test: (f) => f.gen % 25 === 0, mods: { pow: 0.15 } },
  { id: 'ermite', name: 'l\'Ermite', icon: '🌲', rarity: 2, hint: 'Fuir les marchés et prier au fond des bois, en paix avec eux.', test: (f) => f.share.mediter >= 0.6 && f.share.commercer === 0 && f.harmonyAvg >= 0.8, mods: { act: { mediter: 0.25 }, eco: -0.3 } },
  { id: 'sage', name: 'le Sage', nameF: 'la Sage', icon: '🦉', rarity: 2, hint: 'Étudier toute sa vie, et en avoir fait un métier reconnu.', test: (f) => f.share.etudier >= 0.5 && f.vocTier >= 5, mods: { act: { etudier: 0.25 } } },
  { id: 'sans_repos', name: 'le Sans-Repos', nameF: 'la Sans-Repos', icon: '🌪️', rarity: 2, hint: 'Ne jamais tenir en place, et toucher à presque tout.', test: (f) => f.switches >= 50 && f.used >= 4, mods: { pow: 0.12 } },
  // --- Rares
  { id: 'bien_aime', name: 'le Bien-Aimé', nameF: 'la Bien-Aimée', icon: '💞', rarity: 1, hint: 'Épouser quelqu\'un venu d\'une lignée lointaine, au-delà du comté.', test: (f) => f.spouse === 'joueur', mods: { pow: 0.1 } },
  { id: 'juste', name: 'le Juste', nameF: 'la Juste', icon: '🕊️', rarity: 1, hint: 'Vivre de la terre et des bois sans jamais en troubler l\'équilibre.', test: (f) => worksLand(f) && f.harmonyAvg >= 0.97 && f.harmonyMin >= 0.9, mods: { eco: -0.4 } },
  { id: 'devastateur', name: 'le Dévastateur', nameF: 'la Dévastatrice', icon: '🔥', rarity: 1, hint: 'Laisser derrière soi un Domaine à l\'agonie.', test: (f) => f.harmonyMin <= 0.3, mods: { pow: 0.15, eco: 0.5 } },
  { id: 'tueur_loups', name: 'le Tueur de loups', nameF: 'la Tueuse de loups', icon: '🐺', rarity: 1, hint: 'Que les hurlements se taisent dans les bois.', test: (f) => f.share.chasser >= 0.4 && f.predators <= 2, mods: { act: { chasser: 0.15 }, eco: 0.2 } },
  { id: 'boucher', name: 'le Boucher', nameF: 'la Bouchère', icon: '🪓', rarity: 1, hint: 'Chasser jusqu\'à ce que les hardes ne soient plus qu\'un souvenir.', test: (f) => f.share.chasser >= 0.5 && f.game <= 10, mods: { act: { chasser: 0.15 }, eco: 0.3 } },
  { id: 'jardinier', name: 'le Jardinier', nameF: 'la Jardinière', icon: '🌷', rarity: 1, hint: 'Cultiver beaucoup, sans jamais épuiser la terre.', test: (f) => f.share.cultiver >= 0.5 && f.harmonyAvg >= 0.9, mods: { act: { cultiver: 0.15 }, eco: -0.2 } },
  { id: 'alchimiste', name: 'l\'Alchimiste', icon: '⚗️', rarity: 1, hint: 'Partager sa vie entre les livres et la méditation.', test: (f) => f.share.etudier >= 0.35 && f.share.mediter >= 0.35, mods: { act: { etudier: 0.1, mediter: 0.1 } } },
  { id: 'pelletier', name: 'le Pelletier', nameF: 'la Pelletière', icon: '🦊', rarity: 1, hint: 'Chasser, puis vendre ce qu\'on a chassé.', test: (f) => f.share.chasser >= 0.35 && f.share.commercer >= 0.35, mods: { act: { chasser: 0.1, commercer: 0.1 } } },
  { id: 'maraicher', name: 'le Maraîcher', nameF: 'la Maraîchère', icon: '🥕', rarity: 1, hint: 'Cultiver, puis porter sa récolte au marché.', test: (f) => f.share.cultiver >= 0.35 && f.share.commercer >= 0.35, mods: { act: { cultiver: 0.1, commercer: 0.1 } } },
  { id: 'batisseur', name: 'le Bâtisseur', nameF: 'la Bâtisseuse', icon: '🏗️', rarity: 1, hint: 'Faire sortir de terre bâtiment sur bâtiment, en une seule vie.', test: (f) => f.builds >= 10, mods: { pow: 0.08 } },
  { id: 'bienheureux', name: 'le Bienheureux', nameF: 'la Bienheureuse', icon: '🌟', rarity: 1, hint: 'Vivre au bon moment, et briller lorsque le monde entier regarde.', test: (f) => f.eventTier >= 3, mods: { pow: 0.1 } },
  { id: 'constant', name: 'le Constant', nameF: 'la Constante', icon: '🪨', rarity: 1, hint: 'Une seule tâche, du premier au dernier jour.', test: (f) => f.switches <= 1 && Math.max(...ACTS.map((a) => f.share[a])) >= 0.95, mods: { pow: 0.08 } },
  { id: 'ancien', name: 'l\'Ancien', nameF: 'l\'Ancienne', icon: '🧓', rarity: 1, hint: 'Voir passer bien plus de saisons que les autres.', test: (f) => f.durRatio >= 1.4, mods: { pow: 0.08 } },
  { id: 'infortune', name: 'l\'Infortuné', nameF: 'l\'Infortunée', icon: '🌧️', rarity: 1, hint: 'Naître avec plus d\'un mauvais présage dans le sang.', test: (f) => f.negTraits >= 2, mods: { pow: 0.1 } },
  // --- Communs
  { id: 'laboureur', name: 'le Laboureur', nameF: 'la Laboureuse', icon: '🌾', rarity: 0, hint: 'Ne vivre que pour la terre.', test: (f) => f.share.cultiver >= 0.75, mods: { act: { cultiver: 0.1 } } },
  { id: 'veneur', name: 'le Veneur', nameF: 'la Veneuse', icon: '🏹', rarity: 0, hint: 'Ne vivre que pour la traque.', test: (f) => f.share.chasser >= 0.75, mods: { act: { chasser: 0.1 } } },
  { id: 'negociant', name: 'le Négociant', nameF: 'la Négociante', icon: '⚖️', rarity: 0, hint: 'Ne vivre que pour le marché.', test: (f) => f.share.commercer >= 0.75, mods: { act: { commercer: 0.1 } } },
  { id: 'savant', name: 'le Savant', nameF: 'la Savante', icon: '📖', rarity: 0, hint: 'Ne vivre que pour les livres.', test: (f) => f.share.etudier >= 0.75, mods: { act: { etudier: 0.1 } } },
  { id: 'contemplatif', name: 'le Contemplatif', nameF: 'la Contemplative', icon: '🕯️', rarity: 0, hint: 'Ne vivre que pour le silence.', test: (f) => f.share.mediter >= 0.75, mods: { act: { mediter: 0.1 } } },
  { id: 'touche_a_tout', name: 'le Touche-à-tout', nameF: 'la Touche-à-tout', icon: '🧰', rarity: 0, hint: 'Goûter à chacun des cinq métiers.', test: (f) => f.used >= 5, mods: { pow: 0.05 } },
  { id: 'epris', name: 'l\'Épris', nameF: 'l\'Éprise', icon: '💍', rarity: 0, hint: 'S\'unir à une maison du comté.', test: (f) => f.spouse === 'pnj', mods: { pow: 0.03 } },
  { id: 'obstine', name: 'l\'Obstiné', nameF: 'l\'Obstinée', icon: '⌛', rarity: 0, hint: 'Supplier le Sablier de quelques années de plus.', test: (f) => f.extended, mods: {} },
  { id: 'inconstant', name: 'l\'Inconstant', nameF: 'l\'Inconstante', icon: '🎭', rarity: 0, hint: 'Changer d\'avis plus souvent que de chemise.', test: (f) => f.switches >= 25, mods: {} },
  { id: 'bref', name: 'le Bref', nameF: 'la Brève', icon: '🥀', rarity: 0, hint: 'Une vie trop courte pour qu\'on s\'en souvienne… ou presque.', test: (f) => f.durRatio <= 0.85, mods: {} },
  { id: 'faineant', name: 'le Fainéant', nameF: 'la Fainéante', icon: '💤', rarity: 0, hint: 'Faire bien moins que son père ou sa mère.', test: (f) => f.parentValue > 0 && f.value < 0.2 * f.parentValue, mods: {} },
];

export const EPITHET: Record<string, EpithetDef> = Object.fromEntries(EPITHETS.map((e) => [e.id, e]));

/** Éclats ✦ offerts à la première découverte, selon la rareté. */
export const EPITHET_ECLATS = [1, 2, 3, 5];
export const EPITHET_RARITY = [
  { name: 'Commun', color: '#b0bec5' },
  { name: 'Rare', color: '#42a5f5' },
  { name: 'Épique', color: '#ab47bc' },
  { name: 'Légendaire', color: '#ffa726' },
];

/** Le surnom le plus rare que la vie remplit (à rareté égale, le premier de la liste), ou null. */
export function pickEpithet(f: LifeFacts): EpithetDef | null {
  let best: EpithetDef | null = null;
  for (const e of EPITHETS) if ((!best || e.rarity > best.rarity) && e.test(f)) best = e;
  return best;
}

/** « le Juste » ou « la Juste » selon le personnage. */
export function epithetLabel(id: string | undefined, p: Named | null): string {
  const e = id ? EPITHET[id] : undefined;
  if (!e) return '';
  if (!e.nameF) return e.name;
  return p ? (sexOf(p) === 'f' ? e.nameF : e.name) : `${e.name} / ${e.nameF}`;
}

/** « Jehan le Juste », ou le prénom seul. */
export function fullName(p: Named & { epithet?: string }): string {
  const l = epithetLabel(p.epithet, p);
  return l ? `${p.name} ${l}` : p.name;
}

/** Résumé lisible de l'effet d'un surnom sur l'Écho. */
export function epithetEffect(e: EpithetDef, actName: (a: ActId) => string): string {
  const parts: string[] = [];
  const pct = (x: number) => `${x > 0 ? '+' : '−'}${Math.round(Math.abs(x) * 100)} %`;
  if (e.mods.pow) parts.push(`puissance ${pct(e.mods.pow)}`);
  if (e.mods.act) for (const a of ACTS) if (e.mods.act[a]) parts.push(`${actName(a)} ${pct(e.mods.act[a]!)}`);
  if (e.mods.eco) parts.push(`impact sur le Domaine ${pct(e.mods.eco)}`);
  return parts.length ? `Écho : ${parts.join(', ')}` : 'Aucun effet : la gloire seule';
}
