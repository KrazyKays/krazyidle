# Campagne EVO-v0.25

- Commit : `5b2df5f` (**src/ modifié**)
- Commande : `npm run sim -- --profiles=experimente,optimiseur --seeds=1-200 --hours=6 --id=EVO-v0.25`
- 400 parties · 6 h · dt 0.5 s · événements non · 44.0 s

> Résultats **[SIMULÉS]** : profils automatiques, pas de vrais joueurs. `never.*` = part des parties sans déblocage ; `unlock.*` / `upgradeAt.*` ne portent que sur les parties qui débloquent (n). Décision avant/après : `npm run sim:guard` (pas `sim:compare`).

## experimente

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 200 | 167.0 | 2.913 | 163.0 | 167.0 | 171.0 | 157.0 | 173.0 |
| legacyTotal | 200 | 1947 | 35.5 | 1902 | 1948 | 1993 | 1848 | 2046 |
| log10Value | 200 | 8.083 | 0.041 | 8.030 | 8.082 | 8.134 | 7.991 | 8.206 |
| echoShare | 200 | 0.930 | 0.005 | 0.923 | 0.930 | 0.936 | 0.918 | 0.944 |
| harmonyAvg | 200 | 0.979 | 0.002 | 0.977 | 0.980 | 0.981 | 0.966 | 0.984 |
| traitCombos60 | 200 | 42.3 | 4.058 | 37.0 | 43.0 | 47.0 | 31.0 | 50.0 |
| epithetsFound | 200 | 4.920 | 0.570 | 4.000 | 5.000 | 5.000 | 2.000 | 6.000 |
| eventsDone | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 200 | 16.7 | 1.697 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 200 | 63.2 | 9.807 | 53.5 | 60.5 | 77.5 | 53.5 | 77.5 |
| never.etudier | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.mediter | 200 | 119.8 | 44.1 | 87.5 | 96.0 | 198.0 | 80.0 | 323.5 |
| never.mediter | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.alliances | 200 | 10075 | 638.6 | 9216 | 10046 | 10851 | 8776 | 11996 |
| never.alliances | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 200 | 18359 | 564.4 | 17641 | 18381 | 18941 | 17001 | 20051 |
| never.chroniques | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 14 % · commercer 42 % · cultiver 16 % · etudier 14 % · mediter 14 %

## optimiseur

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 200 | 166.7 | 4.281 | 161.0 | 167.0 | 172.0 | 154.0 | 178.0 |
| legacyTotal | 200 | 3838 | 206.3 | 3455 | 3902 | 4004 | 3114 | 4116 |
| log10Value | 200 | 8.547 | 0.097 | 8.347 | 8.569 | 8.631 | 8.273 | 8.762 |
| echoShare | 200 | 0.868 | 0.012 | 0.854 | 0.867 | 0.882 | 0.836 | 0.909 |
| harmonyAvg | 200 | 0.844 | 0.053 | 0.814 | 0.823 | 0.971 | 0.807 | 0.976 |
| traitCombos60 | 200 | 32.2 | 5.921 | 26.0 | 33.0 | 39.0 | 6.000 | 45.0 |
| epithetsFound | 200 | 4.220 | 0.666 | 4.000 | 4.000 | 5.000 | 3.000 | 8.000 |
| eventsDone | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 200 | 16.5 | 1.710 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 57 | 126.3 | 54.3 | 89.5 | 117.0 | 201.0 | 88.5 | 365.5 |
| never.etudier | 200 | 0.715 | 0.453 | 0.000 | 1.000 | 1.000 | 0.000 | 1.000 |
| unlock.mediter | 3 | 3733 | 3622 | 268.0 | 3436 | 7494 | 268.0 | 7494 |
| never.mediter | 200 | 0.985 | 0.122 | 1.000 | 1.000 | 1.000 | 0.000 | 1.000 |
| upgradeAt.alliances | 200 | 6367 | 486.2 | 5751 | 6386 | 6916 | 5031 | 8131 |
| never.alliances | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 200 | 10853 | 645.6 | 10016 | 10871 | 11611 | 9321 | 12821 |
| never.chroniques | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 14 % · commercer 0 % · cultiver 86 % · etudier 0 % · mediter 0 %
