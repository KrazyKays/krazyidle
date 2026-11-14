## A. Rendement des activités (valeur/s) — runActivity, data.ts:29-55, sim.ts:19-62

Production brute = prodMult × puissance × coef ; consommation = coef_conso × √puissance (la consommation **ne suit pas** prodMult : bâtiments, Prospérité, Harmonie, événements).

| activité | valeur brute / unité de puissance | conso. (valeur) × √p | facteur écologique | seuil de rentabilité (M=1) |
|---|---|---|---|---|
| cultiver | 1.20 | 0.0 | Flore/62,5 ∈ [0,2 ; 1,6] | — |
| chasser | 2.00 | 0.0 | Gibier/29 ∈ [0,05 ; 2,2] × vigueur [0,55 ; 1,13] | — |
| commercer | 3.00 | 3.0 | 1 | p > 1.00 |
| etudier | 4.80 | 4.0 | 1 | p > 0.69 |
| mediter | 1.20 | 0.0 | 1 | — |

Valeur nette par seconde selon la puissance p et le multiplicateur de production M (facteur écologique = 1) :

| activité | M=1 p=1 | M=1 p=3 | M=1 p=10 | M=1 p=100 | M=1 p=1000 | M=10 p=1 | M=10 p=3 | M=10 p=10 | M=10 p=100 | M=10 p=1000 | M=100 p=1 | M=100 p=3 | M=100 p=10 | M=100 p=100 | M=100 p=1000 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| cultiver | 1.2 | 3.6 | 12.0 | 120.0 | 1200.0 | 12.0 | 36.0 | 120.0 | 1200.0 | 12000.0 | 120.0 | 360.0 | 1200.0 | 12000.0 | 120000.0 |
| chasser | 2.0 | 6.0 | 20.0 | 200.0 | 2000.0 | 20.0 | 60.0 | 200.0 | 2000.0 | 20000.0 | 200.0 | 600.0 | 2000.0 | 20000.0 | 200000.0 |
| commercer | 0.0 | 3.8 | 20.5 | 270.0 | 2905.1 | 27.0 | 84.8 | 290.5 | 2970.0 | 29905.1 | 297.0 | 894.8 | 2990.5 | 29970.0 | 299905.1 |
| etudier | 0.8 | 7.5 | 35.4 | 440.0 | 4673.5 | 44.0 | 137.1 | 467.4 | 4760.0 | 47873.5 | 476.0 | 1433.1 | 4787.4 | 47960.0 | 479873.5 |
| mediter | 1.2 | 3.6 | 12.0 | 120.0 | 1200.0 | 12.0 | 36.0 | 120.0 | 1200.0 | 12000.0 | 120.0 | 360.0 | 1200.0 | 12000.0 | 120000.0 |

Part de la consommation dans la valeur brute (conso / brut) :

| activité | M=1 p=1 | M=1 p=3 | M=1 p=10 | M=1 p=100 | M=1 p=1000 | M=10 p=1 | M=10 p=3 | M=10 p=10 | M=10 p=100 | M=10 p=1000 | M=100 p=1 | M=100 p=3 | M=100 p=10 | M=100 p=100 | M=100 p=1000 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| commercer | 100.0 % | 57.7 % | 31.6 % | 10.0 % | 3.2 % | 10.0 % | 5.8 % | 3.2 % | 1.0 % | 0.3 % | 1.0 % | 0.6 % | 0.3 % | 0.1 % | 0.0 % |
| etudier | 83.3 % | 48.1 % | 26.4 % | 8.3 % | 2.6 % | 8.3 % | 4.8 % | 2.6 % | 0.8 % | 0.3 % | 0.8 % | 0.5 % | 0.3 % | 0.1 % | 0.0 % |

## B. Courbe de compétence (xpToNext = 5·1,3^n, skillMult = 1 + 0,25n + 0,01n²) — data.ts:66-67

| durée de vie (s) | xp ×1 : niveau final · skillMult moyen | xp ×1,25 (Curieux) | xp ×1,6 (Génie) | xp ×2,24 (Élu+Génie… ×1,4×1,6) | départ niv. 5 (Éveil max) |
|---|---|---|---|---|---|
| 60 | 5 · 1.90 | 6 · 2.08 | 7 · 2.28 | 8 · 2.60 | 7 · 2.86 |
| 90 | 7 · 2.22 | 7 · 2.42 | 8 · 2.67 | 9 · 3.03 | 8 · 3.06 |
| 120 | 8 · 2.48 | 8 · 2.71 | 9 · 2.98 | 10 · 3.38 | 9 · 3.22 |
| 180 | 9 · 2.91 | 10 · 3.16 | 11 · 3.47 | 12 · 3.93 | 10 · 3.53 |
| 240 | 10 · 3.25 | 11 · 3.53 | 12 · 3.86 | 13 · 4.35 | 11 · 3.78 |

Moyenne de puissance d'une vie de 180 s vs 60 s (xp ×1, départ 0) : ×1.53 (GDD 2.2 annonce ≈ +50 %).
Niveau atteint ≈ log(1 + 0,06·t·xp)/log(1,3) : le niveau ne croît que logarithmiquement avec le temps et l'XP.

## C. Bâtiments : coût et gain marginal (bMult = (1 + 0,25·niv)·2^⌊niv/10⌋) — data.ts:165-182, game.ts:525-529

| bâtiment | coût niv. 0 (valeur) | croissance | coût niv. 10 | coût niv. 20 | gain du niv. 9→10 | gain 10→11 | gain 19→20 | gain 29→30 | Δcoût/Δlog(mult) moyen 0→30 |
|---|---|---|---|---|---|---|---|---|---|
| champs | 25 | 1.9 | 1.53e+4 | 9.40e+6 | ×2.154 | ×1.071 | ×2.087 | ×2.061 | exposant coût : mult ∝ coût^0.219 |
| pavillon | 50 | 1.9 | 3.07e+4 | 1.88e+7 | ×2.154 | ×1.071 | ×2.087 | ×2.061 | exposant coût : mult ∝ coût^0.219 |
| comptoir | 60 | 2 | 6.14e+4 | 6.29e+7 | ×2.154 | ×1.071 | ×2.087 | ×2.061 | exposant coût : mult ∝ coût^0.203 |
| bibliotheque | 200 | 2.1 | 3.34e+5 | 5.56e+8 | ×2.154 | ×1.071 | ×2.087 | ×2.061 | exposant coût : mult ∝ coût^0.190 |
| sanctuaire | 260 | 2.2 | 6.91e+5 | 1.83e+9 | ×2.154 | ×1.071 | ×2.087 | ×2.061 | exposant coût : mult ∝ coût^0.178 |

Le niveau 10 (et 20, 30) double le multiplicateur d'un coup (×2,15 puis ×2,09) alors que les niveaux voisins rapportent ×1,07–1,03 : marches d'escalier très marquées.

## D. Héritage : legacyFor = ⌊∛(v/20)⌋ (game.ts:115) et coûts (data.ts:197-211)

| valeur de la vie v | 1e2 | 1e3 | 1e4 | 1e5 | 1e6 | 1e7 | 1e8 |
|---|---|---|---|---|---|---|---|
| ⚜️ gagnés | 1 | 3 | 7 | 17 | 36 | 79 | 170 |

Multiplier la valeur d'une vie par 10 n'apporte que ×2,15 d'Héritage ; ×1000 pour ×10.

| amélioration | base | croissance | max | coût total jusqu'au max (ou 15 niv.) | coût du niv. 10 |
|---|---|---|---|---|---|
| prosperite | 3 | 1.45 | ∞ | 1757 | 124 |
| longevite | 4 | 1.65 | 12 | 2504 | 599 |
| memoire | 5 | 1.55 | ∞ | 6509 | 401 |
| crypte | 12 | 2.6 | 6 | 2312 | — |
| eveil | 10 | 2.2 | 6 | 939 | — |
| transmission | 6 | 1.9 | 5 | 161 | — |
| sang | 9 | 2.8 | 3 | 106 | — |
| etoile | 8 | 2.1 | 5 | 292 | — |
| patience | 5 | 1.8 | 9 | 1238 | — |
| alliances | 90 | 1 | 1 | 90 | — |
| chroniques | 160 | 1 | 1 | 160 | — |

Prospérité (×1,12 par niveau sur TOUTE la production, Échos compris) : coût ×1,45 par niveau. Mémoire du sang (+15 % additif sur la puissance des Échos, soit ×(1+0,15(n+1))/(1+0,15n), décroissant) : coût ×1,55.

| niveau n | coût Prospérité | gain Prospérité | coût Mémoire | gain Mémoire | gain par ⚜️ Prospérité | gain par ⚜️ Mémoire |
|---|---|---|---|---|---|---|
| 0 | 3 | ×1,12 | 5 | ×1.150 | 37.78 ‰ log/⚜️ | 27.95 ‰ log/⚜️ |
| 2 | 7 | ×1,12 | 13 | ×1.115 | 16.19 ‰ log/⚜️ | 8.40 ‰ log/⚜️ |
| 5 | 20 | ×1,12 | 45 | ×1.086 | 5.67 ‰ log/⚜️ | 1.83 ‰ log/⚜️ |
| 8 | 59 | ×1,12 | 167 | ×1.068 | 1.92 ‰ log/⚜️ | 0.39 ‰ log/⚜️ |
| 10 | 124 | ×1,12 | 401 | ×1.060 | 0.91 ‰ log/⚜️ | 0.15 ‰ log/⚜️ |
| 12 | 260 | ×1,12 | 962 | ×1.054 | 0.44 ‰ log/⚜️ | 0.05 ‰ log/⚜️ |
| 14 | 545 | ×1,12 | 2311 | ×1.048 | 0.21 ‰ log/⚜️ | 0.02 ‰ log/⚜️ |

## E. Génétique (Monte-Carlo sur genHeirs réel, game.ts:399-462)

### E1. Mutations par héritier selon Bonne étoile (formule game.ts:435-441)

| Bonne étoile | mutations/héritier | P(Commun) | P(Rare) | P(Épique) | P(Légendaire) | P(≥1 Légendaire / succession, 3 héritiers) | idem 6 héritiers |
|---|---|---|---|---|---|---|---|
| 0 | 1.10 | 0.60 | 0.28 | 0.10 | 0.020 | 0.064 | 0.125 |
| 1 | 1.14 | 0.54 | 0.30 | 0.13 | 0.030 | 0.099 | 0.188 |
| 3 | 1.22 | 0.42 | 0.34 | 0.19 | 0.050 | 0.171 | 0.313 |
| 5 | 1.30 | 0.30 | 0.38 | 0.25 | 0.070 | 0.246 | 0.432 |

### E2. Survie d'un trait sélectionné (le joueur choisit toujours un héritier qui le porte)

Lignée simulée : le parent porte le trait ; à chaque succession on garde, s'il existe, un héritier qui le porte (sinon la lignée le perd). 2 000 lignées × 200 générations, sans conjoint ni Bénédiction.

| trait | Sang fécond (héritiers) | Transmission | P(perte) / génération (régime usé) | générations médianes avant perte | P(encore là après 100 gén.) |
|---|---|---|---|---|---|
| elu | 3 | +0 % | 0.500 | 4 | 0.0 % |
| elu | 6 | +40 % | 0.094 | 15 | 0.1 % |
| sang_dore | 3 | +0 % | 0.235 | 5 | 0.0 % |
| sang_dore | 6 | +40 % | 0.055 | 19 | 0.4 % |
| main_verte | 3 | +0 % | 0.252 | 4 | 0.0 % |
| main_verte | 6 | +40 % | 0.030 | 28 | 6.6 % |

VOCATION_BONUS = 0.2 par rang (rang X : ×3.00). Trait Élu : Production +60%, expérience +40%.
