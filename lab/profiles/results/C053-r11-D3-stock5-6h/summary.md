# Campagne C053-r11-D3-stock5-6h

- Commit : `a106685`
- Commande : `node --import ./lab/sim/register.mjs lab/profiles/run.ts --workers=4 --profiles=ep-sans-mariage,ep-mariage-force,ep-mariage-metier --seeds=1-100 --hours=6 --id=C053-r11-D3-stock5-6h`
- 300 parties · 6 h · dt 0.5 s · événements non · 29.5 s

> Résultats **[SIMULÉS]** : profils automatiques, pas de vrais joueurs. `never.*` = part des parties sans déblocage ; `unlock.*` / `upgradeAt.*` ne portent que sur les parties qui débloquent (n). Décision avant/après : `npm run sim:guard` (pas `sim:compare`).

## ep-mariage-force

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 100 | 166.7 | 4.371 | 162.0 | 167.0 | 172.0 | 156.0 | 180.0 |
| legacyTotal | 100 | 3357 | 153.2 | 3206 | 3378 | 3533 | 2802 | 3627 |
| log10Value | 100 | 8.536 | 0.071 | 8.507 | 8.547 | 8.585 | 8.261 | 8.660 |
| echoShare | 100 | 0.861 | 0.008 | 0.852 | 0.860 | 0.870 | 0.844 | 0.885 |
| harmonyAvg | 100 | 0.851 | 0.041 | 0.828 | 0.836 | 0.948 | 0.823 | 0.967 |
| traitCombos60 | 100 | 15.8 | 5.258 | 9.000 | 16.0 | 22.0 | 5.000 | 31.0 |
| epithetsFound | 100 | 6.660 | 1.094 | 6.000 | 6.000 | 8.000 | 5.000 | 11.0 |
| eventsDone | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 100 | 16.4 | 1.822 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 29 | 133.4 | 61.1 | 89.5 | 115.5 | 212.5 | 88.5 | 354.5 |
| never.etudier | 100 | 0.710 | 0.456 | 0.000 | 1.000 | 1.000 | 0.000 | 1.000 |
| unlock.mediter | 0 | — | — | — | — | — | — | — |
| never.mediter | 100 | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| upgradeAt.alliances | 100 | 1685 | 185.9 | 1476 | 1686 | 1941 | 1301 | 2151 |
| never.alliances | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 100 | 3210 | 268.7 | 2901 | 3181 | 3571 | 2711 | 3926 |
| never.chroniques | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 8 % · commercer 5 % · cultiver 88 % · etudier 0 % · mediter 0 %

## ep-mariage-metier

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 100 | 167.0 | 4.264 | 162.0 | 167.0 | 172.0 | 157.0 | 180.0 |
| legacyTotal | 100 | 3374 | 167.7 | 3210 | 3388 | 3541 | 2802 | 3830 |
| log10Value | 100 | 8.540 | 0.077 | 8.503 | 8.548 | 8.591 | 8.261 | 8.729 |
| echoShare | 100 | 0.861 | 0.008 | 0.852 | 0.860 | 0.870 | 0.844 | 0.891 |
| harmonyAvg | 100 | 0.850 | 0.040 | 0.828 | 0.836 | 0.949 | 0.823 | 0.967 |
| traitCombos60 | 100 | 16.2 | 5.243 | 9.000 | 17.0 | 23.0 | 5.000 | 31.0 |
| epithetsFound | 100 | 6.580 | 0.934 | 6.000 | 6.000 | 8.000 | 5.000 | 9.000 |
| eventsDone | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 100 | 16.4 | 1.822 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 29 | 133.4 | 61.1 | 89.5 | 115.5 | 212.5 | 88.5 | 354.5 |
| never.etudier | 100 | 0.710 | 0.456 | 0.000 | 1.000 | 1.000 | 0.000 | 1.000 |
| unlock.mediter | 0 | — | — | — | — | — | — | — |
| never.mediter | 100 | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| upgradeAt.alliances | 100 | 1685 | 185.9 | 1476 | 1686 | 1941 | 1301 | 2151 |
| never.alliances | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 100 | 3217 | 271.6 | 2901 | 3186 | 3601 | 2711 | 3926 |
| never.chroniques | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 8 % · commercer 4 % · cultiver 88 % · etudier 0 % · mediter 0 %

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
