# Campagne EVO-v0.4

- Commit : `5b2df5f` (**src/ modifié**)
- Commande : `npm run sim -- --profiles=experimente,optimiseur --seeds=1-200 --hours=6 --id=EVO-v0.4`
- 400 parties · 6 h · dt 0.5 s · événements non · 44.5 s

> Résultats **[SIMULÉS]** : profils automatiques, pas de vrais joueurs. `never.*` = part des parties sans déblocage ; `unlock.*` / `upgradeAt.*` ne portent que sur les parties qui débloquent (n). Décision avant/après : `npm run sim:guard` (pas `sim:compare`).

## experimente

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 200 | 166.0 | 3.342 | 162.0 | 166.0 | 170.0 | 157.0 | 176.0 |
| legacyTotal | 200 | 1949 | 39.6 | 1893 | 1949 | 1998 | 1839 | 2055 |
| log10Value | 200 | 8.090 | 0.046 | 8.032 | 8.091 | 8.144 | 7.950 | 8.271 |
| echoShare | 200 | 0.930 | 0.006 | 0.924 | 0.930 | 0.937 | 0.915 | 0.952 |
| harmonyAvg | 200 | 0.979 | 0.003 | 0.976 | 0.979 | 0.982 | 0.964 | 0.983 |
| traitCombos60 | 200 | 42.0 | 3.635 | 37.0 | 42.0 | 46.0 | 32.0 | 50.0 |
| epithetsFound | 200 | 4.920 | 0.683 | 4.000 | 5.000 | 6.000 | 2.000 | 6.000 |
| eventsDone | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 200 | 16.7 | 1.697 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 200 | 63.2 | 9.807 | 53.5 | 60.5 | 77.5 | 53.5 | 77.5 |
| never.etudier | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.mediter | 200 | 119.7 | 44.1 | 87.5 | 96.0 | 198.0 | 80.0 | 323.5 |
| never.mediter | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.alliances | 200 | 10198 | 654.8 | 9316 | 10181 | 11106 | 8641 | 11716 |
| never.alliances | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 200 | 18329 | 673.4 | 17431 | 18356 | 19201 | 16766 | 20136 |
| never.chroniques | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 14 % · commercer 42 % · cultiver 16 % · etudier 14 % · mediter 14 %

## optimiseur

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 200 | 166.4 | 4.438 | 162.0 | 167.0 | 171.0 | 152.0 | 179.0 |
| legacyTotal | 200 | 3841 | 202.1 | 3467 | 3900 | 4003 | 3093 | 4100 |
| log10Value | 200 | 8.546 | 0.095 | 8.366 | 8.567 | 8.633 | 8.220 | 8.731 |
| echoShare | 200 | 0.868 | 0.012 | 0.853 | 0.867 | 0.884 | 0.841 | 0.899 |
| harmonyAvg | 200 | 0.844 | 0.051 | 0.815 | 0.823 | 0.969 | 0.806 | 0.976 |
| traitCombos60 | 200 | 31.6 | 6.206 | 25.0 | 32.0 | 38.0 | 6.000 | 46.0 |
| epithetsFound | 200 | 4.310 | 0.759 | 4.000 | 4.000 | 5.000 | 3.000 | 9.000 |
| eventsDone | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 200 | 16.5 | 1.710 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 59 | 135.6 | 94.0 | 89.0 | 117.0 | 201.0 | 88.5 | 718.5 |
| never.etudier | 200 | 0.705 | 0.457 | 0.000 | 1.000 | 1.000 | 0.000 | 1.000 |
| unlock.mediter | 2 | 5798 | 7821 | 268.0 | 11328 | 11328 | 268.0 | 11328 |
| never.mediter | 200 | 0.990 | 0.100 | 1.000 | 1.000 | 1.000 | 0.000 | 1.000 |
| upgradeAt.alliances | 200 | 6389 | 469.3 | 5751 | 6436 | 6926 | 5031 | 7451 |
| never.alliances | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 200 | 10734 | 704.5 | 9901 | 10651 | 11696 | 9331 | 13631 |
| never.chroniques | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 14 % · commercer 0 % · cultiver 86 % · etudier 0 % · mediter 0 %
