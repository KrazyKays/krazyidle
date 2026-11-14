# Confrontation (phase 2) — Game Designer

Points traités : B1, B2, B3, B5, B6, B7. Données de phase 1 réutilisées ; deux campagnes courtes ajoutées pour trancher B2 et B7 (C501 et C502, consignées dans `CAMPAIGNS.md`). Sources identiques au commit `6f47e27`, dt 0,5 s.

## B1. Le choix des Échos compte-t-il ? — **Je nuance (les deux mesures sont compatibles)**
- Les deux mesures ne portent pas sur la même chose :
  - PBA-14 compare trois **règles de tri** (récents, pts/s, valeur) : elles donnent le même résultat.
  - GD-02 compare le tri par pts/s affiché à un tri qui **ajoute la force propre de l'Écho** (traits d'Écho) et son surnom.
- [SIMULÉ] Mes données confirment PBA-14 sur son point : tri par valeur et tri par pts/s ×0,98 (d = −0,22, `choix.ts`, 40 graines × 6 h).
- Pourquoi « garder les plus récents » donne ×0,68 chez moi (d = −5,6) et 8,00 chez PBA : le profil `experimente` change d'activité selon la génération ([CODE] `lab/sim/profiles.ts:58-64`). Ses Échos récents sont donc très inégaux. Dans une lignée homogène, comme les profils de C300 ([HYPOTHÈSE]), le plus récent est presque toujours le meilleur.
- Le seul écart net est donc **l'information manquante**, pas la règle : ×1,14 (d = 1,43), divergence dans 12 à 17 % des successions ([SIMULÉ] `echo-select.ts`, 30 graines). PBA-14 ne tenait compte que du surnom ; la force des traits d'Écho est le plus gros terme (Mémoire ancestrale ×2,06 en C204).
- **Conséquence** : fusionner GD-02 et PBA-14 en un constat « pts/s aveugle à la force et au surnom ».
  - Priorité **Moyenne** : décision fréquente, information fausse, environ +14 %.
  - Le choix lui-même n'est pas décisif. Que le Lead ne retienne pas « le choix des Échos est crucial ».

## B2. Alliances : trop tard, sans effet, ou les deux ? — **Les deux, et pire : l'assiduité est punie**
- [SIMULÉ C502] Joueur épargnant (Alliances dès 90 ⚜️) qui marie chaque héros au meilleur prétendant de la semaine, comparé au même joueur sans mariage, 20 graines appariées :

  | Horizon | Effet | Unions par partie | Héritage (⚜️, sans → avec) |
  |---|---|---|---|
  | 6 h | ×0,95 (Δ −0,024 ± 0,050, z −2,2) | 154 | 1 891 → 1 931 |
  | 12 h | ×0,54 (Δ −0,269 ± 0,058, z −20,9) | 233 | 4 903 → 4 593 |

- Mécanisme [CODE] : 3 maisons par semaine (`alliances.ts:52-71`), une union par vie d'environ 2 min, +15 % de consanguinité par union avec la même maison, plafonnée à 60 % (`alliances.ts:117-121`). Après une quinzaine d'unions, toutes les maisons disponibles sont saturées. Je confirme et j'aggrave PBA-08.
- Limite : mon heuristique de choix pénalise peu la consanguinité. Un joueur prudent qui ne se marierait que de temps en temps n'est pas mesuré ; c'est plutôt la mesure du Balancer.
- **Conséquences** :
  - Le problème de fond est l'**absence d'effet positif**, plus une **pénalité systémique** pour le joueur engagé : PBA-08 reste Élevée.
  - L'accès tardif (GD-01) passe à **Moyenne** et se fusionne avec PBA-12. Avancer l'accès à un système sans effet n'a pas de valeur en soi. Corriger l'effet d'abord, l'accès ensuite.
  - Pour les Chroniques, l'accès tardif reste un vrai problème (pilier 2), mais il dépend de la correction de « Vénérable » (A1).
- Note sur A6 (« épargner sans perte ») : c'est vrai pour une épargne ciblée (PBA : 8,57 contre 8,59). Une épargne stricte coûte ×0,61 à 6 h, une épargne modérée ×0,79 ([SIMULÉ] `choix.ts`). L'information « quoi épargner » reste donc nécessaire.

## B3. Destin du jour : stratégie dominante ? — **Je conteste mon propre point fort**
- Il faut distinguer deux définitions :
  - (a) **Une même stratégie gagne-t-elle toutes les dates ?** Non. [SIMULÉ] `destin.ts`, 60 dates : méditer gagne 22 fois, cultiver 12, glouton 11, chaîne 11. PBA et BAL sont d'accord.
  - (b) **Le jour J, faut-il plus d'une décision ?** Souvent non : médiane d'une action (PBA-10), activité unique optimale 4 jours sur 14 (BAL-06).
- Biais de ma mesure : mono-étudier ressort identique à mono-cultiver, car sans Or au départ ma stratégie se replie sur Cultiver. Les deux pièges (Commercer, Étudier) que décrit PBA-10 ne sont donc pas visibles dans mes chiffres.
- Le problème objectif n'est pas la dominance au sens (a). C'est (1) la **variance par date** : le score max dépend des modificateurs (314 à 853) ; et (2) des **paliers absolus mal calibrés** : Or atteint 5/60 chez moi, 7 % chez PBA, 2/14 chez BAL.
- Le manque de décisions dans la journée vient ensuite : c'est un problème de profondeur (Moyenne), pas une dominance.
- **Conséquence** : retirer « aucune stratégie simple ne domine » des points forts. Soutenir la correction de BAL-06 (paliers relatifs au jour). Priorité **Moyenne**, contradiction avec le GDD.

## B5. Une vie plus longue est-elle meilleure ? — **Je confirme : les deux sont vrais, et c'est un piège d'information**
- L'Écho gagne bien ≈ +50 % de pts/s entre 60 et 180 s ([MESURÉ] BAL `analytic.md` ×1,53). Mais l'Héritage est payé par vie, donc le tempo dynastique baisse plus vite : Centenaire ×0,82, vie de base ×1,5 → −20 % de générations (BAL-04).
- Côté design : la fiche d'héritier affiche « Vie : 98 s » comme un atout, et un trait « positif » vaut ×0,82. C'est une **décision avec une information trompeuse**, du même type que GD-02. [MESURÉ] capture `desktop-09-vie-5min.png` : Godefroy, Centenaire + Robuste, 98 s.
- **Correction minimale proposée** (moins risquée que l'Héritage ∝ durée, qui accélère la Prospérité) : l'Héritage d'une vie = ⌊∛(v/20)⌋ × max(1, dur/60)^0,5. La racine limite l'emballement. À valider par `traits.ts` (seuil BAL : Centenaire ≥ ×1,03).
- Alternative sans chiffre : convertir le bonus de durée en niveaux de départ.
- Priorité **Moyenne** (inchangée). Pilier servi : 1 (« chaque vie compte » ne doit pas punir une vie longue).

## B6. Le Domaine est-il décoratif ? — **Je confirme pour la partie principale, avec une nuance**
- Aucune décision de la partie principale ne dépend aujourd'hui de l'écosystème :
  - [SIMULÉ C000] l'optimiseur, qui surexploite (Harmonie moyenne 0,840, p50 0,818), bat le joueur équilibré (0,981) : 8,59 contre 8,26 log10. **Le pilier « l'optimum n'est pas le maximum » n'est pas tenu** : ici, le maximum est l'optimum.
  - Méditer pour l'Harmonie ne paie pas (BAL-02, BAL-05).
  - L'Affût tourne sans le joueur (GD-10).
- Nuance : le Domaine pèse au Destin du jour (modificateurs « Hiver des loups », « Terres fertiles ») et il fait vivre l'interface (lisibilité, narration). Il n'est pas inutile, il est **sans enjeu**.
- **Conséquence** : constat commun BAL-05, GD-10 et DATA, priorité **Moyenne**.
  - Préférence de design, marquée comme telle : relier l'Harmonie à une décision (par exemple, sous 0,8, les Échos chasseurs et cultivateurs perdent leur bonus de vocation) plutôt que de seulement amplifier ×0,5–1,5 comme BAL le propose.
  - L'amplification seule pénaliserait davantage mono-cultiver et mono-chasser, déjà derrière Commercer (effet secondaire noté par BAL).

## B7. Correctif BAL-02 (Commercer 1,5 → 1,1 ; Méditer 0,06 → 0,15) — **Je nuance : utile mais insuffisant, et un risque de lisibilité**
- [SIMULÉ C501] (30 graines appariées avec C000, 6 h) :
  - optimiseur Δ −0,011 ± 0,040, debutant +0,023 ± 0,142 : neutre pour ces profils ;
  - part d'activité du héros inchangée ;
  - Étudier est débloqué 79 s plus tard chez debutant (médiane 325 s contre 246 s) ;
  - l'optimiseur ne débloque **jamais** Méditer (0/30, déjà le cas en C000) et Étudier seulement 10/30. Méditer revalorisé ne touche pas ce joueur.
- Limite : `optimiseur` estime la valeur de chaque activité avec des constantes écrites en dur ([CODE] `lab/sim/profiles.ts:105-107`). C501 ne mesure donc pas sa réaction au correctif. À corriger dans l'outillage avant toute conclusion sur la dominance.
- Piège de vocation (PBA-05) : C207 le **déplace** sans le supprimer.
  - Le Mystique remonte (7,51 → 8,02).
  - L'Érudit reste le pire métier (8,07 contre 8,80 pour Cultiver, ×0,19).
  - Commercer tombe à ×0,85 de Cultiver. Le piège n'est pas inversé, mais Cultiver devient la nouvelle réponse unique (47/50 graines).
- Lisibilité [CODE] `sim.ts:22-33` :
  - À puissance 1, Commercer à 1,1 Or produit 2,2 de valeur pour 3 Vivres consommés : un échange **perdant** tant que puissance × multiplicateurs < ≈ 1,36.
  - La première activité débloquée afficherait « +1,1 🪙/s −3 🌾/s » et détruirait de la valeur pendant les premières minutes, alors qu'elle est obligatoire pour débloquer Étudier.
  - La chaîne Commercer → Étudier → Méditer reste compréhensible, mais son premier maillon devient un piège pour le débutant.
- Garde-fous : C207 n'est pas dans `lab/results/` au format `RunResult`, donc `guardrails.ts` ne s'applique pas tel quel (C000 contre C207 non comparable). Je ne prétends pas qu'ils passent.
- **Variante plus prudente proposée** : Commercer 1,5 → 1,3 Or (échange encore gagnant à puissance 1, 2,6 contre 3 ×√p, compensé dès le niveau 2) et Méditer 0,06 → 0,12.
  - Traiter Étudier en même temps (BAL-03), sinon l'Érudit reste le piège.
  - Vérification : C000 complète au format `RunResult` puis `guardrails.ts`. Cibles : écart meilleure/pire mono-activité ≤ ×3, aucune mono-activité < ×0,5 de la meilleure, Commercer net positif au niveau 0 (aperçu de l'interface).

## Synthèse des priorités après confrontation
| Constat | Avant | Après |
|---|---|---|
| GD-01 accès Alliances/Chroniques (fusion PBA-12) | Élevée | Moyenne (corriger d'abord l'effet des Alliances, PBA-08) |
| GD-02 + PBA-14 pts/s aveugle à la force | Moyenne / Faible | Moyenne |
| PBA-08 Alliances | Élevée | Élevée, avec nouvelle preuve : ×0,54 à 12 h quand on se marie à chaque vie (C502) |
| Point fort « Destin sans dominante » | Point fort | Retiré ; soutien à BAL-06 (Moyenne) |
| BAL-04 vie longue | Moyenne | Moyenne, avec correction en racine proposée |
| BAL-05 / GD-10 Domaine | Moyenne / Faible | Moyenne (constat commun) |
| BAL-02 correctif | — | À ajuster : variante 1,3 / 0,12 + Étudier |
