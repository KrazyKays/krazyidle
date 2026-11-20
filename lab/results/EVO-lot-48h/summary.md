# Campagne EVO-lot-48h

- Commit : `inconnu`
- Commande : `npm run sim -- --profiles=experimente,optimiseur,evenementiel --seeds=1-40 --hours=48 --events --id=EVO-lot-48h`
- 120 parties · 48 h · dt 0.5 s · événements oui · 195.5 s

> Résultats **[SIMULÉS]** : profils automatiques, pas de vrais joueurs. `never.*` = part des parties sans déblocage ; `unlock.*` / `upgradeAt.*` ne portent que sur les parties qui débloquent (n). Décision avant/après : `npm run sim:guard` (pas `sim:compare`).

## evenementiel

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 40 | 858.7 | 5.115 | 852.0 | 858.0 | 867.0 | 848.0 | 868.0 |
| legacyTotal | 40 | 33056 | 613.5 | 32163 | 33237 | 33703 | 31535 | 33960 |
| log10Value | 40 | 11.4 | 0.043 | 11.3 | 11.4 | 11.4 | 11.3 | 11.5 |
| echoShare | 40 | 0.992 | 0.001 | 0.992 | 0.993 | 0.993 | 0.991 | 0.994 |
| harmonyAvg | 40 | 0.980 | 0.003 | 0.976 | 0.980 | 0.985 | 0.973 | 0.987 |
| traitCombos60 | 40 | 41.0 | 4.577 | 35.0 | 42.0 | 47.0 | 31.0 | 50.0 |
| epithetsFound | 40 | 14.9 | 1.202 | 14.0 | 15.0 | 16.0 | 13.0 | 18.0 |
| eventsDone | 40 | 5.350 | 0.622 | 5.000 | 5.000 | 6.000 | 5.000 | 7.000 |
| unlock.commercer | 40 | 16.6 | 1.919 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 40 | 64.8 | 10.8 | 55.0 | 60.5 | 77.5 | 53.5 | 77.5 |
| never.etudier | 40 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.mediter | 40 | 128.3 | 46.2 | 89.5 | 97.0 | 200.0 | 80.0 | 215.0 |
| never.mediter | 40 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.alliances | 40 | 9702 | 619.5 | 8761 | 9676 | 10421 | 8466 | 10911 |
| never.alliances | 40 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 40 | 15672 | 743.1 | 14716 | 15691 | 16446 | 14486 | 17486 |
| never.chroniques | 40 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 40 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 13 % · commercer 38 % · cultiver 13 % · etudier 18 % · mediter 18 %

## experimente

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 40 | 903.8 | 5.700 | 897.0 | 904.0 | 911.0 | 890.0 | 914.0 |
| legacyTotal | 40 | 27985 | 400.6 | 27752 | 28006 | 28340 | 26727 | 28831 |
| log10Value | 40 | 10.7 | 0.031 | 10.7 | 10.7 | 10.7 | 10.6 | 10.7 |
| echoShare | 40 | 0.984 | 0.001 | 0.983 | 0.984 | 0.985 | 0.983 | 0.986 |
| harmonyAvg | 40 | 0.984 | 0.002 | 0.983 | 0.984 | 0.986 | 0.978 | 0.987 |
| traitCombos60 | 40 | 40.5 | 4.904 | 34.0 | 42.0 | 46.0 | 31.0 | 47.0 |
| epithetsFound | 40 | 8.150 | 0.949 | 7.000 | 8.000 | 9.000 | 6.000 | 10.0 |
| eventsDone | 40 | 3.525 | 0.816 | 3.000 | 3.000 | 5.000 | 2.000 | 5.000 |
| unlock.commercer | 40 | 16.6 | 1.919 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 40 | 64.8 | 10.8 | 55.0 | 60.5 | 77.5 | 53.5 | 77.5 |
| never.etudier | 40 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.mediter | 40 | 128.3 | 46.2 | 89.5 | 97.0 | 200.0 | 80.0 | 215.0 |
| never.mediter | 40 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.alliances | 40 | 9702 | 619.5 | 8761 | 9676 | 10421 | 8466 | 10911 |
| never.alliances | 40 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 40 | 17536 | 555.5 | 16776 | 17636 | 18111 | 16236 | 18941 |
| never.chroniques | 40 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 40 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 14 % · commercer 44 % · cultiver 14 % · etudier 14 % · mediter 14 %

## optimiseur

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 40 | 1032 | 7.391 | 1024 | 1031 | 1043 | 1015 | 1050 |
| legacyTotal | 40 | 57340 | 487.0 | 56755 | 57311 | 57922 | 56478 | 58693 |
| log10Value | 40 | 10.9 | 0.033 | 10.8 | 10.9 | 10.9 | 10.8 | 11.0 |
| echoShare | 40 | 0.948 | 0.003 | 0.944 | 0.948 | 0.952 | 0.940 | 0.956 |
| harmonyAvg | 40 | 0.674 | 0.035 | 0.658 | 0.663 | 0.700 | 0.655 | 0.791 |
| traitCombos60 | 40 | 33.3 | 4.615 | 27.0 | 34.0 | 40.0 | 25.0 | 41.0 |
| epithetsFound | 40 | 7.375 | 1.444 | 6.000 | 7.000 | 8.000 | 6.000 | 13.0 |
| eventsDone | 40 | 1.050 | 0.221 | 1.000 | 1.000 | 1.000 | 1.000 | 2.000 |
| unlock.commercer | 40 | 16.3 | 1.905 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 11 | 129.5 | 67.8 | 89.5 | 91.5 | 221.5 | 88.5 | 294.5 |
| never.etudier | 40 | 0.725 | 0.452 | 0.000 | 1.000 | 1.000 | 0.000 | 1.000 |
| unlock.mediter | 0 | — | — | — | — | — | — | — |
| never.mediter | 40 | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| upgradeAt.alliances | 40 | 6315 | 439.9 | 5676 | 6516 | 6751 | 5316 | 7016 |
| never.alliances | 40 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 40 | 10523 | 546.8 | 9771 | 10566 | 11201 | 9246 | 11546 |
| never.chroniques | 40 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 40 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 1 % · commercer 0 % · cultiver 99 % · etudier 0 % · mediter 0 %
