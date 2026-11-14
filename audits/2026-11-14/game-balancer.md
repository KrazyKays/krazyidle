# Audit phase 1 — Game Balancer

Date : 2026-11-14 · Commit moteur : `6f47e27` (aucune différence sur `src/` et `lab/sim/` jusqu'à `10324b4` ; `src/` identique à `a53d1b5`, commit des références C000/C001) · Auteur : game-balancer.

## 1. Résumé et verdict

- **Une stratégie domine** : faire Commercer toute sa vie (`mono-commercer`) est le meilleur profil sur **198/200** graines sans événements, **200/200** avec, et **50/50** à dt 0,1. Méditer produit **×0,04** de Commercer : c'est une activité morte en production.
- La cause est structurelle : la consommation des convertisseurs croît en √puissance et **ignore les multiplicateurs** (bâtiments, Prospérité, Harmonie). Après la première heure, elle pèse moins de 1 % de la production. La chaîne Vivres → Or → Savoir est donc décorative, et c'est le coefficient brut de chaque activité qui décide.
- Plusieurs leviers sont **morts ou contre-productifs** : allonger la vie (traits, Sève éternelle, Clepsydre) réduit la valeur produite ; la pression écologique et le Garde forestier n'ont pas d'effet mesurable.
- Le Destin du jour contredit le GDD : le meilleur score trouvé est de 314 à 853 selon la date (moyenne 506). Le palier Or n'est atteint que 2 jours sur 14, et la meilleure action est souvent une seule activité tenue 90 s.
- Points sains : la progression n'explose pas et ne bute sur aucun mur sur 24 h, les conclusions ne dépendent pas de dt, et aucune anomalie numérique n'a été vue.

**Verdict : déséquilibré mais réparable par les chiffres.** Une première correction mesurée (C207) ramène l'écart entre activités de ×26,6 à ×6,0.

## 2. Périmètre et méthode

**Exécuté** (toutes les commandes en annexe, `node --import ./lab/balance/register.mjs …`) :
1. **Modèle analytique** (`analytic.ts` → `results/analytic.md`) : rendement de chaque activité selon la puissance et le multiplicateur, courbes XP et compétence, coûts et gains marginaux des bâtiments, ⌊∛(v/20)⌋, coûts d'Héritage, Monte-Carlo de `genHeirs` (mutations, survie d'un trait).
2. **Références réutilisées** : C000 et C001 (`analyze-refs.ts`, comparaison appariée par graine).
3. **Campagnes `npm run sim`** : C201 (dt 0,1) et C202 (activités mono avec événements), toutes deux avec `--workers=2`.
4. **Runner instrumenté** `lib.ts/runBal` : copie fidèle de `lab/sim/runner.ts`, validée à l'identique sur les graines 1-2 (log10Value, gen et Héritage identiques à C000). Il mesure en plus la **valeur nette** (Σ Δressources × valeur par tick, consommation déduite).
5. **Sensibilité** (C203) : 23 paramètres × {0,5 ; 0,75 ; 1,25 ; 1,5}, 30 graines appariées, 4 h, profils `experimente` et `mono-commercer`.
   - Surcharges **en mémoire** : objets exportés modifiés au démarrage (`BAL_OBJ`), ou littéraux réécrits au chargement par un chargeur Node (`patch-loader.mjs`, `BAL_PATCH`, motif unique vérifié par `--check`).
   - Aucun fichier du jeu n'a été écrit. Pour un facteur de croissance x, la variation porte sur (x − 1).
6. **Valeur des traits** (C204) : contrefactuel « la lignée porte toujours le trait X ».
7. **Stratégies hybrides** (C205), **ROI marginal** des bâtiments et de l'Héritage par clonage d'état (`roi.ts`), **hors ligne** (`offline.ts`), **progression sur 24 h**.
8. **Destin du jour** (C206) : 14 dates (2026-11-01 → 14), environ 15 000 replays par date.
   - Méthodes : 5 constantes, 3 familles de bascules réglées par date, recherche aléatoire, algorithme évolutionnaire amorcé, escalade.
   - Chaque meilleur plan est rejoué par `replay()` et son code vérifié par `verifyCode()` (14/14 OK).
9. **Correction testée** (C207) : Commercer 1,5 → 1,1 Or et Méditer 0,06 → 0,15 Essence, 50 graines.

**Non exécuté / limites**
- Pas de vrai joueur : les profils sont des heuristiques ([SIMULÉ]). `optimiseur` n'a pas servi à conclure.
- La recherche du Destin du jour donne des **minorants** du score maximal, pas un optimum prouvé.
- Hors ligne, sensibilité et traits ont tourné sans événements.
- La fenêtre de 600 s du ROI est trop courte pour juger les effets de long terme (vie, génétique).
- Alliances, surnoms et Bazar n'ont pas été optimisés.
- Hypothèses des profils (`lab/sim/profiles.ts`) :
  - `mono-*` : 30 min de bot « expérimenté », puis une seule activité, avec repli sur Cultiver ou Commercer si les intrants manquent. Achats gourmands, héritier choisi par all + 0,5·xp + 0,2·rang, Échos gardés par pts/s.
  - `experimente` : vocation 2 générations sur 3, Commercer en fin de vie.

## 3. Tableau des paramètres

| paramètre | valeur actuelle | problème | valeur proposée | effet attendu |
|---|---|---|---|---|
| `ACT.commercer.produce.or` (data.ts:43) | 1,5 (3,0 valeur/u) | Coefficient le plus haut des activités autonomes : stratégie dominante (BAL-01) | 1,1 | [SIMULÉ C207] mono-commercer 8,93 → 8,73 ; mono-cultiver le bat sur 47/50 graines |
| `ACT.mediter.produce.essence` (data.ts:53) | 0,06 (1,2 valeur/u) | ×0,04 de Commercer (BAL-02) | 0,15 | [SIMULÉ C207] mono-mediter +0,52 log10 (×3,3) ; écart meilleure/pire activité ×26,6 → ×6,0 |
| Consommation en `√puissance` hors `prodMult` (sim.ts:22-33) | conso ∝ √p | Moins de 1 % de la production après la 1ʳᵉ heure : chaîne décorative (BAL-03) | conso ∝ prodMult·√p, ou ∝ p^0,75 | [HYPOTHÈSE] à mesurer ; `conso.commercer` ±50 % ne change aujourd'hui que ±0,15 log10 |
| Durée de vie (`60 + m.life`, game.ts:95 ; Sève éternelle, Clepsydre, traits de vie) | +8 à +45 s | Allonger la vie **réduit** la valeur (BAL-04) | Lier l'Héritage à la durée (⌊∛(v/20)⌋ × dur/60) ou faire de la vie un gain d'XP | [MESURÉ C204] Centenaire ×0,82, Longévité ×0,95 ; cible > ×1,05 |
| `ECHO_ECO_STRENGTH` (sim.ts:16), `GARDE_REGEN`, amplitude d'Harmonie 0,6 | 0,6 / 0,004 / 0,6 | Le Domaine n'agit presque pas sur le résultat (BAL-05) | Harmonie 0,6 → 1,0 (×0,5 → ×1,5) | [SIMULÉ C203] élasticité de l'amplitude +0,04 à +0,07 log10 par +25 % ; à remesurer avec la nouvelle plage |
| `DAILY_TIERS` (daily.ts:180) et modificateurs | 250/500/800 | Or atteint 2/14 dates, écart ×2,7 entre dates (BAL-06) | Paliers relatifs au score de référence du jour (ex. 60/85/100 % d'un score cible calculé) | [SIMULÉ C206] avec des paliers relatifs, chaque palier deviendrait atteignable chaque jour par construction |
| Sanctuaire (+10 % Échos/niv., data.ts:170) | coût 5 Ess + 20 Sav, ×2,2 | Meilleur ROI de tous les bâtiments (retour 300–400 s contre 5 000–150 000 s), mais inaccessible sans Méditer (BAL-07) | Garder l'effet, ajouter un coût en Or ou rendre le +10 % additif à Mémoire | [MESURÉ roi.ts] à remesurer après la correction |
| Croissance des coûts de bâtiments | 1,9–2,4 | Paramètre le plus influent (élasticité −0,30 à −0,35 log10 pour ±25 %) : à manier avec précaution | inchangée | [SIMULÉ C203] |
| Bonne étoile + Sang fécond (game.ts:401, 435-441) | max : 43 % de chance d'un légendaire par succession | Élu présent chez 83–86 % des 60 derniers ancêtres (BAL-08) | Poids légendaire 2 + l → 1 + 0,5·l | [HYPOTHÈSE] P(≥1 légendaire, 6 héritiers, étoile 5) 43 % → ~22 % (formule) ; à mesurer sur `traitFreq60` |

## 4. Constats (triés par priorité)

### BAL-01 Commercer est une stratégie dominante sur toutes les graines
- **Priorité** : Élevée
- **Domaine** : Économie / activités
- **Description** : passer toute sa vie à Commercer bat toutes les autres stratégies testées, quelle que soit la graine, avec ou sans événements, à dt 0,5 comme à 0,1. Aucune des 6 stratégies hybrides construites pour la contester n'y parvient.
- **Preuve / observation** :
  - [SIMULÉ C000, 200 graines, 6 h, dt 0,5] meilleur profil par graine : mono-commercer 198, mono-cultiver 1, optimiseur 1. log10Value : 8,929 ± 0,043 contre mono-cultiver 8,773 ± 0,030 (×0,70), chasser ×0,32, étudier ×0,15, méditer ×0,04 (p50 apparié). Héritage 4 370 ± 121 contre 4 052 ± 95.
  - [SIMULÉ C202, avec événements] 200/200.
  - [SIMULÉ C201, dt 0,1, 50 graines] 50/50, Δ ≤ 0,022 log10 par rapport à dt 0,5.
  - [SIMULÉ C205, 100 graines] focus-commercer, focus-cultiver, split-com-etu, split-etu-com, split-com-med et etudier-stock perdent tous sur 100/100 graines (Δ de −0,35 à −1,41 log10).
  - [CODE] coefficients en valeur par unité de puissance : Cultiver 1,2 × Flore (≤ 1,6), Chasser 2,0 × Gibier × vigueur, Commercer 3,0, Étudier 4,8, Méditer 1,2 (data.ts:29-55, valeurs data.ts:5-10).
  - Étudier aurait le meilleur coefficient, mais il dépend de l'Or et d'une Bibliothèque chère (200 de valeur, ×2,1). Commercer se finance lui-même : son intrant, les Vivres, vient du repli sur Cultiver, et son bâtiment, le Comptoir, se paie en Or.
- **Gravité** : la spécialisation optimale est unique et ne dépend ni de la graine ni de l'écosystème. Le choix d'activité, cœur de la boucle courte, n'est plus une décision.
- **Impact sur l'expérience** : un joueur optimisateur n'a aucune raison de varier. Les vocations Chasseur, Érudit et Mystique deviennent des pièges.
- **Probabilité que le problème soit réel** : Forte. L'effet est très supérieur à la dispersion (Δ ≥ 0,16 log10 contre é.-t. 0,03–0,04) et constant sur 1 450 parties. Réserve : profils heuristiques.
- **Correction proposée** : `ACT.commercer.produce.or` 1,5 → 1,1, combinée à BAL-02.
- **Effets secondaires potentiels** :
  - `experimente` −0,035 log10, Héritage −6 % (C207). La progression du joueur « mixte » baisse un peu.
  - Commercer redevient faiblement rentable en début de partie : seuil p > 1,86 au lieu de p > 1 pour M = 1.
- **Méthode de vérification** : relancer C000 avec les mono-* sur les graines 1-200 (`npm run sim -- --profiles=mono-cultiver,mono-chasser,mono-commercer,mono-etudier,mono-mediter --seeds=1-200 --hours=6 --workers=2`). Seuils : aucune activité meilleure sur plus de 70 % des graines ; écart meilleure/pire ≤ ×3.

### BAL-02 Méditer est une activité morte en production
- **Priorité** : Élevée
- **Domaine** : Activités / Essence
- **Description** : Méditer rapporte autant que Cultiver à l'équilibre (1,2 valeur/u). En revanche, il n'a ni bonus écologique (Cultiver monte jusqu'à ×1,6) ni bâtiment abordable : le Sanctuaire coûte de l'Essence et du Savoir qu'une lignée de mystiques ne produit pas.
- **Preuve / observation** :
  - [SIMULÉ C000] mono-mediter log10 7,525 ± 0,116, soit ×0,042 de mono-commercer (min…max apparié −1,80…−1,15).
  - [SIMULÉ C000] mono-mediter n'achète jamais les Chroniques (0/200 contre 200/200 pour mono-cultiver), faute d'Héritage : 1 711 contre 4 052.
  - [SIMULÉ C202, événements] ×0,078.
  - [SIMULÉ C201, dt 0,1] ×28.
  - [SIMULÉ C205] split-com-med (moitié de vie à méditer) : −1,41 log10.
  - [SIMULÉ C203] `prod.mediter` ±50 % : |Δ| ≤ 0,04 pour `experimente`. Méditer ne compte que par l'Essence du Sanctuaire (voir BAL-07).
- **Gravité** : une des cinq activités, et sa vocation Mystique, est un piège mesurable. Écart ×24, bien au-delà du seuil ×3.
- **Impact sur l'expérience** : la vocation Mystique et l'Écho méditant pénalisent la lignée. Le surnom « l'Ermite » et l'événement Éclipse récompensent une voie perdante.
- **Probabilité que le problème soit réel** : Certaine. Code et simulation concordent, l'écart est massif et identique à dt 0,1.
- **Correction proposée** : `ACT.mediter.produce.essence` 0,06 → 0,15 (3,0 valeur/u, coefficient égal à Commercer corrigé ×1,36).
- **Effets secondaires potentiels** : l'Essence plus abondante rend le Sanctuaire et la Clepsydre plus accessibles, ce qui augmente la puissance des Échos. À surveiller pour les profils qui méditent en partie.
- **Méthode de vérification** : C207 montre déjà mono-mediter +0,518 ± 0,121 (8,024) et un écart global ×6,0. Seuil cible ≤ ×3, ce qui demandera aussi de traiter Étudier (8,07), voir BAL-03.

### BAL-03 La consommation des convertisseurs est négligeable : la chaîne économique est décorative
- **Priorité** : Moyenne
- **Domaine** : Économie
- **Description** : Commercer consomme 3 Vivres × √p et Étudier 2 Or × √p. La production, elle, vaut `prodMult` × p, et `prodMult` (bâtiments × Prospérité × Harmonie) n'entre pas dans la consommation. Dès que M ≥ 10, ce qui arrive dans la première heure, la consommation pèse moins de 1 %.
- **Preuve / observation** :
  - [CODE] sim.ts:22-33.
  - [MESURÉ analytic.md] conso/brut pour Commercer : 100 % à M=1, p=1 ; 3,2 % à M=1, p=1000 ; 0,3 % à M=10, p=100.
  - [SIMULÉ runBal, graines 1-2, 6 h] log10 brute 8,264 contre nette 8,261 (`experimente`) ; 8,901 contre 8,901 (`mono-commercer`).
  - [SIMULÉ C203, 30 graines] `conso.etudier` ±50 % : Δ ≤ 0,017 log10, soit du bruit ; `conso.commercer` ±50 % : ±0,15 log10 pour mono-commercer et ≈ 0 pour `experimente`.
- **Gravité** : la contrepartie annoncée (« échange des Vivres contre de l'Or ») disparaît. Le seul obstacle réel est l'amorçage, qui fait d'Étudier une activité tributaire des stocks d'Or.
- **Impact sur l'expérience** : aucune tension de gestion des stocks en milieu et fin de partie. Les convertisseurs sont de simples « coefficients plus gros ».
- **Probabilité que le problème soit réel** : Certaine. Formule explicite et mesure net ≈ brut.
- **Correction proposée** : [HYPOTHÈSE] faire suivre la consommation à la production (consommation × `prodMult`, ou exposant 0,75 au lieu de 0,5). Effet non mesuré : rien n'est chiffré avant mesure.
- **Effets secondaires potentiels** : risque de famine d'intrants pour les Échos convertisseurs (frac < 1). Il faut vérifier que l'XP à 25 % reste suffisante (sim.ts:103).
- **Méthode de vérification** : patch en mémoire de `consumeScale` (sim.ts:22) via `BAL_PATCH`, puis `batch.ts` sur les mono-*. Seuil attendu : conso/brut entre 20 et 50 % à 6 h ; écart mono ≤ ×3.

### BAL-04 Allonger la vie réduit la valeur produite
- **Priorité** : Moyenne
- **Domaine** : Lignée / Héritage / bâtiments
- **Description** : les traits Robuste, Longévité et Centenaire, l'amélioration Sève éternelle (2 504 ⚜️ jusqu'au max) et la Clepsydre allongent la vie. Comme le niveau ne croît qu'en log du temps, l'Écho gagne peu en pts/s, alors que la lignée perd des générations et donc de l'Héritage, qui est payé par vie.
- **Preuve / observation** :
  - [SIMULÉ C204, 30 graines, 4 h, trait permanent] mono-commercer :
    - Centenaire −0,084 ± 0,078 log10 (×0,82), Héritage −15,5 %, générations −17 %.
    - Longévité ×0,95, Robuste ×0,94.
    - Éternel (+45 s et Écho +50 %) seulement ×1,31, contre Écho vibrant ×1,55 pour la même partie Écho.
  - [SIMULÉ C203] `vieBase` ×1,5 : −0,046 log10, Héritage −14 %, générations −20 %.
  - [MESURÉ roi.ts, 20 graines] Sève éternelle −0,2 à −0,65 % de production sur 600 s (`experimente`) ; Clepsydre −0,5 à +0,15 %.
  - [MESURÉ analytic.md] une vie de 180 s n'apporte que ×1,53 de puissance moyenne pour 3 fois plus de temps. Cela confirme le GDD (+50 %), mais ce gain ne compense pas.
- **Gravité** : 3 traits, 1 amélioration et 1 bâtiment présentés comme positifs sont neutres ou nuisibles. Le joueur informé les évite.
- **Impact sur l'expérience** : « Sève éternelle » est un puits d'Héritage. L'héritier « Centenaire » est un mauvais choix déguisé en bon.
- **Probabilité que le problème soit réel** : Forte. Le signe est cohérent sur toutes les mesures, mais l'effet est proche de 1 é.-t. pour Robuste et Longévité, et franc pour Centenaire et `vieBase`.
- **Correction proposée** : [HYPOTHÈSE] rendre l'Héritage proportionnel à la durée (⌊∛(v/20)⌋ × dur/60), ou convertir le bonus de vie en XP.
- **Effets secondaires potentiels** : un Héritage plus élevé accélère la Prospérité, qui est un paramètre très influent (élasticité 0,16–0,28).
- **Méthode de vérification** : `traits.ts` après le patch en mémoire de `legacyFor`. Seuil : Centenaire, Longévité et Robuste ≥ ×1,03 par rapport à la référence.

### BAL-05 Le Domaine (écosystème) n'a presque pas d'influence sur le résultat
- **Priorité** : Moyenne
- **Domaine** : Écosystème
- **Description** : le GDD fait du Domaine un pilier (« l'optimum n'est pas le maximum »). Les mesures montrent que la pression des Échos, le trait Harmonieux et le Garde forestier n'ont pas d'effet mesurable sur la valeur produite.
- **Preuve / observation** :
  - [SIMULÉ C203] `echoEcoForce` ±50 % : |Δ| ≤ 0,008 log10 sur les deux profils, soit du bruit.
  - [SIMULÉ C203] amplitude d'Harmonie ±50 % : ±0,07 à 0,17 log10 au plus.
  - [SIMULÉ C204] Harmonieux −0,03 log10, sur les deux profils.
  - [MESURÉ roi.ts] Garde forestier : +0,01 à +0,04 % de production, retour 85 000 à 121 000 s (`experimente`).
  - [SIMULÉ C000] Harmonie moyenne 0,87–0,997 pour tous les profils mono.
- **Gravité** : une mécanique majeure et un bâtiment sur sept sont inertes pour l'équilibrage.
- **Impact sur l'expérience** : les décisions écologiques (alterner Cultiver et Chasser, garder des prédateurs) ne paient pas en partie principale. Elles ne comptent qu'au Destin du jour (BAL-06).
- **Probabilité que le problème soit réel** : Forte. Plusieurs mesures indépendantes concordent. Réserve : un profil qui surexploiterait volontairement le Domaine n'a pas été testé.
- **Correction proposée** : Harmonie ×0,5 → ×1,5 (amplitude 1,0). [HYPOTHÈSE] Garde forestier : effet en % de production, ou suppression.
- **Effets secondaires potentiels** : mono-cultiver (Harmonie 0,87) et mono-chasser seraient davantage pénalisés, ce qui pourrait creuser l'écart avec Commercer avant la correction BAL-01.
- **Méthode de vérification** : `sensitivity.ts` avec `harmonieAmpl=1.0` ; seuil : Harmonieux ≥ ×1,05 dans `traits.ts`.

### BAL-06 Destin du jour : scores déterminés par la date, palier Or presque inaccessible, choix souvent trivial
- **Priorité** : Moyenne
- **Domaine** : Destin du jour
- **Description** : le GDD annonce « pas de stratégie dominante (scores de 400 à 800 selon la stratégie) ». En réalité, le score dépend surtout des modificateurs du jour, et le maximum trouvé reste sous 400 sur 6 dates sur 14.
- **Preuve / observation** : [MESURÉ C206, 14 dates, environ 15 000 replays par date, meilleurs plans rejoués par `replay()` et vérifiés (14/14)]
  - Meilleur trouvé : 506 ± 201 (min 314, p50 449, max 853). ≥ 800 : 2/14 ; ≥ 500 : 5/14 ; ≥ 250 : 14/14.
  - Le meilleur plan est une **activité unique tenue 90 s** 4 jours sur 14 : `medi×90` les 04, 05 et 11 (818 avec Brume), `cult×90` le 02.
  - La recherche ne dépasse la meilleure heuristique simple que de +6,9 %.
  - Une règle universelle « Cultiver 30 s → Commercer jusqu'à 60 s → Étudier » obtient 65 % ± 22 du maximum.
  - Ces scores sont des minorants : la recherche n'est pas exhaustive.
- **Gravité** : contradiction avec le GDD. Le palier Or dépend de la chance du jour (Brume, Académie) plus que du talent. Certains jours n'offrent aucune décision.
- **Impact sur l'expérience** : 12 jours sur 14, le joueur ne peut pas atteindre Or même en jouant parfaitement, ce qui frustre la boucle sociale. Les jours « Brume », la réponse est évidente.
- **Probabilité que le problème soit réel** : Forte. Le score est mesuré par le vrai `replay`. Les maxima pourraient être un peu plus hauts, sans changer la conclusion.
- **Correction proposée** :
  - Paliers relatifs au jour : calculer un score de référence par date (par exemple l'heuristique « bascule réglée ») et fixer Bronze, Argent et Or à 60, 85 et 100 % de cette référence.
  - Ou borner les modificateurs extrêmes (Brume ×2 → ×1,4).
  - Changer les tiers ne touche pas aux anciens codes, puisque replay et score restent identiques.
- **Effets secondaires potentiels** : les records historiques ne sont plus comparables entre les jours. C'est déjà le cas en pratique.
- **Méthode de vérification** : `daily-search.ts --days=28` puis `daily-summary.ts`. Seuils : Or atteignable (par le meilleur trouvé) 28/28 jours ; règle universelle sous l'Argent au moins 70 % des jours.

### BAL-07 Rendement des bâtiments très inégal : le Sanctuaire écrase tout, mais seuls les méditants y ont accès
- **Priorité** : Moyenne
- **Domaine** : Bâtiments
- **Description** : chaque niveau de Sanctuaire ajoute +10 % de puissance à tous les Échos, qui produisent 86 à 93 % de la valeur. Son retour sur investissement est des dizaines de fois meilleur que celui des autres bâtiments, mais il exige de l'Essence. Une lignée qui ne médite pas reste bloquée au niveau 2–3.
- **Preuve / observation** :
  - [MESURÉ roi.ts, 20 graines, fenêtre 600 s] `experimente`, heures 1, 3 et 5 : Sanctuaire +5,1 à +5,5 % de production, retour 304–398 s. Comptoir : 5 365 à 34 172 s. Champs : 1 443 à 150 095 s. Bibliothèque : 6 346 à 149 267 s.
  - mono-commercer : Sanctuaire +6 à +7,6 % pour un coût relatif quasi nul (retour 0–18 s), mais bloqué au niveau 3 faute d'Essence. Champs bloqué au niveau 7 : les Vivres sont consommés en continu.
  - [SIMULÉ C205] focus-commercer (n'achète que Comptoir, Garde et Clepsydre) perd −0,62 log10 face à mono-commercer : les bâtiments « des autres » comptent.
  - [CODE] bMult (data.ts:180) : le palier ×2 tous les 10 niveaux crée des marches (×2,15 au niveau 10 contre ×1,07 ensuite).
- **Gravité** : un bâtiment est un levier caché d'ordre de grandeur, tributaire d'une activité par ailleurs morte (BAL-02). La stratégie optimale réelle est probablement « Commercer, plus juste assez de Méditer et d'Étudier pour le Sanctuaire ». Ce profil n'a pas été construit.
- **Impact sur l'expérience** : achats incompréhensibles (pourquoi ce bâtiment rapporte-t-il 50 fois plus ?) et blocages de ressource.
- **Probabilité que le problème soit réel** : Forte pour l'écart de ROI (mesure directe). Moyenne pour l'existence d'un profil encore meilleur (HYPOTHÈSE).
- **Correction proposée** : [HYPOTHÈSE] rendre le bonus d'Écho du Sanctuaire additif à Mémoire du sang plutôt que multiplicatif, ou en payer une partie en Or ; à revoir après BAL-02.
- **Effets secondaires potentiels** : baisse de la part des Échos, qui sert de garde-fou au pilier 1.
- **Méthode de vérification** : `roi.ts` après correction. Seuil : retours des bâtiments d'activité dans un rapport ≤ ×10 entre eux à l'heure 3.

### BAL-08 Élu monopolise la lignée malgré l'usure du sang
- **Priorité** : Faible
- **Domaine** : Génétique
- **Description** : l'usure fait bien perdre un trait isolé, mais les mutations le réinjectent sans cesse. Avec les améliorations au maximum, une succession a 43 % de chances de produire au moins un légendaire.
- **Preuve / observation** :
  - [SIMULÉ C000] fréquence d'Élu chez les 60 derniers ancêtres : 0,80–0,86 pour tous les profils qui sélectionnent par production. `traitCombos60` vaut 31–34, ce qui correspond aux 27–30 annoncés.
  - [MESURÉ analytic.md, Monte-Carlo `genHeirs`, 2 000 lignées] Élu sélectionné, 6 héritiers, Transmission +40 % : survie médiane de 15 générations, P(perte) 9,4 % par génération.
  - [CODE] P(légendaire) = (2 + l) %, soit 1 − 0,93^(6×1,3) = 43 % par succession (game.ts:435-441).
  - [SIMULÉ C204] en valeur, Élu ×1,32 vaut moins que Mémoire ancestrale ×2,06 et Écho vibrant ×1,55. La sélection des profils, qui ignore `echo`, explique donc en partie la domination d'Élu.
- **Gravité** : la diversité reste correcte, mais un trait est quasi permanent en fin de partie.
- **Impact sur l'expérience** : le choix d'héritier se réduit à « celui qui a Élu » pour un joueur qui juge à l'œil.
- **Probabilité que le problème soit réel** : Moyenne. Le phénomène dépend du critère de sélection du profil.
- **Correction proposée** : poids des légendaires de Bonne étoile 2 + l → 1 + 0,5·l (HYPOTHÈSE : ≈ 22 % par succession par la formule).
- **Effets secondaires potentiels** : Bonne étoile perd de son attrait. Elle ne rapporte déjà rien en production à court terme (ROI 0 %).
- **Méthode de vérification** : campagne C000 `experimente`. Seuil : fréquence d'Élu ≤ 0,6 et `traitCombos60` ≥ 30.

### BAL-09 Les traits d'Écho valent plus que les traits de production, et l'interface n'aide pas à le voir
- **Priorité** : Amélioration facultative
- **Domaine** : Valeur des traits
- **Description** : +40 % d'Écho vaut plus que +40 % d'activité, et plus que +15 % de production globale. C'est cohérent avec « les Échos sont le cœur du jeu », puisqu'ils font environ 90 % de la production, mais rien ne l'indique au joueur.
- **Preuve / observation** : [SIMULÉ C204] mono-commercer : Écho vibrant ×1,55 > Langue d'argent ×1,28 > Polyvalent ×1,15 > Curieux ×1,02 > Robuste ×0,94. mono-cultiver : Écho vibrant ×1,42 > Main verte ×1,30 > Polyvalent ×1,10.
- **Gravité** : aucune casse ; décision mal informée.
- **Impact sur l'expérience** : les choix d'héritier « intuitifs » ne sont pas les meilleurs.
- **Probabilité que le problème soit réel** : Forte pour l'ordre de valeur. Sa lisibilité relève du Game Designer.
- **Correction proposée** : aucune modification chiffrée ; éventuellement afficher l'effet estimé sur les pts/s.
- **Effets secondaires potentiels** : —
- **Méthode de vérification** : `traits.ts`.

## 5. Points forts (à ne pas casser)

- **Progression saine sur 24 h** [SIMULÉ, 10 graines] : Δlog10/h décroît régulièrement (0,94 → 0,18 à 6 h → 0,04 à 24 h). Pas d'explosion ni de mur. Environ 21–24 générations/h et un Héritage cumulé régulier (`results/long24h.md`).
- **Robustesse au pas dt** [SIMULÉ C201] : |Δlog10| ≤ 0,022 et Héritage ±1,3 % entre dt 0,1 et 0,5.
- **Le pilier « chaque vie compte »** tient : les Échos font 86–93 % de la production (C000) et l'Écho est le meilleur levier de trait.
- **Hors ligne** [MESURÉ offline.ts, 20 graines] : 33 % (h1) à 77 % (h5) de la valeur jouée, sans Héritage puisque la succession attend le joueur. L'écart est lisible et pousse à revenir sans punir l'absence.
- **Destin du jour vérifiable** : 14/14 plans optimisés rejoués et vérifiés par `verifyCode`.
- **Aucune anomalie** (NaN, valeurs négatives) dans aucune partie.

## 6. Questions ouvertes / mesures à faire

1. Construire le profil « Commercer, plus Méditer et Étudier juste ce qu'il faut pour le Sanctuaire et la Bibliothèque » : la vraie stratégie dominante est peut-être encore plus nette (BAL-07).
2. Mesurer BAL-03 (consommation liée à `prodMult`) et BAL-04 (Héritage × durée) par `BAL_PATCH`, puis les combiner à fix1.
3. Après fix1, Étudier reste à ×0,19 : tester le coût de la Bibliothèque en Or seul, ou un amorçage d'Or.
4. Refaire la sensibilité avec événements et sur 6 h. Le ROI de long terme (vie, génétique, Alliances, Chroniques) demande des fenêtres d'au moins 1 h.
5. Destin du jour : étendre à 28 dates et à une recherche plus fine (pas de 0,5 s) pour resserrer les maxima.

## 7. Annexes

Toutes les commandes s'exécutent depuis la racine. Les scripts se lancent par `node --import ./lab/balance/register.mjs <script>` (ce chargeur ajoute la réécriture en mémoire de `patch-loader.mjs`).

| Mesure | Commande | n · graines · durée · dt | Résultat |
|---|---|---|---|
| Analytique | `lab/balance/analytic.ts > lab/balance/results/analytic.md` | — (Monte-Carlo 2 000 lignées) | `results/analytic.md` |
| Références appariées | `lab/balance/analyze-refs.ts [C000…\|C001…\|C202…]` | 1 800 / 600 / 1 000 · 1-200 · 6 h · 0,5 | `results/refs-C000.md`, `refs-C001.md`, `refs-C202.md` |
| C201 dt | `npm run sim -- --profiles=mono-cultiver,mono-commercer,mono-mediter,experimente --seeds=1-50 --hours=6 --dt=0.1 --workers=2 --id=C201-balance-dt01` puis `lab/balance/dt-compare.ts` | 200 · 1-50 · 6 h · 0,1 | `lab/results/C201-balance-dt01/`, `results/dt-compare.md` |
| C202 événements | `npm run sim -- --profiles=mono-cultiver,mono-chasser,mono-commercer,mono-etudier,mono-mediter --seeds=1-200 --hours=6 --events --workers=2 --id=C202-balance-mono-evenements` | 1 000 · 1-200 · 6 h · 0,5 | `lab/results/C202-…/` |
| C203 sensibilité | `lab/balance/sensitivity.ts --seeds=1-30 --hours=4 --profiles=experimente,mono-commercer --jobs=2` (`--check` vérifie les motifs, `--summarize` produit la synthèse) | 5 580 · 1-30 · 4 h · 0,5 | `results/sensitivity.md`, `sensitivity-runs.jsonl` |
| C204 traits | `lab/balance/traits.ts --seeds=1-30 --hours=4` puis `--summarize` | 750 · 1-30 · 4 h · 0,5 | `results/traits.md` |
| C205 hybrides | `lab/balance/batch.ts --profiles=focus-commercer,focus-cultiver,split-com-etu,split-etu-com,split-com-med,etudier-stock,mono-commercer --seeds=1-100 --hours=6 --shard={0,1}/2` puis `hybrid-summary.ts` | 700 · 1-100 · 6 h · 0,5 | `results/hybrid.md` |
| C206 Destin du jour | `lab/balance/daily-search.ts --from=2026-11-01 --days=14 --evals=15000 --shard={0,1}/2` puis `daily-summary.ts lab/balance/results/daily-search.jsonl` | 14 dates · graines de recherche 1000+jour · dt 0,1 (moteur) | `results/daily.md` |
| C207 correction | `BAL_OBJ='ACT.commercer.produce.or=1.1;ACT.mediter.produce.essence=0.15' lab/balance/batch.ts --profiles=mono-*,experimente --seeds=1-50 --hours=6 --shard={0,1}/2 --tag=fix1` puis `fix-summary.ts` | 300 · 1-50 · 6 h · 0,5 | `results/fix1.md` |
| ROI | `lab/balance/roi.ts --profiles=experimente,mono-commercer --seeds=1-20 --hours=1,3,5 --window=600` | 20 graines · instantanés h1/3/5 · 600 s · 0,5 | `results/roi.md` |
| Hors ligne | `lab/balance/offline.ts --profile=experimente --seeds=1-20 --hours=1,3,5` | 20 · 1 h | `results/offline-experimente.md` |
| 24 h | `lab/balance/batch.ts --profiles=experimente,mono-commercer --seeds=1-10 --hours=24 --shard={0,1}/2` | 20 · 1-10 · 24 h · 0,5 | `results/long24h.md` |

Outillage : `lab/balance/lib.ts` (runBal, net/brut, `BAL_OBJ`), `patch-loader.mjs` et `register.mjs` (réécriture en mémoire), `profiles-extra.ts` (profils hybrides ajoutés à `PROFILES` en mémoire), `batch.ts`.
