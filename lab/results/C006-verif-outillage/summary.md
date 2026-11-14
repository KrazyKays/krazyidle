# Campagne C006-verif-outillage

- Commit : `8033a0e`
- Commande : `npm run sim -- --profiles=experimente,occasionnel,optimiseur --seeds=1-20 --hours=6 --workers=2 --id=C006-verif-outillage`
- 60 parties · 6 h · dt 0.5 s · événements non · 11.3 s

> Résultats **[SIMULÉS]** : profils automatiques, pas de vrais joueurs. `never.*` = part des parties sans déblocage ; `unlock.*` / `upgradeAt.*` ne portent que sur les parties qui débloquent (n). Décision avant/après : `npm run sim:guard` (pas `sim:compare`).

## experimente

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 20 | 168.9 | 2.645 | 166.0 | 170.0 | 171.0 | 163.0 | 174.0 |
| legacyTotal | 20 | 2204 | 48.6 | 2147 | 2204 | 2256 | 2131 | 2315 |
| log10Value | 20 | 8.263 | 0.030 | 8.228 | 8.264 | 8.285 | 8.205 | 8.341 |
| echoShare | 20 | 0.929 | 0.002 | 0.926 | 0.929 | 0.932 | 0.923 | 0.933 |
| harmonyAvg | 20 | 0.980 | 0.002 | 0.978 | 0.980 | 0.983 | 0.977 | 0.984 |
| traitCombos60 | 20 | 34.6 | 4.925 | 29.0 | 35.0 | 38.0 | 26.0 | 49.0 |
| epithetsFound | 20 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| eventsDone | 20 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 20 | 16.7 | 1.824 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 20 | 67.9 | 11.4 | 55.0 | 77.5 | 78.0 | 53.5 | 78.0 |
| never.etudier | 20 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.mediter | 20 | 122.3 | 33.7 | 88.0 | 141.5 | 154.0 | 83.0 | 192.0 |
| never.mediter | 20 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.alliances | 20 | 16073 | 730.0 | 15361 | 15886 | 17366 | 15091 | 17716 |
| never.alliances | 20 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 0 | — | — | — | — | — | — | — |
| never.chroniques | 20 | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| anomalies | 20 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 14 % · commercer 42 % · cultiver 16 % · etudier 14 % · mediter 14 %

## occasionnel

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 20 | 28.4 | 1.142 | 27.0 | 28.0 | 30.0 | 27.0 | 31.0 |
| legacyTotal | 20 | 117.3 | 10.6 | 105.0 | 114.0 | 129.0 | 105.0 | 140.0 |
| log10Value | 20 | 6.145 | 0.153 | 5.978 | 6.212 | 6.292 | 5.727 | 6.321 |
| echoShare | 20 | 0.928 | 0.027 | 0.896 | 0.930 | 0.953 | 0.847 | 0.957 |
| harmonyAvg | 20 | 0.989 | 0.012 | 0.972 | 0.995 | 0.996 | 0.963 | 0.997 |
| traitCombos60 | 20 | 23.6 | 1.818 | 22.0 | 24.0 | 26.0 | 20.0 | 27.0 |
| epithetsFound | 20 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| eventsDone | 20 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 20 | 16.7 | 1.824 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 20 | 75.0 | 16.0 | 56.5 | 87.0 | 89.5 | 55.5 | 89.5 |
| never.etudier | 20 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.mediter | 20 | 156.6 | 72.1 | 92.5 | 160.0 | 221.0 | 89.5 | 326.0 |
| never.mediter | 20 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.alliances | 0 | — | — | — | — | — | — | — |
| never.alliances | 20 | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| upgradeAt.chroniques | 0 | — | — | — | — | — | — | — |
| never.chroniques | 20 | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| anomalies | 20 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 19 % · commercer 34 % · cultiver 20 % · etudier 15 % · mediter 12 %

## optimiseur

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 20 | 154.7 | 3.935 | 149.0 | 156.0 | 159.0 | 145.0 | 160.0 |
| legacyTotal | 20 | 3556 | 171.5 | 3411 | 3558 | 3714 | 3116 | 4001 |
| log10Value | 20 | 8.611 | 0.094 | 8.600 | 8.617 | 8.643 | 8.268 | 8.819 |
| echoShare | 20 | 0.860 | 0.009 | 0.853 | 0.863 | 0.868 | 0.833 | 0.871 |
| harmonyAvg | 20 | 0.833 | 0.051 | 0.813 | 0.816 | 0.847 | 0.804 | 0.987 |
| traitCombos60 | 20 | 14.9 | 4.605 | 9.000 | 15.0 | 22.0 | 8.000 | 23.0 |
| epithetsFound | 20 | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| eventsDone | 20 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 20 | 16.5 | 1.835 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 7 | 194.9 | 101.3 | 89.5 | 213.0 | 268.0 | 88.5 | 354.5 |
| never.etudier | 20 | 0.650 | 0.489 | 0.000 | 1.000 | 1.000 | 0.000 | 1.000 |
| unlock.mediter | 0 | — | — | — | — | — | — | — |
| never.mediter | 20 | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| upgradeAt.alliances | 20 | 11698 | 700.1 | 10876 | 11691 | 12496 | 10401 | 13116 |
| never.alliances | 20 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 20 | 16870 | 1117 | 15501 | 16961 | 18436 | 15426 | 18911 |
| never.chroniques | 20 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 20 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 6 % · commercer 4 % · cultiver 90 % · etudier 0 % · mediter 0 %
