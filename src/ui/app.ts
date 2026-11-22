import {
  ACT, ACTS, ACT_UNLOCK, BUILDINGS, CREST_COLORS, FIRST_NAMES, HOUSE_NAMES, acc, isJoestar, traitName, vocationName, type Named, LEGACY, RARITY, RES, RES_INFO, TRAIT, TRAITS,
  legacyCost, wearMult, xpToNext, type ActId, type ResId,
} from '../engine/data';
import { DAILY_DUR, DailyRun, type DailyOrder, dailySetup, dailyTiers, dailyStrip, encodeRun, medalsOf, resultAge, traceFromCode } from '../engine/daily';
import { buildIcs, upcomingEvents, utcDateStr } from '../engine/events';
import {
  blessable, blessingCost, cryptBoost, EVENT_GOAL_WEIGHT, EVENT_REWARDS, EVENT_TIERS, SHOP, buildingCost, buyBlessing, buyBuilding, buyLegacy, buyPartition, buyTemps, canAfford,
  VOCATION_SHARE, buildingOpen, chroniclesUnlocked, confirmSuccession, echoExpectedRate, echoPower, echoPowerMult, echoSlots, heroWear, isPaused, lifeDuration, prodMult, resumeLife, setActivity, vocationOutlook,
  type OfflineReport, type Runtime,
} from '../engine/game';
import { exportSave, importSave } from '../engine/save';
import { heroActMult, lifePower } from '../engine/sim';
import type { DailyRecord, Echo, GameState, Hero } from '../engine/state';
import { Binder, confirmBox, copyText, download, h, modal, toast, type ModalHandle } from './dom';
import { fmt, fmtClock, fmtDay, fmtDur, fmtInt, setNotation } from './fmt';
import { CHARGE_IDS, PARTITIONS, chargeName, chargeSvg, shieldSvg } from './heraldry';
import { EPITHET, EPITHET_RARITY, epithetEffect, epithetLabel, epithetRevealKind, fullName } from '../engine/epithets';
import { regnalName, renameHead, roman, type Ranked } from '../engine/names';
import { alliancesUnlocked, weekIndex } from '../engine/alliances';
import { evolutionsOf } from '../engine/evolution';
import { FEATS, FEAT_DEF } from '../engine/feats';
import { alliancesSection, codexSection, epithetBadge, openAcceptProposal, spouseLine } from './legends';
import { SUB_TAB, SeenBadges, TABS, affordableKeys, bazarUnlocked, normSub, normTab, subBarPlace, subsShown, tabsShown, type Layout, type Sub, type Tab } from './nav';

const ANCESTORS_SHOWN = 12;

const MEDALS = ['🥉', '🥈', '🥇'];
const GAME_URL = 'https://krazykays.github.io/krazyidle/';

export interface AppHooks {
  save: () => void;
  reset: () => void;
  replaceState: (s: GameState) => void;
  /** 'prompt' : invite native (Chrome/Android) · 'ios' : à faire depuis Safari · 'installed' : déjà en appli · null : rien à proposer */
  installMode: () => 'prompt' | 'ios' | 'installed' | null;
  /** Ouvre l'invite native ; résout à true si le joueur a accepté. */
  installPrompt: () => Promise<boolean>;
  /** Applique le réglage « Garder l'écran allumé » ; false si le navigateur ne le permet pas. */
  keepAwake: (on: boolean) => boolean;
}

export class App {
  s: GameState;
  rt: Runtime;
  hooks: AppHooks;
  tab: Tab = 'vie';
  /** Dernier sous-onglet choisi dans chaque onglet (mémoire de session). */
  subs: Partial<Record<Tab, Sub>> = {};
  seen = new SeenBadges();
  desktop = false;
  layout: Layout = 'mobile';
  bTop = new Binder();
  bLife = new Binder();
  bTab = new Binder();
  bNav = new Binder();
  bEcho = new Binder();
  sigEcho = '';
  elEcho!: HTMLElement;
  elTabCol!: HTMLElement;
  elMain!: HTMLElement;
  sigTop = '';
  sigLife = '';
  sigTab = '';
  elTop!: HTMLElement;
  elLife!: HTMLElement;
  elTab!: HTMLElement;
  elNav!: HTMLElement;
  /** Téléphone : bloc fixé en bas, sous-onglets au-dessus des onglets. */
  elDock!: HTMLElement;
  elSubDock!: HTMLElement;
  lastNav = 0;
  successionModal: ModalHandle | null = null;
  daily: DailyRun | null = null;
  dailyModal: ModalHandle | null = null;
  dailyAcc = 0;
  dailyBinder = new Binder();
  echoSel: Set<number> | null = null;
  hadSuccession = false;

  constructor(s: GameState, rt: Runtime, hooks: AppHooks) {
    this.s = s;
    this.rt = rt;
    this.hooks = hooks;
    setNotation(s.settings.notation);
    // Les surnoms connus au lancement ne sont pas des nouveautés.
    this.seen.primeOnce('codex', affordableKeys(s, 'codex'));
  }

  mount(root: HTMLElement) {
    root.innerHTML = '';
    this.elTop = h('header', { class: 'topbar' });
    this.elLife = h('section', { class: 'panel panel-life', id: 'panel-life' });
    this.elTab = h('section', { class: 'panel panel-tab', id: 'panel-tab' });
    this.elEcho = h('section', { class: 'panel panel-echoes', id: 'panel-echoes', 'aria-label': 'Échos' });
    this.elNav = h('nav', { class: 'tabbar', 'aria-label': 'Navigation' });
    // Sur ordinateur, les onglets sont accrochés à la colonne qu'ils pilotent.
    this.elTabCol = h('div', { class: 'tab-col' }, this.elTab);
    this.elMain = h('main', { class: 'layout' }, this.elLife, this.elEcho, this.elTabCol);
    this.elSubDock = h('div', { class: 'subdock' });
    this.elDock = h('div', { class: 'dock' }, this.elSubDock, this.elNav);
    root.append(this.elTop, this.elMain, this.elDock);
    // Les notifications s'affichent sous la barre du haut (fixe sur téléphone), jamais devant :
    // elles masquaient les ressources et les boutons pendant plusieurs secondes.
    const topH = () => document.documentElement.style.setProperty('--top-h', `${this.elTop.getBoundingClientRect().height}px`);
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(topH).observe(this.elTop);
    topH();
    // Le contenu garde une marge basse à la hauteur du bloc du bas (qui grandit avec les sous-onglets).
    const dockH = () => document.documentElement.style.setProperty('--dock-h', `${this.elDock.getBoundingClientRect().height}px`);
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(dockH).observe(this.elDock);
    dockH();
    const mq2 = window.matchMedia('(min-width: 900px)');
    const mq3 = window.matchMedia('(min-width: 1280px)');
    const apply = () => {
      this.layout = mq3.matches ? 'three' : mq2.matches ? 'two' : 'mobile';
      this.desktop = this.layout !== 'mobile';
      this.tab = this.normTab(this.tab);
      if (this.desktop) this.elTabCol.prepend(this.elNav); else this.elDock.append(this.elNav);
      this.elDock.hidden = this.desktop;
      this.elMain.dataset.layout = this.layout;
      this.renderNav();
      this.sigTab = '';
      this.sigLife = '';
      this.sigEcho = '';
      this.applyTabVisibility();
    };
    mq2.addEventListener('change', apply);
    mq3.addEventListener('change', apply);
    apply();
    document.body.classList.toggle('reduced-motion', this.s.settings.reducedMotion);
    window.addEventListener('keydown', (e) => this.onKey(e));
  }

  /** Onglets proposés : sur ordinateur la Vie est toujours visible, en colonne. */
  tabsShown(): typeof TABS {
    return tabsShown(this.layout);
  }

  normTab(t: Tab): Tab {
    return normTab(t, this.layout);
  }

  /** Sous-onglet affiché dans l'onglet courant (null : onglet sans sous-onglets). */
  sub(): Sub | null {
    const t = this.normTab(this.tab);
    return normSub(this.s, t, this.layout, this.subs[t]);
  }

  /** Va à un onglet, ou directement à un sous-onglet (« Améliorer › Héritage »). */
  setTab(t: Tab | Sub) {
    const tab = (t in SUB_TAB ? SUB_TAB[t as Sub] : t) as Tab;
    if (t !== tab) this.subs[tab] = t as Sub;
    this.tab = this.normTab(tab);
    this.renderNav();
    this.applyTabVisibility();
    this.sigTab = '';
    // Rendu immédiat : la barre des sous-onglets du bas change sous le pouce, sans attendre l'image suivante.
    if (!this.elTab.hidden) { this.sigTab = this.sigTabNow(); this.renderTabPanel(); }
    if (this.desktop) this.elTab.scrollTop = 0; else window.scrollTo({ top: 0 });
  }

  applyTabVisibility() {
    const showLife = this.desktop || this.tab === 'vie';
    const showTab = this.desktop || this.tab !== 'vie';
    this.elLife.hidden = !showLife;
    this.elTab.hidden = !showTab;
    this.elEcho.hidden = this.layout !== 'three';
    // Les sous-onglets du bas appartiennent au panneau de l'onglet : ils disparaissent avec lui.
    if (!showTab || subBarPlace(this.layout) !== 'dock') this.elSubDock.replaceChildren();
  }

  onKey(e: KeyboardEvent) {
    if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 5) {
      const a = ACTS[n - 1];
      if (this.daily && !this.daily.done && this.dailyModal) this.daily.setAct(a);
      else if (this.s.life && this.s.unlocked.includes(a)) setActivity(this.s, a);
    } else if (e.key === ' ' && !this.daily && this.s.life && !document.querySelector('.modal-back')) {
      e.preventDefault();
      this.togglePause();
    }
  }

  togglePause() {
    const s = this.s;
    if (!s.life) return;
    if (isPaused(s)) resumeLife(s); else setActivity(s, null);
  }

  // =========================================================================
  // Boucle d'affichage
  frame(now: number) {
    // notifications moteur
    while (this.rt.notices.length) {
      const n = this.rt.notices.shift()!;
      toast(n.text, n.kind === 'event' ? 'event' : 'good', 4000);
    }
    // Succession non bloquante : on prévient, le joueur s'en occupe quand il veut.
    const pending = !!this.s.succession;
    if (pending && !this.hadSuccession) toast(`🕯️ ${fullName(this.s.succession!.ancestor, this.s.lineage.names)} s'est ${acc(this.s.succession!.ancestor, 'éteint', 'éteinte')}. Une succession t'attend.`, 'info', 5000);
    this.hadSuccession = pending;
    const st = this.sigTopNow();
    if (st !== this.sigTop) { this.sigTop = st; this.renderTop(); }
    const sl = this.sigLifeNow();
    if (sl !== this.sigLife && !this.elLife.hidden) { this.sigLife = sl; this.renderLife(); }
    const tt = this.sigTabNow();
    if (tt !== this.sigTab && !this.elTab.hidden) { this.sigTab = tt; this.renderTabPanel(); }
    this.bTop.run();
    // Pastilles : recalculées quatre fois par seconde, inutile de le faire à chaque image.
    if (now - this.lastNav > 250) {
      this.lastNav = now;
      if (!this.s.flags.bazar && bazarUnlocked(this.s)) this.s.flags.bazar = true;
      const sub = this.elTab.hidden ? null : this.sub();
      if (sub) this.markSeen(sub);
      this.bNav.run();
    }
    if (!this.elLife.hidden) this.bLife.run();
    if (!this.elTab.hidden) this.bTab.run();
    if (!this.elEcho.hidden) {
      const se = this.sigEchoNow();
      if (se !== this.sigEcho) { this.sigEcho = se; this.bEcho.reset(); this.elEcho.replaceChildren(this.panelEchoes(this.bEcho)); }
      this.bEcho.run();
    }
    if (this.dailyModal) this.dailyBinder.run();
  }

  // =========================================================================
  // Barre du haut
  sigTopNow() {
    return RES.filter((r) => this.s.totalEver[r] > 0 || r === 'vivres').join() + '|' + this.lineageSig();
  }

  renderTop() {
    const s = this.s, b = this.bTop;
    b.reset();
    const crest = this.crestEl('crest');
    const genEl = b.text(h('span'), () => `Génération ${s.hero.gen}`);
    const brand = h('button', { class: 'brand', onclick: () => this.setTab('lignee'), 'aria-label': 'Maison' }, crest, h('div', null, h('div', { class: 'brand-name' }, `Maison ${s.lineage.name}`), h('div', { class: 'brand-sub' }, genEl)));
    const chips = RES.filter((r) => s.totalEver[r] > 0 || r === 'vivres').map((r) => {
      const v = b.text(h('span', { class: 'chip-v' }), () => fmt(s.res[r]));
      const rate = b.text(h('span', { class: 'chip-r' }), () => { const n = this.rt.net[r]; return Math.abs(n) < 0.005 ? '' : (n > 0 ? '+' : '') + fmt(n) + '/s'; });
      b.cls(rate, 'neg', () => this.rt.net[r] < -0.005);
      return h('div', { class: 'chip', title: RES_INFO[r].name, style: { '--c': RES_INFO[r].color } }, h('span', { class: 'chip-i' }, RES_INFO[r].icon), h('div', { class: 'chip-txt' }, v, rate));
    });
    const legacy = h('button', { class: 'chip chip-meta', title: 'Héritage', onclick: () => this.setTab('heritage') }, h('span', { class: 'chip-i' }, '⚜️'), b.text(h('span', { class: 'chip-v' }), () => fmt(s.legacy, 0)));
    const eclats = h('button', { class: 'chip chip-meta', title: 'Éclats célestes', onclick: () => this.setTab(bazarUnlocked(s) ? 'bazar' : 'jour') }, h('span', { class: 'chip-i' }, '✦'), b.text(h('span', { class: 'chip-v' }), () => fmt(s.eclats, 0)));
    const evPill = h('button', { class: 'event-pill', onclick: () => this.setTab('jour') });
    b.add(() => {
      const ev = this.rt.event;
      evPill.hidden = !ev;
      if (ev) {
        const t = `${ev.def.icon} ${ev.def.name} · ${fmtDur((ev.end - Date.now()) / 1000)}`;
        if (evPill.textContent !== t) evPill.textContent = t;
        evPill.style.setProperty('--c', ev.def.color);
      }
    });
    const lifePill = h('button', { class: 'event-pill life-pill', onclick: () => { if (s.succession) this.openSuccession(); else resumeLife(s); } });
    b.add(() => {
      const t = s.succession ? '🕯️ Succession en attente' : isPaused(s) ? '▶ Reprendre la vie' : '';
      lifePill.hidden = !t;
      if (lifePill.textContent !== t) lifePill.textContent = t;
    });
    const gear = h('button', { class: 'icon-btn', 'aria-label': 'Paramètres', onclick: () => this.openSettings() }, '⚙️');
    this.elTop.replaceChildren(
      h('div', { class: 'top-row' }, brand, evPill, lifePill, h('div', { class: 'top-meta' }, legacy, eclats, gear)),
      h('div', { class: 'res-row' }, chips),
      this.topLifeStrip(b),
    );
  }

  /**
   * Frise de la vie en cours, au bord bas de la barre du haut (téléphone, hors de l'onglet Vie) :
   * on suit la vie depuis n'importe quel onglet, et un toucher y ramène. Sur ordinateur la Vie est
   * toujours affichée en colonne, la frise est donc inutile.
   */
  topLifeStrip(b: Binder) {
    const s = this.s;
    const fill = h('span', { class: 'top-life-fill' });
    const el = h('button', { class: 'top-life', 'aria-label': 'Vie en cours : revenir à la Vie', onclick: () => this.setTab('vie') }, fill);
    let lastKey = '';
    b.add(() => {
      el.hidden = this.desktop || this.tab === 'vie';
      if (el.hidden) return;
      const life = s.life;
      // Elle pulse quand la vie attend le joueur : succession en attente ou vie en pause.
      el.classList.toggle('waiting', !!s.succession || isPaused(s));
      const key = life ? life.rec.length + '/' + life.dur : 'fin';
      if (key === lastKey) return;
      lastKey = key;
      fill.style.background = life ? stripGradient(life.rec, life.dur) : 'var(--gold)';
    });
    return el;
  }

  renderNav() {
    const b = this.bNav;
    b.reset();
    const tabs = this.tabsShown();
    this.elNav.replaceChildren(
      ...tabs.map((t) => {
        const dot = h('span', { class: 'dot' });
        b.cls(dot, 'on', () => this.badge(t.id));
        return h('button', { class: `tab ${this.tab === t.id ? 'active' : ''}`, 'data-tab': t.id, onclick: () => this.setTab(t.id), 'aria-current': this.tab === t.id ? 'page' : undefined },
          h('span', { class: 'tab-i' }, t.icon, dot), h('span', { class: 'tab-n' }, t.name));
      }),
    );
    this.elNav.classList.toggle('tabbar-desktop', this.desktop);
  }

  /** Barre des sous-onglets de l'onglet courant (masquée s'il n'y en a qu'un). */
  subBar(tab: Tab, cur: Sub | null): HTMLElement | null {
    const list = subsShown(this.s, tab, this.layout);
    if (list.length < 2) return null;
    const b = this.bTab;
    return h('div', { class: 'subtabs', role: 'tablist' }, list.map((x) => {
      const n = h('span', { class: 'sub-n' });
      b.add(() => {
        const v = this.subBadge(x.id);
        const txt = typeof v === 'number' ? (v > 0 ? String(v) : '') : v ? '•' : '';
        if (n.textContent !== txt) n.textContent = txt;
        n.hidden = !txt;
      });
      return h('button', { class: `subtab ${x.id === cur ? 'active' : ''}`, role: 'tab', 'aria-selected': x.id === cur ? 'true' : 'false', 'data-sub': x.id, onclick: () => this.setTab(x.id) },
        h('span', { class: 'sub-i' }, x.icon), h('span', null, x.name), n);
    }));
  }

  /** Clés des achats possibles d'un sous-onglet (pastilles « nouveau »). */
  subKeys(sub: Sub): string[] {
    return affordableKeys(this.s, sub, (id) => this.buildingVisible(id));
  }

  /** Pastille d'un sous-onglet : un nombre (nouveautés) ou un simple signal. */
  subBadge(sub: Sub): number | boolean {
    const s = this.s;
    switch (sub) {
      case 'batiments': case 'heritage': case 'codex': return this.seen.fresh(sub, this.subKeys(sub));
      case 'jour': {
        const ev = this.rt.event;
        const evOpen = !!ev && (s.events[ev.key]?.tier ?? 0) < 3;
        return evOpen || !this.dailyRec(utcDateStr(Date.now()));
      }
      default: return false;
    }
  }

  badge(t: Tab): boolean {
    const s = this.s;
    if (t === 'vie') return isPaused(s) || !!s.succession;
    return subsShown(s, t, this.layout).some((x) => !!this.subBadge(x.id));
  }

  // =========================================================================
  // Panneau Vie
  sigLifeNow() {
    const s = this.s;
    return [!!s.life, isPaused(s), s.hero.id, s.hero.spouse?.name, s.unlocked.join(), !!s.succession, s.life?.extended, s.life?.dur, this.hint()?.id, s.eclats >= SHOP.temps.cost, s.blessings.length, this.installOffer(), s.ancestors.length > 0].join('|');
  }

  hint(): { id: string; text: string } | null {
    const s = this.s, f = s.flags, hero = s.hero, n = hero.name;
    const il = acc(hero, 'il', 'elle');
    const last = s.ancestors[s.ancestors.length - 1];
    const list: [string, boolean, string][] = [
      ['start', s.hero.gen === 1 && !!s.life, `Bienvenue dans la Maison ${s.lineage.name} ! ${n} travaille déjà ses terres. Change d'activité quand tu veux, ou reclique dessus pour mettre sa vie en pause : son temps ne s'écoule que lorsqu'${il} agit.`],
      ['pause', s.hero.gen <= 3 && isPaused(s), `Vie en pause : ${n} attend, tes Échos continuent de produire. Rien ne presse, mais ta lignée avance moins vite : on peut construire sans mettre en pause.`],
      ['echo', s.hero.gen === 1 && !!s.life && s.life.t > 15, 'Chaque seconde de cette vie est enregistrée. À sa mort, elle deviendra un Écho qui rejouera tes choix en boucle, pour toujours.'],
      ['echo2', s.hero.gen === 2 && s.echoes.length > 0, last ? `${last.name} est ${acc(last, 'devenu', 'devenue')} un Écho : ${acc(last, 'il', 'elle')} rejoue sa vie et produit pour toi (Mémoire › Échos). Chaque génération ajoute une boucle !` : ''],
      ['build', s.res.vivres >= 25 && Object.keys(s.buildings).length === 0, 'Tu as assez de Vivres pour bâtir des Champs (Améliorer › Bâtiments) : ils boostent la vie en cours ET les Échos.'],
      ['legacy', s.legacy >= 3 && Object.keys(s.upgrades).length === 0, 'Tu as de l\'Héritage ⚜️ ! Dépense-le dans Améliorer › Héritage pour des bonus permanents.'],
      ['voc', s.hero.gen >= 2 && s.hero.gen <= 4 && !!s.hero.vocation, `${n} a hérité d'une Vocation : consacre au moins la moitié de sa vie à la même activité pour la faire monter de rang. La jauge sous le sablier te dit où tu en es.`],
      ['destin', s.hero.gen >= 3 && !this.dailyRec(utcDateStr(Date.now())), 'La Commande du comté t\'attend : la même vie pour tous les joueurs, livre-la le plus jeune possible !'],
    ];
    for (const [id, cond, text] of list) if (cond && !f['hint_' + id]) return { id, text };
    return null;
  }

  renderLife() {
    const s = this.s, b = this.bLife;
    b.reset();
    const parts: HTMLElement[] = [];
    const hint = this.hint();
    let notice: HTMLElement | null = null;
    if (hint) {
      notice = h('div', { class: 'hint' }, h('span', { class: 'hint-i' }, '💡'), h('p', null, hint.text),
        h('button', { class: 'hint-x', 'aria-label': 'Compris', onclick: () => { s.flags['hint_' + hint.id] = true; this.sigLife = ''; } }, 'OK'));
    } else if (this.installOffer()) {
      notice = this.installCard();
    }
    // Sur téléphone l'astuce passe en tête ; sur ordinateur elle ne repousse pas le héros et va en bas de colonne.
    // L'astuce d'accueil (« Change d'activité… ») va sous les activités : en tête, elle les repoussait hors
    // de l'écran au premier lancement sur téléphone (GD-11).
    // Depuis UX-NAV 2, toutes les astuces vont sous les activités sur téléphone : la Vie tient en un écran.
    const noticeBelow = !this.desktop;
    if (notice && !this.desktop && !noticeBelow) parts.push(notice);
    parts.push(this.heroCard(s.hero, true, !this.desktop));

    if (!s.life) {
      parts.push(h('div', { class: 'card death-card' },
        h('div', { class: 'big-i' }, '🕯️'),
        h('h3', null, `La vie de ${this.nm(s.hero)} s'achève.`),
        h('p', { class: 'muted' }, s.echoes.length
          ? 'Son histoire va rejoindre les Échos. Rien ne presse : tes Échos continuent de boucler. Choisis qui reprendra le flambeau quand tu le souhaites.'
          : 'Sa vie deviendra ton premier Écho et rejouera ses choix pour toujours. Rien ne presse : choisis qui reprendra le flambeau quand tu le souhaites.'),
        h('button', { class: 'btn btn-primary', onclick: () => this.openSuccession() }, 'Choisir la relève')));
      if (notice && this.desktop) parts.push(notice);
      this.elLife.replaceChildren(...parts);
      return;
    }
    const life = s.life;
    // Chronomètre
    const bar = b.width(h('div', { class: 'bar-fill' }), () => life.t / life.dur);
    b.cls(bar, 'late', () => life.t / life.dur > 0.8);
    const paused = isPaused(s);
    const tempsBtn = !life.extended && s.eclats >= SHOP.temps.cost
      ? h('button', { class: 'btn btn-sm btn-ghost', onclick: () => { if (buyTemps(s)) { toast('⌛ +30 s de vie', 'good'); this.sigLife = ''; } } }, `⌛ +30 s (${SHOP.temps.cost} ✦)`) : null;
    const pauseBtn = paused
      ? h('button', { class: 'btn btn-primary btn-resume', onclick: () => resumeLife(s) }, `▶ Reprendre${this.desktop ? ' (Espace)' : ''}`)
      : h('button', { class: 'btn btn-sm btn-ghost btn-pause', 'aria-label': 'Pause', onclick: () => setActivity(s, null) }, this.desktop ? '⏸️ Pause (Espace)' : '⏸️');
    parts.push(h('div', { class: `card timer ${paused ? 'paused' : ''}` },
      paused ? h('div', { class: 'pause-banner' }, h('strong', null, '⏸️ Vie en pause'), h('span', { class: 'muted small' }, ' · le sablier est figé, tes Échos continuent')) : null,
      // Âge, temps restant et boutons sur une ligne : la rangée de boutons dédiée repoussait les activités.
      h('div', { class: 'row-between timer-head' },
        h('div', null,
          h('div', { class: 'label' }, 'Âge'),
          b.text(h('div', { class: 'timer-v' }), () => `${Math.floor(life.t)} / ${Math.round(life.dur)} ans`),
          b.text(h('div', { class: 'muted small timer-left' }), () => `reste ${fmtDur(life.dur - life.t)}`)),
        h('div', { class: 'row timer-btns' }, tempsBtn, pauseBtn)),
      h('div', { class: 'bar' }, bar),
      this.recStrip(b),
      s.ancestors.length > 0 ? this.vocationGauge(b) : null,
    ));

    // Activités
    const grid = h('div', { class: 'acts' });
    ACTS.forEach((a, i) => grid.appendChild(this.actCard(a, i, b)));
    // Les cartes ne portent plus leur description (une ligne chacune) : celle de l'activité en cours s'affiche dessous.
    const desc = b.text(h('p', { class: 'muted small act-now' }), () => {
      const a = s.life?.act;
      return a ? `${ACT[a].icon} ${ACT[a].name} : ${ACT[a].desc}` : 'Touche une activité pour reprendre la vie.';
    });
    parts.push(h('h3', { class: 'section-t' }, 'Activités', h('span', { class: 'muted small' }, this.desktop ? ' — touches 1 à 5' : '')), grid, desc);
    if (notice && (this.desktop || noticeBelow)) parts.push(notice);
    this.elLife.replaceChildren(...parts);
  }

  /** Prénom et rang dynastique (« Jehan III ») d'un membre de la lignée. */
  nm(p: Ranked): string {
    return regnalName(p, this.s.lineage.names);
  }

  heroCard(hero: Hero, current: boolean, compact = false) {
    const s = this.s;
    const voc = hero.vocation ? h('span', { class: 'badge badge-voc', style: { '--c': ACT[hero.vocation.act].color } }, `${ACT[hero.vocation.act].icon} ${vocationName(hero.vocation, hero, roman)}`) : null;
    return h('div', { class: `card hero-card ${compact ? 'hero-compact' : ''}` },
      h('div', { class: 'avatar' }, this.crestEl('avatar-shield'), h('span', { class: 'avatar-gen' }, roman(hero.gen))),
      h('div', { class: 'hero-info' },
        h('div', { class: 'hero-name' }, this.nm(hero), ' ', h('span', { class: 'muted' }, s.lineage.name)),
        h('div', { class: 'hero-sub' }, current ? `${compact ? '' : `Génération ${hero.gen} · `}vit ${Math.round(s.life?.dur ?? lifeDuration(s, hero))} s` : `Génération ${hero.gen}`, voc ? ' · ' : '', voc),
        // Sur téléphone, traits en pastilles (un toucher donne le nom et l'effet) : la carte tient en trois lignes.
        this.traitChips(hero.traits, compact, hero, current ? heroWear(s, hero) : null),
        spouseLine(hero, hero.spouse, true)));
  }

  /** Pastilles de traits, accordées au personnage qui les porte (sans personnage : les deux formes). */
  traitChips(ids: string[], small = false, who: Named | null = null, wear: Record<string, number> | null = null) {
    return h('div', { class: `traits ${small ? 'traits-sm' : ''}` }, ids.map((id) => {
      const t = TRAIT[id];
      if (!t) return null;
      const name = traitName(t, who);
      const w = wear?.[id] ?? 0;
      const wearTxt = (w >= 1 ? ` Transmis depuis ${w} génération${w > 1 ? 's' : ''} : chance de passer aux enfants ×${wearMult(w).toFixed(2).replace('.', ',')}.` : '') + evolutionHint(id);
      return h('button', {
        class: `trait ${t.neg ? 'neg' : ''}`, style: { '--c': RARITY[t.rarity].color }, title: `${name} — ${t.desc}${wearTxt}`,
        onclick: (e: Event) => { e.stopPropagation(); toast(`${t.icon} ${name} (${RARITY[t.rarity].name}) : ${t.desc}.${wearTxt}`, t.neg ? 'bad' : 'info'); },
      }, t.icon, small ? null : h('span', null, name), w >= 2 ? h('span', { class: 'wear' }, `🩸${w}`) : null);
    }));
  }

  recStrip(b: Binder) {
    const s = this.s;
    const strip = h('div', { class: 'strip' });
    let lastKey = '';
    b.add(() => {
      const life = s.life;
      if (!life) return;
      // Redessiner aussi quand la durée change (Temps suspendu, Longévité, Clepsydre).
      const key = life.rec.length + '/' + life.dur;
      if (key === lastKey) return;
      lastKey = key;
      strip.style.background = stripGradient(life.rec, life.dur);
    });
    return h('div', { class: 'rec' }, h('div', { class: 'label' }, h('span', { class: 'rec-dot' }), 'Enregistrement de l\'Écho'), strip);
  }

  /** Jauge du seuil de vocation : où en est la vie en cours, et ce qui sera transmis. */
  vocationGauge(b: Binder) {
    const s = this.s;
    const fill = h('div', { class: 'voc-fill' });
    const txt = h('div', { class: 'voc-txt' });
    const wrap = h('button', {
      class: 'voc-gauge', 'aria-label': 'Vocation',
      onclick: () => toast(`🎓 Consacre au moins ${Math.round(VOCATION_SHARE * 100)} % de la vie à une même activité : la relève pourra en recevoir la Vocation, un rang plus haut. Sinon, elle se transmet affaiblie d'un rang.`, 'info', 6000),
    },
      h('div', { class: 'label' }, '🎓 Vocation'),
      h('div', { class: 'voc-bar', style: { '--mark': `${VOCATION_SHARE * 100}%` } }, fill, h('span', { class: 'voc-mark' })),
      txt);
    let last = '';
    b.add(() => {
      const life = s.life;
      const o = life ? vocationOutlook(life, s.hero) : null;
      wrap.hidden = !o;
      if (!o) return;
      const d = ACT[o.act];
      const name = (v: { act: ActId; tier: number }) => vocationName(v, s.hero, roman);
      let text: string;
      if (o.state === 'secured') text = `✔ ${d.icon} ${name(o.result!)} acquise pour la relève`;
      else if (o.state === 'onTrack') {
        const cur = s.hero.vocation;
        const tail = cur && cur.act !== o.act ? ` · sinon ${name(cur)} s'affaiblit` : '';
        text = `${d.icon} Encore ${fmtDur(Math.ceil(o.need))} de ${d.name} pour ${name(o.result!)}${tail}`;
      } else text = o.result ? `⚠️ ${d.icon} ${name(o.result)} : transmise affaiblie` : `⚠️ ${d.icon} Vocation ${d.vocation} perdue`;
      const w = Math.min(100, o.share * 100).toFixed(1) + '%';
      const key = text + w + o.state;
      if (key === last) return;
      last = key;
      txt.textContent = text;
      fill.style.width = w;
      fill.style.background = d.color;
      wrap.dataset.state = o.state;
    });
    return wrap;
  }

  /** Proposer l'installation : après la 1re succession, discrètement, et deux fois au plus. */
  installOffer(): boolean {
    const s = this.s, f = s.flags;
    const mode = this.hooks.installMode();
    if (mode !== 'prompt' && mode !== 'ios') return false;
    if (f.install_done || f.install_never || s.ancestors.length === 0 || !s.life) return false;
    if (!f.install_later) return true;
    return (s.stats.sessions ?? 0) >= (s.stats.installAskAt ?? 0) + 2;
  }

  installCard() {
    const s = this.s, f = s.flags;
    const mode = this.hooks.installMode();
    const later = () => {
      if (!f.install_later) { f.install_later = true; s.stats.installAskAt = s.stats.sessions ?? 0; }
      else f.install_never = true;
      this.sigLife = '';
    };
    const how = h('p', { class: 'small install-how', hidden: true }, 'Dans Safari, touche ', h('strong', null, 'Partager ⬆️'), ' puis ', h('strong', null, '« Sur l\'écran d\'accueil »'), '.');
    const main = mode === 'prompt'
      ? h('button', { class: 'btn btn-sm btn-primary', onclick: async () => {
        if (await this.hooks.installPrompt()) { f.install_done = true; toast('📲 Échos de Lignée est installé !', 'good'); }
        this.sigLife = '';
      } }, 'Installer')
      : h('button', { class: 'btn btn-sm btn-primary', onclick: (e: Event) => {
        if (how.hidden) { how.hidden = false; (e.target as HTMLElement).textContent = 'C\'est fait'; }
        else { f.install_done = true; this.sigLife = ''; }
      } }, 'Comment faire ?');
    return h('div', { class: 'install-card' },
      h('span', { class: 'install-i' }, '📲'),
      h('div', { class: 'install-body' },
        h('p', null, h('strong', null, 'Tes Échos travaillent même quand tu pars.'), ' Installe le jeu pour revenir en un geste.'),
        how,
        h('div', { class: 'row-end' }, h('button', { class: 'btn btn-sm btn-ghost', onclick: later }, 'Plus tard'), main)));
  }

  actCard(a: ActId, idx: number, b: Binder) {
    const s = this.s, def = ACT[a];
    if (!s.unlocked.includes(a)) {
      const u = ACT_UNLOCK[a];
      const fill = b.width(h('div', { class: 'bar-fill' }), () => (u.res ? s.totalEver[u.res] / u.amount : 0));
      return h('div', { class: 'act locked' }, h('div', { class: 'act-i' }, '🔒'), h('div', { class: 'act-body' }, h('div', { class: 'act-n' }, def.name), h('div', { class: 'muted small' }, def.unlockText), h('div', { class: 'bar bar-thin' }, fill)));
    }
    const lvl = b.text(h('span', { class: 'lvl' }), () => `Niv. ${s.life?.lvl[a] ?? 0}`);
    const xp = b.width(h('div', { class: 'bar-fill', style: { background: def.color } }), () => (s.life ? s.life.xp[a] / xpToNext(s.life.lvl[a]) : 0));
    const rate = b.text(h('div', { class: 'act-rate' }), () => this.actPreview(a));
    const btn = h('button', { class: 'act', title: this.desktop ? def.desc : undefined, style: { '--c': def.color }, onclick: () => { setActivity(s, s.life?.act === a ? null : a); } },
      h('div', { class: 'act-i' }, def.icon, h('span', { class: 'act-key' }, String(idx + 1))),
      h('div', { class: 'act-body' },
        h('div', { class: 'act-head' }, h('span', { class: 'act-n' }, def.name), lvl),
        h('div', { class: 'bar bar-thin' }, xp),
        rate,
        h('div', { class: 'act-desc' }, def.desc)));
    b.cls(btn, 'active', () => s.life?.act === a);
    return btn;
  }

  actPreview(a: ActId): string {
    const s = this.s, life = s.life;
    if (!life) return '';
    const def = ACT[a];
    const p = lifePower(life, s.hero, a);
    const m = prodMult(s, this.rt, a) * p;
    const out: string[] = [];
    for (const r in def.produce) out.push(`+${fmt(def.produce[r as ResId]! * m)} ${RES_INFO[r as ResId].icon}/s`);
    for (const r in def.consume) out.push(`−${fmt(def.consume[r as ResId]! * Math.sqrt(p))} ${RES_INFO[r as ResId].icon}/s`);
    return out.join('  ');
  }

  // =========================================================================
  // Panneaux d'onglet
  sigTabNow(): string {
    const s = this.s;
    const tab = this.normTab(this.tab), sub = this.sub();
    const head = tab + '/' + sub + '/' + subsShown(s, tab, this.layout).map((x) => x.id).join() + '|';
    switch (sub) {
      case 'echos': return head + this.sigEchoNow();
      case 'batiments': return head + BUILDINGS.filter((x) => this.buildingVisible(x.id)).map((x) => x.id + (s.buildings[x.id] ?? 0)).join();
      case 'heritage': return head + JSON.stringify(s.upgrades);
      case 'bazar': return head + s.blessings.join() + s.partitions.join() + this.lineageSig() + !!s.life + s.life?.extended;
      case 'lignee': return head + s.ancestors.length + this.lineageSig() + '|' + s.hero.id + (s.hero.spouse?.name ?? '') + !!s.life;
      case 'alliances': return head + s.hero.id + (s.hero.spouse?.name ?? '') + !!s.life + '|' + s.cadets.length + JSON.stringify(s.alliances) + '|' + weekIndex(Date.now()) + this.lineageSig();
      case 'codex': return head + Object.keys(s.epithets).length;
      case 'jour': {
        const ev = this.rt.event;
        return head + (ev?.key ?? '') + (ev ? s.events[ev.key]?.tier : '') + JSON.stringify(this.dailyRec(utcDateStr(Date.now())) ?? null) + Math.floor(Date.now() / 60000);
      }
      case 'calendrier': return head + (this.rt.event?.key ?? '') + Math.floor(Date.now() / 60000);
      default: return head;
    }
  }

  sigEchoNow(): string {
    const s = this.s;
    return 'E' + s.echoes.map((e) => e.id + (e.pinned ? 'p' : '')).join() + '|' + echoSlots(s);
  }

  renderTabPanel() {
    this.bTab.reset();
    const t = this.normTab(this.tab);
    const sub = this.sub();
    let el: HTMLElement | null = null;
    switch (sub) {
      case 'echos': el = this.panelEchoes(this.bTab); break;
      case 'batiments': el = this.panelBatiments(); break;
      case 'heritage': el = this.panelHeritage(); break;
      case 'bazar': el = this.panelBazar(); break;
      case 'lignee': el = this.panelMaison(); break;
      case 'alliances': el = alliancesSection(this); break;
      case 'codex': el = codexSection(this); break;
      case 'jour': el = this.panelJour(); break;
      case 'calendrier': el = this.panelCalendrier(); break;
    }
    // Les sous-onglets et le contenu sont frères : l'espacement du panneau s'applique à tous.
    const root = h('div', { 'data-sub': sub ?? '' });
    const bar = this.subBar(t, sub);
    if (subBarPlace(this.layout) === 'dock') {
      if (bar) this.elSubDock.replaceChildren(bar); else this.elSubDock.replaceChildren();
    } else if (bar) root.append(bar);
    if (el) root.append(...Array.from(el.childNodes));
    if (sub) this.markSeen(sub);
    this.elTab.replaceChildren(root);
  }

  /** Ce qui est affiché est vu : les pastilles « nouveau » de ce sous-onglet s'éteignent. */
  markSeen(sub: Sub) {
    if (sub === 'batiments' || sub === 'heritage' || sub === 'codex') this.seen.mark(sub, this.subKeys(sub));
  }

  // --- Échos ----------------------------------------------------------------
  panelEchoes(b: Binder) {
    const s = this.s;
    const head = h('div', { class: 'card panel-head' },
      h('h2', null, '🌀 Échos ancestraux'),
      h('p', { class: 'muted' }, 'Chaque ancêtre rejoue sa vie en boucle. Leur production profite de tous tes bonus actuels.'),
      cryptBoost(s) > 1 ? h('p', { class: 'small accent' }, `💫 ${this.nm(s.hero)} est une Étoile filante : la Crypte s'embrase, tous les Échos ×${cryptBoost(s)} jusqu'à sa mort (et elle ne laissera pas d'Écho).`) : null,
      h('div', { class: 'stats' },
        stat('Emplacements', `${s.echoes.length} / ${echoSlots(s)}`),
        stat('Puissance de base', b.text(h('span'), () => `×${echoPowerMult(s, this.rt).toFixed(2)}`)),
        stat('Production des Échos', b.text(h('span'), () => `${fmt(this.rt.echoRate)} pts/s`))));
    if (!s.echoes.length) {
      return h('div', null, head, h('div', { class: 'card empty' }, h('div', { class: 'big-i' }, '👻'), h('p', null, `Aucun Écho pour l'instant. Quand ${s.hero.name} s'éteindra, sa vie deviendra une boucle éternelle.`)));
    }
    const list = h('div', { class: 'echo-list' }, s.echoes.map((e) => this.echoCard(e, b, () => { this.sigTab = ''; this.sigEcho = ''; })));
    return h('div', null, head, list);
  }

  echoCard(e: Echo, b: Binder, refresh: () => void) {
    const s = this.s;
    const head = h('div', { class: 'act-head' },
      h('span', { class: 'echo-name' }, `${fullName(e, s.lineage.names)} `, h('span', { class: 'muted' }, `· Gén. ${e.gen}`)),
      h('span', { class: 'row' },
        e.pinned ? h('span', { class: 'badge badge-lock' }, '🔒 Protégé') : null,
        b.text(h('span', { class: 'loops' }), () => `↻ ${e.loops}`)));
    const timeline = h('div', { class: 'timeline', style: { background: stripGradient(e.acts, e.acts.length) } });
    const ph = h('div', { class: 'playhead' });
    timeline.appendChild(ph);
    b.add(() => { ph.style.left = ((e.pos / Math.max(1, e.acts.length)) * 100).toFixed(2) + '%'; });
    const doing = b.text(h('span', { class: 'doing' }), () => {
      const a = e.acts[Math.floor(e.pos)];
      return a >= 0 ? `${ACT[ACTS[a]].icon} ${ACT[ACTS[a]].name}` : '💤 Repos';
    });
    const voc = e.vocation ? h('span', { class: 'badge badge-voc', style: { '--c': ACT[e.vocation.act].color } }, `${ACT[e.vocation.act].icon} ${vocationName(e.vocation, e, roman)}`) : null;
    return h('div', { class: `card echo-card ${e.pinned ? 'pinned' : ''}` },
      head,
      h('div', { class: 'row-wrap' }, voc, epithetBadge(e.epithet, e), this.traitChips(e.traits, true, e)),
      timeline,
      h('div', { class: 'row-between small' },
        doing,
        h('span', { class: 'muted', title: 'Production attendue par seconde, hors bonus d\'événement : la valeur de sa vie par seconde × sa puissance de rejeu. Une vie courte ne rapporte pas plus parce qu\'elle boucle plus vite.' }, `Puissance ×${echoPower(s, this.rt, e).toFixed(2)} · ${e.acts.length} s · ${fmt(echoExpectedRate(s, this.rt, e))} pts/s`),
        h('span', { class: 'row' },
          // L'état ne repose pas que sur l'émoji (📌 et 📍 se confondaient) : bouton doré plein quand l'Écho est protégé.
          h('button', { class: `icon-btn sm lock-btn ${e.pinned ? 'on' : ''}`, 'aria-pressed': String(e.pinned), title: e.pinned ? 'Retirer la protection' : 'Protéger (gardé en priorité lors des successions)', onclick: () => { e.pinned = !e.pinned; refresh(); } }, e.pinned ? '🔒' : '🔓'),
          h('button', { class: 'icon-btn sm', title: 'Libérer cet Écho', onclick: async () => { if (await confirmBox(`Libérer l'Écho de ${this.nm(e)} ? Il disparaîtra définitivement.`, 'Libérer', true)) { s.echoes = s.echoes.filter((x) => x !== e); refresh(); } } }, '🗑️'))));
  }

  // --- Améliorer : Bâtiments ------------------------------------------------
  buildingVisible(id: string) {
    const d = BUILDINGS.find((x) => x.id === id)!;
    if (d.minGen) return buildingOpen(this.s, id);
    return Object.keys(d.cost).every((r) => this.s.totalEver[r as ResId] > 0) || (this.s.buildings[id] ?? 0) > 0;
  }

  // --- Améliorer : Bâtiments, Héritage, Bazar ----------------------------------
  panelBatiments() {
    const s = this.s, b = this.bTab;
    const builds = h('div', { class: 'grid-cards' }, BUILDINGS.filter((x) => this.buildingVisible(x.id)).map((d) => {
      const lvl = s.buildings[d.id] ?? 0;
      const maxed = d.max !== undefined && lvl >= d.max;
      const cost = buildingCost(d.id, lvl);
      const costEl = h('div', { class: 'cost' }, maxed ? 'MAX' : Object.entries(cost).map(([r, v]) => {
        const span = h('span', { class: 'cost-i' }, `${RES_INFO[r as ResId].icon} ${fmt(v!)}`);
        b.cls(span, 'short', () => s.res[r as ResId] < v!);
        return span;
      }));
      const btn = h('button', { class: 'btn btn-primary btn-sm', disabled: maxed || undefined, onclick: () => { if (buyBuilding(s, d.id)) this.sigTab = ''; } }, maxed ? 'Max' : 'Bâtir');
      if (!maxed) b.add(() => { (btn as HTMLButtonElement).disabled = !canAfford(s, cost); });
      return h('div', { class: 'card build' },
        h('div', { class: 'build-head' }, h('span', { class: 'build-i' }, d.icon), h('div', null, h('div', { class: 'build-n' }, d.name, ' ', h('span', { class: 'lvl' }, `niv. ${lvl}${d.max ? '/' + d.max : ''}`)), h('div', { class: 'muted small' }, d.desc))),
        h('div', { class: 'small accent' }, lvl > 0 ? d.effect(lvl) : '—'),
        h('div', { class: 'row-between' }, costEl, btn));
    }));
    return h('div', null,
      h('p', { class: 'muted small intro-p' }, 'Payés en ressources, les bâtiments renforcent la vie en cours et tous tes Échos.'),
      builds.children.length ? builds : h('p', { class: 'muted card' }, 'Récolte des ressources pour découvrir les bâtiments.'));
  }

  panelHeritage() {
    const s = this.s, b = this.bTab;
    const head = h('div', { class: 'card panel-head' },
      h('div', { class: 'stats' }, stat('Héritage disponible', b.text(h('span', { class: 'accent' }), () => `${fmt(s.legacy, 0)} ⚜️`)), stat('Accumulé', `${fmtInt(s.legacyTotal)} ⚜️`)),
      h('p', { class: 'muted small' }, 'L\'Héritage est gagné à chaque mort selon la valeur produite par chaque vie. Il améliore définitivement ta lignée.'));
    // Lignes compactes ; les améliorations terminées sont repliées en bas (elles ne demandent plus rien).
    const row = (d: (typeof LEGACY)[number]) => {
      const lvl = s.upgrades[d.id] ?? 0;
      const maxed = d.max !== undefined && lvl >= d.max;
      const c = legacyCost(d, lvl);
      const btn = maxed ? h('span', { class: 'lvl' }, '✔') : h('button', { class: 'btn btn-primary btn-sm', onclick: () => { if (buyLegacy(s, d.id)) { this.sigTab = ''; toast(this.legacyToast(d.id, lvl + 1), 'good', 4500); } } }, `${fmt(c, 0)} ⚜️`);
      if (!maxed) b.add(() => { (btn as HTMLButtonElement).disabled = s.legacy < c; });
      // Déblocage d'une mécanique (Alliances, Chroniques) : une étiquette suffit à signaler qu'il ne s'agit pas
      // d'une amélioration chiffrée (GD-01, R12). Le prix est sur le bouton et l'Héritage en tête : pas de jauge.
      const unlock = d.max === 1 && lvl === 0;
      const tag = unlock
        ? h('span', { class: 'badge badge-new' }, '✨ Nouvelle fonctionnalité')
        : h('span', { class: 'lvl' }, `niv. ${lvl}${d.max ? '/' + d.max : ''}`);
      return h('div', { class: `card build legacy-row ${unlock ? 'build-new' : ''}` },
        h('span', { class: 'build-i' }, d.icon),
        h('div', { class: 'legacy-body' }, h('div', { class: 'build-n' }, d.name, ' ', tag), h('div', { class: 'muted small' }, d.desc)),
        btn);
    };
    const isMax = (d: (typeof LEGACY)[number]) => d.max !== undefined && (s.upgrades[d.id] ?? 0) >= d.max;
    const open = LEGACY.filter((d) => !isMax(d)), done = LEGACY.filter(isMax);
    const ups = h('div', { class: 'legacy-list' }, open.map(row));
    const doneEl = done.length ? h('details', { class: 'howto done-list' }, h('summary', null, `Terminées (${done.length})`), h('div', { class: 'legacy-list' }, done.map(row))) : null;
    return h('div', null, head, ups, doneEl);
  }

  /** Annonce d'un achat d'Héritage : un déblocage dit où trouver la nouvelle mécanique. */
  legacyToast(id: string, lvl: number): string {
    const d = LEGACY.find((x) => x.id === id)!;
    const where = id === 'alliances' ? ' · nouveau : Maison › Alliances' : id === 'chroniques' ? ' · nouveau : Maison › Codex' : '';
    return `${d.icon} ${d.name} niv. ${lvl}${where}`;
  }

  // --- Maison : Lignée (blason, généalogie), Alliances, Codex ------------------
  panelMaison() {
    const s = this.s;
    const head = h('div', { class: 'card panel-head' },
      h('div', { class: 'row' }, this.crestEl('crest crest-lg'),
        h('div', null, h('h2', null, `Maison ${s.lineage.name}`), h('div', { class: 'muted' }, `${s.ancestors.length} ancêtres · ${fmtInt(s.legacyTotal)} ⚜️ accumulés`),
          // Ornements : un par haut fait obtenu (cosmétique, 0.3).
          FEATS.some((d) => s.feats?.[d.id]) ? h('div', { class: 'ornaments', 'aria-label': 'Hauts faits' }, FEATS.filter((d) => s.feats?.[d.id]).map((d) => h('span', { title: d.name }, d.icon))) : null)),
      h('div', { class: 'row-wrap' },
        h('button', { class: 'btn btn-sm', onclick: () => this.openRename() }, '✏️ Renommer'),
        h('button', { class: 'btn btn-sm', onclick: () => this.openCrest() }, '🛡️ Blason et partitions')));
    const anc = [...s.ancestors].reverse();
    const tree = this.ancestorTree(anc.slice(0, ANCESTORS_SHOWN));
    const more = anc.length > ANCESTORS_SHOWN
      ? h('button', { class: 'btn btn-sm btn-ghost tree-more', onclick: () => this.openGenealogy() }, `📜 Voir toute la généalogie (${anc.length} ancêtres)`)
      : null;
    return h('div', null, head,
      h('h3', { class: 'section-t' }, 'Généalogie'),
      anc.length ? h('div', null, tree, more) : h('p', { class: 'card muted' }, 'Les ancêtres apparaîtront ici.'));
  }

  openGenealogy() {
    const anc = [...this.s.ancestors].reverse();
    modal(h('div', null,
      h('h2', null, `📜 Généalogie de la Maison ${this.s.lineage.name}`),
      h('p', { class: 'muted small' }, `${anc.length} ancêtres, du plus récent ${this.s.ancestors[0] ? acc(this.s.ancestors[0], 'au fondateur', 'à la fondatrice') : 'au fondateur'}${anc.length > 200 ? ' (les 200 derniers)' : ''}.`),
      this.ancestorTree(anc.slice(0, 200))), { wide: true });
  }

  ancestorTree(anc: GameState['ancestors']) {
    return h('div', { class: 'tree' }, anc.map((a) => h('div', { class: 'tree-node' },
      h('div', { class: 'tree-gen' }, roman(a.gen)),
      h('div', { class: 'tree-body' },
        h('div', { class: 'row-between' }, h('strong', null, fullName(a, this.s.lineage.names)), h('span', { class: 'muted small' }, `+${a.legacy} ⚜️ · ${fmt(a.value)} pts`)),
        h('div', { class: 'row-wrap small' },
          a.vocation ? h('span', { class: 'badge badge-voc', style: { '--c': ACT[a.vocation.act].color } }, `${ACT[a.vocation.act].icon} ${vocationName(a.vocation, a, roman)}`) : h('span', { class: 'muted' }, a.dominant ? `${ACT[a.dominant].icon} touche-à-tout` : '—'),
          epithetBadge(a.epithet, a),
          this.traitChips(a.traits, true, a)),
        spouseLine(a, a.spouse, true)))));
  }

  // --- Destin : Aujourd'hui (Commande du jour, événement), Calendrier ----------
  panelJour() {
    const s = this.s, b = this.bTab;
    const now = Date.now();
    const parts: HTMLElement[] = [];
    // Défi du jour
    const date = utcDateStr(now);
    const setup = dailySetup(date);
    const rec = this.dailyRec(date);
    const nextDay = Date.UTC(new Date(now).getUTCFullYear(), new Date(now).getUTCMonth(), new Date(now).getUTCDate() + 1);
    const tiers = dailyTiers(date);
    parts.push(h('div', { class: 'card daily-card' },
      h('div', { class: 'label' }, `Destin du jour · ${new Date(now).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`),
      h('h2', null, `📜 La Commande du comté`),
      h('p', { class: 'muted small' }, `La vie de ${setup.name}, identique pour tous les joueurs. Réunis la commande en stock, au même moment, le plus jeune possible, et partage ton résultat.`),
      this.orderChips(setup.order),
      this.traitChips(setup.traits, false, setup),
      h('div', { class: 'row-wrap' }, setup.mods.map((m) => h('span', { class: 'badge' }, `${m.icon} ${m.name} — ${m.desc}`))),
      h('div', { class: 'stats' },
        stat('Ton record', rec ? `${(() => { const n = medalsOf(date, rec.best); return n ? MEDALS[n - 1] + ' ' : ''; })()}${fmtDailyResult(rec.best)}` : '—'),
        stat('Médailles (âge de livraison)', `🥉 ${tiers[0]} · 🥈 ${tiers[1]} · 🥇 ${tiers[2]} ans`),
        stat('Nouveau destin', b.text(h('span'), () => fmtDur((nextDay - Date.now()) / 1000)))),
      h('div', { class: 'row-wrap' },
        h('button', { class: 'btn btn-primary', onclick: () => this.openDaily() }, rec ? '🔁 Rejouer' : '▶️ Jouer'),
        rec ? h('button', { class: 'btn', onclick: () => this.shareDaily(date, rec.best, rec.code) }, '📤 Partager') : null)));

    const ev = this.rt.event;
    if (ev) {
      const ep = s.events[ev.key];
      const fill = b.width(h('div', { class: 'bar-fill', style: { background: ev.def.color } }), () => (ep ? ep.progress / (ep.target * EVENT_TIERS[2]) : 0));
      const marks = EVENT_TIERS.map((t, i) => h('div', { class: 'tier-mark', style: { left: (t / EVENT_TIERS[2] * 100) + '%' } }, h('span', null, ['🥉', '🥈', '🥇'][i])));
      parts.push(h('div', { class: 'card event-card', style: { '--c': ev.def.color } },
        h('div', { class: 'label' }, 'Événement en cours'),
        h('h2', null, `${ev.def.icon} ${ev.def.name}`),
        h('p', null, ev.def.desc),
        b.text(h('p', { class: 'muted' }), () => `Se termine dans ${fmtDur((ev.end - Date.now()) / 1000)} · Toute ta production compte, ${RES_INFO[ev.def.goal].icon} ${RES_INFO[ev.def.goal].name} ×${ep?.v === 2 ? EVENT_GOAL_WEIGHT : 1}`),
        h('div', { class: 'bar bar-tiers' }, fill, marks),
        b.text(h('p', { class: 'small' }), () => ep ? `${fmt(ep.progress)} / ${fmt(ep.target * EVENT_TIERS[Math.min(2, ep.tier)])} ${RES_INFO[ev.def.goal].icon}${ep.v === 2 ? ' (équivalent)' : ''} · Récompenses : ${EVENT_REWARDS.join(' / ')} ✦` : '')));
    }
    if (!ev) {
      const next = upcomingEvents(now, 7)[0];
      if (next) parts.push(h('button', { class: 'card next-ev', style: { '--c': next.def.color }, onclick: () => this.setTab('calendrier') },
        h('span', { class: 'ev-i' }, next.def.icon),
        h('div', null, h('div', { class: 'label' }, 'Prochain événement'), h('strong', null, next.def.name)),
        b.text(h('span', { class: 'muted small right' }), () => `dans ${fmtDur((next.start - Date.now()) / 1000)} ›`)));
    }
    return h('div', null, parts);
  }

  panelCalendrier() {
    const now = Date.now();
    const ev = this.rt.event;
    const parts: HTMLElement[] = [];
    const ups = upcomingEvents(now, 7).filter((w) => w.key !== ev?.key).slice(0, 12);
    parts.push(h('div', { class: 'card' },
      h('h2', null, '📅 Calendrier des événements'),
      h('p', { class: 'muted small' }, 'Toutes les 4 heures, un événement de 45 min frappe le monde entier au même moment. Sois présent pour décrocher des Éclats célestes ✦.'),
      h('ul', { class: 'ev-list' }, ups.map((w) => h('li', null,
        h('span', { class: 'ev-i', style: { '--c': w.def.color } }, w.def.icon),
        h('div', null, h('strong', null, w.def.name), h('div', { class: 'muted small' }, w.def.desc)),
        h('div', { class: 'right small' }, h('div', null, `${fmtDay(w.start)} ${fmtClock(w.start)}`), h('div', { class: 'muted' }, `dans ${fmtDur((w.start - now) / 1000)}`))))),
      h('button', { class: 'btn btn-sm', onclick: () => { download('echos-de-lignee-evenements.ics', buildIcs(), 'text/calendar'); toast('📅 Calendrier téléchargé : ouvre-le pour l\'ajouter à ton agenda.', 'good'); } }, '📅 Ajouter à mon agenda')));

    return h('div', null, parts);
  }

  /** Dons mûris à la succession : lesquels se sont transcendés, et chez combien d'enfants. */
  evolutionReveal(): HTMLElement | null {
    const sc = this.s.succession;
    if (!sc?.ripe) return null;
    const lines = Object.entries(sc.ripe).map(([from, to]) => {
      const a = TRAIT[from], b = TRAIT[to];
      const n = sc.heirs.filter((x) => x.evolved?.includes(to)).length;
      return h('li', null, `${a.icon} ${traitName(a)} → ${b.icon} ${traitName(b)} (${RARITY[b.rarity].name}) : `,
        n ? h('strong', null, `chez ${n} enfant${n > 1 ? 's' : ''}`) : h('span', { class: 'muted' }, 'mûr, mais il ne s\'est pas transcendé cette fois'));
    });
    return h('div', { class: 'card evo-card' }, h('strong', null, '🌱 Des dons ont mûri'), h('ul', { class: 'plain-list small' }, lines));
  }

  panelBazar() {
    const s = this.s, b = this.bTab;
    const parts: HTMLElement[] = [];
    // Bazar céleste
    const bless = TRAITS.filter((t) => blessable(t.id));
    parts.push(h('div', { class: 'card' },
      h('h2', null, '✦ Bazar céleste'),
      h('p', { class: 'muted small' }, `Éclats disponibles : ${fmt(s.eclats, 0)} ✦. Les Bénédictions sont offertes à tous les enfants de la prochaine succession (max 2). Chaque Bénédiction légendaire ou mythique renchérit les suivantes de moitié. Les dons mûris et l'Étoile filante ne s'achètent pas.`),
      s.blessings.length ? h('p', { class: 'small accent' }, 'Bénédictions en attente : ', this.traitChips(s.blessings, true)) : null,
      h('div', { class: 'shop' }, bless.map((t) => {
        const c = blessingCost(s, t.id);
        const btn = h('button', { class: 'shop-item', style: { '--c': RARITY[t.rarity].color }, onclick: () => { if (buyBlessing(s, t.id)) { toast(`${t.icon} Bénédiction « ${traitName(t)} » réservée`, 'good'); this.sigTab = ''; } else toast('Impossible : Éclats insuffisants, déjà choisie ou 2 bénédictions max.', 'bad'); } },
          h('span', { class: 'shop-i' }, t.icon), h('span', { class: 'shop-n' }, traitName(t)), h('span', { class: 'muted small' }, t.desc), h('span', { class: 'shop-c' }, `${c} ✦`));
        b.cls(btn, 'off', () => s.eclats < c || s.blessings.includes(t.id) || s.blessings.length >= 2);
        return btn;
      }))),
      h('div', { class: 'card' },
        h('h2', null, '✦ Autres usages des Éclats'),
        h('ul', { class: 'plain-list small' },
          h('li', null, `⌛ +30 s de vie (${SHOP.temps.cost} ✦), une fois par vie : bouton sous le sablier, dans la Vie.`),
          h('li', null, `🛡️ Partitions de l'écu (${SHOP.partition.cost} ✦ chacune) et changement d'emblème : `,
            h('button', { class: 'link-btn', onclick: () => this.openCrest() }, 'ouvrir le blason'), '.'))));
    return h('div', null, parts);
  }

  // =========================================================================
  // Modales
  openSuccession() {
    const s = this.s;
    const sc = s.succession;
    if (!sc || this.successionModal) return;
    // Une Étoile filante ne laisse pas d'Écho : il n'y a que la Crypte actuelle à trier.
    const all = sc.noEcho ? [...s.echoes] : [...s.echoes, sc.newEcho];
    const slots = echoSlots(s);
    if (!this.echoSel) {
      const ranked = [...all].sort((a, b) => (b.pinned ? 1e18 : 0) + echoExpectedRate(s, this.rt, b) - ((a.pinned ? 1e18 : 0) + echoExpectedRate(s, this.rt, a)));
      // le nouvel Écho est gardé par défaut s'il n'est pas le pire
      this.echoSel = new Set(ranked.slice(0, slots).map((e) => e.id));
    }
    const sel = this.echoSel;
    let chosen = 0;
    const content = h('div', { class: 'succession' });
    const render = () => {
      const a = sc.ancestor;
      const over = all.length > slots;
      const heirs = h('div', { class: 'heirs' }, sc.heirs.map((hero, i) => {
        // Meilleure aptitude parmi les activités débloquées (GD-11 : « 📖 ×1,40 » pointait Étudier, encore verrouillé).
        const open = ACTS.filter((x) => s.unlocked.includes(x));
        const m = open.map((x) => heroActMult(hero, x));
        const best = open[m.indexOf(Math.max(...m))];
        return h('button', { class: `heir ${i === chosen ? 'chosen' : ''}`, onclick: () => { chosen = i; render(); } },
          h('div', { class: 'heir-name' }, this.nm(hero)),
          hero.vocation ? h('span', { class: 'badge badge-voc', style: { '--c': ACT[hero.vocation.act].color } }, `${ACT[hero.vocation.act].icon} ${vocationName(hero.vocation, hero, roman)}`) : h('span', { class: 'muted small' }, 'Sans vocation'),
          h('div', { class: 'heir-traits' }, hero.traits.map((id) => {
            const t = TRAIT[id], w = hero.wear?.[id] ?? 0;
            const ev = hero.evolved?.includes(id);
            return h('div', { class: `heir-trait ${t.neg ? 'neg' : ''} ${ev ? 'evolved' : ''}`, style: { '--c': RARITY[t.rarity].color } }, `${t.icon} ${traitName(t, hero)}`, ev ? h('span', { class: 'evo-tag', title: 'Ce don a mûri en passant du parent à l\'enfant' }, ' ✨ a mûri') : null, h('span', { class: 'muted small' }, ` — ${t.desc}`),
              w >= 2 ? h('span', { class: 'wear', title: `Don transmis depuis ${w} générations : il passera à ses enfants avec une chance ×${wearMult(w).toFixed(2).replace('.', ',')}. Une alliance apporte du sang neuf.` }, ` 🩸 ${w} gén.`) : null);
          })),
          h('div', { class: 'muted small' }, `Vie : ${Math.round(lifeDuration(s, hero))} s · Meilleure aptitude : ${ACT[best].icon} ×${Math.max(...m).toFixed(2)}`));
      }));
      const echoList = h('div', { class: 'echo-pick' }, all.map((e) => {
        const on = sel.has(e.id);
        return h('button', { class: `echo-chip ${on ? 'on' : ''} ${e === sc.newEcho ? 'new' : ''}`, onclick: () => {
          if (on) sel.delete(e.id); else if (sel.size < slots) sel.add(e.id); else { toast(`Seulement ${slots} emplacements : libère d'abord un autre Écho.`, 'bad'); return; }
          render();
        } },
          h('div', { class: 'row-between' }, h('strong', null, `${e === sc.newEcho ? '✨ ' : ''}${fullName(e, s.lineage.names)}`), h('span', { class: 'small' }, on ? '✔ gardé' : '✖ libéré')),
          h('div', { class: 'timeline sm', style: { background: stripGradient(e.acts, e.acts.length) } }),
          h('div', { class: 'muted small', title: 'Production attendue par seconde, hors bonus d\'événement (puissance de rejeu, traits d\'Écho et surnom compris)' }, `Gén. ${e.gen} · ${fmt(echoExpectedRate(s, this.rt, e))} pts/s · ${e.acts.length} s${e.pinned ? ' · 🔒' : ''}`));
      }));
      const ok = h('button', { class: 'btn btn-primary btn-lg', onclick: () => {
        if (sel.size > slots) return;
        const featsBefore = new Set(Object.keys(s.feats ?? {}));
        if (confirmSuccession(s, chosen, [...sel])) {
          for (const id of Object.keys(s.feats ?? {})) if (!featsBefore.has(id)) toast(`🏆 Haut fait : ${FEAT_DEF[id].icon} ${FEAT_DEF[id].name} ! +${FEAT_DEF[id].eclats} ✦`, 'good');
          this.echoSel = null;
          this.successionModal?.close();
          this.successionModal = null;
          this.sigLife = '';
          this.sigTab = '';
          toast(`👑 ${this.nm(s.hero)} reprend le flambeau (génération ${s.hero.gen})`, 'good');
          this.hooks.save();
        }
      } }, 'Perpétuer la lignée');
      content.replaceChildren(...[
        h('div', { class: 'center' },
          h('div', { class: 'big-i' }, '🕯️'),
          h('h2', null, `${this.nm(a)} rejoint les ancêtres`),
          h('p', { class: 'muted' }, `Génération ${a.gen} · ${fmt(a.value)} pts de valeur produite`)),
        this.epithetReveal(),
        this.evolutionReveal(),
        sc.feats?.length ? h('div', { class: 'card evo-card' }, h('strong', null, '🏆 Haut fait accompli'), h('ul', { class: 'plain-list small' }, sc.feats.map((id) => h('li', null, `${FEAT_DEF[id].icon} ${FEAT_DEF[id].name} : +${FEAT_DEF[id].eclats} ✦`)))) : null,
        sc.noEcho ? h('div', { class: 'card nova-card' }, h('strong', null, '💫 Une Étoile filante s\'est éteinte'), h('p', { class: 'muted small' }, 'Sa vie a embrasé la Crypte, mais elle ne laisse pas d\'Écho : seuls tes Échos actuels continuent de boucler.')) : null,
        h('div', { class: 'stats' },
          stat('Héritage gagné', `+${sc.legacyGain} ⚜️`),
          stat('Vocation', sc.vocationEarned ? `${ACT[sc.vocationEarned.act].icon} ${vocationName(sc.vocationEarned, a, roman)}` : 'Aucune'),
          stat('Prochain palier ⚜️', `${fmt(Math.pow(sc.legacyGain + 1, 3) * 20)} pts`)),
        h('h3', { class: 'section-t' }, `Échos à conserver (${sel.size}/${slots})`),
        over ? h('p', { class: 'muted small' }, 'Tu as plus d\'Échos que d\'emplacements : choisis ceux qui continueront de boucler.') : null,
        echoList,
        h('h3', { class: 'section-t' }, 'Choisis qui portera le nom'),
        a.spouse ? h('p', { class: 'muted small' }, `Enfants de ${this.nm(a)} et de ${fullName(a.spouse)} (Maison ${a.spouse.house.name}) : ils héritent des dons de leurs deux parents.`) : null,
        heirs,
        alliancesUnlocked(s) && sc.heirs.length > 1 ? h('p', { class: 'muted small' }, '💌 Les enfants que tu ne choisis pas deviennent des cadets : tu pourras les marier à d\'autres maisons (Lignée → Alliances).') : null,
        h('div', { class: 'row-end sticky-bottom' }, ok)].filter((x): x is HTMLElement => !!x));
    };
    render();
    this.successionModal = modal(content, { wide: true, onClose: () => { this.successionModal = null; } });
  }

  /** Surnom que la Chronique vient d'attribuer au défunt (succession). */
  epithetReveal(): HTMLElement | null {
    const sc = this.s.succession;
    const info = sc?.epithet;
    if (!sc) return null;
    const a = sc.ancestor;
    if (!info) {
      return chroniclesUnlocked(this.s) ? h('p', { class: 'muted small center' }, '📜 Une vie sans éclat : les Chroniques ne lui donnent pas de surnom.') : null;
    }
    const e = EPITHET[info.id];
    if (epithetRevealKind(info.id, info.isNew) === 'ligne') {
      return h('p', { class: 'muted small center', title: epithetEffect(e, (x) => ACT[x].name) },
        `📜 Les Chroniques retiennent ${this.nm(a)} ${epithetLabel(e.id, a)} ${e.icon} · ${EPITHET_RARITY[e.rarity].name}`);
    }
    return h('div', { class: 'card epithet-reveal', style: { '--c': EPITHET_RARITY[e.rarity].color } },
      h('div', { class: 'label' }, info.isNew ? `✨ Nouveau surnom découvert · ${EPITHET_RARITY[e.rarity].name} · +${info.eclats} ✦` : `📜 Les Chroniques retiennent · ${EPITHET_RARITY[e.rarity].name}`),
      h('h3', null, `${e.icon} ${this.nm(a)} ${epithetLabel(e.id, a)}`),
      h('p', { class: 'muted small' }, epithetEffect(e, (x) => ACT[x].name)));
  }

  /** Lien partagé « …#mariage=CODE » : ouvre la demande en mariage. */
  handleDeepLink() {
    const m = location.hash.match(/^#mariage=(.+)$/);
    if (!m) return;
    history.replaceState(null, '', location.pathname + location.search);
    openAcceptProposal(this, decodeURIComponent(m[1]));
  }

  showOffline(r: OfflineReport) {
    const gains = RES.filter((x) => Math.abs(r.gains[x]) > 0.01).map((x) => h('div', { class: 'stat' }, h('div', { class: 'stat-l' }, `${RES_INFO[x].icon} ${RES_INFO[x].name}`), h('div', { class: 'stat-v' }, `${r.gains[x] >= 0 ? '+' : ''}${fmt(r.gains[x])}`)));
    const m = modal(h('div', { class: 'center' },
      h('div', { class: 'big-i' }, '🌙'),
      h('h2', null, 'Pendant ton absence…'),
      h('p', { class: 'muted' }, `${fmtDur(r.seconds)} se sont écoulées. Tes Échos ont bouclé ${fmtInt(r.loops)} fois.`),
      h('div', { class: 'stats' }, gains.length ? gains : h('p', { class: 'muted' }, 'Rien n\'a été produit : il te faut des Échos !')),
      r.died ? h('p', { class: 'accent' }, (() => { const a = this.s.succession?.ancestor; return a ? `🕯️ ${this.nm(a)} s'est ${acc(a, 'éteint', 'éteinte')} en ton absence. Une succession t'attend.` : '🕯️ Une vie s\'est achevée en ton absence. Une succession t\'attend.'; })()) : null,
      h('p', { class: 'muted small' }, 'Les événements ne comptent qu\'en ta présence. Reviens aux heures d\'événement !'),
      h('button', { class: 'btn btn-primary', onclick: () => m.close() }, 'Continuer')));
  }

  /**
   * Cérémonie de fondation en trois temps : le Sablier, la forge du blason, le premier (ou la première) du nom.
   * Écran plein, sans formulaire : on doit sentir qu'on fonde une dynastie.
   */
  openIntro(onDone: () => void) {
    const s = this.s;
    let crest = s.lineage.crest, color = s.lineage.color;
    const pickName = (not?: string) => { let n = HOUSE_NAMES[Math.floor(Math.random() * HOUSE_NAMES.length)]; while (n === not) n = HOUSE_NAMES[Math.floor(Math.random() * HOUSE_NAMES.length)]; return n; };
    let suggestion = pickName();
    const root = h('div', { class: 'intro-screen', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Fondation de la lignée' });
    const motes = h('div', { class: 'intro-motes', 'aria-hidden': 'true' },
      Array.from({ length: 18 }, (_, i) => h('span', { style: { left: `${(i * 37) % 100}%`, animationDelay: `${(i * 0.73) % 6}s`, animationDuration: `${7 + (i % 5)}s` } })));
    const stage = h('div', { class: 'intro-stage' });
    root.append(motes, stage);
    document.body.appendChild(root);
    requestAnimationFrame(() => root.classList.add('show'));

    const show = (el: HTMLElement) => { stage.replaceChildren(el); };

    // --- 1. Le Sablier ------------------------------------------------------
    const s1 = h('div', { class: 'intro-s1' },
      h('div', { class: 'intro-glass', 'aria-hidden': 'true' }, '⏳'),
      h('h1', { class: 'title intro-title' }, 'Échos de Lignée'),
      h('p', { class: 'intro-line' }, 'Le Sablier des Ancêtres a choisi ta famille.'),
      h('p', { class: 'intro-sub' }, 'Chaque vie ne dure qu\'un instant… mais aucune ne se perd.'),
      h('button', { class: 'btn btn-primary btn-lg intro-next', onclick: () => forge() }, 'Ouvrir le registre'));
    show(s1);

    // --- 2. La forge du blason ----------------------------------------------
    const forge = () => {
      const shield = this.shieldEl(crest, color, 'intro-shield');
      const banner = h('div', { class: 'intro-banner' });
      const input = h('input', { class: 'input intro-input', maxlength: 20, placeholder: suggestion, value: '', 'aria-label': 'Nom de ta maison' }) as HTMLInputElement;
      const houseName = () => input.value.trim().replace(/[<>]/g, '') || suggestion;
      const upd = () => {
        banner.textContent = `Maison ${houseName()}`;
        shield.style.setProperty('--c', color);
        shield.innerHTML = shieldSvg(crest, 'plein');
        shield.classList.remove('pop');
        void shield.offsetWidth;
        shield.classList.add('pop');
        crestRow.querySelectorAll('.pick').forEach((x) => x.classList.toggle('on', (x as HTMLElement).dataset.k === crest));
        colorRow.querySelectorAll('.pick').forEach((x) => x.classList.toggle('on', (x as HTMLElement).dataset.c === color));
      };
      input.addEventListener('input', () => { banner.textContent = `Maison ${houseName()}`; });
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') found(); });
      const dice = h('button', { class: 'btn intro-dice', 'aria-label': 'Nom au hasard', title: 'Nom au hasard', onclick: () => { suggestion = pickName(input.value.trim() || suggestion); input.value = ''; input.placeholder = suggestion; banner.textContent = `Maison ${suggestion}`; } }, '🎲');
      const crestRow = h('div', { class: 'pick-row intro-picks' }, CHARGE_IDS.map((c) => this.chargePick(c, () => { crest = c; upd(); })));
      const colorRow = h('div', { class: 'pick-row intro-picks' }, CREST_COLORS.map((c) => h('button', { class: 'pick pick-color', 'data-c': c, style: { background: c }, 'aria-label': 'Couleur', onclick: () => { color = c; upd(); } })));
      const found = () => {
        s.lineage = { ...s.lineage, name: houseName(), crest, color, partition: 'plein' };
        this.sigTop = '';
        firstOfName();
      };
      show(h('div', { class: 'intro-s2' },
        h('div', { class: 'intro-crestwrap' }, shield, banner),
        h('label', { class: 'label' }, 'Nom de ta maison'),
        h('div', { class: 'row intro-namerow' }, input, dice),
        h('label', { class: 'label' }, 'Emblème'), crestRow,
        h('label', { class: 'label' }, 'Couleur'), colorRow,
        h('button', { class: 'btn btn-primary btn-lg intro-next', onclick: found }, 'Fonder la lignée')));
      upd();
      if (window.matchMedia('(pointer: fine)').matches) setTimeout(() => input.focus(), 300);
    };

    // --- 3. Le premier (ou la première) du nom -------------------------------------------------
    const firstOfName = () => {
      const t = TRAIT[s.hero.traits[0]];
      const shield = this.shieldEl(s.lineage.crest, s.lineage.color, 'intro-shield intro-shield-sm', s.lineage.partition);
      const nameEl = h('h2', { class: 'intro-hero' });
      const lineEl = h('p', { class: 'intro-line' });
      const traitEl = t ? h('span') : null;
      // Maison Joestar : le fondateur est Jonathan (le dé reste libre de changer d'avis).
      if (isJoestar(s.lineage.name) && s.hero.gen === 1 && s.hero.name !== 'Jonathan') renameHead(s, 'Jonathan');
      const fill = () => {
        nameEl.textContent = this.nm(s.hero);
        lineEl.textContent = acc(s.hero, 'premier du nom', 'première du nom');
        if (t && traitEl) traitEl.textContent = `${t.icon} ${traitName(t, s.hero)}`;
      };
      fill();
      // Le Sablier a choisi… mais on peut lui demander un autre prénom.
      const dice = h('button', { class: 'btn intro-dice intro-hero-dice', 'aria-label': 'Autre prénom', title: 'Autre prénom', onclick: () => {
        let n = s.hero.name;
        while (n === s.hero.name) n = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
        renameHead(s, n);
        fill();
        nameEl.classList.remove('reroll');
        void nameEl.offsetWidth;
        nameEl.classList.add('reroll');
      } }, '🎲');
      show(h('div', { class: 'intro-s3' },
        h('div', { class: 'intro-sand', 'aria-hidden': 'true' }, Array.from({ length: 14 }, (_, i) => h('span', { style: { left: `${46 + ((i * 13) % 9)}%`, animationDelay: `${(i * 0.17).toFixed(2)}s` } }))),
        shield,
        h('p', { class: 'intro-sub' }, `La Maison ${s.lineage.name} est fondée.`),
        h('div', { class: 'row intro-heirow' }, nameEl, dice),
        lineEl,
        t ? h('div', { class: 'intro-trait', style: { '--c': RARITY[t.rarity].color } }, traitEl, h('span', { class: 'muted small' }, ` — ${t.desc}`)) : null,
        h('p', { class: 'muted small' }, 'Sa vie sera brève. Chacun de ses gestes deviendra un Écho.'),
        h('button', { class: 'btn btn-primary btn-lg intro-next', onclick: () => {
          root.classList.remove('show');
          setTimeout(() => root.remove(), 450);
          onDone();
        } }, 'Commencer sa vie')));
    };
  }

  /** Écu héraldique (SVG) teinté de la couleur de la maison, meuble d'or au centre. */
  shieldEl(crest: string, color: string, cls = '', partition = 'plein') {
    const el = h('div', { class: `shield ${cls}`, style: { '--c': color } });
    el.innerHTML = shieldSvg(crest, partition);
    return el;
  }

  /** Petit écu de la maison (barre du haut, avatar, Lignée). */
  crestEl(cls: string) {
    const l = this.s.lineage;
    const el = h('div', { class: `crest-svg ${cls}`, style: { '--c': l.color }, title: `${chargeName(l.crest)} — Maison ${l.name}` });
    el.innerHTML = shieldSvg(l.crest, l.partition ?? 'plein', { border: false });
    return el;
  }

  lineageSig() {
    const l = this.s.lineage;
    return [l.name, l.crest, l.color, l.partition].join('|');
  }

  /** Pastille de choix d'un meuble. */
  chargePick(c: string, onclick: () => void) {
    const el = h('button', { class: 'pick pick-charge', 'data-k': c, 'aria-label': `Emblème : ${chargeName(c)}`, title: chargeName(c), onclick });
    el.innerHTML = chargeSvg(c);
    return el;
  }

  openRename() {
    const s = this.s;
    const input = h('input', { class: 'input', maxlength: 20, value: s.lineage.name }) as HTMLInputElement;
    const m = modal(h('div', null, h('h2', null, 'Renommer la maison'), input,
      h('div', { class: 'row-end' }, h('button', { class: 'btn btn-primary', onclick: () => { const n = input.value.trim().replace(/[<>]/g, ''); if (n) { if (!isJoestar(s.lineage.name) && isJoestar(n)) toast('⭐ Une étoile apparaît sur l\'épaule des enfants à naître : le sang des Joestar coule dans ta lignée.', 'good', 6000); s.lineage.name = n; } m.close(); this.sigTop = ''; this.sigTab = ''; } }, 'Valider'))));
  }

  openCrest() {
    const s = this.s;
    let crest = s.lineage.crest, color = s.lineage.color, partition = s.lineage.partition ?? 'plein';
    const content = h('div', { class: 'crest-modal' });
    const m = modal(content);
    const render = () => {
      const free = !s.flags.crestChanged;
      const changedArms = crest !== s.lineage.crest || color !== s.lineage.color;
      const changed = changedArms || partition !== (s.lineage.partition ?? 'plein');
      const cost = changedArms && !free ? SHOP.crest.cost : 0;
      const preview = this.shieldEl(crest, color, 'crest-preview', partition);
      const crestRow = h('div', { class: 'pick-row' }, CHARGE_IDS.map((c) => {
        const b = this.chargePick(c, () => { crest = c; render(); });
        b.classList.toggle('on', c === crest);
        return b;
      }));
      const colorRow = h('div', { class: 'pick-row' }, CREST_COLORS.map((c) => h('button', {
        class: `pick pick-color ${c === color ? 'on' : ''}`, style: { background: c }, 'aria-label': 'Couleur', onclick: () => { color = c; render(); },
      })));
      const partRow = h('div', { class: 'pick-row' }, PARTITIONS.map((p) => {
        const owned = s.partitions.includes(p.id);
        const el = h('button', {
          class: `pick pick-part ${p.id === partition ? 'on' : ''} ${owned ? '' : 'locked'}`, style: { '--c': color }, title: owned ? p.name : `${p.name} — ${SHOP.partition.cost} ✦`,
          'aria-label': `Partition : ${p.name}`,
          onclick: async () => {
            if (owned) { partition = p.id; render(); return; }
            if (s.eclats < SHOP.partition.cost) { toast(`${p.name} : ${SHOP.partition.cost} ✦ nécessaires (tu en as ${fmt(s.eclats, 0)}).`, 'bad'); return; }
            if (await confirmBox(`Débloquer la partition « ${p.name} » pour ${SHOP.partition.cost} ✦ ?`, 'Débloquer')) {
              if (buyPartition(s, p.id)) { partition = p.id; this.sigTop = ''; this.sigTab = ''; this.sigLife = ''; toast(`🛡️ Partition « ${p.name} » débloquée`, 'good'); }
              render();
            }
          },
        });
        el.innerHTML = shieldSvg('', p.id, { border: false, charge: false }) + (owned ? '' : '<span class="pick-lock">🔒</span>');
        return el;
      }));
      const ok = h('button', { class: 'btn btn-primary', disabled: !changed || (cost > 0 && s.eclats < cost) || undefined, onclick: () => {
        if (changedArms) {
          if (!s.flags.crestChanged) s.flags.crestChanged = true;
          else if (s.eclats >= SHOP.crest.cost) s.eclats -= SHOP.crest.cost;
          else { toast('Éclats insuffisants', 'bad'); return; }
        }
        s.lineage.crest = crest;
        s.lineage.color = color;
        s.lineage.partition = partition;
        this.sigTop = '';
        this.sigTab = '';
        this.sigLife = '';
        m.close();
      } }, cost ? `Appliquer (${cost} ✦)` : 'Appliquer');
      content.replaceChildren(
        h('h2', null, '🛡️ Blason de la maison'),
        preview,
        h('p', { class: 'muted small center' }, `${chargeName(crest)} · ${PARTITIONS.find((p) => p.id === partition)?.name ?? ''}`),
        h('label', { class: 'label' }, 'Emblème'), crestRow,
        h('label', { class: 'label' }, 'Couleur'), colorRow,
        h('label', { class: 'label' }, `Partition (${SHOP.partition.cost} ✦ chacune, changement libre ensuite)`), partRow,
        h('p', { class: 'muted small' }, free ? 'Le premier changement d\'emblème ou de couleur est gratuit.' : `Changer d'emblème ou de couleur : ${SHOP.crest.cost} ✦ (tu en as ${fmt(s.eclats, 0)}).`),
        h('div', { class: 'row-end' }, h('button', { class: 'btn btn-ghost', onclick: () => m.close() }, 'Annuler'), ok));
    };
    render();
  }

  openSettings() {
    const s = this.s;
    const ta = h('textarea', { class: 'input mono', rows: 3, readonly: true }) as HTMLTextAreaElement;
    ta.value = exportSave(s);
    const imp = h('textarea', { class: 'input mono', rows: 3, placeholder: 'Colle ici une sauvegarde exportée…' }) as HTMLTextAreaElement;
    const mode = this.hooks.installMode();
    const installSection = h('div', null, h('h3', { class: 'section-t' }, 'Application'),
      mode === 'installed' ? h('p', { class: 'muted small' }, '✔ Le jeu est installé sur cet appareil.')
        : mode === 'prompt' ? h('button', { class: 'btn btn-sm', onclick: async () => { if (await this.hooks.installPrompt()) { s.flags.install_done = true; toast('📲 Échos de Lignée est installé !', 'good'); m.close(); } } }, '📲 Installer sur cet appareil')
          : mode === 'ios' ? h('p', { class: 'muted small' }, '📲 Dans Safari, touche Partager ⬆️ puis « Sur l\'écran d\'accueil » pour y jouer comme une application.')
            : h('p', { class: 'muted small' }, '📲 Astuce : ajoute le jeu à ton écran d\'accueil depuis le menu du navigateur pour y jouer comme une application.'));
    const m = modal(h('div', { class: 'settings' },
      h('h2', null, '⚙️ Paramètres'),
      h('div', { class: 'row-between' }, h('span', null, 'Notation des grands nombres'),
        h('button', { class: 'btn btn-sm', onclick: (e: Event) => { s.settings.notation = s.settings.notation === 'lettres' ? 'scientifique' : 'lettres'; setNotation(s.settings.notation); (e.target as HTMLElement).textContent = s.settings.notation === 'lettres' ? '1.5M' : '1.5e6'; } }, s.settings.notation === 'lettres' ? '1.5M' : '1.5e6')),
      h('div', { class: 'row-between' }, h('span', null, 'Réduire les animations'),
        h('button', { class: 'btn btn-sm', onclick: (e: Event) => { s.settings.reducedMotion = !s.settings.reducedMotion; document.body.classList.toggle('reduced-motion', s.settings.reducedMotion); (e.target as HTMLElement).textContent = s.settings.reducedMotion ? 'Oui' : 'Non'; } }, s.settings.reducedMotion ? 'Oui' : 'Non')),
      h('div', { class: 'row-between' }, h('span', null, 'Garder l\'écran allumé'),
        h('button', { class: 'btn btn-sm', onclick: (e: Event) => {
          const on = !s.settings.keepAwake;
          if (on && !this.hooks.keepAwake(true)) { toast('Ce navigateur ne permet pas d\'empêcher la mise en veille', 'bad'); return; }
          if (!on) this.hooks.keepAwake(false);
          s.settings.keepAwake = on;
          (e.target as HTMLElement).textContent = on ? 'Oui' : 'Non';
        } }, s.settings.keepAwake ? 'Oui' : 'Non')),
      h('p', { class: 'muted small' }, 'Empêche l\'écran de s\'éteindre tant que le jeu est affiché (consomme davantage de batterie).'),
      h('h3', { class: 'section-t' }, 'Sauvegarde'),
      h('p', { class: 'muted small' }, 'Sauvegarde automatique toutes les 10 s dans ce navigateur. Exporte-la pour la transférer (ex. ordinateur → téléphone).'),
      ta,
      h('div', { class: 'row-wrap' },
        h('button', { class: 'btn btn-sm', onclick: async () => toast((await copyText(ta.value)) ? 'Sauvegarde copiée' : 'Copie impossible', 'good') }, '📋 Copier'),
        h('button', { class: 'btn btn-sm', onclick: () => download(`echos-de-lignee-${utcDateStr(Date.now())}.txt`, ta.value, 'text/plain') }, '💾 Télécharger')),
      imp,
      h('div', { class: 'row-wrap' }, h('button', { class: 'btn btn-sm', onclick: async () => {
        const st = importSave(imp.value);
        if (!st) { toast('Sauvegarde invalide', 'bad'); return; }
        if (await confirmBox('Remplacer la partie actuelle par cette sauvegarde ?', 'Importer', true)) { m.close(); this.hooks.replaceState(st); }
      } }, '📥 Importer')),
      installSection,
      h('h3', { class: 'section-t' }, 'Statistiques'),
      h('div', { class: 'stats' },
        stat('Temps de jeu', fmtDur(s.stats.playTime)),
        stat('Vies vécues', fmtInt(s.stats.lives)),
        stat('Meilleure vie', `${fmt(s.stats.bestLife)} pts`),
        stat('Événements 🥇', fmtInt(s.stats.eventsDone))),
      h('h3', { class: 'section-t danger' }, 'Zone dangereuse'),
      h('button', { class: 'btn btn-danger btn-sm', onclick: async () => { if (await confirmBox('Effacer définitivement ta lignée et recommencer ?', 'Tout effacer', true)) { m.close(); this.hooks.reset(); } } }, '🗑️ Réinitialiser la partie'),
      h('p', { class: 'muted small center' }, `Échos de Lignée v${__APP_VERSION__} · `, h('a', { href: 'https://github.com/KrazyKays/krazyidle', target: '_blank', rel: 'noopener' }, 'Code source'))));
  }

  // --- Défi du jour ------------------------------------------------------------
  /** Record du jour sous les règles de la Commande (les records de l'ancien Destin à points sont ignorés). */
  dailyRec(date: string): DailyRecord | undefined {
    const r = this.s.daily[date];
    return r && r.v === 2 ? r : undefined;
  }

  /** Lignes de la commande, sous forme de pastilles « 🌾 60 ». */
  orderChips(order: DailyOrder) {
    return h('div', { class: 'row-wrap daily-order-chips' }, RES.filter((r) => order[r] > 0).map((r) =>
      h('span', { class: 'badge daily-order-chip', title: RES_INFO[r].name }, `${RES_INFO[r].icon} ${fmtInt(order[r])}`)));
  }

  openDaily() {
    const date = utcDateStr(Date.now());
    const setup = dailySetup(date);
    const content = h('div', { class: 'daily' });
    const b = this.dailyBinder;
    const intro = () => {
      b.reset();
      const tiers = dailyTiers(date);
      content.replaceChildren(
        h('div', { class: 'center' }, h('div', { class: 'big-i' }, '📜'), h('h2', null, `La Commande du comté : ${setup.name}`)),
        h('p', null, 'Le comté passe commande. Réunis tout en même temps, en stock, et la commande est livrée : plus tu la livres jeune, meilleure est ta médaille.'),
        this.orderChips(setup.order),
        h('p', { class: 'small' }, `🥉 livrée avant ${tiers[0]} ans · 🥈 avant ${tiers[1]} ans · 🥇 avant ${tiers[2]} ans`),
        h('p', { class: 'muted small' }, `Même destin, même monde, mêmes règles pour tous ; les compétences repartent de zéro. Ce que tu dépenses (Vivres vendus, Or étudié) ne compte plus pour la commande. Le chrono démarre à ta première activité. Ta lignée principale est mise en pause (tes Échos continuent).`),
        this.traitChips(setup.traits, false, setup),
        h('div', { class: 'row-wrap' }, setup.mods.map((m) => h('span', { class: 'badge' }, `${m.icon} ${m.name} — ${m.desc}`))),
        h('div', { class: 'row-end' }, h('button', { class: 'btn btn-primary btn-lg', onclick: start }, 'Commencer')));
    };
    const start = () => {
      this.daily = new DailyRun(setup);
      this.dailyAcc = 0;
      this.rt.pauseLife = true;
      const run = this.daily;
      const rec = this.dailyRec(date);
      const tiers = dailyTiers(date);
      b.reset();
      // Fantôme : la partie du record du jour, rejouée depuis son code (rien de plus n'est sauvegardé).
      const ghost = rec?.code ? traceFromCode(rec.code) : null;

      const tierText = b.text(h('div', { class: 'small daily-next' }), () => {
        const age = run.tickN / 10;
        const next = [2, 1, 0].find((i) => age < tiers[i]);
        const goal = next === undefined ? 'Plus de médaille possible : livre quand même pour ton record !' : `${MEDALS[next]} si livrée avant ${tiers[next]} ans (encore ${fmtInt(tiers[next] - age)} ans)`;
        return goal + (rec ? ` · Record : ${fmtDailyResult(rec.best)}` : '');
      });

      // Temps, ligne de vie et repères des médailles sur la barre du temps
      const timeFill = b.width(h('div', { class: 'bar-fill' }), () => run.tickN / run.totalTicks);
      b.cls(timeFill, 'late', () => run.tickN / run.totalTicks > 0.8);
      const timeBar = h('div', { class: 'bar daily-timebar' }, timeFill,
        ...[1, 2].map((i) => h('span', { class: 'daily-tier-mark', style: { left: (tiers[i] / DAILY_DUR * 100) + '%' }, title: `${MEDALS[i]} avant ${tiers[i]} ans` }, MEDALS[i])));
      const strip = h('div', { class: 'strip' });
      let lastLen = -1;
      b.add(() => {
        if (run.life.rec.length === lastLen) return;
        lastLen = run.life.rec.length;
        strip.style.background = stripGradient(run.life.rec, DAILY_DUR);
      });
      const idle = h('div', { class: 'daily-idle small' });
      b.text(idle, () => run.started
        ? '⏸️ Aucune activité : le temps passe sans rien produire ! Choisis une activité (touches 1 à 5).'
        : '⏳ Prends ton temps : le chrono démarre à ta première activité (touches 1 à 5), puis ne s\'arrête plus.');
      b.add(() => { idle.hidden = !!run.life.act || run.done; });

      // La commande : une ligne par ressource demandée, avec l'âge auquel le record l'avait remplie.
      const lines = h('div', { class: 'daily-order' }, RES.filter((r) => setup.order[r] > 0).map((r) => {
        const need = setup.order[r];
        const fill = b.width(h('div', { class: 'bar-fill', style: { background: RES_INFO[r].color } }), () => Math.min(1, run.res[r] / need));
        const row = h('div', { class: 'daily-line' },
          h('div', { class: 'row-between small' },
            h('span', null, `${RES_INFO[r].icon} ${RES_INFO[r].name}`),
            b.text(h('span', { class: 'daily-line-v' }), () => {
              const t = run.lineTick[r];
              return `${fmt(Math.min(run.res[r], 9999))} / ${fmtInt(need)}` + (run.res[r] >= need ? ' ✓' : t !== undefined ? ` (rempli à ${fmtAge(t)})` : '');
            })),
          h('div', { class: 'bar bar-thin' }, fill),
          ghost ? h('div', { class: 'muted small daily-line-ghost' }, ghost.lineTick[r] !== undefined ? `┄ record : rempli à ${fmtAge(ghost.lineTick[r]!)}` : '┄ record : jamais rempli') : null);
        b.cls(row, 'done', () => run.res[r] >= need);
        return row;
      }));

      // Stock de chaque ressource (même non demandée : Vivres et Or servent à la chaîne)
      const mini = (label: string, value: HTMLElement, sub: HTMLElement, title?: string) =>
        h('div', { class: 'stat stat-mini', title }, h('div', { class: 'stat-l' }, label), value, sub);
      const res = h('div', { class: 'stats stats-4' }, RES.map((r) => mini(`${RES_INFO[r].icon} ${RES_INFO[r].name}`,
        b.text(h('div', { class: 'stat-v' }), () => fmt(run.res[r])),
        h('div', { class: 'muted small' }, setup.order[r] > 0 ? `commande : ${fmtInt(setup.order[r])}` : 'hors commande'))));


      // Activités
      const acts = h('div', { class: 'acts acts-daily' }, ACTS.map((a, i) => {
        const def = ACT[a];
        const lvl = b.text(h('span', { class: 'lvl' }), () => `Niv. ${run.life.lvl[a]}`);
        const xp = b.width(h('div', { class: 'bar-fill', style: { background: def.color } }), () => run.life.xp[a] / xpToNext(run.life.lvl[a]));
        const rateEl = b.text(h('div', { class: 'act-rate' }), () => {
          const p = lifePower(run.life, run.hero, a);
          const m = run.ctx.prodMult(a) * p;
          const o: string[] = [];
          for (const r in def.produce) o.push(`+${fmt(def.produce[r as ResId]! * m)}${RES_INFO[r as ResId].icon}/s`);
          for (const r in def.consume) o.push(`−${fmt(def.consume[r as ResId]! * Math.sqrt(p))}${RES_INFO[r as ResId].icon}/s`);
          return o.join(' ');
        });
        const note = b.text(h('div', { class: 'act-note small' }), () => {
          const out: string[] = [];
          const lack = (Object.keys(def.consume) as ResId[]).filter((r) => run.res[r] < def.consume[r]! * Math.sqrt(lifePower(run.life, run.hero, a)) * 0.5);
          if (lack.length) out.push(`⚠️ Manque de ${lack.map((r) => RES_INFO[r].icon).join('')}`);
          const md = setup.mods.find((x) => x.act?.[a]);
          if (md) out.push(`${md.icon} ×${md.act![a]}`);
          return out.join(' · ');
        });
        b.cls(note, 'bad', () => note.textContent?.includes('⚠️') ?? false);
        const btn = h('button', { class: 'act', style: { '--c': def.color }, onclick: () => run.setAct(run.life.act === a ? null : a) },
          h('div', { class: 'act-i' }, def.icon, h('span', { class: 'act-key' }, String(i + 1))),
          h('div', { class: 'act-body' }, h('div', { class: 'act-head' }, h('span', { class: 'act-n' }, def.name), lvl), h('div', { class: 'bar bar-thin' }, xp), rateEl, note));
        b.cls(btn, 'active', () => run.life.act === a);
        return btn;
      }));

      content.replaceChildren(
        h('div', { class: 'row-between daily-head' }, h('h2', null, `📜 ${setup.name}`),
          h('div', { class: 'right' }, b.text(h('div', { class: 'score' }), () => `${Math.floor(run.progress() * 100)} %`), h('div', { class: 'muted small' }, 'de la commande'))),
        lines,
        tierText,
        h('div', { class: 'row-between small' }, b.text(h('span'), () => `Âge ${Math.floor(run.tickN / 10)} / ${DAILY_DUR} ans`), b.text(h('span', { class: 'muted' }), () => `${fmtDur(DAILY_DUR - run.tickN / 10)} restantes`)),
        timeBar,
        strip,
        idle,
        acts, res,
        h('div', { class: 'row-wrap daily-ctx' }, this.traitChips(setup.traits, true, setup), setup.mods.map((m) => h('span', { class: 'badge' }, `${m.icon} ${m.name} — ${m.desc}`)),
          run.xpMult !== 1 ? h('span', { class: 'badge' }, `⚡ Expérience ×${run.xpMult.toFixed(2)}`) : null),
        h('div', { class: 'row-end' }, h('button', { class: 'btn btn-ghost btn-sm', onclick: () => { this.endDaily(false); this.dailyModal?.close(); } }, 'Abandonner')));
    };
    const finish = () => {
      const run = this.daily!;
      const result = run.score();
      const code = encodeRun(date, run.actions, result);
      const s = this.s;
      const prev = this.dailyRec(date);
      const rec: DailyRecord = prev ?? { best: -1, code: '', rewarded: 0, v: 2 };
      const isBest = result > rec.best;
      if (isBest) { rec.best = result; rec.code = code; }
      const levels = 1 + medalsOf(date, rec.best);
      const gain = Math.max(0, levels - rec.rewarded);
      rec.rewarded = Math.max(rec.rewarded, levels);
      s.daily[date] = rec;
      s.eclats += gain;
      this.endDaily(true);
      this.hooks.save();
      b.reset();
      const n = medalsOf(date, result);
      const miss = run.missing();
      content.replaceChildren(
        h('div', { class: 'center' },
          h('div', { class: 'big-i' }, n ? MEDALS[n - 1] : '🎗️'),
          h('h2', null, run.delivered ? `Commande livrée à ${fmtAge(run.deliveredTick!)}` : `Commande remplie à ${Math.floor(run.progress() * 100)} %`),
          run.delivered ? null : h('p', { class: 'muted' }, `Il manquait ${RES.filter((r) => miss[r]).map((r) => `${fmt(Math.max(0.1, miss[r]!))} ${RES_INFO[r].icon}`).join(', ')}.`),
          h('p', { class: 'muted' }, isBest ? 'Nouveau record personnel du jour !' : `Ton record du jour reste : ${fmtDailyResult(rec.best)}.`),
          gain ? h('p', { class: 'accent' }, `+${gain} ✦ Éclats célestes`) : null),
        h('div', { class: 'timeline', style: { background: stripGradient(run.life.rec, run.life.rec.length || 1) } }),
        h('div', { class: 'row-wrap' },
          h('button', { class: 'btn btn-primary', onclick: () => this.shareDaily(date, result, code) }, '📤 Partager'),
          h('button', { class: 'btn', onclick: () => { intro(); } }, '🔁 Rejouer'),
          h('button', { class: 'btn btn-ghost', onclick: () => this.dailyModal?.close() }, 'Fermer')));
    };
    this.dailyFinish = finish;
    intro();
    this.dailyModal = modal(content, { wide: true, dismissable: true, onClose: () => { this.endDaily(false); this.dailyModal = null; this.sigTab = ''; } });
  }

  dailyFinish: (() => void) | null = null;

  /** Appelé par la boucle principale avec le temps réel écoulé. */
  dailyStep(dtSec: number) {
    const run = this.daily;
    if (!run || run.done) return;
    this.dailyAcc = run.advance(this.dailyAcc + dtSec);
    if (run.done) this.dailyFinish?.();
  }

  endDaily(_finished: boolean) {
    this.rt.pauseLife = false;
    this.daily = null;
  }

  async shareDaily(date: string, result: number, code: string) {
    const d = new Date(date + 'T12:00:00Z').toLocaleDateString('fr-FR');
    const n = medalsOf(date, result);
    const tr = traceFromCode(code);
    const strip = tr ? `\n${dailyStrip(tr.rec)}` : '';
    const text = `📜 Échos de Lignée — Commande du ${d}\n${n ? MEDALS[n - 1] : '🎗️'} ${fmtDailyResult(result)}${strip}\nFais mieux : ${GAME_URL}`;
    try {
      if (navigator.share) { await navigator.share({ text }); return; }
    } catch { /* annulé */ }
    toast((await copyText(text)) ? '📋 Résultat copié : colle-le où tu veux !' : 'Copie impossible', 'good');
  }
}

// ---------------------------------------------------------------------------
declare const __APP_VERSION__: string;

function stat(label: string, value: string | HTMLElement) {
  return h('div', { class: 'stat' }, h('div', { class: 'stat-l' }, label), h('div', { class: 'stat-v' }, value));
}

export { roman };

/** Dégradé CSS représentant une suite d'activités (1 entrée = 1 seconde). */
export function stripGradient(rec: number[], dur: number): string {
  const total = Math.max(1, dur);
  if (!rec.length) return 'var(--strip-empty)';
  const stops: string[] = [];
  let start = 0;
  for (let i = 1; i <= rec.length; i++) {
    if (i === rec.length || rec[i] !== rec[start]) {
      const c = rec[start] >= 0 ? ACT[ACTS[rec[start]]].color : 'var(--strip-idle)';
      stops.push(`${c} ${((start / total) * 100).toFixed(2)}% ${((i / total) * 100).toFixed(2)}%`);
      start = i;
    }
  }
  if (rec.length < total) stops.push(`var(--strip-empty) ${((rec.length / total) * 100).toFixed(2)}% 100%`);
  return `linear-gradient(90deg, ${stops.join(', ')})`;
}

/** Âge d'un tic du Destin, au dixième d'année (« 58,3 ans »). */
function fmtAge(tick: number): string {
  return `${(tick / 10).toFixed(1).replace('.', ',')} ans`;
}
/** Résultat du Destin en clair : « livrée à 58,3 ans » ou « remplie à 83 % ». */
function fmtDailyResult(result: number): string {
  const age = resultAge(result);
  return age !== null ? `livrée à ${fmtAge(age * 10)}` : `remplie à ${Math.max(0, Math.floor(result / 10))} %`;
}

/** Ce qu'il faut accomplir pour qu'un don mûrisse (fiche du trait). */
function evolutionHint(id: string): string {
  return evolutionsOf(id).map((e) => ` Peut mûrir en ${TRAIT[e.to].icon} ${traitName(TRAIT[e.to])} chez ses enfants : ${e.cond.charAt(0).toLowerCase()}${e.cond.slice(1)}.`).join('');
}

