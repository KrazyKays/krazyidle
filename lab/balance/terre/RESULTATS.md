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

## 2. Consignes du héros : Semer, Équilibre, Battue

**Critères fixés avant mesure** (`consignes.ts` : héros seul ou héros + 4 Échos en Équilibre de même
puissance, puissance 1, 5 et 20, 600 s de Domaine, dt 0,1 ; mesure : Vivres produits par le héros, et par
tout le monde) :

- **K1** Équilibre est la meilleure consigne *fixe* : aucune consigne tenue 600 s ne la dépasse de plus de 3 %
  (production totale). Le réglage par défaut n'est jamais un piège, et la Battue n'est pas un « réglage à oublier ».
- **K2** Alterner paie : la meilleure rotation simple (Semer ↔ Battue ou Équilibre ↔ Battue, seuils sur le
  Gibier) bat Équilibre fixe de **+10 à +35 %** sur la production du héros seul, et d'au moins **+3 %** sur la
  production totale avec 4 Échos (la Battue abîme l'Harmonie de tous).
- **K3** La Battue tenue se paie : Battue fixe ≤ 85 % d'Équilibre fixe (production totale, 600 s).
- **K4** Pas sensible au pas : gain de la meilleure rotation à dt 0,5 à ±3 points de celui à dt 0,1.

**Mesure** [SIMULÉ] (`consignes.ts --grid`, 216 réglages × 41 stratégies × 6 régimes). Les réglages proches
de l'intuition (Semer ×0,5, Battue ×1,6) échouent : aucune rotation ne bat Équilibre (Semer coûte trop, la
Battue ne rapporte pas assez de plus), et à puissance 1 la Battue tenue reste rentable (le Gibier se refait
aussi vite qu'un héros faible le chasse) tant que son prélèvement est ×1 à ×2. Sept réglages passent K1 à K3 ;
retenu, au centre : **Semer** rendement ×0,7, pousse de la Flore ×3 ; **Battue** rendement ×3, prélèvement ×4.

| puissance | Échos | Semer fixe | Battue fixe | meilleure rotation | gain (tous) | gain (héros) |
|---|---|---|---|---|---|---|
| 1 | 0 | 0,74 | 0,13 | Équilibre ↔ Battue 0,5/0,8 | +31 % | +31 % |
| 5 | 0 | 0,75 | 0,09 | Équilibre ↔ Battue 0,5/0,8 | +21 % | +21 % |
| 20 | 0 | 0,75 | 0,09 | Équilibre ↔ Battue 0,5/0,8 | +17 % | +17 % |
| 1 | 4 | 0,97 | 0,67 | Équilibre ↔ Battue 0,5/0,8 | +12 % | +27 % |
| 5 | 4 | 0,97 | 0,61 | Semer ↔ Battue 0,5/0,8 | +9 % | +14 % |
| 20 | 4 | 0,98 | 0,58 | Semer ↔ Battue 0,7/0,8 | +6 % | +0 % |

K1 ✅ (Semer et Battue fixes ≤ 0,98) · K2 ✅ · K3 ✅ (Battue fixe ≤ 0,67) · K4 ✅ (dt 0,5 : mêmes gains à ±2 points).
Lecture pour le joueur : lancer la Battue quand le Gibier dépasse ~80 % de l'équilibre, l'arrêter vers 50 % ;
Semer paie surtout quand des Échos pèsent déjà sur le Domaine. Une Battue oubliée vide les hardes en quelques
secondes (rendement ÷10 au bout de 600 s) : c'est la contrepartie lisible, et le hors-ligne repasse en Équilibre.

### En partie complète (critères fixés avant la campagne T04-5-consignes)

Profils ajoutés : `consignes` (expérimenté + rotation Battue ≥ 0,8 / Équilibre < 0,5), `mono-consignes`
(mono-cultiver + même rotation), `mono-battue` (Battue tenue après 30 min). 200 graines × 6 h, dt 0,5 ;
contrôle 100 graines à dt 0,1.

- **P1** `consignes` produit de +3 à +25 % de valeur de plus qu'`experimente` (les Échos dominent la
  production en partie réelle : le gain du héros seul se dilue, sans disparaître).
- **P2** `mono-consignes` ≥ `mono-cultiver` +3 %.
- **P3** `mono-battue` < `mono-cultiver` (une Battue oubliée coûte).
- **P4** même sens de P1 et P2 à dt 0,1.
