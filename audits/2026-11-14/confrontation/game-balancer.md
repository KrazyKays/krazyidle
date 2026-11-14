# Confrontation — Game Balancer (B2, B3, B4, B5, B6, B8, B10)

Moteur : `src/` inchangé depuis `6f47e27`. Nouvelles mesures : C209–C212 (`lab/balance/run-phase2.sh`), toutes avec 2 processus et des surcharges en mémoire uniquement.

**Rectificatif à mon rapport.** C202 (avec événements) partait à minuit UTC, donc son premier objectif d'événement était au plancher (QA-03). Sa conclusion porte sur l'ordre des activités en production : celui-ci ne dépend pas des Éclats et reste valable. En revanche, je ne cite plus de chiffre d'événement tiré de C202 ; pour les événements, la référence est C002.

## B2. Alliances : trop tard, sans effet, ou les deux ?
**Je nuance : les deux, et en plus le mariage systématique est négatif à cause de la dot.**
- [SIMULÉ C209, mono-commercer, 40 graines appariées, 12 h, dt 0,5] mariage à chaque vie avec la maison la moins épousée (consanguinité minimale) :

| variante | Δ log10 à 6 h | Δ log10 à 12 h | Δ Héritage 12 h |
|---|---|---|---|
| Alliances achetées normalement (vers 3 h) + mariage | −0,046 ± 0,030 | −0,079 ± 0,029 | −0,9 % |
| Alliances offertes dès le départ, sans mariage | +0,011 | +0,012 | +0,5 % |
| Alliances offertes + mariage | −0,349 ± 0,123 | −0,380 ± 0,144 | −18 % |
| idem avec une dot fixe de 50 Or (en mémoire) | −0,003 ± 0,062 | −0,006 ± 0,041 | +2,8 % |

- Sans le coût de la dot, l'effet génétique d'un mariage est **nul** : Δ ≈ 0, bien en dessous de l'écart-type. Le don légendaire du conjoint ne pèse pas plus lourd que les mutations, Élu est déjà présent chez 80–86 % des ancêtres (BAL-08), et le trait Fertile ne vaut que ×1,07 (C204).
- La dot coûte 2 % de tout l'Or produit depuis le début, à chaque vie [CODE `alliances.ts`, `dowry`]. Elle vide le stock d'Or et rend le mariage **négatif**. Le Game Designer mesure la même chose indépendamment (C502 : ×0,54 à 12 h).
- **Conséquence** : ouvrir les Alliances plus tôt (GD-01) sans corriger leur valeur donne accès plus tôt à un système qui coûte. Je propose de traiter GD-01 et PBA-08 ensemble.
  - Le problème d'accès est un problème de pilier social (Élevée côté design). Le problème de valeur est d'équilibrage (Moyenne).
  - Correction minimale : calculer la dot sur l'Or **en stock** plutôt que sur l'Or produit depuis le début (par exemple 10 % du stock, 50 au minimum). [HYPOTHÈSE] Avec la dot fixe de 50 Or, le mariage revient à un effet neutre (mesuré ci-dessus).
  - Pour que le mariage ait un intérêt mesurable, il faudrait un bonus propre à l'union (par exemple vocation +1 à coup sûr pour une union de même métier, au lieu de 35 %). C'est à mesurer.

## B3. Destin du jour : stratégie dominante ?
**Je nuance. Définitions proposées :**
- « dominante universelle » : la même règle est optimale chaque jour ;
- « triviale par jour » : une seule décision suffit à approcher l'optimum.

**Les données :**
- [MESURÉ C206] **pas de dominante universelle.** La meilleure règle fixe « Cultiver → Commercer → Étudier » n'obtient que 65 % ± 22 du maximum (minimum 35 %). La meilleure activité constante change selon la date : Cultiver 5 jours, Méditer 4, Chasser 2, Étudier 2, Commercer 1.
- [MESURÉ C206] **mais le choix est souvent trivial.** La meilleure activité constante atteint en médiane 93 % du maximum trouvé, au moins 95 % sur 6 jours sur 14, et 100 % sur 4 jours (Méditer ×90 avec Brume). Le gain d'une stratégie à plusieurs bascules n'apparaît que les jours où Commercer ou Étudier sont boostés : 12/11, constante à 50 % du maximum ; 08/11 et 14/11, à 74–78 %. PBA-10 (« une touche, médiane ×1,000 ») et moi mesurons donc la même chose ; ma recherche, plus longue, trouve un peu plus de marge sur ces quelques jours.
- **Le vrai problème est la variance selon la date avec des paliers absolus.** Le maximum va de 314 à 853 selon les modificateurs du jour, si bien que l'Or n'est atteignable que 2 jours sur 14 (PBA : 7 % des jours).
- **Conséquence** : BAL-06 reste en priorité Moyenne. La correction prioritaire est de calculer les paliers par rapport au score de référence du jour. Le côté trivial relève du design (GD).

## B4. Le pas dt change-t-il une recommandation ?
**Je confirme : c'est un artefact du profil `optimiseur`, pas du moteur.**
- [MESURÉ QA-08] à actions identiques, la différence entre dt 0,5 et dt 0,1 reste sous ±0,2 %.
- [SIMULÉ C201] les profils à décision stable sont insensibles au pas : |Δlog10| ≤ 0,022 pour les profils mono-*, ≈ 0 pour `experimente`.
- Le comportement de l'optimiseur bascule parce que son choix glouton instantané (`actNetValue`) compare des facteurs écologiques qui changent à l'intérieur d'un pas, près des seuils d'Affût. C'est une bimodalité de la décision.
- [SIMULÉ C212] j'ai revalidé ma correction à dt 0,1 (30 graines, 6 h) : écart entre la meilleure et la pire activité **×6,0** (comme à dt 0,5), Δ dt ≤ 0,031, mono-cultiver devant mono-commercer sur 27/30 graines.
- **À revalider obligatoirement à dt 0,1 avant toute application** :
  1. toute conclusion sur Chasser, l'Affût ou l'Harmonie ;
  2. tout chiffre tiré de l'optimiseur ;
  3. toute correction qui change le point d'équilibre entre activités. fix1 est déjà validé.

## B5. Une vie plus longue est-elle meilleure ?
**Je confirme que les deux affirmations sont vraies en même temps. Les traits de durée de vie sont des pièges, et une correction minimale est mesurée.**
- [MESURÉ `analytic.md`] l'Écho d'une vie de 180 s a bien une puissance moyenne ×1,53 par rapport à une vie de 60 s, ce qui confirme le GDD.
- En contrepartie, le nombre de générations par heure baisse d'autant, et l'Héritage se gagne **par vie** (⌊∛(v/20)⌋).
- Bilan [SIMULÉ C204, 30 graines, 4 h, erreur type = é.-t./√30] :
  - Centenaire ×0,82 (t ≈ 5,9, net) ;
  - Longévité ×0,95 et Robuste ×0,94 (t ≈ 1,6 : tendance non significative, je corrige l'intensité de mon rapport) ;
  - Éternel : ×1,31 seulement, alors que sa part Écho seule (Écho vibrant) vaut ×1,55.
- **Correction minimale mesurée** [SIMULÉ C210] : multiplier l'Héritage d'une vie par sa durée / 60 (`legacyGain = ⌊∛(v/20) · dur/60⌋`). Résultat : Centenaire ×1,09, Longévité ×1,14, Éternel ×1,73, Robuste ×1,01. Les traits redeviennent positifs.
- Effet secondaire : l'Héritage total augmente pour tous, puisque Sève éternelle allonge toutes les vies. Il faut contrôler la Prospérité (élasticité 0,16–0,28) avec C000 et les garde-fous.
- BAL-04 reste en priorité Moyenne.

## B6. Le Domaine est-il décoratif ?
**Je confirme pour la partie principale, et je nuance pour le Destin du jour.**
- [SIMULÉ C203 / C204] dans la partie principale, aucune décision écologique ne paie :
  - pression écologique des Échos ±50 % : |Δ| ≤ 0,008 log10 ;
  - trait Harmonieux : −0,03 ;
  - [MESURÉ ROI] Garde forestier rentabilisé en plus de 85 000 s ;
  - [SIMULÉ C000] mono-cultiver, avec une Harmonie de 0,87, est la 2ᵉ stratégie, devant tous les profils « équilibrés ».
- Le pilier « l'optimum n'est pas le maximum » n'est donc **pas tenu**. Le bonus de bâtiment dépasse le malus d'Harmonie (×0,7 au pire).
- La bimodalité de l'Harmonie de l'optimiseur (DATA) vient du même artefact que B4 et ne prouve pas une décision du joueur.
- [MESURÉ C206] au Destin du jour, qui n'a pas de bâtiments, le Domaine compte : certains plans optimaux alternent Chasser et Cultiver pour gérer le Gibier (par exemple le 10/11 et le 13/11).
- **Conséquence** : BAL-05 reste en priorité Moyenne. Piste : élargir l'amplitude de l'Harmonie (×0,5 à ×1,5), à mesurer.

## B8. Bazar céleste et Bénédictions
**Je nuance PBA-15 : le Bazar est un levier réel, mais limité par la rareté des Éclats. Le bug QA-01 reste en priorité Élevée.**
- Avec des Éclats illimités, PBA mesure 8,31 contre 8,00 log10, soit **×2 de valeur** : ce n'est pas un effet nul.
- [SIMULÉ C204] la valeur dépend de la Bénédiction choisie : Élu porté en permanence vaut ×1,32 ; Éternel ×1,31 mais −25 % de générations ; après correction B5, Éternel monte à ×1,73.
- En pratique, le revenu en Éclats est presque nul [SIMULÉ C002 du Lead : aucun palier pour `experimente` en 6 h]. Le Bazar n'a donc pas d'effet aujourd'hui parce qu'il n'est pas alimenté, pas parce qu'il serait cosmétique.
- **Rôle à préserver** : c'est le seul débouché des récompenses d'événement, donc le lien entre la boucle sociale et la puissance. Il faut le garder comme levier modéré, plafonné à 2 Bénédictions, et ne pas le rendre cosmétique.
- **QA-01** : perte silencieuse de 3 à 15 ✦, soit plusieurs événements de revenu. C'est un bug fonctionnel visible, de probabilité Certaine. Je confirme la priorité **Élevée**, et sa correction doit passer avant toute hausse du revenu en Éclats.

## B10. « Le Vénérable » : correction et effets
**Je propose une correction en deux temps. La seule règle « au passage du rang X » ne suffit pas.**
- [SIMULÉ C211, 50 graines, 6 h, dt 0,5] Vénérable n'est plus accordé qu'à la vie qui **atteint** le rang X. Patch en mémoire : `vocTier` est rapporté à 9 pour les surnoms quand le héros était déjà au rang X ; la vocation réelle n'est pas touchée.

| profil | Δ log10 | surnoms distincts (base → correction) | surnom n°1 après correction |
|---|---|---|---|
| mono-cultiver | −0,010 ± 0,003 | 1,0 → 2,6 | le Constant 92 % |
| mono-commercer | −0,013 ± 0,005 | 1,0 → 2,0 | le Négociant 96 % |
| mono-chasser | −0,001 ± 0,014 | 1,0 → 2,3 | le Juste 91 % |

- Le coût en puissance est négligeable (au plus −0,013 log10, soit −3 %). Le monopole, lui, **se déplace** vers le surnom suivant par rareté, parce que `pickEpithet` est déterministe (le plus rare gagne, puis le premier de la liste) et que les vies d'une lignée spécialisée se ressemblent toutes.
- **Correction recommandée** :
  1. (a) la règle du passage au rang X ;
  2. (b) [HYPOTHÈSE, à mesurer] ne pas redonner le surnom du parent : choisir le plus rare parmi ceux que l'ancêtre direct n'a pas portés, ou tirer au sort parmi les surnoms éligibles de rareté maximale avec la graine de la succession.
- Garde-fou proposé, à chiffrer par Data : aucun surnom au-dessus de 60 % des vies surnommées, et au moins 3 surnoms distincts par partie mono en 6 h. La correction (a) seule ne passe pas ce garde-fou : 91–96 % pour le surnom n°1.
- Note de méthode : la colonne « vies surnommées » de `venerable.md` compte à partir du premier surnom attribué. Elle vaut donc 100 % par construction et ne doit pas servir de part de vies surnommées.

## Fichiers
`lab/balance/marriage.ts`, `venerable.ts`, `run-phase2.sh`, `traits.ts` (options `--only` et `--out`) ; résultats `lab/balance/results/marriage.md`, `marriage-dot50.md`, `traits-heritagexduree.md`, `venerable.md`, `fix1-dt01.md` ; lignes C209–C212 dans `CAMPAIGNS.md`.
