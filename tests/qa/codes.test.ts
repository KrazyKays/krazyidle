// QA — codes : Destin du jour (score vérifiable) et codes d'alliance (bornes, réutilisation, propre maison).
import { describe, expect, test } from 'vitest';
import { ACTS, TRAIT } from '../../src/engine/data';
import { dailySetup, dailySolution, decodeRun, encodeRun, playActions, verifyCode } from '../../src/engine/daily';
import { acceptProposal, codeKey, decodeProposal, encodeProposal, readProposal } from '../../src/engine/alliances';
import { startLife } from '../../src/engine/game';
import { hashStr } from '../../src/engine/rng';
import { newGame, type GameState } from '../../src/engine/state';

const b64url = (raw: string) => btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

describe('Destin du jour : codes trafiqués', () => {
  const date = '2026-11-14';
  // Partie qui livre la commande (plan du solveur) : son résultat est un âge de livraison au dixième,
  // qui change dès qu'on touche à la date ou à une action.
  const run = playActions(dailySetup(date), dailySolution(date).actions);
  const score = run.score();
  const good = encodeRun(date, run.actions, score);

  test('le code honnête est vérifié', () => {
    expect(verifyCode(good)!.ok).toBe(true);
  });

  test('score gonflé, date changée, action changée : refusés', () => {
    expect(verifyCode(encodeRun(date, run.actions, score + 1))!.ok).toBe(false);
    expect(verifyCode(encodeRun('2026-11-15', run.actions, score))!.ok).toBe(false);
    const acts = run.actions.map(([t, a]) => [t, a === 2 ? 1 : a] as [number, number]);
    expect(verifyCode(encodeRun(date, acts, score))!.ok).toBe(false);
  });

  test('codes malformés : null, jamais d\'exception', () => {
    const bad = [
      '', 'EL1', b64url('EL1|2026-11-14|zz|10'), b64url('EL1|2026-11-14|0' + '9|10'), b64url('EL1|2026-13-99'),
      b64url('EL1|2026-11-14|00|0'), b64url('EL3|2026-11-14|00|0'), b64url('EL1|14/11/2026|00|0'), '%%%%', b64url('EL1|2026-11-14|.|0'),
    ];
    for (const c of bad) {
      expect(() => verifyCode(c)).not.toThrow();
    }
    expect(decodeRun(b64url('EL2|2026-11-14|09|10'))).toBeNull(); // activité 9 inexistante
    expect(decodeRun(b64url('EL1|2026-11-14|00|10'))).toBeNull(); // ancien Destin à points
  });

  test('actions hors ordre ou hors durée : le replay reste celui d\'une vraie partie (pas de score impossible)', () => {
    // Actions en désordre : le replay s'arrête de lire au premier tick non atteint → score d'une partie légale.
    const shuffled: [number, number][] = [[500, 2], [0, 0], [10, 1]];
    const r = verifyCode(encodeRun(date, shuffled, 0))!;
    expect(r).not.toBeNull();
    expect(r.actual).toBeGreaterThanOrEqual(0);
    const late = verifyCode(encodeRun(date, [[0, 0], [99999, 3]], 0))!;
    const only = verifyCode(encodeRun(date, [[0, 0]], 0))!;
    expect(late.actual).toBe(only.actual);
  });

  test('un code de 100 000 actions est traité en temps borné', () => {
    const many: [number, number][] = [];
    for (let i = 0; i < 100_000; i++) many.push([i, i % 5]);
    const t = performance.now();
    verifyCode(encodeRun(date, many, 0));
    expect(performance.now() - t).toBeLessThan(3000);
  });

  test('score non numérique dans le code : refusé (claimed NaN ≠ actual)', () => {
    const raw = `EL2|${date}|00|abc`;
    const r = verifyCode(b64url(raw));
    expect(r?.ok ?? false).toBe(false);
  });
});

describe('codes d\'alliance', () => {
  function house(seed: number, name: string): GameState {
    const s = newGame(0, seed);
    s.upgrades.alliances = 1;
    s.lineage.name = name;
    startLife(s);
    s.res.or = 1e6;
    return s;
  }
  /** Nouvelle génération : le héros peut de nouveau se marier. */
  const nextGen = (s: GameState) => { s.hero = { ...s.hero, id: s.hero.id + 1000, spouse: undefined }; };

  test('champs hostiles neutralisés : balises, couleur, blason, rang de vocation, génération', () => {
    const forge = (arr: unknown[]) => {
      const data = btoa(unescape(encodeURIComponent(JSON.stringify(arr)))).replace(/\+/g, '.').replace(/\//g, '_').replace(/=+$/, '');
      return `AL1-${data}-${hashStr(data + 'sablier-des-ancetres').toString(36)}`;
    };
    const p = decodeProposal(forge(['h<script>', '<b>Maison</b>', 999, 'red;x', 99, '<img>', 1, -5, [0, 21, 22, 23, 999], 3, 9999, 0, '', 1]))!;
    expect(p).not.toBeNull();
    expect(p.house.name).not.toMatch(/[<>]/);
    expect(p.name).not.toMatch(/[<>]/);
    expect(p.house.color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(p.vocation!.tier).toBeLessThanOrEqual(10);
    expect(p.gen).toBeGreaterThanOrEqual(1);
    const bruno = house(2, 'Dorval');
    const r = readProposal(bruno, forge(['h1', 'X', 0, '#000000', 0, 'Yvain', 0, 3, [21, 22, 23, 17, 18, 0], 3, 10, -1, '', 1]));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.suitor.traits.length).toBeLessThanOrEqual(4);
    expect(r.suitor.traits.filter((t) => TRAIT[t].rarity >= 3).length).toBeLessThanOrEqual(1);
    expect(r.suitor.traits).not.toContain('astres');
    expect(r.suitor.vocation!.tier).toBeLessThanOrEqual(2);
  });

  test('maison PNJ usurpée (« pnj:… ») refusée', () => {
    const a = house(1, 'Corbin');
    a.houseId = 'pnj:Valombre';
    const c = encodeProposal(a, { ...a.hero, id: 5 });
    expect(decodeProposal(c)).toBeNull();
  });

  test('même code exact : accepté une seule fois', () => {
    const a = house(1, 'Corbin'), b = house(2, 'Dorval');
    const code = encodeProposal(b, { ...b.hero, id: 77 });
    expect(acceptProposal(a, code).ok).toBe(true);
    nextGen(a);
    expect(acceptProposal(a, code).ok).toBe(false);
  });

  // QA-04 (corrigé en R6) : l'empreinte portait sur le texte collé ; le message de partage et le lien du même
  // code donnaient deux empreintes, et le même cadet était accepté deux fois. Elle porte désormais sur le contenu.
  test('QA-04 : le message de partage puis le lien du même code → refusé la 2ᵉ fois', () => {
    const a = house(1, 'Corbin'), b = house(2, 'Dorval');
    const code = encodeProposal(b, { ...b.hero, id: 77 });
    const message = `💍 La Maison Dorval offre la main de Yvain (génération II) !\nAccepte-la dans Échos de Lignée : https://exemple.test/#mariage=${code}`;
    expect(acceptProposal(a, message).ok).toBe(true);
    nextGen(a);
    expect(acceptProposal(a, code).ok).toBe(false);
  });

  test('QA-04 : un caractère ajouté après le code ne suffit plus à le réutiliser', () => {
    const a = house(1, 'Corbin'), b = house(2, 'Dorval');
    const code = encodeProposal(b, { ...b.hero, id: 77 });
    expect(acceptProposal(a, code).ok).toBe(true);
    nextGen(a);
    expect(acceptProposal(a, code + ' !').ok).toBe(false);
  });

  test('QA-04 : même empreinte pour le même code, quel que soit le texte autour', () => {
    const b = house(2, 'Dorval');
    const code = encodeProposal(b, { ...b.hero, id: 77 });
    expect(codeKey(code + ' !')).toBe(codeKey(code));
    expect(codeKey(`texte\n${code}`)).toBe(codeKey(code));
  });

  test('PBA-09 : le même cadet ré-émis avec un autre nonce est refusé la 2ᵉ fois', () => {
    const a = house(1, 'Corbin'), b = house(2, 'Dorval');
    const cadet = { ...b.hero, id: 77 };
    expect(acceptProposal(a, encodeProposal(b, cadet, undefined, 1)).ok).toBe(true);
    nextGen(a);
    expect(acceptProposal(a, encodeProposal(b, cadet, undefined, 2)).ok).toBe(false);
  });

  test('deux cadets différents de la même maison restent acceptables', () => {
    const a = house(1, 'Corbin'), b = house(2, 'Dorval');
    expect(acceptProposal(a, encodeProposal(b, { ...b.hero, id: 77, name: 'Yvain' })).ok).toBe(true);
    nextGen(a);
    expect(acceptProposal(a, encodeProposal(b, { ...b.hero, id: 78, name: 'Iseult', sex: 'f' })).ok).toBe(true);
  });

  // QA-07 (non corrigé, risque accepté — arbitrage D3) : sans serveur, l'identifiant de maison d'un code peut
  // être changé (sel public) pour épouser son propre cadet. Une détection par le contenu (prénom, génération,
  // dons) a été essayée en R6 puis écartée : elle refusait des mariages légitimes entre deux maisons dont les
  // cadets se ressemblent (tests/legends.test.ts). Ce test documente le comportement.
  test.fails('QA-07 (risque accepté) : un cadet de sa propre maison, code ré-signé sous un autre id, est refusé', () => {
    const c = house(3, 'Corbin');
    const cadet = { ...c.hero, id: 77, traits: ['elu', 'centenaire'] };
    const forged = encodeProposal({ ...c, houseId: 'autre' }, cadet);
    expect(acceptProposal(c, forged).ok).toBe(false);
  });

  test('les activités du code restent valides', () => {
    const b = house(2, 'Dorval');
    const p = decodeProposal(encodeProposal(b, { ...b.hero, id: 7, vocation: { act: 'mediter', tier: 3 } }))!;
    expect(ACTS).toContain(p.vocation!.act);
  });
});
