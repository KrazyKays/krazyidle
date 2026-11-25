// Tutoriel de la première partie et astuces contextuelles (TUTO-1, 0.6).
// Module pur (aucun DOM) : il dit quelle bulle afficher et quels éléments entourer d'un halo ;
// app.ts se charge de l'affichage. Une seule bulle à la fois, déclenchée par ce que fait le joueur.
//
// Déroulé : la première vie démarre en pause (1. choisir une activité), on bâtit des Champs
// (2. emplacement des achats), Commercer apparaît (3. il mange des Vivres), la vie s'enregistre
// (4. promesse de l'Écho), le héros meurt (5. la lignée continue), puis l'ancêtre rejoue sa vie
// (6. preuve de l'Écho, et c'est alors seulement que la pause a un sens). Héritage et Vocation
// restent des astuces ordinaires, hors du tuto.

import { acc } from '../engine/data';
import { isPaused, resumeLife } from '../engine/game';
import type { GameState } from '../engine/state';
import type { Layout } from './nav';

export interface Hint {
  id: string;
  text: string;
  /** Sélecteurs CSS des éléments à entourer d'un halo (vide : aucun). */
  halo: string[];
  /** Étape du tutoriel (propose « Passer le tuto »), par opposition à une simple astuce. */
  tuto: boolean;
}

interface HintDef {
  id: string;
  tuto: boolean;
  when: (s: GameState) => boolean;
  /** Étape accomplie par le joueur : elle se coche d'elle-même, sans « OK ». */
  done?: (s: GameState) => boolean;
  text: (s: GameState, layout: Layout) => string;
  halo?: (s: GameState, layout: Layout) => string[];
}

const flag = (id: string) => 'hint_' + id;

/** L'ordre fixe la priorité : la première astuce dont la condition tient et qui n'est pas cochée s'affiche. */
const HINTS: HintDef[] = [
  {
    id: 'start', tuto: true,
    when: (s) => s.hero.gen === 1 && !!s.life,
    done: (s) => !!s.life?.act,
    text: (s) => `Bienvenue dans la Maison ${s.lineage.name} ! Que doit faire ${s.hero.name} ? Touche Récolter pour commencer : son temps ne s'écoule que lorsqu'${acc(s.hero, 'il', 'elle')} agit.`,
    halo: () => ['.act[data-act="cultiver"]'],
  },
  {
    id: 'death', tuto: true,
    when: (s) => s.hero.gen === 1 && !s.life,
    done: (s) => s.hero.gen >= 2,
    text: (s) => `C'est dans l'ordre des choses : la vie de ${s.hero.name} s'achève, mais ta lignée continue. Choisis la relève : chaque enfant hérite d'une part de ses dons.`,
    halo: () => ['.death-card .btn-primary'],
  },
  {
    id: 'echo2', tuto: true,
    when: (s) => s.hero.gen === 2 && s.echoes.length > 0 && !!s.life,
    text: (s, layout) => {
      const last = s.ancestors[s.ancestors.length - 1];
      const where = layout === 'three' ? 'colonne des Échos' : 'Mémoire › Échos';
      const who = last ? `${last.name} est ${acc(last, 'devenu', 'devenue')} un Écho : ${acc(last, 'il', 'elle')} rejoue sa vie en boucle et produit pour toi (${where}).` : `Ton ancêtre rejoue sa vie en boucle et produit pour toi (${where}).`;
      return `${who} C'est là que la pause prend son sens : reclique sur l'activité en cours (ou ⏸️), ${s.hero.name} attend et tes Échos continuent de produire.`;
    },
    halo: () => ['.tab[data-tab="memoire"]:not(.active)', '.echo-card'],
  },
  {
    id: 'build', tuto: true,
    when: (s) => s.res.vivres >= 25 && Object.keys(s.buildings).length === 0,
    done: (s) => Object.keys(s.buildings).length > 0,
    text: (_s, layout) => `Tu as 25 Vivres : bâtis des Champs (${layout === 'mobile' ? 'onglet 🔨 Améliorer, en bas' : 'onglet 🔨 Améliorer'}). Les bâtiments renforcent la vie en cours et tous tes Échos.`,
    halo: () => ['.tab[data-tab="ameliorer"]:not(.active)', '.subtab[data-sub="batiments"]:not(.active)', '.build[data-bld="champs"] .btn-primary'],
  },
  {
    id: 'commerce', tuto: true,
    when: (s) => s.unlocked.includes('commercer') && !!s.life,
    done: (s) => s.life?.act === 'commercer',
    text: () => 'Nouvelle activité : Commercer rapporte de l\'Or, mais consomme des Vivres. Garde un œil sur ta réserve.',
    halo: () => ['.act[data-act="commercer"]'],
  },
  {
    id: 'echo', tuto: true,
    when: (s) => s.hero.gen === 1 && !!s.life && s.life.t > 30,
    text: () => 'Chaque seconde de cette vie est enregistrée. À sa mort, elle deviendra un Écho qui rejouera tes choix en boucle, pour toujours.',
    halo: () => ['.rec'],
  },
  {
    // Sans Écho, la pause fige tout : l'astuce n'a de sens qu'une fois le premier Écho en place.
    id: 'pause', tuto: false,
    when: (s) => s.hero.gen <= 3 && s.echoes.length > 0 && isPaused(s),
    text: (s) => `Vie en pause : ${s.hero.name} attend, tes Échos continuent de produire. Rien ne presse, mais ta lignée avance moins vite : on peut construire sans mettre en pause.`,
  },
  {
    id: 'legacy', tuto: false,
    when: (s) => s.legacy >= 3 && Object.keys(s.upgrades).length === 0,
    text: () => 'Tu as de l\'Héritage ⚜️ ! Dépense-le dans Améliorer › Héritage pour des bonus permanents.',
    halo: () => ['.tab[data-tab="ameliorer"]:not(.active)', '.subtab[data-sub="heritage"]:not(.active)'],
  },
  {
    id: 'voc', tuto: false,
    when: (s) => s.hero.gen >= 2 && s.hero.gen <= 4 && !!s.hero.vocation,
    text: (s) => `${s.hero.name} a hérité d'une Vocation : consacre au moins la moitié de sa vie à la même activité pour la faire monter de rang. La jauge sous le sablier te dit où tu en es.`,
  },
];

export const TUTO_STEPS: string[] = HINTS.filter((d) => d.tuto).map((d) => d.id);

/** Coche les étapes accomplies par le joueur (appelé à chaque image). */
export function tutoAutoDone(s: GameState): void {
  for (const d of HINTS) if (d.done && !s.flags[flag(d.id)] && d.done(s)) s.flags[flag(d.id)] = true;
}

/** Astuce ou étape du tuto à afficher maintenant, ou null. */
export function currentHint(s: GameState, layout: Layout): Hint | null {
  if (!s.flags.started) return null; // pas pendant la cérémonie de fondation
  for (const d of HINTS) {
    if (s.flags[flag(d.id)] || !d.when(s) || d.done?.(s)) continue;
    return { id: d.id, text: d.text(s, layout), halo: d.halo?.(s, layout) ?? [], tuto: d.tuto };
  }
  return null;
}

export function dismissHint(s: GameState, id: string): void {
  s.flags[flag(id)] = true;
}

/** « Je connais le jeu » : toutes les étapes du tuto sont cochées, la vie reprend si elle attendait. */
export function skipTuto(s: GameState): void {
  for (const id of TUTO_STEPS) s.flags[flag(id)] = true;
  resumeLife(s);
}

/** La première vie attend que le joueur choisisse une activité (même après un rechargement). */
export function lifeWaitsForPlayer(s: GameState): boolean {
  return s.hero.gen === 1 && !s.flags[flag('start')];
}
