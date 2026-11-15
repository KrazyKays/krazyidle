# Campagne C009-verif-R5-avec-evenements

- Commit : `c4717e2` (**src/ modifié**)
- Commande : `npm run sim -- --profiles=experimente,optimiseur,occasionnel --seeds=1-200 --hours=6 --events --id=C009-verif-R5-avec-evenements`
- 600 parties · 6 h · dt 0.5 s · événements oui · 63.4 s

> Résultats **[SIMULÉS]** : profils automatiques, pas de vrais joueurs. `never.*` = part des parties sans déblocage ; `unlock.*` / `upgradeAt.*` ne portent que sur les parties qui débloquent (n). Décision avant/après : `npm run sim:guard` (pas `sim:compare`).

## experimente

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 200 | 168.0 | 2.442 | 165.0 | 168.0 | 171.0 | 160.0 | 174.0 |
| legacyTotal | 200 | 2210 | 55.5 | 2147 | 2208 | 2282 | 2063 | 2400 |
| log10Value | 200 | 8.302 | 0.042 | 8.255 | 8.299 | 8.355 | 8.222 | 8.459 |
| echoShare | 200 | 0.933 | 0.004 | 0.928 | 0.933 | 0.938 | 0.922 | 0.946 |
| harmonyAvg | 200 | 0.981 | 0.002 | 0.978 | 0.981 | 0.983 | 0.971 | 0.987 |
| traitCombos60 | 200 | 33.1 | 4.595 | 28.0 | 33.0 | 40.0 | 21.0 | 46.0 |
| epithetsFound | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| eventsDone | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 200 | 16.7 | 1.697 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 200 | 63.4 | 10.1 | 53.5 | 60.5 | 78.0 | 53.5 | 78.0 |
| never.etudier | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.mediter | 200 | 111.1 | 34.3 | 86.0 | 93.0 | 154.0 | 79.0 | 277.5 |
| never.mediter | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.alliances | 200 | 16165 | 692.4 | 15266 | 16191 | 17011 | 14611 | 18676 |
| never.alliances | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 0 | — | — | — | — | — | — | — |
| never.chroniques | 200 | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| anomalies | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 14 % · commercer 42 % · cultiver 16 % · etudier 14 % · mediter 14 %

## occasionnel

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 200 | 28.2 | 1.247 | 27.0 | 28.0 | 30.0 | 23.0 | 31.0 |
| legacyTotal | 200 | 121.1 | 12.9 | 107.0 | 119.0 | 139.0 | 97.0 | 165.0 |
| log10Value | 200 | 6.219 | 0.249 | 5.881 | 6.221 | 6.544 | 5.573 | 6.733 |
| echoShare | 200 | 0.930 | 0.033 | 0.890 | 0.938 | 0.961 | 0.804 | 0.976 |
| harmonyAvg | 200 | 0.985 | 0.019 | 0.965 | 0.995 | 0.997 | 0.903 | 0.998 |
| traitCombos60 | 200 | 24.3 | 1.941 | 22.0 | 24.0 | 27.0 | 18.0 | 29.0 |
| epithetsFound | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| eventsDone | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 200 | 16.7 | 1.697 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 200 | 68.5 | 14.1 | 55.5 | 63.0 | 89.5 | 55.5 | 89.5 |
| never.etudier | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.mediter | 200 | 132.6 | 62.9 | 92.5 | 100.5 | 219.0 | 84.5 | 358.0 |
| never.mediter | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.alliances | 0 | — | — | — | — | — | — | — |
| never.alliances | 200 | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| upgradeAt.chroniques | 0 | — | — | — | — | — | — | — |
| never.chroniques | 200 | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| anomalies | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 19 % · commercer 35 % · cultiver 19 % · etudier 14 % · mediter 13 %

## optimiseur

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 200 | 155.3 | 3.697 | 151.0 | 155.0 | 160.0 | 145.0 | 165.0 |
| legacyTotal | 200 | 3527 | 197.5 | 3364 | 3557 | 3688 | 2864 | 4034 |
| log10Value | 200 | 8.618 | 0.108 | 8.577 | 8.642 | 8.679 | 8.226 | 8.899 |
| echoShare | 200 | 0.868 | 0.009 | 0.856 | 0.868 | 0.878 | 0.839 | 0.900 |
| harmonyAvg | 200 | 0.838 | 0.055 | 0.810 | 0.815 | 0.971 | 0.804 | 0.987 |
| traitCombos60 | 200 | 16.7 | 4.571 | 11.0 | 17.0 | 22.0 | 6.000 | 28.0 |
| epithetsFound | 200 | 0.995 | 0.071 | 1.000 | 1.000 | 1.000 | 0.000 | 1.000 |
| eventsDone | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 200 | 16.5 | 1.710 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 54 | 146.3 | 68.8 | 89.5 | 116.5 | 235.5 | 88.5 | 354.5 |
| never.etudier | 200 | 0.730 | 0.445 | 0.000 | 1.000 | 1.000 | 0.000 | 1.000 |
| unlock.mediter | 5 | 3845 | 1427 | 2170 | 3582 | 5687 | 2170 | 5687 |
| never.mediter | 200 | 0.975 | 0.157 | 1.000 | 1.000 | 1.000 | 0.000 | 1.000 |
| upgradeAt.alliances | 200 | 11467 | 850.5 | 10401 | 11426 | 12531 | 9796 | 13721 |
| never.alliances | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 200 | 17077 | 1207 | 15661 | 16961 | 18476 | 14626 | 21521 |
| never.chroniques | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 10 % · commercer 3 % · cultiver 86 % · etudier 2 % · mediter 0 %
