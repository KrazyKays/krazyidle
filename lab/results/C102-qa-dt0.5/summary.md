# Campagne C102-qa-dt0.5

- Commit : `6f47e27`
- Commande : `npm run sim -- --profiles=experimente,optimiseur --seeds=1-30 --hours=3 --dt=0.5 --workers=2 --id=C102-qa-dt0.5`
- 60 parties · 3 h · dt 0.5 s · événements non · 7.7 s

> Résultats **[SIMULÉS]** : profils automatiques, pas de vrais joueurs.

## experimente

| Indicateur | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|
| gen | 95.7 | 2.490 | 92.0 | 96.0 | 99.0 | 90.0 | 101.0 |
| legacyTotal | 928.8 | 38.6 | 879.0 | 925.0 | 974.0 | 862.0 | 1027 |
| log10Value | 7.513 | 0.042 | 7.467 | 7.508 | 7.564 | 7.454 | 7.616 |
| echoShare | 0.895 | 0.006 | 0.887 | 0.896 | 0.902 | 0.881 | 0.907 |
| harmonyAvg | 0.977 | 0.004 | 0.972 | 0.977 | 0.980 | 0.966 | 0.981 |
| harmonyMin | 0.718 | 0.015 | 0.696 | 0.720 | 0.735 | 0.683 | 0.744 |
| traitCombos60 | 44.5 | 3.928 | 40.0 | 45.0 | 49.0 | 36.0 | 53.0 |
| epithetsFound | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| eventsDone | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 16.6 | 1.889 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 66.8 | 11.4 | 53.5 | 77.5 | 78.0 | 53.5 | 78.0 |
| unlock.mediter | 121.3 | 36.3 | 88.0 | 107.5 | 154.0 | 83.0 | 218.0 |
| anomalies | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 14 % · commercer 40 % · cultiver 17 % · etudier 13 % · mediter 15 %

## optimiseur

| Indicateur | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|
| gen | 88.5 | 3.721 | 84.0 | 89.0 | 93.0 | 80.0 | 97.0 |
| legacyTotal | 1511 | 89.1 | 1403 | 1501 | 1628 | 1352 | 1735 |
| log10Value | 7.918 | 0.071 | 7.863 | 7.935 | 7.979 | 7.668 | 8.014 |
| echoShare | 0.816 | 0.012 | 0.800 | 0.819 | 0.827 | 0.784 | 0.837 |
| harmonyAvg | 0.873 | 0.036 | 0.853 | 0.860 | 0.941 | 0.848 | 0.982 |
| harmonyMin | 0.697 | 0.032 | 0.681 | 0.687 | 0.724 | 0.651 | 0.781 |
| traitCombos60 | 34.3 | 4.519 | 29.0 | 35.0 | 39.0 | 22.0 | 42.0 |
| epithetsFound | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| eventsDone | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 16.4 | 1.893 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 56.5 | 97.8 | -1.000 | -1.000 | 213.0 | -1.000 | 354.5 |
| unlock.mediter | -1.000 | 0.000 | -1.000 | -1.000 | -1.000 | -1.000 | -1.000 |
| anomalies | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 8 % · commercer 5 % · cultiver 86 % · etudier 0 % · mediter 0 %
