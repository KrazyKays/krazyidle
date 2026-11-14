# Audit Game Design — Échos de Lignée (phase 1)

- Agent : game-designer · Date : 2026-11-14 · Commit audité : `6f47e27` (les sources `src/` sont identiques à `a53d1b5`, commit des références C000/C001 : `git diff --stat a53d1b5 HEAD -- src` est vide).
- Étiquettes : [MESURÉ] code réel exécuté · [SIMULÉ] profils `lab/sim` · [CODE] lecture `fichier:ligne` · [HYPOTHÈSE] non vérifié.

## 1. Résumé et verdict

Le cœur tient ses promesses : chaque vie devient un Écho qui compte vraiment (85 à 93 % de la production vient des Échos), le choix de l'héritier pèse lourd (héritier au hasard : production ×0,61 à 6 h) et les vocations rendent la lignée lisible. Trois faiblesses de design dominent : (1) les systèmes de fin de partie (Alliances 90 ⚜️, Chroniques 160 ⚜️) arrivent après 4,5 h de jeu continu ou jamais en 6 h pour un joueur qui dépense son Héritage au fil de l'eau, et rien ne lui montre qu'il faudrait épargner ; après la 1re heure, aucune nouveauté pendant environ 3,5 h ; (2) le choix des Échos s'appuie sur un chiffre (pts/s) qui ignore la force propre de l'Écho et son surnom, si bien que la présélection se trompe une fois sur huit ; (3) les Chroniques s'effondrent sur « le Vénérable » dès qu'une vocation atteint le rang X. **Verdict : un socle solide, mais le milieu de partie est creux et deux informations de décision sont fausses ou cachées.** Aucun constat critique.

## 2. Périmètre et méthode

Exécuté :
- Lecture du GDD, de tout `src/engine/*` et de `src/ui/app.ts` et `src/ui/legends.ts` (textes, astuces, informations affichées).
- Réanalyse des campagnes de référence C000 (1 800 parties) et C001 (600 parties) : `node lab/design/analyse-ref.mjs lab/results/C00x-…/runs.jsonl`.
- Expériences propres (profils dérivés, sans modifier `lab/sim`), dt 0,5 s, sans événements sauf mention :
  - `lab/design/choix.ts` (40 graines × 6 h) : héritier au hasard ou le pire, Échos par valeur, par pts/s ou les plus récents, joueur épargnant.
  - `lab/design/instrument.ts` (20 à 30 graines × 6 h, et 10 graines × 24 h avec événements, `ADAPT=1` pour un héros qui suit l'événement) : plateaux de nouveauté, tension du choix d'héritier, Affût, surnoms découverts, paliers d'événement par type.
  - `lab/design/echo-select.ts` (30 graines × 6 h) : présélection des Échos selon l'interface comparée à une présélection qui tient compte de la force réelle.
  - `lab/design/destin.ts` (60 dates) : stratégies simples au Destin du jour.
  - `lab/design/migration.ts` et `calendrier.ts` : contrôle d'un artefact de mesure (voir § 5).
- Parcours Playwright sur le vrai jeu (`npx vite --port 5180 --strictPort`, horloge simulée `page.clock`, deviceScaleFactor 1) en iPhone 13 et en desktop 1440 × 900 : cérémonie, vie 1, 1re succession, 5 minutes, onglets ; puis milieu de partie (sauvegardes produites par le vrai moteur, `lab/design/gen-save.ts`). Script : `lab/design/parcours.cjs`, journal texte : `lab/design/captures/parcours-log.txt`, 33 captures dans `lab/design/captures/`. Le serveur a été arrêté à la fin.

Non exécuté :
- Aucune campagne `npm run sim` lancée (pas de nouvel ID C5xx) : tout passe par des scripts dans `lab/design/` qui appellent `runGame`.
- Pas de vérification de mes conclusions à dt 0,1 s, ni de test d'un joueur humain. Le parcours Playwright modélise un joueur **passif** (il ne change jamais d'activité ni ne bâtit) : il montre ce qui s'affiche, pas ce qu'un joueur ressentirait.
- Bazar, mariage entre joueurs par code et export `.ics` : lus dans le code, pas parcourus.

Limites à garder en tête : profils heuristiques (le profil « glouton » achète tout ce qui est abordable), dt 0,5 s, `echoShare` approximatif, hors ligne non instrumenté finement.

## 3. Carte des mécaniques

| Mécanique | Décision proposée | Information disponible | Retour | Verdict |
|---|---|---|---|---|
| Vie (60 s +) | Quelle activité, quand en changer | Aperçu de production par activité, sablier, compétences | Production, niveaux, bande d'enregistrement | ✅ Claire. Sur mobile, les activités sont sous la ligne de flottaison au lancement (GD-11) |
| Activités (5) | Spécialiser ou varier | Rendements instantanés | Ressources | ⚠️ Une ou deux réponses dominantes : Commercer et Cultiver ; Méditer et Étudier ne tiennent pas comme lignées (GD-06) |
| Compétences | Aucune directe (conséquence du temps passé) | Niveau et barre d'XP | Puissance | ✅ Sert la boucle courte |
| Vocation | Tenir 50 % de la vie sur une activité | Jauge et pronostic (« Encore 29 s de Cultiver pour Paysanne II ») | Rang transmis | ✅ Excellente lisibilité. Rang X atteint vite, puis le surnom « Vénérable » écrase les autres (GD-04) |
| Échos | Lesquels garder, épingler | pts/s, durée, frise | Production des Échos | ⚠️ Le choix est présélectionné, et sur un chiffre qui omet la force propre et le surnom (GD-02). Le pts/s des cartes ne correspond pas au total affiché (GD-09) |
| Héritier | Lequel choisir parmi 3 à 6 | Traits avec effets, vocation, usure 🩸, durée de vie, meilleure aptitude | Le héros suivant | ✅ Vraie tension : héritier « évident » dans 23 à 29 % des successions seulement ; mauvais choix = ×0,41 à 0,61 |
| Génétique : budget et usure | Aucune (expression tirée au hasard à la naissance) | Budget caché ; usure affichée | Traits des enfants | ⚠️ Le « dilemme » du GDD n'est pas une décision du joueur ; seul indice derrière les Chroniques (GD-07) |
| Héritage ⚜️ (11 améliorations) | Où dépenser | Coût, effet, palier suivant | Bonus permanents | ⚠️ La pastille pousse à dépenser tout de suite, ce qui repousse Alliances et Chroniques à plus de 4,5 h (GD-01) |
| Domaine, Harmonie | Équilibrer chasse, culture, méditation | Barres, équilibre, santé, ×Harmonie, courbe | Multiplicateur ×0,7–1,3 | ✅ Bien expliqué. L'Harmonie moyenne reste à 0,84–0,997 chez tous les profils : rarement un enjeu (constat inclus dans GD-06) |
| Affût | Aucune, hors « chasser à la réouverture » | Ligne sous Chasser, stat Domaine, paragraphe | Trophées d'Or | ⚠️ Automatisme. Actif 90 % du temps pour une lignée de chasseurs, environ 190 bascules en 6 h chez un joueur varié (GD-10) |
| Bâtiments (7) | Quoi bâtir | Coût, effet, niveau | Multiplicateurs | ✅ Classique et lisible |
| Événements (4 h) | Être présent, adapter l'activité | Calendrier, objectif, paliers | Éclats ✦ | ⚠️ Réussite presque binaire, décidée par la composition des Échos (GD-05) |
| Destin du jour | Séquence d'activités sur 90 s | Traits, modificateurs, paliers, score en direct | Médaille, code vérifiable | ✅ Pas de stratégie simple dominante (méditer gagne 22 jours sur 60, aucune ne dépasse 37 %) |
| Bazar céleste | Bénédictions, Temps suspendu, héraldique | Coûts, effets | Trait garanti, +30 s | ✅ Peu sollicité faute d'Éclats en début de partie (0 à 12 ✦ à 6 h selon le profil) |
| Chroniques (surnoms) | Aucune directe : on vit, puis la Chronique juge | Codex avec énigmes | Surnom et bonus de l'Écho, Éclats | ⚠️ Accès tardif (GD-01) et monotonie « Vénérable » (GD-04) |
| Alliances | Avec qui s'unir, payer la dot, échanger des cadets | Prétendants, traits, risque de consanguinité | Traits du conjoint, galerie | ⚠️ Accès tardif (GD-01). Une union par vie de 2 min : geste répété (GD-12) |
| Hors-ligne | Aucune | Rapport d'absence | Ressources | ⚠️ La boucle longue se fige après une vie (GD-03) |
| Pause | Mettre la vie en pause | Bandeau, astuce | Sablier figé | ⚠️ Aucun profil ne s'en sert : ce n'est ni un choix ni une corvée, c'est un confort. Texte trompeur (GD-08) |

## 4. Constats (triés par priorité)

### GD-01 Alliances et Chroniques arrivent après 4,5 h, sans que le joueur sache qu'il faut épargner
- **Priorité** : Élevée
- **Domaine** : Progression, boucle longue, boucle sociale (pilier 3)
- **Description** : Alliances (90 ⚜️) et Chroniques (160 ⚜️) se paient dans la même monnaie que les améliorations de puissance, dont les coûts restent longtemps inférieurs. Un joueur qui dépense son Héritage dès qu'il le peut n'atteint ces deux systèmes qu'au bout de plusieurs heures, ou jamais. L'interface encourage ce comportement : la pastille de l'onglet Lignée s'allume dès qu'une amélioration est abordable ([CODE] `src/ui/app.ts:263`), et rien n'indique la progression vers 90 ou 160.
- **Preuve / observation** :
  - [SIMULÉ] C000 (200 graines, 6 h), médiane d'achat d'Alliances : experimente 269 min, debutant 314 min (198/200), occasionnel jamais (0/200). Chroniques : jamais en 6 h pour experimente, debutant et occasionnel (0/200 chacun) ; 263 à 337 min pour les profils mono-activité.
  - [SIMULÉ] `lab/design/choix.ts` (40 graines × 6 h) : un joueur qui épargne obtient Alliances à 33 min et Chroniques à 85 min (médianes), mais finit à ×0,61 de production (d = −5,7). En épargnant tout en gardant les achats à moins de 20 ⚜️ : 83 et 113 min, ×0,79.
  - [MESURÉ] La capture `lab/design/captures/desktop-glouton2h-lignee.png` (2 h de jeu, 525 ⚜️ cumulés, tout dépensé) ne montre aucune progression vers Alliances ni Chroniques.
- **Gravité** : Les systèmes qui portent le lien social et la mémoire narrative restent hors de portée pendant la session type.
- **Impact sur l'expérience** : Le joueur occasionnel ne voit jamais les mariages ni les surnoms pendant sa première journée. Celui qui épargne le paie par 20 à 40 % de production en moins à 6 h.
- **Probabilité que le problème soit réel** : Forte. Mécanique déterministe ; seule l'ampleur dépend de la stratégie d'achat des profils.
- **Correction proposée** : Sortir Alliances et Chroniques de l'arbre payant : les débloquer par un jalon (par exemple génération 15 et 30, ou 60 ⚜️ cumulés). Variante : garder le prix, mais ajouter une jauge « vers Alliances » et une astuce dès 45 ⚜️ cumulés. Pilier servi : 3 (social) et 2 (mémoire).
- **Effets secondaires potentiels** : Surcharge du début de partie (la raison d'être du verrou). Il faut garder un délai d'au moins 30 à 45 min. L'économie bouge, puisque 250 ⚜️ cessent d'être dépensés là.
- **Méthode de vérification** : Rejouer `lab/design/choix.ts` et C000. Seuils attendus : achat ou déblocage d'Alliances en médiane ≤ 60 min et de Chroniques ≤ 120 min pour experimente et debutant ; occasionnel ≥ 50 % des parties avec Alliances à 6 h.

### GD-02 La présélection des Échos ignore leur force propre et leur surnom
- **Priorité** : Moyenne
- **Domaine** : Décision de succession (pilier 1), lisibilité
- **Description** : La carte d'Écho, le choix des Échos et la présélection utilisent `valeur ÷ durée` ([CODE] `src/engine/game.ts:624-626`, `src/ui/app.ts:799-802`). Ce chiffre ignore `strength` (traits Écho vibrant +40 %, Mémoire ancestrale +80 %, Éternel +50 %, Maudit −40 %) et la puissance du surnom, alors que la production réelle les applique ([CODE] `game.ts:51-53`). Le trait « Mémoire ancestrale » n'a donc aucun poids visible au moment où il compte. Dans la capture `desktop-econome2h-succession.png`, « Tristan le Grand » (+15 %) est présélectionné comme « libéré ».
- **Preuve / observation** : [SIMULÉ] `node --import ./lab/sim/register.mjs lab/design/echo-select.ts 30 6` (profil experimente épargnant, graines 1-30, 6 h, dt 0,5) : les deux tris divergent dans 11,8 à 17 % des successions. Trier selon la force réelle donne ×1,138 de production à 6 h (d = 1,43).
- **Gravité** : Une décision répétée environ 25 fois par heure repose sur une information fausse, et une partie des traits devient illisible.
- **Impact sur l'expérience** : Le joueur qui suit la présélection perd environ 14 %. Celui qui comprend les traits d'Écho ne trouve aucun chiffre qui confirme son intuition.
- **Probabilité que le problème soit réel** : Certaine (code) ; ampleur Forte (simulation).
- **Correction proposée** : Afficher et trier selon `pts/s × max(0,2 ; 1 + force) × (1 + surnom)`, c'est-à-dire la production attendue à puissance de base égale. Pilier 1.
- **Effets secondaires potentiels** : Le GDD (§ 2.2) est à mettre à jour. Les Échos « Mémoire ancestrale » remonteront davantage ; à surveiller côté équilibrage.
- **Méthode de vérification** : Rejouer `echo-select.ts` après correction. Seuils : divergence 0 % entre l'interface et le tri « vrai » ; production des profils qui suivent la présélection ≥ +10 %.

### GD-03 L'absence fige la boucle longue après une seule vie
- **Priorité** : Moyenne
- **Domaine** : Hors-ligne, rythme (genre idle)
- **Description** : Hors ligne, le héros vit sa vie jusqu'au bout puis la succession attend. Or l'Héritage ne vient que des vies du héros ([CODE] `game.ts:130-131`, `347`), et rien n'avance sans succession ([CODE] `game.ts:216`, `simulateOffline` 605-619). Les Échos produisent des ressources, mais la dynastie s'arrête.
- **Preuve / observation** : [SIMULÉ] C000, profil occasionnel (sessions de 20 min en ligne puis 4 h hors ligne, soit 40 min en ligne sur 6 h) : génération 28, 121 ⚜️ cumulés, contre 41 générations et 212 ⚜️ pour experimente après 60 min en ligne. Le rythme d'Héritage par minute en ligne est du même ordre : 4 h d'absence ont rapporté environ 0 ⚜️ hors la vie en cours. Patience (+2 h hors ligne) est achetée jusqu'au niveau 6 ou 7 sans utilité pour des absences de 4 h.
- **Gravité** : Le message « Tes Échos travaillent même quand tu pars » est vrai pour les ressources, faux pour la lignée.
- **Impact sur l'expérience** : Le retour après une nuit montre une génération de plus, au mieux.
- **Probabilité que le problème soit réel** : Certaine (code). C'est peut-être un choix délibéré (« chaque vie compte ») qui n'est écrit nulle part.
- **Correction proposée** : (a) Assumer et l'écrire dans le GDD et le rapport d'absence (« ta lignée t'attend »). Ou (b) une « régence » hors ligne : succession automatique avec l'héritier présélectionné, plafonnée (par exemple 1 vie par heure d'absence, avec un Héritage réduit). Pilier 1 contre confort idle : la variante (b) affaiblit « chaque vie compte ».
- **Effets secondaires potentiels** : Avec (b), des choix d'héritier faits sans le joueur, et un rattrapage économique des joueurs absents.
- **Méthode de vérification** : Campagne occasionnel contre experimente : rapport ⚜️ / minute en ligne. Cible à définir par le Lead (par exemple occasionnel ≥ 1,5 fois experimente si on retient la régence).

### GD-04 « Le Vénérable » efface les autres surnoms dès qu'une vocation atteint le rang X
- **Priorité** : Moyenne
- **Domaine** : Chroniques, variété
- **Description** : Le surnom le plus rare l'emporte ([CODE] `epithets.ts:116-119`). Vénérable est épique et ne demande qu'une vocation au rang ≥ 10 (`epithets.ts:70`). Une lignée fidèle à son métier (ce que le pilier 2 encourage) reçoit donc « Vénérable » à chaque vie, et jamais « le Laboureur », « le Jardinier » ou « le Veneur ».
- **Preuve / observation** : [SIMULÉ] C000 : les profils mono-activité ne découvrent qu'un seul surnom (`epithetsFound` = 1,00 sur 200 graines, 26 à 41 vies surnommées). `instrument.ts` : mono-chasser 1/34 surnoms (Vénérable sur 565 vies, 20 graines) ; optimiseur épargnant 3 664 vies Vénérable sur 30 parties, contre moins de 300 pour tous les autres surnoms réunis. Sur l'ensemble des profils épargnants, 12 à 15 surnoms sur 34 ont été vus au moins une fois en 6 h.
- **Gravité** : Le Codex stagne et l'effet promis par le GDD (« le Laboureur cultive mieux ») n'apparaît jamais chez ceux qui cultivent.
- **Impact sur l'expérience** : Monotonie dans la généalogie et les Échos. Le surnom cesse de raconter la vie. Économiquement neutre : Vénérable (+15 %) vaut mieux que Laboureur (+10 %).
- **Probabilité que le problème soit réel** : Certaine.
- **Correction proposée** : Ne donner Vénérable qu'à la vie qui **atteint** le rang X (passage de IX à X), ou la rendre légendaire et unique par lignée. Pilier 2.
- **Effets secondaires potentiels** : Moins de vies surnommées ; à compenser si l'objectif d'environ 50 % du GDD est maintenu.
- **Méthode de vérification** : `instrument.ts` (mono-cultiver, 20 graines, 6 h, achats épargnants). Seuils : Vénérable ≤ 1 par passage au rang X ; ≥ 3 surnoms distincts par partie mono-activité.

### GD-05 Les événements se jouent presque d'avance, selon la composition des Échos
- **Priorité** : Moyenne
- **Domaine** : Boucle sociale, événements (pilier 3)
- **Description** : L'objectif est calibré sur la valeur totale produite (240 s de production totale, [CODE] `game.ts:256-262`) mais compté sur une seule ressource. Les Échos font environ 90 % de la production, donc la réussite dépend surtout de ce que produisent déjà les Échos, peu de la présence du joueur.
- **Preuve / observation** : [SIMULÉ] `instrument.ts` sur 24 h avec événements, 10 graines, héros qui ne s'adapte pas : pour 5 types sur 6, chaque profil a 0 % ou 100 % d'Or (experimente : Concile et Marée 10/10 en Or, Éclipse 0/20, Moisson 0/10, Comète 9/10 sans palier). Héros qui suit l'événement (`ADAPT=1`) : experimente passe à 9/20 Or en Éclipse et 10/10 en Comète, mais tombe de 10/10 à 2/10 Or en Marée. Optimiseur adapté : Éclipse 5/20 en Bronze seulement. Artefact écarté : la « Grande migration » tombe à t = 24 h, fin de la simulation (`calendrier.ts`), elle n'a donc pas été mesurée.
- **Gravité** : La raison de revenir (« les événements ne comptent qu'en ta présence ») est faible pour la moitié des événements et décourageante pour l'autre.
- **Impact sur l'expérience** : Or automatique ou échec certain, peu de jeu entre les deux.
- **Probabilité que le problème soit réel** : Forte (dépend des profils, qui ne recomposent pas leurs Échos).
- **Correction proposée** : Calibrer l'objectif sur la production **de la ressource cible** (ou de l'activité favorisée) mesurée sur l'heure précédente, avec un plancher. Ou compter la progression en valeur produite **par le héros** pendant l'événement. Pilier 3.
- **Effets secondaires potentiels** : Plus d'Éclats en circulation, donc des Bénédictions plus fréquentes.
- **Méthode de vérification** : `ADAPT=1 instrument.ts` (experimente, optimiseur, 10 graines × 24 h, avec événements). Seuils : pour chaque type, Bronze ≥ 80 % avec adaptation et ≤ 50 % d'Or sans adaptation.

### GD-06 Le choix d'activité se résume à une ou deux réponses ; Méditer et Étudier ne tiennent pas comme lignées
- **Priorité** : Moyenne
- **Domaine** : Activités, vocations
- **Description** : Spécialiser bat varier, et deux métiers sur cinq ne tiennent pas comme lignées. Le joueur varié (experimente) produit moins que toutes les lignées mono-activité sauf Étudier et Méditer. L'Harmonie, censée récompenser l'équilibre, reste à 0,84–0,997 chez tous les profils (C000) : elle pèse peu dans la décision. Écart au GDD : « une lignée de chasseurs produit ~70 % d'une lignée de paysans ».
- **Preuve / observation** : [SIMULÉ] C000 (200 graines, 6 h), log10 de la valeur produite : mono-commercer 8,93 ; mono-cultiver 8,77 ; mono-chasser 8,43 (×0,45 de Cultiver, pas ~0,70) ; experimente 8,26 ; mono-etudier 8,12 (×0,22) ; mono-mediter 7,53 (×0,06). Optimiseur : 86 % de son temps en Cultiver.
- **Gravité** : Le Mystique et l'Érudit sont des pièges. « Touche-à-tout » est un surnom, pas une stratégie viable.
- **Impact sur l'expérience** : Peu de raisons de quitter Cultiver ou Commercer, sauf pour les déblocages.
- **Probabilité que le problème soit réel** : Forte (profils simples ; l'ordre de grandeur ×16 dépasse leur biais probable).
- **Correction proposée** : Domaine du Game Balancer pour les chiffres. Côté design : donner à Méditer et Étudier un rôle propre et non substituable (Essence nécessaire à la Crypte ou au Sanctuaire, Savoir qui donne de l'XP aux Échos…) plutôt qu'un rendement. Pilier 2 (vocations).
- **Effets secondaires potentiels** : Nouvelles dépendances entre ressources ; le début de partie se complexifie.
- **Méthode de vérification** : C000 rejouée. Seuil : chaque mono-activité ≥ ×0,5 de la meilleure.

### GD-07 Le « dilemme » du budget génétique n'est pas une décision du joueur, et son seul indice est derrière les Chroniques
- **Priorité** : Moyenne
- **Domaine** : Génétique, lisibilité, écart au GDD
- **Description** : Le GDD présente un dilemme (« choisir entre deux légendaires ou… »), mais l'expression des dons est tirée au hasard à la naissance ([CODE] `game.ts:469-482`). Le joueur ne choisit que parmi les héritiers déjà formés. Le budget est volontairement caché ; son unique allusion (le « Dicton des anciens ») n'apparaît que dans le Codex, donc après Chroniques ([CODE] `legends.ts:217, 233-236`), que 3 profils sur 4 n'atteignent pas en 6 h (GD-01).
- **Preuve / observation** : [CODE] ci-dessus ; [SIMULÉ] C000 : Chroniques 0/200 pour experimente, debutant et occasionnel.
- **Gravité** : Un parent à quatre dons peut donner des enfants à deux dons sans aucune explication : c'est perçu comme du hasard pur.
- **Impact sur l'expérience** : Lisibilité, et sentiment d'injustice possible ([HYPOTHÈSE], non observé chez des humains).
- **Probabilité que le problème soit réel** : Forte pour l'écart au GDD ; Moyenne pour la gêne ressentie.
- **Correction proposée** : Placer le Dicton dans l'astuce ou l'aide de la fiche héritier dès la première succession où un don « ne s'exprime pas », ou afficher « dons en sommeil » sur l'enfant. Corriger le GDD : le dilemme se joue au choix de l'héritier, pas de l'expression. Pilier 2.
- **Effets secondaires potentiels** : La mise en valeur du budget pousse à l'optimisation chiffrée, ce que le GDD voulait éviter.
- **Méthode de vérification** : Parcours Playwright : le Dicton ou l'indice est visible avant la génération 10 sans Chroniques.

### GD-08 La pause n'est jamais utile, et son astuce induit en erreur
- **Priorité** : Faible
- **Domaine** : Pause
- **Description** : Mettre en pause n'apporte aucun gain : Méditer apaise le Domaine en produisant, et la succession n'est pas bloquante. L'astuce « Prends le temps de bâtir ! » ([CODE] `app.ts:283`) suggère qu'il faudrait mettre en pause pour construire, ce qui est faux. Seul usage rentable imaginable : figer le héros pour qu'il vive pendant un événement ([HYPOTHÈSE], non mesuré).
- **Preuve / observation** : [SIMULÉ] `pausedShare` = 0 pour tous les profils de C000/C001 ; [CODE] `game.ts:215-223`.
- **Gravité** : Mineure. C'est un confort (lire, réfléchir) présenté comme une mécanique.
- **Impact sur l'expérience** : Un débutant peut croire qu'il doit mettre en pause pour agir, et perdre du tempo.
- **Probabilité que le problème soit réel** : Forte pour le texte, Faible pour le reste.
- **Correction proposée** : Réécrire l'astuce : « Rien ne presse : la pause sert à réfléchir, mais ta lignée avance moins vite. » Pilier 1 (le tempo compte).
- **Effets secondaires potentiels** : Aucun.
- **Méthode de vérification** : Relecture du texte.

### GD-09 Le pts/s des cartes d'Écho ne correspond pas à la production affichée des Échos
- **Priorité** : Faible
- **Domaine** : Lisibilité
- **Description** : Chaque carte affiche la valeur de la vie d'origine (puissance 100 %, multiplicateurs de l'époque), alors que l'en-tête « Production des Échos » mesure la production réelle (×0,4 de base, bonus actuels).
- **Preuve / observation** : [MESURÉ] `parcours-log.txt` (desktop, 5 min) : cartes 5,3 + 5,0 pts/s, en-tête 3,5 pts/s. À 2 h (`desktop-glouton2h-lignee.png`) : cartes 417 + 544 + 667 + 490 ≈ 2 118, en-tête 1,81 K. L'écart varie d'un facteur 3 à 1,2.
- **Gravité** : Mineure, mais elle brouille la seule mesure de valeur proposée au joueur.
- **Impact sur l'expérience** : On ne peut pas vérifier l'effet de la Mémoire du sang ou du Sanctuaire sur un Écho.
- **Probabilité que le problème soit réel** : Certaine.
- **Correction proposée** : Afficher sur la carte la production **actuelle** de l'Écho (à corriger avec GD-02), et garder « qualité de la vie » en info-bulle.
- **Effets secondaires potentiels** : Ce chiffre fluctue avec les événements ; prévoir un libellé clair.
- **Méthode de vérification** : Playwright : la somme des cartes = l'en-tête, à ±5 %.

### GD-10 L'Affût est un automatisme bavard plutôt qu'un jeu
- **Priorité** : Faible
- **Domaine** : Domaine, chasse
- **Description** : Le cycle disette → affût → battue fonctionne seul, et le joueur n'a qu'une décision marginale (chasser à la réouverture). Pour une lignée de chasseurs, l'affût devient l'état normal ; pour un joueur varié, la ligne d'état sous Chasser change environ toutes les deux minutes.
- **Preuve / observation** : [SIMULÉ] `instrument.ts` (6 h, dt 0,5) : mono-chasser à l'affût 90,1 % du temps, 272 bascules par partie ; experimente 9,8 % du temps, 190 bascules ; optimiseur 1,4 %, 34 bascules.
- **Gravité** : Il rend la vocation de Chasseur viable (objectif atteint en partie, voir GD-06), mais la chasse devient passive.
- **Impact sur l'expérience** : Du bruit d'interface ; le « chasseur » attend plus qu'il ne chasse.
- **Probabilité que le problème soit réel** : Moyenne (mesure à dt 0,5).
- **Correction proposée** : Signaler la réouverture par un seul toast « 🏆 La chasse rouvre : X 🪙 à rapporter » (une vraie décision) et masquer la ligne d'affût le reste du temps.
- **Effets secondaires potentiels** : Aucun sur l'économie.
- **Méthode de vérification** : Compter les toasts sur 1 h (≤ 6 attendus pour un profil varié).

### GD-11 Les premières secondes sur mobile : activités hors écran, textes inexacts
- **Priorité** : Faible
- **Domaine** : Onboarding, textes
- **Description** :
  - (a) iPhone 13, au lancement : l'astuce d'accueil et la carte du héros repoussent les activités sous la ligne de flottaison ; l'astuce dit « Change d'activité » sans qu'aucune soit visible.
  - (b) À la mort de la 1re vie, la carte dit « tes Échos continuent de boucler » alors qu'il n'y en a aucun ([CODE] `app.ts:307`).
  - (c) À la 1re succession, « Meilleure aptitude : 📖 ×1,40 » désigne Étudier, encore verrouillé.
  - (d) L'astuce « Champs » reste affichée tant qu'on ne l'a pas validée.
- **Preuve / observation** : [MESURÉ] `mobile-04-vie-t0.png`, `mobile-05-vie-t20.png`, `mobile-06-mort-1re-vie.png`, `mobile-07-succession-1.png`.
- **Gravité** : Mineure.
- **Impact sur l'expérience** : Friction dans les 60 premières secondes, au moment le plus fragile.
- **Probabilité que le problème soit réel** : Certaine pour l'affichage ; l'effet sur de vrais joueurs n'est pas mesuré.
- **Correction proposée** : Astuce d'accueil compacte, ou placée sous les activités sur mobile. Texte de mort conditionnel (« Elle deviendra ton premier Écho »). Aptitude calculée sur les activités débloquées.
- **Effets secondaires potentiels** : Aucun.
- **Méthode de vérification** : Rejouer `node lab/design/parcours.cjs` : bouton Cultiver visible dans la 1re capture mobile.

### GD-12 Le mariage est un geste à refaire à chaque vie de deux minutes
- **Priorité** : Amélioration facultative
- **Domaine** : Alliances
- **Description** : Une union par vie, avec des vies d'environ 2 min (≈ 170 générations en 6 h) : pour en profiter, il faut retourner dans Lignée → Alliances à chaque génération. Aucun problème objectif mesuré (le profil optimiseur ne se marie qu'environ 2 fois en 6 h, faute d'Or).
- **Preuve / observation** : [SIMULÉ] C000/C001, `married` moyen 1,9 à 2,7 pour optimiseur. [CODE] `alliances.ts:21-23`.
- **Gravité** : Préférence de rythme.
- **Impact sur l'expérience** : [HYPOTHÈSE] Corvée pour un joueur assidu, oubli pour les autres.
- **Probabilité que le problème soit réel** : Faible (préférence).
- **Correction proposée** : Proposer le mariage dans la modale de succession (« Unir l'héritier à la Maison X »). Pilier 3.
- **Effets secondaires potentiels** : Mariages plus fréquents, donc plus de traits de conjoint et d'usure divisée ; à vérifier côté génétique.
- **Méthode de vérification** : Taux de vies mariées une fois Alliances débloquées.

### GD-13 Un milieu de partie sans nouveauté pendant plus de trois heures
- **Priorité** : Moyenne
- **Domaine** : Rythme
- **Description** : Toutes les « premières fois » (activité, amélioration, bâtiment) tombent dans la première heure ; ensuite, seuls des chiffres grossissent jusqu'à Alliances. La feuille de route place la nouveauté suivante (Ère) en 0.3.
- **Preuve / observation** : [SIMULÉ] `instrument.ts`, graines 1-30, 6 h, plus long intervalle sans nouveauté (1re activité, 1er niveau d'amélioration, 1er bâtiment, 1er surnom, 1er mariage) : experimente médiane 227 min ; experimente épargnant 212 min ; optimiseur épargnant 282 min ; debutant épargnant 149 min. Sur 24 h avec événements : 490 min (experimente). Limite : les événements, le Destin du jour et le Bazar ne comptent pas comme nouveauté dans cette mesure.
- **Gravité** : Risque d'abandon au moment où le jeu devrait révéler sa profondeur ([HYPOTHÈSE] sur l'effet réel).
- **Impact sur l'expérience** : La 2e heure ressemble à la 4e.
- **Probabilité que le problème soit réel** : Forte (dépend de la définition, qui est explicite).
- **Correction proposée** : Échelonner les déblocages : GD-01, plus des jalons de génération (25, 50, 100) qui ouvrent un bâtiment, un emplacement ou une page du Codex. Piliers 1 et 2.
- **Effets secondaires potentiels** : Plus de contenu à équilibrer.
- **Méthode de vérification** : `instrument.ts`. Seuil : plus long plateau ≤ 60 min sur les 4 premières heures.

## 5. Points forts (à préserver)

- **Le choix de l'héritier a du poids et de la tension** : [SIMULÉ] `choix.ts`, héritier au hasard ×0,61 (d = −6,0), le pire ×0,41. L'héritier n'est « évident » (écart ≥ 0,3 sur le score du bot) que dans 23 à 29 % des successions. L'information affichée (traits et effets, usure 🩸, vocation, durée de vie) suffit à décider.
- **La jauge de vocation** (« Encore 29 s de Cultiver pour Paysanne II ») est exemplaire : un seuil, un état, une conséquence ([MESURÉ] `parcours-log.txt`).
- **Pilier 1 tenu** : les Échos font 86 à 93 % de la production (C000), et l'Héritage ne vient que des vies : chaque vie compte doublement.
- **La succession non bloquante et sa modale** sont claires sur mobile et en desktop (captures 07 à 09) ; l'Héritage gagné et le « Prochain palier » donnent un objectif concret.
- **Destin du jour** : aucune stratégie simple ne domine ([SIMULÉ] `destin.ts`, 60 dates : méditer meilleure 22 fois, glouton 11, cultiver 12, chaîne 11) ; l'Or (800) reste exigeant (atteint 5 jours sur 60 par la meilleure stratégie simple).
- **La cérémonie d'ouverture** est courte, sans formulaire bloquant (captures 01 à 03).
- **Domaine** : explications complètes et cohérentes avec le moteur (Harmonie, Prédateurs, Affût).
- **Diversité génétique** atteinte : 31 à 52 combinaisons sur 60 générations (C000), au-dessus des 27–30 du GDD.

## 6. Questions ouvertes / mesures à faire

1. Vérifier GD-02, GD-05 et GD-10 à `--dt=0.1`.
2. Événements : mesurer « Grande migration » (fenêtre manquée, à placer en milieu de simulation via l'option `start`), et vérifier l'objectif fixé quand une partie se lance pendant un événement : `rt.rate` vaut 0 au chargement, donc l'objectif serait minimal ([HYPOTHÈSE], `game.ts:256-262`, `main.ts:79-86`). À transmettre à la QA.
3. Pause pour faire vivre le héros pendant un événement : gain d'Héritage réel ? (Profil à écrire.)
4. Le blocage de la dynastie hors ligne (GD-03) est-il voulu ? Décision du Lead ou du Game Director, à inscrire dans le GDD.
5. Test avec de vrais joueurs (5 premières minutes, 1re succession) : aucune impression humaine n'est affirmée ici.

## 7. Annexes

Commandes (commit `6f47e27`, sources identiques à `a53d1b5`, dt 0,5 s sauf mention) :

```
node lab/design/analyse-ref.mjs lab/results/C000-reference-sans-evenements/runs.jsonl
node lab/design/analyse-ref.mjs lab/results/C001-reference-avec-evenements/runs.jsonl
node --import ./lab/sim/register.mjs lab/design/choix.ts 40 6
node --import ./lab/sim/register.mjs lab/design/instrument.ts experimente 30 6 0 0      # (et 0 1 = épargnant)
node --import ./lab/sim/register.mjs lab/design/instrument.ts optimiseur 30 6 0 1
node --import ./lab/sim/register.mjs lab/design/instrument.ts debutant 30 6 0 1
node --import ./lab/sim/register.mjs lab/design/instrument.ts mono-chasser 20 6 0 0
node --import ./lab/sim/register.mjs lab/design/instrument.ts experimente 10 24 1 0     # événements ; ADAPT=1 pour le héros adaptatif
node --import ./lab/sim/register.mjs lab/design/echo-select.ts 30 6
node --import ./lab/sim/register.mjs lab/design/destin.ts 60
node --import ./lab/sim/register.mjs lab/design/calendrier.ts 8
node --import ./lab/sim/register.mjs lab/design/gen-save.ts experimente 120 lab/design/captures/state-econome-2h.json 1
npx vite --port 5180 --strictPort & node lab/design/parcours.cjs   # serveur arrêté ensuite
```

Graines : 1-N par profil (graine de partie = graine moteur), début de partie lundi 16/11/2026 0 h UTC (défaut du runner). Aucune campagne `npm run sim` lancée, donc aucune ligne ajoutée à `lab/campaigns/CAMPAIGNS.md`.

Fichiers : scripts `lab/design/*.ts|mjs|cjs` ; captures et journal `lab/design/captures/` (desktop/mobile 01 à 12, `*-econome2h-*`, `desktop-glouton2h-*`, `parcours-log.txt`, sauvegardes `state-*.json`).
