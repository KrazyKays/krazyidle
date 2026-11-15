# Campagne C054-r11-D0-actuelle-12h

- Commit : `a106685`
- Commande : `node --import ./lab/sim/register.mjs lab/profiles/run.ts --workers=4 --profiles=oc-sans-mariage,oc-mariage-force,oc-mariage-metier --seeds=1-100 --hours=12 --id=C054-r11-D0-actuelle-12h`
- 300 parties · 12 h · dt 0.5 s · événements non · 59.5 s

> Résultats **[SIMULÉS]** : profils automatiques, pas de vrais joueurs. `never.*` = part des parties sans déblocage ; `unlock.*` / `upgradeAt.*` ne portent que sur les parties qui débloquent (n). Décision avant/après : `npm run sim:guard` (pas `sim:compare`).

## oc-mariage-force

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 100 | 286.4 | 13.6 | 268.0 | 286.0 | 301.0 | 249.0 | 316.0 |
| legacyTotal | 100 | 6807 | 997.6 | 5218 | 6879 | 7783 | 4440 | 8179 |
| log10Value | 100 | 9.307 | 0.476 | 8.605 | 9.598 | 9.774 | 8.431 | 9.810 |
| echoShare | 100 | 0.930 | 0.037 | 0.886 | 0.962 | 0.968 | 0.877 | 0.970 |
| harmonyAvg | 100 | 0.980 | 0.025 | 0.940 | 0.996 | 1.000 | 0.932 | 1.000 |
| traitCombos60 | 100 | 13.3 | 4.730 | 7.000 | 14.0 | 20.0 | 4.000 | 25.0 |
| epithetsFound | 100 | 6.510 | 2.389 | 4.000 | 6.000 | 10.0 | 3.000 | 12.0 |
| eventsDone | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 100 | 16.4 | 1.822 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 100 | 57.2 | 7.581 | 44.0 | 57.0 | 64.5 | 44.0 | 65.0 |
| never.etudier | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.mediter | 76 | 565.8 | 1625 | 84.0 | 126.5 | 414.5 | 78.0 | 7679 |
| never.mediter | 100 | 0.240 | 0.429 | 0.000 | 0.000 | 1.000 | 0.000 | 1.000 |
| upgradeAt.alliances | 100 | 2068 | 309.8 | 1786 | 1996 | 2451 | 1586 | 3686 |
| never.alliances | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 100 | 3737 | 555.9 | 3151 | 3616 | 4511 | 2966 | 6076 |
| never.chroniques | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 9 % · commercer 32 % · cultiver 0 % · etudier 9 % · mediter 49 %

## oc-mariage-metier

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 100 | 286.5 | 13.0 | 268.0 | 287.0 | 301.0 | 255.0 | 314.0 |
| legacyTotal | 100 | 7416 | 1179 | 5243 | 7643 | 8732 | 4440 | 8951 |
| log10Value | 100 | 9.442 | 0.409 | 8.615 | 9.598 | 9.774 | 8.431 | 9.810 |
| echoShare | 100 | 0.933 | 0.035 | 0.890 | 0.962 | 0.968 | 0.877 | 0.970 |
| harmonyAvg | 100 | 0.981 | 0.024 | 0.944 | 0.996 | 1.000 | 0.933 | 1.000 |
| traitCombos60 | 100 | 16.1 | 4.372 | 11.0 | 16.0 | 21.0 | 7.000 | 30.0 |
| epithetsFound | 100 | 6.210 | 2.148 | 4.000 | 6.000 | 9.000 | 3.000 | 13.0 |
| eventsDone | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 100 | 16.4 | 1.822 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 100 | 57.2 | 7.581 | 44.0 | 57.0 | 64.5 | 44.0 | 65.0 |
| never.etudier | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.mediter | 77 | 712.8 | 2254 | 84.0 | 126.5 | 414.5 | 78.0 | 13754 |
| never.mediter | 100 | 0.230 | 0.423 | 0.000 | 0.000 | 1.000 | 0.000 | 1.000 |
| upgradeAt.alliances | 100 | 2068 | 309.8 | 1786 | 1996 | 2451 | 1586 | 3686 |
| never.alliances | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 100 | 3733 | 566.9 | 3141 | 3631 | 4541 | 2966 | 6076 |
| never.chroniques | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 7 % · commercer 31 % · cultiver 0 % · etudier 13 % · mediter 49 %

## oc-sans-mariage

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 100 | 287.1 | 13.7 | 268.0 | 289.0 | 302.0 | 253.0 | 314.0 |
| legacyTotal | 100 | 7521 | 1048 | 6326 | 7665 | 8721 | 4440 | 9012 |
| log10Value | 100 | 9.469 | 0.360 | 8.906 | 9.598 | 9.774 | 8.431 | 9.810 |
| echoShare | 100 | 0.933 | 0.034 | 0.894 | 0.962 | 0.968 | 0.880 | 0.970 |
| harmonyAvg | 100 | 0.981 | 0.024 | 0.944 | 0.996 | 1.000 | 0.933 | 1.000 |
| traitCombos60 | 100 | 16.0 | 3.954 | 11.0 | 16.0 | 21.0 | 8.000 | 30.0 |
| epithetsFound | 100 | 6.090 | 2.026 | 4.000 | 5.000 | 9.000 | 3.000 | 12.0 |
| eventsDone | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 100 | 16.4 | 1.822 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 100 | 57.2 | 7.581 | 44.0 | 57.0 | 64.5 | 44.0 | 65.0 |
| never.etudier | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.mediter | 77 | 655.2 | 2056 | 84.0 | 126.5 | 414.5 | 78.0 | 13754 |
| never.mediter | 100 | 0.230 | 0.423 | 0.000 | 0.000 | 1.000 | 0.000 | 1.000 |
| upgradeAt.alliances | 100 | 2068 | 309.8 | 1786 | 1996 | 2451 | 1586 | 3686 |
| never.alliances | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 100 | 3720 | 568.0 | 3141 | 3606 | 4501 | 2966 | 6076 |
| never.chroniques | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 7 % · commercer 31 % · cultiver 0 % · etudier 13 % · mediter 49 %
