# Campagne C403-reproductibilite-HEAD

- Commit : `6f47e27`
- Commande : `npm run sim -- --profiles=experimente,optimiseur --seeds=1-20 --hours=6 --workers=2 --id=C403-reproductibilite-HEAD`
- 40 parties · 6 h · dt 0.5 s · événements non · 10.3 s

> Résultats **[SIMULÉS]** : profils automatiques, pas de vrais joueurs.

## experimente

| Indicateur | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|
| gen | 168.9 | 2.645 | 166.0 | 170.0 | 171.0 | 163.0 | 174.0 |
| legacyTotal | 2204 | 48.6 | 2147 | 2204 | 2256 | 2131 | 2315 |
| log10Value | 8.263 | 0.030 | 8.228 | 8.264 | 8.285 | 8.205 | 8.341 |
| echoShare | 0.929 | 0.002 | 0.926 | 0.929 | 0.932 | 0.923 | 0.933 |
| harmonyAvg | 0.980 | 0.002 | 0.978 | 0.980 | 0.983 | 0.977 | 0.984 |
| harmonyMin | 0.720 | 0.016 | 0.705 | 0.721 | 0.738 | 0.683 | 0.744 |
| traitCombos60 | 34.6 | 4.925 | 29.0 | 35.0 | 38.0 | 26.0 | 49.0 |
| epithetsFound | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| eventsDone | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 16.7 | 1.824 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 67.9 | 11.4 | 55.0 | 77.5 | 78.0 | 53.5 | 78.0 |
| unlock.mediter | 122.3 | 33.7 | 88.0 | 141.5 | 154.0 | 83.0 | 192.0 |
| anomalies | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 14 % · commercer 42 % · cultiver 16 % · etudier 14 % · mediter 14 %

## optimiseur

| Indicateur | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|
| gen | 154.7 | 3.935 | 149.0 | 156.0 | 159.0 | 145.0 | 160.0 |
| legacyTotal | 3556 | 171.5 | 3411 | 3558 | 3714 | 3116 | 4001 |
| log10Value | 8.611 | 0.094 | 8.600 | 8.617 | 8.643 | 8.268 | 8.819 |
| echoShare | 0.860 | 0.009 | 0.853 | 0.863 | 0.868 | 0.833 | 0.871 |
| harmonyAvg | 0.833 | 0.051 | 0.813 | 0.816 | 0.847 | 0.804 | 0.987 |
| harmonyMin | 0.692 | 0.018 | 0.681 | 0.687 | 0.720 | 0.651 | 0.722 |
| traitCombos60 | 14.9 | 4.605 | 9.000 | 15.0 | 22.0 | 8.000 | 23.0 |
| epithetsFound | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| eventsDone | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 16.5 | 1.835 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 67.6 | 111.5 | -1.000 | -1.000 | 235.5 | -1.000 | 354.5 |
| unlock.mediter | -1.000 | 0.000 | -1.000 | -1.000 | -1.000 | -1.000 | -1.000 |
| anomalies | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 6 % · commercer 4 % · cultiver 90 % · etudier 0 % · mediter 0 %
