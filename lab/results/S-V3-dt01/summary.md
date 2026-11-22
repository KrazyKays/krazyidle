# Campagne S-V3-dt01

- Commit : `cc23380`
- Commande : `npm run sim -- --id=S-V3-dt01 --profiles=experimente,optimiseur --seeds=1-50 --hours=6 --dt=0.1`
- 100 parties · 6 h · dt 0.1 s · événements non · 96.5 s

> Résultats **[SIMULÉS]** : profils automatiques, pas de vrais joueurs. `never.*` = part des parties sans déblocage ; `unlock.*` / `upgradeAt.*` ne portent que sur les parties qui débloquent (n). Décision avant/après : `npm run sim:guard` (pas `sim:compare`).

## experimente

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 50 | 162.0 | 2.338 | 159.0 | 162.0 | 164.0 | 157.0 | 168.0 |
| legacyTotal | 50 | 2158 | 39.9 | 2104 | 2166 | 2207 | 2071 | 2234 |
| log10Value | 50 | 8.230 | 0.036 | 8.181 | 8.234 | 8.277 | 8.154 | 8.296 |
| echoShare | 50 | 0.930 | 0.005 | 0.923 | 0.930 | 0.937 | 0.919 | 0.941 |
| harmonyAvg | 50 | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| traitCombos60 | 50 | 40.7 | 3.571 | 36.0 | 41.0 | 45.0 | 34.0 | 49.0 |
| epithetsFound | 50 | 5.180 | 0.388 | 5.000 | 5.000 | 6.000 | 5.000 | 6.000 |
| eventsDone | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 50 | 15.6 | 1.476 | 12.3 | 16.3 | 16.3 | 12.3 | 16.3 |
| unlock.etudier | 50 | 48.2 | 3.767 | 41.2 | 50.8 | 51.7 | 41.2 | 51.7 |
| never.etudier | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.mediter | 50 | 316.1 | 65.1 | 270.4 | 331.5 | 353.4 | 78.0 | 399.6 |
| never.mediter | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.alliances | 50 | 9359 | 642.4 | 8589 | 9444 | 9984 | 7764 | 11059 |
| never.alliances | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 50 | 16788 | 702.9 | 15894 | 16736 | 17756 | 15464 | 18914 |
| never.chroniques | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : commercer 46 % · cultiver 19 % · etudier 17 % · mediter 18 %

## optimiseur

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 50 | 159.9 | 3.382 | 156.0 | 159.0 | 163.0 | 153.0 | 171.0 |
| legacyTotal | 50 | 4393 | 85.1 | 4293 | 4397 | 4492 | 4176 | 4613 |
| log10Value | 50 | 8.738 | 0.038 | 8.695 | 8.733 | 8.779 | 8.669 | 8.852 |
| echoShare | 50 | 0.866 | 0.009 | 0.856 | 0.864 | 0.878 | 0.850 | 0.892 |
| harmonyAvg | 50 | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| traitCombos60 | 50 | 31.2 | 3.967 | 26.0 | 32.0 | 36.0 | 22.0 | 37.0 |
| epithetsFound | 50 | 3.020 | 0.141 | 3.000 | 3.000 | 3.000 | 3.000 | 4.000 |
| eventsDone | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 50 | 15.6 | 1.476 | 12.3 | 16.3 | 16.3 | 12.3 | 16.3 |
| unlock.etudier | 0 | — | — | — | — | — | — | — |
| never.etudier | 50 | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| unlock.mediter | 0 | — | — | — | — | — | — | — |
| never.mediter | 50 | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| upgradeAt.alliances | 50 | 6125 | 468.9 | 5604 | 6139 | 6619 | 4919 | 7219 |
| never.alliances | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 50 | 9983 | 573.1 | 9314 | 10014 | 10599 | 8674 | 11314 |
| never.chroniques | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : commercer 0 % · cultiver 100 % · etudier 0 % · mediter 0 %
