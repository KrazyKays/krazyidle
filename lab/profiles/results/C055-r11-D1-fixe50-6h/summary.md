# Campagne C055-r11-D1-fixe50-6h

- Commit : `a106685`
- Commande : `node --import ./lab/sim/register.mjs lab/profiles/run.ts --workers=4 --profiles=oc-sans-mariage,oc-mariage-force,oc-mariage-metier --seeds=1-200 --hours=6 --id=C055-r11-D1-fixe50-6h`
- 600 parties · 6 h · dt 0.5 s · événements non · 54.8 s

> Résultats **[SIMULÉS]** : profils automatiques, pas de vrais joueurs. `never.*` = part des parties sans déblocage ; `unlock.*` / `upgradeAt.*` ne portent que sur les parties qui débloquent (n). Décision avant/après : `npm run sim:guard` (pas `sim:compare`).

## oc-mariage-force

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 200 | 165.1 | 8.512 | 153.0 | 165.0 | 176.0 | 143.0 | 184.0 |
| legacyTotal | 200 | 2875 | 443.5 | 2220 | 2907 | 3447 | 1744 | 3660 |
| log10Value | 200 | 8.531 | 0.324 | 7.968 | 8.684 | 8.760 | 7.618 | 8.881 |
| echoShare | 200 | 0.902 | 0.041 | 0.851 | 0.879 | 0.947 | 0.839 | 0.955 |
| harmonyAvg | 200 | 0.977 | 0.025 | 0.942 | 0.992 | 1.000 | 0.934 | 1.000 |
| traitCombos60 | 200 | 15.6 | 6.257 | 7.000 | 15.0 | 24.0 | 4.000 | 32.0 |
| epithetsFound | 200 | 6.460 | 2.560 | 3.000 | 7.000 | 10.0 | 3.000 | 13.0 |
| eventsDone | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 200 | 16.5 | 1.710 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 200 | 57.7 | 7.371 | 44.0 | 63.5 | 64.5 | 44.0 | 65.0 |
| never.etudier | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.mediter | 152 | 589.6 | 1681 | 84.0 | 130.0 | 414.5 | 78.0 | 8958 |
| never.mediter | 200 | 0.240 | 0.428 | 0.000 | 0.000 | 1.000 | 0.000 | 1.000 |
| upgradeAt.alliances | 200 | 2086 | 322.4 | 1776 | 2001 | 2556 | 1516 | 3686 |
| never.alliances | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 200 | 3782 | 599.8 | 3181 | 3641 | 4541 | 2776 | 6261 |
| never.chroniques | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 11 % · commercer 34 % · cultiver 1 % · etudier 9 % · mediter 45 %

## oc-mariage-metier

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 200 | 165.1 | 8.108 | 153.0 | 167.0 | 174.0 | 142.0 | 184.0 |
| legacyTotal | 200 | 2901 | 455.8 | 2155 | 2932 | 3461 | 1710 | 3738 |
| log10Value | 200 | 8.531 | 0.326 | 7.917 | 8.662 | 8.760 | 7.577 | 8.881 |
| echoShare | 200 | 0.898 | 0.045 | 0.847 | 0.874 | 0.947 | 0.806 | 0.955 |
| harmonyAvg | 200 | 0.978 | 0.024 | 0.943 | 0.992 | 1.000 | 0.927 | 1.000 |
| traitCombos60 | 200 | 17.2 | 5.168 | 11.0 | 17.0 | 24.0 | 5.000 | 30.0 |
| epithetsFound | 200 | 6.170 | 2.351 | 3.000 | 6.000 | 9.000 | 3.000 | 13.0 |
| eventsDone | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 200 | 16.5 | 1.710 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 200 | 57.7 | 7.371 | 44.0 | 63.5 | 64.5 | 44.0 | 65.0 |
| never.etudier | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.mediter | 154 | 659.2 | 1956 | 84.0 | 130.0 | 548.0 | 78.0 | 13754 |
| never.mediter | 200 | 0.230 | 0.422 | 0.000 | 0.000 | 1.000 | 0.000 | 1.000 |
| upgradeAt.alliances | 200 | 2086 | 322.4 | 1776 | 2001 | 2556 | 1516 | 3686 |
| never.alliances | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 200 | 3789 | 607.5 | 3191 | 3646 | 4546 | 2776 | 6411 |
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
