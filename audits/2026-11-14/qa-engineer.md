# Audit QA — Échos de Lignée (phase 1)

- **Agent** : QA Engineer · **Date** : 2026-11-14 · **Commit audité** : `6f47e27` (aucun changement de `src/`, `public/`, `index.html` jusqu'à `10324b4`, vérifié par `git diff --stat 6f47e27 HEAD -- src index.html public`)
- **Livrables** : ce rapport, `tests/qa/*.test.ts` (8 fichiers, 91 tests dont 7 `test.fails` marqués `// BUG QA-xx`), `tests/qa/helpers.ts`, `tests/qa/measure.ts`, `tests/qa/e2e/parcours.cjs`, `tests/qa/e2e/import-reset.cjs`, captures dans `tests/qa/e2e/captures/`.

## 1. Résumé et verdict

Le moteur est **solide** : sur des parties aléatoires longues (graines fixes, dt 0,1 / 0,5 / 1), aucun invariant n'est violé (ressources, Domaine, Échos, enregistrement 1 entrée/s), le déterminisme et le replay du Destin du jour tiennent sur 100 parties aléatoires, et le hors-ligne (pas 1 s) colle à l'en-ligne (pas 0,1 s) à ±0,2 %.
Les défauts graves sont **dans l'orchestration autour du moteur** : l'**import de sauvegarde et la réinitialisation ne fonctionnent pas** dans le navigateur (l'ancien état est réécrit pendant le rechargement), une **Bénédiction achetée pendant la succession est perdue**, et l'objectif d'événement peut tomber au minimum (6 ✦ en ~1 s).
Verdict : **non livrable en l'état pour la fonction sauvegarde (QA-10, Critique)** ; le reste est corrigible localement.

## 2. Périmètre et méthode

Exécuté :
- Lecture intégrale de `src/engine/*.ts`, `src/main.ts`, des flux UI concernés (`src/ui/app.ts` : succession, Bazar, paramètres, Destin ; `src/ui/legends.ts` : codes d'alliance), du GDD et des 61 tests existants.
- **Tests Vitest** dans `tests/qa/` (un fichier par thème) : invariants, déterminisme, sauvegarde, hors-ligne/pas, codes, cas limites, événements, conformité GDD.
- **Mesures** : `tests/qa/measure.ts` (hors-ligne vs en-ligne, pas, objectif d'événement, mutations).
- **Campagnes** C101–C103 (sensibilité au pas, `--workers=2`), consignées dans `lab/campaigns/CAMPAIGNS.md`.
- **Parcours Playwright Chromium** sur `vite preview --port 4173` (build de `6f47e27`) : iPhone 13 et desktop 1440 px — cérémonie, première vie, succession, onglets, export ; plus reproductions QA-01, QA-02, QA-06, QA-10. Serveur arrêté à la fin.

Non exécuté :
- Safari/WebKit et Firefox (seul Chromium est installé) → QA-11 reste une hypothèse.
- Mise en veille réelle d'une machine (QA-06 est reproduit par un gel du fil principal, pas par une vraie veille).
- PWA hors ligne / service worker, notifications, `.ics` dans un vrai agenda.
- Tests visuels fins (contraste, 44 px) : seulement l'absence de défilement horizontal.

## 3. Constats (triés par priorité)

### [QA-10] L'import de sauvegarde et la réinitialisation sont sans effet : l'ancien état est réécrit au rechargement
- **Priorité** : Critique
- **Domaine** : Sauvegarde / cycle de vie de la page
- **Description** : `replaceState` (import) écrit la sauvegarde importée puis appelle `location.reload()` ; `reset` efface la clé puis recharge (`src/main.ts:33-40`). Mais pendant ce rechargement, les gestionnaires `pagehide` et `visibilitychange` (`src/main.ts:115-119`) appellent `save()`, qui réécrit **l'état en mémoire** (l'ancienne partie) dans localStorage. Au rechargement, c'est l'ancienne partie qui revient.
- **Preuve / observation** : [MESURÉ] `node tests/qa/e2e/import-reset.cjs` (Chromium, `vite preview --port 4173`) : appareil A exporte la maison « Exportval », appareil B (partie fondée « Neuveval ») importe le code, confirme → après rechargement : *chargée « Neuveval », stockée « Neuveval »*. Réinitialisation confirmée → *intro=0, maison chargée « Neuveval »*. Aucune erreur JS : l'échec est silencieux. [CODE] `src/main.ts:37-39`, `:34-35`, `:115-119`.
- **Gravité** : la seule fonction de transfert/restauration de sauvegarde (« ordinateur → téléphone », texte des paramètres) est inopérante ; « Réinitialiser » ne réinitialise pas.
- **Impact sur l'expérience** : un joueur qui change d'appareil ou restaure une sauvegarde croit avoir importé et retrouve l'ancienne partie ; perte de progression de fait.
- **Probabilité que le problème soit réel** : Certaine dans Chromium (reproduit 2 fois) ; Forte ailleurs (`pagehide` est standard au rechargement).
- **Correction proposée** : un drapeau `leaving = true` posé par `replaceState`/`reset` avant `reload()`, testé dans `save()` ; ou, pour l'import, remplacer aussi l'état en mémoire (`state = s`) avant le rechargement.
- **Effets secondaires potentiels** : veiller à ce que le drapeau ne bloque pas la sauvegarde périodique si `reload()` échoue.
- **Méthode de vérification** : `node tests/qa/e2e/import-reset.cjs` doit afficher « Tout est OK » (code de sortie 0).

### [QA-01] Une Bénédiction achetée pendant la succession en attente est perdue
- **Priorité** : Élevée
- **Domaine** : Lignée / Bazar céleste
- **Description** : le Bazar reste ouvert pendant la succession (`src/ui/app.ts:771-780`, aucune condition) et `buyBlessing` l'accepte (`src/engine/game.ts:578`). Or les héritiers sont déjà tirés à la mort (`endLife → genHeirs`, `game.ts:372`) et `confirmSuccession` vide `s.blessings` (`game.ts:517`). Les Éclats sont débités, le trait n'apparaît ni chez l'héritier ni chez ses enfants.
- **Preuve / observation** : [MESURÉ] `npx vitest run tests/qa/limits.test.ts` (test `reproduction QA-01` vert, `BUG QA-01` en `test.fails`). [MESURÉ] navigateur, `node tests/qa/e2e/parcours.cjs` : achat d'« Élu » pendant la succession → `{"e":0,"b":["elu"],"succ":true}` ; après « Perpétuer la lignée » → `{"traits":["main_verte"],"b":[],"e":0}`.
- **Gravité** : perte sèche de 3 à 15 ✦ (monnaie rare), sans message.
- **Impact sur l'expérience** : frustration au moment exact où le joueur réfléchit à sa lignée ; incompréhensible sans lire le code.
- **Probabilité que le problème soit réel** : Certaine.
- **Correction proposée** : au choix (a) appliquer les Bénédictions achetées pendant la succession aux héritiers en attente (`sc.heirs`) ; (b) ne vider `s.blessings` que des Bénédictions déjà appliquées ; (c) désactiver l'achat pendant la succession avec un message.
- **Effets secondaires potentiels** : (a) change l'aperçu des héritiers dans la modale ouverte, à rafraîchir ; vérifier le budget génétique (Bénédictions hors budget).
- **Méthode de vérification** : retirer `.fails` du test `BUG QA-01` dans `tests/qa/limits.test.ts` → doit passer.

### [QA-03] L'objectif d'un événement tombe au minimum si son premier tick se fait avec un Runtime neuf
- **Priorité** : Moyenne
- **Domaine** : Monde partagé / événements
- **Description** : `ensureEventProgress` fixe l'objectif une fois pour toutes à partir de `rt.rate`, moyenne glissante de production (`src/engine/game.ts:256-262`). Au lancement du jeu, `rt` est neuf (`rate = 0`) ; si moins de 30 s séparent la dernière sauvegarde du lancement, il n'y a pas de rattrapage hors ligne pour réchauffer la moyenne (`src/main.ts:65`). Si l'événement commence à ce moment-là (fermer le jeu juste avant l'heure, le rouvrir juste après), l'objectif vaut 60 Vivres quelle que soit l'économie.
- **Preuve / observation** : [MESURÉ] `node --import ./lab/sim/register.mjs tests/qa/measure.ts`, Moisson dorée, parties de 2 h (graines 31/32/33) : objectif chaud **111 800 / 66 106 / 9 449**, Runtime neuf **60 / 60 / 60** ; palier Or atteint en **1,0 / 0,6 / 0,3 s** → +6 ✦. Test `tests/qa/events.test.ts` (`reproduction QA-03` vert, `BUG QA-03` en `test.fails`).
- **Gravité** : 6 ✦ par événement (6 événements/jour) obtenus sans jouer l'événement ; manipulation volontaire simple (horaires publics).
- **Impact sur l'expérience** : dévalue les paliers d'événement et le Bazar ; injuste pour les joueurs honnêtes.
- **Probabilité que le problème soit réel** : Forte pour l'exploit volontaire ; Faible pour un joueur ordinaire (fenêtre de quelques secondes).
- **Correction proposée** : calculer l'objectif à partir d'une mesure persistée dans l'état (ex. valeur produite sur la dernière vie / `stats`), ou différer la fixation de l'objectif tant que la moyenne n'est pas réchauffée (ex. 10 s), ou prendre `max(rt.rate, mesure persistée)`.
- **Effets secondaires potentiels** : ne pas rendre l'objectif inatteignable en début de partie (garder le plancher actuel).
- **Méthode de vérification** : retirer `.fails` de `BUG QA-03` (`tests/qa/events.test.ts`).

### [QA-04] Un même code d'alliance peut être accepté plusieurs fois (message de partage puis lien)
- **Priorité** : Moyenne
- **Domaine** : Alliances / codes
- **Description** : `decodeProposal` trouve le code n'importe où dans le texte collé (`src/engine/alliances.ts:357`), mais l'empreinte anti-réutilisation `codeKey` ne retire que ce qui précède `AL1-` sur la première ligne et rien après (`alliances.ts:404`). Le message de partage fait deux lignes (`src/ui/legends.ts:146`) : coller le message, puis ouvrir le lien `#mariage=CODE` (ou ajouter un caractère après le code) donne deux empreintes pour le même code.
- **Preuve / observation** : [MESURÉ] `npx vitest run tests/qa/codes.test.ts` : `codeKey(code + ' !') ≠ codeKey(code)`, `codeKey('texte\n' + code) ≠ codeKey(code)` ; deux `test.fails` `BUG QA-04` (message → lien, code + suffixe : la 2ᵉ acceptation réussit).
- **Gravité** : contredit le GDD 2.7 « Un code ne peut être accepté qu'une fois par lignée » ; permet de réépouser le même prétendant à volonté.
- **Impact sur l'expérience** : bénéfice borné (le prétendant reste plafonné, consanguinité croissante) ; nuit surtout à la promesse sociale.
- **Probabilité que le problème soit réel** : Certaine (mécanique) ; usage accidentel probable (le joueur colle le message puis clique le lien).
- **Correction proposée** : calculer `codeKey` sur la partie extraite par la même regex que `decodeProposal` (`AL1-<données>-<contrôle>`), voire sur `<données>` seul.
- **Effets secondaires potentiels** : les empreintes déjà stockées (`usedCodes`) d'anciens collages ne correspondront plus ; impact négligeable.
- **Méthode de vérification** : retirer `.fails` des deux tests `BUG QA-04`.

### [QA-05] ~11 % des héritiers n'ont aucune mutation, alors que le GDD en promet « une ou deux »
- **Priorité** : Moyenne
- **Domaine** : Lignée / conformité GDD
- **Description** : `genHeirs` tire la 1ʳᵉ mutation avec 85 % de chance et la 2ᵉ avec 25 % (`src/engine/game.ts:435`) ; P(aucune) = 0,15 × 0,75 = 11,25 %. GDD 2.3 : « d'une ou deux mutations ».
- **Preuve / observation** : [MESURÉ] `tests/qa/measure.ts` : parent sans trait, 15 000 héritiers → **1 707 sans aucun trait (11,38 %)**. `test.fails` `BUG QA-05` dans `tests/qa/gdd.test.ts`.
- **Gravité** : incohérence documentation/code, pas de plantage.
- **Impact sur l'expérience** : un héritier sur neuf sans nouveauté ; léger.
- **Probabilité que le problème soit réel** : Certaine (écart) ; l'intention reste à trancher (code ou GDD).
- **Correction proposée** : décision Game Design : soit corriger le GDD (« zéro à deux mutations, une le plus souvent »), soit garantir une mutation.
- **Effets secondaires potentiels** : garantir la mutation augmente la diversité génétique et la fréquence des traits négatifs communs ; à mesurer par le Balancer (`traitCombos60`).
- **Méthode de vérification** : selon la décision, test `BUG QA-05` vert, ou test réécrit sur le nouveau texte.

### [QA-06] Fil principal gelé, onglet visible : la progression de cette durée est perdue
- **Priorité** : Moyenne
- **Domaine** : Boucle de jeu / hors-ligne
- **Description** : la boucle plafonne le pas réel à 5 s (`src/main.ts:96`) et le rattrapage hors ligne n'est déclenché qu'au lancement ou au retour de visibilité (`main.ts:115-118`). Si l'onglet reste visible mais que le fil est suspendu (veille de l'ordinateur avec le jeu au premier plan, débogueur, gel du navigateur), seules 5 s sont simulées ; et `tick` réécrit `lastTick`, donc aucun rattrapage ultérieur.
- **Preuve / observation** : [MESURÉ] `node tests/qa/e2e/parcours.cjs` (desktop) : gel de 20 s du fil principal → **+7,1 s de jeu pour 22,0 s réelles** (2 s d'attente incluses). [HYPOTHÈSE] fréquence réelle : dépend de l'émission ou non de `visibilitychange` à la mise en veille selon l'OS/navigateur ; non testé sur une vraie veille.
- **Gravité** : perte jusqu'à toute une nuit de progression hors ligne pour un joueur desktop qui laisse le jeu ouvert.
- **Impact sur l'expérience** : très mauvais pour un idle game (« je l'ai laissé tourner et rien ne s'est passé »).
- **Probabilité que le problème soit réel** : Moyenne.
- **Correction proposée** : dans `loop`, si l'écart réel dépasse un seuil (ex. 5 s), appeler `catchUp()` (basé sur `Date.now() - state.lastTick`) au lieu de plafonner.
- **Effets secondaires potentiels** : un rattrapage déclenché en pleine partie affiche le rapport hors ligne ; vérifier l'interaction avec le Destin du jour (`rt.pauseLife`).
- **Méthode de vérification** : `parcours.cjs` → la vérification QA-06 doit passer (temps de jeu ≥ temps réel − 3 s).

### [QA-08] Les conclusions d'équilibrage sur la chasse dépendent du pas de simulation
- **Priorité** : Moyenne (outillage d'analyse, pas un bug du jeu)
- **Domaine** : Fiabilité des mesures `lab/sim`
- **Description** : le moteur est peu sensible au pas à actions identiques (±0,2 %), mais le profil `optimiseur` (décision gloutonne instantanée) change de stratégie selon `dt`.
- **Preuve / observation** : [SIMULÉ] C101/C102/C103 (`experimente,optimiseur`, graines 1-30, 3 h, sans événements ; hypothèses : profils heuristiques de `lab/sim/profiles.ts`) : optimiseur, temps héros à Chasser **35,5 % (dt 0,1)** contre **8,5 % (dt 0,5)** et **7,9 % (dt 1)** ; Échos chasseurs 33 % → 7 % ; pavillons 8,7 → 3,5 ; valeur totale quasi identique (log10 7,87 / 7,92 / 7,91), Héritage +2 à +3 %, 0 anomalie. [MESURÉ] à actions fixes (`tests/qa/measure.ts`, graines 21-23, 20 min) : dt 0,5/dt 0,1 = 0,999 à 1,001 ; dt 1/dt 0,1 = 0,998 à 1,001.
- **Gravité** : une campagne au pas par défaut (0,5) peut conclure que la chasse est délaissée alors qu'au pas réel elle est choisie par un tiers des parties.
- **Impact sur l'expérience** : indirect (risque de mauvais réglage de l'Affût).
- **Probabilité que le problème soit réel** : Forte (écart large, 30 graines).
- **Correction proposée** : toute conclusion sur Chasser/Affût doit être confirmée à `--dt=0.1` ; envisager `dt=0.1` par défaut pour les campagnes de référence.
- **Effets secondaires potentiels** : campagnes ~4× plus lentes.
- **Méthode de vérification** : relancer C101/C102 après un réglage et comparer `heroAct.chasser` avec `npm run sim:compare`.

### [QA-02] Une sauvegarde au héros incomplet est acceptée, puis fait planter le jeu à chaque lancement
- **Priorité** : Faible (aujourd'hui masquée par QA-10 ; remonte à **Élevée** dès que QA-10 est corrigé)
- **Domaine** : Sauvegarde / validation
- **Description** : `deserialize` n'exige que `v` numérique et `hero` présent (`src/engine/save.ts:399`). Un héros sans `traits` passe, puis `startLife → sumMods(undefined)` lève une exception au lancement (`src/main.ts:85`, `src/engine/sim.ts:66`) : écran vide (barre d'onglets seule), boucle jamais démarrée.
- **Preuve / observation** : [MESURÉ] `tests/qa/save.test.ts` (`reproduction QA-02` : `startLife` lève « not iterable » ; `BUG QA-02` en `test.fails`). [MESURÉ] navigateur (`parcours.cjs`, sauvegarde placée dans localStorage avant chargement) : `pageerror: e is not iterable`, `window.krazy` absent, plantage persistant au rechargement (capture `tests/qa/e2e/captures/qa02-lancement.png`).
- **Gravité** : partie précédente remplacée par une partie injouable ; seul recours, vider le stockage du site à la main.
- **Impact sur l'expérience** : bloquant, mais nécessite une sauvegarde malformée (collage tronqué au bon endroit, édition manuelle, autre jeu).
- **Probabilité que le problème soit réel** : Faible tant que QA-10 empêche tout import ; Moyenne ensuite.
- **Correction proposée** : valider la structure dans `deserialize` (héros : `traits` tableau, `gen`, `id` ; `echoes`/`ancestors` tableaux ; nombres finis) et refuser sinon ; au lancement, attraper l'exception et proposer « réinitialiser / importer ».
- **Effets secondaires potentiels** : une validation trop stricte refuserait d'anciennes sauvegardes légitimes — la tester avec les cas de migration de `tests/qa/save.test.ts`.
- **Méthode de vérification** : `BUG QA-02` vert ; tests de migration toujours verts.

### [QA-07] « Jamais par sa propre maison » se contourne en ré-signant le code sous un autre identifiant
- **Priorité** : Faible
- **Domaine** : Alliances / codes
- **Description** : le refus repose sur l'identifiant de maison écrit dans le code (`src/engine/alliances.ts:412`) ; le sel du contrôle est dans le client (`alliances.ts:317`). Un code de son propre cadet ré-signé sous un autre id est accepté : ses dons reviennent comme « sang neuf » (usure 0).
- **Preuve / observation** : [MESURÉ] `test.fails` `BUG QA-07` dans `tests/qa/codes.test.ts` (cadet Élu + Centenaire de la maison, `houseId` remplacé → union acceptée).
- **Gravité** : contourne l'usure du sang ; reste borné (un légendaire, 4 traits, vocation +2).
- **Impact sur l'expérience** : nul pour le joueur ordinaire ; exploitable par un joueur technique, sans effet sur les autres joueurs.
- **Probabilité que le problème soit réel** : Certaine (mécanique), le GDD reconnaît que les codes peuvent être fabriqués.
- **Correction proposée** : comparer aussi les cadets connus (`s.cadets`, ancêtres) par contenu (nom + gén. + traits) ; ou accepter le risque et le documenter.
- **Effets secondaires potentiels** : faux positifs rares (homonymes).
- **Méthode de vérification** : `BUG QA-07` vert.

### [QA-09] Avec deux Bénédictions, un héritier porte jusqu'à 6 traits (« 4 traits au maximum »)
- **Priorité** : Faible
- **Domaine** : Lignée / conformité GDD
- **Description** : les Bénédictions sont ajoutées après `expressGenome` (`src/engine/game.ts:444`), donc au-delà de la limite de 4. Le GDD dit « hors budget » sans préciser si la limite de 4 traits s'applique.
- **Preuve / observation** : [MESURÉ] `tests/qa/gdd.test.ts`, test « comportement actuel QA-09 » : maximum observé **6** traits.
- **Gravité** : ambiguïté documentaire ; l'UI et les codes supposent souvent ≤ 4.
- **Impact sur l'expérience** : faible.
- **Probabilité que le problème soit réel** : Moyenne (dépend de l'intention).
- **Correction proposée** : préciser le GDD (« les Bénédictions s'ajoutent aussi hors de la limite de 4 ») ou plafonner.
- **Effets secondaires potentiels** : —
- **Méthode de vérification** : mettre à jour le test selon la décision.

### [QA-11] Le score du Destin du jour pourrait différer d'un moteur JavaScript à l'autre
- **Priorité** : Faible
- **Domaine** : Destin du jour / codes vérifiables
- **Description** : le replay utilise `Math.log`, `Math.exp`, `Math.pow`, `Math.sqrt` (`src/engine/ecosystem.ts:247-255`, `src/engine/data.ts:66`, `src/engine/sim.ts:22`). Seul `sqrt` est garanti correctement arrondi par la norme ; les autres peuvent différer d'un ulp entre V8, SpiderMonkey et JavaScriptCore, et le score est tronqué (`Math.floor`).
- **Preuve / observation** : [HYPOTHÈSE] non testé (seul Chromium disponible). [MESURÉ] dans un même moteur, 100 parties aléatoires sur 10 dates rejouent au point près (`tests/qa/determinism.test.ts`).
- **Gravité** : un code honnête affiché « non vérifié » chez un ami sur un autre navigateur.
- **Impact sur l'expérience** : sape la promesse « vérifiable par n'importe qui ».
- **Probabilité que le problème soit réel** : Faible.
- **Correction proposée** : mesurer d'abord (rejouer les mêmes codes sous WebKit/Firefox via Playwright) ; si écart, tolérance de ±1 point ou fonctions mathématiques maison.
- **Effets secondaires potentiels** : une tolérance rend possibles des codes gonflés d'un point.
- **Méthode de vérification** : installer WebKit/Firefox pour Playwright et vérifier les codes générés par `tests/qa/determinism.test.ts`.

## 4. Points forts (à ne pas casser)

- **Invariants** [MESURÉ] (`tests/qa/invariants.test.ts`) : 6 graines × 2 h (dt 0,5), 20 min à dt 0,1 avec événement, 1 h à dt 1 avec changements frénétiques et pauses : 0 ressource négative/NaN/Infinity, Domaine dans ses bornes, Héritage ≤ total, Échos ≤ emplacements, `rec.length = floor(t)`, `Σ timeIn = t`, aucune entrée -1 enregistrée.
- **Déterminisme** [MESURÉ] : même graine → même JSON après 1 h ; reprise depuis une copie sérialisée identique ; 100 replays du Destin exacts ; codes trafiqués (score, date, action) refusés ; codes malformés → `null` sans exception ; 100 000 actions vérifiées en temps borné.
- **Hors-ligne fidèle** [MESURÉ] : ratio hors ligne/en ligne sur 30 min = 0,9998 à 1,0022 (8 graines) ; enregistrement exact de `dur` entrées pour dt 0,1 / 0,25 / 0,3 / 0,5 / 0,7 / 1 ; plafond 6 h + 2 h/Patience respecté ; aucun événement compté hors ligne.
- **Sauvegarde (moteur)** [MESURÉ] : aller-retour exact en pleine vie, en succession en attente, avec alliances/cadets/codes ; UTF-8 et emojis ; migration d'une sauvegarde privée de `hunt`, `alliances`, `sex`, `wear`, `st`, `lastAct`, `baseValue` jouable.
- **Plafonds** [MESURÉ] : Clepsydre 15, Crypte 6 (8 emplacements), vocation X, 300 ancêtres, 8 cadets, 6 héritiers, Temps suspendu 1×/vie, achats à coût exact.
- **Codes d'alliance** [MESURÉ] : champs hostiles neutralisés (balises, couleur, rang, génération), maison `pnj:` usurpée refusée, bornes (Bazar, 1 légendaire, 4 traits, vocation +2).
- **GDD** [MESURÉ] (`tests/qa/gdd.test.ts`) : budget 6 et poids, usure 6 %/plancher 0,3, transmission 50 %, Harmonie ×0,7–×1,3, vigueur 0,55–1,13, Affût 60 %/95 %/3 %/80 %/1,5 Or/3/0,5 %, Garde 0,4 %/s, calendrier 0/4/8/12/16/20 h × 45 min, 34 surnoms, dot 2 %/50/moitié, consanguinité 15 %→60 %, Héritage en racine cubique, 11 améliorations.
- **Navigateur** [MESURÉ] (Chromium) : iPhone 13 et 1440 px — cérémonie, vie, succession, 5 onglets (mobile) / 3 (desktop), export lisible, aucun défilement horizontal, **aucune erreur console** ; 30/31 vérifications OK (l'échec est QA-06).

## 5. Questions ouvertes / mesures à faire

1. QA-05 et QA-09 : trancher l'intention (GDD ou code) avec le Game Designer.
2. QA-06 : vérifier sur une vraie veille (macOS/Windows, Chrome/Safari) si `visibilitychange` est émis.
3. QA-11 : rejouer des codes sous WebKit et Firefox.
4. Le cadet n'est pas consommé quand on le propose : on peut le proposer indéfiniment (nouveau `nonce` à chaque affichage, `src/ui/legends.ts:141`). [CODE] Intention à confirmer.
5. Pendant le Destin du jour, masquer l'onglet met le défi en pause (rAF arrêté, `src/main.ts:96-117`), alors que le GDD dit « temps réel, sans pause ». [CODE] Sans effet sur le score, à documenter ou à corriger.
6. Après correction de QA-10, re-tester QA-02 par la vraie interface d'import.

## 6. Annexes

État des suites (commit `10324b4`, code du jeu identique à `6f47e27`) :
- `npm test` : **13 fichiers, 145 réussis + 7 échecs attendus (`test.fails`), 0 échec** — vert.
- `npx vitest run tests/qa` : **8 fichiers, 84 réussis + 7 échecs attendus** — vert.
- `npm run typecheck` : OK.

Commandes pour rejouer chaque preuve :
| Constat | Commande |
|---|---|
| QA-01, QA-02, QA-03, QA-04, QA-05, QA-07, QA-09 | `npx vitest run tests/qa` (tests `BUG QA-xx` en `test.fails` + tests `reproduction QA-xx`) |
| QA-03, QA-05, hors-ligne, pas | `node --import ./lab/sim/register.mjs tests/qa/measure.ts` |
| QA-01, QA-02, QA-06 (navigateur) | `npm run build && npx vite preview --port 4173 --strictPort` puis `node tests/qa/e2e/parcours.cjs http://localhost:4173/` (captures et `resultats.json` dans `tests/qa/e2e/captures/`) |
| QA-10 (navigateur) | même serveur, puis `NODE_PATH=$(npm root -g) node tests/qa/e2e/import-reset.cjs http://localhost:4173/` (code de sortie 1 = bug présent) |
| QA-08 | `npm run sim -- --profiles=experimente,optimiseur --seeds=1-30 --hours=3 --dt=0.1 --workers=2 --id=C101-qa-dt0.1` (idem `--dt=0.5` → C102, `--dt=1` → C103) puis `npm run sim:compare -- lab/results/C101-qa-dt0.1/summary.json lab/results/C102-qa-dt0.5/summary.json` |

Résultats : `lab/results/C101-qa-dt0.1/`, `lab/results/C102-qa-dt0.5/`, `lab/results/C103-qa-dt1/` ; ligne ajoutée dans `lab/campaigns/CAMPAIGNS.md`.

Graines : invariants 1-6, 9, 42, 77 ; déterminisme 5, 6, 8 ; hors-ligne 1-8 ; pas 21-23 ; événements 31-33 ; mutations Rng(123). Horloge simulée : lundi 16/11/2026 (`T0` = 2 h UTC, hors événement).
