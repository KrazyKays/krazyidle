// Veillée des ancêtres (0.6) : pendant un événement, les ancêtres de la maison se manifestent.
//
// Un souvenir s'ouvre toutes les 5 minutes (9 par événement de 45 min). Ils s'accumulent jusqu'à 3 :
// passer trois fois pendant l'événement rapporte autant que rester devant l'écran, et au-delà de 3 en attente
// le plus ancien se perd. Chaque souvenir propose deux réponses, qui font avancer l'une des deux pistes
// cosmétiques du blason (devises ou bordures, voir `maison.ts`).
//
// Rien ici ne touche à la production ni à la progression de l'événement : la Veillée est un rendez-vous,
// pas une obligation. Le moteur de jeu (tick, simulateur) ne l'appelle jamais ; seule l'interface le fait.
import { acc, type Named } from './data';
import { fullName } from './epithets';
import type { EventWindow } from './events';
import { BORDURES, DEVISES, SOUVENIRS_PER_UNLOCK, type SouvenirTrack } from './maison';
import { hashStr } from './rng';
import type { Ancestor, GameState } from './state';

export const VEILLEE_STEP_MIN = 5;
export const VEILLEE_MAX = 3;

/** Souvenirs ouverts depuis le début de l'événement (le premier dès l'ouverture). */
export function veilleeSlots(ev: EventWindow, now: number): number {
  if (now < ev.start) return 0;
  const total = Math.floor((ev.end - ev.start) / (VEILLEE_STEP_MIN * 60_000));
  return Math.min(total, Math.floor((Math.min(now, ev.end - 1) - ev.start) / (VEILLEE_STEP_MIN * 60_000)) + 1);
}

/** État de la Veillée pour cet événement (remis à zéro au changement d'événement). */
function stateFor(s: GameState, ev: EventWindow) {
  if (s.veillee?.key !== ev.key) s.veillee = { key: ev.key, taken: 0, lost: 0 };
  return s.veillee;
}

/**
 * Souvenirs en attente. Au-delà de 3, les plus anciens sont perdus (comptés une fois pour toutes) :
 * les souvenirs suivants ne les rendent pas.
 */
export function observeVeillee(s: GameState, ev: EventWindow, now: number): number {
  const v = stateFor(s, ev);
  const avail = veilleeSlots(ev, now) - v.taken - v.lost;
  if (avail > VEILLEE_MAX) v.lost += avail - VEILLEE_MAX;
  return Math.max(0, Math.min(VEILLEE_MAX, avail));
}

export interface VeilleeChoice {
  track: SouvenirTrack;
  label: string;
  /** ce que le joueur garde de la scène */
  outcome: string;
}

export interface VeilleeScene {
  /** l'ancêtre qui se manifeste (null : un ancien du comté, avant le premier décès) */
  who: string | null;
  text: string;
  choices: [VeilleeChoice, VeilleeChoice];
}

type Tpl = { text: string; listen: [string, string]; honor: [string, string] };
// {n} : nom de l'ancêtre ; {il} / {Il} : pronom ; {e} : accord féminin. Réponse « écouter » : piste des devises ;
// réponse « honorer » : piste des bordures.
const SCENES: Record<string, Tpl[]> = {
  maree: [
    { text: '{n} se souvient d\'un navire chargé d\'épices, une nuit de marée haute. {Il} avait tout misé sur lui.', listen: ['Lui demander ce qu\'{il} a appris', 'Il ne faut jamais tout miser sur une seule marée, dit-{il}.'], honor: ['Allumer une lanterne sur le quai', 'La lanterne brille longtemps sur l\'eau noire.'] },
    { text: 'Au comptoir, {n} recompte des pièces qu\'{il} n\'a jamais dépensées.', listen: ['Écouter ce qu\'{il} murmure', 'L\'or ne vaut que ce qu\'on en lègue.'], honor: ['Poser une pièce sur le comptoir', 'La pièce sonne comme une cloche.'] },
  ],
  moisson: [
    { text: '{n} marche entre les blés, la main ouverte sur les épis.', listen: ['Lui demander quel champ {il} préférait', 'Celui qu\'on sème pour d\'autres, répond-{il}.'], honor: ['Nouer une gerbe à son nom', 'La gerbe tient debout toute seule.'] },
    { text: 'L\'odeur du pain chaud fait revenir {n}, encore couvert{e} de farine.', listen: ['L\'écouter parler de la disette', 'On ne compte pas les grains, on compte ceux qu\'ils nourrissent.'], honor: ['Partager le premier pain', 'Le pain se rompt sans bruit.'] },
  ],
  migration: [
    { text: 'Sous les tentes du Grand marché, {n} reconnaît un vieux rival.', listen: ['Écouter leur dispute', 'Ils rient à la fin : ils se sont toujours enrichis l\'un l\'autre.'], honor: ['Sceller la paix d\'une poignée de main', 'La poignée de main a la chaleur d\'un vivant.'] },
    { text: '{n} marchande un ruban qu\'{il} n\'a jamais pu s\'offrir.', listen: ['Lui demander pour qui il était', 'Pour la maison, dit-{il}. Toujours pour la maison.'], honor: ['Lui offrir le ruban', 'Le ruban reste noué au mât de la tente.'] },
  ],
  eclipse: [
    { text: 'Quand le soleil s\'éteint, {n} apparaît au bord du puits, les yeux fermés.', listen: ['Lui demander ce qu\'{il} voit', 'Tous les autres, dit-{il}. Ceux d\'avant, et ceux d\'après.'], honor: ['Tracer un cercle de sel autour du puits', 'Le cercle ne se brise pas.'] },
    { text: 'Dans l\'ombre de l\'éclipse, {n} chante une prière que plus personne ne connaît.', listen: ['Apprendre les paroles', 'Les mots restent, même quand la voix se tait.'], honor: ['Garder le silence avec {lui}', 'Le silence a la forme d\'une promesse.'] },
  ],
  comete: [
    { text: '{n} suit la comète du doigt et récite les noms des étoiles qu\'elle traverse.', listen: ['Noter les noms', 'Le dernier nom de la liste est celui de la maison.'], honor: ['Lever une lunette vers le ciel', 'La comète passe exactement où {il} l\'avait dit.'] },
    { text: 'Penché{e} sur un vieux grimoire, {n} corrige une erreur vieille de trois générations.', listen: ['Lui demander laquelle', 'Une date de naissance. La sienne.'], honor: ['Recopier la page au propre', 'L\'encre sèche d\'un seul coup.'] },
  ],
  concile: [
    { text: 'Autour de la grande table, les Échos se taisent quand {n} prend la parole.', listen: ['Écouter son discours', 'Nous ne sommes pas finis, dit-{il}. Nous continuons.'], honor: ['Lui céder le siège d\'honneur', 'Le siège garde la forme de ceux qui s\'y sont assis.'] },
    { text: '{n} fait le compte des absents. Il en manque un : le prochain.', listen: ['Lui demander de qui {il} parle', 'De celui qui n\'est pas encore né.'], honor: ['Ajouter un couvert à la table', 'Le couvert attend, sans impatience.'] },
  ],
};

/** Narrateur du souvenir : un ancêtre récent, choisi de façon stable pour cet événement et ce souvenir. */
function narrator(s: GameState, ev: EventWindow, idx: number): Ancestor | null {
  const pool = s.ancestors.slice(-30);
  if (!pool.length) return null;
  return pool[(hashStr(`veillee:${ev.key}:${idx}`) >>> 0) % pool.length];
}

/** Avant le premier décès, c'est un ancien du comté qui veille avec la maison. */
const ELDER: Named = { name: 'un ancien du comté', sex: 'm' };

function fill(str: string, p: Named, name: string): string {
  const il = acc(p, 'il', 'elle');
  const out = str
    .replace(/\{n\}/g, name)
    .replace(/\{Il\}/g, il.charAt(0).toUpperCase() + il.slice(1))
    .replace(/\{il\}/g, il)
    .replace(/\{lui\}/g, acc(p, 'lui', 'elle'))
    .replace(/\{e\}/g, acc(p, '', 'e'));
  return out.charAt(0).toUpperCase() + out.slice(1);
}

/** Scène du souvenir n° `idx` de l'événement (déterministe : la même pour un même ancêtre et un même horaire). */
export function veilleeScene(s: GameState, ev: EventWindow, idx: number): VeilleeScene {
  const list = SCENES[ev.def.id] ?? SCENES.concile;
  const tpl = list[(hashStr(`scene:${ev.key}:${idx}`) >>> 0) % list.length];
  const a = narrator(s, ev, idx);
  const name = a ? fullName(a, s.lineage.names) : ELDER.name;
  const f = (x: string) => fill(x, a ?? ELDER, name);
  return {
    who: a ? name : null,
    text: f(tpl.text),
    choices: [
      { track: 'devise', label: f(tpl.listen[0]), outcome: f(tpl.listen[1]) },
      { track: 'bordure', label: f(tpl.honor[0]), outcome: f(tpl.honor[1]) },
    ],
  };
}

/** Index du prochain souvenir à recueillir (les perdus sont passés). */
export function veilleeIndex(s: GameState, ev: EventWindow): number {
  const v = stateFor(s, ev);
  return v.taken + v.lost;
}

/**
 * Le joueur répond au souvenir en attente : un souvenir de plus sur la piste choisie.
 * Renvoie le nom de la bordure ou de la devise débloquée, s'il y en a une ; null si rien n'était en attente.
 */
export function answerVeillee(s: GameState, ev: EventWindow, now: number, track: SouvenirTrack): { unlocked: string | null } | null {
  if (observeVeillee(s, ev, now) <= 0) return null;
  s.veillee!.taken++;
  const sv = s.souvenirs ?? (s.souvenirs = { devise: 0, bordure: 0 });
  const before = Math.floor(sv[track] / SOUVENIRS_PER_UNLOCK);
  sv[track]++;
  const after = Math.floor(sv[track] / SOUVENIRS_PER_UNLOCK);
  if (after === before) return { unlocked: null };
  const list = track === 'devise' ? DEVISES.map((d) => `la devise « ${d} »`) : BORDURES.map((b) => `la ${b.name.charAt(0).toLowerCase()}${b.name.slice(1)}`);
  return { unlocked: list[after - 1] ?? null };
}
