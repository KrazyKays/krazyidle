// Exécute une partie complète avec un profil et collecte les indicateurs (voir lab/metrics/KPIS.md).
import { ACTS, RES, RES_INFO, TRAIT } from '../../src/engine/data';
import { newRuntime, offlineCapSec, setActivity, startLife, tick } from '../../src/engine/game';
import { ecoHealth } from '../../src/engine/ecosystem';
import { Rng } from '../../src/engine/rng';
import { newGame, type GameState } from '../../src/engine/state';
import { PROFILES, type Ctx } from './profiles';

export interface RunOpts {
  profile: string;
  seed: number;
  hours: number;
  /** pas de simulation (s). Le jeu réel utilise 0.1 ; 0.5 = bot historique. */
  dt?: number;
  /** événements mondiaux actifs (horloge UTC réelle simulée) */
  events?: boolean;
  /** début de la partie (ms UTC) ; défaut : lundi 16/11/2026 0 h UTC + startOffsetMin */
  start?: number;
  /** décalage du départ en minutes. Défaut : 50 avec événements (hors de la fenêtre 0 h–0 h 45, sinon l'objectif
   *  du premier événement est calculé sur un Runtime neuf et tombe au plancher — QA-03/PBA-03), 0 sans. */
  startOffsetMin?: number;
}

export interface RunResult {
  profile: string; seed: number; hours: number; dt: number; events: boolean;
  gen: number; lives: number; legacyTotal: number; legacyUnspent: number;
  /** valeur totale produite (Σ totalEver × valeur), échelle log10 */
  log10Value: number;
  res: Record<string, number>;
  /** secondes de jeu avant déblocage (-1 = jamais) */
  unlockAt: Record<string, number>;
  upgradeAt: Record<string, number>;
  buildings: Record<string, number>;
  upgrades: Record<string, number>;
  /** part de la production (valeur) venant des Échos — approximation par moyenne glissante du moteur */
  echoShare: number;
  harmonyAvg: number; harmonyMin: number;
  /** part du temps héros (en activité) par activité */
  heroActShare: Record<string, number>;
  /** part des secondes d'Échos par activité (Échos conservés en fin de partie) */
  echoActShare: Record<string, number>;
  pausedShare: number;
  /** combinaisons de traits distinctes sur les 60 dernières générations */
  traitCombos60: number;
  /** fréquence de chaque trait chez les 60 derniers ancêtres */
  traitFreq60: Record<string, number>;
  epithetsFound: number; epithetLives: number;
  eclatsEnd: number; eventsDone: number;
  /** palier atteint (0 à 3) à chaque fenêtre d'événement vue, dans l'ordre */
  eventTiers: number[];
  married: number;
  vocationTierMax: number;
  /**
   * Raretés aux successions (0.3) : nombre de successions, dont celles qui proposent au moins un héritier
   * légendaire / épique (hors Bénédictions) ; héros choisis légendaires ; évolutions ; Étoiles filantes
   * proposées et vécues ; légendaires obtenus par évolution ; hauts faits obtenus.
   */
  traits?: { succ: number; offerLeg: number; offerEpic: number; offerEpicMut: number; offerLegMut: number; heroLeg: number; evo: number; evoLeg: number; novaOffered: number; novaLived: number };
  feats?: string[];
  /** points de contrôle horaires */
  hourly: { h: number; log10Value: number; gen: number; legacyTotal: number; valueRate: number }[];
  /** anomalies détectées (NaN, négatifs, Infinity) */
  anomalies: string[];
  ms: number;
}

const totalValue = (s: GameState) => RES.reduce((a, r) => a + s.totalEver[r] * RES_INFO[r].value, 0);

function checkAnomalies(s: GameState, out: string[], t: number) {
  if (out.length > 20) return;
  for (const r of RES) {
    const x = s.res[r];
    if (!Number.isFinite(x)) out.push(`t=${t.toFixed(0)} res.${r}=${x}`);
    else if (x < -1e-9) out.push(`t=${t.toFixed(0)} res.${r} négatif (${x})`);
  }
  for (const k of ['F', 'G'] as const) if (!Number.isFinite(s.eco[k])) out.push(`t=${t.toFixed(0)} eco.${k}=${s.eco[k]}`);
  if (!Number.isFinite(s.legacy) || s.legacy < 0) out.push(`t=${t.toFixed(0)} legacy=${s.legacy}`);
}

export function runGame(o: RunOpts): RunResult {
  const t0 = performance.now();
  const prof = PROFILES[o.profile];
  if (!prof) throw new Error(`Profil inconnu : ${o.profile} (dispo : ${Object.keys(PROFILES).join(', ')})`);
  const dt = o.dt ?? 0.5;
  const events = o.events ?? false;
  const start = (o.start ?? Date.UTC(2026, 10, 16)) + (o.startOffsetMin ?? (events ? 50 : 0)) * 60_000;
  const s = newGame(start, o.seed);
  const rt = newRuntime();
  rt.online = events;
  startLife(s);
  const c: Ctx = { t: 0, now: start, rt, rng: new Rng(o.seed ^ 0x9e3779b9), mem: {} };
  const total = o.hours * 3600;
  const unlockAt: Record<string, number> = {};
  const upgradeAt: Record<string, number> = {};
  const actTime: Record<string, number> = Object.fromEntries(ACTS.map((a) => [a, 0]));
  let paused = 0, live = 0, hSum = 0, hN = 0, hMin = 1, echoV = 0, allV = 0, married = 0, vocMax = 0;
  let nextDecide = 0, nextBuy = 0, succAt = -1;
  const tr = { succ: 0, offerLeg: 0, offerEpic: 0, offerEpicMut: 0, offerLegMut: 0, heroLeg: 0, evo: 0, evoLeg: 0, novaOffered: 0, novaLived: 0 };
  let seenSucc: unknown = null;
  const rarOf = (id: string) => (TRAIT[id] && !TRAIT[id].neg ? TRAIT[id].rarity : -1);
  const observe = () => {
    const sc = s.succession!;
    if (sc === seenSucc) return;
    seenSucc = sc;
    tr.succ++;
    const own = (h: { traits: string[] }) => h.traits.filter((t) => !s.blessings.includes(t));
    if (sc.heirs.some((h) => own(h).some((t) => rarOf(t) === 3))) tr.offerLeg++;
    if (sc.heirs.some((h) => own(h).some((t) => rarOf(t) === 2))) tr.offerEpic++;
    // « D'un coup » : un épique ou légendaire qui ne vient ni des parents, ni d'une évolution (mutation).
    const fromKin = new Set([...s.hero.traits, ...(s.hero.spouse?.traits ?? [])]);
    const mut = (h: { traits: string[]; evolved?: string[] }, r: number) => own(h).some((t) => rarOf(t) === r && !fromKin.has(t) && !(h.evolved ?? []).includes(t));
    if (sc.heirs.some((h) => mut(h, 2))) tr.offerEpicMut++;
    if (sc.heirs.some((h) => mut(h, 3) && !h.traits.some((t) => TRAIT[t]?.nova && rarOf(t) === 3 && own(h).filter((x) => rarOf(x) === 3).length === 1))) tr.offerLegMut++;
    if (sc.heirs.some((h) => h.traits.some((t) => TRAIT[t]?.nova))) tr.novaOffered++;
    if (sc.noEcho) tr.novaLived++;
    for (const h of sc.heirs) for (const t of h.evolved ?? []) { tr.evo++; if (rarOf(t) === 3) tr.evoLeg++; }
  };
  const anomalies: string[] = [];
  const hourly: RunResult['hourly'] = [];
  let lastHourV = 0;
  let sessionEnd = prof.sessions ? prof.sessions[0] * 60 : Infinity;

  let lastMin = 0, lastHour = 0;
  /** Comptabilité d'un pas (en ligne ou hors ligne). */
  const account = (step: number) => {
    const g = RES.reduce((a, r) => a + rt.tickGross[r] * RES_INFO[r].value, 0);
    allV += g; echoV += rt.echoRate * step;
    const hh = ecoHealth(s.eco); hSum += hh * step; hN += step; hMin = Math.min(hMin, hh);
    const m = Math.floor(c.t / 60);
    if (m !== lastMin) { lastMin = m; checkAnomalies(s, anomalies, c.t); }
    hourMark();
  };
  /** Points de contrôle horaires (aussi pendant les absences). */
  const hourMark = () => {
    while (Math.floor(c.t / 3600 + 1e-9) > lastHour) {
      lastHour++;
      const v = totalValue(s);
      hourly.push({ h: lastHour, log10Value: Math.log10(Math.max(1, v)), gen: s.hero.gen, legacyTotal: s.legacyTotal, valueRate: (v - lastHourV) / 3600, F: Math.round(s.eco.F), G: Math.round(s.eco.G), echoes: s.echoes.length, garde: s.buildings.garde ?? 0 } as any);
      lastHourV = v;
    }
  };
  while (c.t < total) {
    // Session terminée : départ hors ligne. Réplique exacte de simulateOffline (game.ts) — mêmes appels
    // tick(s, rt, 1, …), même plafond, même seuil de 30 s — mais pas à pas, pour mesurer la part des Échos,
    // l'Harmonie et les points horaires pendant l'absence (DATA-03, DATA-09).
    if (c.t >= sessionEnd && prof.sessions) {
      const off = Math.min(prof.sessions[1] * 3600, total - c.t);
      const sec = Math.min(off, offlineCapSec(s));
      const t0 = c.t;
      if (sec >= 30) {
        rt.online = false;
        rt.offline = true;
        const startMs = c.now + (off - sec) * 1000;
        c.t = t0 + (off - sec);
        const steps = Math.floor(sec);
        for (let i = 0; i < steps; i++) {
          tick(s, rt, 1, startMs + i * 1000);
          c.t += 1;
          account(1);
        }
        rt.online = events;
        rt.offline = false;
      }
      c.t = t0 + off; c.now += off * 1000;
      hourMark();
      sessionEnd = c.t + prof.sessions[0] * 60;
      nextDecide = nextBuy = c.t;
      if (s.succession) succAt = c.t;
      continue;
    }
    if (s.life && c.t >= nextDecide) {
      const a = prof.activity(s, c);
      if (a !== s.life.act) setActivity(s, a);
      nextDecide = c.t + prof.decideEvery;
    }
    if (s.life) { live += dt; if (s.life.act) actTime[s.life.act] += dt; else paused += dt; }
    const hadSpouse = !!s.hero.spouse;
    c.now += dt * 1000;
    tick(s, rt, dt, c.now);
    c.t += dt;
    account(dt);
    if (s.succession) {
      observe();
      if (succAt < 0) succAt = c.t + prof.successionDelay;
      if (c.t >= succAt) {
        prof.succession(s, c); succAt = -1;
        if (s.hero.vocation) vocMax = Math.max(vocMax, s.hero.vocation.tier);
        if (s.hero.traits.some((t) => rarOf(t) === 3)) tr.heroLeg++;
      }
    }
    if (c.t >= nextBuy) { prof.buy(s, c); nextBuy = c.t + prof.buyEvery; }
    if (!hadSpouse && s.hero.spouse) married++;
    for (const a of s.unlocked) if (unlockAt[a] === undefined) unlockAt[a] = c.t;
    for (const k in s.upgrades) if (upgradeAt[k] === undefined) upgradeAt[k] = c.t;
    hourMark();
  }
  checkAnomalies(s, anomalies, c.t);

  const echoSec: Record<string, number> = Object.fromEntries(ACTS.map((a) => [a, 0]));
  let echoTot = 0;
  for (const e of s.echoes) for (const x of e.acts) if (x >= 0) { echoSec[ACTS[x]]++; echoTot++; }
  const last = s.ancestors.slice(-60);
  const combos = new Set(last.map((a) => [...a.traits].sort().join('+')));
  const freq: Record<string, number> = {};
  for (const a of last) for (const t of a.traits) freq[t] = (freq[t] ?? 0) + 1 / Math.max(1, last.length);
  const actTot = Object.values(actTime).reduce((a, b) => a + b, 0) || 1;
  for (const a of ACTS) if (unlockAt[a] === undefined) unlockAt[a] = -1;
  return {
    profile: o.profile, seed: o.seed, hours: o.hours, dt, events,
    gen: s.hero.gen, lives: s.stats.lives, legacyTotal: s.legacyTotal, legacyUnspent: s.legacy,
    log10Value: Math.log10(Math.max(1, totalValue(s))),
    res: { ...s.res }, unlockAt, upgradeAt, buildings: { ...s.buildings }, upgrades: { ...s.upgrades },
    echoShare: allV > 0 ? echoV / allV : 0,
    harmonyAvg: hN ? hSum / hN : 0, harmonyMin: hMin,
    heroActShare: Object.fromEntries(ACTS.map((a) => [a, actTime[a] / actTot])),
    echoActShare: Object.fromEntries(ACTS.map((a) => [a, echoTot ? echoSec[a] / echoTot : 0])),
    pausedShare: live ? paused / live : 0,
    traitCombos60: combos.size, traitFreq60: freq,
    epithetsFound: Object.keys(s.epithets).length, epithetLives: s.ancestors.filter((a) => a.epithet).length,
    eclatsEnd: s.eclats, eventsDone: s.stats.eventsDone, eventTiers: Object.keys(s.events).sort().map((k) => s.events[k].tier), married, vocationTierMax: vocMax,
    traits: tr, feats: Object.keys((s as { feats?: Record<string, number> }).feats ?? {}),
    hourly, anomalies, ms: Math.round(performance.now() - t0),
  };
}
