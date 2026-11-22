# Chantier B — Inventaire des seuils et chiffres indicatifs

*Game Designer · 2026-11-22 · code inventorié : `00219a1` (`src/` propre) · rien n'est modifié dans `src/` ni dans le GDD.*

**Contexte décidé avec le propriétaire.** On retire l'écosystème (Domaine Flore/Gibier, Harmonie ×0,7–1,3, Garde forestier) et les consignes Semer, Équilibre et Battue. Récolter (id `cultiver`) devient une activité simple. On recalibre ensuite les seuils, puis on ajoute du contenu de fin de partie. **Principe retenu :** la complexité future doit agir sur la **lignée** (traits, surnoms, Échos, hauts faits), pas sur la production immédiate. La compensation économique de l'Harmonie est mesurée par le game-balancer : ce document ne la refait pas.

**Étiquettes.** [CODE] lu dans le code ; [SIMULÉ] profils automatiques (pas de vrais joueurs) ; [MESURÉ] exécution déterministe du moteur hors profils ; [HYPOTHÈSE] non vérifié.

**Sources de mesure**

- **SEUILS-B** (nouvelle campagne, ce chantier) : `lab/design/seuils-mesure.ts`.
  - 10 profils × 200 graines × 6 h, dt 0,5, sans événements (`evenementiel` avec événements).
  - Plus `experimente`, `optimiseur`, `mono-cultiver` et `evenementiel` (avec événements) × 40 graines × 24 h.
  - Sorties dans `lab/design/seuils/*.json`. Le script évalue, vie par vie, chaque condition de surnom, de maturation et de haut fait au moment de la mort, avec les règles du moteur.
- **Générations par heure** : `lab/design/seuils-genh.ts`, 30 graines.
- **Références** : `T04-lot-sans` et `T04-lot-avec` (`lab/baselines/`), `lab/balance/terre/RESULTATS.md`, `lab/balance/evo/RESULTATS.md`, `lab/balance/commande/resultats.md`, `audits/2026-11-14/`.

**Repères de temps [SIMULÉ, `seuils-genh.ts`, médiane de 30 graines]** (pour lire les seuils en minutes de jeu)

| Profil | 1 h | 2 h | 3 h | 4 h | 5 h | 6 h |
|---|---|---|---|---|---|---|
| `experimente` | gén. 40 | 68 | 93 | 117 | 140 | 162 |
| `debutant` | 33 | 58 | 81 | 102 | 123 | 142 |
| `occasionnel` | 16 | 16 | 16 | 16 | 28 | 28 |

**Colonnes des tableaux**

- **Dom.** : le seuil dépend-il du Domaine ?
- **Pertinence 0.2.2→0.4** : vie longue R13, Bénédictions, Éclats au Bazar (R9), Éclipse, dons qui mûrissent, fusion Récolter, etc.
- **Verdict** :
  - **G** garder ;
  - **R** régler (valeur à recalibrer) ;
  - **S** supprimer ;
  - **W** réécrire (la condition ou l'effet change de nature).

---

## 1. Inventaire

### A. Vie, activités, déblocages

| # | Seuil | Valeur | Fichier:ligne | Ce seuil sert à… | Dom. | Pertinence 0.2.2→0.4 (preuve) | Verdict | Mesure après simplification |
|---|---|---|---|---|---|---|---|---|
| A1 | Durée de vie de base | 60 s, plancher 20 s | `game.ts:113-116` | La boucle courte (pilier 1) | non | Les bonus communs l'allongent : Sève éternelle +96 s, Clepsydre +60 s. La « vie normale » dépasse donc 200 s en fin de partie [CODE] | G | Durée moyenne d'une vie (KPI 60–200 s, non collecté par le runner) |
| A2 | Déblocage de Commercer | 40 Vivres produits | `data.ts:60` | Première nouveauté (< 1 min) | non | p50 19–20 s, tous profils [SIMULÉ, T04-lot-sans] | G | Dépend du rendement de Récolter sans Harmonie : vérifier p90 ≤ 60 s |
| A3 | Déblocage d'Étudier | 40 Or produits | `data.ts:61` | Deuxième nouveauté | non | exp. 55 s ; débutant 307 s ; l'optimiseur ne le débloque jamais (artefact du profil, déjà connu) [SIMULÉ] | G | p90 débutant ≤ 1 800 s |
| A4 | Déblocage de Méditer | 20 Savoir produits | `data.ts:62` | Troisième nouveauté | non | exp. 331 s ; débutant 905 s [SIMULÉ]. Le KPI visait p90 ≤ 300 s (0.2.1 : 93 s) : régression depuis R10 et TERRE-4, non signalée en rouge | R | `unlock.mediter` p90 expérimenté ≤ 300 s : abaisser à 15 Savoir ou remonter Étudier |
| A5 | Rendements de base | Récolter 1,2 Vivres ; Commercer 1,25 Or pour 3 Vivres ; Étudier 0,6 Savoir pour 2 Or ; Méditer 0,1 Essence | `data.ts:39-54` | L'équilibre entre métiers (« ×5,4 de valeur » selon le GDD) | **oui** (Récolter × `ecoFactor`, et l'Harmonie sur toutes les activités) | Écart mono 6 h : Récolter 8,877, Méditer 8,871, Commercer 8,821, Étudier **8,080** (log10). Étudier vaut ×0,16 de Récolter, contre ~20 % annoncés dans le GDD [SIMULÉ, T04-lot-sans, moyennes] | R | Travail du game-balancer (compensation de l'Harmonie). Ici : écart des vocations ≤ ×5 et Étudier ≥ 30 % du meilleur |
| A6 | Valeurs des ressources | 1 / 2 / 8 / 20 | `data.ts:5-10` | Unité commune de la valeur (Héritage, records, événements) | non | Pivot de tous les seuils relatifs [CODE] | G | — |
| A7 | Consommation des convertisseurs | ×√puissance | `sim.ts:24` | Freiner les convertisseurs puissants | non | « Négligeable » selon l'audit 2026-11-14 (P7) [SIMULÉ] | G | — |
| A8 | Pause | aucune ; ne survit pas à la fermeture | `game.ts:192-210` | Le choix de tempo (pilier 1) | non (texte « le Domaine se repose » : `app.ts:376,433`) | `pausedShare` = 0 pour tous les profils : jamais mesurée en jeu [SIMULÉ] | G (texte W) | Retirer « le Domaine se repose » des deux textes. Aucun seuil à mesurer |

### B. Vocation

| # | Seuil | Valeur | Fichier:ligne | Ce seuil sert à… | Dom. | Pertinence | Verdict | Mesure après |
|---|---|---|---|---|---|---|---|---|
| B1 | Part de vie pour la vocation | 50 % | `game.ts:361`, `endLife` `:409` | Spécialiser une vie (mémoire, pilier 2) | non | La jauge est visible dès la 2ᵉ génération [CODE] | G | — |
| B2 | Bonus par rang | +20 %, rang max X (×3) | `data.ts:197-198`, `sim.ts:70` | La boucle longue des métiers | non | `vocationTierMax` = 10 pour les spécialistes, 3 pour l'expérimenté (il tourne tous les 3 gén.) [SIMULÉ] | G | — |
| B3 | Perte de rang si non entretenue | −1 rang | `game.ts:442` | Rendre la vocation fragile (une vie compte) | non | — | G | — |
| B4 | Chance de transmission | 60 % + 8 %/niv. Transmission (≤ 95 %) | `game.ts:542` | Une part de hasard dans l'héritage | non | Cachée au joueur (GDD 2.1) [CODE] | G | Candidat à l'affichage (réserve R-1) |
| B5 | Niveaux de départ dus à la vocation | ⌊rang/2⌋ | `game.ts:123` | Valoriser le rang hérité | non | — | G | — |
| B6 | Union de métier | +1 rang 35 % ; vocation du conjoint 40 % si le parent n'en a pas (rang −1) | `game.ts:546-548` | Récompenser une alliance assortie | non | Les profils ne se marient pas (`married` = 0) : jamais mesuré [SIMULÉ] | G | Profil marié |
| B7 | « Maître » (seuil des dons supérieurs) | rang VI | `evolution.ts:181` | Faire de la vocation le carrefour des légendaires | non | Les mono atteignent X, l'expérimenté III : l'expérimenté n'obtient jamais Sang doré par sa forme mûrie [SIMULÉ] | G | Part des lignées non spécialisées qui atteignent VI en 6 h |

### C. Compétences et XP

| # | Seuil | Valeur | Fichier:ligne | Ce seuil sert à… | Dom. | Pertinence | Verdict | Mesure après |
|---|---|---|---|---|---|---|---|---|
| C1 | XP vers le niveau suivant | 5·1,3ⁿ | `data.ts:66` | La montée pendant une vie | non | — | G | — |
| C2 | Multiplicateur de niveau | 1 + 0,25·n + 0,01·n² | `data.ts:67` | La valeur d'une vie longue (R13) | non | Une vie longue a « ≈ +50 % de moyenne » (GDD 2.2) | G | — |
| C3 | XP quand les intrants manquent | 25 % + 75 %·fraction réalisée | `sim.ts:87` | Ne pas tout perdre faute d'intrants | non | — | G | — |
| C4 | Bibliothèque | +10 % d'XP/niv. | `game.ts:96` | Le rôle secondaire d'Étudier | non | — | G | — |

### D. Échos et Crypte

| # | Seuil | Valeur | Fichier:ligne | Ce seuil sert à… | Dom. | Pertinence | Verdict | Mesure après |
|---|---|---|---|---|---|---|---|---|
| D1 | Puissance de base d'un Écho | 40 % | `game.ts:57` | Le cœur du jeu (pilier 1) | non | Les Échos font 87–95 % de la production [SIMULÉ, `echoShare` T04] | G | `echoShare` ±3 points (l'Harmonie s'appliquait aussi aux Échos) |
| D2 | Mémoire du sang | +15 %/niv. | `game.ts:57`, `data.ts:246` | La boucle longue | non | — | G | — |
| D3 | Sanctuaire | +10 % de puissance des Échos/niv. | `game.ts:57` | Le rôle secondaire de Méditer | non | — | G | — |
| D4 | Plancher de force propre | 0,2 | `game.ts:64` | Un Écho Maudit reste utile | non | — | G | — |
| D5 | Emplacements | 2 + Crypte (max 6, donc 8) ; coût 12·2,6ⁿ (12, 32, 82, 211, 549, 1 426 ⚜️) | `game.ts:127-129`, `data.ts:247` | Le choix à chaque succession | non | `upg.crypte` p50 = 3 (5 emplacements) à 6 h pour l'expérimenté [SIMULÉ] | G | — |
| D6 | Pression d'un Écho sur le Domaine | 0,6 × (1 + ½·ln puissance) | `sim.ts:18`, `ecosystem.ts:161` | « Les Échos de fin de partie pèsent sur le Domaine » | **oui** | Sans effet sur le classement, selon l'audit (P12) | **S** | — |
| D7 | Étoile filante | 0,2 % + 0,04 %/niv. par succession ; Échos ×2 | `data.ts:194-195`, `game.ts:71-73` | Un événement rare de la lignée | non | Proposée dans 32–39 % des parties en 6 h (GDD) | G | Taux de proposition inchangé |

### E. Héritage et arbre de Lignée

| # | Seuil | Valeur | Fichier:ligne | Ce seuil sert à… | Dom. | Pertinence | Verdict | Mesure après |
|---|---|---|---|---|---|---|---|---|
| E1 | Formule de l'Héritage | ⌊∛(valeur/20) × √(durée/durée normale)⌋ | `game.ts:141-143`, `:415-416` | La boucle de prestige ; R13 (vie longue) | indirect (la valeur inclut l'Harmonie) | R13 : rouge accepté « à confirmer » (optimiseur +15,5 % d'Héritage). Toujours pas confirmé par le propriétaire [CODE + CHANGELOG] | R | `legacyTotal` par profil contre T04 ; le diviseur 20 se recale si la valeur baisse |
| E2 | Prospérité | ×1,12/niv., 3·1,45ⁿ | `data.ts:244` | Le puits d'Héritage sans plafond | non | — | G | — |
| E3 | Sève éternelle | +8 s/niv., max 12, 4·1,65ⁿ (2 504 ⚜️ au total) | `data.ts:245` | Allonger la vie | non | Elle n'entre pas dans `durRatio` (R13), elle allonge donc la vie sans Héritage en plus [CODE] | G | — |
| E4 | Éveil précoce | +1 niv./niv., max 6, 10·2,2ⁿ | `data.ts:248` | Accélérer le début de vie | non | — | G | — |
| E5 | Transmission | +8 %/niv., max 5 (161 ⚜️) | `data.ts:249` | La lignée (pilier 2) | non | — | G | — |
| E6 | Sang fécond | +1 enfant, max 3, 9·2,8ⁿ | `data.ts:250` | Le choix de l'héritier | non | Jusqu'à 6 héritiers au plus (`game.ts:480`) | G | — |
| E7 | Bonne étoile | max 5, 8·2,1ⁿ ; agit sur les mutations, la maturation et la Nova | `data.ts:251` | La chance de la lignée | non | — | G | — |
| E8 | Patience | +2 h hors ligne/niv., max 9 (24 h) | `data.ts:252`, `game.ts:131` | Le joueur à sessions | non | — | G | — |
| E9 | **Alliances** | 45 ⚜️ | `data.ts:253` | Ouvrir le lien social | non | **Critère de R12 « p50 ≤ 90 min » non atteint.** SEUILS-B, p50 [p10–p90] : exp. **161 min** [146–176] ; débutant 191 ; optimiseur 101 ; mono 117–135 ; occasionnel jamais en 6 h [SIMULÉ]. Cause [CODE] : les profils achètent d'abord tout ce qui est abordable ; l'épargne n'est pas modélisée | **R** | Voir § 3.5 |
| E10 | **Chroniques** | 90 ⚜️ | `data.ts:254` | Ouvrir les surnoms, le Codex, les hauts faits et l'Almanach (l'onglet Codex reste caché avant, `nav.ts:59`) | non | exp. **287 min** [274–302] ; débutant 307 ; événementiel 259 ; optimiseur 165 ; mono 180–243 [SIMULÉ]. Les hauts faits et l'Almanach sont gagnés avant mais **invisibles** jusqu'à cet achat [CODE] | **R** | p50 exp. ≤ 180 min ; montrer les hauts faits sans les Chroniques |
| E11 | Plafond de l'historique | 300 ancêtres | `game.ts:609` | Limiter la sauvegarde | non | Millénaire (génération 1 000) reste lisible, car le compteur `gen` est à part | G | — |

### F. Génétique : budget, usure, mutations

| # | Seuil | Valeur | Fichier:ligne | Ce seuil sert à… | Dom. | Pertinence | Verdict | Mesure après |
|---|---|---|---|---|---|---|---|---|
| F1 | Héritage d'un trait parental | 50 % + 8 %/niv. + trait (≤ 95 %) | `game.ts:481,504` | Le cœur de la génétique | non | — | G | — |
| F2 | Trait négatif transmis | 30 % | `game.ts:504` | Les mauvais présages persistent | non | — | G | — |
| F3 | Trait du conjoint | ×0,8, sans les traits du Bazar | `game.ts:518` | Le sang neuf | non | Jamais exercé par les profils [SIMULÉ] | G | Profil marié |
| F4 | Budget génétique | 6 ; poids 1/1/2/3/4 ; 4 traits au plus (+2 Bénédictions) | `data.ts:156-158`, `game.ts:567-580` | Forcer un choix entre légendaires | non | Invisible au joueur (P19) ; diversité 34–53 combinaisons sur 60 générations [SIMULÉ, `traitCombos60` T04] | G (affichage W) | `traitCombos60` ≥ 20 |
| F5 | Part de hasard dans l'expression | priorité = poids + 2,5·aléa | `game.ts:570` | Chaque enfant est une combinaison différente | non | — | G | — |
| F6 | Usure du sang | −6 %/génération, plancher ×0,3 ; une union la divise par 2 | `data.ts:167-171`, `game.ts:494` | Faire tourner les dons ; donner du poids aux unions | non | Mesure du bot : 27–30 combinaisons contre 2–5 avant (GDD 2.3) | G | — |
| F7 | Nombre de mutations | 1 à 85 % ; une 2ᵉ à 25 % + 4 %/niv. | `game.ts:527` | Une nouveauté à chaque génération | non | 11,25 % des héritiers sans mutation, comme attendu (B9) | G | — |
| F8 | Raretés d'une mutation | 64/30/6/0 ; Bonne étoile −4/+3/+1 | `data.ts:180-182` | Le légendaire se mérite par la maturation | non | Successions proposant un légendaire : 66 → 1 % (exp.) [SIMULÉ, EVO] | G | — |
| F9 | Mutation négative | Commun 30 % − 5 %/niv. (≥ 5 %) ; Rare 12 % | `game.ts:530` | Les mauvais présages | non | — | G | — |
| F10 | Consanguinité | +15 % par union de trop, max 60 % | `alliances.ts:126` | Varier les maisons | non | Jamais exercée par les profils [SIMULÉ] | G | Profil marié |
| F11 | Trait **Harmonieux** | Rare, « impact écologique −40 % » | `data.ts:130` | Protéger le Domaine | **oui** | Sans Domaine, il ne fait plus rien. Il est tiré au Destin du jour (`daily.ts:78`), offert comme don de la semaine (`alliances.ts:63`) et vendu au Bazar (Rare, 3 ✦) [CODE] | **W** | Garder l'identifiant (les tirages du Destin et des maisons ne changent pas), changer l'effet (§ 2.6) |
| F12 | Mod `eco` des traits ; plancher d'impact | `eco` ; plancher 0,3 | `data.ts:76`, `game.ts:102-105`, `sim.ts:56` | Le Domaine | **oui** | — | **S** | — |
| F13 | Traits de vie | Robuste +8, Longévité +15, Centenaire +30, Éternel +45 s ; Fragile −8 | `data.ts:123-140` | Une vie longue donne un meilleur Écho (R13) | non | Avec les bonus communs (> 200 s), +8 s pèse moins de 4 % [CODE] | R | Remesurer la valeur d'Héritage des traits de vie (`lab/balance/traits.ts`) |

### G. Dons qui mûrissent (`evolution.ts`)

Taux de maturation = vies où la condition est remplie, sur les vies qui portent le don [SIMULÉ, SEUILS-B, 6 h].

| # | Seuil | Valeur | Fichier:ligne | Ce seuil sert à… | Dom. | Pertinence | Verdict | Mesure après |
|---|---|---|---|---|---|---|---|---|
| G1 | Chance de maturation | 25 % + 8 %/niv. ; ×0,5 vers le légendaire ; ≤ 95 % | `data.ts:189-192`, `game.ts:508` | Le légendaire comme événement | non | Légendaire par maturation : 16–58 % des parties (GDD) | G | — |
| G2 | Dons d'activité → forme mûrie | pratiquer l'activité ≥ 50 % de la vie | `evolution.ts:184` | Lier le don au métier | non | Main verte → Sève : 24 % (exp.) à 100 % (opti.) | G | — |
| G3 | Forme mûrie → Sang doré | ≥ 50 % de la vie et vocation VI | `evolution.ts:185` | Le carrefour épique | non | Sève → Sang doré : 93 % (mono-cultiver), 0 chez l'expérimenté (vocation III) | G | — |
| G4 | **Robuste → Longévité** | santé moyenne du Domaine ≥ 95 % | `evolution.ts:193` | « Vivre dans un Domaine sain » | **oui** | La condition ne mesure pas la sagesse mais le métier : **100 %** chez les non-paysans (exp., mono-commercer, mono-etudier, mono-mediter), **3,7 %** (optimiseur) et **15,7 %** (mono-cultiver) chez les paysans. Elle exclut donc les paysans au lieu de récompenser une conduite | **W** | § 2.1 |
| G5 | **Longévité → Centenaire** | santé jamais < 90 % et moyenne ≥ 97 % | `evolution.ts:194` | « Ne jamais troubler le Domaine » | **oui** | 99,4 % (exp.), 100 % (mono non paysans) ; **0,2 %** (opti.), 13 % (mono-cultiver) | **W** | § 2.1 |
| G6 | **Centenaire → Éternel** | record ×1,5 et santé jamais < 90 % | `evolution.ts:201` | Le légendaire de la vie longue | **oui** | 3,5 % (exp.) ; 0,9 % (opti.) : c'est le record qui tranche, l'Harmonie ne retire que les paysans | **W** | § 2.1 |
| G7 | Curieux → Prodige | ≥ 3 activités (10 % chacune) | `evolution.ts:195` | Récompenser la variété | non | 3,5 % (exp.) : l'expérimenté se spécialise par vie | R | Sans changement de mécanique : regarder le taux après la simplification |
| G8 | Prodige → Génie ; Écho vibrant → Mémoire | Étudier ≥ 50 % ; Méditer ≥ 50 % | `evolution.ts:196,198` | — | non | 22 % ; 23 % (exp.) | G | — |
| G9 | Polyvalent → Sang doré | 4 activités | `evolution.ts:197` | La variété | non | ≈ 0,8 % (débutant) | R | Idem G7 |
| G10 | Génie ou Sang doré → Élu | record ×1,5 et vocation VI | `evolution.ts:199-200` | Le sommet | non | ~1 % des porteurs | G | — |
| G11 | Mémoire → Éternel | record ×1,5 et Méditer ≥ 50 % | `evolution.ts:202` | — | non | 0,1–1 % | G | — |
| G12 | Record de maturation | ×1,5 la meilleure vie de la lignée | `evolution.ts:180` | Le légendaire doit être un exploit | indirect (la valeur inclut l'Harmonie) | `bestLife` n'est visible que dans les statistiques (`app.ts:1352`) : décision sans information [CODE] | G (affichage W) | Réserve R-1 |

### H. Surnoms (`epithets.ts`)

Mesure [SIMULÉ, SEUILS-B, 6 h, vies postérieures à l'achat des Chroniques] :

| Profil | Vies surnommées | Surnoms donnés (part des surnoms) |
|---|---|---|
| `experimente` | **54 %** | Juste 31 %, Négociant 30 %, Jardinier 16 %, Constant 14 %, Patriarche 7 % |
| `evenementiel` (avec événements) | 55 % | Négociant 31 %, Juste 30 %, Jardinier 15 %, Constant 15 %, Patriarche 9 % |
| `consignes` | **27,5 %** | Négociant 59 %, Constant 27 %, Patriarche 13 % : le pilotage du Domaine fait perdre Juste et Jardinier |
| `debutant` | 78 % | Laboureur 53 %, Jardinier 23 %, Constant 13 %, Vénérable 4 % |
| `optimiseur` | **100 %** | Laboureur 48 % / Constant 45 %, en alternance |
| `mono-cultiver` | **100 %** | Laboureur 48 % / Constant 45 %, en alternance |
| `mono-commercer` | **100 %** | Négociant 49 % / Inconstant 47 %, en alternance |
| `mono-etudier` | **100 %** | Sage 49 % / Savant 46 %, en alternance |
| `mono-mediter` | **100 %** | Ermite 49 % / Contemplatif 47 %, en alternance |

Les surnoms liés au Domaine représentent 47 % des surnoms de l'expérimenté et 49 % de ceux du mono-Méditer (Ermite).

Neuf surnoms ne sont **jamais** remplis par aucun profil, ni en 6 h ni en 24 h : Bâtisseur, Bien-Aimé, Boucher, Bref, Dévastateur, Épris, Grand Veneur, Sans-Repos, Semeur.

| # | Seuil | Valeur | Fichier:ligne | Ce seuil sert à… | Dom. | Pertinence | Verdict | Mesure après |
|---|---|---|---|---|---|---|---|---|
| H1 | Record | ×1,5 (×2 pour le Glorieux) | `epithets.ts:65` | Il faut écraser le record, pas le battre | indirect | Le Grand (×1,5, génération ≥ 5) : 0,0–0,3 % des vies, presque introuvable [SIMULÉ] | R | Part du Grand et du Maudit glorieux après simplification ; viser 1–3 % |
| H2 | « Vit de la terre » | Récolter ≥ 50 % | `epithets.ts:67` | Rendre l'Harmonie pertinente | **oui** (dans son intention) | — | W | Sert encore au Laboureur (75 %) et au Maraîcher |
| H3 | **Le Glorieux** (Légendaire) | record ×2, Récolter ≥ 50 %, santé moyenne ≥ 95 %, génération ≥ 10 ; `pow` 0,3, `eco` −0,3 | `epithets.ts:73` | Le sommet du paysan | **oui** | 2 vies sur 13 837 (événementiel, 24 h) | **W** | § 2.2 |
| H4 | Le Phénix | ×5 la vie du parent, génération ≥ 10 | `:74` | Le rebond | non | 2 vies en 24 h | G | — |
| H5 | Le Vénérable | passage au rang X | `:77` | Saluer le métier accompli | non | 4,4 % (débutant), ≈ 0 ailleurs (R8 a réussi) | G | — |
| H6 | Le Patriarche | génération % 25 | `:78` | Un repère de lignée | non | 4 % des vies, constant | G | Jalon P18 (§ 2.7) |
| H7 | **L'Ermite** | Méditer ≥ 60 %, Commercer = 0, santé ≥ 80 % ; Méditer +25 %, `eco` −0,3 | `:79` | La retraite mystique | **oui** (clause et effet) | La clause de santé passe dans 100 % des cas : elle ne filtre rien | **W** | Retirer la clause et le mod `eco` (§ 2.2) |
| H8 | Le Sage | Étudier ≥ 50 % et vocation ≥ V | `:80` | — | non | 49 % des surnoms du mono-Étudier (alternance) | G | — |
| H9 | Le Sans-Repos | ≥ 50 changements et 4 activités | `:81` | Saveur | non | Jamais rempli (profils) ; exploit perdant selon l'audit (§ 5) | G | Joueur humain |
| H10 | **Le Juste** (Rare) | Récolter ≥ 50 %, santé moyenne ≥ 97 % et min ≥ 90 % ; seul effet : `eco` −0,4 | `:84` | La conduite raisonnée | **oui** | **31 % des surnoms de l'expérimenté** ; la clause de santé passe dans 98 % des vies de l'expérimenté et 1–6 % de celles des paysans. Sans Domaine, son seul effet disparaît | **W** | § 2.2 |
| H11 | **Le Dévastateur** | santé min ≤ 30 % ; `pow` +0,15, `eco` +0,5 | `:85` | Surexploiter a un prix et une gloire | **oui** | Jamais rempli | **S** (ou W, § 2.2) | — |
| H12 | **Le Boucher** | Battue ≥ 25 % et Gibier ≤ 5 | `:86` | La Battue | **oui** | Jamais rempli ; la Battue disparaît | **S** | Migration des sauvegardes (§ 2.8) |
| H13 | **Le Jardinier** | Récolter ≥ 50 % et santé moyenne ≥ 90 % ; Récolter +15 %, `eco` −0,2 | `:87` | Le paysan prudent | **oui** | 16 % (exp.), 23 % (débutant), 2,4 % (mono-cultiver) | **W** | § 2.2 |
| H14 | Alchimiste, Maraîcher | 35 % + 35 % | `:88-89` | Les vies mixtes | non | ≤ 0,2 % : les profils ne mélangent pas deux activités dans une vie | G | Joueur humain |
| H15 | Le Bâtisseur | ≥ 10 bâtiments en une vie | `:90` | L'économe qui dépense | non | Jamais rempli : avec des coûts ×1,9–2,4, 10 achats en une vie n'arrivent pas chez les profils | R | Seuil 6 ? Mesurer la distribution de `st.bd` |
| H16 | Le Bienheureux | palier Or d'événement dans la vie | `:91` | Le monde partagé | non | 0,4 % (événementiel, 24 h) | G | — |
| H17 | L'Ancien ; le Bref | `durRatio` ≥ 1,4 ; ≤ 0,85 | `:92,107` | Les vies longues ou brèves | non | L'Ancien : 2–3 % (optimiseur, Éternel). Le Bref : jamais, car même au départ Fragile donne 52/60 = 0,87 > 0,85, et l'écart se dilue quand la vie s'allonge [CODE] | R | Bref : seuil 0,95 ou vie amputée en valeur absolue |
| H18 | L'Infortuné | ≥ 2 traits négatifs | `:93` | Consoler | non | ≤ 0,1 % | G | — |
| H19 | **Le Semeur, le Grand Veneur** (Communs) | Semer ≥ 40 % ; Battue ≥ 30 % | `:96-97` | Les consignes | **oui** | Jamais remplis | **S** | Migration (§ 2.8) |
| H20 | Laboureur, Négociant, Savant, Contemplatif | activité ≥ 75 % ; +10 % | `:98-101` | Les spécialistes | non | Avec la règle « pas le surnom du parent », chaque spécialiste alterne entre deux surnoms : 100 % des vies surnommées, une sur deux sans effet (le Constant) | **R** | § 3.1 |
| H21 | Le Constant | ≤ 1 changement et ≥ 95 % d'une activité ; sans effet | `:105` | La vie par défaut d'un jeu inactif | non | 14–47 % des surnoms : c'est lui qui pousse la part de vies surnommées vers 100 % | **R** | § 3.1 |
| H22 | L'Inconstant | ≥ 25 changements | `:106` | Saveur | non | 47 % des surnoms du mono-Commercer : artefact du profil (repli vers Récolter faute de Vivres, `profiles.ts:47`) | G | Profil corrigé |
| H23 | Le Fainéant | < 20 % de la vie du parent | `:108` | Saveur | non | ≤ 0,2 % | G | — |
| H24 | Règle « pas le surnom du parent » | — | `:127` | Varier l'histoire (R8) | non | Elle crée l'alternance A/B des spécialistes : deux surnoms se partagent ~48 % chacun | **W** | § 3.1 |
| H25 | Éclats de 1ʳᵉ découverte | 1/2/3/5 | `:116` | Récompenser la découverte | non | `epithetsFound` p50 = 3–5 en 6 h [SIMULÉ, T04] | G | — |
| H26 | Mods `eco` des surnoms | Glorieux −0,3 ; Ermite −0,3 ; Juste −0,4 ; Dévastateur +0,5 ; Boucher +0,3 ; Jardinier −0,2 ; Semeur −0,1 | `epithets.ts:73-96`, `game.ts:81-83` (`echoEcoStrength`), `epithetEffect` `:160` | La pression des Échos surnommés | **oui** | — | **S** | Les effets de remplacement sont au § 2.2 |
| H27 | Faits « Domaine » de `LifeFacts` | `harmonyAvg`, `harmonyMin`, `game`, `semer`, `battue` | `epithets.ts:14-41`, `game.ts:468-474` | Alimenter les règles | **oui** | — | **S** | Ajouter les faits de remplacement (§ 2.2) |

### I. Hauts faits (`feats.ts`)

| # | Seuil | Valeur | Fichier:ligne | Ce seuil sert à… | Dom. | Pertinence [SIMULÉ, SEUILS-B] | Verdict | Mesure après |
|---|---|---|---|---|---|---|---|---|
| I1 | Les quatre métiers | 4 Échos de vocation ≥ III dans la Crypte (5 ✦) | `feats.ts:229,252` | La variété | non | 0,5 % (consignes, 6 h) ; 17,5 % (événementiel, 24 h) | G | — |
| I2 | Sang neuf | 4 maisons (4 ✦) | `:230,255` | Le lien social | non | 0 % (les profils ne se marient pas) | G | Profil marié, 2 semaines de calendrier |
| I3 | **Récolte raisonnée** | Récolter ≥ 50 % d'une vie, santé min ≥ 95 %, 7 Échos (4 ✦) | `:232-233,258` | La conduite raisonnée | **oui** | 100 % à 24 h (exp., événementiel ; p50 893–943 min) ; **0 % chez les paysans** (optimiseur, mono-cultiver). Le seuil réel est la Crypte à 7 emplacements (886 ⚜️ de Crypte), et la clause de santé exclut ceux qui récoltent | **W** | § 2.3 |
| I4 | Transcendance | héritier au don légendaire mûri (5 ✦) | `:261` | La maturation | non | 6,5 % (exp.) à 60 % (mono-commercer) en 6 h | G | — |
| I5 | Embrasement | Étoile filante et 5 Échos (5 ✦) | `:234,264` | Le rare | non | 0,5–3,5 % à 6 h ; 2,5–5 % à 24 h | G | — |
| I6 | L'Almanach complet | Or aux 6 événements (6 ✦) | `:267` | Le calendrier | non | 0 % des profils (à 48 h, EVO) | G | Vrai jeu |
| I7 | Millénaire | génération 1 000 (5 ✦) | `:235,270` | La durée | non | 100 % à 48 h (opti., EVO) ; ≈ 37 h de jeu continu pour l'expérimenté [HYPOTHÈSE, extrapolé de 162 gén./6 h] | G | — |
| I8 | Mémoire des Chroniques | 15 surnoms (4 ✦) | `:236,273` | La découverte | non | 2,5 % (événementiel, 24 h). **Il perd 7 surnoms accessibles avec la suppression** (H11, H12, H19, plus H3, H7, H10, H13 s'ils sont réécrits) | **R** | Recompter les surnoms atteignables ; garder le seuil à ≈ 45 % du total |
| I9 | Contrôle des hauts faits | à la mort et après la succession | `feats.ts:280-290` | — | non | Visibles seulement avec le Codex, donc après les Chroniques (E10) [CODE] | W (affichage) | — |

### J. Bâtiments (`data.ts:212-219`)

| # | Seuil | Valeur | Ce seuil sert à… | Dom. | Pertinence | Verdict | Mesure après |
|---|---|---|---|---|---|---|---|
| J1 | Multiplicateur de bâtiment | (1 + 0,25·niv.) × 2^⌊niv./10⌋ (`data.ts:226-228`) | Les paliers ×2 tous les 10 niveaux | non | Champs p50 = 24 (débutant) [SIMULÉ] | G | — |
| J2 | Champs et garennes | 25 Vivres, ×1,9 | Le métier de paysan | non (le nom évoque la chasse) | Il reprend le Pavillon de chasse (TERRE-4) | G (nom W : « Champs ») | — |
| J3 | Comptoir | 30 Or, ×2,0 | — | non | — | G | — |
| J4 | Bibliothèque | 15 Savoir + 40 Or, ×2,1 | — | non | — | G | — |
| J5 | Sanctuaire | 5 Essence, ×2,2 (sans Savoir depuis R10) | — | non | — | G | — |
| J6 | Clepsydre | 40 Savoir + 8 Essence, ×2,4, max 15 | Allonger la vie | non | — | G | — |
| J7 | **Garde forestier** | 60 Or + 100 Vivres, ×2,0, max 10 ; +0,4 %/s/niv. (`game.ts:108`) | Amortir la pression | **oui** | « Jamais rentable » (P12), mais acheté jusqu'au maximum (p50 = 10) par l'expérimenté et le débutant : c'est un puits de ressources (51 200 Vivres et 30 720 Or au niveau 10) [SIMULÉ, T04] | **S → remplacer** | § 2.4 (P18) |
| J8 | Visibilité d'un bâtiment | toutes ses ressources de coût déjà produites (`app.ts:731-734`) | Ne pas noyer le début | non | Le Garde apparaît dès le 1er Or (~20 s) | G | — |

### K. Domaine (tout disparaît)

| # | Seuil | Valeur | Fichier:ligne | Verdict | Remarque |
|---|---|---|---|---|---|
| K1 | Équilibre | F 62,5, G 29 | `ecosystem.ts:123` | S | — |
| K2 | Dynamique | rF 0,15, K 100, aFG 0,002, bG 0,1/60, mG 0,05, cG 0,00193 | `:125-132` | S | — |
| K3 | Harmonie | ×(0,7 + 0,6·santé), santé = exp(−d/1,2) | `:236-244` | S | Compensation : game-balancer |
| K4 | Part de chasse | ½ + 1,5·(g − 1), bornée à [0 ; 1] | `:184-189` | S | — |
| K5 | Consignes | Semer ×0,7 et Flore ×3 ; Battue ×3 et prélèvement ×4 | `:200-207` | S | Gain mesuré : +2,8 % (dilué par les Échos) |
| K6 | Abondances | F [0,2 ; 1,6], G [0,05 ; 2,2] | `:174-175` | S | — |
| K7 | Effets de Commercer et Méditer | défrichage 0,08 ; rappel vers l'équilibre 0,03 | `:222-228` | S → **W** | § 2.5 |
| K8 | Grande migration | Gibier +0,25/s (≤ 140) | `game.ts:223`, `data.ts:274` | **W** | § 2.9 |
| K9 | Astuces et pastilles | « eco » santé < 0,55 ; pastille Nature < 0,55 ; « consigne » G ≥ 0,8·éq. | `app.ts:347,379,383` | S | — |
| K10 | Panneau Nature, jauges, aide | — | `app.ts:736-770, 1580-1599, 1658` | S → **W** | § 2.10 |

### L. Événements et Almanach

| # | Seuil | Valeur | Fichier:ligne | Ce seuil sert à… | Dom. | Pertinence | Verdict | Mesure après |
|---|---|---|---|---|---|---|---|---|
| L1 | Calendrier | toutes les 4 h, 45 min | `data.ts:281-282` | Le monde partagé (pilier 3) | non | — | G | — |
| L2 | Objectif Bronze | 1 200 s de production habituelle | `game.ts:320` | Bronze sans changer d'activité | indirect (débit) | Bronze 100 %, Argent 60 %, Or 10 % sans jouer l'événement ; Or 40 % en le jouant (GDD) | G | Si la valeur baisse, l'objectif suit (il est relatif) |
| L3 | Paliers | ×1 / ×3 / ×8 | `game.ts:321` | La progression | non | — | G | — |
| L4 | Poids de la ressource visée | ×3 | `game.ts:319` | Jouer l'activité dopée paie | non | — | G | — |
| L5 | Récompenses | 1 / 2 / 5 ✦ | `game.ts:324` | Le revenu du Bazar | non | Événementiel 20,6 ✦ en fin de partie contre 12,4 (exp.) [SIMULÉ, T04-lot-avec] | G | Bazar (O) |
| L6 | Plancher d'objectif | 60 ÷ valeur de la ressource ; débit mémorisé 60 s, réchauffage 10 s | `game.ts:39-40,308` | Éviter un objectif plancher (R5) | non | — | G | — |
| L7 | Almanach | +2 ✦ au 1er Or de chaque type | `game.ts:326` | La collection | non | — | G | — |
| L8 | **Éclipse** | Méditer ×3, Échos ×1,5 | `data.ts:275` | Un événement mystique | non | **Écart profil événementiel / expérimenté** (6 h, avec événements) : log10 8,671 contre 8,269, soit **×2,52** [SIMULÉ, T04-lot-avec, moyennes]. C'est plus que les « +80 % » notés en fin de phase 4. Attribué à l'Éclipse par la synthèse, non isolé par cette mesure | **R** | § 3.3 |
| L9 | Concile des ancêtres | Échos ×2,5 | `data.ts:277` | — | non | Il dope aussi tous les profils, même sans jouer l'événement | R | Même campagne que L8 |
| L10 | Grande migration | Récolter ×2 et Gibier | `data.ts:274` | — | **oui** | Sans Gibier, c'est une Moisson dorée en moins bien (×2 contre ×3) | **W** | § 2.9 |

### M. Destin du jour (`daily.ts`)

| # | Seuil | Valeur | Fichier:ligne | Ce seuil sert à… | Dom. | Pertinence | Verdict | Mesure après |
|---|---|---|---|---|---|---|---|---|
| M1 | Durée, pas | 90 s, 0,1 s | `daily.ts:10-11` | La même vie pour tous | non | — | G | — |
| M2 | Forme de la commande | 60 / 20 / 10 / 3, variation ×0,7–1,3 | `:70,101` | Quatre activités dans un ordre | non | — | G | — |
| M3 | Cible de calibrage | joueur réactif 56–66 ans | `:72,132-139` | Une commande ni triviale ni impossible | **oui** (`reactiveBest` essaie Équilibre et Battue, `:412`) | Bronze ou mieux 80 %, Or 3 % pour les profils raisonnables (0.4) [SIMULÉ, `commande/resultats.md`] | **R** | `lab/balance/commande/calibrage.ts` sur 365 dates |
| M4 | Pénalité du solveur | 20 tics (2 s) par changement | `:382` | L'Or récompense un plan | non | — | G | — |
| M5 | Marge de l'Or | solveur + 2 ans | `:467` | L'élite | non | — | G | — |
| M6 | Médailles | Bronze ≤ 90 ; Argent à mi-chemin ; 1 ✦ + 1 ✦ par médaille | `:474-477`, `app.ts:1514-1518` | Le revenu quotidien | non | — | G | — |
| M7 | **Choix 4 et 5** (Semer, Battue) | codes `EL3` | `:43-51` ; bande 🟫/🟥 `:353` | Les consignes dans le plan | **oui** | Le solveur s'en sert (« comptent comme des choix dans le plan ») | **S** | § 2.11 |
| M8 | Harmonie du Destin | `harmonyMult` dans `prodMult` | `:184-188` | — | **oui** | — | **S** | Recalibrer la commande |
| M9 | **Modificateurs Domaine** | Terres fertiles (F 100), Gibier abondant (G 60), Hiver rude (G 15) : 3 sur 10 | `:28-30` | Varier la journée | **oui** | Deux groupes (« flore », « gibier ») sur sept : le groupe « gibier » n'a que des mods Domaine | **W** | § 2.11 |
| M10 | Vivres de départ | 10 + 5·{0..3} | `:94` | — | non | — | G | — |
| M11 | Filtre des traits du Destin | traits sans `since`, Rares au plus, ni enfants, ni Écho, ni vie | `:78` | Le même héros pour tous | non | Harmonieux peut sortir (F11) | G | Garder l'identifiant d'Harmonieux |

### N. Alliances

| # | Seuil | Valeur | Fichier:ligne | Ce seuil sert à… | Dom. | Pertinence | Verdict | Mesure après |
|---|---|---|---|---|---|---|---|---|
| N1 | Dot | 5 % de l'Or en stock, 50 au minimum ; ÷2 entre joueurs | `alliances.ts:30-33` | Payer sans ruiner (R11) | non | Mariage à chaque vie ×0,97 (z −1,1) [SIMULÉ, R11]. Une lignée sans Or ne peut pas payer les 50 | G | Profil qui se marie à chaque vie, ≥ ×1,0 |
| N2 | Prétendant : raretés | 60 / 30 + gén./4 / 8 + gén./8 / 1 + gén./30 | `:85` | Le comté suit la lignée | non | — | G | — |
| N3 | Prétendant : trait négatif | 20 % | `:88` | — | non | — | G | — |
| N4 | Prétendant : vocation | 1 + ⌊gén./12⌋ + aléa(2), max VI | `:92` | — | non | — | G | — |
| N5 | Bornes d'un code | 1 légendaire, 4 traits, vocation ≤ héros + 2 | `:224-227` | Limiter la triche | non | — | G | — |
| N6 | Cadets, empreintes | 8 cadets ; 300 empreintes | `:131,264` | — | non | — | G | — |
| N7 | Maisons du comté | 3 par semaine ; la 1ʳᵉ offre un don épique ou plus | `:57-76` | Le monde partagé | non | Harmonieux peut être un don de la semaine (F11) | G | — |

### O. Bazar céleste

| # | Seuil | Valeur | Fichier:ligne | Ce seuil sert à… | Dom. | Pertinence | Verdict | Mesure après |
|---|---|---|---|---|---|---|---|---|
| O1 | Prix des Bénédictions | Rare 3, Épique 6, Légendaire 12, Mythique 15 ✦ ; 2 au plus par succession | `game.ts:676,697` | Garantir un don | non | **Non remesuré depuis R9 et le lot 0.3 (ECLATS).** Seul l'optimiseur achète : 0,3 ✦ en fin de partie, contre 20,6 pour l'événementiel qui n'achète rien [SIMULÉ, T04-lot-avec] | **R** | § 3.4 |
| O2 | Renchérissement du légendaire | +50 % par achat, ×3 au plus | `game.ts:679-680` | Pas de robinet à légendaires | non | Idem | R | Idem |
| O3 | Temps suspendu | 2 ✦, +30 s, une fois par vie, hors `durRatio` | `game.ts:663,711-717` | Prolonger une vie qui compte | non | L'optimiseur l'achète à chaque vie (`profiles.ts:184`) : effet sur l'Héritage neutralisé (C076) | G | — |
| O4 | Blason, partitions | 1 ✦ (1ᵉʳ gratuit), 3 ✦ | `game.ts:664-665` | Le cosmétique | non | — | G | — |
| O5 | Apparition du Bazar | au 1ᵉʳ Éclat | `nav.ts:44-46` | Un menu court au début | non | — | G | — |

### P. Hors ligne et boucle

| # | Seuil | Valeur | Fichier:ligne | Ce seuil sert à… | Dom. | Pertinence | Verdict | Mesure après |
|---|---|---|---|---|---|---|---|---|
| P1 | Plafond hors ligne | 6 h + 2 h/niv. de Patience | `game.ts:131-133` | Le joueur à sessions | non | — | G | — |
| P2 | Seuils de rattrapage | 30 s au lancement ; écart > 5 s en jeu ; pas de 1 s | `game.ts:729,744`, `main.ts:74,114` | Ne pas perdre de temps (R1) | non | Le héros hors ligne récolte en Équilibre (`rt.offline`) : la règle disparaît avec les consignes | G (code S) | Régression hors ligne |
| P3 | Boucle | pas 0,1 s ; dt réel ≤ 5 s ; 60 pas par trame ; sauvegarde toutes les 10 s | `main.ts:9,112,124,137` | — | non | — | G | — |
| P4 | Lignée arrêtée hors ligne | succession en attente | arbitrage D1 | Comportement voulu | non | Occasionnel : 28 générations en 6 h, Alliances et Chroniques jamais [SIMULÉ] | G (arbitrage) | — |

### Q. Seuils d'interface

| # | Seuil | Valeur | Fichier:ligne | Dom. | Verdict |
|---|---|---|---|---|---|
| Q1 | Astuces | « echo » à t > 15 s ; « build » à 25 Vivres ; « legacy » à 3 ⚜️ ; « voc » gén. 2–4 ; « destin » gén. ≥ 3 ; « pause » gén. ≤ 3 | `app.ts:374-385` | non (la « pause » cite le Domaine) | G (texte de la pause W) |
| Q2 | Astuces « eco » et « consigne » | santé < 0,55 ; G ≥ 0,8·éq. | `app.ts:379,383` | **oui** | S |
| Q3 | Proposition d'installation | après la 1ʳᵉ succession, 2 fois au plus | `app.ts:548` | non | G |
| Q4 | Généalogie affichée | 12 derniers ancêtres | GDD § 1 | non | G |

**Total : 157 seuils ou chiffres indicatifs** (une ligne par seuil ; les lignes à valeurs multiples comptent une fois). Verdicts : **103 G · 19 R · 18 S · 17 W**.

| Catégorie | Lignes | G | R | S | W |
|---|---|---|---|---|---|
| A Vie et activités | 8 | 6 | 2 | 0 | 0 (+1 texte) |
| B Vocation | 7 | 7 | 0 | 0 | 0 |
| C XP | 4 | 4 | 0 | 0 | 0 |
| D Échos | 7 | 6 | 0 | 1 | 0 |
| E Héritage | 11 | 8 | 3 | 0 | 0 |
| F Génétique | 13 | 10 | 1 | 1 | 1 |
| G Maturation | 12 | 7 | 2 | 0 | 3 |
| H Surnoms | 27 | 11 | 5 | 5 | 6 |
| I Hauts faits | 9 | 6 | 1 | 0 | 2 |
| J Bâtiments | 8 | 7 | 0 | 1 | 0 |
| K Domaine | 10 | 0 | 0 | 7 | 3 |
| L Événements | 10 | 7 | 2 | 0 | 1 |
| M Destin du jour | 11 | 7 | 1 | 2 | 1 |
| N Alliances | 7 | 7 | 0 | 0 | 0 |
| O Bazar | 5 | 3 | 2 | 0 | 0 |
| P Hors ligne | 4 | 4 | 0 | 0 | 0 |
| Q Interface | 4 | 3 | 0 | 1 | 0 |

Seuils qui dépendent du Domaine : **34 directement** (A5, D6, F11–F12, G4–G6, H2–H3, H7, H10–H13, H19, H26–H27, I3, J7, K1–K10, L10, M3, M7–M9) et **4 indirectement**, par la valeur produite (E1, G12, H1, L2).

---

## 2. Éléments liés au Domaine : remplacements proposés

Règle commune : **une condition de remplacement lit un fait de la lignée** (parent, ancêtres, usure, vocation, union, record), **jamais un état de production.** Chaque proposition indique le pilier servi (1 : chaque vie compte ; 2 : mémoire de la dynastie ; 3 : monde partagé) et le risque qu'elle crée.

### 2.1 Longévité, Centenaire, Éternel (G4–G6)

**Constat.** [SIMULÉ, SEUILS-B] La condition de santé ne départage pas des conduites, elle départage des **métiers**. Elle passe à 100 % pour qui ne récolte pas et à 0,2–16 % pour qui récolte. Le Paysan est la seule vocation privée de la chaîne de longévité, ce qui contredit le pilier 2.

| Évolution | **Préférence** | Alternative 1 | Alternative 2 |
|---|---|---|---|
| Robuste → Longévité | **Le don a déjà traversé 2 générations** (usure de Robuste ≥ 2 chez le porteur). Une lignée endurante devient plus endurante (pilier 2), et cela crée une tension avec l'usure, qui réduit la transmission. | Vivre toute sa vie avec un conjoint (union avant 25 % de la vie) : « on vit vieux à deux ». Lie la chaîne aux Alliances, accessibles tard (risque : P13). | Aucun trait négatif dans la vie. Simple, mais proche de « Sang pur », jugé trivial (88–100 %). |
| Longévité → Centenaire | **Usure de Longévité ≥ 2 et aucun trait négatif.** Le don mûri repart sans usure, donc il faut le garder 2 générations : une vraie chaîne de mémoire. | Vivre ≥ 1,2× la vie normale de la lignée (`durRatio`). Lisible, mais `durRatio` compte Temps suspendu (`game.ts:471`) : le Bazar achèterait la maturation. | Le parent du porteur était lui-même Robuste, Longévité ou Centenaire (deux générations de suite). |
| Centenaire → Éternel | **Record ×1,5 seul** (comme les autres légendaires, avec la vocation en moins). Aujourd'hui, le record tranche déjà : 3,5 % des porteurs chez l'expérimenté. | Record ×1,5 et usure de Centenaire ≥ 2. | Record ×1,5 et vie ≥ 1,2× la vie normale. |

**Risques.**

- Les taux de maturation remontent pour les paysans (0,2 % → ?) : risque de retour d'Éternel en masse chez l'optimiseur, qui portait Éternel à 77 % avant la 0.3.
- Seuil d'alerte : Éternel ≤ 30 % des héros de l'optimiseur sur les 60 dernières générations (`node lab/balance/evo/kpi.mjs`).
- L'usure est affichée (🩸) [CODE] : la condition est lisible sur la fiche du trait.

### 2.2 Surnoms (H3, H7, H10–H13, H19, H26)

| Surnom | **Préférence** | Alternatives | Effet sur l'Écho (sans `eco`) |
|---|---|---|---|
| **Le Juste** (31 % des surnoms de l'expérimenté) | **« La juste mesure »** : Récolter ≥ 50 % et une valeur comprise entre ×1 et ×1,5 celle du parent (ni Fainéant ni Grand). Lit le parent, donc la mémoire (pilier 2), et reste un surnom de paysan. | (a) Supprimer : le Laboureur et le Jardinier couvrent le paysan, et la part de vies surnommées baisse d'autant. (b) « Transmettre sans perdre » : la vocation héritée est entretenue et aucun don n'est perdu (usure ≤ 1). | Puissance +5 % (Rare) |
| **Le Jardinier** | **Récolter ≥ 50 % en portant un don de récolte** (Main verte ou Sève de la terre) : le don et la vie se répondent. | (a) Fusion avec le Laboureur. (b) Récolter ≥ 50 % et parent Paysan. | Récolter +15 % |
| **L'Ermite** | **Retirer la clause de santé** (elle passe à 100 %) et garder Méditer ≥ 60 % sans Commercer. | (a) Ajouter « sans conjoint », la retraite au sens propre. | Méditer +25 % |
| **Le Glorieux** (Légendaire) | **Record ×2, génération ≥ 10 et parent déjà surnommé Rare ou plus** (« une lignée de gloire », pilier 2). | (a) Record ×2 et Récolter ≥ 50 % : garde l'identité paysanne, mais se confond avec le Grand. (b) Record ×2 et union avec une autre lignée de joueur. | Puissance +30 % |
| **Le Dévastateur** | **Supprimer** : jamais rempli, et sa raison d'être disparaît. | Réécrire en « le Prodigue » : dépenser en bâtiments plus de 90 % de l'Or produit pendant la vie (lit les achats). Effet : puissance +15 %, Commercer −10 %. | — |
| **Le Boucher, le Semeur, le Grand Veneur** | **Supprimer** : leur mécanique disparaît, et aucun profil ne les a jamais remplis. | — | — |

Faits à ajouter à `LifeFacts` (remplace H27) : usure des dons portés, rareté du surnom du parent, union pendant la vie. Le Codex passe de 34 à **30 surnoms** (31 si le Prodigue est retenu).

**Risques.**

1. Le Juste en « juste mesure » peut devenir un nouveau monopole chez les paysans : la valeur croît d'environ ×1,05–1,2 par génération [HYPOTHÈSE]. Seuil : aucun surnom au-dessus de 40 % des surnoms d'un profil.
2. La migration des Échos surnommés est traitée au § 2.8.

### 2.3 Haut fait « Récolte raisonnée » (I3)

Aujourd'hui, la Crypte à 7 emplacements fait tout le travail, et les paysans ne l'obtiennent jamais.

- **Préférence : « Sept générations à la terre ».** Sept chefs de lignée d'affilée dont l'activité dominante est Récolter (`ancestors[].dominant`, déjà stocké) : mémoire, pilier 2.
- **Alternative 1 : « Dynastie de métier ».** Le même défi, ouvert à toutes les vocations (7 générations d'un même métier). Il complète Les quatre métiers : constance contre variété.
- **Alternative 2 : « Le Grenier des ancêtres ».** 3 Échos Paysans de rang ≥ VI dans la Crypte.
- **Risque :** trivial pour un spécialiste, comme l'était Sang pur. Critère : ≤ 60 % des parties à 6 h, ≥ 10 % à 48 h, sur au moins un profil non spécialiste.

### 2.4 Garde forestier (J7) et milieu de partie creux (P18)

**Constat [SIMULÉ].** P18 : 149 à 282 min sans nouveauté après la première heure (GD-13). Repères mesurés : Alliances à 161 min, Chroniques à 287 min (expérimenté) ; génération 50 vers 1 h 15, génération 100 vers 3 h 15.

**Préférence : « Archives de la maison »**, bâtiment à 5 niveaux qui apparaît à la **génération 25**, vers 35–45 min. Chaque niveau **révèle une information cachée de la lignée** et apporte un petit effet de lignée :

| Niveau | Révèle | Effet |
|---|---|---|
| 1 | Le seuil de record ×1,5 et ×2 : la meilleure vie de la lignée, sur la Vie et sur la fiche des dons (règle aussi G12) | — |
| 2 | La chance de transmission de chaque don (usure comprise) sur les héritiers | Transmission de la vocation +5 % |
| 3 | Le poids génétique et le budget de 6 (règle P19) | — |
| 4 | Les conditions de maturation remplies par la vie en cours | Usure −1 sur les dons du héros |
| 5 | L'énigme du prochain surnom accessible | Une Bénédiction Rare offerte, une fois |

- Coût : Savoir et Or (pas de Vivres : Récolter perd déjà son rôle sur le Domaine).
- Piliers : 2 (la mémoire devient lisible) et 1 (chaque vie se joue en connaissant l'enjeu).
- **Risque :** de l'information sans décision nouvelle, si les révélations ne changent pas le choix de l'héritier. À mesurer : part des successions où le meilleur héritier change quand l'information est connue (`lab/design/choix.ts`).

**Alternative 1 : « Chapelle des ancêtres »**, à la génération 50 (vers 1 h 15). +1 Écho **protégé hors emplacement** par niveau (max 3) : l'Écho choisi « ne meurt plus ».

- Pilier 1 (une vie qui compte reste).
- Risque : c'est encore de la production, contre le principe retenu, et l'inflation équivaut à +1 emplacement (environ +20 %).

**Alternative 2 : « Lices du comté ».** Un emplacement prévu pour un futur mini-jeu (réserve R-3) : un bâtiment débloqué à la génération 50 qui ouvre un tournoi hebdomadaire entre héritiers non choisis (les cadets).

- Pilier 3.
- Risque : contenu à produire avant que le bâtiment ait un sens.

**Ma préférence : les Archives** (aucune puissance de production, elles règlent deux constats ouverts P19 et G12, et visent le creux). Les Lices restent la place du mini-jeu.

### 2.5 Rôle secondaire de Méditer et Commercer (K7)

Aujourd'hui, Méditer apaise le Domaine et Commercer le défriche. Sans Domaine, les deux n'ont plus de rôle secondaire, alors qu'Étudier garde l'XP (Bibliothèque).

| Activité | **Préférence** | Alternative | Risque |
|---|---|---|---|
| Méditer | **« Purifier le sang »** : une vie qui médite ≥ 50 % transmet ses dons avec une usure divisée par 2, comme une union (lignée, pilier 2). Un Mystique devient le « soin » de la lignée. | Méditer ≥ 50 % : +1 héritier proposé (la voyance). Recoupe Fertile et Sang fécond. | Le Mystique devient le seul gardien de l'usure ; le mono-Méditer tient l'usure à 0, mesurer `traitCombos60`. |
| Commercer | **« Négocier la dot »** : la dot est divisée par 2 pour un héros qui a commercé ≥ 50 % de sa vie (ou −1 % de dot par niveau de Comptoir). Lien social, pilier 3. | Commercer ≥ 50 % : le prétendant de la maison prestigieuse a une vocation de +1 rang. | Faible tant que les profils ne se marient pas : impossible à mesurer sans profil marié. |

### 2.6 Trait Harmonieux (F11)

- **Préférence :** garder l'identifiant `harmonieux` (les tirages du Destin et des maisons ne changent pas) et lui donner l'effet **« ses dons s'usent deux fois moins »** (usure +0,5 par génération au lieu de +1). L'harmonie s'entend alors comme celle du sang.
- **Alternative :** transmission +10 %, ce qui recoupe Sang doré.
- **Risque :** cumul avec le Méditer « purifier le sang ». Ne retenir qu'un des deux si `traitCombos60` baisse de plus de 20 %.

### 2.7 Jalons de génération (P18)

Le Patriarche (génération multiple de 25, 4 % des vies) est le seul repère de génération. La génération 25 peut servir d'ouverture aux Archives (§ 2.4) sans nouvelle règle.

- Piliers : 2.
- Risque : l'occasionnel atteint la génération 28 en 6 h et ne voit que ce jalon.

### 2.8 Sauvegardes (surnoms et faits retirés)

- Les Échos et ancêtres portant `boucher`, `semeur`, `grand_veneur` ou `devastateur` perdent leur surnom à la migration, comme `veneur` en 0.4.
- Le compteur du Codex (`s.epithets`) les retire. Il faut aussi vérifier Mémoire des Chroniques (déjà obtenu, il reste acquis).
- Supprimer `s.eco`, `s.posture`, `life.post`, `stats.hs/hn/hm` dans `migrate()`. `buildings.garde` doit soit être converti en niveaux des Archives, soit remboursé.
- **Préférence : rembourser** (Or et Vivres au coût payé), car convertir crée un saut.

### 2.9 Grande migration (L10, K8)

- **Préférence : « Grand marché »** : Commercer ×2 et dot ÷2 pendant la fenêtre, pour créer une raison de se marier à heure fixe (piliers 3 et 2).
- **Alternative : « Veillée des ancêtres »** : XP ×2 et chance de maturation +10 % pour une vie qui finit dans la fenêtre.
- **Risque :** changer le type d'un événement change l'Almanach. Garder l'identifiant `migration` pour les sauvegardes et le calendrier `.ics`.

### 2.10 Panneau Nature, onglet Domaine (K10)

- **Constat [CODE].** Sur ordinateur 3 colonnes, l'onglet Domaine n'affiche que la Nature (GDD § 1). Il devient **vide** après le retrait.
- **Préférence :** l'onglet 🌳 Domaine devient **🏛️ Mémoire**, avec deux sous-onglets :
  - **Échos** ;
  - **Archives** : le registre des records (meilleure vie, seuils ×1,5 et ×2), l'usure des dons de la maison, puis les niveaux révélés du bâtiment (§ 2.4).
  - Sur ordinateur 3 colonnes, l'onglet montre les Archives.
- **Alternative :** fusionner Échos dans Maison et supprimer l'onglet, soit quatre onglets.
- **Risque :** les raccourcis 1 à 5 et `nav.ts` (testé) changent ; la pastille Nature disparaît.

### 2.11 Destin du jour (M7–M9)

**Choix 4 et 5 : préférence.** Les supprimer de `DAILY_CHOICES` et de la bande de partage. Le format de code devient **EL4**. Les EL3 locaux servaient au fantôme du record : ils sont refusés ou rejoués en Équilibre.

**Modificateurs du Domaine : préférence.** Remplacer le groupe « flore/gibier » par des modificateurs lisibles sur les activités ou la vie :

| Remplace | Nouveau modificateur | Effet |
|---|---|---|
| Terres fertiles | **Récolte précoce** | Récolter ×1,5 les 30 premières secondes |
| Gibier abondant | **Héritage du comté** | Départ avec 10 Or |
| Hiver rude | **Disette** | Vivres de départ à 0 |

- Alternative : supprimer simplement les trois modificateurs. Il reste alors 7 modificateurs dans 5 groupes, donc moins de variété.
- Risque : recalibrer `commande/calibrage.ts` (365 dates). Le Destin change chez tous les joueurs à la mise à jour, ce qui est acceptable sans classement (TERRE-1).

---

## 3. Seuils déjà connus comme faux

### 3.1 Part des vies surnommées : ≈ 80 % pour une cible de ~50 %

**Correction de la mesure** [SIMULÉ, SEUILS-B]. Le chiffre de 80 % est une **moyenne de profils très différents**, pas un état général :

- les généralistes sont **déjà à la cible** (expérimenté 54 %, événementiel 55 %) ;
- les spécialistes sont à **100 %** (optimiseur et tous les mono) ;
- le débutant est à 78 %.

**Cause, chez les spécialistes [CODE + SIMULÉ].** La règle « pas le surnom du parent » (H24) fait alterner deux surnoms : le Laboureur puis le Constant, à ~48 % chacun. Une vie sur deux reçoit donc un surnom **sans effet** (le Constant), qui ne sert qu'à « occuper » la place du parent.

**Après la simplification.** Juste et Jardinier (47 % des surnoms de l'expérimenté) disparaissent ou changent : la part des généralistes **baissera sous la cible** si on se contente de supprimer.

**Proposition.** Remplacer la règle par « pas le surnom **identique à celui du parent** pour un surnom de spécialiste », c'est-à-dire laisser une vie sans surnom plutôt que de lui donner le Constant. Le Constant ne serait alors attribué que si aucun ancêtre des 3 dernières générations ne l'a porté.

**Mesure :** part de vies surnommées par profil, avec une cible de 40–60 % chez **chaque** profil, et pas seulement en moyenne.

### 3.2 Étudier, vocation la plus faible

[SIMULÉ, T04-lot-sans] mono-Étudier 8,080 contre 8,877 pour mono-Récolter, soit ×0,16 (le GDD dit ~20 %).

Mais mono-Récolter vit avec une santé moyenne de 0,87, donc une Harmonie de ×1,22, tandis que mono-Étudier est à 1,0 (×1,30). Sans Harmonie, **l'écart se lira autrement** : il est à remesurer, pas à corriger d'avance.

Leviers sans toucher à la production : faire monter le rôle secondaire d'Étudier, par exemple la Bibliothèque +10 % d'XP → +15 %.

### 3.3 Profil événementiel : ×2,5 (et non +80 %)

[SIMULÉ, T04-lot-avec, moyennes] log10 8,671 contre 8,269, soit **×2,52**. Le chiffre de +80 % n'est plus d'actualité.

Isoler l'Éclipse et le Concile par une variante en mémoire :

- Éclipse Méditer ×3 → ×2 ;
- Échos ×1,5 retiré ou appliqué seulement aux Échos Mystiques ;
- critère, fixé ici avant mesure : événementiel/expérimenté ≤ ×1,5 à 6 h, sans perdre le palier Or (≥ 30 % des fenêtres jouées).

### 3.4 Bazar non remesuré depuis R9

- Aucun profil ne dépense ses Éclats, sauf l'optimiseur : l'événementiel en garde 20,6.
- Le seuil de prix (3/6/12/15, ×1,5 par légendaire) n'a jamais été confronté aux revenus de la 0.3 et de la 0.4 : événements 1/2/5, Almanach +2, Destin 1–4 par jour, surnoms 1–5, hauts faits 3–6.
- **Mesure :** un profil « événementiel + Bénédiction légendaire dès que possible », sur 24 h. Critère : ≤ 1 Bénédiction légendaire par 4 h de jeu, et part d'Élu et d'Éternel ≤ 30 % des héros.

### 3.5 Accès aux Alliances : critère de 90 min non atteint (161 min)

[SIMULÉ, SEUILS-B] Expérimenté p50 161 min (162 dans la synthèse), débutant 191, occasionnel jamais.

La cause n'est pas le prix (45 ⚜️ représentent moins de 3 % de l'Héritage gagné en 6 h) mais **l'ordre d'achat** : les profils achètent d'abord tout ce qui est moins cher. C'est un problème d'information (la pastille « 💡 épargne » existe, R12) et de modélisation du joueur.

Deux leviers à départager :

| Levier | Avantage | Risque |
|---|---|---|
| (a) Offrir Alliances au **premier Héritage cumulé ≥ 45**, sans achat | Accès vers 30–60 min [HYPOTHÈSE] | Supprime un choix |
| (b) Garder l'achat, mais faire rejouer les profils avec une règle d'épargne (profil `econome`, comme `instrument.ts`) pour savoir ce que voit un joueur qui suit la pastille | Mesure le vrai effet de la pastille | Aucun |

**Préférence : (b) d'abord**, pour mesurer avant de décider.

Même constat pour les **Chroniques** : 287 min chez l'expérimenté. De plus, elles cachent les hauts faits et l'Almanach (E10) : **montrer le Codex dès le premier haut fait**, sans les surnoms.

---

## 4. Mesures à lancer après la simplification (par priorité)

Critères à fixer **avant** chaque campagne, sur les mêmes graines que la référence.

1. **Nouvelle référence sans Domaine**, à dt 0,5 et 0,1 (règle 4 de `CLAUDE.md`) : 8 profils × 200 graines × 6 h, avec et sans événements. Rejouer aussi `lab/design/seuils-mesure.ts` pour obtenir les mêmes tables (surnoms, maturations, hauts faits).
2. **Écart des vocations** (A5, 3.2) : mono × 4 à 6 h et à 12 h. Cible : ≤ ×5 ; Étudier ≥ 30 % du meilleur. La compensation de l'Harmonie relève du game-balancer.
3. **Chaîne de longévité réécrite** (2.1) : taux de maturation par profil, et part d'Éternel chez l'optimiseur (≤ 30 % des 60 derniers héros).
4. **Part de vies surnommées par profil** (3.1), avec les surnoms réécrits : 40–60 % pour chaque profil ; aucun surnom au-dessus de 40 % des surnoms d'un profil ; surnoms jamais remplis ≤ 5 (contre 9 aujourd'hui, Domaine compris).
5. **Déblocages et accès** : `unlock.mediter` p90 ≤ 300 s ; Alliances et Chroniques avec un profil épargnant (3.5) ; plateau le plus long ≤ 60 min sur les 4 premières heures, en comptant les Archives (2.4).
6. **Héritage** (E1) : `legacyTotal` contre T04 ; trancher le rouge accepté de R13.
7. **Destin du jour** : recalibrer sur 365 dates (Or faisable 100 %, Bronze ou mieux ≥ 80 % des profils raisonnables, Or au premier essai < 10 %).
8. **Éclipse et Concile** (3.3) : variante en mémoire, critère ≤ ×1,5.
9. **Bazar** (3.4) : profil acheteur, sur 24 h.
10. **Hauts faits** sur 6 et 48 h : remplacement de Récolte raisonnée ; seuil de Mémoire des Chroniques ramené à ≈ 45 % des surnoms atteignables.
11. **Surnoms jamais remplis par construction** : le Bâtisseur (distribution de `st.bd` par vie) et le Bref (distribution de `durRatio`).

---

## 5. Réserves de place pour le contenu futur

Ce que le recalibrage doit laisser libre pour les titres, hauts faits et mini-jeux.

1. **R-1 · Information de lignée.** Ne pas afficher d'office la chance de transmission, le budget, l'usure exacte ni le seuil de record. Ces révélations sont la matière des Archives et de titres futurs (« le Généalogiste »). Le recalibrage ne doit pas dépendre de leur visibilité.
2. **R-2 · Marge d'Éclats.** Garder le revenu d'Éclats à ≤ 80 % de ce que le Bazar peut absorber utilement, pour que hauts faits et titres puissent payer en Éclats sans inonder le Bazar. Aujourd'hui l'événementiel finit à 20,6 ✦ non dépensés : la marge est à mesurer avec (3.4).
3. **R-3 · Une case de bâtiment et une place dans le milieu de partie.** Ne pas combler tout le creux de 60 à 160 min avec des réglages de coûts. Laisser une fenêtre (génération 50, vers 1 h 15) pour les Lices et leur mini-jeu.
4. **R-4 · Surnoms et hauts faits libres.** Viser 30 surnoms après le nettoyage, dont ≤ 5 jamais remplis par les profils. Laisser 4 à 6 emplacements de surnoms Rares ou Épiques pour les titres de fin de partie, sans les compter dans la cible de 40–60 % (titres hors surnoms, ou surnoms à conditions humaines).
5. **R-5 · Aucune puissance permanente ajoutée.** Le recalibrage doit laisser `log10Value` de l'expérimenté dans la plage 8,0–8,6 à 6 h **sans** compter sur les hauts faits ni sur les titres : leur récompense reste cosmétique ou en Éclats, comme l'exige `feats.ts`.

---

## Annexe : fichiers de ce chantier

- `lab/design/seuils-mesure.ts` : mesure vie par vie (surnoms remplissables et donnés, maturations, conditions de santé, hauts faits, accès aux Chroniques et aux Alliances).
- `lab/design/seuils-genh.ts` : générations par heure.
- `lab/design/seuils/*.json` : sorties de SEUILS-B (10 profils × 200 graines × 6 h ; 4 profils × 40 graines × 24 h).
- Limites :
  - les profils ne se marient pas, ne mettent jamais en pause et n'achètent rien au Bazar (sauf l'optimiseur) : toute la colonne « Alliances, pause, Bazar » reste non mesurée ;
  - dt 0,5 : l'Harmonie est un peu surestimée (+0,02–0,03) par rapport à dt 0,1 (KPIS § 1.6), ce qui ne change pas le sens des écarts de 3 % à 100 % mesurés ici.
