# Échos de Lignée — Game Design Document (0.1)

> *« Chaque héros ne vit qu'un instant… mais rien ne se perd. »*

## 1. Le conseil de production

Pour cadrer la 0.1, on a simulé un conseil avec les rôles clés d'un studio. Chaque rôle a apporté ses arbitrages, résumés ci-dessous.

| Rôle | Responsabilité | Décisions clés pour la 0.1 |
|---|---|---|
| **Game Director** | Vision et piliers | Trois piliers : **(1)** chaque vie compte, puisqu'elle devient un Écho éternel ; **(2)** la dynastie a une mémoire (gènes, vocations, arbre généalogique) ; **(3)** le monde vit au même rythme pour tous (événements planifiés, Destin du jour). On écarte tout ce qui ne sert pas ces piliers. |
| **Lead Game Designer** | Boucles de jeu | Boucle courte : une vie de 60 s ou plus. Boucle moyenne : succession, choix de l'héritier et des Échos. Boucle longue : Héritage, bâtiments, vocations sur plusieurs générations. Boucle sociale : événements toutes les 4 h et défi quotidien. |
| **Systems / Economy Designer** | Équilibrage | Un bot d'équilibrage joue 6 h en CI (`tests/balance.test.ts`). Coûts exponentiels (×1.9 à ×2.4), bonus de bâtiments ×2 tous les 10 niveaux, Héritage en racine cubique de la valeur produite. Il n'y a pas de stratégie dominante au Destin du jour (scores de 400 à 800 selon la stratégie). |
| **Narrative Designer** | Ton et univers | Univers de fantasy médiévale feutrée : le Sablier des Ancêtres. Prénoms d'époque, vocations (Paysan, Chasseur, Marchand, Érudit, Mystique), chiffres romains pour les générations. Ouverture en cérémonie courte (le Sablier, la forge du blason, le premier du nom), puis tutoriel en astuces contextuelles, sans écran de texte bloquant. |
| **UX / UI Lead** | Mobile et desktop | Conçu d'abord pour le mobile : barre d'onglets en bas, cibles tactiles de 44 px minimum, modales en *bottom sheet*, zones sûres iOS. Sur ordinateur, la page ne défile plus : ce qui est fixe reste à l'écran et chaque colonne défile pour elle-même. Dès 1 280 px (portables courants : 1 366, 1 440, 1 536 px), trois colonnes : le héros et ses activités en liste compacte, les Échos, puis l'onglet en cours (Domaine, Lignée, Destin), avec les onglets accrochés à cette colonne. Entre 900 et 1 279 px, deux colonnes (les Échos redeviennent un onglet). Raccourcis clavier 1 à 5, toasts en bas à droite, astuces en bas de la colonne du héros. La généalogie montre les 5 derniers ancêtres, le reste en modale. PWA installable et jouable hors ligne. L'installation est proposée après la première succession (carte discrète, deux fois au plus, instructions dédiées sur iOS). |
| **Art Director** | Identité visuelle | Palette « crépuscule mystique » (nuit violette, or, améthyste), typographie Cinzel pour les titres et Inter pour le texte, emojis comme iconographie, sauf pour le blason : 12 meubles héraldiques dessinés en SVG (or sur l'émail de la maison), pour un rendu identique sur tous les appareils, frises colorées par activité (la même couleur partout). |
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
- L'**Héritage ⚜️**, gagné à chaque mort, se dépense dans un arbre permanent de 11 améliorations (dont Alliances et Chroniques).

### 2.4 Le Domaine (écosystème)
- Trois populations, Flore, Gibier et Prédateurs, suivent un modèle de **Lotka-Volterra amorti**.
- Rendements : Cultiver dépend de la Flore, Chasser dépend du Gibier.
- L'**Harmonie** (proximité de l'équilibre) multiplie toute la production de ×0.7 à ×1.3. **L'optimum n'est pas le maximum.**
- **Les Prédateurs sont utiles** : ils gardent les hardes saines. Le rendement de la chasse est multiplié par la *vigueur du Gibier* (×0.55 sans prédateurs, ×1 à l'équilibre, ×1.13 au plus). S'ils pullulent, chasser rapporte aussi des **trophées en Or**.
- Leur population suit la capacité d'accueil offerte par le Gibier : un prélèvement les fait décliner progressivement, sans effondrement brutal. C'est donc le Gibier lui-même qui s'épuise : un héros qui chasse seul le fait passer d'environ 29 à 20.
- **La pression grandit avec la puissance** : l'impact d'un héros ou d'un Écho est multiplié par 1 + ½·ln(puissance). Les Échos de fin de partie pèsent donc vraiment sur le Domaine.
- Le **Garde forestier** ne réduit plus l'impact : il régénère le Domaine vers l'équilibre (+0,4 %/s par niveau). Il amortit la pression sans la neutraliser.
- Exemple : un héros et deux Échos chasseurs puissants épuisent le Gibier (moins de 5) et font tomber l'Harmonie à ×0.7.

### 2.5 Le monde partagé
- **Événements** : à 0 h, 4 h, 8 h, 12 h, 16 h et 20 h UTC (soit 1 h, 5 h, 9 h, 13 h, 17 h et 21 h en France l'hiver), pendant 45 min. Le type d'événement est tiré de façon déterministe à partir de la date et de l'heure, donc identique pour tous. Chaque événement a trois paliers (Bronze, Argent, Or) qui rapportent des Éclats ✦, et son objectif s'adapte à l'économie du joueur.
- **Destin du jour** : une vie de 90 s **identique pour tous** (héros, traits, modificateurs et écosystème générés à partir de la date). Le score correspond à la valeur finale des ressources. Le partage se fait par un code qui encode les actions : le jeu **rejoue** la partie pour vérifier le score, ce qui rend la triche impossible sans serveur.
- **Bazar céleste** : les Éclats ✦ achètent des Bénédictions (traits garantis pour le prochain héritier), le bonus Temps suspendu (+30 s), un nouveau blason ou une **partition d'écu** (parti, coupé, tranché, chevronné, écartelé : 3 ✦ chacune, puis libre de changer).

### 2.6 Les Chroniques (surnoms, fin de partie)
- Débloquées par l'amélioration d'Héritage **Chroniques** (160 ⚜️), pour ne pas surcharger le début de partie.
- À sa mort, une vie marquante reçoit **un surnom** selon sa façon de vivre : « le Laboureur », « la Juste », « le Dévastateur », « la Matriarche », « le Maudit glorieux »… 34 surnoms en 4 raretés (Commun, Rare, Épique, Légendaire). Si plusieurs conviennent, le plus rare l'emporte.
- Le surnom suit l'Écho pour toujours et **amplifie ce qu'il fait** : « le Laboureur » cultive mieux, « la Juste » pèse moins sur le Domaine, « le Dévastateur » produit plus mais l'abîme davantage. Les surnoms ironiques (« le Fainéant », « l'Inconstant ») n'ont aucun effet : pure saveur.
- Les conditions restent cachées. Le **Codex** de l'onglet Lignée montre une énigme pour chaque surnom non découvert. Une première découverte rapporte 1 à 5 Éclats ✦ selon la rareté.
- Équilibrage : un record ne compte que s'il écrase l'ancien (×1,5, ×2 pour le légendaire), « le Juste » exige de vivre de la terre (Cultiver + Chasser ≥ 50 %), et la longévité se mesure par rapport à une vie normale. Sur 3 h de bot, environ la moitié des vies reçoivent un surnom.

### 2.7 Les Alliances (mariages, lien social)
- Débloquées par l'amélioration d'Héritage **Alliances** (90 ⚜️).
- **Une union par vie**, sans contrainte de genre, payée par une dot en Or (2 % de l'Or produit depuis le début, 50 au minimum, moitié prix entre joueurs). Les enfants héritent des traits **des deux parents** (ceux du conjoint un peu moins souvent, jamais ceux du Bazar). Deux parents du même métier transmettent parfois la vocation d'un rang plus haut.
- **Maisons du comté** : chaque semaine (lundi 0 h UTC), trois maisons PNJ, **les mêmes pour tous les joueurs**, proposent un prétendant porteur de leur « don de la semaine ». Ça marche aussi pour qui joue seul.
- **Entre joueurs** : les enfants non choisis à la succession deviennent des **cadets** (8 au plus). On en offre un par un **code** (ou un lien `…#mariage=CODE`) qu'un ami colle dans son jeu pour l'unir à son héros. Après l'union, le jeu propose d'envoyer un cadet en retour : l'alliance est alors **scellée** des deux côtés. Aucun serveur.
- Sans serveur, un code peut être fabriqué : on borne donc ce qu'il apporte (ni traits du Bazar, un seul trait légendaire, quatre traits au plus, vocation au plus deux rangs au-dessus de celle du héros). Un code ne peut être accepté qu'une fois par lignée, et jamais par sa propre maison.
- **Consanguinité** : chaque union de plus avec la même maison ajoute 15 % de risque de mutation négative chez les enfants (60 % au plus).
- Les blasons des maisons alliées sont rassemblés dans la **Galerie des alliances**. La généalogie garde trace des unions, et un héros uni à la lignée d'un autre joueur peut devenir « le Bien-Aimé ».

## 3. Feuille de route

| Version | Contenu |
|---|---|
| **0.1 (sortie)** | Tout ce qui précède. PWA, sauvegarde export/import, hors ligne jusqu'à 6 h (+2 h par niveau de Patience). |
| **0.2 (sortie)** | Chroniques (34 surnoms, Codex) et Alliances (maisons du comté, mariages entre joueurs par code, galerie). |
| 0.2.x | Sons et musique d'ambiance, haptique mobile, succès, statistiques détaillées. |
| 0.3 | **Ère** : un méta-prestige qui réinitialise bâtiments et Échos contre des « Reliques » (des Échos légendaires permanents). |
| 0.4 | Classement en ligne optionnel (backend léger) qui réutilise les codes vérifiables du Destin du jour. |
| 1.0 | Nouveaux biomes du Domaine, notifications push. |

## 4. Architecture technique

```
src/engine/   moteur pur, déterministe, testable sans DOM
  data.ts       toutes les données d'équilibrage
  sim.ts        noyau partagé (activité, vie, traits)
  game.ts       partie principale : tick, Échos, succession, achats, hors-ligne
  ecosystem.ts  Lotka-Volterra amorti + Harmonie
  epithets.ts   surnoms des Chroniques (règles, effets, Codex)
  alliances.ts  maisons du comté, mariages, codes d'alliance
  events.ts     calendrier déterministe + export .ics
  daily.ts      Destin du jour : setup, replay, codes vérifiables
  save.ts       sauvegarde locale versionnée, export/import
src/ui/       DOM natif + liaisons fines (pas de framework)
tests/        Vitest : unitaires + bot d'équilibrage
```
