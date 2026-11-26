# Chantier — Récolter, vocation AFK et dominante (ouvert le 2026-11-26)

> Statut : **ouvert, rien n'est modifié dans le jeu.** Origine : discussion de design sur le Compagnonnage
> (`lab/design/BACKLOG-compagnonnage.md`, `lab/balance/etudier/RESULTATS.md` E1, `lab/balance/compagnonnage/RESULTATS.md`).

## 1. Constat [SIMULÉ, 0.7 / 0.8]

- **Récolter domine** : mono-Récolter 4 026 ⚜️ à 6 h, contre 3 311 (Commercer), 3 363 (Érudit bien joué), 3 214 (Méditer) : +22 %.
- **Récolter est la vocation AFK** : aucun changement d'activité n'est nécessaire (rien à consommer). L'Érudit, lui, s'effondre
  sans changer d'activité (−91 %). Le jeu récompense donc le joueur le moins actif, à l'inverse de son intention (« vie active »).
- **Rien n'oblige à diversifier** : l'optimiseur joue Récolter 100 % du temps, n'achète que les Champs, ne produit ni Or ni Essence,
  et achète pourtant toutes les améliorations d'Héritage (payées en ⚜️). L'Essence ne sert qu'au Sanctuaire et à la Clepsydre [CODE].
- Principe du propriétaire : « le joueur aura toujours besoin de Vivres pour commercer et d'Essence pour les améliorations ».
  Il est vrai pour Commercer et Étudier, **faux pour Récolter** aujourd'hui.

## 2. Pistes

- **R-A — rendement de Récolter** abaissé (−15 %) : simple, mais ne crée aucun besoin d'autres ressources.
- **R-B — Prospérité exige de l'Essence** au-delà d'un niveau (en plus des ⚜️) : la grande amélioration de production demande de
  méditer ; un joueur Récolter doit produire de l'Essence (ou garder un Écho mystique). Rend vrai le principe du propriétaire.
  Deux réglages mesurés : B1 (dès le niveau 5 : 2 ✨ × 1,6^(niv − 5)), B2 (dès le niveau 3 : 5 ✨ × 1,8^(niv − 3)).
- Non mesurées : Sève éternelle exigeant de l'Or ; Champs exigeant de l'Or au-delà d'un niveau ; Récolter qui épuise un stock de terre
  (proche du Domaine retiré en 0.5 : écarté d'office).

## 3. Critères fixés AVANT les mesures (`lab/balance/recolter/RESULTATS.md`)

- **RC1** : l'optimiseur ne passe plus que ≤ 80 % de sa vie à Récolter (100 % aujourd'hui).
- **RC2** : écart mono-Récolter / médiane des trois autres mono-vocations ≤ +10 % d'Héritage (+22 % aujourd'hui).
- **RC3** : aucun profil ne perd plus de 15 % d'Héritage (seuil rouge de `sim:guard`).

## 4. Résultats et recommandation

Voir `lab/balance/recolter/RESULTATS.md`. Aucune piste ne tient les trois critères [SIMULÉ] : R-A (Récolter −15 %) est la seule
sans rouge mais laisse +16 % d'écart ; R-B (Prospérité exige de l'Essence) frappe tous les profils sauf le Mystique, car les profils
ne s'adaptent pas. **Recommandation : ne rien changer au jeu ; écrire d'abord un profil qui planifie son Essence et vise un
compagnonnage, puis remesurer R-B1.** À trancher par le propriétaire.
