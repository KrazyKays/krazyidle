# Campagne FEAT-48h

- Commit : `inconnu`
- Commande : `npm run sim -- --profiles=experimente,optimiseur,evenementiel --seeds=1-20 --hours=48 --events --id=FEAT-48h`
- 60 parties · 48 h · dt 0.5 s · événements oui · 101.5 s

> Résultats **[SIMULÉS]** : profils automatiques, pas de vrais joueurs. `never.*` = part des parties sans déblocage ; `unlock.*` / `upgradeAt.*` ne portent que sur les parties qui débloquent (n). Décision avant/après : `npm run sim:guard` (pas `sim:compare`).

## evenementiel

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 20 | 858.3 | 6.122 | 851.0 | 857.0 | 867.0 | 848.0 | 868.0 |
| legacyTotal | 20 | 32882 | 629.4 | 32074 | 32831 | 33703 | 31535 | 33837 |
| log10Value | 20 | 11.4 | 0.043 | 11.3 | 11.4 | 11.4 | 11.3 | 11.5 |
| echoShare | 20 | 0.992 | 0.001 | 0.991 | 0.992 | 0.993 | 0.991 | 0.993 |
| harmonyAvg | 20 | 0.981 | 0.003 | 0.978 | 0.982 | 0.985 | 0.976 | 0.987 |
| traitCombos60 | 20 | 41.5 | 4.249 | 37.0 | 42.0 | 47.0 | 32.0 | 48.0 |
| epithetsFound | 20 | 14.9 | 1.395 | 13.0 | 15.0 | 17.0 | 13.0 | 18.0 |
| eventsDone | 20 | 5.250 | 0.550 | 5.000 | 5.000 | 6.000 | 5.000 | 7.000 |
| unlock.commercer | 20 | 16.7 | 1.824 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 20 | 67.2 | 11.0 | 55.0 | 77.5 | 77.5 | 53.5 | 77.5 |
| never.etudier | 20 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.mediter | 20 | 136.3 | 46.2 | 90.0 | 143.0 | 200.0 | 80.0 | 213.5 |
| never.mediter | 20 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.alliances | 20 | 9781 | 552.6 | 9146 | 9821 | 10456 | 8466 | 10481 |
| never.alliances | 20 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 20 | 15743 | 428.4 | 15211 | 15841 | 16211 | 15026 | 16516 |
| never.chroniques | 20 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 20 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 13 % · commercer 38 % · cultiver 13 % · etudier 18 % · mediter 18 %

## experimente

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 20 | 905.3 | 5.639 | 899.0 | 906.0 | 911.0 | 893.0 | 914.0 |
| legacyTotal | 20 | 28000 | 425.3 | 27752 | 28032 | 28340 | 26739 | 28831 |
| log10Value | 20 | 10.7 | 0.035 | 10.7 | 10.7 | 10.7 | 10.6 | 10.7 |
| echoShare | 20 | 0.984 | 0.001 | 0.983 | 0.984 | 0.985 | 0.983 | 0.985 |
| harmonyAvg | 20 | 0.984 | 0.002 | 0.983 | 0.984 | 0.986 | 0.979 | 0.986 |
| traitCombos60 | 20 | 40.0 | 5.236 | 33.0 | 41.0 | 46.0 | 31.0 | 47.0 |
| epithetsFound | 20 | 8.350 | 0.745 | 8.000 | 8.000 | 9.000 | 7.000 | 10.0 |
| eventsDone | 20 | 3.550 | 0.826 | 3.000 | 4.000 | 4.000 | 2.000 | 5.000 |
| unlock.commercer | 20 | 16.7 | 1.824 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 20 | 67.2 | 11.0 | 55.0 | 77.5 | 77.5 | 53.5 | 77.5 |
| never.etudier | 20 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.mediter | 20 | 136.3 | 46.2 | 90.0 | 143.0 | 200.0 | 80.0 | 213.5 |
| never.mediter | 20 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.alliances | 20 | 9781 | 552.6 | 9146 | 9821 | 10456 | 8466 | 10481 |
| never.alliances | 20 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 20 | 17439 | 597.1 | 16926 | 17456 | 18051 | 16236 | 18941 |
| never.chroniques | 20 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 20 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 14 % · commercer 44 % · cultiver 14 % · etudier 14 % · mediter 14 %

## optimiseur

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 20 | 1030 | 5.672 | 1024 | 1030 | 1033 | 1021 | 1047 |
| legacyTotal | 20 | 57338 | 364.2 | 56930 | 57367 | 57804 | 56720 | 57958 |
| log10Value | 20 | 10.9 | 0.033 | 10.8 | 10.9 | 10.9 | 10.8 | 10.9 |
| echoShare | 20 | 0.947 | 0.004 | 0.943 | 0.947 | 0.953 | 0.942 | 0.954 |
| harmonyAvg | 20 | 0.670 | 0.028 | 0.660 | 0.664 | 0.666 | 0.658 | 0.788 |
| traitCombos60 | 20 | 32.9 | 4.179 | 28.0 | 34.0 | 38.0 | 27.0 | 40.0 |
| epithetsFound | 20 | 7.250 | 1.164 | 7.000 | 7.000 | 7.000 | 6.000 | 12.0 |
| eventsDone | 20 | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| unlock.commercer | 20 | 16.5 | 1.835 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 5 | 109.5 | 22.7 | 90.0 | 103.5 | 144.5 | 90.0 | 144.5 |
| never.etudier | 20 | 0.750 | 0.444 | 0.000 | 1.000 | 1.000 | 0.000 | 1.000 |
| unlock.mediter | 0 | — | — | — | — | — | — | — |
| never.mediter | 20 | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| upgradeAt.alliances | 20 | 6350 | 424.2 | 5856 | 6386 | 6791 | 5441 | 7131 |
| never.alliances | 20 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 20 | 10386 | 488.0 | 9911 | 10331 | 11136 | 9376 | 11196 |
| never.chroniques | 20 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 20 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 1 % · commercer 0 % · cultiver 99 % · etudier 0 % · mediter 0 %
