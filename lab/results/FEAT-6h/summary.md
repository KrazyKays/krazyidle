# Campagne FEAT-6h

- Commit : `inconnu`
- Commande : `npm run sim -- --profiles=experimente,optimiseur,evenementiel --seeds=1-60 --hours=6 --events --id=FEAT-6h`
- 180 parties · 6 h · dt 0.5 s · événements oui · 40.4 s

> Résultats **[SIMULÉS]** : profils automatiques, pas de vrais joueurs. `never.*` = part des parties sans déblocage ; `unlock.*` / `upgradeAt.*` ne portent que sur les parties qui débloquent (n). Décision avant/après : `npm run sim:guard` (pas `sim:compare`).

## evenementiel

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 60 | 157.8 | 3.470 | 153.0 | 158.0 | 162.0 | 151.0 | 166.0 |
| legacyTotal | 60 | 2266 | 52.3 | 2200 | 2262 | 2344 | 2165 | 2384 |
| log10Value | 60 | 8.666 | 0.092 | 8.560 | 8.671 | 8.816 | 8.460 | 8.884 |
| echoShare | 60 | 0.953 | 0.006 | 0.946 | 0.952 | 0.961 | 0.940 | 0.968 |
| harmonyAvg | 60 | 0.985 | 0.003 | 0.982 | 0.986 | 0.988 | 0.970 | 0.990 |
| traitCombos60 | 60 | 42.8 | 3.632 | 38.0 | 43.0 | 48.0 | 34.0 | 50.0 |
| epithetsFound | 60 | 5.083 | 0.279 | 5.000 | 5.000 | 5.000 | 5.000 | 6.000 |
| eventsDone | 60 | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| unlock.commercer | 60 | 16.6 | 1.876 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 60 | 64.3 | 10.5 | 53.5 | 60.5 | 77.5 | 53.5 | 77.5 |
| never.etudier | 60 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.mediter | 60 | 124.4 | 43.6 | 87.5 | 97.0 | 198.0 | 79.5 | 215.0 |
| never.mediter | 60 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.alliances | 60 | 9700 | 587.4 | 8956 | 9651 | 10421 | 8466 | 11136 |
| never.alliances | 60 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 60 | 15687 | 737.0 | 14716 | 15621 | 16516 | 14486 | 17731 |
| never.chroniques | 60 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 60 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 12 % · commercer 36 % · cultiver 14 % · etudier 12 % · mediter 26 %

## experimente

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 60 | 163.9 | 3.540 | 161.0 | 164.0 | 169.0 | 156.0 | 172.0 |
| legacyTotal | 60 | 2073 | 43.9 | 2018 | 2077 | 2116 | 1983 | 2184 |
| log10Value | 60 | 8.226 | 0.040 | 8.186 | 8.220 | 8.275 | 8.115 | 8.320 |
| echoShare | 60 | 0.936 | 0.004 | 0.931 | 0.936 | 0.942 | 0.929 | 0.947 |
| harmonyAvg | 60 | 0.979 | 0.003 | 0.977 | 0.979 | 0.982 | 0.964 | 0.984 |
| traitCombos60 | 60 | 41.0 | 4.417 | 36.0 | 41.0 | 46.0 | 32.0 | 51.0 |
| epithetsFound | 60 | 5.000 | 0.611 | 5.000 | 5.000 | 6.000 | 2.000 | 6.000 |
| eventsDone | 60 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 60 | 16.6 | 1.876 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 60 | 64.3 | 10.5 | 53.5 | 60.5 | 77.5 | 53.5 | 77.5 |
| never.etudier | 60 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.mediter | 60 | 124.4 | 43.6 | 87.5 | 97.0 | 198.0 | 79.5 | 215.0 |
| never.mediter | 60 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.alliances | 60 | 9700 | 587.4 | 8956 | 9651 | 10421 | 8466 | 11136 |
| never.alliances | 60 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 60 | 17556 | 680.9 | 16686 | 17531 | 18331 | 16236 | 20251 |
| never.chroniques | 60 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 60 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 14 % · commercer 42 % · cultiver 16 % · etudier 14 % · mediter 14 %

## optimiseur

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 60 | 168.3 | 3.510 | 164.0 | 168.0 | 171.0 | 160.0 | 180.0 |
| legacyTotal | 60 | 4120 | 192.3 | 3787 | 4169 | 4280 | 3460 | 4404 |
| log10Value | 60 | 8.660 | 0.092 | 8.461 | 8.684 | 8.720 | 8.380 | 8.789 |
| echoShare | 60 | 0.870 | 0.009 | 0.860 | 0.869 | 0.880 | 0.850 | 0.895 |
| harmonyAvg | 60 | 0.832 | 0.052 | 0.805 | 0.813 | 0.968 | 0.801 | 0.976 |
| traitCombos60 | 60 | 33.4 | 4.256 | 28.0 | 34.0 | 38.0 | 24.0 | 44.0 |
| epithetsFound | 60 | 4.383 | 0.613 | 4.000 | 4.000 | 5.000 | 3.000 | 5.000 |
| eventsDone | 60 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 60 | 16.3 | 1.873 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 18 | 137.3 | 62.4 | 90.0 | 103.5 | 201.0 | 88.5 | 294.5 |
| never.etudier | 60 | 0.700 | 0.462 | 0.000 | 1.000 | 1.000 | 0.000 | 1.000 |
| unlock.mediter | 0 | — | — | — | — | — | — | — |
| never.mediter | 60 | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| upgradeAt.alliances | 60 | 6303 | 464.4 | 5716 | 6351 | 6861 | 5216 | 7131 |
| never.alliances | 60 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 60 | 10400 | 574.3 | 9671 | 10381 | 11196 | 9321 | 11731 |
| never.chroniques | 60 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 60 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 12 % · commercer 0 % · cultiver 88 % · etudier 0 % · mediter 0 %
