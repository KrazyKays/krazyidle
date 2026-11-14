# Analyse C001-reference-avec-evenements

> **[SIMULÉ]** — commit `a53d1b5`, 600 parties, graines 1-200, 6 h, dt 0.5 s, événements oui. Généré par `lab/metrics/analyze.ts`.

## Déblocages (sentinelle -1 séparée)

| profil | Étudier jamais | Étudier p50 (s) réel | moy. naïve summary | Méditer jamais | Méditer p50 réel | moy. naïve |
| --- | --- | --- | --- | --- | --- | --- |
| experimente | 0 % | 60.5 | 63.1 | 0 % | 91.3 | 102.1 |
| occasionnel | 0 % | 63.0 | 67.1 | 0 % | 99.5 | 105.3 |
| optimiseur | 59 % | 142.0 | 68.7 | 99 % | 5752 | 99.4 |

## Alliances / Chroniques

| profil | Alliances achetées | p50 (min) | Chroniques achetées | p50 (min) | surnoms distincts moy. | vies surnommées / vies | idem après achat | mariés moy. |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| experimente | 100 % | 264.1 | 0 % | — | 0.000 | 0.0 % | — | 0.000 |
| occasionnel | 0 % | — | 0 % | — | 0.000 | 0.0 % | — | 0.000 |
| optimiseur | 100 % | 187.4 | 100 % | 281.6 | 1.005 | 17.6 % | 82.2 % | 2.670 |

## Bâtiments : part des parties avec niveau ≥ 1 (niveau moyen)

| profil | champs | pavillon | comptoir | bibliotheque | sanctuaire | clepsydre | garde |
| --- | --- | --- | --- | --- | --- | --- | --- |
| experimente | 100 % (15.8) | 100 % (15.1) | 100 % (19.3) | 100 % (17.7) | 100 % (10.0) | 100 % (8.4) | 100 % (10.0) |
| occasionnel | 100 % (9.1) | 100 % (8.5) | 100 % (11.3) | 100 % (9.7) | 100 % (5.9) | 100 % (4.5) | 100 % (6.4) |
| optimiseur | 100 % (24.5) | 83 % (4.7) | 35 % (3.1) | 2 % (0.2) | 0 % (0.0) | 0 % (0.0) | 25 % (1.9) |

## Améliorations d'Héritage : part des parties avec niveau ≥ 1 (niveau moyen)

| profil | prosperite | longevite | memoire | crypte | eveil | transmission | sang | etoile | patience | alliances | chroniques |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| experimente | 100 % (11.0) | 100 % (8.0) | 100 % (8.4) | 100 % (3.0) | 100 % (4.0) | 100 % (5.0) | 100 % (3.0) | 100 % (4.5) | 100 % (6.0) | 100 % (1.0) | 0 % (0.0) |
| occasionnel | 100 % (4.8) | 100 % (3.0) | 100 % (2.7) | 64 % (0.6) | 80 % (0.8) | 100 % (1.1) | 83 % (0.8) | 88 % (0.9) | 100 % (1.3) | 0 % (0.0) | 0 % (0.0) |
| optimiseur | 100 % (12.2) | 100 % (8.9) | 100 % (9.0) | 100 % (3.9) | 100 % (4.5) | 100 % (5.0) | 100 % (3.0) | 100 % (5.0) | 100 % (7.0) | 100 % (1.0) | 100 % (1.0) |

## Activités : part du temps héros / part des secondes d'Échos / parties où l'activité ≥ 5 % du temps héros

| profil | cultiver | chasser | commercer | etudier | mediter |
| --- | --- | --- | --- | --- | --- |
| experimente | 15 % / 0 % / 100 % | 14 % / 0 % / 100 % | 42 % / 56 % / 100 % | 14 % / 44 % / 100 % | 14 % / 0 % / 100 % |
| occasionnel | 18 % / 6 % / 100 % | 19 % / 13 % / 100 % | 36 % / 57 % / 100 % | 13 % / 24 % / 97 % | 14 % / 0 % / 100 % |
| optimiseur | 84 % / 85 % / 85 % | 12 % / 12 % / 16 % | 3 % / 3 % / 5 % | 1 % / 1 % / 2 % | 0 % / 0 % / 0 % |

## Traits : part des parties où le trait apparaît chez les 60 derniers ancêtres (fréquence moyenne)

| trait | experimente | occasionnel | optimiseur |
| --- | --- | --- | --- |
| main_verte | 81 % (7 %) | 80 % (12 %) | 26 % (1 %) |
| oeil_faucon | 84 % (6 %) | 81 % (12 %) | 33 % (1 %) |
| langue_argent | 82 % (6 %) | 81 % (12 %) | 24 % (1 %) |
| rat_biblio | 85 % (6 %) | 84 % (12 %) | 31 % (1 %) |
| ame_calme | 88 % (7 %) | 84 % (11 %) | 28 % (1 %) |
| robuste | 84 % (7 %) | 85 % (14 %) | 54 % (2 %) |
| curieux | 99 % (19 %) | 95 % (25 %) | 52 % (2 %) |
| fragile (−) | 55 % (2 %) | 74 % (7 %) | 20 % (1 %) |
| distrait (−) | 27 % (1 %) | 51 % (3 %) | 26 % (1 %) |
| maladroit (−) | 35 % (1 %) | 48 % (3 %) | 22 % (1 %) |
| prodige | 86 % (7 %) | 67 % (8 %) | 90 % (10 %) |
| longevite | 90 % (8 %) | 65 % (8 %) | 85 % (7 %) |
| harmonieux | 86 % (7 %) | 66 % (8 %) | 33 % (1 %) |
| echo_vibrant | 89 % (7 %) | 70 % (8 %) | 72 % (5 %) |
| fertile | 86 % (7 %) | 62 % (7 %) | 37 % (1 %) |
| polyvalent | 100 % (29 %) | 87 % (19 %) | 77 % (5 %) |
| maudit (−) | 96 % (6 %) | 56 % (5 %) | 63 % (2 %) |
| genie | 100 % (31 %) | 83 % (18 %) | 71 % (4 %) |
| memoire | 66 % (4 %) | 49 % (6 %) | 79 % (7 %) |
| centenaire | 64 % (4 %) | 56 % (6 %) | 92 % (10 %) |
| sang_dore | 100 % (57 %) | 82 % (23 %) | 94 % (15 %) |
| elu | 100 % (84 %) | 58 % (14 %) | 100 % (85 %) |
| eternel | 56 % (4 %) | 29 % (3 %) | 100 % (76 %) |
| astres (Bazar) | 0 % (0 %) | 0 % (0 %) | 0 % (0 %) |

## Corrélations avec log10Value (Pearson / Spearman, entre graines d'un même profil)

| profil | echoShare | harmonyAvg | harmonyMin | traitCombos60 | gen | vocationTierMax |
| --- | --- | --- | --- | --- | --- | --- |
| experimente | 0.63 / 0.65 | 0.14 / 0.09 | -0.07 / -0.00 | -0.23 / -0.25 | -0.05 / -0.05 | 0.04 / 0.07 |
| occasionnel | -0.63 / -0.68 | 0.04 / 0.02 | 0.05 / 0.07 | -0.05 / -0.05 | -0.25 / -0.24 | 0.00 / -0.00 |
| optimiseur | 0.66 / 0.73 | -0.60 / -0.59 | -0.03 / -0.07 | -0.09 / -0.16 | -0.06 / 0.07 | — / — |

## Puissance : graines par groupe pour détecter un écart de 5 % (α 0,05, puissance 0,8, comparaison non appariée)

| profil | valeur (×1,05) | legacyTotal | gen | echoShare | harmonyAvg | traitCombos60 | harmonyAvg ±0,01 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| experimente | 65 | 4 | 2 | 1 | 1 | 133 | 1 |
| occasionnel | 1865 | 58 | 13 | 1011 | 1 | 40 | 16 |
| optimiseur | 446 | 25 | 4 | 1 | 30 | 547 | 518 |

## Valeurs aberrantes (|z| > 3 sur log10Value) et baisses de débit horaire

| profil | n aberrantes | graines | parties avec ≥ 1 baisse > 5 % du débit horaire | baisses / partie |
| --- | --- | --- | --- | --- |
| experimente | 2 | 79 (z 3.1), 108 (z 3.2) | 36 % | 0.36 |
| occasionnel | 0 | — | 0 % | 0.00 |
| optimiseur | 0 | — | 56 % | 0.56 |

## Valeur log10 médiane par heure

| profil | h1 | h2 | h3 | h4 | h5 | h6 |
| --- | --- | --- | --- | --- | --- | --- |
| experimente | 6.41 | 7.14 | 7.58 | 7.86 | 8.15 | 8.33 |
| occasionnel |
| optimiseur | 6.81 | 7.52 | 7.96 | 8.24 | 8.50 | 8.65 |

## harmonyMin identique (même graine) entre profils

| paire | part des graines identiques |
| --- | --- |
| experimente~occasionnel | 0 % |
| experimente~optimiseur | 0 % |
| occasionnel~optimiseur | 0 % |
