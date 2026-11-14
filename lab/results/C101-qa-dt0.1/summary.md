# Campagne C101-qa-dt0.1

- Commit : `6f47e27`
- Commande : `npm run sim -- --profiles=experimente,optimiseur --seeds=1-30 --hours=3 --dt=0.1 --workers=2 --id=C101-qa-dt0.1`
- 60 parties · 3 h · dt 0.1 s · événements non · 27.7 s

> Résultats **[SIMULÉS]** : profils automatiques, pas de vrais joueurs.

## experimente

| Indicateur | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|
| gen | 96.3 | 1.765 | 95.0 | 96.0 | 98.0 | 91.0 | 99.0 |
| legacyTotal | 931.7 | 35.2 | 897.0 | 925.0 | 982.0 | 857.0 | 1021 |
| log10Value | 7.505 | 0.059 | 7.436 | 7.517 | 7.588 | 7.398 | 7.609 |
| echoShare | 0.893 | 0.009 | 0.880 | 0.895 | 0.902 | 0.877 | 0.916 |
| harmonyAvg | 0.979 | 0.004 | 0.975 | 0.980 | 0.983 | 0.970 | 0.986 |
| harmonyMin | 0.737 | 0.015 | 0.714 | 0.738 | 0.753 | 0.696 | 0.763 |
| traitCombos60 | 44.5 | 4.249 | 39.0 | 45.0 | 49.0 | 33.0 | 54.0 |
| epithetsFound | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| eventsDone | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 16.5 | 1.775 | 12.6 | 17.3 | 17.3 | 12.6 | 17.3 |
| unlock.etudier | 66.8 | 11.2 | 53.6 | 77.4 | 77.9 | 53.6 | 77.9 |
| unlock.mediter | 122.1 | 36.4 | 87.9 | 107.6 | 157.2 | 82.4 | 214.9 |
| anomalies | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 14 % · commercer 40 % · cultiver 17 % · etudier 13 % · mediter 15 %

## optimiseur

| Indicateur | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|
| gen | 87.4 | 3.079 | 84.0 | 88.0 | 91.0 | 81.0 | 93.0 |
| legacyTotal | 1465 | 91.1 | 1326 | 1465 | 1589 | 1283 | 1659 |
| log10Value | 7.870 | 0.111 | 7.718 | 7.912 | 7.970 | 7.665 | 8.087 |
| echoShare | 0.815 | 0.011 | 0.802 | 0.816 | 0.828 | 0.793 | 0.836 |
| harmonyAvg | 0.902 | 0.048 | 0.855 | 0.886 | 0.964 | 0.850 | 0.967 |
| harmonyMin | 0.733 | 0.026 | 0.713 | 0.736 | 0.743 | 0.659 | 0.786 |
| traitCombos60 | 32.8 | 5.623 | 26.0 | 33.0 | 38.0 | 22.0 | 46.0 |
| epithetsFound | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| eventsDone | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 16.4 | 1.755 | 12.6 | 17.3 | 17.3 | 12.6 | 17.3 |
| unlock.etudier | 94.3 | 67.5 | -1.000 | 119.9 | 157.0 | -1.000 | 176.7 |
| unlock.mediter | -1.000 | 0.000 | -1.000 | -1.000 | -1.000 | -1.000 | -1.000 |
| anomalies | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 36 % · commercer 2 % · cultiver 62 % · etudier 0 % · mediter 0 %
