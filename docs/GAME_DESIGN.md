# Échos de Lignée — Game Design Document (v1)

> *« Chaque héros ne vit qu'un instant… mais rien ne se perd. »*

## 1. Le conseil de production

Pour cadrer la v1, on a simulé un conseil avec les rôles clés d'un studio. Chaque rôle a apporté ses arbitrages, résumés ci-dessous.

| Rôle | Responsabilité | Décisions clés pour la v1 |
|---|---|---|
| **Game Director** | Vision et piliers | Trois piliers : **(1)** chaque vie compte, puisqu'elle devient un Écho éternel ; **(2)** la dynastie a une mémoire (gènes, vocations, arbre généalogique) ; **(3)** le monde vit au même rythme pour tous (événements planifiés, Destin du jour). On écarte tout ce qui ne sert pas ces piliers. |
| **Lead Game Designer** | Boucles de jeu | Boucle courte : une vie de 60 s ou plus. Boucle moyenne : succession, choix de l'héritier et des Échos. Boucle longue : Héritage, bâtiments, vocations sur plusieurs générations. Boucle sociale : événements toutes les 4 h et défi quotidien. |
| **Systems / Economy Designer** | Équilibrage | Un bot d'équilibrage joue 6 h en CI (`tests/balance.test.ts`). Coûts exponentiels (×1.9 à ×2.4), bonus de bâtiments ×2 tous les 10 niveaux, Héritage en racine cubique de la valeur produite. Il n'y a pas de stratégie dominante au Destin du jour (scores de 400 à 800 selon la stratégie). |
| **Narrative Designer** | Ton et univers | Univers de fantasy médiévale feutrée : le Sablier des Ancêtres. Prénoms d'époque, vocations (Paysan, Chasseur, Marchand, Érudit, Mystique), chiffres romains pour les générations. Ouverture en cérémonie courte (le Sablier, la forge du blason, le premier du nom), puis tutoriel en astuces contextuelles, sans écran de texte bloquant. |
| **UX / UI Lead** | Mobile et desktop | Conçu d'abord pour le mobile : barre d'onglets en bas, cibles tactiles de 44 px minimum, modales en *bottom sheet*, zones sûres iOS. Sur desktop : deux colonnes (la vie toujours visible à gauche), raccourcis clavier 1 à 5, toasts en bas à droite. PWA installable et jouable hors ligne. L'installation est proposée après la première succession (carte discrète, deux fois au plus, instructions dédiées sur iOS). |
| **Art Director** | Identité visuelle | Palette « crépuscule mystique » (nuit violette, or, améthyste), typographie Cinzel pour les titres et Inter pour le texte, emojis comme iconographie multiplateforme sans assets à charger, frises colorées par activité (la même couleur partout). |
| **Tech Lead** | Architecture | Vite + TypeScript sans framework (environ 25 Ko gzip). Moteur **pur et déterministe** (`src/engine`) séparé de l'UI (`src/ui`). Pas fixe de 0,1 s, RNG à graine (mulberry32), sauvegarde locale versionnée avec migration, simulation hors ligne par pas d'une seconde. |
| **QA Lead** | Qualité | Tests unitaires : écosystème, replay du défi, falsification de code, cycle vie → succession → Écho, export/import, planning d'événements. Bot d'équilibrage. Parcours Playwright sur iPhone 13 et desktop 1440 px. CI bloquante avant chaque déploiement. |
| **Live-Ops / Community** | Rétention | Événements toutes les 4 h (même événement pour tout le monde), export `.ics` vers l'agenda, Destin du jour avec texte de partage façon Wordle et **code de score vérifiable** par n'importe qui. Les événements ne comptent qu'en présence du joueur, pour donner une raison de revenir. |

## 2. Les mécaniques

### 2.1 La Vie (boucle courte)
- Un héros vit **60 s** par défaut, durée allongée par les traits, l'Héritage et la Clepsydre.
- À chaque instant, il pratique **une activité** : Cultiver, Chasser, Commercer, Étudier ou Méditer.
- **Le temps du héros ne s'écoule que pendant une activité.** Recliquer sur l'activité en cours (ou la touche Espace) met la vie en pause : le sablier se fige et rien n'est enregistré, mais les Échos continuent de produire et le Domaine se repose. La pause coûte du tempo dynastique (succession, Héritage et nouvel Écho retardés) et ne survit pas à la fermeture du jeu : au lancement, la vie reprend sur la dernière activité.
- À sa naissance, le héros commence directement l'activité de sa **vocation** héritée (Cultiver par défaut).
- La **succession n'est pas bloquante** : à la mort, un bandeau « Succession en attente » apparaît et les Échos continuent de boucler jusqu'à ce que le joueur choisisse l'héritier.
- Le Destin du jour reste en **temps réel**, sans pause.
- Les compétences montent de niveau pendant la vie (XP ×1.3 par niveau) et repartent de zéro à la génération suivante.
- **Vocation** : si une activité occupe au moins 50 % de la vie, le héros gagne la vocation correspondante (+20 % par rang, rang max X). Elle se transmet aux héritiers et monte de rang si on la pratique encore. Non entretenue, elle perd un rang. Une jauge sous le sablier (à partir de la 2ᵉ génération) montre le seuil et ce qui sera transmis ; la chance de transmission à l'héritier reste cachée.

### 2.2 Les Échos (le cœur du jeu)
- Chaque seconde de la vie est **enregistrée** (activité et puissance).
- À la mort, la vie devient un **Écho** qui la rejoue **en boucle et pour toujours**, avec une puissance de base de 40 %. Les bonus d'événement ne sont pas enregistrés : l'Écho n'en profite que lorsqu'il rejoue pendant un événement, et sa valeur (qui guide le choix des Échos à garder) est calculée hors bonus.
- Les Échos profitent des bonus *actuels* (bâtiments, Harmonie, événements) et agissent aussi sur l'écosystème.
- Emplacements limités : 2 au départ, +1 par niveau de Crypte ancestrale. On choisit à chaque succession quels Échos garder ; un Écho épinglé est prioritaire.

### 2.3 La Lignée (génétique)
- Les traits sont de rareté Commun, Rare, Épique, Légendaire ou Mythique, et certains sont négatifs.
- Chaque héritier hérite de chaque trait parental avec 50 % de chance (améliorable), d'une ou deux mutations, et éventuellement de la vocation.
- On choisit parmi 3 héritiers (jusqu'à 6 avec les améliorations).
- L'**Héritage ⚜️**, gagné à chaque mort, se dépense dans un arbre permanent de 9 améliorations.

### 2.4 Le Domaine (écosystème)
- Trois populations, Flore, Gibier et Prédateurs, suivent un modèle de **Lotka-Volterra amorti**.
- Rendements : Cultiver dépend de la Flore, Chasser dépend du Gibier.
- L'**Harmonie** (proximité de l'équilibre) multiplie toute la production de ×0.7 à ×1.3. **L'optimum n'est pas le maximum.**
- Exemple : trois Échos chasseurs font s'effondrer les prédateurs puis le gibier.

### 2.5 Le monde partagé
- **Événements** : à 0 h, 4 h, 8 h, 12 h, 16 h et 20 h UTC (soit 1 h, 5 h, 9 h, 13 h, 17 h et 21 h en France l'hiver), pendant 45 min. Le type d'événement est tiré de façon déterministe à partir de la date et de l'heure, donc identique pour tous. Chaque événement a trois paliers (Bronze, Argent, Or) qui rapportent des Éclats ✦, et son objectif s'adapte à l'économie du joueur.
- **Destin du jour** : une vie de 90 s **identique pour tous** (héros, traits, modificateurs et écosystème générés à partir de la date). Le score correspond à la valeur finale des ressources. Le partage se fait par un code qui encode les actions : le jeu **rejoue** la partie pour vérifier le score, ce qui rend la triche impossible sans serveur.
- **Bazar céleste** : les Éclats ✦ achètent des Bénédictions (traits garantis pour le prochain héritier), le bonus Temps suspendu (+30 s) ou un blason.

## 3. Feuille de route

| Version | Contenu |
|---|---|
| **v1 (actuelle)** | Tout ce qui précède. PWA, sauvegarde export/import, hors ligne jusqu'à 6 h (+2 h par niveau de Patience). |
| v1.1 | Sons et musique d'ambiance, haptique mobile, succès, statistiques détaillées. |
| v1.2 | **Ère** : un méta-prestige qui réinitialise bâtiments et Échos contre des « Reliques » (des Échos légendaires permanents). |
| v1.3 | Classement en ligne optionnel (backend léger) qui réutilise les codes vérifiables du Destin du jour. |
| v2 | Mariages entre lignées (croisement génétique choisi), nouveaux biomes du Domaine, notifications push. |

## 4. Architecture technique

```
src/engine/   moteur pur, déterministe, testable sans DOM
  data.ts       toutes les données d'équilibrage
  sim.ts        noyau partagé (activité, vie, traits)
  game.ts       partie principale : tick, Échos, succession, achats, hors-ligne
  ecosystem.ts  Lotka-Volterra amorti + Harmonie
  events.ts     calendrier déterministe + export .ics
  daily.ts      Destin du jour : setup, replay, codes vérifiables
  save.ts       sauvegarde locale versionnée, export/import
src/ui/       DOM natif + liaisons fines (pas de framework)
tests/        Vitest : unitaires + bot d'équilibrage
```
