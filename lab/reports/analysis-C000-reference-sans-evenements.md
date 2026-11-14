# Analyse C000-reference-sans-evenements

> **[SIMULÉ]** — commit `a53d1b5`, 1800 parties, graines 1-200, 6 h, dt 0.5 s, événements non. Généré par `lab/metrics/analyze.ts`.

## Déblocages (sentinelle -1 séparée)

| profil | Étudier jamais | Étudier p50 (s) réel | moy. naïve summary | Méditer jamais | Méditer p50 réel | moy. naïve |
| --- | --- | --- | --- | --- | --- | --- |
| debutant | 0 % | 385.3 | 519.5 | 0 % | 1333 | 1448 |
| experimente | 0 % | 60.5 | 63.4 | 0 % | 93.0 | 111.1 |
| mono-chasser | 0 % | 61.0 | 64.7 | 0 % | 94.5 | 134.0 |
| mono-commercer | 0 % | 61.0 | 64.7 | 0 % | 94.5 | 134.0 |
| mono-cultiver | 0 % | 61.0 | 64.7 | 0 % | 94.5 | 134.0 |
| mono-etudier | 0 % | 61.0 | 64.7 | 0 % | 94.5 | 134.0 |
| mono-mediter | 0 % | 61.0 | 64.7 | 0 % | 94.5 | 134.0 |
| occasionnel | 0 % | 63.0 | 68.5 | 0 % | 100.5 | 132.6 |
| optimiseur | 73 % | 116.5 | 38.8 | 98 % | 3582 | 95.2 |

## Alliances / Chroniques

| profil | Alliances achetées | p50 (min) | Chroniques achetées | p50 (min) | surnoms distincts moy. | vies surnommées / vies | idem après achat | mariés moy. |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| debutant | 99 % | 313.5 | 0 % | — | 0.000 | 0.0 % | — | 0.000 |
| experimente | 100 % | 268.8 | 0 % | — | 0.000 | 0.0 % | — | 0.000 |
| mono-chasser | 100 % | 192.9 | 100 % | 295.4 | 1.000 | 15.2 % | 84.8 % | 0.000 |
| mono-commercer | 100 % | 186.9 | 100 % | 262.6 | 1.000 | 23.3 % | 84.0 % | 0.000 |
| mono-cultiver | 100 % | 182.9 | 100 % | 260.9 | 1.000 | 23.5 % | 84.4 % | 0.000 |
| mono-etudier | 100 % | 223.4 | 79 % | 337.3 | 0.765 | 4.6 % | 78.2 % | 0.000 |
| mono-mediter | 98 % | 324.8 | 0 % | — | 0.000 | 0.0 % | — | 0.000 |
| occasionnel | 0 % | — | 0 % | — | 0.000 | 0.0 % | — | 0.000 |
| optimiseur | 100 % | 190.4 | 99 % | 282.1 | 0.990 | 16.9 % | 81.6 % | 1.870 |

## Bâtiments : part des parties avec niveau ≥ 1 (niveau moyen)

| profil | champs | pavillon | comptoir | bibliotheque | sanctuaire | clepsydre | garde |
| --- | --- | --- | --- | --- | --- | --- | --- |
| debutant | 100 % (23.6) | 100 % (14.7) | 100 % (11.4) | 100 % (9.7) | 100 % (8.1) | 100 % (6.8) | 100 % (9.9) |
| experimente | 100 % (15.6) | 100 % (15.0) | 100 % (19.1) | 100 % (17.4) | 100 % (9.1) | 100 % (8.0) | 100 % (10.0) |
| mono-chasser | 100 % (24.6) | 100 % (17.3) | 100 % (13.8) | 100 % (8.3) | 100 % (3.6) | 100 % (2.9) | 100 % (10.0) |
| mono-commercer | 100 % (7.1) | 100 % (6.5) | 100 % (23.0) | 100 % (8.1) | 100 % (3.6) | 100 % (2.9) | 100 % (4.5) |
| mono-cultiver | 100 % (26.0) | 100 % (10.4) | 100 % (8.9) | 100 % (7.3) | 100 % (3.6) | 100 % (2.9) | 100 % (7.1) |
| mono-etudier | 100 % (7.1) | 100 % (6.5) | 100 % (8.3) | 100 % (7.4) | 100 % (3.6) | 100 % (3.0) | 100 % (4.5) |
| mono-mediter | 100 % (7.2) | 100 % (6.6) | 100 % (9.3) | 100 % (7.3) | 100 % (6.6) | 100 % (5.2) | 100 % (4.6) |
| occasionnel | 100 % (8.8) | 100 % (7.9) | 100 % (9.6) | 100 % (8.5) | 100 % (4.0) | 100 % (3.1) | 100 % (6.0) |
| optimiseur | 100 % (24.2) | 71 % (3.6) | 24 % (2.5) | 3 % (0.3) | 0 % (0.0) | 0 % (0.0) | 19 % (1.4) |

## Améliorations d'Héritage : part des parties avec niveau ≥ 1 (niveau moyen)

| profil | prosperite | longevite | memoire | crypte | eveil | transmission | sang | etoile | patience | alliances | chroniques |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| debutant | 100 % (10.7) | 100 % (7.3) | 100 % (8.0) | 100 % (3.0) | 100 % (3.9) | 100 % (5.0) | 100 % (3.0) | 100 % (4.0) | 100 % (6.0) | 99 % (1.0) | 0 % (0.0) |
| experimente | 100 % (11.0) | 100 % (8.0) | 100 % (8.1) | 100 % (3.0) | 100 % (4.0) | 100 % (5.0) | 100 % (3.0) | 100 % (4.3) | 100 % (6.0) | 100 % (1.0) | 0 % (0.0) |
| mono-chasser | 100 % (12.0) | 100 % (8.9) | 100 % (9.0) | 100 % (3.8) | 100 % (4.0) | 100 % (5.0) | 100 % (3.0) | 100 % (5.0) | 100 % (7.0) | 100 % (1.0) | 100 % (1.0) |
| mono-commercer | 100 % (13.0) | 100 % (9.0) | 100 % (10.0) | 100 % (4.0) | 100 % (5.0) | 100 % (5.0) | 100 % (3.0) | 100 % (5.0) | 100 % (7.5) | 100 % (1.0) | 100 % (1.0) |
| mono-cultiver | 100 % (13.0) | 100 % (9.0) | 100 % (9.5) | 100 % (4.0) | 100 % (5.0) | 100 % (5.0) | 100 % (3.0) | 100 % (5.0) | 100 % (7.0) | 100 % (1.0) | 100 % (1.0) |
| mono-etudier | 100 % (11.4) | 100 % (8.0) | 100 % (9.0) | 100 % (3.0) | 100 % (4.0) | 100 % (5.0) | 100 % (3.0) | 100 % (5.0) | 100 % (6.6) | 100 % (1.0) | 79 % (0.8) |
| mono-mediter | 100 % (10.0) | 100 % (7.0) | 100 % (7.6) | 100 % (3.0) | 100 % (3.2) | 100 % (5.0) | 100 % (3.0) | 100 % (4.0) | 100 % (6.0) | 98 % (1.0) | 0 % (0.0) |
| occasionnel | 100 % (4.6) | 100 % (3.0) | 100 % (2.5) | 43 % (0.4) | 83 % (0.8) | 100 % (1.1) | 84 % (0.8) | 80 % (0.8) | 100 % (1.4) | 0 % (0.0) | 0 % (0.0) |
| optimiseur | 100 % (12.1) | 100 % (8.9) | 100 % (9.0) | 100 % (3.9) | 100 % (4.4) | 100 % (5.0) | 100 % (3.0) | 100 % (5.0) | 100 % (7.0) | 100 % (1.0) | 99 % (1.0) |

## Activités : part du temps héros / part des secondes d'Échos / parties où l'activité ≥ 5 % du temps héros

| profil | cultiver | chasser | commercer | etudier | mediter |
| --- | --- | --- | --- | --- | --- |
| debutant | 88 % / 88 % / 100 % | 3 % / 3 % / 3 % | 3 % / 3 % / 2 % | 3 % / 3 % / 3 % | 3 % / 3 % / 2 % |
| experimente | 16 % / 0 % / 100 % | 14 % / 0 % / 100 % | 42 % / 54 % / 100 % | 14 % / 46 % / 100 % | 14 % / 0 % / 100 % |
| mono-chasser | 2 % / 0 % / 0 % | 93 % / 100 % / 100 % | 3 % / 0 % / 0 % | 1 % / 0 % / 0 % | 1 % / 0 % / 0 % |
| mono-commercer | 18 % / 11 % / 100 % | 1 % / 0 % / 0 % | 79 % / 89 % / 100 % | 1 % / 0 % / 0 % | 1 % / 0 % / 0 % |
| mono-cultiver | 94 % / 100 % / 100 % | 1 % / 0 % / 0 % | 3 % / 0 % / 0 % | 1 % / 0 % / 0 % | 1 % / 0 % / 0 % |
| mono-etudier | 4 % / 1 % / 12 % | 1 % / 0 % / 0 % | 15 % / 8 % / 100 % | 79 % / 92 % / 100 % | 1 % / 0 % / 0 % |
| mono-mediter | 2 % / 0 % / 0 % | 1 % / 0 % / 0 % | 3 % / 0 % / 0 % | 1 % / 0 % / 0 % | 93 % / 100 % / 100 % |
| occasionnel | 19 % / 6 % / 100 % | 19 % / 8 % / 100 % | 35 % / 46 % / 100 % | 14 % / 39 % / 99 % | 13 % / 0 % / 96 % |
| optimiseur | 86 % / 86 % / 87 % | 10 % / 9 % / 13 % | 3 % / 2 % / 5 % | 2 % / 2 % / 3 % | 0 % / 0 % / 0 % |

## Traits : part des parties où le trait apparaît chez les 60 derniers ancêtres (fréquence moyenne)

| trait | debutant | experimente | mono-chasser | mono-commercer | mono-cultiver | mono-etudier | mono-mediter | occasionnel | optimiseur |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| main_verte | 98 % (17 %) | 82 % (6 %) | 77 % (5 %) | 79 % (5 %) | 85 % (5 %) | 76 % (5 %) | 85 % (6 %) | 88 % (14 %) | 28 % (1 %) |
| oeil_faucon | 99 % (17 %) | 82 % (7 %) | 79 % (6 %) | 78 % (5 %) | 79 % (6 %) | 79 % (6 %) | 88 % (7 %) | 82 % (11 %) | 34 % (1 %) |
| langue_argent | 99 % (16 %) | 87 % (7 %) | 82 % (6 %) | 79 % (5 %) | 83 % (6 %) | 79 % (6 %) | 87 % (6 %) | 86 % (13 %) | 33 % (1 %) |
| rat_biblio | 95 % (16 %) | 80 % (6 %) | 82 % (6 %) | 78 % (5 %) | 84 % (6 %) | 80 % (6 %) | 81 % (6 %) | 79 % (11 %) | 27 % (1 %) |
| ame_calme | 98 % (16 %) | 88 % (6 %) | 87 % (6 %) | 83 % (6 %) | 76 % (4 %) | 78 % (6 %) | 83 % (6 %) | 86 % (12 %) | 26 % (1 %) |
| robuste | 97 % (16 %) | 82 % (6 %) | 75 % (5 %) | 77 % (5 %) | 77 % (5 %) | 82 % (6 %) | 85 % (7 %) | 89 % (14 %) | 52 % (2 %) |
| curieux | 97 % (16 %) | 99 % (20 %) | 99 % (18 %) | 98 % (15 %) | 96 % (17 %) | 98 % (18 %) | 100 % (21 %) | 97 % (24 %) | 66 % (3 %) |
| fragile (−) | 54 % (2 %) | 59 % (2 %) | 41 % (1 %) | 37 % (1 %) | 31 % (1 %) | 47 % (1 %) | 64 % (2 %) | 78 % (7 %) | 22 % (1 %) |
| distrait (−) | 60 % (2 %) | 28 % (1 %) | 19 % (0 %) | 19 % (0 %) | 16 % (0 %) | 24 % (1 %) | 34 % (1 %) | 60 % (4 %) | 24 % (1 %) |
| maladroit (−) | 55 % (2 %) | 32 % (1 %) | 15 % (0 %) | 19 % (0 %) | 18 % (0 %) | 20 % (0 %) | 34 % (1 %) | 56 % (3 %) | 17 % (1 %) |
| prodige | 99 % (17 %) | 87 % (7 %) | 92 % (7 %) | 92 % (8 %) | 90 % (7 %) | 89 % (7 %) | 86 % (8 %) | 66 % (8 %) | 91 % (9 %) |
| longevite | 100 % (18 %) | 85 % (7 %) | 88 % (7 %) | 90 % (7 %) | 89 % (8 %) | 94 % (7 %) | 87 % (7 %) | 70 % (8 %) | 82 % (7 %) |
| harmonieux | 99 % (16 %) | 86 % (7 %) | 88 % (7 %) | 89 % (8 %) | 86 % (7 %) | 90 % (7 %) | 88 % (8 %) | 70 % (7 %) | 39 % (1 %) |
| echo_vibrant | 99 % (16 %) | 89 % (8 %) | 89 % (8 %) | 90 % (7 %) | 93 % (8 %) | 91 % (8 %) | 83 % (7 %) | 68 % (8 %) | 73 % (5 %) |
| fertile | 99 % (17 %) | 87 % (7 %) | 89 % (8 %) | 85 % (7 %) | 94 % (7 %) | 83 % (7 %) | 92 % (7 %) | 69 % (8 %) | 37 % (1 %) |
| polyvalent | 98 % (16 %) | 100 % (28 %) | 100 % (30 %) | 100 % (31 %) | 100 % (31 %) | 100 % (29 %) | 100 % (30 %) | 89 % (19 %) | 84 % (6 %) |
| maudit (−) | 91 % (4 %) | 95 % (6 %) | 98 % (7 %) | 94 % (7 %) | 100 % (7 %) | 95 % (7 %) | 94 % (7 %) | 60 % (4 %) | 54 % (2 %) |
| genie | 98 % (19 %) | 100 % (31 %) | 100 % (31 %) | 100 % (30 %) | 100 % (31 %) | 99 % (31 %) | 100 % (34 %) | 80 % (18 %) | 72 % (5 %) |
| memoire | 98 % (20 %) | 72 % (5 %) | 69 % (5 %) | 74 % (5 %) | 71 % (4 %) | 74 % (5 %) | 71 % (5 %) | 58 % (5 %) | 84 % (7 %) |
| centenaire | 99 % (21 %) | 73 % (5 %) | 72 % (5 %) | 70 % (5 %) | 71 % (5 %) | 71 % (4 %) | 81 % (5 %) | 54 % (5 %) | 92 % (11 %) |
| sang_dore | 99 % (22 %) | 100 % (56 %) | 100 % (56 %) | 100 % (57 %) | 100 % (58 %) | 100 % (57 %) | 100 % (55 %) | 81 % (25 %) | 92 % (13 %) |
| elu | 85 % (12 %) | 100 % (83 %) | 100 % (86 %) | 100 % (86 %) | 100 % (85 %) | 100 % (85 %) | 100 % (80 %) | 63 % (15 %) | 100 % (84 %) |
| eternel | 93 % (12 %) | 57 % (4 %) | 55 % (4 %) | 59 % (4 %) | 59 % (4 %) | 54 % (4 %) | 53 % (4 %) | 32 % (3 %) | 100 % (77 %) |
| astres (Bazar) | 0 % (0 %) | 0 % (0 %) | 0 % (0 %) | 0 % (0 %) | 0 % (0 %) | 0 % (0 %) | 0 % (0 %) | 0 % (0 %) | 0 % (0 %) |

## Corrélations avec log10Value (Pearson / Spearman, entre graines d'un même profil)

| profil | echoShare | harmonyAvg | harmonyMin | traitCombos60 | gen | vocationTierMax |
| --- | --- | --- | --- | --- | --- | --- |
| debutant | 0.53 / 0.53 | -0.63 / -0.64 | 0.03 / 0.01 | -0.16 / -0.15 | -0.21 / -0.17 | — / — |
| experimente | 0.61 / 0.57 | 0.06 / 0.01 | 0.04 / 0.10 | -0.10 / -0.12 | -0.16 / -0.17 | -0.03 / -0.02 |
| mono-chasser | 0.70 / 0.68 | -0.04 / -0.05 | -0.15 / -0.21 | -0.01 / -0.01 | -0.32 / -0.26 | — / — |
| mono-commercer | 0.80 / 0.81 | -0.33 / -0.13 | -0.03 / 0.00 | -0.11 / -0.09 | -0.25 / -0.22 | — / — |
| mono-cultiver | 0.80 / 0.78 | -0.14 / -0.11 | 0.05 / -0.01 | -0.14 / -0.15 | -0.21 / -0.17 | — / — |
| mono-etudier | 0.45 / 0.46 | -0.03 / -0.09 | 0.13 / 0.12 | -0.12 / -0.06 | -0.18 / -0.12 | — / — |
| mono-mediter | 0.94 / 0.92 | 0.21 / 0.13 | 0.01 / 0.02 | -0.04 / -0.04 | -0.86 / -0.83 | — / — |
| occasionnel | -0.61 / -0.61 | -0.09 / -0.10 | 0.06 / 0.08 | -0.01 / 0.04 | -0.11 / -0.06 | -0.05 / -0.04 |
| optimiseur | 0.67 / 0.81 | -0.53 / -0.57 | -0.14 / -0.09 | -0.08 / -0.20 | -0.05 / 0.04 | — / — |

## Puissance : graines par groupe pour détecter un écart de 5 % (α 0,05, puissance 0,8, comparaison non appariée)

| profil | valeur (×1,05) | legacyTotal | gen | echoShare | harmonyAvg | traitCombos60 | harmonyAvg ±0,01 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| debutant | 334 | 26 | 2 | 1 | 1 | 18 | 4 |
| experimente | 41 | 4 | 2 | 1 | 1 | 110 | 1 |
| mono-chasser | 30 | 3 | 3 | 1 | 1 | 137 | 1 |
| mono-commercer | 64 | 5 | 4 | 1 | 1 | 124 | 1 |
| mono-cultiver | 33 | 4 | 4 | 1 | 1 | 139 | 16 |
| mono-etudier | 203 | 23 | 4 | 1 | 1 | 135 | 1 |
| mono-mediter | 475 | 10 | 11 | 2 | 1 | 102 | 1 |
| occasionnel | 2171 | 71 | 13 | 1514 | 1 | 41 | 14 |
| optimiseur | 393 | 20 | 4 | 1 | 27 | 476 | 465 |

## Valeurs aberrantes (|z| > 3 sur log10Value) et baisses de débit horaire

| profil | n aberrantes | graines | parties avec ≥ 1 baisse > 5 % du débit horaire | baisses / partie |
| --- | --- | --- | --- | --- |
| debutant | 1 | 193 (z -3.8) | 15 % | 0.15 |
| experimente | 3 | 46 (z 4.7), 155 (z 3.4), 168 (z 3.3) | 0 % | 0.00 |
| mono-chasser | 0 | — | 1 % | 0.01 |
| mono-commercer | 4 | 24 (z 3.4), 31 (z 3.0), 64 (z -3.5), 79 (z 4.1) | 0 % | 0.00 |
| mono-cultiver | 0 | — | 0 % | 0.00 |
| mono-etudier | 1 | 93 (z 7.5) | 2 % | 0.01 |
| mono-mediter | 0 | — | 1 % | 0.01 |
| occasionnel | 0 | — | 0 % | 0.00 |
| optimiseur | 6 | 5 (z -3.0), 22 (z -3.3), 43 (z -3.2), 59 (z -3.1), 66 (z -3.1), 147 (z -3.3) | 1 % | 0.01 |

## Valeur log10 médiane par heure

| profil | h1 | h2 | h3 | h4 | h5 | h6 |
| --- | --- | --- | --- | --- | --- | --- |
| debutant | 5.64 | 6.45 | 7.01 | 7.58 | 7.96 | 8.22 |
| experimente | 6.04 | 7.03 | 7.51 | 7.83 | 8.07 | 8.25 |
| mono-chasser | 6.41 | 7.40 | 7.82 | 8.08 | 8.27 | 8.43 |
| mono-commercer | 6.44 | 7.42 | 7.95 | 8.40 | 8.69 | 8.93 |
| mono-cultiver | 6.32 | 7.48 | 8.03 | 8.35 | 8.58 | 8.77 |
| mono-etudier | 6.20 | 7.07 | 7.48 | 7.75 | 7.95 | 8.11 |
| mono-mediter | 5.86 | 6.60 | 6.98 | 7.22 | 7.40 | 7.56 |
| occasionnel |
| optimiseur | 6.60 | 7.44 | 7.93 | 8.22 | 8.44 | 8.61 |

## harmonyMin identique (même graine) entre profils

| paire | part des graines identiques |
| --- | --- |
| debutant~experimente | 0 % |
| debutant~mono-chasser | 0 % |
| debutant~mono-commercer | 0 % |
| debutant~mono-cultiver | 0 % |
| debutant~mono-etudier | 0 % |
| debutant~mono-mediter | 0 % |
| debutant~occasionnel | 0 % |
| debutant~optimiseur | 0 % |
| experimente~mono-chasser | 0 % |
| experimente~mono-commercer | 0 % |
| experimente~mono-cultiver | 0 % |
| experimente~mono-etudier | 0 % |
| experimente~mono-mediter | 0 % |
| experimente~occasionnel | 0 % |
| experimente~optimiseur | 0 % |
| mono-chasser~mono-commercer | 14 % |
| mono-chasser~mono-cultiver | 14 % |
| mono-chasser~mono-etudier | 14 % |
| mono-chasser~mono-mediter | 14 % |
| mono-chasser~occasionnel | 0 % |
| mono-chasser~optimiseur | 0 % |
| mono-commercer~mono-cultiver | 100 % |
| mono-commercer~mono-etudier | 100 % |
| mono-commercer~mono-mediter | 100 % |
| mono-commercer~occasionnel | 0 % |
| mono-commercer~optimiseur | 0 % |
| mono-cultiver~mono-etudier | 100 % |
| mono-cultiver~mono-mediter | 100 % |
| mono-cultiver~occasionnel | 0 % |
| mono-cultiver~optimiseur | 0 % |
| mono-etudier~mono-mediter | 100 % |
| mono-etudier~occasionnel | 0 % |
| mono-etudier~optimiseur | 0 % |
| mono-mediter~occasionnel | 0 % |
| mono-mediter~optimiseur | 0 % |
| occasionnel~optimiseur | 0 % |
