# Campagne EVO-v0.6

- Commit : `5b2df5f` (**src/ modifié**)
- Commande : `npm run sim -- --profiles=experimente,optimiseur --seeds=1-200 --hours=6 --id=EVO-v0.6`
- 400 parties · 6 h · dt 0.5 s · événements non · 49.0 s

> Résultats **[SIMULÉS]** : profils automatiques, pas de vrais joueurs. `never.*` = part des parties sans déblocage ; `unlock.*` / `upgradeAt.*` ne portent que sur les parties qui débloquent (n). Décision avant/après : `npm run sim:guard` (pas `sim:compare`).

## experimente

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 200 | 165.1 | 3.421 | 161.0 | 165.0 | 170.0 | 155.0 | 173.0 |
| legacyTotal | 200 | 1954 | 38.3 | 1905 | 1954 | 2002 | 1851 | 2068 |
| log10Value | 200 | 8.094 | 0.042 | 8.045 | 8.090 | 8.153 | 7.992 | 8.240 |
| echoShare | 200 | 0.930 | 0.005 | 0.924 | 0.930 | 0.936 | 0.918 | 0.949 |
| harmonyAvg | 200 | 0.979 | 0.002 | 0.977 | 0.979 | 0.981 | 0.966 | 0.983 |
| traitCombos60 | 200 | 42.6 | 4.298 | 37.0 | 43.0 | 48.0 | 30.0 | 52.0 |
| epithetsFound | 200 | 4.925 | 0.694 | 4.000 | 5.000 | 5.000 | 2.000 | 7.000 |
| eventsDone | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 200 | 16.7 | 1.697 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 200 | 63.2 | 9.807 | 53.5 | 60.5 | 77.5 | 53.5 | 77.5 |
| never.etudier | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.mediter | 200 | 119.7 | 44.2 | 87.5 | 96.0 | 198.0 | 80.0 | 323.5 |
| never.mediter | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.alliances | 200 | 10182 | 661.9 | 9201 | 10181 | 11031 | 8616 | 11936 |
| never.alliances | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 200 | 18331 | 720.1 | 17306 | 18431 | 19131 | 16681 | 20546 |
| never.chroniques | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 14 % · commercer 42 % · cultiver 16 % · etudier 14 % · mediter 14 %

## optimiseur

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 200 | 165.8 | 4.726 | 161.0 | 166.0 | 171.0 | 147.0 | 181.0 |
| legacyTotal | 200 | 3858 | 191.6 | 3516 | 3912 | 4009 | 3192 | 4247 |
| log10Value | 200 | 8.548 | 0.092 | 8.367 | 8.573 | 8.629 | 8.264 | 8.710 |
| echoShare | 200 | 0.866 | 0.012 | 0.851 | 0.866 | 0.880 | 0.838 | 0.900 |
| harmonyAvg | 200 | 0.844 | 0.052 | 0.816 | 0.823 | 0.970 | 0.807 | 0.986 |
| traitCombos60 | 200 | 31.5 | 6.417 | 25.0 | 32.0 | 38.0 | 6.000 | 44.0 |
| epithetsFound | 200 | 4.170 | 0.658 | 4.000 | 4.000 | 5.000 | 3.000 | 7.000 |
| eventsDone | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 200 | 16.5 | 1.710 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 59 | 135.6 | 94.0 | 89.0 | 117.0 | 201.0 | 88.5 | 718.5 |
| never.etudier | 200 | 0.705 | 0.457 | 0.000 | 1.000 | 1.000 | 0.000 | 1.000 |
| unlock.mediter | 2 | 1450 | 1671 | 268.0 | 2632 | 2632 | 268.0 | 2632 |
| never.mediter | 200 | 0.990 | 0.100 | 1.000 | 1.000 | 1.000 | 0.000 | 1.000 |
| upgradeAt.alliances | 200 | 6355 | 463.0 | 5781 | 6346 | 6871 | 5031 | 9041 |
| never.alliances | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 200 | 10903 | 706.4 | 9976 | 10846 | 11801 | 9601 | 13061 |
| never.chroniques | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 13 % · commercer 1 % · cultiver 86 % · etudier 0 % · mediter 0 %
