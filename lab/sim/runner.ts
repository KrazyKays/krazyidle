// Exécute une partie complète avec un profil et collecte les indicateurs (voir lab/metrics/KPIS.md).
import { ACTS, RES, RES_INFO } from '../../src/engine/data';
import { newRuntime, setActivity, simulateOffline, startLife, tick } from '../../src/engine/game';
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
  /** début de la partie (ms UTC) ; défaut : lundi 16/11/2026 0 h UTC */
  start?: number;
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
  married: number;
  vocationTierMax: number;
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
  for (const k of ['F', 'G', 'P'] as const) if (!Number.isFinite(s.eco[k])) out.push(`t=${t.toFixed(0)} eco.${k}=${s.eco[k]}`);
  if (!Number.isFinite(s.legacy) || s.legacy < 0) out.push(`t=${t.toFixed(0)} legacy=${s.legacy}`);
}

export function runGame(o: RunOpts): RunResult {
  const t0 = performance.now();
  const prof = PROFILES[o.profile];
  if (!prof) throw new Error(`Profil inconnu : ${o.profile} (dispo : ${Object.keys(PROFILES).join(', ')})`);
  const dt = o.dt ?? 0.5;
  const events = o.events ?? false;
  const start = o.start ?? Date.UTC(2026, 10, 16);
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
  const anomalies: string[] = [];
  const hourly: RunResult['hourly'] = [];
  let lastHourV = 0;
  let sessionEnd = prof.sessions ? prof.sessions[0] * 60 : Infinity;

  while (c.t < total) {
    // Session terminée : départ hors ligne
    if (c.t >= sessionEnd && prof.sessions) {
      const off = Math.min(prof.sessions[1] * 3600, total - c.t);
      const v0 = totalValue(s);
      simulateOffline(s, rt, off, c.now + off * 1000);
      allV += totalValue(s) - v0; // hors ligne : la part Échos n'est pas mesurable finement
      c.t += off; c.now += off * 1000;
      rt.online = events;
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
    const g = RES.reduce((a, r) => a + rt.tickGross[r] * RES_INFO[r].value, 0);
    allV += g; echoV += rt.echoRate * dt;
    const hh = ecoHealth(s.eco); hSum += hh; hN++; hMin = Math.min(hMin, hh);
    if (s.succession) {
      if (succAt < 0) succAt = c.t + prof.successionDelay;
      if (c.t >= succAt) { prof.succession(s, c); succAt = -1; if (s.hero.vocation) vocMax = Math.max(vocMax, s.hero.vocation.tier); }
    }
    if (c.t >= nextBuy) { prof.buy(s, c); nextBuy = c.t + prof.buyEvery; }
    if (!hadSpouse && s.hero.spouse) married++;
    for (const a of s.unlocked) if (unlockAt[a] === undefined) unlockAt[a] = c.t;
    for (const k in s.upgrades) if (upgradeAt[k] === undefined) upgradeAt[k] = c.t;
    if (Math.floor(c.t / 60) !== Math.floor((c.t - dt) / 60)) checkAnomalies(s, anomalies, c.t);
    if (Math.floor(c.t / 3600) !== Math.floor((c.t - dt) / 3600)) {
      const v = totalValue(s);
      hourly.push({ h: Math.round(c.t / 3600), log10Value: Math.log10(Math.max(1, v)), gen: s.hero.gen, legacyTotal: s.legacyTotal, valueRate: (v - lastHourV) / 3600 });
      lastHourV = v;
    }
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
    eclatsEnd: s.eclats, eventsDone: s.stats.eventsDone, married, vocationTierMax: vocMax,
    hourly, anomalies, ms: Math.round(performance.now() - t0),
  };
}
