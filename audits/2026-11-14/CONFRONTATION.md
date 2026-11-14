# Phase 2 — Confrontation des avis (Technical Lead)

Les cinq rapports de phase 1 sont rédigés. Ce document liste les **conclusions communes** (pas de débat nécessaire) et les **divergences** à trancher. Chaque agent répond uniquement aux points qui lui sont adressés, dans `audits/2026-11-14/confrontation/<agent>.md`, avec la même rigueur de preuve (étiquettes [MESURÉ]/[SIMULÉ]/[CODE]/[HYPOTHÈSE]). Pour chaque point : **Je confirme / je nuance / je conteste**, la preuve, et la conséquence sur la priorité ou la correction.

Règles : réutiliser en priorité les données existantes ; nouvelle simulation seulement si elle tranche le désaccord (`--workers=2`, ID `C1xx`…`C5xx`, ligne dans `CAMPAIGNS.md`). Toujours lecture seule sur le jeu.

## A. Conclusions communes (retenues sans débat)

| # | Conclusion | Constats convergents | Vérification du Lead |
|---|---|---|---|
| A1 | « Le Vénérable » monopolise les surnoms (59 à 100 % des vies surnommées) ; 1 surnom sur 34 en pratique | DATA-01, GD-04, PBA-07 | — |
| A2 | L'objectif d'événement tombe au plancher si le Runtime est neuf au début d'une fenêtre (relance du jeu) ; la référence C001 est biaisée | QA-03, PBA-03, (GD piste) | Le Lead relance C001 hors fenêtre |
| A3 | La production est perdue quand le moteur ne tourne pas : onglet masqué (sauvegarde périodique qui avance `lastTick`), gel du fil, plafond de 60 pas/trame | PBA-01, QA-06 | **[CODE] confirmé** `src/main.ts:58,62-70,96-106,114` |
| A4 | Import de sauvegarde et réinitialisation écrasés par la sauvegarde de `pagehide` | QA-10 | **[CODE] confirmé** `src/main.ts:33-40,119` |
| A5 | Spécialiser bat varier ; Commercer seul domine ; Méditer est mort en production ; Chasseur bien sous l'annonce du GDD | BAL-01, BAL-02, GD-06, PBA-06, DATA-08 | — |
| A6 | Alliances et Chroniques arrivent tard pour les profils « gourmands » ; épargner les avance sans perte | GD-01, PBA-12, DATA-06 | — |
| A7 | Le joueur occasionnel est bloqué : la lignée s'arrête à la première mort hors ligne (succession en attente) | GD-03, DATA-09, PBA-11 | — |
| A8 | Codes d'alliance : réutilisation et usurpation possibles | QA-04, QA-07, PBA-09 | — |
| A9 | L'outillage du Lead a des défauts de mesure (moyenne de −1, `echoShare` hors ligne, `sim:compare` sans test de significativité) | DATA-02, DATA-03, DATA-04 | Le Lead corrige `lab/sim` (outillage, pas le jeu) |

## B. Divergences à trancher

### B1. Le choix des Échos compte-t-il ?
- GD-02 : la présélection se trompe dans 12–17 % des successions, trier par vraie force donne **×1,14** de production.
- PBA-14 : règles de choix différentes → **8,00 / 8,00 / 7,99** log10, « non décisif ».
- **Répondent : game-designer, player-behavior-analyst.** Les deux mesures portent-elles sur la même chose (horizon, profil, part des Échos dans la valeur) ? Laquelle est juste, ou sont-elles compatibles ? Quelle priorité au final ?

### B2. Les Alliances méritent-elles une priorité Élevée sur leur accès (GD-01) si elles n'ont pas d'effet mesurable (PBA-08) ?
- **Répondent : game-designer, player-behavior-analyst, game-balancer.** Le problème est-il « trop tard », « sans effet », ou les deux ? Quel est l'effet réel d'un bon mariage (don légendaire du conjoint, vocation +1) sur la valeur à 6 h et 12 h ?

### B3. Destin du jour : stratégie dominante ou non ?
- GD (point fort) : « aucune stratégie simple ne domine ».
- PBA-10 : « une seule touche est optimale », gain médian du bot ×1,000, palier Or 7 % des jours.
- BAL-06 : meilleur score 506 ± 201 selon la date, une seule activité optimale 4 jours sur 14, palier Or 2 jours sur 14.
- **Répondent : game-designer, player-behavior-analyst, game-balancer.** Accordez vos définitions (« dominante » = la même sur toutes les dates ? ou une seule activité suffit chaque jour ?). Le vrai problème est-il la dominance, la variance par date, ou des paliers mal calibrés ?

### B4. La sensibilité au pas `dt` change-t-elle une recommandation ?
- BAL : conclusions robustes (Commercer domine 50/50 à dt 0,1).
- QA-08 : l'optimiseur chasse 35,5 % à dt 0,1 contre 8,5 % à dt 0,5.
- DATA-07 : l'optimiseur perd 15,7 % de valeur à dt 0,1 (z −2,3).
- **Répondent : qa-engineer, game-balancer, game-data-analyst.** Est-ce un artefact du profil `optimiseur` (décision toutes les 1 s, seuils d'Affût) ou du moteur ? Quelles conclusions doivent obligatoirement être revalidées à dt 0,1 avant d'appliquer une correction ?

### B5. Une vie plus longue est-elle meilleure ?
- BAL-04 : Centenaire ×0,82, Longévité ×0,95, vie de base ×1,5 → −20 % de générations et perte de valeur.
- GDD 2.2 : une vie longue donne une meilleure moyenne d'Écho (≈ +50 % entre 60 s et 180 s).
- **Répondent : game-balancer, game-designer.** Les deux sont-ils vrais en même temps (meilleur Écho mais moins d'Héritage) ? Les traits de durée de vie sont-ils des pièges pour le joueur ? Quelle correction minimale ?

### B6. Le Domaine (écosystème) est-il un système décoratif ?
- BAL-05 : pression des Échos ±50 % → |Δ| ≤ 0,008 log10 ; Garde forestier rentabilisé en > 85 000 s.
- DATA : Harmonie de l'optimiseur bimodale (p50 0,818) ; mono-cultiver 0,869.
- GD : l'Affût est un automatisme (GD-10).
- **Répondent : game-designer, game-data-analyst, game-balancer.** L'écosystème influence-t-il une décision du joueur aujourd'hui ? Le pilier « l'optimum n'est pas le maximum » est-il tenu ?

### B7. Correction proposée BAL-02 (Commercer 1,5 → 1,1 Or ; Méditer 0,06 → 0,15 Essence), testée en C207
- **Répondent : player-behavior-analyst, game-designer, game-data-analyst.** Effets secondaires : le piège de vocation (PBA-05) disparaît-il ou s'inverse-t-il ? La boucle Commercer → Étudier → Méditer reste-t-elle lisible ? Les garde-fous (`lab/metrics/guardrails.ts`, C000 vs C207 si comparable) passent-ils ? Proposez au besoin une variante plus prudente.

### B8. Bazar céleste et Bénédictions
- QA-01 : une Bénédiction achetée pendant la succession est perdue (bug).
- PBA-15 : Bazar quasi sans effet (Éclats illimités → ×2 de valeur, Héritage inchangé).
- **Répond : game-balancer.** Le Bazar a-t-il un rôle d'équilibrage à préserver ou est-il cosmétique ? Priorité relative du bug QA-01.

### B9. Mutations : 11,4 % d'héritiers sans mutation (QA-05)
- [CODE] `game.ts` : 1re mutation à 85 %, 2e à 25 % → P(0) = 0,15 × 0,75 ≈ 11,25 %, plus les tirages dont le vivier est vide. Le code semble intentionnel, le GDD imprécis.
- **Répond : qa-engineer.** Confirmer que l'écart s'explique entièrement ainsi, et requalifier (bug de code ou correction du GDD).

### B10. Vénérable : correction et garde-fou
- **Répondent : game-balancer (correction proposée, effets), game-data-analyst (garde-fou chiffré : distribution cible des surnoms).**

## C. Note du Lead sur l'outillage (pendant la phase 2)

`lab/sim` a été corrigé (DATA-02, 03, 04, 09 ; QA-03/PBA-03). **Sans événements, les parties sont identiques au bit près** (vérifié sur 60 parties, C006). Changements :
- `unlock.*` / `upgradeAt.*` excluent « jamais » ; nouvelles colonnes `never.*` ; `n` affiché.
- Le profil à sessions est simulé hors ligne pas à pas (réplique exacte de `simulateOffline`) : `echoShare`, Harmonie (pondérée par le temps) et points horaires sont mesurés pendant l'absence.
- Avec `--events`, la partie démarre par défaut à 0 h 50 UTC (`--start-offset-min`, 50 par défaut), hors fenêtre d'événement. **Les campagnes avec événements lancées avant cette correction (C001, C202, C301…) ont un premier objectif au plancher.** Nouvelle référence : C002.
- `npm run sim:compare` refuse les campagnes incomparables (code 2) ; la décision passe par `npm run sim:guard` (= `lab/metrics/guardrails.ts`).
