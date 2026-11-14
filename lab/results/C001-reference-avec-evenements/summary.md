# Campagne C001-reference-avec-evenements

- Commit : `a53d1b5`
- Commande : `npm run sim -- --profiles=experimente,optimiseur,occasionnel --seeds=1-200 --hours=6 --events --id=C001-reference-avec-evenements`
- 600 parties · 6 h · dt 0.5 s · événements oui · 43.9 s

> Résultats **[SIMULÉS]** : profils automatiques, pas de vrais joueurs.

## experimente

| Indicateur | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|
| gen | 165.8 | 2.501 | 163.0 | 166.0 | 169.0 | 157.0 | 172.0 |
| legacyTotal | 2260 | 56.5 | 2185 | 2260 | 2330 | 2122 | 2438 |
| log10Value | 8.333 | 0.043 | 8.284 | 8.329 | 8.387 | 8.224 | 8.468 |
| echoShare | 0.934 | 0.004 | 0.929 | 0.934 | 0.938 | 0.924 | 0.944 |
| harmonyAvg | 0.981 | 0.002 | 0.978 | 0.981 | 0.984 | 0.971 | 0.986 |
| harmonyMin | 0.721 | 0.013 | 0.705 | 0.723 | 0.735 | 0.666 | 0.748 |
| traitCombos60 | 32.6 | 4.736 | 27.0 | 33.0 | 39.0 | 22.0 | 43.0 |
| epithetsFound | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| eventsDone | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| unlock.commercer | 16.7 | 1.697 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 63.1 | 9.755 | 53.5 | 60.5 | 77.5 | 53.5 | 77.5 |
| unlock.mediter | 102.1 | 22.5 | 85.0 | 91.5 | 140.5 | 78.5 | 181.5 |
| anomalies | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 14 % · commercer 42 % · cultiver 15 % · etudier 14 % · mediter 14 %

## occasionnel

| Indicateur | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|
| gen | 27.0 | 1.186 | 26.0 | 27.0 | 28.0 | 21.0 | 30.0 |
| legacyTotal | 130.2 | 12.5 | 116.0 | 128.0 | 147.0 | 106.0 | 167.0 |
| log10Value | 6.483 | 0.231 | 6.200 | 6.499 | 6.765 | 5.808 | 7.015 |
| echoShare | 0.188 | 0.075 | 0.121 | 0.171 | 0.290 | 0.090 | 0.668 |
| harmonyAvg | 0.962 | 0.010 | 0.950 | 0.962 | 0.976 | 0.928 | 0.985 |
| harmonyMin | 0.722 | 0.013 | 0.706 | 0.724 | 0.736 | 0.669 | 0.753 |
| traitCombos60 | 23.2 | 1.839 | 21.0 | 23.0 | 25.0 | 18.0 | 27.0 |
| epithetsFound | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| eventsDone | 1.520 | 0.501 | 1.000 | 2.000 | 2.000 | 1.000 | 2.000 |
| unlock.commercer | 16.7 | 1.697 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 67.1 | 12.1 | 55.5 | 63.0 | 84.5 | 55.5 | 84.5 |
| unlock.mediter | 105.3 | 17.4 | 92.5 | 99.5 | 150.5 | 84.5 | 154.5 |
| anomalies | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 19 % · commercer 36 % · cultiver 18 % · etudier 13 % · mediter 14 %

## optimiseur

| Indicateur | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|
| gen | 154.7 | 3.414 | 151.0 | 154.0 | 159.0 | 146.0 | 166.0 |
| legacyTotal | 3554 | 220.5 | 3133 | 3599 | 3752 | 2957 | 4257 |
| log10Value | 8.628 | 0.113 | 8.371 | 8.654 | 8.692 | 8.303 | 8.960 |
| echoShare | 0.870 | 0.009 | 0.859 | 0.869 | 0.881 | 0.847 | 0.899 |
| harmonyAvg | 0.839 | 0.057 | 0.806 | 0.814 | 0.970 | 0.800 | 0.989 |
| harmonyMin | 0.694 | 0.014 | 0.687 | 0.687 | 0.720 | 0.670 | 0.732 |
| traitCombos60 | 16.3 | 4.808 | 10.0 | 16.0 | 23.0 | 7.000 | 29.0 |
| epithetsFound | 1.005 | 0.071 | 1.000 | 1.000 | 1.000 | 1.000 | 2.000 |
| eventsDone | 0.250 | 0.434 | 0.000 | 0.000 | 1.000 | 0.000 | 1.000 |
| unlock.commercer | 16.5 | 1.710 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 68.7 | 100.6 | -1.000 | -1.000 | 211.5 | -1.000 | 657.5 |
| unlock.mediter | 99.4 | 903.1 | -1.000 | -1.000 | -1.000 | -1.000 | 10947 |
| anomalies | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 12 % · commercer 3 % · cultiver 84 % · etudier 1 % · mediter 0 %
