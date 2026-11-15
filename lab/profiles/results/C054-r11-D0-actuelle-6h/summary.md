# Campagne C054-r11-D0-actuelle-6h

- Commit : `a106685`
- Commande : `node --import ./lab/sim/register.mjs lab/profiles/run.ts --workers=4 --profiles=oc-sans-mariage,oc-mariage-force,oc-mariage-metier --seeds=1-200 --hours=6 --id=C054-r11-D0-actuelle-6h`
- 600 parties · 6 h · dt 0.5 s · événements non · 57.1 s

> Résultats **[SIMULÉS]** : profils automatiques, pas de vrais joueurs. `never.*` = part des parties sans déblocage ; `unlock.*` / `upgradeAt.*` ne portent que sur les parties qui débloquent (n). Décision avant/après : `npm run sim:guard` (pas `sim:compare`).

## oc-mariage-force

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 200 | 166.3 | 9.543 | 153.0 | 167.0 | 179.0 | 142.0 | 190.0 |
| legacyTotal | 200 | 2735 | 353.8 | 2188 | 2874 | 3069 | 1819 | 3468 |
| log10Value | 200 | 8.419 | 0.356 | 7.915 | 8.476 | 8.760 | 7.565 | 8.881 |
| echoShare | 200 | 0.896 | 0.047 | 0.842 | 0.871 | 0.947 | 0.810 | 0.955 |
| harmonyAvg | 200 | 0.976 | 0.026 | 0.941 | 0.992 | 1.000 | 0.934 | 1.000 |
| traitCombos60 | 200 | 16.7 | 6.519 | 8.000 | 17.0 | 25.0 | 4.000 | 35.0 |
| epithetsFound | 200 | 6.065 | 2.315 | 3.000 | 6.000 | 9.000 | 3.000 | 12.0 |
| eventsDone | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 200 | 16.5 | 1.710 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 200 | 57.7 | 7.371 | 44.0 | 63.5 | 64.5 | 44.0 | 65.0 |
| never.etudier | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.mediter | 152 | 611.5 | 1804 | 84.0 | 130.0 | 414.5 | 78.0 | 12497 |
| never.mediter | 200 | 0.240 | 0.428 | 0.000 | 0.000 | 1.000 | 0.000 | 1.000 |
| upgradeAt.alliances | 200 | 2086 | 322.4 | 1776 | 2001 | 2556 | 1516 | 3686 |
| never.alliances | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 200 | 3790 | 603.5 | 3191 | 3651 | 4626 | 2776 | 6261 |
| never.chroniques | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 11 % · commercer 33 % · cultiver 1 % · etudier 10 % · mediter 45 %

## oc-mariage-metier

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 200 | 166.2 | 9.406 | 153.0 | 167.0 | 179.0 | 142.0 | 190.0 |
| legacyTotal | 200 | 2882 | 453.9 | 2192 | 2916 | 3461 | 1819 | 3698 |
| log10Value | 200 | 8.513 | 0.346 | 7.926 | 8.665 | 8.760 | 7.565 | 8.881 |
| echoShare | 200 | 0.898 | 0.045 | 0.844 | 0.878 | 0.947 | 0.810 | 0.955 |
| harmonyAvg | 200 | 0.978 | 0.024 | 0.944 | 0.992 | 1.000 | 0.927 | 1.000 |
| traitCombos60 | 200 | 18.6 | 5.222 | 13.0 | 18.0 | 26.0 | 5.000 | 35.0 |
| epithetsFound | 200 | 5.935 | 2.174 | 3.000 | 6.000 | 8.000 | 3.000 | 13.0 |
| eventsDone | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 200 | 16.5 | 1.710 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 200 | 57.7 | 7.371 | 44.0 | 63.5 | 64.5 | 44.0 | 65.0 |
| never.etudier | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.mediter | 154 | 663.5 | 1976 | 84.0 | 130.0 | 548.0 | 78.0 | 13754 |
| never.mediter | 200 | 0.230 | 0.422 | 0.000 | 0.000 | 1.000 | 0.000 | 1.000 |
| upgradeAt.alliances | 200 | 2086 | 322.4 | 1776 | 2001 | 2556 | 1516 | 3686 |
| never.alliances | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 200 | 3793 | 607.3 | 3191 | 3651 | 4601 | 2776 | 6261 |
| never.chroniques | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 9 % · commercer 32 % · cultiver 1 % · etudier 13 % · mediter 45 %

## oc-sans-mariage

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 200 | 166.9 | 9.795 | 153.0 | 167.0 | 179.0 | 144.0 | 190.0 |
| legacyTotal | 200 | 2896 | 439.2 | 2190 | 2915 | 3457 | 1819 | 3804 |
| log10Value | 200 | 8.520 | 0.332 | 7.926 | 8.662 | 8.760 | 7.565 | 8.881 |
| echoShare | 200 | 0.898 | 0.045 | 0.845 | 0.877 | 0.947 | 0.810 | 0.955 |
| harmonyAvg | 200 | 0.978 | 0.024 | 0.942 | 0.992 | 1.000 | 0.927 | 1.000 |
| traitCombos60 | 200 | 19.1 | 4.840 | 13.0 | 19.0 | 25.0 | 7.000 | 35.0 |
| epithetsFound | 200 | 5.830 | 2.089 | 3.000 | 5.000 | 9.000 | 3.000 | 12.0 |
| eventsDone | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 200 | 16.5 | 1.710 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 200 | 57.7 | 7.371 | 44.0 | 63.5 | 64.5 | 44.0 | 65.0 |
| never.etudier | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.mediter | 154 | 634.7 | 1866 | 84.0 | 130.0 | 548.0 | 78.0 | 13754 |
| never.mediter | 200 | 0.230 | 0.422 | 0.000 | 0.000 | 1.000 | 0.000 | 1.000 |
| upgradeAt.alliances | 200 | 2086 | 322.4 | 1776 | 2001 | 2556 | 1516 | 3686 |
| never.alliances | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 200 | 3775 | 606.5 | 3171 | 3621 | 4556 | 2776 | 6261 |
| never.chroniques | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 10 % · commercer 31 % · cultiver 1 % · etudier 13 % · mediter 45 %
