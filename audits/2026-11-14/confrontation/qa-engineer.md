# Confrontation — QA Engineer (phase 2)

Commit `10324b4` (code du jeu identique à `6f47e27`). Serveur `vite preview --port 4173` arrêté à la fin. Aucune nouvelle campagne `npm run sim` : réutilisation de C101–C103, plus des scripts ciblés sur le vrai moteur.

## B4 — La sensibilité au pas `dt` change-t-elle une recommandation ?

**Je nuance.** C'est surtout un artefact du profil `optimiseur`, amplifié par le verrou de vocation. Il existe aussi un petit biais réel du moteur, propre à la chasse et à l'Affût.

1. **La partie est bimodale.** [SIMULÉ] C101–C103 (optimiseur, graines 1-30, 3 h). Une partie est dite « lignée de chasseurs » quand le héros chasse plus de 50 % du temps.

   | Pas | Lignées de chasseurs | log10 (chasseurs) | log10 (autres) |
   |---|---|---|---|
   | dt 0,1 | **10/30** | 7,73 | 7,94 |
   | dt 0,5 | **2/30** | 7,71 | 7,93 |
   | dt 1 | **2/30** | 7,74 | 7,92 |

   À état égal, une lignée de chasseurs vaut −0,21 log10, soit ×0,6. L'écart de valeur moyenne de l'optimiseur (−15,7 % selon DATA-07) vient donc **du changement de proportion entre les deux modes**, pas d'une production différente dans chaque mode.
2. **Le début de partie est le même aux deux pas.** [MESURÉ] `node --import ./lab/sim/register.mjs tests/qa/dt-optimiseur.ts` rejoue la règle de décision de l'optimiseur (`actNetValue` toutes les 1 s, contrainte de vocation). Les vocations des 3 premières vies sont identiques à dt 0,1 et 0,5 sur 27 graines sur 30. Au départ, la règle gloutonne choisit Chasser presque partout. La bascule se fait plus tard : un écart de quelques % sur `actNetValue` près d'une égalité, puis la règle « garder la vocation » verrouille la lignée.
3. **Le moteur a un petit biais réel contre la chasse aux grands pas.** [MESURÉ] `node --import ./lab/sim/register.mjs tests/qa/dt-chasse.ts` : 5 graines, héros et Échos chasseurs, 30 min, mêmes actions.

   | Pas | Valeur par rapport à dt 0,1 | Temps en Affût | Gibier minimum |
   |---|---|---|---|
   | dt 0,5 | **−1,1 à −1,8 %** | ≈ −1 point | ≈ −0,8 |
   | dt 1 | **−2,5 à −3,4 %** | ≈ −2 points | ≈ −1,7 |

   La cause probable est le pas d'Euler explicite du prélèvement sur le Gibier (`ecosystem.ts:229`), appliqué par blocs plus gros [HYPOTHÈSE sur ce mécanisme précis]. Pour une économie mixte, l'écart reste de ±0,2 % (rapport phase 1).
   - **Conséquence pour le jeu :** le hors-ligne (pas de 1 s) pénalise une lignée de chasseurs d'environ 3 % par rapport au jeu actif. Faible, mais cela nuance mon point fort « hors-ligne fidèle ».

**Conclusions qui doivent être revalidées à dt 0,1 avant toute correction :**
- tout ce qui touche à Chasser, à l'Affût, au Gibier, à l'Harmonie ou aux Prédateurs (BAL-05, GD-10, DATA-08 pour Chasseur) ;
- toute mesure fondée sur l'optimiseur, ou sur un profil dont l'activité dépend d'une valeur instantanée et d'un verrou de vocation ;
- les seuils de vocation (PBA-05).

**Ce qui peut rester à dt 0,5 :** les conclusions de valeur agrégée sur des profils à activité fixe. C'est cohérent avec BAL C201 (|Δ| ≤ 0,022 log10, Commercer domine 50/50 à dt 0,1).

**Recommandation outillage :** rapporter la proportion des deux modes (part de lignées de chasseurs) en plus de la moyenne, et utiliser 200 graines pour l'optimiseur (DATA-07). Ma priorité QA-08 reste **Moyenne** (outillage).

## B9 — Mutations : 11,4 % d'héritiers sans mutation (QA-05)

**Je confirme : l'écart s'explique entièrement par les deux tirages indépendants. Je requalifie : c'est le GDD qu'il faut corriger, pas le code.**

- [CODE] `game.ts:435` : `muts = (chance 0,85) + (chance 0,25 + 0,04·Bonne étoile)`. Donc P(0) = 0,15 × 0,75 = **11,25 %**. Avec Bonne étoile 5, P(0) = 0,15 × 0,55 = 8,25 %.
- [MESURÉ] Dans ma mesure, le parent n'a aucun trait, ni conjoint, ni Bénédiction. Un héritier sans trait est donc exactement un héritier sans mutation : les poids des mutations (≤ 3) tiennent toujours dans le budget de 6. Résultat : 1 707 / 15 000 = 11,38 %. L'attendu est 1 687,5 ± 38,7 (écart-type binomial) ; l'écart de +0,5 σ n'est pas significatif.
- [CODE] Le cas « vivier vide » cité par le Lead existe, mais il est marginal. La mutation est perdue seulement si tous les traits de la rareté tirée sont déjà candidats. Exemple : rareté 3 avec Élu et Éternel déjà hérités, `game.ts:440-441`. Il ne joue pas dans la mesure ci-dessus.
- **Requalification :** la règle « 85 % puis 25 % » est cohérente et réglée (Bonne étoile agit dessus). Le texte du GDD 2.3 est imprécis. Priorité **Moyenne → Faible** (documentation).
- **Correction proposée du GDD :** « d'aucune à deux mutations (au moins une dans 89 % des cas, deux dans 21 % ; Bonne étoile augmente la seconde) ».
- **Suite pour le test :** remplacer `BUG QA-05` (`test.fails`) par un test de fréquence, P(0) ∈ [10 %, 12,5 %] sans Bonne étoile, après validation du GD.

## PBA-01 — Onglet masqué : vérification e2e et cause racine commune avec QA-06

**Je confirme PBA-01 [MESURÉ].**
- Commande : `NODE_PATH=$(npm root -g) node tests/qa/e2e/onglet-masque.cjs http://localhost:4173/ 45` (build `6f47e27`, Chromium).
- **Onglet masqué 45 s :** jeu **+1,6 s pour 47,1 s réelles**. Pendant le masquage, `lastTick` avance de 37,1 s alors que le temps de jeu reste à +0,0 s.
- **Fil gelé 45 s, onglet visible (QA-06) :** jeu **+6,6 s pour 46,5 s réelles**.
- Limite de la mesure : Chromium sans écran garde la page « visible » derrière un autre onglet (vérifié : `bringToFront` ne change pas `visibilityState`). J'émule donc ce que fait un navigateur de bureau : `document.hidden`, événement `visibilitychange`, `requestAnimationFrame` suspendu, minuteries actives. Le throttling natif de Chrome après 5 min n'a pas été testé [HYPOTHÈSE : `setInterval` ralenti à 1/min ; l'écart vu reste < 60 s, donc la perte demeure].

**Même cause racine [CODE].** `state.lastTick` devrait vouloir dire « temps simulé jusqu'à ». Or il est réécrit à l'heure murale à trois endroits, sans que la simulation ait couvert ce temps :
- `save()` (`main.ts:58`), appelée par `setInterval` toutes les 10 s (`main.ts:114`) et à chaque masquage. C'est la cause de PBA-01.
- `tick(..., Date.now())` après une trame plafonnée (`main.ts:96`, `dtReal ≤ 5 s`, et `acc = 0` après 60 pas, `:106`). C'est la cause de QA-06 : le temps non simulé est effacé.
- Le seuil de 30 s de `catchUp` (`main.ts:65`) jette en plus tout écart plus court, ce qui aggrave les deux cas.

**Correction unifiée proposée :**
1. `save()` ne touche plus `lastTick` : supprimer `main.ts:58`. Seuls `tick` et le rattrapage font avancer `lastTick`.
2. Créer une seule fonction `advanceTo(now)` :
   - `gap = (now − state.lastTick)/1000` ;
   - si `gap ≤ 5 s` : pas fixes de 0,1 s, en ligne, comme aujourd'hui ;
   - sinon : `simulateOffline` sur `gap` (rapport affiché seulement si ≥ 30 s), puis `lastTick = now`.

   La boucle `loop` l'appelle à chaque trame au lieu de plafonner `dtReal`, et `visibilitychange` l'appelle au retour. Pour les écarts de moins de 30 s que `simulateOffline` refuse aujourd'hui (`game.ts:607`), faire des ticks de 1 s hors ligne (≤ 30 ticks).
3. Garder `rt.online = false` pendant le rattrapage : les événements ne comptent qu'en présence (GDD 1, Live-Ops), et un onglet masqué compte comme une absence.

**Effets secondaires :**
- Un rattrapage peut terminer la vie : la succession est alors en attente, comme hors ligne aujourd'hui.
- Pendant le Destin du jour, `rt.pauseLife` doit rester respecté.
- PBA-02 (horloge reculée → écart négatif) n'est pas corrigé par ce changement. Il faut ajouter `gap = max(0, gap)` et traiter PBA-02 à part.

**Test de régression qui prouvera la correction :**
- `tests/qa/e2e/onglet-masque.cjs`. Il échoue aujourd'hui (code de sortie 1). Après correction, il doit afficher deux `OK`, avec un temps de jeu ≥ 90 % du temps réel dans les deux cas (onglet masqué 45 s, fil gelé 45 s). Il faut aussi le relancer avec `45` → `120` pour couvrir plusieurs sauvegardes périodiques.
- En complément, côté moteur, si `advanceTo` est extraite dans un module pur : un test Vitest dans `tests/qa/offline.test.ts`. Avec `lastTick` à T, `advanceTo(T + 47 s)` doit simuler 47 ± 1 s, et rester inchangé si une sauvegarde intermédiaire a eu lieu.

**Priorité commune (A3) :** **Critique**. Je relève QA-06 de Moyenne à Critique en le fusionnant avec PBA-01 : c'est le même défaut, et le cas de l'onglet masqué est le geste le plus courant du joueur idle sur ordinateur.

## Fichiers ajoutés en phase 2
- `tests/qa/dt-optimiseur.ts`, `tests/qa/dt-chasse.ts` (B4) ;
- `tests/qa/e2e/onglet-masque.cjs` (PBA-01 / QA-06, régression).

`npm test` et `npx vitest run tests/qa` sont inchangés et verts : aucun fichier `*.test.ts` n'a été modifié.
