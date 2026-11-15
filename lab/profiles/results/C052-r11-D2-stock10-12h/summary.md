# Campagne C052-r11-D2-stock10-12h

- Commit : `a106685`
- Commande : `node --import ./lab/sim/register.mjs lab/profiles/run.ts --workers=4 --profiles=ep-sans-mariage,ep-mariage-force,ep-mariage-metier --seeds=1-50 --hours=12 --id=C052-r11-D2-stock10-12h`
- 150 parties · 12 h · dt 0.5 s · événements non · 31.8 s

> Résultats **[SIMULÉS]** : profils automatiques, pas de vrais joueurs. `never.*` = part des parties sans déblocage ; `unlock.*` / `upgradeAt.*` ne portent que sur les parties qui débloquent (n). Décision avant/après : `npm run sim:guard` (pas `sim:compare`).

## ep-mariage-force

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 50 | 289.4 | 5.321 | 283.0 | 290.0 | 296.0 | 277.0 | 299.0 |
| legacyTotal | 50 | 7855 | 441.2 | 7730 | 7924 | 8145 | 6272 | 8326 |
| log10Value | 50 | 9.222 | 0.104 | 9.209 | 9.241 | 9.268 | 8.824 | 9.377 |
| echoShare | 50 | 0.895 | 0.006 | 0.889 | 0.894 | 0.902 | 0.877 | 0.916 |
| harmonyAvg | 50 | 0.803 | 0.065 | 0.771 | 0.776 | 0.951 | 0.768 | 0.976 |
| traitCombos60 | 50 | 15.7 | 4.587 | 11.0 | 16.0 | 22.0 | 6.000 | 27.0 |
| epithetsFound | 50 | 6.740 | 1.157 | 6.000 | 7.000 | 8.000 | 5.000 | 10.0 |
| eventsDone | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 50 | 16.4 | 1.852 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 15 | 148.7 | 72.8 | 89.5 | 120.5 | 216.5 | 88.5 | 354.5 |
| never.etudier | 50 | 0.700 | 0.463 | 0.000 | 1.000 | 1.000 | 0.000 | 1.000 |
| unlock.mediter | 0 | — | — | — | — | — | — | — |
| never.mediter | 50 | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| upgradeAt.alliances | 50 | 1671 | 180.2 | 1451 | 1671 | 1881 | 1301 | 2151 |
| never.alliances | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 50 | 3193 | 268.2 | 2876 | 3216 | 3561 | 2776 | 3926 |
| never.chroniques | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 8 % · commercer 7 % · cultiver 86 % · etudier 0 % · mediter 0 %

## ep-mariage-metier

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 50 | 290.2 | 4.525 | 285.0 | 291.0 | 296.0 | 280.0 | 299.0 |
| legacyTotal | 50 | 7947 | 514.3 | 7749 | 7973 | 8256 | 6272 | 9335 |
| log10Value | 50 | 9.230 | 0.112 | 9.213 | 9.242 | 9.270 | 8.824 | 9.447 |
| echoShare | 50 | 0.894 | 0.005 | 0.889 | 0.894 | 0.900 | 0.877 | 0.903 |
| harmonyAvg | 50 | 0.801 | 0.063 | 0.771 | 0.776 | 0.952 | 0.768 | 0.976 |
| traitCombos60 | 50 | 16.1 | 4.334 | 11.0 | 16.0 | 22.0 | 6.000 | 27.0 |
| epithetsFound | 50 | 6.580 | 0.906 | 6.000 | 7.000 | 8.000 | 5.000 | 9.000 |
| eventsDone | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 50 | 16.4 | 1.852 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 15 | 148.7 | 72.8 | 89.5 | 120.5 | 216.5 | 88.5 | 354.5 |
| never.etudier | 50 | 0.700 | 0.463 | 0.000 | 1.000 | 1.000 | 0.000 | 1.000 |
| unlock.mediter | 0 | — | — | — | — | — | — | — |
| never.mediter | 50 | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| upgradeAt.alliances | 50 | 1671 | 180.2 | 1451 | 1671 | 1881 | 1301 | 2151 |
| never.alliances | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 50 | 3193 | 269.6 | 2876 | 3211 | 3561 | 2776 | 3926 |
| never.chroniques | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 7 % · commercer 5 % · cultiver 88 % · etudier 0 % · mediter 0 %

## ep-sans-mariage

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 50 | 290.4 | 4.758 | 285.0 | 291.0 | 296.0 | 280.0 | 299.0 |
| legacyTotal | 50 | 7936 | 455.4 | 7749 | 7973 | 8256 | 6317 | 9057 |
| log10Value | 50 | 9.229 | 0.111 | 9.213 | 9.241 | 9.269 | 8.833 | 9.477 |
| echoShare | 50 | 0.894 | 0.007 | 0.889 | 0.894 | 0.900 | 0.873 | 0.915 |
| harmonyAvg | 50 | 0.801 | 0.062 | 0.771 | 0.776 | 0.947 | 0.768 | 0.977 |
| traitCombos60 | 50 | 15.9 | 4.199 | 11.0 | 16.0 | 22.0 | 6.000 | 27.0 |
| epithetsFound | 50 | 6.540 | 0.734 | 6.000 | 7.000 | 7.000 | 5.000 | 8.000 |
| eventsDone | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 50 | 16.4 | 1.852 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 15 | 148.7 | 72.8 | 89.5 | 120.5 | 216.5 | 88.5 | 354.5 |
| never.etudier | 50 | 0.700 | 0.463 | 0.000 | 1.000 | 1.000 | 0.000 | 1.000 |
| unlock.mediter | 0 | — | — | — | — | — | — | — |
| never.mediter | 50 | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| upgradeAt.alliances | 50 | 1671 | 180.2 | 1451 | 1671 | 1881 | 1301 | 2151 |
| never.alliances | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 50 | 3183 | 283.2 | 2851 | 3136 | 3566 | 2696 | 3926 |
| never.chroniques | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 7 % · commercer 5 % · cultiver 88 % · etudier 0 % · mediter 0 %
