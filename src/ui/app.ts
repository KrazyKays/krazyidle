import {
  ACT, ACTS, ACT_UNLOCK, BUILDINGS, CREST_COLORS, FIRST_NAMES, HOUSE_NAMES, acc, sexFor, traitName, vocationName, type Named, LEGACY, RARITY, RES, RES_INFO, TRAIT, TRAITS,
  legacyCost, xpToNext, type ActId, type ResId,
} from '../engine/data';
import { DAILY_DUR, DAILY_TIERS, DailyRun, dailySetup, encodeRun, verifyCode } from '../engine/daily';
import { ECO_EQ, TROPHY_OR, ecoFactor, ecoHealth, gameVigor, harmonyMult, trophyFactor } from '../engine/ecosystem';
import { buildIcs, upcomingEvents, utcDateStr } from '../engine/events';
import {
  BLESSING_COST, EVENT_REWARDS, EVENT_TIERS, SHOP, buildingCost, buyBlessing, buyBuilding, buyLegacy, buyPartition, buyTemps, canAfford, ecoRegenRate,
  VOCATION_SHARE, confirmSuccession, echoPower, echoPowerMult, echoSlots, isPaused, lifeDuration, prodMult, resumeLife, setActivity, vocationOutlook,
  type OfflineReport, type Runtime,
} from '../engine/game';
import { exportSave, importSave } from '../engine/save';
import { heroActMult, lifePower } from '../engine/sim';
import type { Echo, GameState, Hero } from '../engine/state';
import { Binder, confirmBox, copyText, download, h, modal, toast, type ModalHandle } from './dom';
import { fmt, fmtClock, fmtDay, fmtDur, fmtInt, setNotation } from './fmt';
import { CHARGE_IDS, PARTITIONS, chargeName, chargeSvg, shieldSvg } from './heraldry';

type Tab = 'vie' | 'echos' | 'domaine' | 'lignee' | 'destin';
/** mobile : un onglet à la fois · two : héros + onglet · three : héros + Échos + onglet */
type Layout = 'mobile' | 'two' | 'three';
const ANCESTORS_SHOWN = 5;
const TABS: { id: Tab; icon: string; name: string }[] = [
  { id: 'vie', icon: '⏳', name: 'Vie' },
  { id: 'echos', icon: '🌀', name: 'Échos' },
  { id: 'domaine', icon: '🌳', name: 'Domaine' },
  { id: 'lignee', icon: '👑', name: 'Lignée' },
  { id: 'destin', icon: '🌠', name: 'Destin' },
];

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
}

export class App {
  s: GameState;
  rt: Runtime;
  hooks: AppHooks;
  tab: Tab = 'vie';
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
  ecoHist: { F: number; G: number; P: number }[] = [];
  lastHist = 0;
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
    root.append(this.elTop, this.elMain, this.elNav);
    const mq2 = window.matchMedia('(min-width: 900px)');
    const mq3 = window.matchMedia('(min-width: 1280px)');
    const apply = () => {
      this.layout = mq3.matches ? 'three' : mq2.matches ? 'two' : 'mobile';
      this.desktop = this.layout !== 'mobile';
      this.tab = this.normTab(this.tab);
      if (this.desktop) this.elTabCol.prepend(this.elNav); else root.append(this.elNav);
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

  /** Onglets proposés : sur ordinateur la Vie est toujours visible, et les Échos aussi en 3 colonnes. */
  tabsShown(): typeof TABS {
    return TABS.filter((t) => !(this.desktop && t.id === 'vie') && !(this.layout === 'three' && t.id === 'echos'));
  }

  normTab(t: Tab): Tab {
    return this.tabsShown().some((x) => x.id === t) ? t : this.layout === 'three' ? 'domaine' : this.desktop ? 'echos' : t;
  }

  setTab(t: Tab) {
    this.tab = this.normTab(t);
    this.renderNav();
    this.applyTabVisibility();
    this.sigTab = '';
    if (this.desktop) this.elTab.scrollTop = 0; else window.scrollTo({ top: 0 });
  }

  applyTabVisibility() {
    const showLife = this.desktop || this.tab === 'vie';
    const showTab = this.desktop || this.tab !== 'vie';
    this.elLife.hidden = !showLife;
    this.elTab.hidden = !showTab;
    this.elEcho.hidden = this.layout !== 'three';
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
    if (pending && !this.hadSuccession) toast(`🕯️ ${this.s.succession!.ancestor.name} s'est ${acc(this.s.succession!.ancestor, 'éteint', 'éteinte')}. Une succession t'attend.`, 'info', 5000);
    this.hadSuccession = pending;
    if (now - this.lastHist > 2000) {
      this.lastHist = now;
      this.ecoHist.push({ ...this.s.eco });
      if (this.ecoHist.length > 150) this.ecoHist.shift();
    }
    const st = this.sigTopNow();
    if (st !== this.sigTop) { this.sigTop = st; this.renderTop(); }
    const sl = this.sigLifeNow();
    if (sl !== this.sigLife && !this.elLife.hidden) { this.sigLife = sl; this.renderLife(); }
    const tt = this.sigTabNow();
    if (tt !== this.sigTab && !this.elTab.hidden) { this.sigTab = tt; this.renderTabPanel(); }
    this.bTop.run();
    this.bNav.run();
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
    const brand = h('button', { class: 'brand', onclick: () => this.setTab('lignee'), 'aria-label': 'Lignée' }, crest, h('div', null, h('div', { class: 'brand-name' }, `Maison ${s.lineage.name}`), h('div', { class: 'brand-sub' }, genEl)));
    const chips = RES.filter((r) => s.totalEver[r] > 0 || r === 'vivres').map((r) => {
      const v = b.text(h('span', { class: 'chip-v' }), () => fmt(s.res[r]));
      const rate = b.text(h('span', { class: 'chip-r' }), () => { const n = this.rt.net[r]; return Math.abs(n) < 0.005 ? '' : (n > 0 ? '+' : '') + fmt(n) + '/s'; });
      b.cls(rate, 'neg', () => this.rt.net[r] < -0.005);
      return h('div', { class: 'chip', title: RES_INFO[r].name, style: { '--c': RES_INFO[r].color } }, h('span', { class: 'chip-i' }, RES_INFO[r].icon), h('div', { class: 'chip-txt' }, v, rate));
    });
    const legacy = h('button', { class: 'chip chip-meta', title: 'Héritage', onclick: () => this.setTab('lignee') }, h('span', { class: 'chip-i' }, '⚜️'), b.text(h('span', { class: 'chip-v' }), () => fmt(s.legacy, 0)));
    const eclats = h('button', { class: 'chip chip-meta', title: 'Éclats célestes', onclick: () => this.setTab('destin') }, h('span', { class: 'chip-i' }, '✦'), b.text(h('span', { class: 'chip-v' }), () => fmt(s.eclats, 0)));
    const evPill = h('button', { class: 'event-pill', onclick: () => this.setTab('destin') });
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
    );
  }

  renderNav() {
    const b = this.bNav;
    b.reset();
    const tabs = this.tabsShown();
    this.elNav.replaceChildren(
      ...tabs.map((t) => {
        const dot = h('span', { class: 'dot' });
        b.cls(dot, 'on', () => this.badge(t.id));
        return h('button', { class: `tab ${this.tab === t.id ? 'active' : ''}`, onclick: () => this.setTab(t.id), 'aria-current': this.tab === t.id ? 'page' : undefined },
          h('span', { class: 'tab-i' }, t.icon, dot), h('span', { class: 'tab-n' }, t.name));
      }),
    );
    this.elNav.classList.toggle('tabbar-desktop', this.desktop);
  }

  badge(t: Tab): boolean {
    const s = this.s;
    switch (t) {
      case 'vie': return isPaused(s) || !!s.succession;
      case 'echos': return false;
      case 'domaine': return BUILDINGS.some((b) => this.buildingVisible(b.id) && !(b.max !== undefined && (s.buildings[b.id] ?? 0) >= b.max) && canAfford(s, buildingCost(b.id, s.buildings[b.id] ?? 0)));
      case 'lignee': return LEGACY.some((l) => !(l.max !== undefined && (s.upgrades[l.id] ?? 0) >= l.max) && s.legacy >= legacyCost(l, s.upgrades[l.id] ?? 0));
      case 'destin': {
        const ev = this.rt.event;
        const evOpen = !!ev && (s.events[ev.key]?.tier ?? 0) < 3;
        return evOpen || !s.daily[utcDateStr(Date.now())];
      }
    }
  }

  // =========================================================================
  // Panneau Vie
  sigLifeNow() {
    const s = this.s;
    return [!!s.life, isPaused(s), s.hero.id, s.unlocked.join(), !!s.succession, s.life?.extended, s.life?.dur, this.hint()?.id, s.eclats >= SHOP.temps.cost, s.blessings.length, this.installOffer(), s.ancestors.length > 0].join('|');
  }

  hint(): { id: string; text: string } | null {
    const s = this.s, f = s.flags, hero = s.hero, n = hero.name;
    const il = acc(hero, 'il', 'elle');
    const last = s.ancestors[s.ancestors.length - 1];
    const list: [string, boolean, string][] = [
      ['start', s.hero.gen === 1 && !!s.life, `Bienvenue dans la Maison ${s.lineage.name} ! ${n} cultive déjà ses terres. Change d'activité quand tu veux, ou reclique dessus pour mettre sa vie en pause : son temps ne s'écoule que lorsqu'${il} agit.`],
      ['pause', s.hero.gen <= 3 && isPaused(s), `Vie en pause : ${n} attend, mais tes Échos continuent de produire et le Domaine se repose. Prends le temps de bâtir !`],
      ['echo', s.hero.gen === 1 && !!s.life && s.life.t > 15, 'Chaque seconde de cette vie est enregistrée. À sa mort, elle deviendra un Écho qui rejouera tes choix en boucle, pour toujours.'],
      ['echo2', s.hero.gen === 2 && s.echoes.length > 0, last ? `${last.name} est ${acc(last, 'devenu', 'devenue')} un Écho : ${acc(last, 'il', 'elle')} rejoue sa vie et produit pour toi (onglet Échos). Chaque génération ajoute une boucle !` : ''],
      ['build', s.res.vivres >= 25 && Object.keys(s.buildings).length === 0, 'Tu as assez de Vivres pour bâtir des Champs dans le Domaine : ils boostent la vie en cours ET les Échos.'],
      ['legacy', s.legacy >= 3 && Object.keys(s.upgrades).length === 0, 'Tu as de l\'Héritage ⚜️ ! Dépense-le dans l\'onglet Lignée pour des bonus permanents.'],
      ['voc', s.hero.gen >= 2 && s.hero.gen <= 4 && !!s.hero.vocation, `${n} a hérité d'une Vocation : consacre au moins la moitié de sa vie à la même activité pour la faire monter de rang. La jauge sous le sablier te dit où tu en es.`],
      ['eco', ecoHealth(s.eco) < 0.55 && s.hero.gen >= 2, 'L\'écosystème se dérègle ! L\'Harmonie baisse ta production. Méditer, cultiver ou réduire la chasse le rétablit.'],
      ['destin', s.hero.gen >= 3 && !s.daily[utcDateStr(Date.now())], 'Le Destin du jour t\'attend : la même vie pour tous les joueurs, compare ton score !'],
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
    if (notice && !this.desktop) parts.push(notice);
    parts.push(this.heroCard(s.hero, true));

    if (!s.life) {
      parts.push(h('div', { class: 'card death-card' },
        h('div', { class: 'big-i' }, '🕯️'),
        h('h3', null, `La vie de ${s.hero.name} s'achève.`),
        h('p', { class: 'muted' }, 'Son histoire va rejoindre les Échos. Rien ne presse : tes Échos continuent de boucler. Choisis qui reprendra le flambeau quand tu le souhaites.'),
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
      : h('button', { class: 'btn btn-sm btn-ghost', onclick: () => setActivity(s, null) }, `⏸️ Pause${this.desktop ? ' (Espace)' : ''}`);
    parts.push(h('div', { class: `card timer ${paused ? 'paused' : ''}` },
      paused ? h('div', { class: 'pause-banner' }, h('strong', null, '⏸️ Vie en pause'), h('span', { class: 'muted small' }, ' · le sablier est figé, tes Échos continuent · 🌿 le Domaine se repose')) : null,
      h('div', { class: 'row-between' },
        h('div', null, h('div', { class: 'label' }, 'Âge'), b.text(h('div', { class: 'timer-v' }), () => `${Math.floor(life.t)} / ${Math.round(life.dur)} ans`)),
        h('div', { class: 'right' }, h('div', { class: 'label' }, 'Temps restant'), b.text(h('div', { class: 'timer-v' }), () => fmtDur(life.dur - life.t)))),
      h('div', { class: 'bar' }, bar),
      this.recStrip(b),
      s.ancestors.length > 0 ? this.vocationGauge(b) : null,
      h('div', { class: 'row-end' }, tempsBtn, pauseBtn),
    ));

    // Activités
    const grid = h('div', { class: 'acts' });
    ACTS.forEach((a, i) => grid.appendChild(this.actCard(a, i, b)));
    parts.push(h('h3', { class: 'section-t' }, 'Activités', h('span', { class: 'muted small' }, this.desktop ? ' — touches 1 à 5' : '')), grid);
    if (notice && this.desktop) parts.push(notice);
    this.elLife.replaceChildren(...parts);
  }

  heroCard(hero: Hero, current: boolean) {
    const s = this.s;
    const voc = hero.vocation ? h('span', { class: 'badge badge-voc', style: { '--c': ACT[hero.vocation.act].color } }, `${ACT[hero.vocation.act].icon} ${vocationName(hero.vocation, hero, roman)}`) : null;
    return h('div', { class: 'card hero-card' },
      h('div', { class: 'avatar' }, this.crestEl('avatar-shield'), h('span', { class: 'avatar-gen' }, roman(hero.gen))),
      h('div', { class: 'hero-info' },
        h('div', { class: 'hero-name' }, hero.name, ' ', h('span', { class: 'muted' }, s.lineage.name)),
        h('div', { class: 'hero-sub' }, current ? `Génération ${hero.gen} · vit ${Math.round(s.life?.dur ?? lifeDuration(s, hero))} s` : `Génération ${hero.gen}`, voc ? ' · ' : '', voc),
        this.traitChips(hero.traits, false, hero)));
  }

  /** Pastilles de traits, accordées au personnage qui les porte (sans personnage : les deux formes). */
  traitChips(ids: string[], small = false, who: Named | null = null) {
    return h('div', { class: `traits ${small ? 'traits-sm' : ''}` }, ids.map((id) => {
      const t = TRAIT[id];
      if (!t) return null;
      const name = traitName(t, who);
      return h('button', {
        class: `trait ${t.neg ? 'neg' : ''}`, style: { '--c': RARITY[t.rarity].color }, title: `${name} — ${t.desc}`,
        onclick: (e: Event) => { e.stopPropagation(); toast(`${t.icon} ${name} (${RARITY[t.rarity].name}) : ${t.desc}`, t.neg ? 'bad' : 'info'); },
      }, t.icon, small ? null : h('span', null, name));
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
    const m = prodMult(s, this.rt, a) * ecoFactor(a, s.eco) * p;
    const out: string[] = [];
    for (const r in def.produce) out.push(`+${fmt(def.produce[r as ResId]! * m)} ${RES_INFO[r as ResId].icon}/s`);
    const tro = a === 'chasser' ? TROPHY_OR * trophyFactor(s.eco) * prodMult(s, this.rt, a) * p : 0;
    if (tro > 0.005) out.push(`+${fmt(tro)} ${RES_INFO.or.icon}/s`);
    for (const r in def.consume) out.push(`−${fmt(def.consume[r as ResId]! * Math.sqrt(p))} ${RES_INFO[r as ResId].icon}/s`);
    return out.join('  ');
  }

  // =========================================================================
  // Panneaux d'onglet
  sigTabNow(): string {
    const s = this.s;
    switch (this.tab) {
      case 'vie':
      case 'echos': return 'E' + s.echoes.map((e) => e.id + (e.pinned ? 'p' : '')).join() + '|' + echoSlots(s);
      case 'domaine': return 'D' + BUILDINGS.filter((x) => this.buildingVisible(x.id)).map((x) => x.id + (s.buildings[x.id] ?? 0)).join();
      case 'lignee': return 'L' + JSON.stringify(s.upgrades) + s.ancestors.length + this.lineageSig();
      case 'destin': {
        const ev = this.rt.event;
        return 'X' + (ev?.key ?? '') + (ev ? s.events[ev.key]?.tier : '') + JSON.stringify(s.daily[utcDateStr(Date.now())] ?? null) + s.blessings.join() + s.partitions.join() + this.lineageSig() + Math.floor(Date.now() / 60000);
      }
    }
  }

  sigEchoNow(): string {
    const s = this.s;
    return 'E' + s.echoes.map((e) => e.id + (e.pinned ? 'p' : '')).join() + '|' + echoSlots(s);
  }

  renderTabPanel() {
    this.bTab.reset();
    const t = this.normTab(this.tab);
    let el: HTMLElement;
    switch (t) {
      case 'echos': el = this.panelEchoes(this.bTab); break;
      case 'domaine': el = this.panelDomaine(); break;
      case 'lignee': el = this.panelLignee(); break;
      case 'destin': el = this.panelDestin(); break;
      default: el = h('div');
    }
    this.elTab.replaceChildren(el);
  }

  // --- Échos ----------------------------------------------------------------
  panelEchoes(b: Binder) {
    const s = this.s;
    const head = h('div', { class: 'card panel-head' },
      h('h2', null, '🌀 Échos ancestraux'),
      h('p', { class: 'muted' }, 'Chaque ancêtre rejoue sa vie en boucle. Leur production profite de tous tes bonus actuels.'),
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
      h('span', { class: 'echo-name' }, `${e.name} `, h('span', { class: 'muted' }, `· Gén. ${e.gen}`)),
      b.text(h('span', { class: 'loops' }), () => `↻ ${e.loops}`));
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
      h('div', { class: 'row-wrap' }, voc, this.traitChips(e.traits, true, e)),
      timeline,
      h('div', { class: 'row-between small' },
        doing,
        h('span', { class: 'muted' }, `Puissance ×${echoPower(s, this.rt, e).toFixed(2)} · ${e.acts.length} s`),
        h('span', { class: 'row' },
          h('button', { class: 'icon-btn sm', title: e.pinned ? 'Désépingler' : 'Épingler (protégé lors des successions)', onclick: () => { e.pinned = !e.pinned; refresh(); } }, e.pinned ? '📌' : '📍'),
          h('button', { class: 'icon-btn sm', title: 'Libérer cet Écho', onclick: async () => { if (await confirmBox(`Libérer l'Écho de ${e.name} ? Il disparaîtra définitivement.`, 'Libérer', true)) { s.echoes = s.echoes.filter((x) => x !== e); refresh(); } } }, '🗑️'))));
  }

  // --- Domaine --------------------------------------------------------------
  buildingVisible(id: string) {
    const d = BUILDINGS.find((x) => x.id === id)!;
    return Object.keys(d.cost).every((r) => this.s.totalEver[r as ResId] > 0) || (this.s.buildings[id] ?? 0) > 0;
  }

  panelDomaine() {
    const s = this.s, b = this.bTab;
    const pops: [keyof typeof ECO_EQ, string, string, string][] = [
      ['F', 'Flore', '🌳', '#7cb342'], ['G', 'Gibier', '🦌', '#ff8a65'], ['P', 'Prédateurs', '🐺', '#90a4ae'],
    ];
    const bars = pops.map(([k, name, icon, color]) => {
      const fill = b.width(h('div', { class: 'bar-fill', style: { background: color } }), () => s.eco[k] / 140);
      return h('div', { class: 'eco-row' },
        h('span', { class: 'eco-n' }, `${icon} ${name}`),
        h('div', { class: 'bar eco-bar' }, fill, h('div', { class: 'eq-mark', style: { left: ((ECO_EQ[k] / 140) * 100).toFixed(1) + '%' }, title: 'Équilibre' })),
        b.text(h('span', { class: 'eco-v' }), () => fmt(s.eco[k])));
    });
    const canvas = h('canvas', { class: 'spark', width: 600, height: 120 }) as HTMLCanvasElement;
    let lastDraw = 0;
    b.add(() => {
      if (Date.now() - lastDraw < 1000) return;
      lastDraw = Date.now();
      drawSpark(canvas, this.ecoHist, pops.map((p) => [p[0], p[3]]));
    });
    const health = b.text(h('span'), () => `${Math.round(ecoHealth(s.eco) * 100)}%`);
    const harm = b.text(h('span'), () => `×${harmonyMult(s.eco).toFixed(2)}`);
    const vigor = b.text(h('span'), () => `×${gameVigor(s.eco).toFixed(2)}`);
    // Trophées exprimés en part du butin de chasse (Or valorisé ×2 face aux Vivres).
    const trophy = b.text(h('span'), () => {
      const pct = Math.round((TROPHY_OR * trophyFactor(s.eco) * RES_INFO.or.value) / (ACT.chasser.produce.vivres! * RES_INFO.vivres.value) * 100);
      return pct >= 1 ? `+${pct} % du butin en 🪙` : 'aucun';
    });
    const regen = ecoRegenRate(s);
    const harmCard = h('div', { class: 'card' },
      h('h2', null, '🌳 Écosystème du Domaine'),
      h('p', { class: 'muted' }, 'L\'optimum n\'est pas le maximum : la production dépend de l\'équilibre. Chasser prélève le Gibier, cultiver nourrit la Flore, commercer défriche, méditer apaise. Plus tes vivants et tes Échos sont puissants, plus ils pèsent sur le Domaine.'),
      h('div', { class: 'stats' }, stat('Santé', health), stat('Harmonie (toute production)', harm)),
      bars,
      h('div', { class: 'stats' },
        stat('Vigueur du Gibier', vigor),
        stat('Trophées', trophy),
        regen > 0 ? stat('Régénération', `${(regen * 100).toFixed(1).replace('.', ',')} %/s`) : null),
      h('p', { class: 'muted small' }, '🐺 Les Prédateurs gardent les hardes saines : sans eux, la chasse rapporte moins. S\'ils pullulent, chasser rapporte aussi des trophées en Or.'),
      canvas);
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
    return h('div', null, harmCard, h('h3', { class: 'section-t' }, 'Bâtiments'), builds.children.length ? builds : h('p', { class: 'muted card' }, 'Récolte des ressources pour découvrir les bâtiments.'));
  }

  // --- Lignée -----------------------------------------------------------------
  panelLignee() {
    const s = this.s, b = this.bTab;
    const head = h('div', { class: 'card panel-head' },
      h('div', { class: 'row' }, this.crestEl('crest crest-lg'),
        h('div', null, h('h2', null, `Maison ${s.lineage.name}`), h('div', { class: 'muted' }, `${s.ancestors.length} ancêtres · ${fmtInt(s.legacyTotal)} ⚜️ accumulés`))),
      h('div', { class: 'row-wrap' },
        h('button', { class: 'btn btn-sm', onclick: () => this.openRename() }, '✏️ Renommer'),
        h('button', { class: 'btn btn-sm', onclick: () => this.openCrest() }, '🛡️ Blason')),
      h('div', { class: 'stats' }, stat('Héritage disponible', b.text(h('span', { class: 'accent' }), () => `${fmt(s.legacy, 0)} ⚜️`))),
      h('p', { class: 'muted small' }, 'L\'Héritage est gagné à chaque mort selon la valeur produite par chaque vie. Il améliore définitivement ta lignée.'));
    const ups = h('div', { class: 'grid-cards' }, LEGACY.map((d) => {
      const lvl = s.upgrades[d.id] ?? 0;
      const maxed = d.max !== undefined && lvl >= d.max;
      const c = legacyCost(d, lvl);
      const btn = h('button', { class: 'btn btn-primary btn-sm', disabled: maxed || undefined, onclick: () => { if (buyLegacy(s, d.id)) { this.sigTab = ''; toast(`${d.icon} ${d.name} niv. ${lvl + 1}`, 'good'); } } }, maxed ? 'Max' : `${fmt(c, 0)} ⚜️`);
      if (!maxed) b.add(() => { (btn as HTMLButtonElement).disabled = s.legacy < c; });
      return h('div', { class: 'card build' },
        h('div', { class: 'build-head' }, h('span', { class: 'build-i' }, d.icon), h('div', null, h('div', { class: 'build-n' }, d.name, ' ', h('span', { class: 'lvl' }, `niv. ${lvl}${d.max ? '/' + d.max : ''}`)), h('div', { class: 'muted small' }, d.desc))),
        h('div', { class: 'row-end' }, btn));
    }));
    const anc = [...s.ancestors].reverse();
    const tree = this.ancestorTree(anc.slice(0, ANCESTORS_SHOWN));
    const more = anc.length > ANCESTORS_SHOWN
      ? h('button', { class: 'btn btn-sm btn-ghost tree-more', onclick: () => this.openGenealogy() }, `📜 Voir toute la généalogie (${anc.length} ancêtres)`)
      : null;
    return h('div', null, head, h('h3', { class: 'section-t' }, 'Arbre de Lignée'), ups,
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
        h('div', { class: 'row-between' }, h('strong', null, a.name), h('span', { class: 'muted small' }, `+${a.legacy} ⚜️ · ${fmt(a.value)} pts`)),
        h('div', { class: 'row-wrap small' },
          a.vocation ? h('span', { class: 'badge badge-voc', style: { '--c': ACT[a.vocation.act].color } }, `${ACT[a.vocation.act].icon} ${vocationName(a.vocation, a, roman)}`) : h('span', { class: 'muted' }, a.dominant ? `${ACT[a.dominant].icon} touche-à-tout` : '—'),
          this.traitChips(a.traits, true, a))))));
  }

  // --- Destin (événements, défi du jour, bazar) -----------------------------
  panelDestin() {
    const s = this.s, b = this.bTab;
    const now = Date.now();
    const parts: HTMLElement[] = [];
    const ev = this.rt.event;
    if (ev) {
      const ep = s.events[ev.key];
      const fill = b.width(h('div', { class: 'bar-fill', style: { background: ev.def.color } }), () => (ep ? ep.progress / (ep.target * EVENT_TIERS[2]) : 0));
      const marks = EVENT_TIERS.map((t, i) => h('div', { class: 'tier-mark', style: { left: (t / EVENT_TIERS[2] * 100) + '%' } }, h('span', null, ['🥉', '🥈', '🥇'][i])));
      parts.push(h('div', { class: 'card event-card', style: { '--c': ev.def.color } },
        h('div', { class: 'label' }, 'Événement en cours'),
        h('h2', null, `${ev.def.icon} ${ev.def.name}`),
        h('p', null, ev.def.desc),
        b.text(h('p', { class: 'muted' }), () => `Se termine dans ${fmtDur((ev.end - Date.now()) / 1000)} · Objectif : produire ${RES_INFO[ev.def.goal].icon} ${RES_INFO[ev.def.goal].name}`),
        h('div', { class: 'bar bar-tiers' }, fill, marks),
        b.text(h('p', { class: 'small' }), () => ep ? `${fmt(ep.progress)} / ${fmt(ep.target * EVENT_TIERS[Math.min(2, ep.tier)])} ${RES_INFO[ev.def.goal].icon} · Récompenses : ${EVENT_REWARDS.join(' / ')} ✦` : '')));
    }
    const ups = upcomingEvents(now, 7).filter((w) => w.key !== ev?.key).slice(0, 6);
    parts.push(h('div', { class: 'card' },
      h('h2', null, '📅 Calendrier des événements'),
      h('p', { class: 'muted small' }, 'Toutes les 4 heures, un événement de 45 min frappe le monde entier au même moment. Sois présent pour décrocher des Éclats célestes ✦.'),
      h('ul', { class: 'ev-list' }, ups.map((w) => h('li', null,
        h('span', { class: 'ev-i', style: { '--c': w.def.color } }, w.def.icon),
        h('div', null, h('strong', null, w.def.name), h('div', { class: 'muted small' }, w.def.desc)),
        h('div', { class: 'right small' }, h('div', null, `${fmtDay(w.start)} ${fmtClock(w.start)}`), h('div', { class: 'muted' }, `dans ${fmtDur((w.start - now) / 1000)}`))))),
      h('button', { class: 'btn btn-sm', onclick: () => { download('echos-de-lignee-evenements.ics', buildIcs(), 'text/calendar'); toast('📅 Calendrier téléchargé : ouvre-le pour l\'ajouter à ton agenda.', 'good'); } }, '📅 Ajouter à mon agenda')));

    // Défi du jour
    const date = utcDateStr(now);
    const setup = dailySetup(date);
    const rec = s.daily[date];
    const nextDay = Date.UTC(new Date(now).getUTCFullYear(), new Date(now).getUTCMonth(), new Date(now).getUTCDate() + 1);
    parts.push(h('div', { class: 'card daily-card' },
      h('div', { class: 'label' }, `Destin du jour · ${new Date(now).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`),
      h('h2', null, `🎲 La vie de ${setup.name}`),
      h('p', { class: 'muted small' }, `Une vie de ${DAILY_DUR} s, identique pour tous les joueurs. Maximise la valeur finale (🌾×1, 🪙×2, 📜×8, ✨×20) et partage ton score vérifiable.`),
      this.traitChips(setup.traits, false, setup),
      h('div', { class: 'row-wrap' }, setup.mods.map((m) => h('span', { class: 'badge' }, `${m.icon} ${m.name} — ${m.desc}`))),
      h('div', { class: 'stats' },
        stat('Meilleur score', rec ? fmtInt(rec.best) : '—'),
        stat('Paliers', `🥉 ${DAILY_TIERS[0]} · 🥈 ${DAILY_TIERS[1]} · 🥇 ${DAILY_TIERS[2]}`),
        stat('Nouveau destin', b.text(h('span'), () => fmtDur((nextDay - Date.now()) / 1000)))),
      h('div', { class: 'row-wrap' },
        h('button', { class: 'btn btn-primary', onclick: () => this.openDaily() }, rec ? '🔁 Rejouer' : '▶️ Jouer'),
        rec ? h('button', { class: 'btn', onclick: () => this.shareDaily(date, rec.best, rec.code) }, '📤 Partager') : null,
        h('button', { class: 'btn btn-ghost', onclick: () => this.openVerify() }, '🔎 Vérifier un code'))));

    // Bazar céleste
    const bless = TRAITS.filter((t) => !t.neg && t.rarity >= 1 && BLESSING_COST[t.rarity]);
    parts.push(h('div', { class: 'card' },
      h('h2', null, '✦ Bazar céleste'),
      h('p', { class: 'muted small' }, `Éclats disponibles : ${fmt(s.eclats, 0)} ✦. Les Bénédictions sont offertes à tous les enfants de la prochaine succession (max 2).`),
      s.blessings.length ? h('p', { class: 'small accent' }, 'Bénédictions en attente : ', this.traitChips(s.blessings, true)) : null,
      h('div', { class: 'shop' }, bless.map((t) => {
        const c = BLESSING_COST[t.rarity];
        const btn = h('button', { class: 'shop-item', style: { '--c': RARITY[t.rarity].color }, onclick: () => { if (buyBlessing(s, t.id)) { toast(`${t.icon} Bénédiction « ${traitName(t)} » réservée`, 'good'); this.sigTab = ''; } else toast('Impossible : Éclats insuffisants, déjà choisie ou 2 bénédictions max.', 'bad'); } },
          h('span', { class: 'shop-i' }, t.icon), h('span', { class: 'shop-n' }, traitName(t)), h('span', { class: 'muted small' }, t.desc), h('span', { class: 'shop-c' }, `${c} ✦`));
        b.cls(btn, 'off', () => s.eclats < c || s.blessings.includes(t.id) || s.blessings.length >= 2);
        return btn;
      })),
      h('h3', { class: 'section-t' }, 'Héraldique'),
      h('p', { class: 'muted small' }, `Divise l'écu de ta maison : ${SHOP.partition.cost} ✦ la partition, puis libre de changer quand tu veux.`),
      h('div', { class: 'shop shop-parts' }, PARTITIONS.filter((p) => p.id !== 'plein').map((p) => {
        const owned = s.partitions.includes(p.id);
        const art = h('span', { class: 'shop-shield', style: { '--c': s.lineage.color } });
        art.innerHTML = shieldSvg(s.lineage.crest, p.id, { border: false });
        const btn = h('button', { class: `shop-item ${owned ? 'owned' : ''}`, onclick: () => {
          if (owned) { s.lineage.partition = p.id; this.sigTop = ''; this.sigTab = ''; this.sigLife = ''; toast(`🛡️ Écu ${p.name.toLowerCase()}`, 'good'); return; }
          if (buyPartition(s, p.id)) { toast(`🛡️ Partition « ${p.name} » débloquée et appliquée`, 'good'); this.sigTop = ''; this.sigTab = ''; this.sigLife = ''; }
          else toast(`Éclats insuffisants (${SHOP.partition.cost} ✦)`, 'bad');
        } }, art, h('span', { class: 'shop-n' }, p.name), h('span', { class: 'shop-c' }, owned ? (s.lineage.partition === p.id ? '✔ portée' : 'Porter') : `${SHOP.partition.cost} ✦`));
        if (!owned) b.cls(btn, 'off', () => s.eclats < SHOP.partition.cost);
        return btn;
      }))));
    return h('div', null, parts);
  }

  // =========================================================================
  // Modales
  openSuccession() {
    const s = this.s;
    const sc = s.succession;
    if (!sc || this.successionModal) return;
    const all = [...s.echoes, sc.newEcho];
    const slots = echoSlots(s);
    if (!this.echoSel) {
      const ranked = [...all].sort((a, b) => (b.pinned ? 1e18 : 0) + b.value - ((a.pinned ? 1e18 : 0) + a.value));
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
        const m = ACTS.map((x) => heroActMult(hero, x));
        const best = ACTS[m.indexOf(Math.max(...m))];
        return h('button', { class: `heir ${i === chosen ? 'chosen' : ''}`, onclick: () => { chosen = i; render(); } },
          h('div', { class: 'heir-name' }, hero.name),
          hero.vocation ? h('span', { class: 'badge badge-voc', style: { '--c': ACT[hero.vocation.act].color } }, `${ACT[hero.vocation.act].icon} ${vocationName(hero.vocation, hero, roman)}`) : h('span', { class: 'muted small' }, 'Sans vocation'),
          h('div', { class: 'heir-traits' }, hero.traits.map((id) => { const t = TRAIT[id]; return h('div', { class: `heir-trait ${t.neg ? 'neg' : ''}`, style: { '--c': RARITY[t.rarity].color } }, `${t.icon} ${traitName(t, hero)}`, h('span', { class: 'muted small' }, ` — ${t.desc}`)); })),
          h('div', { class: 'muted small' }, `Vie : ${Math.round(lifeDuration(s, hero))} s · Meilleure aptitude : ${ACT[best].icon} ×${Math.max(...m).toFixed(2)}`));
      }));
      const echoList = h('div', { class: 'echo-pick' }, all.map((e) => {
        const on = sel.has(e.id);
        return h('button', { class: `echo-chip ${on ? 'on' : ''} ${e === sc.newEcho ? 'new' : ''}`, onclick: () => {
          if (on) sel.delete(e.id); else if (sel.size < slots) sel.add(e.id); else { toast(`Seulement ${slots} emplacements : libère d'abord un autre Écho.`, 'bad'); return; }
          render();
        } },
          h('div', { class: 'row-between' }, h('strong', null, `${e === sc.newEcho ? '✨ ' : ''}${e.name}`), h('span', { class: 'small' }, on ? '✔ gardé' : '✖ libéré')),
          h('div', { class: 'timeline sm', style: { background: stripGradient(e.acts, e.acts.length) } }),
          h('div', { class: 'muted small' }, `Gén. ${e.gen} · ${fmt(e.value)} pts${e.pinned ? ' · 📌' : ''}`));
      }));
      const ok = h('button', { class: 'btn btn-primary btn-lg', onclick: () => {
        if (sel.size > slots) return;
        if (confirmSuccession(s, chosen, [...sel])) {
          this.echoSel = null;
          this.successionModal?.close();
          this.successionModal = null;
          this.sigLife = '';
          this.sigTab = '';
          toast(`👑 ${s.hero.name} reprend le flambeau (génération ${s.hero.gen})`, 'good');
          this.hooks.save();
        }
      } }, 'Perpétuer la lignée');
      content.replaceChildren(...[
        h('div', { class: 'center' },
          h('div', { class: 'big-i' }, '🕯️'),
          h('h2', null, `${a.name} rejoint les ancêtres`),
          h('p', { class: 'muted' }, `Génération ${a.gen} · ${fmt(a.value)} pts de valeur produite`)),
        h('div', { class: 'stats' },
          stat('Héritage gagné', `+${sc.legacyGain} ⚜️`),
          stat('Vocation', sc.vocationEarned ? `${ACT[sc.vocationEarned.act].icon} ${vocationName(sc.vocationEarned, a, roman)}` : 'Aucune'),
          stat('Prochain palier ⚜️', `${fmt(Math.pow(sc.legacyGain + 1, 3) * 20)} pts`)),
        h('h3', { class: 'section-t' }, `Échos à conserver (${sel.size}/${slots})`),
        over ? h('p', { class: 'muted small' }, 'Tu as plus d\'Échos que d\'emplacements : choisis ceux qui continueront de boucler.') : null,
        echoList,
        h('h3', { class: 'section-t' }, 'Choisis qui portera le nom'),
        heirs,
        h('div', { class: 'row-end sticky-bottom' }, ok)].filter((x): x is HTMLElement => !!x));
    };
    render();
    this.successionModal = modal(content, { wide: true, onClose: () => { this.successionModal = null; } });
  }

  showOffline(r: OfflineReport) {
    const gains = RES.filter((x) => Math.abs(r.gains[x]) > 0.01).map((x) => h('div', { class: 'stat' }, h('div', { class: 'stat-l' }, `${RES_INFO[x].icon} ${RES_INFO[x].name}`), h('div', { class: 'stat-v' }, `${r.gains[x] >= 0 ? '+' : ''}${fmt(r.gains[x])}`)));
    const m = modal(h('div', { class: 'center' },
      h('div', { class: 'big-i' }, '🌙'),
      h('h2', null, 'Pendant ton absence…'),
      h('p', { class: 'muted' }, `${fmtDur(r.seconds)} se sont écoulées. Tes Échos ont bouclé ${fmtInt(r.loops)} fois.`),
      h('div', { class: 'stats' }, gains.length ? gains : h('p', { class: 'muted' }, 'Rien n\'a été produit : il te faut des Échos !')),
      r.died ? h('p', { class: 'accent' }, (() => { const a = this.s.succession?.ancestor; return a ? `🕯️ ${a.name} s'est ${acc(a, 'éteint', 'éteinte')} en ton absence. Une succession t'attend.` : '🕯️ Une vie s\'est achevée en ton absence. Une succession t\'attend.'; })()) : null,
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
        s.lineage = { name: houseName(), crest, color, partition: 'plein' };
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
      const fill = () => {
        nameEl.textContent = s.hero.name;
        lineEl.textContent = acc(s.hero, 'premier du nom', 'première du nom');
        if (t && traitEl) traitEl.textContent = `${t.icon} ${traitName(t, s.hero)}`;
      };
      fill();
      // Le Sablier a choisi… mais on peut lui demander un autre prénom.
      const dice = h('button', { class: 'btn intro-dice intro-hero-dice', 'aria-label': 'Autre prénom', title: 'Autre prénom', onclick: () => {
        let n = s.hero.name;
        while (n === s.hero.name) n = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
        s.hero.name = n;
        s.hero.sex = sexFor(n);
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
      h('div', { class: 'row-end' }, h('button', { class: 'btn btn-primary', onclick: () => { const n = input.value.trim().replace(/[<>]/g, ''); if (n) s.lineage.name = n; m.close(); this.sigTop = ''; this.sigTab = ''; } }, 'Valider'))));
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
          class: `pick pick-part ${p.id === partition ? 'on' : ''} ${owned ? '' : 'locked'}`, style: { '--c': color }, title: owned ? p.name : `${p.name} — ${SHOP.partition.cost} ✦ au Bazar céleste`,
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
  openDaily() {
    const date = utcDateStr(Date.now());
    const setup = dailySetup(date);
    const content = h('div', { class: 'daily' });
    const b = this.dailyBinder;
    const intro = () => {
      b.reset();
      content.replaceChildren(
        h('div', { class: 'center' }, h('div', { class: 'big-i' }, '🎲'), h('h2', null, `Destin du jour : ${setup.name}`)),
        h('p', null, `Tu as ${DAILY_DUR} secondes. Même destin, même monde, mêmes règles pour tous. Ta lignée principale est mise en pause (tes Échos continuent).`),
        this.traitChips(setup.traits, false, setup),
        h('div', { class: 'row-wrap' }, setup.mods.map((m) => h('span', { class: 'badge' }, `${m.icon} ${m.name} — ${m.desc}`))),
        h('p', { class: 'muted small' }, 'Score = valeur finale des ressources : 🌾×1, 🪙×2, 📜×8, ✨×20. Les compétences repartent de zéro.'),
        h('div', { class: 'row-end' }, h('button', { class: 'btn btn-primary btn-lg', onclick: start }, 'Commencer')));
    };
    const start = () => {
      this.daily = new DailyRun(setup);
      this.dailyAcc = 0;
      this.rt.pauseLife = true;
      const run = this.daily;
      const best = this.s.daily[date]?.best ?? 0;
      b.reset();

      // Score et paliers de médaille
      const scaleMax = Math.max(DAILY_TIERS[2] * 1.15, best * 1.05);
      const scoreFill = b.width(h('div', { class: 'bar-fill' }), () => run.score() / scaleMax);
      const marks = DAILY_TIERS.map((t, i) => h('div', { class: 'tier-mark', style: { left: (t / scaleMax * 100) + '%' } }, h('span', null, MEDALS[i])));
      const bestMark = best > 0 ? h('div', { class: 'best-mark', style: { left: Math.min(100, best / scaleMax * 100) + '%' }, title: `Ton record du jour : ${fmtInt(best)} pts` }) : null;
      const tierText = b.text(h('div', { class: 'small' }), () => {
        const sc = run.score();
        const next = DAILY_TIERS.findIndex((t) => sc < t);
        const goal = next < 0 ? `${MEDALS[2]} Or atteint !` : `Prochain palier ${MEDALS[next]} ${DAILY_TIERS[next]} pts : encore ${fmtInt(DAILY_TIERS[next] - sc)}`;
        return goal + (best > 0 ? ` · Record du jour : ${fmtInt(best)}` : '');
      });
      const rate = b.text(h('span', null), () => {
        const v = this.dailyNetValue(run, run.life.act);
        return run.life.act ? `${v >= 0 ? '+' : '−'}${fmt(Math.abs(v))} pts/s` : '';
      });

      // Temps et ligne de vie
      const timeFill = b.width(h('div', { class: 'bar-fill' }), () => run.tickN / run.totalTicks);
      b.cls(timeFill, 'late', () => run.tickN / run.totalTicks > 0.8);
      const strip = h('div', { class: 'strip' });
      let lastLen = -1;
      b.add(() => {
        if (run.life.rec.length === lastLen) return;
        lastLen = run.life.rec.length;
        strip.style.background = stripGradient(run.life.rec, DAILY_DUR);
      });
      const idle = h('div', { class: 'daily-idle small' }, '⏸️ Aucune activité : le temps passe sans rien produire ! Choisis une activité (touches 1 à 5).');
      b.add(() => { idle.hidden = !!run.life.act || run.done; });

      // Ressources (avec leur valeur en points)
      const mini = (label: string, value: HTMLElement, sub: HTMLElement, title?: string) =>
        h('div', { class: 'stat stat-mini', title }, h('div', { class: 'stat-l' }, label), value, sub);
      const res = h('div', { class: 'stats stats-4' }, RES.map((r) => mini(`${RES_INFO[r].icon} ×${RES_INFO[r].value}`,
        b.text(h('div', { class: 'stat-v' }), () => fmt(run.res[r])),
        b.text(h('div', { class: 'muted small' }), () => `${fmtInt(run.res[r] * RES_INFO[r].value)} pts`),
        `${RES_INFO[r].name} : chaque unité vaut ${RES_INFO[r].value} pt${RES_INFO[r].value > 1 ? 's' : ''}`)));

      // Écosystème
      const ecoMini = (icon: string, name: string, k: 'F' | 'G' | 'P') => mini(`${icon} ${name}`,
        b.text(h('div', { class: 'stat-v' }), () => fmt(run.eco[k])),
        b.text(h('div', { class: 'muted small' }), () => { const r = run.eco[k] / ECO_EQ[k]; return r > 1.25 ? '▲ abondant' : r < 0.75 ? '▼ rare' : '≈ équilibre'; }));
      const harm = b.text(h('div', { class: 'stat-v' }), () => `×${harmonyMult(run.eco).toFixed(2)}`);
      b.cls(harm, 'good', () => harmonyMult(run.eco) >= 1.15);
      b.cls(harm, 'bad', () => harmonyMult(run.eco) < 0.9);
      const eco = h('div', { class: 'stats stats-4' }, ecoMini('🌳', 'Flore', 'F'), ecoMini('🦌', 'Gibier', 'G'), ecoMini('🐺', 'Prédat.', 'P'),
        mini('☯️ Harmonie', harm, h('div', { class: 'muted small' }, 'toute prod.'), 'Multiplie toute la production. Maximale quand Flore, Gibier et Prédateurs sont à l\'équilibre.'));

      // Activités
      const acts = h('div', { class: 'acts acts-daily' }, ACTS.map((a, i) => {
        const def = ACT[a];
        const lvl = b.text(h('span', { class: 'lvl' }), () => `Niv. ${run.life.lvl[a]}`);
        const xp = b.width(h('div', { class: 'bar-fill', style: { background: def.color } }), () => run.life.xp[a] / xpToNext(run.life.lvl[a]));
        const rateEl = b.text(h('div', { class: 'act-rate' }), () => {
          const p = lifePower(run.life, run.hero, a);
          const m = run.ctx.prodMult(a) * ecoFactor(a, run.eco) * p;
          const o: string[] = [];
          for (const r in def.produce) o.push(`+${fmt(def.produce[r as ResId]! * m)}${RES_INFO[r as ResId].icon}/s`);
          for (const r in def.consume) o.push(`−${fmt(def.consume[r as ResId]! * Math.sqrt(p))}${RES_INFO[r as ResId].icon}/s`);
          return o.join(' ');
        });
        const val = b.text(h('div', { class: 'act-val' }), () => {
          const v = this.dailyNetValue(run, a);
          return `≈ ${v >= 0 ? '+' : '−'}${fmt(Math.abs(v))} pts/s`;
        });
        b.cls(val, 'bad', () => this.dailyNetValue(run, a) < 0);
        const note = b.text(h('div', { class: 'act-note small' }), () => {
          const out: string[] = [];
          const lack = (Object.keys(def.consume) as ResId[]).filter((r) => run.res[r] < def.consume[r]! * Math.sqrt(lifePower(run.life, run.hero, a)) * 0.5);
          if (lack.length) out.push(`⚠️ Manque de ${lack.map((r) => RES_INFO[r].icon).join('')}`);
          if (a === 'cultiver' || a === 'chasser') out.push(`${a === 'cultiver' ? '🌳 Flore' : '🦌 Gibier'} ×${ecoFactor(a, run.eco).toFixed(2)}`);
          const md = setup.mods.find((x) => x.act?.[a]);
          if (md) out.push(`${md.icon} ×${md.act![a]}`);
          return out.join(' · ');
        });
        b.cls(note, 'bad', () => note.textContent?.includes('⚠️') ?? false);
        const btn = h('button', { class: 'act', style: { '--c': def.color }, onclick: () => run.setAct(run.life.act === a ? null : a) },
          h('div', { class: 'act-i' }, def.icon, h('span', { class: 'act-key' }, String(i + 1))),
          h('div', { class: 'act-body' }, h('div', { class: 'act-head' }, h('span', { class: 'act-n' }, def.name), lvl), h('div', { class: 'bar bar-thin' }, xp), rateEl, val, note));
        b.cls(btn, 'active', () => run.life.act === a);
        return btn;
      }));

      content.replaceChildren(
        h('div', { class: 'row-between daily-head' }, h('h2', null, `🎲 ${setup.name}`),
          h('div', { class: 'right' }, b.text(h('div', { class: 'score' }), () => `${fmtInt(run.score())} pts`), b.cls(h('div', { class: 'small good' }, rate), 'bad', () => this.dailyNetValue(run, run.life.act) < 0))),
        h('div', { class: 'bar bar-tiers' }, scoreFill, marks, bestMark),
        tierText,
        h('div', { class: 'row-wrap daily-ctx' }, this.traitChips(setup.traits, true, setup), setup.mods.map((m) => h('span', { class: 'badge' }, `${m.icon} ${m.name} — ${m.desc}`)),
          run.xpMult !== 1 ? h('span', { class: 'badge' }, `⚡ Expérience ×${run.xpMult.toFixed(2)}`) : null),
        h('div', { class: 'row-between small' }, b.text(h('span'), () => `Âge ${Math.floor(run.tickN / 10)} / ${DAILY_DUR} ans`), b.text(h('span', { class: 'muted' }), () => `${fmtDur(DAILY_DUR - run.tickN / 10)} restantes`)),
        h('div', { class: 'bar' }, timeFill),
        strip,
        idle,
        res, acts, eco,
        h('div', { class: 'row-end' }, h('button', { class: 'btn btn-ghost btn-sm', onclick: () => { this.endDaily(false); this.dailyModal?.close(); } }, 'Abandonner')));
    };
    const finish = () => {
      const run = this.daily!;
      const score = run.score();
      const code = encodeRun(date, run.actions, score);
      const s = this.s;
      const rec = s.daily[date] ?? { best: 0, code: '', rewarded: 0 };
      const isBest = score > rec.best;
      if (isBest) { rec.best = score; rec.code = code; }
      const levels = 1 + DAILY_TIERS.filter((t) => rec.best >= t).length;
      const gain = Math.max(0, levels - rec.rewarded);
      rec.rewarded = Math.max(rec.rewarded, levels);
      s.daily[date] = rec;
      s.eclats += gain;
      this.endDaily(true);
      this.hooks.save();
      b.reset();
      const medal = score >= DAILY_TIERS[2] ? '🥇' : score >= DAILY_TIERS[1] ? '🥈' : score >= DAILY_TIERS[0] ? '🥉' : '🎗️';
      content.replaceChildren(
        h('div', { class: 'center' },
          h('div', { class: 'big-i' }, medal),
          h('h2', null, `${fmtInt(score)} points`),
          h('p', { class: 'muted' }, isBest ? 'Nouveau record personnel du jour !' : `Ton record du jour reste ${fmtInt(rec.best)} pts.`),
          gain ? h('p', { class: 'accent' }, `+${gain} ✦ Éclats célestes`) : null),
        h('div', { class: 'timeline', style: { background: stripGradient(recFromActions(run.actions, run.totalTicks), DAILY_DUR) } }),
        h('p', { class: 'muted small' }, 'Code vérifiable (tout le monde peut rejouer ta partie et confirmer ton score) :'),
        h('textarea', { class: 'input mono', rows: 2, readonly: true }, code),
        h('div', { class: 'row-wrap' },
          h('button', { class: 'btn btn-primary', onclick: () => this.shareDaily(date, score, code) }, '📤 Partager'),
          h('button', { class: 'btn', onclick: () => { intro(); } }, '🔁 Rejouer'),
          h('button', { class: 'btn btn-ghost', onclick: () => this.dailyModal?.close() }, 'Fermer')));
    };
    this.dailyFinish = finish;
    intro();
    this.dailyModal = modal(content, { wide: true, dismissable: true, onClose: () => { this.endDaily(false); this.dailyModal = null; this.sigTab = ''; } });
  }

  dailyFinish: (() => void) | null = null;

  /** Variation estimée du score par seconde si le héros du défi fait l'activité a. */
  dailyNetValue(run: DailyRun, a: ActId | null): number {
    if (!a) return 0;
    const def = ACT[a];
    const p = lifePower(run.life, run.hero, a);
    let frac = 1;
    for (const r in def.consume) {
      const need = def.consume[r as ResId]! * Math.sqrt(Math.max(p, 0.01)) * 0.1;
      if (need > 0) frac = Math.min(frac, run.res[r as ResId] / need);
    }
    frac = Math.max(0, Math.min(1, frac));
    const m = run.ctx.prodMult(a) * ecoFactor(a, run.eco) * p * frac;
    let v = 0;
    for (const r in def.produce) v += def.produce[r as ResId]! * m * RES_INFO[r as ResId].value;
    for (const r in def.consume) v -= def.consume[r as ResId]! * Math.sqrt(Math.max(p, 0.01)) * frac * RES_INFO[r as ResId].value;
    return v;
  }

  /** Appelé par la boucle principale avec le temps réel écoulé. */
  dailyStep(dtSec: number) {
    const run = this.daily;
    if (!run || run.done) return;
    this.dailyAcc += dtSec;
    while (this.dailyAcc >= 0.1 && !run.done) {
      run.step();
      this.dailyAcc -= 0.1;
    }
    if (run.done) this.dailyFinish?.();
  }

  endDaily(_finished: boolean) {
    this.rt.pauseLife = false;
    this.daily = null;
  }

  async shareDaily(date: string, score: number, code: string) {
    const d = new Date(date + 'T12:00:00Z').toLocaleDateString('fr-FR');
    const medal = score >= DAILY_TIERS[2] ? '🥇' : score >= DAILY_TIERS[1] ? '🥈' : score >= DAILY_TIERS[0] ? '🥉' : '🎗️';
    const text = `⏳ Échos de Lignée — Destin du ${d}\n${medal} ${fmtInt(score)} points\nVérifie mon score : ${code}\n${GAME_URL}`;
    try {
      if (navigator.share) { await navigator.share({ text }); return; }
    } catch { /* annulé */ }
    toast((await copyText(text)) ? '📋 Résultat copié : colle-le où tu veux !' : 'Copie impossible', 'good');
  }

  openVerify() {
    const input = h('textarea', { class: 'input mono', rows: 3, placeholder: 'Colle un code de score…' }) as HTMLTextAreaElement;
    const out = h('div');
    modal(h('div', null,
      h('h2', null, '🔎 Vérifier un score'),
      h('p', { class: 'muted small' }, 'Le jeu rejoue exactement la partie décrite par le code et compare le score annoncé.'),
      input,
      h('div', { class: 'row-end' }, h('button', { class: 'btn btn-primary', onclick: () => {
        const m = input.value.match(/[A-Za-z0-9_-]{12,}/g);
        const code = m ? m.sort((a, b) => b.length - a.length)[0] : '';
        const r = verifyCode(code);
        if (!r) out.replaceChildren(h('p', { class: 'bad' }, '❌ Code illisible.'));
        else out.replaceChildren(h('p', { class: r.ok ? 'good' : 'bad' }, r.ok ? `✅ Authentique : ${fmtInt(r.actual)} points le ${r.date}.` : `❌ Falsifié : annoncé ${fmtInt(r.claimed)}, réel ${fmtInt(r.actual)}.`));
      } }, 'Vérifier')),
      out));
  }
}

// ---------------------------------------------------------------------------
declare const __APP_VERSION__: string;

function stat(label: string, value: string | HTMLElement) {
  return h('div', { class: 'stat' }, h('div', { class: 'stat-l' }, label), h('div', { class: 'stat-v' }, value));
}

const ROMAN: [number, string][] = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
export function roman(n: number): string {
  if (n <= 0 || n > 3999) return String(n);
  let out = '';
  for (const [v, r] of ROMAN) while (n >= v) { out += r; n -= v; }
  return out;
}

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

function recFromActions(actions: [number, number][], totalTicks: number): number[] {
  const out: number[] = [];
  let cur = -1, j = 0;
  for (let s = 0; s < totalTicks / 10; s++) {
    while (j < actions.length && actions[j][0] <= s * 10 + 5) { cur = actions[j][1]; j++; }
    out.push(cur);
  }
  return out;
}

function drawSpark(c: HTMLCanvasElement, hist: { F: number; G: number; P: number }[], series: [string, string][]) {
  const ctx = c.getContext('2d');
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const w = c.clientWidth || 300, hgt = c.clientHeight || 80;
  if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(hgt * dpr); }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, hgt);
  if (hist.length < 2) return;
  const max = 140;
  for (const [k, color] of series) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    hist.forEach((p, i) => {
      const x = (i / Math.max(1, hist.length - 1)) * w;
      const y = hgt - ((p as any)[k] / max) * (hgt - 6) - 3;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }
}
