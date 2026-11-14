# Campagne C306-pba-mariages-12h

- Commit : `8d72150`
- Commande : `node --import ./lab/sim/register.mjs lab/profiles/run.ts --workers=2 --profiles=opti-epargne,ep-sans-mariage,ep-mariage-max --seeds=1-50 --hours=12 --id=C306-pba-mariages-12h`
- 150 parties · 12 h · dt 0.5 s · événements non · 77.3 s

> Résultats **[SIMULÉS]** : profils automatiques, pas de vrais joueurs. `never.*` = part des parties sans déblocage ; `unlock.*` / `upgradeAt.*` ne portent que sur les parties qui débloquent (n). Décision avant/après : `npm run sim:guard` (pas `sim:compare`).

## ep-mariage-max

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 50 | 290.0 | 3.894 | 285.0 | 291.0 | 295.0 | 282.0 | 297.0 |
| legacyTotal | 50 | 7898 | 576.7 | 7778 | 7951 | 8218 | 6103 | 9007 |
| log10Value | 50 | 9.247 | 0.135 | 9.223 | 9.267 | 9.297 | 8.840 | 9.543 |
| echoShare | 50 | 0.900 | 0.006 | 0.893 | 0.899 | 0.907 | 0.887 | 0.919 |
| harmonyAvg | 50 | 0.802 | 0.069 | 0.769 | 0.773 | 0.953 | 0.764 | 0.985 |
| traitCombos60 | 50 | 14.4 | 4.299 | 9.000 | 15.0 | 19.0 | 6.000 | 25.0 |
| epithetsFound | 50 | 2.340 | 1.022 | 1.000 | 2.000 | 4.000 | 1.000 | 5.000 |
| eventsDone | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 50 | 16.4 | 1.852 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 15 | 163.9 | 80.0 | 89.5 | 144.0 | 268.0 | 88.5 | 354.5 |
| never.etudier | 50 | 0.700 | 0.463 | 0.000 | 1.000 | 1.000 | 0.000 | 1.000 |
| unlock.mediter | 0 | — | — | — | — | — | — | — |
| never.mediter | 50 | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| upgradeAt.alliances | 50 | 1674 | 182.6 | 1451 | 1671 | 1881 | 1301 | 2151 |
| never.alliances | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 50 | 3186 | 270.0 | 2876 | 3181 | 3561 | 2776 | 3926 |
| never.chroniques | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 9 % · commercer 5 % · cultiver 86 % · etudier 0 % · mediter 0 %

## ep-sans-mariage

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 50 | 290.1 | 3.875 | 285.0 | 291.0 | 295.0 | 281.0 | 297.0 |
| legacyTotal | 50 | 8139 | 542.2 | 7808 | 8016 | 9237 | 6335 | 9557 |
| log10Value | 50 | 9.297 | 0.119 | 9.239 | 9.270 | 9.527 | 8.872 | 9.584 |
| echoShare | 50 | 0.901 | 0.007 | 0.894 | 0.900 | 0.910 | 0.887 | 0.921 |
| harmonyAvg | 50 | 0.803 | 0.069 | 0.769 | 0.773 | 0.951 | 0.764 | 0.984 |
| traitCombos60 | 50 | 14.6 | 3.801 | 9.000 | 15.0 | 19.0 | 6.000 | 23.0 |
| epithetsFound | 50 | 2.460 | 0.862 | 2.000 | 2.000 | 4.000 | 1.000 | 4.000 |
| eventsDone | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 50 | 16.4 | 1.852 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 15 | 163.9 | 80.0 | 89.5 | 144.0 | 268.0 | 88.5 | 354.5 |
| never.etudier | 50 | 0.700 | 0.463 | 0.000 | 1.000 | 1.000 | 0.000 | 1.000 |
| unlock.mediter | 0 | — | — | — | — | — | — | — |
| never.mediter | 50 | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| upgradeAt.alliances | 50 | 1674 | 182.6 | 1451 | 1671 | 1881 | 1301 | 2151 |
| never.alliances | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 50 | 3182 | 278.6 | 2851 | 3181 | 3561 | 2696 | 3926 |
| never.chroniques | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 4 % · commercer 12 % · cultiver 84 % · etudier 0 % · mediter 0 %

## opti-epargne

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 50 | 290.3 | 4.047 | 285.0 | 291.0 | 295.0 | 282.0 | 298.0 |
| legacyTotal | 50 | 7968 | 511.8 | 7779 | 7952 | 8239 | 6267 | 9053 |
| log10Value | 50 | 9.260 | 0.129 | 9.225 | 9.268 | 9.299 | 8.812 | 9.542 |
| echoShare | 50 | 0.900 | 0.007 | 0.893 | 0.900 | 0.907 | 0.878 | 0.922 |
| harmonyAvg | 50 | 0.802 | 0.068 | 0.769 | 0.773 | 0.952 | 0.764 | 0.985 |
| traitCombos60 | 50 | 14.8 | 3.988 | 9.000 | 15.0 | 20.0 | 6.000 | 23.0 |
| epithetsFound | 50 | 2.440 | 0.951 | 1.000 | 2.000 | 4.000 | 1.000 | 5.000 |
| eventsDone | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 50 | 16.4 | 1.852 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 15 | 163.9 | 80.0 | 89.5 | 144.0 | 268.0 | 88.5 | 354.5 |
| never.etudier | 50 | 0.700 | 0.463 | 0.000 | 1.000 | 1.000 | 0.000 | 1.000 |
| unlock.mediter | 0 | — | — | — | — | — | — | — |
| never.mediter | 50 | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| upgradeAt.alliances | 50 | 1674 | 182.6 | 1451 | 1671 | 1881 | 1301 | 2151 |
| never.alliances | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 50 | 3189 | 265.8 | 2901 | 3181 | 3561 | 2776 | 3926 |
| never.chroniques | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 7 % · commercer 7 % · cultiver 86 % · etudier 0 % · mediter 0 %
