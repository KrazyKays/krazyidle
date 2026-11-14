# Campagne C311-pba-mariages-forces-12h

- Commit : `14b76fe`
- Commande : `node --import ./lab/sim/register.mjs lab/profiles/run.ts --workers=2 --profiles=ep-mariage-force,ep-mariage-metier --seeds=1-50 --hours=12 --id=C311-pba-mariages-forces-12h`
- 100 parties · 12 h · dt 0.5 s · événements non · 33.7 s

> Résultats **[SIMULÉS]** : profils automatiques, pas de vrais joueurs. `never.*` = part des parties sans déblocage ; `unlock.*` / `upgradeAt.*` ne portent que sur les parties qui débloquent (n). Décision avant/après : `npm run sim:guard` (pas `sim:compare`).

## ep-mariage-force

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 50 | 290.2 | 3.776 | 285.0 | 291.0 | 295.0 | 282.0 | 297.0 |
| legacyTotal | 50 | 7908 | 573.4 | 7778 | 7951 | 8218 | 6147 | 9047 |
| log10Value | 50 | 9.246 | 0.134 | 9.223 | 9.268 | 9.297 | 8.834 | 9.548 |
| echoShare | 50 | 0.900 | 0.006 | 0.893 | 0.899 | 0.907 | 0.886 | 0.914 |
| harmonyAvg | 50 | 0.802 | 0.069 | 0.769 | 0.773 | 0.954 | 0.764 | 0.985 |
| traitCombos60 | 50 | 14.7 | 4.022 | 10.0 | 15.0 | 19.0 | 5.000 | 23.0 |
| epithetsFound | 50 | 2.320 | 0.999 | 1.000 | 2.000 | 4.000 | 1.000 | 5.000 |
| eventsDone | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 50 | 16.4 | 1.852 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 15 | 163.9 | 80.0 | 89.5 | 144.0 | 268.0 | 88.5 | 354.5 |
| never.etudier | 50 | 0.700 | 0.463 | 0.000 | 1.000 | 1.000 | 0.000 | 1.000 |
| unlock.mediter | 0 | — | — | — | — | — | — | — |
| never.mediter | 50 | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| upgradeAt.alliances | 50 | 1674 | 182.6 | 1451 | 1671 | 1881 | 1301 | 2151 |
| never.alliances | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 50 | 3185 | 269.1 | 2876 | 3181 | 3561 | 2776 | 3926 |
| never.chroniques | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 9 % · commercer 5 % · cultiver 86 % · etudier 0 % · mediter 0 %

## ep-mariage-metier

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 50 | 289.9 | 4.396 | 285.0 | 291.0 | 295.0 | 275.0 | 297.0 |
| legacyTotal | 50 | 7948 | 632.6 | 7778 | 7951 | 8239 | 6147 | 9347 |
| log10Value | 50 | 9.254 | 0.146 | 9.223 | 9.268 | 9.299 | 8.834 | 9.584 |
| echoShare | 50 | 0.900 | 0.006 | 0.893 | 0.900 | 0.907 | 0.886 | 0.919 |
| harmonyAvg | 50 | 0.804 | 0.072 | 0.769 | 0.773 | 0.953 | 0.764 | 0.984 |
| traitCombos60 | 50 | 14.6 | 3.918 | 9.000 | 15.0 | 19.0 | 6.000 | 23.0 |
| epithetsFound | 50 | 2.300 | 0.909 | 1.000 | 2.000 | 4.000 | 1.000 | 4.000 |
| eventsDone | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 50 | 16.4 | 1.852 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 15 | 163.9 | 80.0 | 89.5 | 144.0 | 268.0 | 88.5 | 354.5 |
| never.etudier | 50 | 0.700 | 0.463 | 0.000 | 1.000 | 1.000 | 0.000 | 1.000 |
| unlock.mediter | 0 | — | — | — | — | — | — | — |
| never.mediter | 50 | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| upgradeAt.alliances | 50 | 1674 | 182.6 | 1451 | 1671 | 1881 | 1301 | 2151 |
| never.alliances | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 50 | 3194 | 267.2 | 2876 | 3211 | 3561 | 2776 | 3926 |
| never.chroniques | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 9 % · commercer 7 % · cultiver 84 % · etudier 0 % · mediter 0 %
