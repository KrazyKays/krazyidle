# Campagne C304-pba-piege-vocation-6h

- Commit : `10324b4`
- Commande : `node --import ./lab/sim/register.mjs lab/profiles/run.ts --workers=2 --profiles=opti-epargne,opti-commerce,sans-vocation-piege --seeds=1-100 --hours=6 --id=C304-pba-piege-vocation-6h`
- 300 parties · 6 h · dt 0.5 s · événements non · 53.8 s

> Résultats **[SIMULÉS]** : profils automatiques, pas de vrais joueurs.

## opti-commerce

| Indicateur | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|
| gen | 161.2 | 7.443 | 151.0 | 161.0 | 171.0 | 143.0 | 178.0 |
| legacyTotal | 2461 | 747.0 | 1586 | 2385 | 3712 | 1242 | 4185 |
| log10Value | 8.062 | 0.410 | 7.636 | 7.988 | 8.782 | 7.191 | 8.894 |
| echoShare | 0.852 | 0.022 | 0.825 | 0.850 | 0.879 | 0.807 | 0.909 |
| harmonyAvg | 0.974 | 0.017 | 0.949 | 0.979 | 0.993 | 0.933 | 0.998 |
| harmonyMin | 0.716 | 0.061 | 0.660 | 0.699 | 0.766 | 0.631 | 0.879 |
| traitCombos60 | 18.7 | 6.145 | 11.0 | 18.0 | 26.0 | 7.000 | 36.0 |
| epithetsFound | 0.390 | 0.490 | 0.000 | 0.000 | 1.000 | 0.000 | 1.000 |
| eventsDone | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 16.4 | 1.822 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 57.2 | 7.233 | 45.5 | 54.0 | 64.5 | 45.5 | 65.0 |
| unlock.mediter | 250.1 | 758.8 | -1.000 | 98.5 | 196.0 | -1.000 | 5637 |
| anomalies | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 17 % · commercer 34 % · cultiver 2 % · etudier 35 % · mediter 11 %

## opti-epargne

| Indicateur | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|
| gen | 167.3 | 3.913 | 162.0 | 167.0 | 172.0 | 157.0 | 175.0 |
| legacyTotal | 3382 | 146.9 | 3223 | 3391 | 3559 | 2923 | 3707 |
| log10Value | 8.570 | 0.086 | 8.531 | 8.577 | 8.620 | 8.219 | 8.809 |
| echoShare | 0.869 | 0.009 | 0.861 | 0.870 | 0.880 | 0.838 | 0.898 |
| harmonyAvg | 0.849 | 0.043 | 0.825 | 0.833 | 0.946 | 0.822 | 0.988 |
| harmonyMin | 0.694 | 0.016 | 0.687 | 0.687 | 0.720 | 0.651 | 0.729 |
| traitCombos60 | 17.2 | 4.574 | 12.0 | 17.0 | 23.0 | 5.000 | 32.0 |
| epithetsFound | 2.530 | 1.132 | 1.000 | 2.000 | 4.000 | 1.000 | 7.000 |
| eventsDone | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 16.4 | 1.822 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 42.5 | 79.8 | -1.000 | -1.000 | 159.5 | -1.000 | 354.5 |
| unlock.mediter | -1.000 | 0.000 | -1.000 | -1.000 | -1.000 | -1.000 | -1.000 |
| anomalies | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 7 % · commercer 5 % · cultiver 88 % · etudier 0 % · mediter 0 %

## sans-vocation-piege

| Indicateur | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|
| gen | 173.5 | 5.024 | 167.0 | 173.0 | 180.0 | 160.0 | 184.0 |
| legacyTotal | 2805 | 439.6 | 2382 | 2582 | 3470 | 2168 | 3683 |
| log10Value | 8.341 | 0.268 | 8.101 | 8.177 | 8.730 | 8.036 | 8.779 |
| echoShare | 0.873 | 0.017 | 0.855 | 0.870 | 0.892 | 0.842 | 0.935 |
| harmonyAvg | 0.980 | 0.012 | 0.966 | 0.974 | 0.995 | 0.961 | 0.998 |
| harmonyMin | 0.895 | 0.047 | 0.856 | 0.859 | 0.956 | 0.855 | 0.979 |
| traitCombos60 | 15.2 | 6.294 | 8.000 | 14.0 | 23.0 | 6.000 | 36.0 |
| epithetsFound | 3.820 | 2.052 | 2.000 | 4.000 | 7.000 | 1.000 | 9.000 |
| eventsDone | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 18.0 | 1.405 | 14.0 | 18.5 | 18.5 | 14.0 | 18.5 |
| unlock.etudier | 55.6 | 3.467 | 48.5 | 58.0 | 58.0 | 48.5 | 58.0 |
| unlock.mediter | -1.000 | 0.000 | -1.000 | -1.000 | -1.000 | -1.000 | -1.000 |
| anomalies | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 0 % · commercer 62 % · cultiver 38 % · etudier 0 % · mediter 0 %
