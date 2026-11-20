// Hauts faits (0.3) : les accomplissements de fin de partie, rangés dans le Codex. Ils récompensent la
// variété plutôt que le temps passé : chacun demande de jouer autrement, pas plus longtemps. Récompense
// unique en Éclats et un ornement de la maison (cosmétique) : aucune puissance permanente, pour qu'ils ne
// deviennent pas une liste de corvées obligatoires.
import { ACTS, EVENTS, TRAIT } from './data';
import type { LifeFacts } from './epithets';
import type { GameState } from './state';

/** Seuils (calibrage : lab/design/EVO-0.3-criteres.md, campagne longue). */
export const FEAT = {
  metierTier: 3,
  maisons: 4,
  /** Crypte presque pleine : la Crypte ancestrale va jusqu'à 8 emplacements */
  chasseSlots: 7,
  paixMin: 0.95,
  paixSlots: 5,
  millenaire: 1000,
  chroniqueur: 15,
};

export interface FeatDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  eclats: number;
  /** contrôle à la mort d'un héros (avec ce que l'on sait de sa vie) ou après la succession (sans) */
  test: (s: GameState, f?: LifeFacts) => boolean;
}

const cryptFull = (s: GameState, slots: number) => s.echoes.length >= slots;

export const FEATS: FeatDef[] = [
  { id: 'cinq_metiers', name: 'Les cinq métiers', icon: '🛠️', eclats: 5,
    desc: `Garder dans la Crypte un Écho de chaque vocation, chacune au rang ${FEAT.metierTier} ou plus.`,
    test: (s) => ACTS.every((a) => s.echoes.some((e) => e.vocation?.act === a && e.vocation.tier >= FEAT.metierTier)) },
  { id: 'sang_neuf', name: 'Sang neuf', icon: '💍', eclats: 4,
    desc: `S'allier à ${FEAT.maisons} maisons différentes (comté ou autres joueurs).`,
    test: (s) => Object.keys(s.alliances ?? {}).length >= FEAT.maisons },
  { id: 'chasse_raisonnee', name: 'Chasse raisonnée', icon: '🦌', eclats: 4,
    desc: `Chasser au moins la moitié d'une vie sans que la santé du Domaine passe sous ${Math.round(FEAT.paixMin * 100)} %, avec au moins ${FEAT.chasseSlots} Échos dans la Crypte.`,
    test: (s, f) => !!f && f.share.chasser >= 0.5 && f.harmonyMin >= FEAT.paixMin && cryptFull(s, FEAT.chasseSlots) },
  { id: 'transcendance', name: 'Transcendance', icon: '🌱', eclats: 5,
    desc: 'Mettre à la tête de la lignée un héritier dont un don est devenu légendaire en mûrissant.',
    test: (s, f) => !f && (s.hero.evolved ?? []).some((t) => TRAIT[t]?.rarity === 3) },
  { id: 'comete', name: 'Embrasement', icon: '💫', eclats: 5,
    desc: `Vivre une Étoile filante avec au moins ${FEAT.paixSlots} Échos dans la Crypte.`,
    test: (s, f) => !!f && f.traits.some((t) => TRAIT[t]?.nova) && cryptFull(s, FEAT.paixSlots) },
  { id: 'almanach', name: 'L\'Almanach complet', icon: '📖', eclats: 6,
    desc: 'Atteindre le palier Or à chacun des six événements du monde.',
    test: (s) => EVENTS.every((e) => s.almanach?.includes(e.id)) },
  { id: 'millenaire', name: 'Millénaire', icon: '🏰', eclats: 5,
    desc: `Atteindre la génération ${FEAT.millenaire}.`,
    test: (s) => s.hero.gen >= FEAT.millenaire },
  { id: 'chroniqueur', name: 'Mémoire des Chroniques', icon: '📜', eclats: 4,
    desc: `Découvrir ${FEAT.chroniqueur} surnoms différents.`,
    test: (s) => Object.keys(s.epithets).length >= FEAT.chroniqueur },
];
export const FEAT_DEF: Record<string, FeatDef> = Object.fromEntries(FEATS.map((x) => [x.id, x]));

/** Accorde les hauts faits nouvellement remplis (Éclats compris) et retourne leurs identifiants. */
export function checkFeats(s: GameState, now: number, f?: LifeFacts): string[] {
  const got = (s.feats ??= {});
  const out: string[] = [];
  for (const d of FEATS) {
    if (got[d.id] || !d.test(s, f)) continue;
    got[d.id] = now;
    s.eclats += d.eclats;
    out.push(d.id);
  }
  return out;
}
