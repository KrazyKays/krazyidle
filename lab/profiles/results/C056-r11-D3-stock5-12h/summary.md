# Campagne C056-r11-D3-stock5-12h

- Commit : `a106685`
- Commande : `node --import ./lab/sim/register.mjs lab/profiles/run.ts --workers=4 --profiles=oc-sans-mariage,oc-mariage-force,oc-mariage-metier --seeds=1-100 --hours=12 --id=C056-r11-D3-stock5-12h`
- 300 parties · 12 h · dt 0.5 s · événements non · 60.6 s

> Résultats **[SIMULÉS]** : profils automatiques, pas de vrais joueurs. `never.*` = part des parties sans déblocage ; `unlock.*` / `upgradeAt.*` ne portent que sur les parties qui débloquent (n). Décision avant/après : `npm run sim:guard` (pas `sim:compare`).

## oc-mariage-force

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 100 | 284.9 | 12.3 | 268.0 | 285.0 | 298.0 | 249.0 | 313.0 |
| legacyTotal | 100 | 7355 | 983.8 | 6127 | 7666 | 8324 | 4576 | 8725 |
| log10Value | 100 | 9.454 | 0.367 | 8.898 | 9.660 | 9.774 | 8.516 | 9.810 |
| echoShare | 100 | 0.934 | 0.033 | 0.894 | 0.962 | 0.968 | 0.883 | 0.970 |
| harmonyAvg | 100 | 0.980 | 0.025 | 0.939 | 0.996 | 1.000 | 0.931 | 1.000 |
| traitCombos60 | 100 | 13.2 | 5.092 | 7.000 | 13.0 | 20.0 | 4.000 | 25.0 |
| epithetsFound | 100 | 6.800 | 2.609 | 4.000 | 6.000 | 10.0 | 3.000 | 12.0 |
| eventsDone | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 100 | 16.4 | 1.822 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 100 | 57.2 | 7.581 | 44.0 | 57.0 | 64.5 | 44.0 | 65.0 |
| never.etudier | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.mediter | 76 | 582.9 | 1679 | 84.0 | 126.5 | 414.5 | 78.0 | 7593 |
| never.mediter | 100 | 0.240 | 0.429 | 0.000 | 0.000 | 1.000 | 0.000 | 1.000 |
| upgradeAt.alliances | 100 | 2068 | 309.8 | 1786 | 1996 | 2451 | 1586 | 3686 |
| never.alliances | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 100 | 3729 | 547.7 | 3151 | 3616 | 4501 | 2921 | 5996 |
| never.chroniques | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 9 % · commercer 33 % · cultiver 0 % · etudier 9 % · mediter 49 %

## oc-mariage-metier

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 100 | 285.3 | 11.8 | 268.0 | 287.0 | 298.0 | 254.0 | 309.0 |
| legacyTotal | 100 | 7517 | 1065 | 6196 | 7666 | 8738 | 4459 | 9062 |
| log10Value | 100 | 9.477 | 0.349 | 8.937 | 9.631 | 9.774 | 8.479 | 9.810 |
| echoShare | 100 | 0.934 | 0.033 | 0.895 | 0.961 | 0.968 | 0.885 | 0.970 |
| harmonyAvg | 100 | 0.981 | 0.024 | 0.944 | 0.996 | 1.000 | 0.933 | 1.000 |
| traitCombos60 | 100 | 14.8 | 4.830 | 9.000 | 15.0 | 20.0 | 5.000 | 30.0 |
| epithetsFound | 100 | 6.500 | 2.397 | 4.000 | 6.000 | 9.000 | 3.000 | 13.0 |
| eventsDone | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 100 | 16.4 | 1.822 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 100 | 57.2 | 7.581 | 44.0 | 57.0 | 64.5 | 44.0 | 65.0 |
| never.etudier | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.mediter | 77 | 704.2 | 2218 | 84.0 | 126.5 | 414.5 | 78.0 | 13754 |
| never.mediter | 100 | 0.230 | 0.423 | 0.000 | 0.000 | 1.000 | 0.000 | 1.000 |
| upgradeAt.alliances | 100 | 2068 | 309.8 | 1786 | 1996 | 2451 | 1586 | 3686 |
| never.alliances | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 100 | 3739 | 579.8 | 3141 | 3616 | 4541 | 2966 | 6411 |
| never.chroniques | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 6 % · commercer 31 % · cultiver 0 % · etudier 13 % · mediter 49 %

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
