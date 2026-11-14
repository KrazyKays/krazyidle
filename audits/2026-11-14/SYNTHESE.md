# Synthèse de l'audit et feuille de route — Échos de Lignée 0.2.1

*Technical Lead · 2026-11-14 · code audité : `a53d1b5` (identique jusqu'à `84f765c` : aucun fichier du jeu modifié pendant l'audit)*

> **Statut : en attente de validation.** Aucune correction n'est appliquée. Le verrou `.claude/AUDIT_LOCK` reste en place jusqu'à ton accord.

## 1. Résumé

Le cœur du jeu fonctionne et tient sa promesse principale : les Échos portent 86 à 93 % de la production, le choix de l'héritier pèse vraiment (au hasard : ×0,61), le moteur est déterministe, sans aucune anomalie numérique sur l'ensemble des parties simulées, et le Destin du jour est inviolable par code truqué.

En revanche l'audit établit :

1. **Deux bugs critiques côté navigateur**, confirmés dans le code par le Lead :
   - la progression est perdue onglet masqué ou fil gelé ;
   - l'import de sauvegarde et la réinitialisation sont écrasés au rechargement.
2. **Une économie à stratégie unique.**
   - Commercer toute sa vie gagne sur 198 graines sur 200, et Méditer est mort en production (×0,04).
   - Le Domaine récompense la surexploitation, contrairement au pilier « l'optimum n'est pas le maximum ».
   - Les événements sont inatteignables en jeu normal : aucun palier en 6 h pour le profil expérimenté, une fois le biais de mesure retiré (C002).
3. **Des systèmes de fin de partie qui ne tiennent pas leurs promesses.**
   - Un seul surnom sur 34 sort en pratique : « le Vénérable » prend 59 à 100 % des vies.
   - Les Alliances coûtent au lieu de rapporter, à cause de la dot.
   - Le joueur occasionnel voit sa lignée s'arrêter dès la première mort hors ligne.

## 2. Ce qui a été réellement exécuté

| Élément | Volume | Nature |
|---|---|---|
| Campagnes de simulation consignées | 40 lignes dans `lab/campaigns/CAMPAIGNS.md` (C000–C006, C101–C103, C201–C212, C300–C314, C401–C406, C501–C502) | [SIMULÉ], graines reproductibles |
| Parties de référence | C000 : 1 800 parties de 6 h ; C002 : 600 parties de 6 h avec événements, départ hors fenêtre | [SIMULÉ] |
| Tests automatisés | `npm test` : 13 fichiers, **145 réussis + 7 échecs attendus** (bugs reproduits, `test.fails`) ; `npm run typecheck` OK — relancé par le Lead | [MESURÉ] |
| Parcours navigateur | Playwright, Chromium headless : iPhone 13 et 1 440 px, import/réinitialisation, onglet masqué (émulé) | [MESURÉ] |
| Lecture de code | Moteur complet, `main.ts`, UI ciblée | [CODE] |

**Limites à garder en tête :**
- Aucun vrai joueur n'a été observé.
- Les profils sont des heuristiques.
- Un seul navigateur a été testé, et le masquage d'onglet est émulé.
- La plupart des campagnes tournent à `dt` 0,5 s, alors que le jeu tourne à 0,1 s. Le moteur y est peu sensible (chasse −1 à −3 %), mais le profil `optimiseur` l'est (B4).

Rapports :
- par agent : `qa-engineer.md`, `game-designer.md`, `game-balancer.md`, `player-behavior-analyst.md`, `game-data-analyst.md` ;
- confrontation : `CONFRONTATION.md` et `confrontation/*.md` ;
- tableau de bord : `lab/reports/dashboard.html`.

## 3. Constats consolidés

Les identifiants entre parenthèses renvoient aux rapports. « Accord » indique combien d'agents ont trouvé le problème indépendamment.

### Critique

| # | Problème | Preuve | Accord |
|---|---|---|---|
| **P1** | **Temps de jeu perdu** quand le moteur ne tourne pas. Onglet masqué 30 min : 9 pts au lieu de 61 732. Gel du fil : 7 s de jeu pour 22 s réelles. Cause : `save()` avance `lastTick` toutes les 10 s sans simuler, pas plafonné à 5 s par trame, seuil de rattrapage à 30 s (PBA-01, QA-06). | [MESURÉ] Playwright émulé, [CODE] `main.ts:58,62-70,96-106,114` vérifié par le Lead | 2 |
| **P2** | **Import de sauvegarde et réinitialisation sans effet** : le `pagehide` du rechargement réécrit l'ancienne partie (QA-10). | [MESURÉ] Chromium, [CODE] `main.ts:33-40,119` vérifié par le Lead | 1 + Lead |

### Élevée

| # | Problème | Preuve | Accord |
|---|---|---|---|
| **P3** | **Une Bénédiction achetée pendant la succession est perdue** : les Éclats sont débités, les héritiers déjà tirés (QA-01). | [MESURÉ] | 1 |
| **P4** | **L'objectif d'événement tombe au plancher** si le jeu est relancé pendant une fenêtre (cible ÷5 078, Or en moins d'1 s) (QA-03, PBA-03). | [MESURÉ] | 3 |
| **P5** | **Événements inatteignables en jeu normal** : 0 palier Or en 6 h pour les 3 profils, 0 Éclat pour experimente (C002). Tout ou rien selon la composition des Échos (GD-05). Le Bazar est privé de revenu (B8). | [SIMULÉ] C002, C301 | 4 |
| **P6** | **« Le Vénérable » monopolise les surnoms**. Sa condition `vocTier ≥ 10` reste vraie à chaque vie, et seul un légendaire le bat. Corriger au seul passage du rang X déplace le monopole vers un autre surnom (91–96 %) (DATA-01, GD-04, PBA-07, BAL B10). | [CODE] `epithets.ts:70,116-119`, [SIMULÉ] C404, `venerable.md` | 4 |
| **P7** | **Stratégie unique : Commercer toute sa vie**. Meilleur profil sur 198/200 graines et 200/200 avec événements, aucun hybride ne le bat. Méditer ×0,04. Écart meilleure/pire vocation ×26,6 à 6 h, ×41,6 à 12 h. La consommation des convertisseurs est négligeable (BAL-01, BAL-02, BAL-03, PBA-06, GD-06, DATA-08). | [SIMULÉ] C000, C201, C202, C205 | 4 |
| **P8** | **Piège de vocation** : 58–61 % des graines s'enferment dans Érudit ou Mystique (×6 à ×25 de perte) (PBA-05). | [SIMULÉ] C300, C304 | 1 + BAL/DATA |
| **P9** | **Les Alliances coûtent**. Mariage à chaque vie : ×0,89 à ×0,95 à 6 h, jusqu'à ×0,54 à 12 h. La cause mesurée est la dot (2 % de l'Or *jamais* produit). Avec une dot fixe, l'effet devient nul (PBA-08, GD B2, BAL B2). | [SIMULÉ] C305, C306, C310, C311, C502, C209–C212 | 3 |
| **P10** | **Triche par l'horloge système** : chaque saut de +6 h donne 6 h de production hors ligne, des Éclats et des Destins illimités (PBA-02). | [MESURÉ] moteur | 1 |

### Moyenne

| # | Problème | Preuve | Accord |
|---|---|---|---|
| P11 | **Lignée arrêtée hors ligne** : la succession attend le joueur. L'occasionnel passe 89 % du temps en succession en attente ; 15 min/jour donnent 0 % d'accès aux Alliances en 72 h (GD-03, DATA-09, PBA-11). | [SIMULÉ] | 3 |
| P12 | **Le Domaine récompense la surexploitation** : les paysans de l'optimiseur (Harmonie 0,83) produisent ×1,44 les chasseurs (0,97). La pression des Échos ±50 % ne change presque rien. Le Garde forestier n'est jamais rentable (BAL-05, GD B6, DATA B6). | [SIMULÉ] C203, C000 | 3 |
| P13 | **Alliances et Chroniques arrivent tard** pour un joueur qui achète tout (Alliances vers 4,5 h, Chroniques jamais en 6 h). Épargner les avance à 33–85 min sans perte, et rien ne le dit au joueur (GD-01, PBA-12, DATA-06). *À traiter après P9 : avancer l'accès à une perte n'aide pas.* | [SIMULÉ] | 3 |
| P14 | **Destin du jour à une seule décision** : chaque jour, une activité tenue 90 s atteint 93 % du maximum. Le score varie ×2,9 selon la date face à des paliers fixes (Or 2 à 8 % des jours). Contredit le GDD (« 400 à 800 selon la stratégie ») (BAL-06, PBA-10, GD B3). | [MESURÉ] C206, 14 et 30 dates | 3 |
| P15 | **Présélection des Échos fausse dans 12–17 % des successions** : elle ignore la force propre de l'Écho (traits) et son surnom. La corriger rapporte ×1,13–1,14 (GD-02, PBA-14 fusionnés). | [SIMULÉ] C305, z 5,8 | 2 |
| P16 | **Vie longue : meilleur Écho, mais moins d'Héritage**. Centenaire ×0,82 (net) ; Longévité et Robuste sont des tendances non significatives. La fiche d'héritier présente la longévité comme un atout (BAL-04, GD B5). | [SIMULÉ] C203, C204 | 2 |
| P17 | **Codes d'alliance** réutilisables (empreinte différente selon le format collé) et usurpation de maison, ce qui permet d'épouser son propre cadet (QA-04, QA-07, PBA-09). | [MESURÉ] | 2 |
| P18 | **Milieu de partie creux** : 149 à 282 min sans nouveauté après la première heure (GD-13). | [SIMULÉ] | 1 |
| P19 | **Budget génétique invisible** : ce n'est pas un choix du joueur, et son seul indice arrive avec les Chroniques (GD-07). Élu présent chez 80–86 % des ancêtres (BAL-08). | [CODE], [SIMULÉ] | 2 |

### Faible

| # | Problème | Preuve |
|---|---|---|
| P20 | Une sauvegarde au héros incomplet est acceptée puis plante le jeu à chaque lancement (QA-02). **Remonte en Élevée dès que P2 est corrigé**, car l'import redeviendra fonctionnel. | [MESURÉ] |
| P21 | La somme des pts/s des cartes d'Écho ≠ le total affiché (10,3 contre 3,5) (GD-09). | [MESURÉ] |
| P22 | iPhone 13 : activités hors écran au lancement, 3 textes du début inexacts ; l'astuce de pause induit en erreur (GD-11, GD-08). | [MESURÉ] |
| P23 | L'Affût est un automatisme (90 % du temps chez un chasseur, ~190 bascules en 6 h) (GD-10). | [SIMULÉ] |
| P24 | Écarts entre le GDD et le code : mutations « une ou deux » alors que 11,25 % des héritiers n'en ont aucune, comme le veut le code (QA-05, requalifié en documentation) ; « 4 traits max » alors que 6 sont possibles avec Bénédictions (QA-09) ; Chasseur « ~70 % » (mesuré 38–45 %) ; surnoms « ~50 % des vies » (mesuré 78–85 %). | [MESURÉ] |
| P25 | Le score du Destin du jour pourrait différer d'un navigateur à l'autre (QA-11). | [HYPOTHÈSE], non testé (seul Chromium est installé) |

## 4. Divergences tranchées (phase 2)

| Point | Positions initiales | Décision du Lead | Motif |
|---|---|---|---|
| B1 Choix des Échos | GD ×1,14 contre PBA « non décisif » | **GD a raison** ; fusion en P15 (Moyenne) | PBA reconnaît que ses règles ignoraient la force propre de l'Écho ; il remesure ×1,13 (z 5,8). |
| B2 Alliances | GD « trop tard » (Élevée) contre PBA « sans effet » | **Les deux, dans cet ordre : d'abord l'effet (P9), puis l'accès (P13)** | Trois mesures indépendantes montrent un effet négatif ; le Balancer en isole la cause (la dot). |
| B3 Destin du jour | GD « point fort » contre PBA/BAL « une touche suffit » | **Problème réel (P14)** ; GD retire son point fort | Les deux constats sont vrais (aucune touche universelle, une touche suffit chaque jour) ; le défaut est l'absence de décision et les paliers absolus. |
| B4 Sensibilité à `dt` | BAL « robuste » contre QA/DATA « −15,7 %, chasse ×4 » | **Artefact du profil `optimiseur`** ; biais réel du moteur limité à −1 à −3 % sur la chasse | Trois analyses indépendantes : le profil se fige en paysan ou en chasseur, `dt` ne change que la proportion des deux. |
| B5 Vie longue | BAL « perte » contre GDD « meilleur Écho » | **Les deux sont vrais** (P16) | Écho ×1,53, mais Héritage et générations en baisse ; seul Centenaire est net. |
| B6 Domaine | BAL « décoratif » contre DATA « oriente une décision » | **Il oriente, dans le mauvais sens** (P12) | Corrélation Harmonie/valeur négative (jusqu'à −0,63) ; le pilier n'est pas tenu. |
| B7 Correction BAL-02 | BAL « ×26,6 → ×6,0 » | **Rejetée telle quelle** | Elle déplace la dominance vers Cultiver (47/50 graines, 27/30 à dt 0,1), aggrave le piège Mystique (24 → 54) et retarde Méditer (garde-fou rouge). Deux variantes plus prudentes à départager (§ 6, R10). |
| B9 Mutations | QA-05 Moyenne | **Faible, correction du GDD** | 11,38 % mesuré contre 11,25 % attendu par le code, écart non significatif. |
| B10 Vénérable | Correction « au passage du rang X » | **Insuffisante seule** | Le monopole se déplace (91–96 %) ; il faut aussi ne pas redonner le surnom du parent. |

## 5. Recommandations écartées ou différées

| Recommandation | Décision | Raison |
|---|---|---|
| Appliquer BAL-02 (Commercer 1,1, Méditer 0,15) | Écartée | Effets secondaires mesurés (B7). |
| Avancer les Alliances (GD-01) seul | Différée après P9 | On avancerait l'accès à une perte. |
| Considérer le Bazar comme cosmétique (PBA-15) | Écartée | Levier réel (×2), mais privé de revenu par P5 (BAL B8). |
| GD-12 : se remarier à chaque vie est pénible | Amélioration facultative | Pas de problème objectif mesuré au-delà de P9. |
| BAL-09 : les traits d'Écho valent plus que les traits de production | Amélioration facultative | Cohérent avec le pilier « chaque vie compte » ; aucun joueur n'est lésé. |
| PBA-16 : « le Maudit glorieux » reste net négatif | Amélioration facultative | Surnom de saveur, rare. |
| Garde-fou sur `harmonyMin` | Écarté | Il mesure le démarrage de l'écosystème, pas la stratégie (DATA-05). |
| Exploits Phénix, Sans-Repos, pause | Aucune action | Mesurés perdants pour le joueur (−0,3 à −0,86 log10). |

## 6. Feuille de route priorisée

Chaque ligne correspond à **une modification logique, un commit**, avec tests de régression, campagne relancée sur les mêmes graines et `npm run sim:guard` contre la référence. Effort : S < ½ j, M ≈ 1 j, L > 1 j.

### Lot 0 — Outillage (sans effet sur le jeu, avant tout le reste)

| # | Action | Effort |
|---|---|---|
| R0a | Profil `optimiseur` : lire les rendements dans `ACT` au lieu de constantes en dur (sinon il ignore les surcharges ; signalé par GD). | S |
| R0b | Nouvelle référence sans événements avec l'outil corrigé (l'occasionnel n'est plus comparable à C000), à dt 0,5 et dt 0,1. | S |
| R0c | Retirer `harmonyMin` des résumés ; ajouter un profil qui joue l'événement. | S |

### Lot 1 — Bugs (bénéfice élevé, coût faible, sans effet sur l'équilibrage)

| # | Constat | Correction proposée | Vérification | Effort |
|---|---|---|---|---|
| **R1** | P1 | `save()` ne touche plus `lastTick` (déjà tenu par `tick`). Une fonction unique `advanceTo(now)` rattrape tout écart de plus de 5 s, sans événements, à chaque trame et au retour de visibilité. | `tests/qa/e2e/onglet-masque.cjs` et `parcours.cjs` (31/31) ; tests hors ligne verts | S–M |
| **R2** | P2 | Drapeau « ne plus sauvegarder » posé avant `reload()` dans `reset` et `replaceState`. | `tests/qa/e2e/import-reset.cjs` | S |
| **R3** | P20 | Valider la structure d'une sauvegarde importée (héros, traits, vie) avant de l'accepter. | Test `save.test.ts` (QA-02) | S |
| **R4** | P3 | Interdire l'achat de Bénédiction pendant une succession en attente, ou l'appliquer aux héritiers déjà tirés (à choisir). | Test QA-01 | S |
| **R5** | P4 | Objectif d'événement calculé sur un taux stable (sauvegardé ou estimé depuis les Échos), pas sur `rt.rate` neuf. | Test QA-03 ; C002 relancée | S |
| **R6** | P17 | Normaliser le code avant `codeKey` ; refuser un id de maison égal au sien quel que soit le chemin. | Tests QA-04, QA-07 | S |
| R7 | P24 | Corriger le GDD (mutations, nombre de traits, chiffres Chasseur et surnoms) après les lots 2–3, avec les valeurs mesurées. | Relecture | S |

### Lot 2 — Équilibrage (une variable à la fois, revalidation à dt 0,1 obligatoire)

| # | Constat | Correction proposée | Vérification | Effort |
|---|---|---|---|---|
| **R8** | P6 | « Le Vénérable » n'est donné qu'au passage du rang X, et un surnom n'est pas redonné s'il est déjà celui du parent. | `lab/metrics/epithet-guard.ts` : surnom dominant ≤ 40 %, nombre effectif ≥ 5 | S + M |
| **R9** | P5 | Recalibrer les événements : objectif relatif à la production de la **ressource visée** (pas à toute l'économie convertie), paliers atteignables (cible : Bronze ≥ 80 %, Or 20–40 % des fenêtres jouées). Dépend de R5. | Profil événement (R0c), C002 relancée | M |
| **R10** | P7, P8 | Rééquilibrer les convertisseurs. Deux variantes sont à départager sur 200 graines à dt 0,1 : **(a) C406** (Commercer 1,25, Méditer 0,15, seuil Méditer 25 → 20 Savoir) : experimente −1,8 %, écart ×6,5, un seul rouge (Méditer) ; **(b) C314** (Commercer 1,1, Méditer 0,10, Sanctuaire sans Savoir) : graines piégées 60 → 22, mais experimente −14,5 % et Étudier devient le piège. **Recommandation du Lead : partir de (a)**, moins de régression, et y ajouter le Sanctuaire de (b) seulement si le piège persiste. | `sim:guard` contre R0b ; écart vocations ≤ ×10 ; piège ≤ 30 % des graines | M–L |
| R11 | P9 | Dot calculée sur l'Or **en stock** (et non sur l'Or produit depuis le début). | Mariage à chaque vie ≥ ×1,0 à 6 et 12 h | S |
| R12 | P13 | Puis avancer l'accès aux Alliances (coût 90 → à mesurer) et indiquer le coût de Chroniques dans l'interface. | Accès p50 ≤ 90 min pour experimente | S |
| R13 | P16 | Héritage multiplié par une fonction de la durée de vie : √(durée/60) (GD) ou durée/60 (BAL). **À départager par campagne** : la version linéaire rend Éternel ×1,73, risque d'inflation. | Traits de durée ≥ ×1,0 ; inflation de l'Héritage ≤ ×1,5 | S |
| R14 | P14 | Paliers du Destin du jour relatifs au meilleur score du jour, calculés par recherche déterministe à la génération. Les codes restent vérifiables, car le score ne change pas. | Or atteignable 20–40 % des jours | M |

### Lot 3 — Lisibilité (rapide, faible risque)

| # | Constat | Correction | Effort |
|---|---|---|---|
| R15 | P15 | Présélection et pts/s affichés en tenant compte de la force propre de l'Écho et de son surnom. | S |
| R16 | P21, P22 | Cohérence du total en pts/s ; activités visibles au lancement sur mobile ; textes du début ; astuce de pause. | S |

### Lot 4 — Décisions de design (ton arbitrage est nécessaire avant toute modification)

| # | Constat | Question à trancher |
|---|---|---|
| D1 | P11 | Lignée hors ligne : succession automatique (héritier présélectionné) pendant l'absence, plafonnée ? Ou bien accepter l'arrêt et le dire au joueur ? |
| D2 | P12 | Domaine : faire payer la surexploitation (Harmonie qui pèse davantage, rendements décroissants) ou assumer un écosystème de saveur ? |
| D3 | P10 | Horloge système : sans serveur, on ne peut que limiter. Accepter le risque (jeu solo) ou plafonner le gain hors ligne par jour réel ? |
| D4 | P18, P19, P23 | Milieu de partie creux, budget génétique invisible, Affût automatique : chantiers de contenu à cadrer séparément. |

### Ordre conseillé (rapport bénéfice/coût)

1. **R1, R2, R3** : deux critiques et une sauvegarde qui plante, environ 1 jour en tout.
2. **R4, R5, R6** : bugs Élevés et Moyens peu coûteux.
3. **R0a–c**, puis **R8** : le surnom dominant, gain élevé pour un coût faible.
4. **R10**, puis **R9** : cœur de l'économie, les plus longs à valider.
5. **R11 → R12, R13, R14, R15, R16**, puis **R7** (GDD).
6. Lot 4 selon tes arbitrages.

## 7. Comment chaque correction sera vérifiée (phase 4)

1. Un commit par ligne de la feuille de route, sur la branche de travail.
2. `npm test` (145 tests, plus les tests `test.fails` du bug corrigé, à basculer en `test`) et `npm run typecheck`.
3. Pour tout changement de jeu : campagne sur les mêmes graines que la référence, `npm run sim:guard -- <réf> <cand>`. Code 1 (garde-fou rouge) : retour arrière (`git revert`) ou correction suivante explicitement motivée.
4. Revalidation à `--dt=0.1` pour tout ce qui touche Chasse, Affût, Harmonie, vocations ou l'équilibre entre activités.
5. Ligne ajoutée dans `lab/campaigns/CAMPAIGNS.md` et entrée dans `lab/CHANGELOG-EQUILIBRAGE.md` (avant, après, décision).
