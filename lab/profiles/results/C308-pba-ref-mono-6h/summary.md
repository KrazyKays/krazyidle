# Campagne C308-pba-ref-mono-6h

- Commit : `70b97b9`
- Commande : `node --import ./lab/sim/register.mjs lab/profiles/run.ts --workers=2 --profiles=i-mono-etudier,i-mono-mediter --seeds=1-100 --hours=6 --id=C308-pba-ref-mono-6h`
- 200 parties · 6 h · dt 0.5 s · événements non · 34.9 s

> Résultats **[SIMULÉS]** : profils automatiques, pas de vrais joueurs. `never.*` = part des parties sans déblocage ; `unlock.*` / `upgradeAt.*` ne portent que sur les parties qui débloquent (n). Décision avant/après : `npm run sim:guard` (pas `sim:compare`).

## i-mono-etudier

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 100 | 179.4 | 3.906 | 175.0 | 179.0 | 184.0 | 170.0 | 191.0 |
| legacyTotal | 100 | 2749 | 185.6 | 2575 | 2724 | 2918 | 2397 | 4068 |
| log10Value | 100 | 8.116 | 0.088 | 8.019 | 8.110 | 8.188 | 7.913 | 8.690 |
| echoShare | 100 | 0.855 | 0.010 | 0.843 | 0.855 | 0.868 | 0.833 | 0.879 |
| harmonyAvg | 100 | 0.997 | 0.001 | 0.996 | 0.997 | 0.998 | 0.995 | 0.999 |
| traitCombos60 | 100 | 31.7 | 4.882 | 25.0 | 32.0 | 38.0 | 21.0 | 43.0 |
| epithetsFound | 100 | 0.790 | 0.409 | 0.000 | 1.000 | 1.000 | 0.000 | 1.000 |
| eventsDone | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 100 | 16.6 | 1.823 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 100 | 65.0 | 11.7 | 54.5 | 57.0 | 81.0 | 54.5 | 81.0 |
| never.etudier | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.mediter | 100 | 136.9 | 72.5 | 86.0 | 94.5 | 240.5 | 79.5 | 334.0 |
| never.mediter | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.alliances | 100 | 13376 | 704.3 | 12486 | 13401 | 14096 | 10871 | 14991 |
| never.alliances | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 82 | 20001 | 1065 | 18856 | 20201 | 21261 | 15116 | 21576 |
| never.chroniques | 100 | 0.180 | 0.386 | 0.000 | 0.000 | 1.000 | 0.000 | 1.000 |
| anomalies | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 1 % · commercer 15 % · cultiver 4 % · etudier 79 % · mediter 1 %

## i-mono-mediter

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 100 | 175.7 | 7.045 | 168.0 | 173.0 | 185.0 | 164.0 | 195.0 |
| legacyTotal | 100 | 1712 | 65.5 | 1616 | 1731 | 1786 | 1532 | 1826 |
| log10Value | 100 | 7.520 | 0.115 | 7.348 | 7.556 | 7.642 | 7.242 | 7.701 |
| echoShare | 100 | 0.858 | 0.014 | 0.838 | 0.861 | 0.872 | 0.819 | 0.882 |
| harmonyAvg | 100 | 0.997 | 0.001 | 0.996 | 0.997 | 0.998 | 0.993 | 0.999 |
| traitCombos60 | 100 | 34.6 | 4.532 | 28.0 | 35.0 | 41.0 | 24.0 | 45.0 |
| epithetsFound | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| eventsDone | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 100 | 16.6 | 1.823 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 100 | 65.0 | 11.7 | 54.5 | 57.0 | 81.0 | 54.5 | 81.0 |
| never.etudier | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.mediter | 100 | 136.9 | 72.5 | 86.0 | 94.5 | 240.5 | 79.5 | 334.0 |
| never.mediter | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.alliances | 98 | 19479 | 800.0 | 18461 | 19486 | 20526 | 17746 | 21431 |
| never.alliances | 100 | 0.020 | 0.141 | 0.000 | 0.000 | 0.000 | 0.000 | 1.000 |
| upgradeAt.chroniques | 0 | — | — | — | — | — | — | — |
| never.chroniques | 100 | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| anomalies | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 1 % · commercer 3 % · cultiver 2 % · etudier 1 % · mediter 93 %
