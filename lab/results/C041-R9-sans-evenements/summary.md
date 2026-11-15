# Campagne C041-R9-sans-evenements

- Commit : `0c1c7b4`
- Commande : `npm run sim -- --profiles=experimente,optimiseur --seeds=1-200 --hours=6 --id=C041-R9-sans-evenements`
- 400 parties · 6 h · dt 0.5 s · événements non · 34.8 s

> Résultats **[SIMULÉS]** : profils automatiques, pas de vrais joueurs. `never.*` = part des parties sans déblocage ; `unlock.*` / `upgradeAt.*` ne portent que sur les parties qui débloquent (n). Décision avant/après : `npm run sim:guard` (pas `sim:compare`).

## experimente

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 200 | 164.8 | 2.809 | 162.0 | 165.0 | 168.0 | 154.0 | 172.0 |
| legacyTotal | 200 | 2108 | 47.1 | 2049 | 2111 | 2169 | 1963 | 2219 |
| log10Value | 200 | 8.221 | 0.032 | 8.179 | 8.223 | 8.259 | 8.130 | 8.317 |
| echoShare | 200 | 0.929 | 0.004 | 0.925 | 0.929 | 0.934 | 0.918 | 0.940 |
| harmonyAvg | 200 | 0.979 | 0.003 | 0.976 | 0.979 | 0.982 | 0.968 | 0.984 |
| traitCombos60 | 200 | 33.4 | 4.348 | 28.0 | 33.0 | 40.0 | 24.0 | 44.0 |
| epithetsFound | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| eventsDone | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 200 | 16.7 | 1.697 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 200 | 63.1 | 9.758 | 53.5 | 60.5 | 77.5 | 53.5 | 77.5 |
| never.etudier | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.mediter | 200 | 114.0 | 35.3 | 86.5 | 96.0 | 158.5 | 79.0 | 221.0 |
| never.mediter | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.alliances | 200 | 16830 | 588.9 | 16051 | 16816 | 17656 | 15556 | 18331 |
| never.alliances | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 0 | — | — | — | — | — | — | — |
| never.chroniques | 200 | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 |
| anomalies | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 15 % · commercer 42 % · cultiver 15 % · etudier 14 % · mediter 14 %

## optimiseur

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 200 | 154.9 | 3.601 | 151.0 | 155.0 | 160.0 | 145.0 | 165.0 |
| legacyTotal | 200 | 3508 | 185.2 | 3363 | 3545 | 3672 | 2825 | 3896 |
| log10Value | 200 | 8.579 | 0.099 | 8.540 | 8.605 | 8.639 | 8.239 | 8.816 |
| echoShare | 200 | 0.857 | 0.009 | 0.846 | 0.857 | 0.868 | 0.833 | 0.876 |
| harmonyAvg | 200 | 0.836 | 0.048 | 0.812 | 0.818 | 0.961 | 0.806 | 0.975 |
| traitCombos60 | 200 | 16.6 | 4.420 | 11.0 | 17.0 | 22.0 | 6.000 | 28.0 |
| epithetsFound | 200 | 3.785 | 0.664 | 3.000 | 4.000 | 4.000 | 0.000 | 6.000 |
| eventsDone | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 200 | 16.5 | 1.710 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 54 | 128.2 | 51.5 | 89.5 | 116.5 | 201.0 | 88.5 | 354.5 |
| never.etudier | 200 | 0.730 | 0.445 | 0.000 | 1.000 | 1.000 | 0.000 | 1.000 |
| unlock.mediter | 1 | 4872 | 0.000 | 4872 | 4872 | 4872 | 4872 | 4872 |
| never.mediter | 200 | 0.995 | 0.071 | 1.000 | 1.000 | 1.000 | 0.000 | 1.000 |
| upgradeAt.alliances | 200 | 11476 | 831.2 | 10436 | 11446 | 12496 | 9796 | 13721 |
| never.alliances | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 198 | 17134 | 1201 | 15721 | 16961 | 18596 | 14626 | 21356 |
| never.chroniques | 200 | 0.010 | 0.100 | 0.000 | 0.000 | 0.000 | 0.000 | 1.000 |
| anomalies | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 10 % · commercer 1 % · cultiver 89 % · etudier 0 % · mediter 0 %
