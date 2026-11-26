Garde-fous : référence V071-ref-avec (10a0465, graines 1-200) → candidat V072-crypte3-avec (87cb59b, graines 1-200)

| niveau | profil | KPI | règle | réf. | cand. | z | pourquoi |
|---|---|---|---|---|---|---|---|
| VERT | experimente | anomalies | p90 ∈ [−∞ ; 0] | 0.000 | 0.000 | — | Robustesse : 0 NaN/Infinity/négatif (max sur toutes les parties). |
| VERT | optimiseur | anomalies | p90 ∈ [−∞ ; 0] | 0.000 | 0.000 | — | Robustesse : 0 NaN/Infinity/négatif (max sur toutes les parties). |
| VERT | occasionnel | anomalies | p90 ∈ [−∞ ; 0] | 0.000 | 0.000 | — | Robustesse : 0 NaN/Infinity/négatif (max sur toutes les parties). |
| VERT | experimente | log10Value | Δ down ≤ 0.0414 | 7.323 | 7.344 | 18.7 | Perte de plus de 10 % de valeur produite. |
| VERT | optimiseur | log10Value | Δ down ≤ 0.0414 | 8.054 | 8.088 | 14.6 | Perte de plus de 10 % de valeur produite. |
| VERT | occasionnel | log10Value | Δ down ≤ 0.0414 | 5.652 | 5.652 | 0.0 | Perte de plus de 10 % de valeur produite. |
| VERT | experimente | log10Value | Δ up ≤ 0.301 | 7.323 | 7.344 | 18.7 | Inflation : valeur ×2 en 6 h (les coûts ×1,9–2,4 ne suivent plus). |
| VERT | optimiseur | log10Value | Δ up ≤ 0.301 | 8.054 | 8.088 | 14.6 | Inflation : valeur ×2 en 6 h (les coûts ×1,9–2,4 ne suivent plus). |
| VERT | occasionnel | log10Value | Δ up ≤ 0.301 | 5.652 | 5.652 | 0.0 | Inflation : valeur ×2 en 6 h (les coûts ×1,9–2,4 ne suivent plus). |
| VERT | experimente | gen | Δ both ≤ 5 % | 163 | 163 | 1.2 | Tempo dynastique : ±5 % de générations. |
| VERT | optimiseur | gen | Δ both ≤ 5 % | 162 | 162 | 0.1 | Tempo dynastique : ±5 % de générations. |
| VERT | occasionnel | gen | Δ both ≤ 5 % | 28.11 | 28.11 | 0.0 | Tempo dynastique : ±5 % de générations. |
| VERT | experimente | legacyTotal | Δ both ≤ 15 % | 2112 | 2108 | -2.9 | Boucle longue : ±15 % d'Héritage. |
| VERT | optimiseur | legacyTotal | Δ both ≤ 15 % | 4142 | 4140 | -0.3 | Boucle longue : ±15 % d'Héritage. |
| VERT | occasionnel | legacyTotal | Δ both ≤ 15 % | 132 | 132 | 0.0 | Boucle longue : ±15 % d'Héritage. |
| VERT | experimente | echoShare | moy. ∈ [0.3 ; 0.6] | 0.4646 | 0.4956 | — | Pilier 1 (0.7, vie active) : le héros vivant fait 40 à 70 % de la production en ligne, les Échos le reste (profils en continu uniquement). |
| VERT | optimiseur | echoShare | moy. ∈ [0.3 ; 0.6] | 0.4219 | 0.4681 | — | Pilier 1 (0.7, vie active) : le héros vivant fait 40 à 70 % de la production en ligne, les Échos le reste (profils en continu uniquement). |
| ROUGE | experimente | echoShare | Δ both ≤ 0.0300 | 0.4646 | 0.4956 | 30.5 | Part des Échos : ±3 points. |
| ROUGE | optimiseur | echoShare | Δ both ≤ 0.0300 | 0.4219 | 0.4681 | 22.1 | Part des Échos : ±3 points. |
| VERT | experimente | traitCombos60 | moy. ∈ [20 ; +∞] | 40.31 | 40.76 | — | Budget génétique (GDD 2.3 : 27–30 à 8 h) : pas de retour à 2–5 combinaisons. |
| VERT | experimente | traitCombos60 | Δ down ≤ 20 % | 40.31 | 40.76 | 1.6 | Diversité génétique : −20 %. |
| VERT | optimiseur | traitCombos60 | Δ down ≤ 20 % | 32.44 | 32.00 | -1.0 | Diversité génétique : −20 %. |
| VERT | experimente | unlock.commercer | p90 ∈ [−∞ ; 60] | 16.50 | 16.50 | — | Commercer en moins d'1 min (p90). |
| VERT | experimente | unlock.etudier | p90 ∈ [−∞ ; 180] | 39.50 | 39.50 | — | Étudier en moins de 3 min (p90) pour le joueur de référence. |
| DETTE | experimente | unlock.mediter | p90 ∈ [−∞ ; 300] | 357 | 357 | — | Méditer en moins de 5 min (p90). |
| VERT | experimente | upgradeAt.alliances | mean ∈ [3600 ; 18000] | 8588 | 8588 | — | Alliances (90 ⚜️) atteintes entre 1 h et 5 h. |
| VERT | experimente | has.chroniques | moy. ∈ [0.9 ; +∞] | 1.000 | 1.000 | — | Chroniques (160 ⚜️) achetées dans 90 % des parties de 6 h d'un joueur compétent. |
| VERT | optimiseur | has.chroniques | moy. ∈ [0.9 ; +∞] | 1.000 | 1.000 | — | Chroniques (160 ⚜️) achetées dans 90 % des parties de 6 h d'un joueur compétent. |
| VERT | experimente | epithetLivesShare | moy. ∈ [0.3 ; 0.7] | 0.3070 | 0.3033 | — | GDD 2.6 : ~50 % des vies surnommées après l'achat de Chroniques. |
| DETTE | optimiseur | epithetLivesShare | moy. ∈ [0.3 ; 0.7] | 0.8719 | 0.8694 | — | GDD 2.6 : ~50 % des vies surnommées après l'achat de Chroniques. |
| VERT | optimiseur | epithetsFound | moy. ∈ [3 ; +∞] | 5.870 | 5.910 | — | Au moins 3 surnoms distincts en 6 h quand Chroniques est acquis (34 au catalogue en 0.4). |

VERT 27 · ORANGE 0 · ROUGE 2 · DETTE 2 · n/a 0
