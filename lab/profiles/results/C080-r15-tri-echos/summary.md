# Campagne C080-r15-tri-echos

- Commit : `c205af0`
- Commande : `node --import ./lab/sim/register.mjs lab/profiles/run.ts --workers=4 --profiles=opti-epargne,ep-vraie-force --seeds=1-100 --hours=6 --id=C080-r15-tri-echos`
- 200 parties · 6 h · dt 0.5 s · événements non · 19.4 s

> Résultats **[SIMULÉS]** : profils automatiques, pas de vrais joueurs. `never.*` = part des parties sans déblocage ; `unlock.*` / `upgradeAt.*` ne portent que sur les parties qui débloquent (n). Décision avant/après : `npm run sim:guard` (pas `sim:compare`).

## ep-vraie-force

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 100 | 158.9 | 4.531 | 153.0 | 159.0 | 164.0 | 151.0 | 170.0 |
| legacyTotal | 100 | 3996 | 169.9 | 3880 | 4029 | 4155 | 3229 | 4313 |
| log10Value | 100 | 8.701 | 0.069 | 8.681 | 8.712 | 8.742 | 8.347 | 8.834 |
| echoShare | 100 | 0.886 | 0.005 | 0.880 | 0.885 | 0.892 | 0.874 | 0.901 |
| harmonyAvg | 100 | 0.828 | 0.043 | 0.807 | 0.813 | 0.859 | 0.802 | 0.968 |
| traitCombos60 | 100 | 16.2 | 4.937 | 10.0 | 17.0 | 22.0 | 5.000 | 30.0 |
| epithetsFound | 100 | 6.480 | 0.904 | 6.000 | 6.000 | 7.000 | 5.000 | 10.0 |
| eventsDone | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 100 | 16.4 | 1.822 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 29 | 133.4 | 61.1 | 89.5 | 115.5 | 212.5 | 88.5 | 354.5 |
| never.etudier | 100 | 0.710 | 0.456 | 0.000 | 1.000 | 1.000 | 0.000 | 1.000 |
| unlock.mediter | 0 | — | — | — | — | — | — | — |
| never.mediter | 100 | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| upgradeAt.alliances | 100 | 1580 | 138.7 | 1401 | 1586 | 1766 | 1301 | 1956 |
| never.alliances | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 100 | 2630 | 206.7 | 2381 | 2641 | 2891 | 2206 | 3186 |
| never.chroniques | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 6 % · commercer 4 % · cultiver 91 % · etudier 0 % · mediter 0 %

## opti-epargne

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 100 | 158.4 | 3.834 | 153.0 | 158.0 | 163.0 | 151.0 | 167.0 |
| legacyTotal | 100 | 3968 | 167.6 | 3876 | 4010 | 4098 | 3320 | 4159 |
| log10Value | 100 | 8.641 | 0.077 | 8.623 | 8.656 | 8.689 | 8.329 | 8.757 |
| echoShare | 100 | 0.872 | 0.006 | 0.864 | 0.872 | 0.878 | 0.853 | 0.891 |
| harmonyAvg | 100 | 0.832 | 0.041 | 0.812 | 0.817 | 0.869 | 0.805 | 0.970 |
| traitCombos60 | 100 | 15.1 | 4.871 | 10.0 | 15.0 | 21.0 | 5.000 | 29.0 |
| epithetsFound | 100 | 6.410 | 0.780 | 6.000 | 6.000 | 7.000 | 5.000 | 10.0 |
| eventsDone | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 100 | 16.4 | 1.822 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 29 | 133.4 | 61.1 | 89.5 | 115.5 | 212.5 | 88.5 | 354.5 |
| never.etudier | 100 | 0.710 | 0.456 | 0.000 | 1.000 | 1.000 | 0.000 | 1.000 |
| unlock.mediter | 0 | — | — | — | — | — | — | — |
| never.mediter | 100 | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| upgradeAt.alliances | 100 | 1584 | 141.6 | 1401 | 1591 | 1776 | 1301 | 1956 |
| never.alliances | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 100 | 2631 | 202.6 | 2386 | 2641 | 2891 | 2206 | 3186 |
| never.chroniques | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 7 % · commercer 2 % · cultiver 91 % · etudier 0 % · mediter 0 %
