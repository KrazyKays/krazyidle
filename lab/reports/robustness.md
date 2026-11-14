# Robustesse des mesures

> **[SIMULÉ]** — généré par `lab/metrics/robustness.ts`.

## 1. Effet du pas dt (0,1 s contre 0,5 s, mêmes graines, appariés)

C401 : commit `6f47e27`, graines 1-40, 6 h. Référence : mêmes graines extraites de C000 (dt 0,5).

| profil | KPI | dt 0,5 moy. | dt 0,1 moy. | Δ | Δ en % de valeur ou relatif | z apparié | corr. de rang entre graines |
|---|---|---|---|---|---|---|---|
| experimente | log10Value | 8.259 | 8.255 | -0.004 | -0.9 % | -0.7 | 0.16 |
| experimente | gen | 168.4 | 168.3 | -0.150 | -0.1 % | -0.3 | 0.32 |
| experimente | legacyTotal | 2197 | 2194 | -3.575 | -0.2 % | -0.3 | 0.15 |
| experimente | echoShare | 0.929 | 0.928 | -0.001 | -0.1 % | -1.2 | 0.09 |
| experimente | harmonyAvg | 0.980 | 0.982 | 0.002 | 0.2 % | 5.5 | 0.03 |
| experimente | harmonyMin | 0.718 | 0.737 | 0.018 | 2.6 % | 11.0 | 0.63 |
| experimente | traitCombos60 | 34.3 | 32.0 | -2.250 | -6.6 % | -2.2 | 0.14 |
| experimente | epithetsFound | 0.000 | 0.000 | 0.000 | 0.0 % | 0.0 | — |
| mono-chasser | log10Value | 8.418 | 8.416 | -0.003 | -0.6 % | -0.5 | 0.20 |
| mono-chasser | gen | 176.7 | 175.8 | -0.850 | -0.5 % | -1.4 | 0.36 |
| mono-chasser | legacyTotal | 3339 | 3304 | -34.7 | -1.0 % | -2.8 | 0.33 |
| mono-chasser | echoShare | 0.864 | 0.866 | 0.003 | 0.3 % | 1.9 | 0.28 |
| mono-chasser | harmonyAvg | 0.973 | 0.978 | 0.005 | 0.5 % | 13.0 | -0.05 |
| mono-chasser | harmonyMin | 0.702 | 0.734 | 0.032 | 4.5 % | 12.3 | -0.09 |
| mono-chasser | traitCombos60 | 33.4 | 32.3 | -1.075 | -3.2 % | -1.2 | 0.14 |
| mono-chasser | epithetsFound | 1.000 | 1.000 | 0.000 | 0.0 % | 0.0 | — |
| mono-cultiver | log10Value | 8.767 | 8.787 | 0.021 | 4.9 % | 4.1 | 0.37 |
| mono-cultiver | gen | 175.1 | 173.4 | -1.675 | -1.0 % | -2.9 | 0.56 |
| mono-cultiver | legacyTotal | 4059 | 4037 | -21.8 | -0.5 % | -1.2 | 0.42 |
| mono-cultiver | echoShare | 0.875 | 0.880 | 0.005 | 0.6 % | 4.4 | 0.47 |
| mono-cultiver | harmonyAvg | 0.868 | 0.872 | 0.003 | 0.4 % | 1.8 | 0.22 |
| mono-cultiver | harmonyMin | 0.721 | 0.739 | 0.018 | 2.5 % | 6.5 | 0.43 |
| mono-cultiver | traitCombos60 | 31.2 | 32.0 | 0.800 | 2.6 % | 1.0 | 0.42 |
| mono-cultiver | epithetsFound | 1.000 | 1.000 | 0.000 | 0.0 % | 0.0 | — |
| optimiseur | log10Value | 8.595 | 8.521 | -0.074 | -15.7 % | -2.3 | -0.01 |
| optimiseur | gen | 154.6 | 154.5 | -0.075 | -0.0 % | -0.1 | 0.30 |
| optimiseur | legacyTotal | 3536 | 3403 | -133.0 | -3.8 % | -2.3 | 0.15 |
| optimiseur | echoShare | 0.859 | 0.857 | -0.002 | -0.2 % | -0.7 | -0.32 |
| optimiseur | harmonyAvg | 0.837 | 0.874 | 0.037 | 4.4 % | 3.3 | 0.26 |
| optimiseur | harmonyMin | 0.696 | 0.722 | 0.027 | 3.8 % | 6.1 | -0.05 |
| optimiseur | traitCombos60 | 15.7 | 14.3 | -1.400 | -8.9 % | -1.7 | 0.22 |
| optimiseur | epithetsFound | 0.975 | 0.975 | 0.000 | 0.0 % | 0.0 | -0.03 |

## 2. Stabilité selon l'horizon (C402, 12 h)

C402 : commit `6f47e27`, graines 1-50, dt 0.5. log10 de la valeur cumulée (moyenne), rang entre parenthèses.

| profil | 1 h | 2 h | 3 h | 6 h | 9 h | 12 h |
|---|---|---|---|---|---|---|
| mono-commercer | 6.44 (2) | 7.43 (3) | 7.95 (2) | 8.93 (1) | 9.40 (1) | 9.70 (1) |
| mono-cultiver | 6.32 (4) | 7.47 (1) | 8.03 (1) | 8.77 (2) | 9.18 (2) | 9.46 (2) |
| optimiseur | 6.60 (1) | 7.44 (2) | 7.91 (3) | 8.58 (3) | 8.98 (3) | 9.25 (3) |
| mono-chasser | 6.41 (3) | 7.39 (4) | 7.81 (4) | 8.42 (4) | 8.79 (4) | 9.03 (6) |
| experimente | 6.05 (6) | 7.03 (6) | 7.52 (5) | 8.26 (5) | 8.77 (5) | 9.17 (4) |
| debutant | 5.63 (8) | 6.45 (8) | 7.03 (7) | 8.22 (6) | 8.73 (6) | 9.06 (5) |
| mono-etudier | 6.19 (5) | 7.05 (5) | 7.47 (6) | 8.10 (7) | 8.48 (7) | 8.74 (7) |
| mono-mediter | 5.84 (7) | 6.56 (7) | 6.93 (8) | 7.51 (8) | 7.83 (8) | 8.08 (8) |
| occasionnel | — (9) | — (9) | — (9) | — (9) | 6.59 (9) | — (9) |

Corrélation de rang des profils : 3 h ↔ 6 h = 0.97 · 6 h ↔ 12 h = 0.95 · 3 h ↔ 12 h = 0.90.

| horizon | chasser / cultiver (valeur) | meilleure / pire vocation mono | gen experimente | legacyTotal experimente |
|---|---|---|---|---|
| 1 h | 124 % | ×4.0 | 40.3 | 214.2 |
| 2 h | 83 % | ×8.3 | 69.8 | 554.5 |
| 3 h | 60 % | ×12.5 | 96.2 | 933.6 |
| 6 h | 45 % | ×26.6 | 168.8 | 2203 |
| 9 h | 41 % | ×36.8 | 234.0 | 3695 |
| 12 h | 38 % | ×41.6 | 295.2 | 5339 |

| profil (12 h) | Chroniques achetées | surnoms distincts moy. | traitCombos60 | harmonyAvg | echoShare |
|---|---|---|---|---|---|
| debutant | 100 % | 5.02 | 49.8 | 0.923 | 0.938 |
| experimente | 100 % | 4.10 | 30.7 | 0.984 | 0.959 |
| mono-chasser | 100 % | 1.00 | 31.4 | 0.978 | 0.902 |
| mono-commercer | 100 % | 1.00 | 30.1 | 0.991 | 0.917 |
| mono-cultiver | 100 % | 1.00 | 31.1 | 0.823 | 0.911 |
| mono-etudier | 100 % | 1.00 | 30.4 | 0.998 | 0.897 |
| mono-mediter | 100 % | 1.00 | 29.2 | 0.999 | 0.891 |
| occasionnel | 0 % | 0.00 | 33.8 | 0.968 | 0.092 |
| optimiseur | 100 % | 1.00 | 16.0 | 0.796 | 0.898 |

## 3. Reproductibilité

C403 (commit `6f47e27`, graines 1-20, profils experimente, optimiseur) contre C000 (commit a53d1b5) : **40/40** parties identiques au bit près sur log10Value, gen, legacyTotal, echoShare, harmonyAvg, harmonyMin, traitCombos60 et la courbe horaire.

## 4. Convergence en graines (C000)

Demi-largeur de l'IC à 95 % de la moyenne, exprimée en % de valeur produite (10^(1,96·σ/√n) − 1).

| profil | σ log10 | n = 20 | n = 50 | n = 100 | n = 200 | graines pour ±2,5 % |
|---|---|---|---|---|---|---|
| debutant | 0.098 | 10.4 % | 6.4 % | 4.5 % | 3.2 % | 320 |
| experimente | 0.034 | 3.5 % | 2.2 % | 1.6 % | 1.1 % | 39 |
| mono-chasser | 0.029 | 3.0 % | 1.9 % | 1.3 % | 0.9 % | 29 |
| mono-commercer | 0.043 | 4.4 % | 2.8 % | 1.9 % | 1.4 % | 61 |
| mono-cultiver | 0.030 | 3.1 % | 2.0 % | 1.4 % | 1.0 % | 31 |
| mono-etudier | 0.076 | 8.0 % | 5.0 % | 3.5 % | 2.5 % | 194 |
| mono-mediter | 0.116 | 12.5 % | 7.7 % | 5.4 % | 3.8 % | 454 |
| occasionnel | 0.249 | 28.6 % | 17.2 % | 11.9 % | 8.3 % | 2074 |
| optimiseur | 0.106 | 11.3 % | 7.0 % | 4.9 % | 3.4 % | 375 |

