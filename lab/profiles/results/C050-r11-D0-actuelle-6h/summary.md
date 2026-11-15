# Campagne C050-r11-D0-actuelle-6h

- Commit : `a106685`
- Commande : `node --import ./lab/sim/register.mjs lab/profiles/run.ts --workers=4 --profiles=ep-sans-mariage,ep-mariage-force,ep-mariage-metier --seeds=1-100 --hours=6 --id=C050-r11-D0-actuelle-6h`
- 300 parties · 6 h · dt 0.5 s · événements non · 26.7 s

> Résultats **[SIMULÉS]** : profils automatiques, pas de vrais joueurs. `never.*` = part des parties sans déblocage ; `unlock.*` / `upgradeAt.*` ne portent que sur les parties qui débloquent (n). Décision avant/après : `npm run sim:guard` (pas `sim:compare`).

## ep-mariage-force

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 100 | 166.9 | 4.423 | 161.0 | 167.0 | 172.0 | 155.0 | 180.0 |
| legacyTotal | 100 | 3354 | 167.1 | 3173 | 3381 | 3533 | 2777 | 3627 |
| log10Value | 100 | 8.529 | 0.085 | 8.497 | 8.546 | 8.584 | 8.173 | 8.643 |
| echoShare | 100 | 0.860 | 0.008 | 0.850 | 0.860 | 0.870 | 0.833 | 0.882 |
| harmonyAvg | 100 | 0.850 | 0.039 | 0.828 | 0.836 | 0.889 | 0.823 | 0.966 |
| traitCombos60 | 100 | 16.5 | 5.000 | 10.0 | 17.0 | 23.0 | 5.000 | 31.0 |
| epithetsFound | 100 | 6.620 | 0.940 | 6.000 | 6.000 | 8.000 | 5.000 | 9.000 |
| eventsDone | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 100 | 16.4 | 1.822 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 29 | 133.4 | 61.1 | 89.5 | 115.5 | 212.5 | 88.5 | 354.5 |
| never.etudier | 100 | 0.710 | 0.456 | 0.000 | 1.000 | 1.000 | 0.000 | 1.000 |
| unlock.mediter | 0 | — | — | — | — | — | — | — |
| never.mediter | 100 | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| upgradeAt.alliances | 100 | 1685 | 185.9 | 1476 | 1686 | 1941 | 1301 | 2151 |
| never.alliances | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 100 | 3213 | 266.9 | 2901 | 3181 | 3571 | 2711 | 3926 |
| never.chroniques | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 7 % · commercer 3 % · cultiver 89 % · etudier 0 % · mediter 0 %

## ep-mariage-metier

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 100 | 167.0 | 4.329 | 162.0 | 167.0 | 172.0 | 157.0 | 180.0 |
| legacyTotal | 100 | 3377 | 155.7 | 3221 | 3390 | 3540 | 2777 | 3735 |
| log10Value | 100 | 8.541 | 0.083 | 8.507 | 8.549 | 8.592 | 8.173 | 8.705 |
| echoShare | 100 | 0.860 | 0.008 | 0.851 | 0.861 | 0.870 | 0.833 | 0.883 |
| harmonyAvg | 100 | 0.850 | 0.039 | 0.828 | 0.836 | 0.942 | 0.823 | 0.966 |
| traitCombos60 | 100 | 16.8 | 4.936 | 10.0 | 18.0 | 23.0 | 5.000 | 31.0 |
| epithetsFound | 100 | 6.580 | 0.855 | 6.000 | 6.000 | 8.000 | 5.000 | 9.000 |
| eventsDone | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 100 | 16.4 | 1.822 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 29 | 133.4 | 61.1 | 89.5 | 115.5 | 212.5 | 88.5 | 354.5 |
| never.etudier | 100 | 0.710 | 0.456 | 0.000 | 1.000 | 1.000 | 0.000 | 1.000 |
| unlock.mediter | 0 | — | — | — | — | — | — | — |
| never.mediter | 100 | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| upgradeAt.alliances | 100 | 1685 | 185.9 | 1476 | 1686 | 1941 | 1301 | 2151 |
| never.alliances | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 100 | 3219 | 271.7 | 2901 | 3186 | 3601 | 2711 | 3926 |
| never.chroniques | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 7 % · commercer 5 % · cultiver 88 % · etudier 0 % · mediter 0 %

## ep-sans-mariage

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 100 | 167.3 | 4.200 | 162.0 | 167.0 | 172.0 | 157.0 | 180.0 |
| legacyTotal | 100 | 3381 | 181.0 | 3210 | 3390 | 3563 | 2805 | 3879 |
| log10Value | 100 | 8.541 | 0.090 | 8.503 | 8.548 | 8.592 | 8.199 | 8.787 |
| echoShare | 100 | 0.861 | 0.008 | 0.851 | 0.860 | 0.870 | 0.841 | 0.886 |
| harmonyAvg | 100 | 0.851 | 0.041 | 0.828 | 0.836 | 0.949 | 0.823 | 0.966 |
| traitCombos60 | 100 | 17.0 | 4.842 | 11.0 | 18.0 | 23.0 | 5.000 | 31.0 |
| epithetsFound | 100 | 6.550 | 0.783 | 6.000 | 6.000 | 8.000 | 5.000 | 8.000 |
| eventsDone | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 100 | 16.4 | 1.822 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 29 | 133.4 | 61.1 | 89.5 | 115.5 | 212.5 | 88.5 | 354.5 |
| never.etudier | 100 | 0.710 | 0.456 | 0.000 | 1.000 | 1.000 | 0.000 | 1.000 |
| unlock.mediter | 0 | — | — | — | — | — | — | — |
| never.mediter | 100 | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| upgradeAt.alliances | 100 | 1685 | 185.9 | 1476 | 1686 | 1941 | 1301 | 2151 |
| never.alliances | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 100 | 3211 | 282.9 | 2876 | 3181 | 3601 | 2696 | 3926 |
| never.chroniques | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 7 % · commercer 5 % · cultiver 88 % · etudier 0 % · mediter 0 %
