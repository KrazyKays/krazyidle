# TERRE — Récolter (fusion Cultiver + Chasser) et consignes (0.4)

Discussion de design du 2026-11-22 avec le propriétaire : plus de Prédateurs, plus d'Affût ni de trophées,
Paysan et Chasseur fusionnés en un métier (Récolter) qui garde la nuance champs / chasse selon le Domaine,
et trois consignes pour le héros (Semer, Équilibre, Battue) ; les Échos restent en Équilibre.

## 1. Règle de partage champs / chasse (Équilibre)

Critère fixé avant mesure : Harmonie à ±0,05 et rendement à ±10 % de l'ancien Cultiver, sur cinq régimes
de pression (1 héros ×1 ; 4 et 8 acteurs ×100 ; 8 acteurs ×10⁴ et ×10⁶), 10 min de Domaine seul, dt 0,1
(`partage.ts`, `probe2-old` sur l'ancien moteur). [SIMULÉ]

| Règle (h = part de chasse, g = G/G_éq, f = F/F_éq) | Harmonie (5 régimes) | Rendement / puissance |
|---|---|---|
| ancien Cultiver (référence) | 1,30 · 1,19 · 1,07 · 0,94 · 0,86 | 1,61 · 6,94 · 13,90 · 13,78 · 13,21 |
| A : g / (f + g) | 1,29 · 1,07 · 0,95 · 0,86 · 0,80 | 1,55 · 6,58 · 12,51 · 11,71 · 11,17 |
| B : ½·g² | 1,29 · 1,15 · 1,06 · 0,97 · 0,91 | 1,57 · 7,24 · 14,56 · 13,62 · 13,01 |
| C : g − ½ | 1,29 · 1,18 · 1,11 · 1,03 · 0,98 | 1,57 · 7,42 · 15,43 · 14,73 · 14,18 |
| D : ½ + 1,5·(g − 1) | 1,29 · 1,21 · 1,15 · 1,08 · 1,03 | 1,58 · 7,67 · 16,40 · 15,69 · 15,09 |
| E : ½ + (g − 1) + ½·(f − 1) | 1,29 · 1,03 · 0,82 · 0,70 · 0,70 | 1,56 · 6,30 · 10,43 · 8,95 · 9,15 |

B remplissait le critère en mémoire, mais pas en partie réelle : la sonde isolée sous-estime la pression
(Garde forestier, vies successives, Échos variés). En campagne (200 graines × 6 h, dt 0,5, contre T04-3b) :

| Règle | Valeur (exp. / opti. / débutant) | Harmonie optimiseur · débutant · mono-cultiver |
|---|---|---|
| A (T04-4a) | +11 % / −12 % / −8 % | 0,61 · 0,82 · 0,68 |
| B (T04-4b) | +12 % / +7 % / −1 % | 0,75 · 0,88 · 0,79 |
| C (T04-4C) | +13 % / +11 % / 0 % | 0,79 · 0,90 · 0,82 |
| **D (T04-4D, retenue)** | **+13 % / +18 % / +3 %** | **0,85 · 0,93 · 0,87** |
| référence T04-3b | — | 0,89 · 0,96 · 0,91 |

Pourquoi l'Harmonie baisse quand même : l'ancien Cultiver laissait monter la Flore *et* le Gibier
(F 77 / G 41 en fin de partie mono-cultiver), Récolter chasse et maintient le Gibier vers l'équilibre
pendant que les champs poussent la Flore (D : écarts plus déséquilibrés). Contre la référence 0.3
(T04-ref), D ne laisse aucun rouge d'Harmonie (TERRE-2b avait amélioré le Domaine).
