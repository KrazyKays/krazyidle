# Campagne C056-r11-D3-stock5-6h

- Commit : `a106685`
- Commande : `node --import ./lab/sim/register.mjs lab/profiles/run.ts --workers=4 --profiles=oc-sans-mariage,oc-mariage-force,oc-mariage-metier --seeds=1-200 --hours=6 --id=C056-r11-D3-stock5-6h`
- 600 parties · 6 h · dt 0.5 s · événements non · 57.2 s

> Résultats **[SIMULÉS]** : profils automatiques, pas de vrais joueurs. `never.*` = part des parties sans déblocage ; `unlock.*` / `upgradeAt.*` ne portent que sur les parties qui débloquent (n). Décision avant/après : `npm run sim:guard` (pas `sim:compare`).

## oc-mariage-force

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 200 | 165.2 | 8.551 | 153.0 | 166.0 | 176.0 | 143.0 | 184.0 |
| legacyTotal | 200 | 2830 | 399.7 | 2243 | 2901 | 3307 | 1760 | 3549 |
| log10Value | 200 | 8.506 | 0.321 | 7.976 | 8.639 | 8.760 | 7.618 | 8.881 |
| echoShare | 200 | 0.901 | 0.042 | 0.852 | 0.877 | 0.947 | 0.837 | 0.955 |
| harmonyAvg | 200 | 0.976 | 0.026 | 0.941 | 0.992 | 1.000 | 0.907 | 1.000 |
| traitCombos60 | 200 | 15.5 | 5.671 | 8.000 | 15.0 | 23.0 | 5.000 | 31.0 |
| epithetsFound | 200 | 6.415 | 2.566 | 3.000 | 6.000 | 10.0 | 3.000 | 13.0 |
| eventsDone | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 200 | 16.5 | 1.710 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 200 | 57.7 | 7.371 | 44.0 | 63.5 | 64.5 | 44.0 | 65.0 |
| never.etudier | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.mediter | 152 | 658.0 | 2033 | 84.0 | 130.0 | 414.5 | 78.0 | 13924 |
| never.mediter | 200 | 0.240 | 0.428 | 0.000 | 0.000 | 1.000 | 0.000 | 1.000 |
| upgradeAt.alliances | 200 | 2086 | 322.4 | 1776 | 2001 | 2556 | 1516 | 3686 |
| never.alliances | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 200 | 3783 | 598.0 | 3191 | 3641 | 4541 | 2776 | 6261 |
| never.chroniques | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| anomalies | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |

Temps héros : chasser 11 % · commercer 34 % · cultiver 1 % · etudier 10 % · mediter 45 %

## oc-mariage-metier

| Indicateur | n | moy. | é.-t. | p10 | p50 | p90 | min | max |
|---|---|---|---|---|---|---|---|---|
| gen | 200 | 165.1 | 8.162 | 153.0 | 166.0 | 174.0 | 142.0 | 188.0 |
| legacyTotal | 200 | 2894 | 452.9 | 2187 | 2918 | 3431 | 1710 | 3826 |
| log10Value | 200 | 8.528 | 0.327 | 7.917 | 8.659 | 8.760 | 7.577 | 8.881 |
| echoShare | 200 | 0.898 | 0.045 | 0.846 | 0.876 | 0.947 | 0.806 | 0.955 |
| harmonyAvg | 200 | 0.978 | 0.024 | 0.943 | 0.992 | 1.000 | 0.927 | 1.000 |
| traitCombos60 | 200 | 17.1 | 5.075 | 11.0 | 17.0 | 24.0 | 5.000 | 30.0 |
| epithetsFound | 200 | 6.160 | 2.405 | 3.000 | 6.000 | 9.000 | 3.000 | 13.0 |
| eventsDone | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.commercer | 200 | 16.5 | 1.710 | 12.5 | 17.5 | 17.5 | 12.5 | 17.5 |
| unlock.etudier | 200 | 57.7 | 7.371 | 44.0 | 63.5 | 64.5 | 44.0 | 65.0 |
| never.etudier | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| unlock.mediter | 154 | 659.2 | 1956 | 84.0 | 130.0 | 548.0 | 78.0 | 13754 |
| never.mediter | 200 | 0.230 | 0.422 | 0.000 | 0.000 | 1.000 | 0.000 | 1.000 |
| upgradeAt.alliances | 200 | 2086 | 322.4 | 1776 | 2001 | 2556 | 1516 | 3686 |
| never.alliances | 200 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 |
| upgradeAt.chroniques | 200 | 3792 | 609.6 | 3191 | 3646 | 4556 | 2776 | 6411 |
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
