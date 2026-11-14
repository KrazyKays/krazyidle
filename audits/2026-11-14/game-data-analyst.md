# Audit phase 1 — Game Data Analyst (2026-11-14)

## 1. Résumé et verdict

Le socle de mesure est **sain sur l'essentiel** : 0 anomalie sur 1 800 + 600 parties, reproductibilité au bit près (40/40), rang des profils stable de 3 h à 12 h. Mais **quatre défauts empêchent aujourd'hui de décider un retour arrière sur la foi des chiffres** : `summary.md` fait la moyenne de la sentinelle « jamais » (−1), `echoShare` est faux d'un facteur ×6,7 pour le joueur à sessions, `sim:compare` signale 9 à 17 % de faux écarts au test A/A sans vérifier la comparabilité, et `harmonyMin` mesure le démarrage, pas la stratégie. Côté jeu, les données révèlent un **système de surnoms effondré** (100 % des surnoms = « le Vénérable », 1 sur 34) et des écarts entre vocations qui **divergent** avec l'horizon (×12,5 à 3 h, ×41,6 à 12 h).
**Verdict : mesurable après correction de l'outillage ; garde-fous exécutables livrés (`lab/metrics/guardrails.ts`).**

## 2. Périmètre et méthode

Commit `6f47e27` (le dossier `src/` est identique à `a53d1b5`, commit des références : `git diff --stat a53d1b5 6f47e27 -- src` vide). Toutes les données sont **[SIMULÉES]** : profils heuristiques de `lab/sim/profiles.ts`, sans vrais joueurs.

**Exécuté :**

| Campagne | Commande | Parties | Objet |
|---|---|---|---|
| C000, C001 (Lead) | voir `lab/campaigns/CAMPAIGNS.md` | 1 800 + 600, graines 1–200, 6 h, dt 0,5 | Références, réanalysées depuis `runs.jsonl` |
| C401 | `npm run sim -- --profiles=experimente,optimiseur,mono-chasser,mono-cultiver --seeds=1-40 --hours=6 --dt=0.1 --workers=2 --id=C401-dt01-vs-dt05` | 160 | Effet de dt, apparié avec C000 |
| C402 | `npm run sim -- --profiles=<9 profils> --seeds=1-50 --hours=12 --workers=2 --id=C402-horizon-12h` | 450 | Horizon 3 / 6 / 12 h |
| C403 | `npm run sim -- --profiles=experimente,optimiseur --seeds=1-20 --hours=6 --workers=2 --id=C403-reproductibilite-HEAD` | 40 | Reproductibilité |
| C404 | `node --import ./lab/sim/register.mjs lab/metrics/collect-extra.ts --profiles=<9 profils> --seeds=1-100 --hours=6 --workers=2 --id=C404-kpi-additionnels` | 900 | KPI non collectés par le runner |

Le collecteur `lab/metrics/collect-extra.ts` reproduit la boucle de `runGame` sans modifier `lab/sim/`. Vérification **[MESURÉ]** : `log10Value` et `harmonyMin` identiques au bit près à `runGame` sur 6 parties (3 profils × 2 graines, 2 h).

Scripts d'analyse (lecture seule) : `lab/metrics/analyze.ts` (usage des mécaniques, sentinelles, corrélations, valeurs aberrantes, puissance), `lab/metrics/robustness.ts` (dt, horizon, reproductibilité, convergence), `lab/metrics/aa-test.ts` (test A/A de `sim:compare`) et `lab/metrics/guardrails.ts` (garde-fous). Le tableau de bord se génère avec `lab/reports/build-dashboard.ts`.

**Non exécuté** : aucun parcours navigateur, aucun test de l'UI. Le Destin du jour n'est pas simulé (hors `runGame`). Je n'ai lancé aucune campagne avec événements au-delà de C001, ni aucune à 8 h (horizon du chiffre du GDD 2.3). Pause, choix d'Écho manuel et mariage entre joueurs ne sont exercés par aucun profil. dt 0,1 n'a été vérifié que sur 4 profils et 40 graines.

## 3. Constats (triés par priorité)

Aucun constat **Critique** dans ce domaine : aucune anomalie numérique, et le déterminisme est vérifié.

### DATA-01 Un seul surnom sur 34 : « le Vénérable » capte 100 % des vies surnommées
- **Priorité** : Élevée
- **Domaine** : Chroniques (fin de partie), KPI de surnoms
- **Description** : dès qu'une lignée entretient sa vocation au rang X, chaque vie remplit la condition de « le Vénérable » (épique, `vocTier ≥ 10`). Ce surnom bat tous les rares et communs, et il passe avant les autres épiques dans l'ordre de la liste. Les 33 autres surnoms ne sortent jamais.
- **Preuve / observation** : [SIMULÉ] C404 (100 graines, 6 h, dt 0,5) : 14 349 vies surnommées, toutes « venerable » (mono-cultiver 4 085, mono-commercer 4 028, mono-chasser 2 690, optimiseur 2 653, mono-etudier 893). C000 : `epithetsFound` = 1,000 ± 0,000 sur 600 parties mono (cultiver, chasser, commercer) ; optimiseur 0,99. Vies surnommées après l'achat de Chroniques : 78 à 85 %, contre « environ la moitié » au GDD 2.6. C402 (12 h) : toujours 1,00 surnom distinct pour les 5 profils mono et l'optimiseur ; seul `experimente`, qui change de vocation une génération sur trois, en atteint 4,1. [CODE] `src/engine/epithets.ts:70` (condition `f.vocTier >= 10`, permanente), `src/engine/epithets.ts:116-119` (le plus rare l'emporte, à rareté égale l'ordre de la liste décide).
- **Gravité** : une mécanique majeure de la 0.2 (34 surnoms, Codex, Éclats de découverte) se réduit à un bonus fixe de +15 % de puissance.
- **Impact sur l'expérience** : le Codex reste vide pour un joueur fidèle à une vocation, qui est pourtant la stratégie que le jeu récompense (vocation +20 % par rang). La découverte n'a plus lieu.
- **Probabilité que le problème soit réel** : Forte. Le mécanisme est déterministe dans le code. Seule l'ampleur dépend des profils (un vrai joueur change peut-être plus souvent de vocation).
- **Correction proposée** : (à arbitrer par GD/BAL) ne décerner « le Vénérable » qu'à la vie qui **atteint** le rang X (transition 9 → 10), ou le rendre non cumulable d'une génération à l'autre ; éventuellement tirer au sort entre les surnoms de même rareté.
- **Effets secondaires potentiels** : moins de vies surnommées (rapprochement des ~50 % du GDD) et un bonus de puissance moyen des Échos en baisse, ce qui peut faire chuter `log10Value` des profils mono de quelques %.
- **Méthode de vérification** : relancer C404 (`collect-extra.ts`, mêmes graines). Seuils : aucun surnom > 60 % des vies surnommées ; `epithetsFound` ≥ 3 en 6 h pour optimiseur, mono-cultiver et mono-commercer ; part des vies surnommées entre 30 et 70 % (garde-fous `epithetsFound` et `epithetLivesShare` de `guardrails.ts`).

### DATA-02 `summary.md` / `summary.json` font la moyenne de la sentinelle « jamais » (−1)
- **Priorité** : Élevée
- **Domaine** : outillage (`lab/sim/stats.ts`), onboarding
- **Description** : `unlockAt = -1` (jamais débloqué) entre dans `dist()` comme une durée. Les moyennes, p10 et p50 publiées sont donc fausses dès qu'un profil ne débloque pas une activité, et elles **cachent** un blocage réel.
- **Preuve / observation** : [CODE] `lab/sim/stats.ts:24` (`unlock.*` gardé même quand `t < 0`), puis `dist()` sans filtre. [SIMULÉ] C000, optimiseur : `summary.md` affiche Étudier « moy. 38,8 s, p50 −1 ». En réalité, **73 %** des parties ne débloquent jamais Étudier, et les autres le débloquent en 117 s (p50). Méditer : 98 % jamais, affiché « 95,2 s ». C001 : 59 % et 99 % jamais. Autres profils : moyenne biaisée vers le haut par l'arrondi (debutant 519,5 publié contre p50 réel 385).
- **Gravité** : le rapport de référence affirme qu'Étudier se débloque vers 39 s, alors que le profil gourmand ne le voit jamais. `sim:compare` lit ces moyennes.
- **Impact sur l'expérience** : indirect. Le blocage (un joueur qui ne commerce pas ne voit jamais Étudier ni Méditer, ni la Bibliothèque, ni le Sanctuaire, ni la Clepsydre) passe inaperçu.
- **Probabilité que le problème soit réel** : Certaine (code et données).
- **Correction proposée** : dans `scalars()`, émettre `unlock.<a>` seulement si `t ≥ 0`, plus `never.<a>` ∈ {0, 1}. Afficher la part « jamais » dans `summary.md`. `lab/metrics/analyze.ts` applique déjà cette règle.
- **Effets secondaires potentiels** : les baselines existantes deviennent incomparables pour `unlock.*` : régénérer `summary.json` de C000 et C001 à partir de `runs.jsonl`.
- **Méthode de vérification** : `npm run sim -- --profiles=optimiseur --seeds=1-200 --hours=6` doit afficher `never.etudier` ≈ 0,73 et `unlock.etudier` p50 ≈ 117 s.

### DATA-03 `echoShare` est faux pour les profils à sessions (×6,7 d'erreur)
- **Priorité** : Élevée
- **Domaine** : KPI du pilier 1 (« chaque vie compte »)
- **Description** : le runner ajoute la valeur produite hors ligne au dénominateur sans rien au numérateur. Pour un joueur à sessions, la part des Échos mesure donc surtout le temps passé en ligne.
- **Preuve / observation** : [CODE] `lab/sim/runner.ts:97` (`allV += totalValue(s) - v0` hors ligne, `echoV` inchangé). [SIMULÉ] C404, occasionnel (100 graines) : part des Échos en ligne 0,682 ; **avec le hors-ligne, 0,927** ; 78,9 % de la valeur est produite hors ligne. Le runner publie 0,138 (C000) et 0,188 (C001). Corrélation `echoShare` ↔ valeur : −0,61 pour l'occasionnel, contre +0,53 à +0,94 pour tous les autres profils. Il faudrait 1 514 graines pour détecter un écart de 5 % sur ce KPI.
- **Gravité** : le KPI d'un pilier de design affiche le contraire de la réalité pour le profil le plus proche d'un joueur d'idle.
- **Impact sur l'expérience** : aucun en jeu ; risque de mauvaise décision d'équilibrage (« les Échos ne servent pas aux joueurs occasionnels »).
- **Probabilité que le problème soit réel** : Certaine pour la mesure. Le chiffre corrigé dépend de l'inversion de la moyenne glissante (k = 1/3 à dt 1), qui est exacte à l'arrondi près.
- **Correction proposée** : dans le runner, rejouer le hors-ligne pas à pas (comme `collect-extra.ts`) ou exposer le brut des Échos par tick dans `Runtime` (phase 4, `src/`). D'ici là, ne pas lire `echoShare` pour `occasionnel`.
- **Effets secondaires potentiels** : un hors-ligne pas à pas dans le runner ralentit un peu les profils à sessions (déjà au pas de 1 s).
- **Méthode de vérification** : `echoShare` de l'occasionnel (runner corrigé) = `echoShareAll` de C404 (0,927 ± 0,02), mêmes graines.

### DATA-04 `sim:compare` ne permet pas de décider un retour arrière
- **Priorité** : Élevée
- **Domaine** : outillage (`lab/sim/compare.ts`, `lab/sim/stats.ts`)
- **Description** : (a) il compare sans broncher des campagnes non comparables (dt, durée, événements) ; (b) la règle « |Δ| > 5 % ou |d| > 0,3 » n'a pas de base statistique : elle ne tient compte ni de n ni de l'appariement des graines ; (c) le Δ relatif d'un log n'a pas de sens (5 % de 8,5 = ×2,7 de valeur) ; (d) le code de sortie vaut toujours 0 ; (e) `upgradeAt.*`, `epithetLives`, `lives` et `traitFreq60` sont absents de `summary.json`, donc ne sont jamais comparés.
- **Preuve / observation** : [MESURÉ] `node --import ./lab/sim/register.mjs lab/metrics/aa-test.ts C000-reference-sans-evenements C001-reference-avec-evenements` (même code, graines 1–100 contre 101–200) : **40 lignes sur 463 (8,6 %)** signalées pour C000, **25 sur 148 (16,9 %)** pour C001, toutes fausses (exemple : occasionnel `echoShare` −10,6 %). [MESURÉ] `npm run sim:compare -- lab/baselines/C000-….json lab/baselines/C001-….json` produit un tableau d'écarts entre une campagne sans événements et une avec événements, sans avertissement, puis sort avec le code 0. [CODE] `lab/sim/compare.ts:16`, `lab/sim/stats.ts:18-32`.
- **Gravité** : le protocole (§ 6) fonde le retour arrière sur cette comparaison. On aurait à la fois de faux retours arrière (bruit) et des régressions manquées (un effet réel de 10 % sur l'occasionnel donne d ≈ 0,17).
- **Impact sur l'expérience** : indirect (qualité des corrections de la phase 4).
- **Probabilité que le problème soit réel** : Certaine.
- **Correction proposée** : utiliser `lab/metrics/guardrails.ts`, livré avec cet audit. Il refuse les campagnes incomparables (code 2), teste chaque KPI contre un seuil de pertinence **et** |z| ≥ 3 (Welch, ou test apparié si mêmes graines), exprime la valeur en % de valeur, distingue ROUGE, ORANGE (écart non concluant, à refaire avec plus de graines) et DETTE (déjà hors plage dans la référence), et sort avec le code 1 si un garde-fou est ROUGE. En phase 4 : ajouter à `compare.ts` la vérification des métadonnées et n / IC95.
- **Effets secondaires potentiels** : les seuils de `guardrails.ts` (cf. `KPIS.md`) sont des propositions à valider par le Lead, GD et BAL.
- **Méthode de vérification** : [MESURÉ] `guardrails.ts C000 C000` → 0 ROUGE, 10 DETTE, code 0 ; `guardrails.ts C000 C001` → « Campagnes incomparables (events : false ≠ true) », code 2. Test A/A de `guardrails.ts` (C000, graines 1–100 contre 101–200, script `evaluate()`) : 0 ROUGE, 0 ORANGE, 76 VERT, 10 DETTE [MESURÉ], contre 40 faux signalements pour `sim:compare`.

### DATA-05 `harmonyMin` mesure le démarrage, pas la stratégie, et dépend de dt
- **Priorité** : Moyenne
- **Domaine** : KPI d'Harmonie (GDD 2.4)
- **Description** : le minimum d'Harmonie est atteint pendant la première demi-heure, commune à tous les profils mono (ils jouent comme le bot historique avant 30 min). Ce KPI ne distingue donc pas les stratégies. Il est en plus biaisé par le pas de temps.
- **Preuve / observation** : [SIMULÉ] C000 : `harmonyMin` est **identique au bit près pour 100 % des graines** entre mono-cultiver, mono-commercer, mono-etudier et mono-mediter (`analysis-C000…md`, dernière table). C404 : instant du minimum, p50 = 572 s pour ces 4 profils. Le minimum après 30 min les sépare nettement : mono-cultiver 0,782, mono-commercer 0,935, mono-mediter 0,954. C401 (apparié, 40 graines) : à dt 0,1, `harmonyMin` gagne +0,018 à +0,032 (z 6,1 à 12,3) et `harmonyAvg` gagne +0,037 pour l'optimiseur (z 3,3). Corrélation `harmonyMin` ↔ valeur : |r| ≤ 0,15 partout.
- **Gravité** : un garde-fou posé sur `harmonyMin` ne verrait pas une stratégie qui ruine le Domaine après 30 min.
- **Impact sur l'expérience** : indirect.
- **Probabilité que le problème soit réel** : Certaine.
- **Correction proposée** : remplacer le KPI par `harmonyMinAfter30` et `harmonyP05` (pondéré par le temps), collectés par `collect-extra.ts`, et confirmer toute conclusion sur l'Harmonie à `--dt=0.1`.
- **Effets secondaires potentiels** : aucun sur le jeu.
- **Méthode de vérification** : relancer C404 : `harmonyMinAfter30` doit différer entre profils mono (é.-t. inter-profils > 0,05, déjà vrai).

### DATA-06 Le profil de référence n'atteint jamais Chroniques en 6 h, et la fin de partie n'est pas mesurée
- **Priorité** : Moyenne
- **Domaine** : KPI de fin de partie, couverture des profils
- **Description** : `experimente`, `debutant` et `occasionnel` n'achètent **jamais** Chroniques en 6 h. Pourtant, experimente gagne 2 197 ⚜️ et achète Alliances (90 ⚜️) dans 100 % des parties. L'achat gourmand parcourt `LEGACY` dans l'ordre : les améliorations bon marché, placées avant Chroniques (160 ⚜️, en dernier), absorbent tout l'Héritage. C'est un artefact du profil. Il rend pourtant tous les KPI de surnoms vides pour le joueur de référence.
- **Preuve / observation** : [SIMULÉ] C000 : Chroniques acheté dans 0 % des parties (experimente, debutant, occasionnel, mono-mediter), 79 % (mono-etudier), 99–100 % (optimiseur, mono-cultiver, mono-commercer, mono-chasser ; p50 entre 261 et 295 min). C402 : à 12 h, experimente et debutant l'achètent dans 100 % des parties (4,1 et 5,0 surnoms distincts). [CODE] `lab/sim/profiles.ts:84-91` (`buyAllGreedy`), `src/engine/data.ts:197-209` (ordre de `LEGACY`). `upgradeAt` n'est pas dans `summary.json` : l'information n'était visible qu'en relisant `runs.jsonl`.
- **Gravité** : la question « un joueur normal atteint-il la fin de partie en 6 h ? » n'a pas de réponse fiable. Selon le profil, elle vaut 0 % ou 100 %.
- **Impact sur l'expérience** : à mesurer. Un vrai joueur qui garde ses ⚜️ pour Chroniques l'achèterait vers 1 h 30 – 2 h [HYPOTHÈSE à mesurer].
- **Probabilité que le problème soit réel** : Forte pour l'artefact de mesure, Faible pour un problème de jeu.
- **Correction proposée** : ajouter un profil « joueur qui épargne pour les déblocages » (agent comportements) ; ajouter `upgradeAt.*` à `scalars()` ; garde-fou `has.chroniques` ≥ 90 % pour les profils compétents à 6 h.
- **Effets secondaires potentiels** : aucun.
- **Méthode de vérification** : un profil épargnant atteint Chroniques dans ≥ 90 % des parties de 6 h (`guardrails.ts`, règle `has.chroniques`).

### DATA-07 Puissance statistique insuffisante pour 5 profils sur 9, et sensibilité de l'optimiseur à dt
- **Priorité** : Moyenne
- **Domaine** : robustesse des mesures
- **Description** : avec 200 graines, un écart de 5 % de valeur n'est détectable que pour experimente et les profils mono-cultiver, mono-chasser et mono-commercer. Pour l'optimiseur, la conclusion change avec dt.
- **Preuve / observation** : [SIMULÉ] C000, graines par groupe pour détecter 5 % de valeur (α 0,05, puissance 0,8) : experimente 41, mono-chasser 30, mono-cultiver 33, mono-commercer 64, mono-etudier 203, debutant 334, optimiseur 393, mono-mediter 475, occasionnel 2 171. Demi-largeur de l'IC95 de la valeur à n = 200 : 0,9 % (mono-chasser) à 8,3 % (occasionnel). C401 (dt 0,1 contre 0,5, mêmes graines) : valeur experimente −0,9 % (z −0,7), mono-chasser −0,6 %, mono-cultiver +4,9 % (z 4,1), **optimiseur −15,7 % (z −2,3)**. La corrélation de rang entre graines d'une même partie à dt 0,1 et 0,5 est faible (0,16 à 0,37) : changer dt change la trajectoire, et l'appariement ne réduit presque pas la variance. L'optimiseur est bimodal sur `harmonyAvg` (p50 0,818 ; p90 0,971).
- **Gravité** : les conclusions sur l'optimiseur, le débutant et l'occasionnel ne sont pas fiables à ±5 %.
- **Impact sur l'expérience** : indirect.
- **Probabilité que le problème soit réel** : Certaine pour la puissance (calcul), Moyenne pour l'effet de dt sur l'optimiseur (z −2,3 < 3 : à confirmer avec 200 graines).
- **Correction proposée** : fixer le nombre de graines par profil (cf. `KPIS.md` § 1). Seuil de 10 % pour optimiseur, debutant et occasionnel. Confirmer à dt 0,1 tout changement touchant l'Harmonie ou l'optimiseur. Explorer la bimodalité de l'optimiseur (agent comportements).
- **Effets secondaires potentiels** : des campagnes plus longues (occasionnel : ~0,1 s par partie, peu coûteux).
- **Méthode de vérification** : relancer C401 avec 200 graines pour l'optimiseur, puis lire z.

### DATA-08 Les écarts entre vocations divergent avec l'horizon (×12,5 → ×41,6)
- **Priorité** : Moyenne (à arbitrer avec BAL, qui en tire la conséquence d'équilibrage)
- **Domaine** : KPI inter-profils, stabilité des conclusions
- **Description** : le classement des profils est stable, mais l'écart entre la meilleure et la pire vocation grandit sans arrêt. Le chasseur, viable à 1 h, s'éloigne du paysan. Une référence à 6 h sous-estime donc le déséquilibre de fin de partie.
- **Preuve / observation** : [SIMULÉ] C402 (50 graines, 12 h, dt 0,5) : rapport de valeur entre le meilleur et le pire profil mono de ×4,0 (1 h), ×12,5 (3 h), ×26,6 (6 h), ×36,8 (9 h) et ×41,6 (12 h) ; mono-mediter est toujours dernier. Chasser / Cultiver : 124 % (1 h), 60 % (3 h), 45 % (6 h), 38 % (12 h), contre « ~70 %, 33–118 % » au GDD 2.4 (mesure à 3 h avec un autre protocole). Corrélation de rang des profils entre 3 h et 12 h : 0,90. C000 : mono-commercer 8,929 contre mono-mediter 7,525, soit ×25,4.
- **Gravité** : au-delà du critère objectif ×10 du protocole dès 3 h ; Méditer n'est pas une vocation viable.
- **Impact sur l'expérience** : une lignée de Mystiques progresse 25 à 40 fois moins vite.
- **Probabilité que le problème soit réel** : Forte (n = 50 à 200, écarts de plusieurs dizaines d'écarts-types). Les profils mono restent des heuristiques.
- **Correction proposée** : relève de BAL. Côté données, garde-fous `mono.ratio` ≤ ×10 et chasser/cultiver ≥ 33 %, à vérifier à 6 h **et** à 12 h.
- **Effets secondaires potentiels** : —
- **Méthode de vérification** : `guardrails.ts` sur une relance de C402 : `mono.ratio` ≤ 10 à 6 h et à 12 h.

### DATA-09 Joueur à sessions : pas de courbe horaire, et 89 % du temps en succession en attente
- **Priorité** : Moyenne
- **Domaine** : KPI de rythme, profil occasionnel
- **Description** : (a) le runner n'enregistre `hourly` que pendant les pas en ligne : un saut hors ligne franchit les heures sans les écrire. La courbe de l'occasionnel est donc **vide**, et le KPI « valeur par heure, sans mur » n'existe pas pour ce profil. (b) L'héritier ne peut être choisi qu'en ligne. Le héros de l'occasionnel meurt au début de chaque absence de 4 h, et la lignée attend ensuite (seuls les Échos produisent).
- **Preuve / observation** : [CODE] `lab/sim/runner.ts:93-103` (la branche hors ligne fait `continue` sans point horaire) et `:127`. [SIMULÉ] C000 : `hourly` = `[]` pour les 200 parties de l'occasionnel. C404 : succession en attente pendant 19 252 s sur 21 600 (89 %), contre 84 s pour experimente ; 28,2 générations en 6 h contre 168,8 ; vie moyenne de 87 s.
- **Gravité** : le rythme du joueur occasionnel, cible naturelle d'un idle, n'est pas mesuré. La succession « non bloquante » (GDD 2.1) bloque en pratique toute la boucle dynastique hors ligne.
- **Impact sur l'expérience** : un joueur qui revient toutes les 4 h ne gagne que ~1 génération par absence [SIMULÉ, avec l'hypothèse du profil : 20 min en ligne puis 4 h hors ligne].
- **Probabilité que le problème soit réel** : Certaine pour la mesure ; à confirmer par GD pour le ressenti.
- **Correction proposée** : écrire les points horaires après chaque saut hors ligne (runner, phase 4) ; ajouter `successionWaitShare` aux KPI ; laisser GD juger d'une succession automatique hors ligne.
- **Effets secondaires potentiels** : une succession automatique hors ligne multiplierait les générations de l'occasionnel. À encadrer par les garde-fous `gen` et `legacyTotal`.
- **Méthode de vérification** : `hourly.length` = 6 pour toutes les parties de l'occasionnel ; `successionWaitSec` publié dans `extra.jsonl`.

### DATA-10 Mécaniques sous-utilisées ou jamais exercées par les profils compétents
- **Priorité** : Moyenne
- **Domaine** : usage des mécaniques (seuil : < 5 % des parties d'un profil compétent)
- **Description** : plusieurs mécaniques ne sont jamais (ou presque jamais) utilisées par experimente, optimiseur ou occasionnel. Il faut distinguer ce que les profils **ne savent pas faire** (non mesuré) de ce qu'ils **choisissent de ne pas faire** (sous-utilisé).
- **Preuve / observation** : [SIMULÉ] C000, part des parties (`analysis-C000…md`) :
  - **Sous-utilisé par choix** (le profil peut le faire) :
    - optimiseur : Méditer 0 %, Étudier 3 %, Commercer 5 % (activité ≥ 5 % du temps) ; Sanctuaire 0 %, Clepsydre 0 %, Bibliothèque 3 %, Garde forestier 19 %.
    - Échos gardés par experimente : 0 % de secondes Cultiver, Chasser ou Méditer ; il ne garde que des vies de Commerce et d'Étude (C404 : 1,7 et 3,3 Échos sur 5). Même tendance pour l'occasionnel (Méditer 0 %).
    - Béni des astres (Bazar) : 0 % partout, y compris avec événements (C001 : 6 à 9,5 Éclats en fin de partie).
    - Événements : l'optimiseur n'en termine que 0,25 en 6 h, contre 1,0 pour experimente (C001).
  - **Non mesuré** (aucun profil ne le fait) : pause (`pausedShare` = 0 dans les 2 400 parties), mariage entre joueurs. Seul l'optimiseur se marie, avec une distribution très asymétrique : 26 parties sur 200, jusqu'à 68 unions dans une seule partie.
  - Traits : Élu présent chez 83 à 86 % des 60 derniers ancêtres d'experimente et des mono ; l'optimiseur converge vers Élu + Éternel (84 % et 77 %) et tombe à 16,4 combinaisons, contre 27–30 annoncées au GDD 2.3.
- **Gravité** : déséquilibre net mais contournable. Méditer ne rapporte rien à court terme, et l'Écho gardé « par valeur » écarte systématiquement certaines activités.
- **Impact sur l'expérience** : un joueur qui suit l'information de valeur affichée n'a aucune raison de méditer ni de garder un Écho chasseur.
- **Probabilité que le problème soit réel** : Moyenne. C'est fortement dépendant des heuristiques des profils.
- **Correction proposée** : (BAL/GD) revoir l'intérêt de Méditer ; (comportements) ajouter des profils qui exercent la pause, l'épargne en Éclats et le choix d'Écho par diversité ; (données) suivre ces taux dans le tableau de bord (carte de chaleur « Utilisation des mécaniques »).
- **Effets secondaires potentiels** : —
- **Méthode de vérification** : relancer `analyze.ts` : chaque activité ≥ 5 % du temps héros chez au moins un profil compétent ; Béni des astres > 0 sur une campagne de 12 h avec événements.

### DATA-11 Valeurs aberrantes non signalées par les résumés
- **Priorité** : Faible
- **Domaine** : qualité des données
- **Description** : quelques graines s'écartent de plus de 3 é.-t. sans que `summary.md` le signale (il ne donne que min et max).
- **Preuve / observation** : [SIMULÉ] C000 : mono-etudier graine 93, z = +7,5 (Héritage 4 068 contre une moyenne de 2 745 ; 84,5 % d'Étude) ; experimente graine 46, z = +4,7 ; optimiseur : 6 graines entre z −3,0 et −3,3 (queue basse de la bimodalité). Cela fait 15 graines sur 1 800, soit plus que le ~0,3 % attendu pour une loi normale (5 attendues).
- **Gravité** : faible. Ces graines peuvent cacher un enchaînement de traits ou de surnoms exploitable.
- **Impact sur l'expérience** : —
- **Probabilité que le problème soit réel** : Moyenne.
- **Correction proposée** : rejouer mono-etudier graine 93 pas à pas (agent comportements) ; lister les |z| > 3 dans `summary.md`.
- **Effets secondaires potentiels** : —
- **Méthode de vérification** : `analyze.ts` liste les graines aberrantes, à examiner au cas par cas.

### DATA-12 Baisses du débit horaire chez le débutant
- **Priorité** : Faible
- **Domaine** : rythme (KPI « sans mur »)
- **Description** : 15 % des parties du débutant connaissent au moins une heure où le débit de valeur baisse de plus de 5 % par rapport à l'heure précédente. Aucun autre profil ne dépasse 2 %.
- **Preuve / observation** : [SIMULÉ] C000, `analyze.ts` (colonne « baisses de débit horaire »). L'hypothèse est la règle « garder les Échos les plus récents » du profil, qui peut remplacer un bon Écho par un moins bon [HYPOTHÈSE].
- **Gravité** : faible. C'est un ressenti possible de régression.
- **Impact sur l'expérience** : un débutant qui garde ses derniers Échos peut voir sa production baisser.
- **Probabilité que le problème soit réel** : Faible à Moyenne.
- **Correction proposée** : vérifier la cause sur 2 ou 3 graines (comportements, GD) ; garde-fou : ≤ 5 % des parties avec une baisse.
- **Effets secondaires potentiels** : —
- **Méthode de vérification** : `analyze.ts`, colonne « parties avec ≥ 1 baisse ».

### DATA-13 Résumés sans intervalle de confiance ni n, quantiles au rang le plus proche
- **Priorité** : Amélioration facultative
- **Domaine** : outillage
- **Description** : `summary.md` ne donne ni n ni IC95. Les quantiles sont pris au rang le plus proche (`lab/sim/stats.ts:12`), ce qui donne des paliers sur les petites campagnes.
- **Preuve / observation** : [CODE] `lab/sim/stats.ts:6-15`.
- **Gravité** : —
- **Impact sur l'expérience** : —
- **Probabilité que le problème soit réel** : —
- **Correction proposée** : ajouter n et IC95, et des quantiles interpolés (`lab/metrics/lib.ts:desc()`).
- **Effets secondaires potentiels** : les p10/p90 changent légèrement dans les baselines.
- **Méthode de vérification** : relire `summary.md`.

## 4. Points forts (à ne pas casser)

- **0 anomalie** (NaN, Infinity, négatif) sur 1 800 + 600 + 160 + 450 + 40 parties [SIMULÉ].
- **Déterminisme** : 40/40 parties identiques au bit près entre a53d1b5 et 6f47e27 (C403) [MESURÉ] ; le collecteur indépendant retrouve exactement `runGame` [MESURÉ].
- Le **classement des profils** est stable entre horizons (ρ 3 h ↔ 6 h = 0,97 ; 6 h ↔ 12 h = 0,95).
- **dt 0,5** suffit pour la valeur, les générations et l'Héritage des profils réguliers (|Δ| ≤ 5 %, C401). La campagne de référence (1 800 parties) prend ~1,5 min.
- **Budget génétique** : 33,8 combinaisons chez experimente et 52,1 chez debutant, loin des 2 à 5 d'avant la 0.2.1.
- **Onboarding rapide** : Commercer à 17,5 s, Étudier à 78 s et Méditer à 154 s (p90, experimente).
- **Les Échos portent la production** : 86 à 93 % de la valeur pour tous les profils en continu (pilier 1).

## 5. Questions ouvertes / mesures à faire

1. Relancer C401 avec 200 graines pour l'optimiseur, afin de confirmer l'effet de dt (z −2,3).
2. Mesurer à 8 h (horizon du chiffre de 27–30 combinaisons du GDD 2.3) avec un collecteur identique à celui du GDD.
3. Profils manquants (agent comportements) : épargne pour Chroniques, pause, choix d'Écho par diversité, dépense d'Éclats au Bazar. Sans eux, ces mécaniques restent « non mesurées ».
4. Mesurer le Destin du jour (scores par stratégie, GDD 1 : 400–800), absent de la simulation.
5. Valider les seuils de garde-fou (`KPIS.md`, `guardrails.ts`) avec le Lead, GD et BAL avant la phase 4.
6. Ajouter le test A/A de `guardrails.ts` (fait une fois : 0 ROUGE) à la procédure de la phase 4.

## 6. Annexes

**Fichiers livrés**
- `lab/metrics/KPIS.md` : référentiel v1 (formules, plages, garde-fous, KPI manquants, procédure de décision).
- `lab/metrics/lib.ts` (statistiques), `analyze.ts`, `robustness.ts`, `aa-test.ts`, `guardrails.ts` et `collect-extra.ts`.
- `lab/reports/build-dashboard.ts` génère `lab/reports/dashboard.html` (108 Ko, autonome, SVG inline, clair/sombre, sans défilement horizontal à 390 px).
- `lab/reports/analysis-C000-reference-sans-evenements.{md,json}`, `analysis-C001-reference-avec-evenements.{md,json}`, `robustness.{md,json}`.
- Résultats : `lab/results/C401-dt01-vs-dt05/`, `C402-horizon-12h/`, `C403-reproductibilite-HEAD/`, `C404-kpi-additionnels/` (`extra.jsonl`).

**Commandes** (depuis la racine, commit 6f47e27)
```
node --import ./lab/sim/register.mjs lab/metrics/analyze.ts C000-reference-sans-evenements C001-reference-avec-evenements
node --import ./lab/sim/register.mjs lab/metrics/robustness.ts
node --import ./lab/sim/register.mjs lab/metrics/aa-test.ts C000-reference-sans-evenements C001-reference-avec-evenements
node --import ./lab/sim/register.mjs lab/metrics/guardrails.ts C000-reference-sans-evenements <id-candidat>
node --import ./lab/sim/register.mjs lab/metrics/collect-extra.ts --profiles=… --seeds=1-100 --hours=6 --workers=2 --id=C4xx-…
node --import ./lab/sim/register.mjs lab/reports/build-dashboard.ts [--ref=<id>] [--cand=<id>]
```
