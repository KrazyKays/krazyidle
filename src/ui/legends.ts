// Interface des Surnoms (Codex) et des Alliances (mariages entre maisons).
import { ACT, acc, vocationName, type Named } from '../engine/data';
import {
  CADETS_MAX, acceptProposal, alliancesUnlocked, canMarry, countyHouses, dowry, isSealed, marry, proposeCadet, readProposal, suitorFor, weekEnd,
} from '../engine/alliances';
import { EPITHET, EPITHETS, EPITHET_RARITY, epithetEffect, epithetLabel, fullName } from '../engine/epithets';
import { chroniclesUnlocked } from '../engine/game';
import type { HouseRef, Spouse } from '../engine/state';
import type { App } from './app';
import { roman } from './app';
import { copyText, h, modal, toast, type ModalHandle } from './dom';
import { fmt, fmtDur } from './fmt';
import { shieldSvg } from './heraldry';

const GAME_URL = 'https://krazykays.github.io/krazyidle/';
const actName = (a: keyof typeof ACT) => ACT[a].name;

/** Petit écu d'une maison quelconque. */
export function houseShield(house: HouseRef, cls = 'crest'): HTMLElement {
  const el = h('div', { class: `crest-svg ${cls}`, style: { '--c': house.color }, title: `Maison ${house.name}` });
  el.innerHTML = shieldSvg(house.crest, house.partition ?? 'plein', { border: false });
  return el;
}

/** Pastille de surnom, qui explique son effet au toucher. */
export function epithetBadge(id: string | undefined, who: Named | null): HTMLElement | null {
  const e = id ? EPITHET[id] : undefined;
  if (!e) return null;
  const label = epithetLabel(id, who);
  return h('button', {
    class: 'badge badge-epithet', style: { '--c': EPITHET_RARITY[e.rarity].color }, title: `${label} — ${epithetEffect(e, actName)}`,
    onclick: (ev: Event) => { ev.stopPropagation(); toast(`${e.icon} « ${label} » (${EPITHET_RARITY[e.rarity].name}) · ${epithetEffect(e, actName)}`, 'info', 4500); },
  }, `${e.icon} ${label}`);
}

/** « 💍 Unie à Ysolde, Maison Corbin » */
export function spouseLine(p: Named, spouse: { name: string; sex: 'f' | 'm'; epithet?: string; house: HouseRef } | undefined, small = false): HTMLElement | null {
  if (!spouse) return null;
  return h('div', { class: `spouse-line ${small ? 'small' : ''}` }, houseShield(spouse.house, 'crest-xs'),
    h('span', null, `💍 ${acc(p, 'Uni', 'Unie')} à ${fullName(spouse)}, Maison ${spouse.house.name}`));
}

function suitorCard(app: App, sp: Spouse, extra: (HTMLElement | null)[] = []): HTMLElement {
  return h('div', { class: 'suitor' },
    h('div', { class: 'suitor-head' }, houseShield(sp.house, 'crest-md'),
      h('div', null, h('div', { class: 'suitor-name' }, fullName(sp)), h('div', { class: 'muted small' }, `Maison ${sp.house.name} · génération ${roman(sp.gen)}`))),
    h('div', { class: 'row-wrap' },
      sp.vocation ? h('span', { class: 'badge badge-voc', style: { '--c': ACT[sp.vocation.act].color } }, `${ACT[sp.vocation.act].icon} ${vocationName(sp.vocation, sp, roman)}`) : h('span', { class: 'muted small' }, 'Sans vocation'),
      epithetBadge(sp.epithet, sp)),
    app.traitChips(sp.traits, false, sp),
    ...extra);
}

// ---------------------------------------------------------------------------
// Onglet Lignée : section Alliances
export function alliancesSection(app: App): HTMLElement | null {
  const s = app.s, b = app.bTab;
  if (!alliancesUnlocked(s)) return null;
  const now = Date.now();
  const hero = s.hero;
  const refresh = () => { app.sigTab = ''; app.sigLife = ''; app.hooks.save(); };

  const status = hero.spouse
    ? spouseLine(hero, hero.spouse)
    : h('p', { class: 'small' }, s.life
      ? `${hero.name} peut s'unir à une autre maison : ses enfants hériteront aussi des dons de leur autre parent. Une union par vie.`
      : 'La prochaine génération pourra se marier.');
  const head = h('div', { class: 'card' },
    h('p', { class: 'muted small' }, 'Marie tes héros aux maisons du comté, ou à la lignée d\'un ami par un simple code. Les enfants que tu ne choisis pas deviennent des cadets, prêts à fonder d\'autres alliances.'),
    status,
    h('div', { class: 'row-wrap' },
      h('button', { class: 'btn btn-primary btn-sm', onclick: () => openAcceptProposal(app) }, '📨 Recevoir une demande'),
      h('button', { class: 'btn btn-sm', disabled: s.cadets.length ? undefined : true, onclick: () => openPropose(app) }, '💌 Proposer un cadet')));

  // Maisons du comté
  const houses = countyHouses(now).filter((ch) => ch.house.name !== s.lineage.name);
  const cost = dowry(s, 'pnj');
  const county = h('div', { class: 'grid-cards' }, houses.map((ch) => {
    const sp = suitorFor(s, ch, now);
    // Risque si l'on s'unit encore à cette maison (une union de plus que celles déjà conclues).
    const risk = Math.min(0.6, 0.15 * (s.alliances[ch.house.id]?.count ?? 0));
    const btn = h('button', { class: 'btn btn-primary btn-sm', onclick: () => {
      const r = marry(s, sp);
      if (!r.ok) { toast(r.reason, 'bad'); return; }
      toast(`💍 ${hero.name} et ${sp.name} sont ${acc(hero, 'unis', 'unies')} ! La Maison ${ch.house.name} devient votre alliée.`, 'good', 4500);
      refresh();
    } }, `💍 S'unir · ${fmt(cost, 0)} 🪙`);
    b.add(() => { (btn as HTMLButtonElement).disabled = !canMarry(s) || s.res.or < cost; });
    return h('div', { class: 'card house-card' },
      h('div', { class: 'label' }, `Maison ${ch.house.name} · ${ACT[ch.spec].icon} ${ACT[ch.spec].name}`),
      suitorCard(app, sp, [
        risk > 0 ? h('p', { class: 'small bad' }, `⚠️ Déjà ${s.alliances[ch.house.id].count} union(s) avec cette maison : risque de consanguinité ${Math.round(risk * 100)} %.`) : null,
        h('div', { class: 'row-end' }, btn)]));
  }));

  // Galerie des alliances
  const all = Object.values(s.alliances).sort((a, b2) => b2.lastGen - a.lastGen);
  const gallery = all.length
    ? h('div', { class: 'gallery' }, all.map((a) => {
      const sealed = isSealed(a);
      const tag = a.origin === 'pnj' ? '🏰 Comté' : sealed ? '🤝 Scellée' : '💌 Lignée amie';
      return h('div', { class: `gallery-item ${sealed ? 'sealed' : ''}` }, houseShield(a.house, 'crest-md'),
        h('div', { class: 'small strong' }, a.house.name),
        h('div', { class: 'muted small' }, `${tag} · ${a.count} union${a.count > 1 ? 's' : ''}`),
        a.origin === 'joueur' && !a.sent ? h('button', { class: 'btn btn-sm btn-ghost', onclick: () => openPropose(app, a.house) }, 'Répondre') : null);
    }))
    : h('p', { class: 'muted small' }, 'Aucune alliance pour l\'instant.');

  return h('div', null,
    h('h3', { class: 'section-t' }, '💍 Alliances'), head,
    h('div', { class: 'row-between sub-t' }, h('strong', null, 'Maisons du comté'), b.text(h('span', { class: 'muted small' }), () => `nouvelles maisons dans ${fmtDur((weekEnd(Date.now()) - Date.now()) / 1000)}`)),
    h('p', { class: 'muted small' }, 'Les mêmes pour tous les joueurs cette semaine. Chacune offre son don à ses prétendants.'),
    county,
    h('div', { class: 'sub-t' }, h('strong', null, 'Galerie des alliances')),
    h('div', { class: 'card' }, gallery));
}

// ---------------------------------------------------------------------------
// Proposer un cadet (optionnellement en réponse à une maison)
export function openPropose(app: App, re?: HouseRef) {
  const s = app.s;
  const content = h('div', { class: 'propose' });
  let m: ModalHandle | null = null;
  const pick = () => {
    if (!s.cadets.length) {
      content.replaceChildren(h('h2', null, '💌 Proposer un cadet'), h('p', { class: 'muted' }, 'Aucun cadet pour l\'instant : les enfants que tu ne choisis pas à la succession en deviennent.'));
      return;
    }
    content.replaceChildren(
      h('h2', null, re ? `💌 Répondre à la Maison ${re.name}` : '💌 Proposer un cadet'),
      h('p', { class: 'muted small' }, re
        ? 'Offre l\'un de tes cadets en retour : l\'alliance sera scellée entre vos deux maisons.'
        : `Choisis qui tu offres en mariage. Le jeu te donne un code à envoyer à un ami : il pourra l'unir à son héros. Un même code peut servir à plusieurs lignées. (${s.cadets.length}/${CADETS_MAX} cadets, les plus anciens partent les premiers.)`),
      h('div', { class: 'grid-cards' }, [...s.cadets].reverse().map((c) => h('button', { class: 'heir', onclick: () => show(c.id) },
        h('div', { class: 'heir-name' }, c.name, ' ', h('span', { class: 'muted small' }, `· gén. ${roman(c.gen)}`)),
        c.vocation ? h('span', { class: 'badge badge-voc', style: { '--c': ACT[c.vocation.act].color } }, `${ACT[c.vocation.act].icon} ${vocationName(c.vocation, c, roman)}`) : h('span', { class: 'muted small' }, 'Sans vocation'),
        app.traitChips(c.traits, false, c)))));
  };
  const show = (id: number) => {
    const c = s.cadets.find((x) => x.id === id)!;
    const code = proposeCadet(s, id, re?.id)!;
    app.hooks.save();
    app.sigTab = '';
    const link = `${GAME_URL}#mariage=${code}`;
    const voc = c.vocation ? `${vocationName(c.vocation, c, roman)}, ` : '';
    const text = `💍 La Maison ${s.lineage.name} offre la main de ${c.name} (${voc}génération ${roman(c.gen)}) !\nAccepte-la dans Échos de Lignée : ${link}`;
    const area = h('textarea', { class: 'input mono', rows: 3, readonly: true }) as HTMLTextAreaElement;
    area.value = code;
    content.replaceChildren(
      h('h2', null, `💌 La main de ${c.name}`),
      h('p', { class: 'muted small' }, `Envoie ce message à un ami. En ouvrant le lien (ou en collant le code dans Lignée → Alliances), il pourra unir ${c.name} à son héros. Il te répondra peut-être avec l'un de ses cadets.`),
      area,
      h('div', { class: 'row-wrap' },
        h('button', { class: 'btn btn-primary', onclick: async () => {
          const nav = navigator as Navigator & { share?: (d: { text: string }) => Promise<void> };
          if (nav.share) { try { await nav.share({ text }); return; } catch { /* annulé : on copie */ } }
          toast((await copyText(text)) ? '📋 Message copié !' : 'Copie impossible : sélectionne le code.', 'good');
        } }, '📤 Partager'),
        h('button', { class: 'btn', onclick: async () => toast((await copyText(code)) ? '📋 Code copié !' : 'Copie impossible.', 'good') }, '📋 Code seul'),
        h('button', { class: 'btn btn-ghost', onclick: pick }, '← Autre cadet')));
  };
  pick();
  m = modal(content, { wide: true });
  return m;
}

// ---------------------------------------------------------------------------
// Recevoir une demande en mariage (code collé ou lien ouvert)
export function openAcceptProposal(app: App, initial = '') {
  const s = app.s;
  const content = h('div');
  const input = h('textarea', { class: 'input mono', rows: 3, placeholder: 'Colle ici le code ou le message reçu…' }) as HTMLTextAreaElement;
  input.value = initial;
  const out = h('div');
  let m: ModalHandle | null = null;
  const read = () => {
    const r = readProposal(s, input.value);
    if (!r.ok) { out.replaceChildren(h('p', { class: 'bad' }, `❌ ${r.reason}`)); return; }
    const sp = r.suitor;
    const cost = dowry(s, 'joueur');
    let why = '';
    if (!alliancesUnlocked(s)) why = 'Débloque d\'abord l\'amélioration 💍 Alliances (onglet Lignée). Garde ce code : il restera valable.';
    else if (!s.life) why = 'Choisis d\'abord la relève : il faut un héros vivant pour célébrer l\'union.';
    else if (s.hero.spouse) why = `${s.hero.name} est déjà ${acc(s.hero, 'uni', 'unie')}. Garde ce code pour la prochaine génération.`;
    else if (s.res.or < cost) why = `Il faut une dot de ${fmt(cost, 0)} 🪙.`;
    out.replaceChildren(
      h('h3', { class: 'section-t' }, `La Maison ${sp.house.name} offre la main de ${sp.name}`),
      suitorCard(app, sp),
      h('p', { class: 'muted small' }, 'Les dons venus d\'une autre lignée sont bornés : ni traits du Bazar, un seul trait légendaire, et une vocation au plus deux rangs au-dessus de celle de ton héros.'),
      h('p', { class: 'small accent', hidden: why ? undefined : true }, why),
      h('div', { class: 'row-end' }, h('button', { class: 'btn btn-primary', disabled: why ? true : undefined, onclick: () => {
        const res = acceptProposal(s, input.value);
        if (!res.ok) { toast(res.reason, 'bad'); return; }
        const hero = s.hero;
        toast(`💍 ${hero.name} et ${sp.name} sont ${acc(hero, 'unis', 'unies')} ! La Maison ${sp.house.name} devient votre alliée.`, 'good', 5000);
        app.sigTab = ''; app.sigLife = ''; app.hooks.save();
        m?.close();
        const al = s.alliances[sp.house.id];
        if (al && !al.sent && s.cadets.length) openPropose(app, sp.house);
      } }, `💍 Unir à ${s.hero.name} · ${fmt(cost, 0)} 🪙`)));
  };
  content.append(
    h('h2', null, '📨 Demande en mariage'),
    h('p', { class: 'muted small' }, 'Un ami t\'a envoyé un code d\'alliance ? Colle-le ici pour découvrir qui sa maison te propose.'),
    input,
    h('div', { class: 'row-end' }, h('button', { class: 'btn', onclick: read }, '🔎 Lire la demande')),
    out);
  m = modal(content, { wide: true });
  if (initial) read();
  return m;
}

// ---------------------------------------------------------------------------
// Codex des surnoms
export function codexSection(app: App): HTMLElement | null {
  const s = app.s;
  if (!chroniclesUnlocked(s)) return null;
  const found = EPITHETS.filter((e) => s.epithets[e.id]).length;
  const list = h('div', { class: 'codex' }, [3, 2, 1, 0].flatMap((r) => EPITHETS.filter((e) => e.rarity === r).map((e) => {
    const n = s.epithets[e.id] ?? 0;
    const col = EPITHET_RARITY[e.rarity].color;
    if (!n) return h('div', { class: 'codex-item locked', style: { '--c': col } }, h('span', { class: 'codex-i' }, '❔'),
      h('div', null, h('div', { class: 'strong' }, '???'), h('div', { class: 'muted small italic' }, e.hint)));
    return h('div', { class: 'codex-item', style: { '--c': col } }, h('span', { class: 'codex-i' }, e.icon),
      h('div', null, h('div', { class: 'strong' }, epithetLabel(e.id, null), h('span', { class: 'muted small' }, ` · ×${n}`)),
        h('div', { class: 'muted small' }, epithetEffect(e, actName)), h('div', { class: 'muted small italic' }, e.hint)));
  })));
  return h('div', null,
    h('h3', { class: 'section-t' }, `📜 Codex des surnoms (${found}/${EPITHETS.length})`),
    h('div', { class: 'card' },
      h('p', { class: 'muted small' }, 'À sa mort, une vie marquante reçoit un surnom : il suit son Écho pour toujours et le renforce. Le plus rare l\'emporte. Chaque première découverte offre des Éclats ✦.'),
      list));
}
