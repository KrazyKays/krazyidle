# Confrontation (phase 2) — Player Behavior Analyst

Points traités : B1, B2, B3, B7.

Le dossier `src/` est identique de `6f47e27` à `14b76fe` (`git diff --stat` vide). Les campagnes C305 à C314 tournent sur 6 h, dt 0,5, sans événements, 100 graines (50 graines pour 12 h). Les surcharges `BAL_OBJ` passent en mémoire par `lab/balance/lib.ts`, chargé dans `lab/profiles/worker.ts`.

Vérification de non-régression [MESURÉ] : sans surcharge, opti-commerce et i-mono-commercer (graines 1–3) sont identiques au bit près à C304 et C300.

Les corrections d'outillage du Lead (section C) ne changent rien ici :
- mes campagnes avec événements démarraient déjà hors fenêtre (C301, `--startH=1` = 1 h UTC) ;
- les autres sont sans événements, donc identiques au bit près.

## B1. Le choix des Échos compte-t-il ? — **Je nuance : GD-02 a raison, PBA-14 mesurait autre chose**

Mes trois règles de phase 1 (récents, pts/s, valeur) ignorent toutes la force propre de l'Écho et son surnom. Elles se trompent donc de la même façon, d'où le « non décisif ». GD-02 compare la présélection à un tri par **vraie force**, ce qui est un autre test.

- [SIMULÉ C305], opti-epargne, comparaison appariée sur 100 graines, `lab/profiles/paired.mjs` :

  | Tri des Échos | Δ log10 vs pts/s | Facteur | z | Graines gagnantes |
  |---|---|---|---|---|
  | vraie force (pts/s × max(0,2 ; 1 + force) × (1 + surnom)) | +0,054 | ×1,13 | 5,8 | 96/100 |
  | plus récents | +0,016 | — | 1,1 | — |

- Ce ×1,13 rejoint le ×1,14 de GD-02 sur un autre profil, avec d'autres graines et un autre script.

**Conséquence** :
- GD-02 garde la priorité Moyenne ; la correction (affichage et tri par vraie force) est validée.
- PBA-14 est requalifié : le choix est décisif **à condition** d'afficher la vraie force. La partie « classement aveugle aux surnoms » de PBA-14 est un doublon de GD-02, à fusionner.

## B2. Alliances : « trop tard », « sans effet », ou les deux ? — **Les deux, et l'effet est légèrement négatif**

« Trop tard » vient du profil gourmand (A6). En épargnant, Alliances arrive à 0,47 h, ce qui est une décision d'information (GD-01, PBA-12). Une fois l'accès en main, le mariage ne rapporte rien.

[SIMULÉ C305/C306/C310/C311], appariés à ep-sans-mariage (`paired.mjs`) :

| Profil (règle de mariage) | Mariages | 6 h | 12 h |
|---|---|---|---|
| ep-mariage-force (dot payée avant tout achat, maison prestigieuse, don épique ou légendaire) | 11,5 / partie | ×0,91 (z −2,5) | ×0,89 (z −2,1) |
| ep-mariage-metier (union de métier : vocation +1 rang à 35 %) | 4,2 | ×0,94 (z −1,9) | ×0,91 (z −1,8) |
| opti-epargne (dot ≤ 25 % de l'Or) | marie dans 15 graines sur 100 seulement (l'Or part dans les bâtiments) | dans ces graines : −0,18 log10 (×0,66) | — |

- [SIMULÉ] Mécanisme probable : le conjoint transmet sa vocation (40 % si le parent n'en a pas, `game.ts:453`). La lignée dérive vers Chasser ou Commercer : chez les mariés d'opti-epargne, 12 graines sur 15 ont une autre activité dominante que Cultiver, contre 15 sur 100 sans mariage. La consanguinité ajoute un peu de bruit : héritiers « tous mauvais » 1,3 % contre 0,6 %.
- [HYPOTHÈSE] Un conjoint porteur d'un don légendaire n'apparaît que via la maison prestigieuse, dont le don n'est légendaire qu'une semaine sur trois environ (`alliances.ts:63`). L'horizon de 12 h ne suffit pas à rentabiliser ce don.

**Conséquence** :
- Je maintiens PBA-08 en Élevée, et le problème principal est « sans effet » : rendre l'accès plus précoce (GD-01) seul ne changerait rien au résultat du joueur.
- Les deux corrections sont nécessaires, dans cet ordre :
  1. un bénéfice propre à l'union ;
  2. puis l'accès plus précoce.
- Garde-fou proposé : ep-mariage-force ≥ ×1,10 contre ep-sans-mariage à 6 h (C310 vs C305).

## B3. Destin du jour : stratégie dominante ? — **Je nuance : pas la même touche chaque jour, mais une seule touche suffit**

Définitions à accorder :
- (a) « une même stratégie gagne sur toutes les dates » : **faux** ; GD a raison ;
- (b) « chaque jour, tenir une seule activité 90 s est optimal ou presque » : **vrai** ; PBA-10 et BAL-06 ont raison.

- [MESURÉ] `lab/profiles/daily-bykey.ts`, 30 dates du 1er au 30/11/2026, touche gagnante par date :

  | Touche | Dates gagnées |
  |---|---|
  | Cultiver | 14 |
  | Méditer | 11 |
  | Chasser | 5 |

  La meilleure touche devance la deuxième de ×1,27 en médiane (de ×1,00 à ×2,57). Le choix du jour n'est donc pas évident : c'est **une** vraie décision.
- [MESURÉ] `exploit-daily.ts` : le bot de recherche fait ×1,000 en médiane face à la meilleure touche (moyenne ×1,094) ; en médiane, la meilleure séquence ne comporte qu'une action.
- [MESURÉ] La meilleure touche varie de 288 à 823 points selon la date (×2,9). Palier Or : 7 % des dates (BAL-06 : 2 dates sur 14).

**Conséquence** : le vrai problème est double, et il faut corriger les deux.
1. **Pauvreté de décision dans la partie** : une seule décision, à t = 0. Correction : stock initial ou objectif de conversion, pour que l'enchaînement d'activités paie.
2. **Paliers absolus sur une variance ×2,9 par date** : correction BAL-06, des paliers relatifs au score de référence du jour.

PBA-10 reste en Moyenne. « Stratégie dominante » est à reformuler en « décision unique ».

## B7. BAL-02 (Commercer 1,5 → 1,1 Or ; Méditer 0,06 → 0,15 Essence) — **Je conteste en l'état : le piège de vocation s'aggrave et se déplace vers Méditer**

Les profils PBA décident avec la valeur nette lue dans `ACT`, donc ils « voient » la surcharge. Ce n'est pas le cas de `i-optimiseur`, qui utilise l'`actNetValue` figée de `lab/sim` : sa colonne est indicative.

[SIMULÉ] Mêmes graines 1–100. Référence : C300 + C304 + C308. « < 8,1 » = graines piégées (log10 < 8,1).

| Variante (BAL_OBJ) | opti-fort log10 · < 8,1 · Méditer dominant | opti-commerce log10 · < 8,1 | mono cult / comm / médi / étud / chas | Garde-fous ROUGES (hors effets voulus sur mono-commercer et mono-mediter) |
|---|---|---|---|---|
| Référence | 8,00 · 60 · 24 | 8,06 · 52 | 8,77 / 8,93 / 7,52 / 8,12 / 8,42 | — |
| **BAL-02 = fix1** (C307) | **7,82 · 70 · 54** | 7,93 · 60 | 8,80 / 8,73 / 8,02 / 8,07 / 8,46 | `unlock.mediter` p90 154 → 343 s |
| BAL-02 prudent : Commercer 1,3 ; Méditer 0,10 (C309) | 7,79 · 68 · 51 | 7,85 · 54 | 8,80 / 8,84 / 7,79 / 8,11 / 8,44 | idem |
| BAL-01 seul : Commercer 1,1 (C312) | 7,80 · 65 · 19 | 8,00 · 57 | 8,76 / 8,66 / 7,55 / 8,02 / — | experimente −21 % de valeur (z −22,9) ; `unlock.mediter` |
| fix1 + Sanctuaire sans coût en Savoir (C313) | 8,72 · 16 · 54 | 8,82 · 8 | 8,82 / 8,76 / **9,22** / 8,07 / — | Méditer devient dominant (×2,9 sur Commercer) |
| **Variante proposée** : Commercer 1,1 ; Méditer 0,10 ; Sanctuaire sans coût en Savoir (C314) | **8,41 · 22 · 48** | **8,51 · 15** | **8,79 / 8,71 / 8,78 / 8,05 / 8,45** | experimente −14,5 % (z −15,2) ; `unlock.mediter` p90 343 s |

**Lecture** :
- **fix1 ne supprime pas le piège, il le déplace.** Méditer devient l'activité la plus rentable *sur le moment* (0,15 × 20 = 3 pts/s de base, contre 1,2 pour Cultiver). Ce n'est pas le cas sur la durée (mono-mediter 8,02 contre 8,80 pour mono-cultiver) : le Sanctuaire, seul multiplicateur de Méditer, coûte du Savoir, qu'une lignée de mystiques ne produit pas (BAL-07).
- Résultat : le joueur qui suit sa vocation s'enferme encore plus souvent. Pour opti-fort, les graines piégées passent de 60 à 70 et les lignées Mystique de 24 à 54.
- La boucle Commercer → Étudier → Méditer devient **moins** lisible : Étudier arrive plus tard (Or plus lent ; `unlock.mediter` p90 dépasse les 300 s, garde-fou ROUGE) et reste le pire choix (mono-etudier 8,07, 68 graines sous 8,1).
- **Le levier qui ferme le piège est le coût du Sanctuaire**, pas le rendement de Méditer :
  - avec le Sanctuaire sans coût en Savoir, les graines piégées tombent de 60 à 16 ;
  - mais Méditer à 0,15 devient alors dominant ;
  - à 0,10 (C314), Cultiver, Méditer et Commercer se resserrent dans 0,08 log10 (×1,2), Chasser à −0,34 ; l'écart entre la meilleure et la pire activité tombe à ×5,5 (Étudier), contre ×26 dans la référence.
- Ce qui reste :
  - Étudier est le nouveau piège (84 graines mono-étudier sous 8,1) ;
  - le profil experimente perd 14,5 % de valeur ;
  - `unlock.mediter` reste à 343 s, à cause de la baisse de Commercer.

**Conséquence** :
- Je recommande de **ne pas appliquer BAL-02 tel quel**. La variante C314 est plus prudente : Commercer 1,1, Méditer 0,10, `BUILDING.sanctuaire.cost.savoir = 0` (ou un coût en Or, à préférer).
- Elle doit s'accompagner de deux compléments :
  1. une correction pour Étudier (BAL-03 sur la consommation, ou un coût de la Bibliothèque sans Savoir) ;
  2. un ajustement du seuil de déblocage d'Étudier (50 Or), pour que `unlock.mediter` repasse sous 300 s.
- À revalider à dt 0,1 (B4) avant application. Garde-fous à exiger :
  - opti-fort : ≤ 25 graines sous 8,1 ;
  - aucune activité mono à plus de ×3 de la meilleure ;
  - `unlock.mediter` p90 ≤ 300 s ;
  - experimente au plus à −10 % de valeur.

## Annexes

```bash
R="node --import ./lab/sim/register.mjs lab/profiles/run.ts --workers=2"
$R --profiles=opti-epargne,ep-recent,ep-vraie-force,ep-sans-mariage,ep-mariage-max --seeds=1-100 --hours=6 --id=C305-pba-echos-mariages-6h
$R --profiles=opti-epargne,ep-sans-mariage,ep-mariage-max --seeds=1-50 --hours=12 --id=C306-pba-mariages-12h
$R --profiles=i-mono-etudier,i-mono-mediter --seeds=1-100 --hours=6 --id=C308-pba-ref-mono-6h
BAL_OBJ='ACT.commercer.produce.or=1.1;ACT.mediter.produce.essence=0.15' $R --profiles=<8 réf. i-*>,opti-fort,opti-commerce,opti-epargne,sans-vocation-piege --seeds=1-100 --hours=6 --id=C307-pba-bal02-fix1-6h
BAL_OBJ='ACT.commercer.produce.or=1.3;ACT.mediter.produce.essence=0.1' $R … --id=C309-pba-bal02-prudent-6h
$R --profiles=ep-mariage-force,ep-mariage-metier --seeds=1-100 --hours=6 --id=C310-pba-mariages-forces-6h   # et 1-50, 12 h → C311
BAL_OBJ='ACT.commercer.produce.or=1.1' $R … --id=C312-pba-bal01-seul-6h
BAL_OBJ='…fix1…;BUILDING.sanctuaire.cost.savoir=0' $R … --id=C313-pba-bal02-sanctuaire-6h
BAL_OBJ='ACT.commercer.produce.or=1.1;ACT.mediter.produce.essence=0.1;BUILDING.sanctuaire.cost.savoir=0' $R … --id=C314-pba-bal02-variante-6h
node lab/profiles/paired.mjs <dirA> <profA> <dirB> <profB> [kpi]
node --import ./lab/sim/register.mjs lab/profiles/guard.ts <cand> C300-pba-profils-6h,C308-pba-ref-mono-6h   # evaluate() de lab/metrics/guardrails.ts
node --import ./lab/sim/register.mjs lab/profiles/daily-bykey.ts
```

Les scripts de lancement complets sont dans `lab/profiles/results/phase2*.sh`, et les résultats dans `lab/profiles/results/C305…C314/`.
