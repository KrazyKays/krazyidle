// Chantier B (inventaire des seuils) : mesure, vie par vie, des seuils des Chroniques, des dons qui mûrissent
// et des hauts faits, avec la part qui dépend du Domaine. Enveloppe les profils de lab/sim sans les modifier.
// Usage : node --import ./lab/sim/register.mjs lab/design/seuils-mesure.ts <profil> <graines> <heures> [events 0|1] [dt]
// Sortie : un JSON de synthèse sur stdout.
import { EPITHETS, EPITHET } from '../../src/engine/epithets';
import { EVOLUTIONS } from '../../src/engine/evolution';
import { lifeFacts } from '../../src/engine/game';
import { PROFILES, type Profile } from '../sim/profiles';
import { runGame } from '../sim/runner';
import type { GameState, LifeState } from '../../src/engine/state';

const [pid = 'experimente', nSeeds = '20', hrs = '6', ev = '0', dtS = '0.5'] = process.argv.slice(2);
const base = PROFILES[pid];
const seeds = Number(nSeeds), hours = Number(hrs), events = ev === '1', dt = Number(dtS);

// Conditions du Domaine (copiées des règles du moteur, pour savoir si c'est le Domaine qui tranche).
const DOMAIN_EPITHETS = new Set(['glorieux', 'ermite', 'juste', 'devastateur', 'boucher', 'jardinier', 'semeur', 'grand_veneur']);
const agg = {
  lives: 0, livesAfterChron: 0, epAfterChron: 0,
  chosen: {} as Record<string, number>,
  eligible: {} as Record<string, number>,
  /** vies où le surnom retenu est lié au Domaine (harmonie, consignes, Gibier) */
  chosenDomain: 0,
  /** conditions d'Harmonie des dons (indépendamment du trait porté) */
  hAvg95: 0, hMin90avg97: 0, cult50: 0, cult50hAvg97min90: 0, cult50hMin95: 0, med60noCom: 0, med60noComH80: 0,
  /** évolutions mûres (le porteur avait le trait et la vie l'a mérité) */
  ripe: {} as Record<string, number>,
  /** porteurs du trait source (vies) */
  carriers: {} as Record<string, number>,
  feats: {} as Record<string, number>,
  featAt: {} as Record<string, number[]>,
  runs: 0,
  chronAt: [] as number[], allianceAt: [] as number[],
  hAvgAll: [] as number[],
};
const inc = (o: Record<string, number>, k: string, n = 1) => { o[k] = (o[k] ?? 0) + n; };

for (let seed = 1; seed <= seeds; seed++) {
  let lastLife: LifeState | null = null;
  let seen: unknown = null;
  let tNow = 0;
  const featsSeen = new Set<string>();
  const p: Profile = {
    ...base,
    id: 'seuils',
    activity: (s, c) => { lastLife = s.life; tNow = c.t; return base.activity(s, c); },
    succession: (s: GameState, c) => {
      const sc = s.succession;
      if (sc && sc !== seen && lastLife) {
        seen = sc;
        const f = lifeFacts(s, lastLife, sc.vocationEarned);
        agg.lives++;
        agg.hAvgAll.push(f.harmonyAvg);
        if (f.harmonyAvg >= 0.95) agg.hAvg95++;
        if (f.harmonyMin >= 0.9 && f.harmonyAvg >= 0.97) agg.hMin90avg97++;
        if (f.share.cultiver >= 0.5) {
          agg.cult50++;
          if (f.harmonyAvg >= 0.97 && f.harmonyMin >= 0.9) agg.cult50hAvg97min90++;
          if (f.harmonyMin >= 0.95) agg.cult50hMin95++;
        }
        if (f.share.mediter >= 0.6 && f.share.commercer === 0) { agg.med60noCom++; if (f.harmonyAvg >= 0.8) agg.med60noComH80++; }
        for (const t of s.hero.traits) inc(agg.carriers, t);
        for (const e of EVOLUTIONS) if (s.hero.traits.includes(e.from) && e.test(f)) inc(agg.ripe, `${e.from}>${e.to}`);
        if (s.upgrades.chroniques) {
          agg.livesAfterChron++;
          if (sc.epithet) { agg.epAfterChron++; inc(agg.chosen, sc.epithet.id); if (DOMAIN_EPITHETS.has(sc.epithet.id)) agg.chosenDomain++; }
          for (const e of EPITHETS) if (e.test(f)) inc(agg.eligible, e.id);
        }
        for (const id of Object.keys(s.feats ?? {})) if (!featsSeen.has(id)) { featsSeen.add(id); (agg.featAt[id] ??= []).push(Math.round(c.t / 60)); }
      }
      base.succession(s, c);
      for (const id of Object.keys(s.feats ?? {})) if (!featsSeen.has(id)) { featsSeen.add(id); (agg.featAt[id] ??= []).push(Math.round(c.t / 60)); }
    },
  };
  PROFILES.seuils = p;
  const r = runGame({ profile: 'seuils', seed, hours, events, dt });
  agg.runs++;
  for (const id of r.feats ?? []) inc(agg.feats, id);
  if (r.upgradeAt.chroniques >= 0) agg.chronAt.push(r.upgradeAt.chroniques / 60);
  if (r.upgradeAt.alliances >= 0) agg.allianceAt.push(r.upgradeAt.alliances / 60);
  void tNow;
}

const q = (a: number[], p: number, d = 10) => { if (!a.length) return null; const b = [...a].sort((x, y) => x - y); return Math.round(b[Math.min(b.length - 1, Math.floor(p * b.length))] * d) / d; };
const pct = (n: number, d: number) => (d ? Math.round((1000 * n) / d) / 10 : null);
const out = {
  profile: pid, seeds, hours, events, dt,
  lives: agg.lives,
  livesAfterChron: agg.livesAfterChron,
  epithetShareAfterChron: pct(agg.epAfterChron, agg.livesAfterChron),
  chosen: Object.fromEntries(Object.entries(agg.chosen).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, `${v} (${pct(v, agg.epAfterChron)} %)`])),
  chosenDomainShare: pct(agg.chosenDomain, agg.epAfterChron),
  eligibleShare: Object.fromEntries(Object.entries(agg.eligible).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, pct(v, agg.livesAfterChron)])),
  neverEligible: EPITHETS.filter((e) => !agg.eligible[e.id]).map((e) => `${e.id}(${EPITHET[e.id].rarity})`),
  harmony: {
    hAvgP10: q(agg.hAvgAll, 0.1, 1000), hAvgP50: q(agg.hAvgAll, 0.5, 1000),
    'santé moy ≥95 % (Robuste→Longévité)': pct(agg.hAvg95, agg.lives),
    'min ≥90 et moy ≥97 (Longévité→Centenaire)': pct(agg.hMin90avg97, agg.lives),
    'Récolter ≥50 %': pct(agg.cult50, agg.lives),
    'dont Juste (moy ≥97, min ≥90)': pct(agg.cult50hAvg97min90, agg.cult50),
    'dont min ≥95 (Récolte raisonnée, hors Crypte)': pct(agg.cult50hMin95, agg.cult50),
    'Méditer ≥60 % sans Commercer': pct(agg.med60noCom, agg.lives),
    'dont Ermite (moy ≥80)': pct(agg.med60noComH80, agg.med60noCom),
  },
  ripeRate: Object.fromEntries(Object.entries(agg.ripe).map(([k, v]) => [k, `${v}/${agg.carriers[k.split('>')[0]] ?? 0}`])),
  feats: Object.fromEntries(Object.entries(agg.feats).map(([k, v]) => [k, `${pct(v, agg.runs)} % (p50 ${q(agg.featAt[k] ?? [], 0.5)} min)`])),
  chroniquesMin: { n: agg.chronAt.length, p10: q(agg.chronAt, 0.1), p50: q(agg.chronAt, 0.5), p90: q(agg.chronAt, 0.9) },
  alliancesMin: { n: agg.allianceAt.length, p10: q(agg.allianceAt, 0.1), p50: q(agg.allianceAt, 0.5), p90: q(agg.allianceAt, 0.9) },
};
console.log(JSON.stringify(out, null, 1));
