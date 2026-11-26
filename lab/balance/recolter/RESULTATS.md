# Chantier Récolter — mesures en mémoire (2026-11-26)

Critères fixés avant : `lab/design/CHANTIER-recolter.md` § 3. Outil : `lab/balance/vie-active/mesure.ts` (7 profils × 40 graines × 6 h,
dt 0,5), surcharges `BAL_OBJ` / `BAL_PATCH` (le jeu n'est pas modifié). Tableaux : `RC-*.md`. [SIMULÉ]

| variante | optimiseur ⚜️ (Récolter) | mono-Récolter | mono-Commercer | mono-Étudier | mono-Méditer | RC1 | RC2 (écart) | RC3 |
|---|---|---|---|---|---|---|---|---|
| référence 0.8 | 4 148 (100 %) | 4 003 | 3 307 | 2 550 | 3 201 | ✗ | ✗ (+25 %) | — |
| R-A Récolter −15 % | 3 781 (95 %) | 3 733 | 3 269 | 2 551 | 3 216 | ✗ | ✗ (+16 %) | ✓ (pire : optimiseur −9 %) |
| R-B1 Prospérité ≥ 5 exige ✨ | 3 176 (100 %) | 3 687 | 3 091 | 2 437 | 3 201 | ✗ | ✗ (+19 %) | ✗ (optimiseur −23 %) |
| R-B2 Prospérité ≥ 3 exige ✨ | 2 876 (100 %) | 3 178 | 2 704 | 2 152 | 3 208 | ✗ | ✗ (+17 %) | ✗ (optimiseur −31 %, Commercer −18 %, Étudier −16 %) |

**Aucune piste ne tient les trois critères.** Ce que les mesures apprennent :
1. **R-B frappe tout le monde sauf le Mystique.** Les profils ne s'adaptent pas : ils cessent d'acheter Prospérité (niveau 14 → 3 à 9)
   au lieu de produire de l'Essence. RC1 est donc invérifiable avec les profils actuels : il faut d'abord un profil qui **planifie**
   (garde un Écho mystique, médite quelques secondes par vie), sans quoi on mesure un joueur qui ignore la règle.
2. **R-A est la seule piste sans rouge, mais elle ne suffit pas** : −15 % de rendement ne retire que 7 % d'Héritage (racine cubique) ;
   atteindre RC2 demanderait environ −30 %, ce qui reviendrait à punir Récolter au lieu de rendre les autres métiers utiles.
3. Le Compagnonnage (0.8) est déjà un levier : un Paysan qui forme l'Agronome ou le Rebouteux gagne +8 à +9 % (C5) et doit pour cela
   pratiquer un autre métier. Son effet sur la domination de Récolter n'est pas encore mesuré avec un profil qui le vise de lui-même.

**Recommandation (à trancher par le propriétaire)** : ne rien changer au jeu pour l'instant. Prochaine étape : écrire un profil qui
planifie ses besoins en Essence et vise un compagnonnage, puis remesurer R-B1 (le plus doux) avec lui.
