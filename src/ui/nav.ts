// Modèle de navigation : onglets, sous-onglets et pastilles « nouveau ». Pur (aucun DOM) : testé sous Vitest.
//
// Les onglets sont rangés par intention du joueur :
//   ⏳ Vie       — jouer la vie en cours ;
//   🏛️ Mémoire   — ce que la lignée garde d'elle-même (Échos, Archives) ;
//   🔨 Améliorer — tout ce qui s'achète (Bâtiments en ressources, Héritage ⚜️, Bazar ✦) ;
//   👑 Maison    — identité et collection (Lignée et blason, Alliances, Codex) ;
//   🌠 Destin    — les rendez-vous (Aujourd'hui : événement et Commande ; Calendrier).
import { BUILDINGS, LEGACY, legacyCost } from '../engine/data';
import { alliancesUnlocked } from '../engine/alliances';
import { buildingCost, canAfford, chroniclesUnlocked } from '../engine/game';
import type { GameState } from '../engine/state';

export type Tab = 'vie' | 'memoire' | 'ameliorer' | 'maison' | 'destin';
export type Sub = 'echos' | 'archives' | 'batiments' | 'heritage' | 'bazar' | 'lignee' | 'alliances' | 'codex' | 'jour' | 'calendrier';
/** mobile : un onglet à la fois · two : héros + onglet · three : héros + Échos + onglet */
export type Layout = 'mobile' | 'two' | 'three';

export interface TabDef { id: Tab; icon: string; name: string }
export interface SubDef { id: Sub; icon: string; name: string }

export const TABS: TabDef[] = [
  { id: 'vie', icon: '⏳', name: 'Vie' },
  { id: 'memoire', icon: '🏛️', name: 'Mémoire' },
  { id: 'ameliorer', icon: '🔨', name: 'Améliorer' },
  { id: 'maison', icon: '👑', name: 'Maison' },
  { id: 'destin', icon: '🌠', name: 'Destin' },
];

export const SUBS: Record<Tab, SubDef[]> = {
  vie: [],
  memoire: [{ id: 'echos', icon: '🌀', name: 'Échos' }, { id: 'archives', icon: '🗄️', name: 'Archives' }],
  ameliorer: [{ id: 'batiments', icon: '🏠', name: 'Bâtiments' }, { id: 'heritage', icon: '⚜️', name: 'Héritage' }, { id: 'bazar', icon: '✦', name: 'Bazar' }],
  maison: [{ id: 'lignee', icon: '📜', name: 'Lignée' }, { id: 'alliances', icon: '💍', name: 'Alliances' }, { id: 'codex', icon: '📖', name: 'Codex' }],
  destin: [{ id: 'jour', icon: '☀️', name: 'Aujourd\'hui' }, { id: 'calendrier', icon: '📅', name: 'Calendrier' }],
};

/** Onglet parent de chaque sous-onglet. */
export const SUB_TAB: Record<Sub, Tab> = Object.fromEntries(
  (Object.keys(SUBS) as Tab[]).flatMap((t) => SUBS[t].map((x) => [x.id, t])),
) as Record<Sub, Tab>;

/** Le Bazar apparaît au premier Éclat gagné, puis reste (drapeau de sauvegarde). */
export function bazarUnlocked(s: GameState): boolean {
  return !!s.flags.bazar || s.eclats > 0 || s.blessings.length > 0 || s.partitions.some((p) => p !== 'plein');
}

/**
 * Sous-onglets proposés : un sous-onglet n'apparaît qu'une fois sa mécanique débloquée (les menus restent courts
 * pour un nouveau joueur), et les Échos quittent la Mémoire quand ils ont leur propre colonne (3 colonnes).
 */
export function subsShown(s: GameState, tab: Tab, layout: Layout): SubDef[] {
  return SUBS[tab].filter((x) => {
    switch (x.id) {
      case 'echos': return layout !== 'three';
      case 'bazar': return bazarUnlocked(s);
      case 'alliances': return alliancesUnlocked(s);
      case 'codex': return chroniclesUnlocked(s);
      default: return true;
    }
  });
}

/** Onglets proposés : sur ordinateur la Vie est toujours affichée en colonne. */
/**
 * Place de la barre des sous-onglets. Sur téléphone, en bas, juste au-dessus des onglets : le pouce enchaîne
 * onglet puis sous-onglet sans traverser l'écran, et la barre ne touche plus la frise de vie du haut.
 * Sur ordinateur, en tête de la colonne de l'onglet, sous les onglets qui y sont accrochés.
 */
export function subBarPlace(layout: Layout): 'dock' | 'panneau' {
  return layout === 'mobile' ? 'dock' : 'panneau';
}

export function tabsShown(layout: Layout): TabDef[] {
  return TABS.filter((t) => !(layout !== 'mobile' && t.id === 'vie'));
}

/** Onglet effectivement affiché (la Vie n'est pas un onglet sur ordinateur). */
export function normTab(t: Tab, layout: Layout): Tab {
  return tabsShown(layout).some((x) => x.id === t) ? t : 'memoire';
}

/** Sous-onglet effectivement affiché : le dernier choisi s'il est proposé, sinon le premier. */
export function normSub(s: GameState, tab: Tab, layout: Layout, want: Sub | undefined): Sub | null {
  const list = subsShown(s, tab, layout);
  if (!list.length) return null;
  return list.some((x) => x.id === want) ? want! : list[0].id;
}

// ---------------------------------------------------------------------------
// Pastilles « nouveau » : un achat signale sa disponibilité une fois, jusqu'à la visite de son sous-onglet.
// Sans cela, une pastille « achetable » resterait allumée presque en permanence (les Bâtiments).

/** Clés des achats possibles maintenant, par sous-onglet (un niveau = une clé : le niveau suivant est nouveau). */
export function affordableKeys(s: GameState, sub: Sub, visible: (id: string) => boolean = () => true): string[] {
  switch (sub) {
    case 'batiments':
      return BUILDINGS.filter((b) => visible(b.id)).flatMap((b) => {
        const lvl = s.buildings[b.id] ?? 0;
        if (b.max !== undefined && lvl >= b.max) return [];
        return canAfford(s, buildingCost(b.id, lvl)) ? [`b:${b.id}:${lvl}`] : [];
      });
    case 'heritage':
      return LEGACY.flatMap((l) => {
        const lvl = s.upgrades[l.id] ?? 0;
        if (l.max !== undefined && lvl >= l.max) return [];
        return s.legacy >= legacyCost(l, lvl) ? [`l:${l.id}:${lvl}`] : [];
      });
    case 'codex':
      return Object.keys(s.epithets).map((id) => `e:${id}`);
    default:
      return [];
  }
}

/** Mémoire des pastilles vues (non sauvegardée : après un rechargement, ce qui est achetable se signale une fois). */
export class SeenBadges {
  private seen = new Map<Sub, Set<string>>();
  /** Nombre d'éléments nouveaux depuis la dernière visite du sous-onglet. */
  fresh(sub: Sub, keys: string[]): number {
    const seen = this.seen.get(sub);
    if (!seen) return keys.length;
    let n = 0;
    for (const k of keys) if (!seen.has(k)) n++;
    return n;
  }
  /** Le joueur regarde le sous-onglet : tout ce qui s'y trouve est vu. */
  mark(sub: Sub, keys: string[]) {
    const seen = this.seen.get(sub) ?? new Set<string>();
    for (const k of keys) seen.add(k);
    this.seen.set(sub, seen);
  }
  /** Pour le Codex : les surnoms déjà connus au lancement ne sont pas « nouveaux ». */
  primeOnce(sub: Sub, keys: string[]) {
    if (!this.seen.has(sub)) this.mark(sub, keys);
  }
}
