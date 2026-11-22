# Campagne S-V0-dt01

- Commit : `cc23380`
- Commande : `npm run sim -- --id=S-V0-dt01 --profiles=experimente,optimiseur --seeds=1-50 --hours=6 --dt=0.1`
- 100 parties · 6 h · dt 0.1 s · événements non · 97.3 s

> Résultats **[SIMULÉS]** : profils automatiques, pas de vrais joueurs. `never.*` = part des parties sans déblocage ; `unlock.*` / `upgradeAt.*` ne portent que sur les parties qui débloquent (n). Décision avant/après : `npm run sim:guard` (pas `sim:compare`).

## experimente

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 50 | 162.3 | 2.747 | 159.0 | 162.0 | 165.0 | 155.0 | 169.0 |
| legacyTotal | 50 | 2121 | 44.1 | 2064 | 2130 | 2175 | 2003 | 2193 |
| log10Value | 50 | 8.221 | 0.038 | 8.172 | 8.217 | 8.269 | 8.131 | 8.321 |
| echoShare | 50 | 0.931 | 0.005 | 0.926 | 0.929 | 0.939 | 0.923 | 0.943 |
| harmonyAvg | 50 | 0.995 | 0.000 | 0.994 | 0.995 | 0.995 | 0.994 | 0.995 |
| traitCombos60 | 50 | 39.9 | 3.724 | 35.0 | 40.0 | 45.0 | 32.0 | 47.0 |
| epithetsFound | 50 | 5.140 | 0.351 | 5.000 | 5.000 | 6.000 | 5.000 | 6.000 |
| eventsDone | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 50 | 18.1 | 1.771 | 14.1 | 18.9 | 18.9 | 14.1 | 18.9 |
| unlock.etudier | 50 | 52.2 | 3.375 | 47.3 | 54.9 | 55.0 | 47.3 | 55.0 |
| never.etudier | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.mediter | 50 | 317.0 | 64.9 | 260.6 | 331.2 | 358.4 | 80.2 | 399.4 |
| never.mediter | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.alliances | 50 | 9694 | 664.7 | 8774 | 9844 | 10494 | 8239 | 11399 |
| never.alliances | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 50 | 17126 | 700.6 | 16189 | 17088 | 17838 | 15954 | 19138 |
| never.chroniques | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : commercer 45 % · cultiver 20 % · etudier 17 % · mediter 17 %

## optimiseur

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 50 | 167.2 | 3.523 | 163.0 | 167.0 | 171.0 | 160.0 | 176.0 |
| legacyTotal | 50 | 4429 | 123.3 | 4305 | 4448 | 4581 | 4123 | 4679 |
| log10Value | 50 | 8.773 | 0.057 | 8.711 | 8.763 | 8.828 | 8.660 | 8.931 |
| echoShare | 50 | 0.874 | 0.011 | 0.864 | 0.870 | 0.887 | 0.848 | 0.901 |
| harmonyAvg | 50 | 0.852 | 0.004 | 0.848 | 0.852 | 0.856 | 0.843 | 0.861 |
| traitCombos60 | 50 | 34.0 | 3.711 | 30.0 | 34.0 | 38.0 | 26.0 | 44.0 |
| epithetsFound | 50 | 4.320 | 0.653 | 4.000 | 4.000 | 5.000 | 3.000 | 6.000 |
| eventsDone | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 50 | 18.1 | 1.771 | 14.1 | 18.9 | 18.9 | 14.1 | 18.9 |
| unlock.etudier | 0 | — | — | — | — | — | — | — |
| never.etudier | 50 | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| unlock.mediter | 0 | — | — | — | — | — | — | — |
| never.mediter | 50 | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| upgradeAt.alliances | 50 | 6021 | 506.4 | 5389 | 5934 | 6674 | 5134 | 7279 |
| never.alliances | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 50 | 9850 | 545.4 | 9179 | 9864 | 10514 | 8984 | 11499 |
| never.chroniques | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 50 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : commercer 0 % · cultiver 100 % · etudier 0 % · mediter 0 %
