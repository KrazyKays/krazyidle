# Campagne C310-pba-mariages-forces-6h

- Commit : `14b76fe`
- Commande : `node --import ./lab/sim/register.mjs lab/profiles/run.ts --workers=2 --profiles=ep-mariage-force,ep-mariage-metier --seeds=1-100 --hours=6 --id=C310-pba-mariages-forces-6h`
- 200 parties · 6 h · dt 0.5 s · événements non · 31.6 s

> Résultats **[SIMULÉS]** : profils automatiques, pas de vrais joueurs. `never.*` = part des parties sans déblocage ; `unlock.*` / `upgradeAt.*` ne portent que sur les parties qui débloquent (n). Décision avant/après : `npm run sim:guard` (pas `sim:compare`).

## ep-mariage-force

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 100 | 167.3 | 3.888 | 162.0 | 167.0 | 172.0 | 158.0 | 175.0 |
| legacyTotal | 100 | 3366 | 176.6 | 3194 | 3388 | 3559 | 2773 | 3670 |
| log10Value | 100 | 8.558 | 0.102 | 8.524 | 8.574 | 8.618 | 8.211 | 8.782 |
| echoShare | 100 | 0.869 | 0.008 | 0.859 | 0.869 | 0.879 | 0.841 | 0.891 |
| harmonyAvg | 100 | 0.850 | 0.045 | 0.825 | 0.833 | 0.956 | 0.822 | 0.988 |
| traitCombos60 | 100 | 17.3 | 4.808 | 12.0 | 17.0 | 23.0 | 5.000 | 32.0 |
| epithetsFound | 100 | 2.380 | 1.042 | 1.000 | 2.000 | 4.000 | 1.000 | 5.000 |
| eventsDone | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 100 | 16.4 | 1.822 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 29 | 149.1 | 77.2 | 89.5 | 116.0 | 235.5 | 88.5 | 354.5 |
| never.etudier | 100 | 0.710 | 0.456 | 0.000 | 1.000 | 1.000 | 0.000 | 1.000 |
| unlock.mediter | 0 | — | — | — | — | — | — | — |
| never.mediter | 100 | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| upgradeAt.alliances | 100 | 1685 | 183.6 | 1476 | 1686 | 1911 | 1301 | 2151 |
| never.alliances | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 100 | 3203 | 263.6 | 2896 | 3181 | 3566 | 2711 | 3926 |
| never.chroniques | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 9 % · commercer 4 % · cultiver 87 % · etudier 0 % · mediter 0 %

## ep-mariage-metier

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 100 | 167.2 | 4.015 | 162.0 | 167.0 | 172.0 | 154.0 | 175.0 |
| legacyTotal | 100 | 3386 | 188.3 | 3217 | 3394 | 3599 | 2773 | 3938 |
| log10Value | 100 | 8.570 | 0.111 | 8.526 | 8.579 | 8.632 | 8.211 | 8.873 |
| echoShare | 100 | 0.869 | 0.009 | 0.859 | 0.870 | 0.879 | 0.841 | 0.897 |
| harmonyAvg | 100 | 0.852 | 0.047 | 0.825 | 0.833 | 0.953 | 0.822 | 0.989 |
| traitCombos60 | 100 | 17.6 | 4.318 | 12.0 | 17.0 | 23.0 | 8.000 | 32.0 |
| epithetsFound | 100 | 2.450 | 1.058 | 1.000 | 2.000 | 4.000 | 1.000 | 5.000 |
| eventsDone | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 100 | 16.4 | 1.822 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 29 | 149.1 | 77.2 | 89.5 | 116.0 | 235.5 | 88.5 | 354.5 |
| never.etudier | 100 | 0.710 | 0.456 | 0.000 | 1.000 | 1.000 | 0.000 | 1.000 |
| unlock.mediter | 0 | — | — | — | — | — | — | — |
| never.mediter | 100 | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| upgradeAt.alliances | 100 | 1685 | 183.6 | 1476 | 1686 | 1911 | 1301 | 2151 |
| never.alliances | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 100 | 3216 | 269.2 | 2896 | 3186 | 3571 | 2711 | 3926 |
| never.chroniques | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 100 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 8 % · commercer 6 % · cultiver 85 % · etudier 0 % · mediter 0 %
