# Campagne EVO-ref-traits

- Commit : `f910153`
- Commande : `npm run sim -- --profiles=experimente,optimiseur --seeds=1-200 --hours=6 --id=EVO-ref-traits`
- 400 parties · 6 h · dt 0.5 s · événements non · 39.0 s

> Résultats **[SIMULÉS]** : profils automatiques, pas de vrais joueurs. `never.*` = part des parties sans déblocage ; `unlock.*` / `upgradeAt.*` ne portent que sur les parties qui débloquent (n). Décision avant/après : `npm run sim:guard` (pas `sim:compare`).

## experimente

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 200 | 164.8 | 2.858 | 161.0 | 165.0 | 168.0 | 156.0 | 172.0 |
| legacyTotal | 200 | 2152 | 43.1 | 2100 | 2153 | 2215 | 2042 | 2255 |
| log10Value | 200 | 8.221 | 0.031 | 8.183 | 8.222 | 8.260 | 8.122 | 8.315 |
| echoShare | 200 | 0.929 | 0.004 | 0.924 | 0.929 | 0.934 | 0.913 | 0.940 |
| harmonyAvg | 200 | 0.979 | 0.002 | 0.977 | 0.980 | 0.982 | 0.971 | 0.985 |
| traitCombos60 | 200 | 34.1 | 4.238 | 28.0 | 34.0 | 39.0 | 23.0 | 45.0 |
| epithetsFound | 200 | 5.130 | 0.379 | 5.000 | 5.000 | 6.000 | 4.000 | 6.000 |
| eventsDone | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 200 | 16.7 | 1.697 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 200 | 63.2 | 9.807 | 53.5 | 60.5 | 77.5 | 53.5 | 77.5 |
| never.etudier | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.mediter | 200 | 114.2 | 35.9 | 87.0 | 96.0 | 158.5 | 77.5 | 300.5 |
| never.mediter | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.alliances | 200 | 9414 | 628.2 | 8536 | 9461 | 10246 | 7901 | 10886 |
| never.alliances | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 200 | 16939 | 684.3 | 16086 | 16951 | 17721 | 15346 | 19171 |
| never.chroniques | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 15 % · commercer 42 % · cultiver 15 % · etudier 14 % · mediter 14 %

## optimiseur

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 200 | 152.6 | 3.549 | 148.0 | 153.0 | 157.0 | 143.0 | 163.0 |
| legacyTotal | 200 | 4054 | 204.6 | 3937 | 4107 | 4212 | 3405 | 4289 |
| log10Value | 200 | 8.650 | 0.092 | 8.617 | 8.674 | 8.702 | 8.346 | 8.813 |
| echoShare | 200 | 0.869 | 0.007 | 0.860 | 0.870 | 0.878 | 0.849 | 0.887 |
| harmonyAvg | 200 | 0.827 | 0.049 | 0.804 | 0.809 | 0.864 | 0.800 | 0.975 |
| traitCombos60 | 200 | 15.0 | 4.500 | 9.000 | 15.0 | 21.0 | 5.000 | 26.0 |
| epithetsFound | 200 | 4.105 | 0.464 | 4.000 | 4.000 | 4.000 | 3.000 | 7.000 |
| eventsDone | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 200 | 16.5 | 1.710 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 51 | 121.9 | 47.3 | 89.5 | 116.5 | 192.5 | 88.5 | 341.0 |
| never.etudier | 200 | 0.745 | 0.437 | 0.000 | 1.000 | 1.000 | 0.000 | 1.000 |
| unlock.mediter | 1 | 167.0 | 0.000 | 167.0 | 167.0 | 167.0 | 167.0 | 167.0 |
| never.mediter | 200 | 0.995 | 0.071 | 1.000 | 1.000 | 1.000 | 0.000 | 1.000 |
| upgradeAt.alliances | 200 | 6412 | 444.1 | 5826 | 6471 | 6966 | 5056 | 7521 |
| never.alliances | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 200 | 10721 | 696.6 | 9786 | 10766 | 11516 | 9226 | 12476 |
| never.chroniques | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 10 % · commercer 0 % · cultiver 90 % · etudier 0 % · mediter 0 %
