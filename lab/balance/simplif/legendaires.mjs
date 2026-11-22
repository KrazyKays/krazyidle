// Effet de la neutralisation de la santé du Domaine sur les dons et les raretés (complète lab/balance/evo/kpi.mjs).
//   node lab/balance/simplif/legendaires.mjs <id> [...]
// Colonnes : successions proposant un légendaire (hors Bénédictions), héros légendaires choisis, parties avec ≥ 1
// légendaire obtenu par évolution, fréquence chez les 60 derniers ancêtres de Robuste → Longévité → Centenaire →
// Éternel et d'Élu, haut fait « Récolte raisonnée », surnoms distincts.
import { readFileSync } from 'node:fs';
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
for (const id of process.argv.slice(2)) {
  const runs = readFileSync(`lab/results/${id}/runs.jsonl`, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const by = {};
  for (const r of runs) (by[r.profile] ??= []).push(r);
  console.log(`\n${id}\n| profil | offre lég. | héros lég. | parties ≥1 lég. évolué | robuste | longévité | centenaire | éternel | élu | Récolte raisonnée | surnoms distincts |\n|---|---|---|---|---|---|---|---|---|---|---|`);
  for (const [p, rs] of Object.entries(by)) {
    const sum = (k) => rs.reduce((a, r) => a + (r.traits?.[k] ?? 0), 0);
    const succ = sum('succ');
    const fr = (t) => (mean(rs.map((r) => r.traitFreq60[t] ?? 0)) * 100).toFixed(1) + ' %';
    const pc = (k) => (sum(k) / succ * 100).toFixed(2) + ' %';
    const feat = rs.filter((r) => (r.feats ?? []).includes('recolte_raisonnee')).length;
    console.log(`| ${p} | ${pc('offerLeg')} | ${pc('heroLeg')} | ${(rs.filter((r) => (r.traits?.evoLeg ?? 0) > 0).length / rs.length * 100).toFixed(1)} % | ${fr('robuste')} | ${fr('longevite')} | ${fr('centenaire')} | ${fr('eternel')} | ${fr('elu')} | ${feat}/${rs.length} | ${mean(rs.map((r) => r.epithetsFound)).toFixed(2)} |`);
  }
}
