# Campagne C103-qa-dt1

- Commit : `6f47e27`
- Commande : `npm run sim -- --profiles=experimente,optimiseur --seeds=1-30 --hours=3 --dt=1 --workers=2 --id=C103-qa-dt1`
- 60 parties · 3 h · dt 1 s · événements non · 6.2 s

> Résultats **[SIMULÉS]** : profils automatiques, pas de vrais joueurs.

## experimente

| Indicateur | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|
| gen | 96.6 | 2.173 | 94.0 | 97.0 | 99.0 | 90.0 | 100.0 |
| legacyTotal | 925.7 | 36.7 | 883.0 | 929.0 | 967.0 | 855.0 | 1013 |
| log10Value | 7.501 | 0.041 | 7.441 | 7.501 | 7.545 | 7.420 | 7.590 |
| echoShare | 0.894 | 0.009 | 0.883 | 0.894 | 0.905 | 0.873 | 0.907 |
| harmonyAvg | 0.974 | 0.005 | 0.965 | 0.974 | 0.979 | 0.961 | 0.981 |
| harmonyMin | 0.693 | 0.014 | 0.677 | 0.694 | 0.709 | 0.655 | 0.719 |
| traitCombos60 | 44.1 | 4.139 | 39.0 | 45.0 | 49.0 | 34.0 | 51.0 |
| epithetsFound | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| eventsDone | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 17.1 | 1.889 | 13.0 | 18.0 | 18.0 | 13.0 | 18.0 |
| unlock.etudier | 69.4 | 12.8 | 55.0 | 81.0 | 82.0 | 55.0 | 82.0 |
| unlock.mediter | 155.4 | 71.0 | 90.0 | 143.0 | 236.0 | 84.0 | 303.0 |
| anomalies | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 14 % · commercer 40 % · cultiver 17 % · etudier 14 % · mediter 14 %

## optimiseur

| Indicateur | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|
| gen | 87.8 | 3.491 | 84.0 | 88.0 | 92.0 | 80.0 | 96.0 |
| legacyTotal | 1496 | 82.8 | 1394 | 1493 | 1629 | 1355 | 1672 |
| log10Value | 7.911 | 0.065 | 7.850 | 7.927 | 7.979 | 7.702 | 7.997 |
| echoShare | 0.815 | 0.012 | 0.804 | 0.819 | 0.826 | 0.779 | 0.832 |
| harmonyAvg | 0.868 | 0.031 | 0.850 | 0.860 | 0.883 | 0.846 | 0.984 |
| harmonyMin | 0.680 | 0.039 | 0.649 | 0.673 | 0.717 | 0.596 | 0.784 |
| traitCombos60 | 33.5 | 4.249 | 29.0 | 34.0 | 38.0 | 22.0 | 41.0 |
| epithetsFound | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| eventsDone | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 16.9 | 1.893 | 13.0 | 18.0 | 18.0 | 13.0 | 18.0 |
| unlock.etudier | 46.5 | 82.1 | -1.000 | -1.000 | 172.0 | -1.000 | 271.0 |
| unlock.mediter | -1.000 | 0.000 | -1.000 | -1.000 | -1.000 | -1.000 | -1.000 |
| anomalies | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 8 % · commercer 3 % · cultiver 89 % · etudier 0 % · mediter 0 %
