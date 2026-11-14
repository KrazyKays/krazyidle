# Audit phase 1 — Player Behavior Analyst

Date : 2026-11-14 · Moteur audité : `src/` identique de `6f47e27` à `10324b4` (les commits intermédiaires ne touchent que `lab/` et `audits/`) · Auteur : agent player-behavior-analyst

## 1. Résumé et verdict

- **Le jeu ne protège pas le joueur idle le plus courant.** Sur ordinateur, un onglet laissé en arrière-plan ne produit **rien** : on mesure 0,01 % de la production attendue après 30 min (PBA-01, Critique).
- **L'horloge système et la relance du jeu cassent l'économie partagée.** Avancer l'horloge donne une production et des Éclats illimités (PBA-02). Rouvrir le jeu au début d'un événement fixe l'objectif au plancher : palier Or dans 95 % des fenêtres au lieu de 56 % (PBA-03).
- **Les décisions comptent peu ou à l'envers.** Cliquer Commercer en boucle bat l'optimiseur informé (×2,2). Le débutant égale l'expérimenté. Un joueur qui entretient sa vocation peut s'enfermer pour toute la partie dans une lignée ×6 à ×25 moins productive (PBA-05, PBA-06).
- **Deux mécaniques de fin de partie s'effacent.** « Le Vénérable » prend 59 à 94 % des vies, ce qui vide les Chroniques (PBA-07). Les Alliances n'ont aucun effet mesurable (PBA-08).
- **Points forts.** Les exploits de surnoms, de pause et d'Affût sont **perdants**. Les codes du Destin du jour sont infalsifiables. Le hors-ligne vaut exactement le jeu en ligne inactif.

Verdict du domaine : **2 Critiques/Élevées bloquantes pour une sortie publique (PBA-01, PBA-02)**, plusieurs déséquilibres de comportement à traiter avant d'ajouter du contenu.

## 2. Périmètre et méthode

**Exécuté** (toutes les commandes figurent en annexe) :
- Le script `lab/profiles/pba-profiles.ts` ajoute 22 profils à `PROFILES` sans modifier `lab/sim/`. Il instrumente aussi les successions : vocation perdue, héritiers tous mauvais, attente, surnoms, paliers d'événements.
- Le lanceur `lab/profiles/run.ts` (2 workers) et l'agrégateur `lab/profiles/analyze.mjs` ont servi aux campagnes **C300 à C304**, soit 2 740 parties.
- Quatre scripts d'exploit tournent sur le vrai moteur :
  - `exploit-offline.ts` : hors-ligne, horloge, objectifs d'événements ;
  - `exploit-daily.ts` : Destin du jour, 30 dates, recherche automatique, codes ;
  - `exploit-alliances.ts` : codes AL1 ;
  - `pw-background-tab.ts` : parcours **Playwright** sur `vite --port 5190`, avec l'horloge Playwright et un onglet masqué émulé.
- Références réutilisées : C000 et C001 (`lab/results/`).

**Non exécuté** (marqué [HYPOTHÈSE] là où c'est cité) :
- Les campagnes de profils n'ont pas été revérifiées à `dt=0,1`. Seul le test hors-ligne compare `dt=0,1`.
- Le Chrome réel en arrière-plan (throttling natif) n'a pas été testé : c'est une émulation.
- La « ferme » de Fertile ou de Sang fécond n'a pas été isolée.
- Pause en fin de vie pour attendre un événement : non testée.
- Mariage croisé réel entre deux sauvegardes : seulement simulé par le faussaire et `exploit-alliances.ts`.

**Limites** : `dt` 0,5 s, profils heuristiques, `echoShare` approximatif. Tous les résultats [SIMULÉ] décrivent des bots, **pas de vrais joueurs**.

## 3. Profils joués

Résultats sur 6 h, 100 graines, sans événements, sauf mention. `log10V` est le log10 de la valeur totale produite.

| Profil | Hypothèses (réaction · règles) | log10V moy. (p10–p90) | ⚜️ total | Alliances / Chroniques (part, médiane) | Observations |
|---|---|---|---|---|---|
| debutant-realiste | décide /30 s ; 25 % de choix au hasard, dont 5 % sans intrants ; succession après 60 s, 1 fois sur 5 oubliée 10 min ; 1er héritier ; Échos récents ; 1 achat /60 s ; pause par erreur 3 %/décision (2 min) | 7,25 (7,00–7,51) | 623 | 0 % / 0 % | 106 s d'attente par succession ; 11,9 % du temps en pause |
| i-debutant (réf. C000) | décide /20 s, 1er héritier, Échos récents | 8,22 | 1 972 | 99 % à 5,2 h / 0 % | ≈ l'expérimenté |
| i-experimente (réf.) | bot historique | 8,26 | 2 197 | 100 % à 4,5 h / 0 % | n'achète jamais Chroniques en 6 h |
| i-optimiseur (réf.) | glouton informé | 8,59 | 3 527 | 100 % à 3,2 h / 99 % à 4,7 h | |
| opti-fort | glouton + Commercer si Vivres > 30 + vocation entretenue + épargne Alliances/Chroniques + Bazar + mariage PNJ | 8,00 (7,32–8,73) | 2 345 | 100 % à 0,64 h / 100 % à 1,2 h | **bimodal : 58 % des graines enfermées Érudit/Mystique** (PBA-05) |
| opti-epargne (C304) | optimiseur + épargne Alliances/Chroniques | 8,57 | 3 382 | 100 % à **0,47 h** / 100 % à **0,88 h** | l'épargne ne coûte rien (PBA-12) |
| opti-commerce (C304) | règle Commercer + vocation, sans épargne | 8,06 | 2 461 | 90 % / 39 % | 61 % des graines enfermées |
| sans-vocation-piege (C304) | n'entretient que Commercer/Cultiver | 8,34 (8,10–8,74) | 2 805 | 100 % / 100 % | plus aucune graine < 8,1 |
| mono-commercer / cultiver / chasser (réf.) | une seule activité après 30 min | 8,93 / 8,77 / 8,42 | 4 382 / 4 058 / 3 349 | 100 % à 3,1 h / 100 % à 4,4 h | **la plus simple domine** (PBA-06) |
| sans-bazar | opti-fort sans Bazar | 7,99 | 2 329 | idem | = opti-fort |
| sans-alliance | opti-fort sans mariage | 8,01 | 2 386 | idem | = opti-fort (PBA-08) |
| sans-echo-choix / echo-par-valeur | Échos récents / par valeur totale | 8,00 / 7,99 | 2 337 / 2 306 | idem | choix des Échos non décisif |
| occ-quotidien (C302, 72 h) | 15 min/jour, décisions de l'expérimenté | 7,42 | 174 | **0 % / 0 %** | |
| occ-3x-jour (C302, 72 h) | 10 min toutes les ~8 h | 8,61 | 487 | 0 % / 0 % | |
| i-occasionnel (C302, 72 h) | 20 min / 4 h | 9,52 | 2 440 | 100 % à 52 h / 27,5 % | |
| assidu (C302, 72 h) | 1 h 30 en ligne, 1 h 30 d'absence ; décisions de l'optimiseur | 10,81 | 34 011 | 100 % à 0,47 h | Vénérable = 94 % des vies |
| i-experimente / opti-fort (C302, 72 h) | en continu | 11,07 / 10,54 | 47 579 / 54 031 | | |

**Écarts entre profils**
- 6 h en continu : meilleur / pire = mono-commercer / debutant-realiste, soit 10^(8,93 − 7,25) = **×48**.
- 72 h : en continu / 15 min par jour = **×4 500**.
- Part des joueurs qui n'atteignent jamais Alliances : 100 % pour debutant-realiste en 6 h, 100 % pour occ-quotidien et occ-3x-jour en 72 h.

## 4. Exploits

| Piste | Exécuté ? | Gain mesuré | Gravité |
|---|---|---|---|
| Onglet en arrière-plan (bureau) | Oui [MESURÉ] Playwright | **−99,99 %** de production (perte, pas gain) | Critique (PBA-01) |
| Horloge avancée : +6 h, rouvrir, remettre l'heure, ×10 | Oui [MESURÉ] moteur, 20 graines | 60 h de production en ~10 min réelles (×394 la valeur de 10 min inactives) ; +70 ⚜️ | Élevée (PBA-02) |
| Horloge : sauts vers les fenêtres d'événement | Oui [MESURÉ] | 16,4 ✦ en 6 sauts de ≤ 60 s chacun (taux d'Éclats normal : 18–24 ✦/24 h) | Élevée (PBA-02) |
| Éclats illimités → Temps suspendu + Élu + Éternel à chaque vie | Oui [SIMULÉ] C303 | ×2 de valeur (8,31 vs 8,00) ; ⚜️ inchangé (2 308 vs 2 345) | Moyenne (montre que la boucle d'Éclats paie peu) |
| Relance du jeu au début d'un événement (`rt.rate` = 0) | Oui [MESURÉ] + [SIMULÉ] C301 | cible ÷5 078 en moyenne (min ÷24) ; palier Or dans 95 % des fenêtres vs 56 % ; 62,5 vs 48 ✦/24 h | Élevée (PBA-03) |
| Pause hors événements, héros joué seulement pendant les fenêtres | Oui [SIMULÉ] C301 | **perdant** : log10 8,68 vs 9,54 (×7 moins) | — (point fort) |
| Pause quand l'Harmonie baisse (farm le Juste / le Glorieux) | Oui [SIMULÉ] C300 | **perdant** : 7,29 vs 8,00 ; 2,6 « Juste » par partie | — |
| Hors-ligne au pas de 1 s vs en ligne au pas de 0,1 s | Oui [MESURÉ] | ratio 1,004 (0,990–1,015) : aucun gain | — (point fort) |
| Plafond hors-ligne 6 h + Patience | Oui [MESURÉ] | plafond 8–12 h atteint dès 2 h de jeu (opti-fort) | voir PBA-11 |
| Phénix à volonté (vie sacrifiée, puis ≥ 5×) | Oui [SIMULÉ] C300 | 7,3 Phénix par partie, mais **perdant** : 7,70 vs 8,00 | — |
| Sans-Repos à volonté (changer d'activité chaque seconde) | Oui [SIMULÉ] | 119 vies Sans-Repos, **perdant** : 7,52 vs 8,00 | — |
| Vénérable automatique | Oui [SIMULÉ] | 59–94 % des vies | Élevée (PBA-07) |
| Affût provoqué (chasser jusqu'à la disette, commercer, rechasser) | Oui [SIMULÉ] | 8,65 vs mono-chasser 8,42 (×1,7) mais < mono-commercer 8,93 | Faible |
| Codes AL1 forgés, maison neuve à chaque vie | Oui [MESURÉ] + [SIMULÉ] | bornes respectées ; consanguinité 0 % (vs 60 % en PNJ) ; +0,06 log10 ; héritiers tous mauvais 0,9 % vs 5,0 % | Moyenne (PBA-09) |
| Rejeu d'un même cadet en changeant le nonce | Oui [MESURÉ] | 5/5 acceptés | Moyenne (PBA-09) |
| Usurpation du nom d'une maison | Oui [MESURÉ] | accepté (nom et blason libres) | Faible (PBA-09) |
| Mariages PNJ répétés avec la même maison | Oui [MESURÉ] + [SIMULÉ] | consanguinité 60 % après 5 unions ; héritiers tous mauvais 5,0 % vs 0,9 % sans mariage | voir PBA-08 |
| Destin du jour : score gonflé | Oui [MESURÉ] | refusé | — (point fort) |
| Destin du jour : date future, tick négatif, 900 actions | Oui [MESURÉ] | date future acceptée ; les autres sont sans effet (0,6 ms) | Faible (PBA-10) |
| Destin du jour : bot de recherche vs une seule touche | Oui [MESURÉ] 30 dates | gain médian du bot ×1,000 ; moyen ×1,094 (max ×2,29) | Moyenne (PBA-10) |
| Reroll des héritiers par rechargement de la sauvegarde | Non exécuté : [CODE] | héritiers tirés de `s.seed` (`game.ts:371-373`), donc déterministes. [HYPOTHÈSE] pas de save-scum simple | — |
| Ferme d'héritiers (Fertile, Sang fécond) | **Non exécuté** [HYPOTHÈSE] | — | — |
| Pause en fin de vie pour la finir pendant un événement | **Non exécuté** [HYPOTHÈSE] : gain borné (×3 sur quelques secondes, Héritage en racine cubique) | — | — |
| Console de débogage `window.krazy` (`main.ts:127`) | [CODE] | édition libre de l'état | Faible (jeu solo ; voir PBA-02) |

## 5. Constats (Critique → Amélioration facultative)

### [PBA-01] Onglet en arrière-plan : la production est perdue
- **Priorité** : Critique
- **Domaine** : hors-ligne / boucle principale
- **Description** : `save()` fait `state.lastTick = Date.now()` (`src/main.ts:57-58`) et tourne par `setInterval` toutes les 10 s (`main.ts:114`), même quand l'onglet est masqué. Dans un onglet masqué, `requestAnimationFrame` ne tourne plus, donc aucun `tick`. Au retour, `catchUp()` (`main.ts:62-70`) voit un écart de quelques secondes, en dessous du seuil de 30 s, et rien n'est rattrapé.
- **Preuve / observation** : [MESURÉ]
  - Commande : `node --import ./lab/sim/register.mjs lab/profiles/pw-background-tab.ts --min=30`, avec `npx vite --port 5190`. État de milieu de partie : graine 7, 1 h d'opti-fort.
  - `lastTick` avance de 1 794,7 s pendant les 30 min masquées. Au retour, l'écart vu n'est que de 5,4 s. Le jeu n'affiche aucun rapport hors-ligne.
  - Gain : 9 points contre 61 732 attendus par `simulateOffline`, soit un ratio de **0,0001**.
  - Le masquage est émulé (rAF suspendu, `document.hidden`). En vrai Chrome, la limitation à 1 tick/min après 5 min plafonne l'écart vu à ≤ 60 s : la perte reste ≥ 97 % [HYPOTHÈSE].
- **Gravité** : perte de progression silencieuse.
- **Impact sur l'expérience** : laisser l'onglet ouvert derrière une autre fenêtre est *le* geste du joueur idle sur ordinateur. Il revient et trouve 0 gain. Il ne voit pas de rapport, donc ne comprend pas.
- **Probabilité que le problème soit réel** : Forte. Le mécanisme est lisible dans le code et mesuré en navigateur ; seul le throttling natif de Chrome n'a pas été testé. Le mobile en arrière-plan gèle aussi les timers et n'est sans doute pas touché.
- **Correction proposée** : ne pas modifier `lastTick` dans `save()`. `tick()` le tient déjà à jour (`game.ts:245`). À défaut, ne pas le modifier quand `document.hidden`.
- **Effets secondaires potentiels** : à la fermeture, `lastTick` vaudra le dernier tick, au plus quelques centaines de ms d'écart. Aucun double comptage.
- **Méthode de vérification** : relancer `pw-background-tab.ts`. Seuil : ratio ≥ 0,95 et rapport hors-ligne affiché.

### [PBA-02] Horloge système : production, Éclats et Destins illimités
- **Priorité** : Élevée
- **Domaine** : hors-ligne, événements, Destin du jour
- **Description** : `catchUp` se fie à `Date.now() − lastTick` (`main.ts:63-64`). Si l'horloge recule, rien ne se passe, puis `save()` réécrit `lastTick`. On peut donc enchaîner « +6 h, rouvrir, remettre l'heure ». Les événements (`events.ts:305`) et le Destin du jour (`app.ts:1158`, 1–4 ✦ par date) suivent aussi l'horloge locale.
- **Preuve / observation** : [MESURÉ] `exploit-offline.ts --seeds=1-20 --warm=2`.
  - 10 cycles donnent ×394 en moyenne (×215–×1 392) la valeur de 10 min honnêtes, et +69,6 ⚜️ contre 0.
  - 6 sauts vers des fenêtres d'événement, ≤ 60 s chacun, rapportent 16,4 ✦ (6–24). Un joueur normal gagne 18–24 ✦ par 24 h (C301).
  - [SIMULÉ] C303 : avec des Éclats illimités, la valeur est ×2 et l'Héritage inchangé. Le gain est réel mais borné.
  - [CODE] `main.ts:127` expose aussi l'état en console.
- **Gravité** : l'économie d'Éclats et le rythme « monde partagé » (pilier 3) sont contournables sans outil.
- **Impact sur l'expérience** : le classement prévu en 0.4 et la comparaison des Éclats entre amis perdent leur sens.
- **Probabilité que le problème soit réel** : Certaine. C'est mesuré sur le moteur ; le chemin `main.ts` vient du code.
- **Correction proposée** :
  - Conserver `maxSeenTime`. Si `now < maxSeenTime`, ne rien créditer avant que le temps réel ait rattrapé (« dette d'horloge »).
  - Plafonner les Éclats d'événement et de Destin à ceux des fenêtres ou dates ≤ `maxSeenTime`.
  - Retirer `window.krazy` en production.
- **Effets secondaires potentiels** : les changements de fuseau horaire sont sans effet (horloge UTC). Un vrai recul d'horloge (synchronisation NTP) gèle brièvement le crédit hors-ligne.
- **Méthode de vérification** : test unitaire « recul puis avance de 6 h ⇒ crédit 0 ». Relancer `exploit-offline.ts` : `clock10cycles_value_x` ≤ 1,5.

### [PBA-03] Objectif d'événement au plancher en rouvrant le jeu au début de la fenêtre
- **Priorité** : Élevée
- **Domaine** : événements mondiaux
- **Description** : la cible est fixée au premier pas de la fenêtre à partir de la moyenne glissante `rt.rate` (`game.ts:256-262`). Or `newRuntime()` met `rate` à 0 (`game.ts:27`), et le rattrapage hors-ligne n'a lieu que si l'absence dépasse 30 s (`main.ts:65`, `game.ts:607`). Fermer le jeu juste avant l'heure et le rouvrir après donne la cible plancher, `60 / valeur` de la ressource : 3 Essence, 30 Or.
- **Preuve / observation** :
  - [MESURÉ] `exploit-offline.ts`, 20 graines : cible avec taux établi ÷ cible après relance = **×5 078** en moyenne (min ×24).
  - [SIMULÉ] C301 (60 graines, 24 h, `--events --startH=1`) :

    | Profil | Palier Or atteint | Éclats / 24 h |
    |---|---|---|
    | evt-reload | **95 %** des fenêtres | 62,5 |
    | evt-focus | 56 % | 48,0 |
    | i-optimiseur | 33 % | 18,4 |

  - [CODE] Biais de la référence : C001 démarre à 0 h UTC, en pleine fenêtre avec `rate` = 0. L'unique événement « réussi » par experimente (eventsDone = 1,00) est cet artefact. Le Lead devrait refaire C001 avec un départ hors fenêtre.
- **Gravité** : la boucle sociale (Éclats) récompense une manipulation plutôt que la présence.
- **Impact sur l'expérience** : le joueur qui connaît l'astuce gagne +30 % d'Éclats sans jouer mieux. Celui qui ne la connaît pas trouve les objectifs incohérents d'une fenêtre à l'autre.
- **Probabilité que le problème soit réel** : Certaine (moteur + code).
- **Correction proposée** :
  - Calculer la cible à partir d'un taux persistant : moyenne des pts/s des Échos conservés, plus une estimation du héros, enregistrée dans l'état.
  - Ou recalculer la cible tant que la progression est nulle pendant les 60 premières secondes.
- **Effets secondaires potentiels** : cibles légèrement plus hautes au retour d'une longue absence.
- **Méthode de vérification** : rejouer C301. Seuil : écart du taux de palier Or entre evt-reload et evt-focus ≤ 5 points ; `eventTarget_warm/cold` ≤ 1,2.

### [PBA-04] Paliers d'événement : l'Or est hors de portée sans jouer l'activité objectif
- **Priorité** : Moyenne
- **Domaine** : événements
- **Description** : le palier Or exige 5 × 240 s de **toute** la production convertie dans la seule ressource objectif (`game.ts:261, 268`). Les Échos produisent ce qu'ils ont enregistré, pas forcément cette ressource.
- **Preuve / observation** : [SIMULÉ] C301, part des fenêtres sans aucun palier :
  - opti-fort : 73 % (palier Or dans 25 % des fenêtres) ;
  - i-optimiseur : 67 % (Or dans 33 %) ;
  - evt-focus, qui joue l'activité objectif : 41 % (Or dans 56 %). Les échecs restants viennent surtout des fenêtres Essence et Savoir.
- **Gravité** : la récompense de présence n'arrive pas au joueur qui joue normalement.
- **Impact sur l'expérience** : « je suis là pendant l'événement et je n'ai rien ».
- **Probabilité que le problème soit réel** : Forte (dépend des profils).
- **Correction proposée** :
  - Fixer la cible en part de la production *de la ressource objectif*.
  - Ou compter la valeur de toute production pendant la fenêtre.
- **Effets secondaires potentiels** : plus d'Éclats en circulation (voir PBA-02).
- **Méthode de vérification** : C301. Palier Bronze ≥ 80 % pour i-optimiseur ; Or ≤ 60 % pour evt-focus.

### [PBA-05] Piège de vocation : la lignée s'enferme dans Érudit ou Mystique (×6 à ×25)
- **Priorité** : Élevée
- **Domaine** : vocations, décisions sans information
- **Description** : la vocation multiplie la puissance par 1 + 0,2·rang, jusqu'à ×3 au rang X. Elle se transmet à 60 % (`game.ts:448`) et monte à chaque vie. Une fois Érudit ou Mystique de haut rang, rester est toujours localement rentable. Pourtant ces économies plafonnent très bas (mono-mediter 7,52 contre mono-commercer 8,93 dans C000). La jauge de vocation ne montre que le seuil, jamais le coût à long terme.
- **Preuve / observation** : [SIMULÉ] C300 et C304, 100 graines × 6 h, log10V.

  | Profil | Lignées enfermées | log10V enfermées | log10V autres |
  |---|---|---|---|
  | opti-fort | Étudier 34 · Méditer 21 | 7,67 / 7,39 | Commercer 38 : 8,68 |
  | opti-commerce | Étudier 47 · Méditer 14 | 7,89 / 7,64 | Commercer : 8,65 |
  | sans-vocation-piege | 0 (toutes Commercer ou Cultiver) | — | 8,34, aucune graine < 8,1 |

  Le facteur décisif est l'entretien de la vocation combiné à la règle « Commercer quand on a des Vivres ». L'épargne n'y est pour rien (opti-epargne : 8,57).
- **Gravité** : une seule décision précoce, qui paraît rationnelle, divise la progression par 6 à 25 sur toute la partie.
- **Impact sur l'expérience** : le plafond semble arriver sans raison visible ; il faut sacrifier plusieurs générations pour en sortir.
- **Probabilité que le problème soit réel** : Moyenne à Forte. Le mécanisme est robuste (deux profils distincts y tombent), mais la part exacte dépend des heuristiques.
- **Correction proposée** (au choix, avec le Balancer) :
  - rapprocher la rentabilité à long terme d'Étudier et Méditer ;
  - ou une « reconversion » : changer de vocation garde la moitié du rang ;
  - ou afficher dans la jauge la production comparée des vocations.
- **Effets secondaires potentiels** : risque de rendre la vocation non décisive.
- **Méthode de vérification** : C304 sur les mêmes graines. Moins de 15 % de graines d'opti-commerce sous 8,1.

### [PBA-06] La stratégie la plus simple domine ; débutant ≈ expérimenté
- **Priorité** : Élevée
- **Domaine** : profondeur de décision (recoupe le Balancing)
- **Description** : une seule touche répétée bat toutes les politiques informées.
- **Preuve / observation** : [SIMULÉ] C300, log10V :
  - mono-commercer 8,93 > mono-cultiver 8,77 > i-optimiseur 8,59 > i-experimente 8,26 ≈ i-debutant 8,22 ;
  - le débutant est à −0,04 de l'expérimenté.
- **Gravité** : le savoir-faire n'est pas récompensé, voire puni.
- **Impact sur l'expérience** : la découverte d'une stratégie « bête » mais optimale tue la curiosité.
- **Probabilité que le problème soit réel** : Forte. L'écart ×2,2 est stable (p10–p90 sans recouvrement).
- **Correction proposée** : à arbitrer par le Balancer (rendement décroissant de Commercer, synergies entre activités).
- **Effets secondaires potentiels** : déplacement de la dominance vers Cultiver.
- **Méthode de vérification** : C300. Écart mono-commercer / i-optimiseur ≤ +0,1 log10.

### [PBA-07] « Le Vénérable » prend la majorité des vies : les Chroniques s'effondrent sur un seul surnom
- **Priorité** : Élevée
- **Domaine** : Chroniques / surnoms
- **Description** : le test `vocTier >= 10` (`epithets.ts`, ligne « venerable ») est vrai à chaque vie dès que la lignée tient sa vocation au rang X (`VOCATION_MAX`). Épique, il l'emporte sur tous les communs et rares.
- **Preuve / observation** : [SIMULÉ], part des vies qui reçoivent « le Vénérable » :
  - C300 opti-fort : 103 sur 175 (59 %) ;
  - C301 i-optimiseur : 370 sur 500 (74 %) ;
  - C302 assidu : 696 sur 740 (94 %).

  Les autres surnoms tombent à ≤ 3 par partie. Le GDD attend « environ la moitié des vies » avec un surnom varié.
- **Gravité** : la mécanique de découverte et de variété disparaît en fin de partie, au moment même où elle est débloquée.
- **Impact sur l'expérience** : un même nom partout ; le Codex ne progresse plus.
- **Probabilité que le problème soit réel** : Certaine. C'est déterministe une fois le rang X atteint.
- **Correction proposée** : n'accorder Vénérable que la vie où le rang X est **atteint** (passage de IX à X), ou une fois par vocation.
- **Effets secondaires potentiels** : moins de vies surnommées. À contrôler contre la cible « ≈ 50 % ».
- **Méthode de vérification** : C300 et C302. Part de Vénérable ≤ 10 % des vies ; diversité ≥ 8 surnoms distincts par partie.

### [PBA-08] Alliances : aucun effet mesurable, et la consanguinité punit le joueur assidu
- **Priorité** : Élevée
- **Domaine** : Alliances
- **Description** : le mariage coûte de l'Or, n'apporte qu'un trait de plus à transmettre, et la maison PNJ prestigieuse reste la même toute la semaine.
- **Preuve / observation** : [SIMULÉ] C300.

  | Profil | log10V | ⚜️ total | Héritiers tous ≥ 1 négatif |
  |---|---|---|---|
  | sans-alliance | 8,01 | 2 386 | 0,9 % |
  | opti-fort (≈ 59 mariages) | 8,00 | 2 345 | 4,9 % |
  | mariage-pnj-max | 7,99 | — | 5,0 % |
  | faussaire | 8,06 | — | 0,9 % |

  [MESURÉ] 5 mariages avec la même maison font monter la consanguinité à 60 % (`exploit-alliances.ts`).
- **Gravité** : une mécanique majeure de la 0.2 est inutile ; la jouer « à fond » est même légèrement nuisible.
- **Impact sur l'expérience** : le joueur qui s'y investit ne voit aucune différence.
- **Probabilité que le problème soit réel** : Forte sur 6 h. [HYPOTHÈSE] l'effet pourrait apparaître sur des horizons plus longs (non mesuré sur 72 h avec et sans mariage).
- **Correction proposée** :
  - donner un bénéfice propre à l'union (bonus temporaire, héritier supplémentaire, transmission de vocation renforcée) ;
  - faire tourner plusieurs maisons dans la semaine ;
  - signaler la consanguinité avant l'union.
- **Effets secondaires potentiels** : un bonus trop fort rendrait les codes forgés (PBA-09) plus rentables.
- **Méthode de vérification** : C300 (opti-fort contre sans-alliance). Écart ≥ +0,15 log10, sans que le faussaire dépasse +0,1 de plus.

### [PBA-09] Codes d'alliance : forge, rejeu par nonce, usurpation de maison
- **Priorité** : Moyenne
- **Domaine** : Alliances (codes)
- **Description** : le contrôle `hashStr(data + SALT)` utilise un sel présent dans le client (`alliances.ts:137, 159`). `usedCodes` compare le code entier (`alliances.ts:224`), donc changer le `nonce` suffit à le réutiliser. L'identifiant, le nom et le blason de la maison sont libres (`alliances.ts:183-190`).
- **Preuve / observation** : [MESURÉ] `exploit-alliances.ts`.
  - Bornes respectées : un cadet forgé avec 6 traits dont astres, Élu et Éternel ressort avec [elu, sang_dore, memoire, genie], vocation rang 2.
  - 5 nonces sur 5 acceptés. Le code exact est refusé la deuxième fois.
  - 10 maisons inventées : consanguinité max 0 %.
  - Code au nom « Valombre » accepté.
  - [SIMULÉ] gain du faussaire : +0,06 log10 (C300).
- **Gravité** : faible sur l'économie. Le GDD assume la forge, mais pas le contournement de la consanguinité ni l'usurpation d'identité (« Bien-Aimé » et Galerie des alliances truquables).
- **Impact sur l'expérience** : le « lien social » de la Galerie peut être falsifié.
- **Probabilité que le problème soit réel** : Certaine.
- **Correction proposée** :
  - clé d'unicité sur (maison, cadet, génération) au lieu du code entier ;
  - compter la consanguinité par lignée émettrice quand les dons sont identiques ;
  - afficher « non vérifiable » sur les maisons joueurs.
- **Effets secondaires potentiels** : un ami qui renvoie le même cadet est refusé (c'est voulu).
- **Méthode de vérification** : `exploit-alliances.ts`. Rejeu par nonce : 1/5.

### [PBA-10] Destin du jour : une seule touche est optimale ; l'Or n'est atteint que 7 % des jours
- **Priorité** : Moyenne
- **Domaine** : Destin du jour
- **Description** : le score étant la valeur finale du stock, la stratégie optimale se réduit presque toujours à choisir une activité à t = 0 et ne plus rien toucher. Commercer et Étudier partent sans intrants (≈ 20 points) : ce sont des pièges.
- **Preuve / observation** : [MESURÉ] `exploit-daily.ts --days=30 --iters=1500`, du 1er au 30/11/2026.

  | Stratégie | Score moyen | Argent (500) | Or (800) |
  |---|---|---|---|
  | meilleure touche unique | 419 | 20 % | 7 % |
  | bot de recherche | 451 | 27 % | 7 % |
  | indicateur de l'UI (glouton) | 387–393 | — | — |
  | mono-commercer / mono-étudier | 20 / 17 | 0 % | 0 % |

  - Bot / meilleure touche : médiane ×1,000, maximum ×2,29 ; médiane de 1 action.
  - Le GDD annonce « 400 à 800 selon la stratégie, pas de stratégie dominante ».
  - Codes : score gonflé refusé ; date future acceptée (on peut répéter le destin de demain) ; tick négatif et 900 actions sans effet.
- **Gravité** : le mode « compétitif » n'a quasiment pas de décisions, et son palier haut est inaccessible.
- **Impact sur l'expérience** : on comprend vite qu'il suffit d'appuyer sur une touche. L'Or semble truqué.
- **Probabilité que le problème soit réel** : Forte (moteur, 30 dates, recherche non exhaustive).
- **Correction proposée** :
  - Stock initial d'Or ou de Vivres, ou objectif de conversion, pour que l'enchaînement d'activités paie.
  - Paliers calibrés sur la distribution mesurée : par exemple p50 de la meilleure touche pour l'Argent, p90 du bot pour l'Or.
  - Refuser les codes datés au-delà d'aujourd'hui + 1 dans `verifyCode` (côté UI).
- **Effets secondaires potentiels** : les anciens codes restent vérifiables si la logique est versionnée.
- **Méthode de vérification** : relancer `exploit-daily.ts`. Seuils : bot / meilleure touche ≥ ×1,2 en médiane ; Or entre 10 et 30 % des jours pour le bot.

### [PBA-11] Joueurs occasionnels : aucun déblocage en 3 jours, héros figé hors-ligne
- **Priorité** : Moyenne
- **Domaine** : rétention, hors-ligne
- **Description** : hors-ligne, le héros vit une vie puis la succession reste en attente, bloquée par design (`game.ts:374-375`). Seuls les Échos produisent, et le plafond est de 6 h (`game.ts:111`). Les seuils de 90 et 160 ⚜️ sont hors de portée pour un joueur présent 15 min par jour.
- **Preuve / observation** : [SIMULÉ] C302 (40 graines, 72 h) :
  - occ-quotidien (15 min/jour) : ⚜️ 174, Alliances 0 %, log10V 7,42 ;
  - occ-3x-jour (3 × 10 min/jour) : ⚜️ 487, 0 % ;
  - i-occasionnel (20 min / 4 h) : Alliances au bout de 52 h ;
  - continu : log10V 11,07.

  [MESURÉ] le hors-ligne vaut 1,004 × le jeu en ligne inactif : aucune pénalité, c'est bien.
- **Gravité** : les systèmes 0.2 (Alliances, Chroniques) restent invisibles pour le public occasionnel.
- **Impact sur l'expérience** : le joueur ne découvre jamais les mécaniques annoncées.
- **Probabilité que le problème soit réel** : Moyenne (sessions supposées).
- **Correction proposée** :
  - succession automatique optionnelle hors-ligne (héritier présélectionné) ;
  - ou Héritage crédité pour les boucles d'Échos hors-ligne ;
  - ou seuils Alliances/Chroniques plus bas pour le premier achat.
- **Effets secondaires potentiels** : accélération pour les assidus. Calibrer avec la Data.
- **Méthode de vérification** : C302. occ-3x-jour atteint Alliances en < 72 h dans ≥ 50 % des graines.

### [PBA-12] Achats gourmands : Alliances et Chroniques retardées ×7 sans bénéfice
- **Priorité** : Moyenne
- **Domaine** : arbre d'Héritage, information
- **Description** : rien n'indique qu'il faut épargner. Le joueur qui achète dès qu'il peut repousse indéfiniment les achats de 90 et 160 ⚜️.
- **Preuve / observation** : [SIMULÉ] C300 et C304 :
  - i-optimiseur : Alliances à 3,19 h, Chroniques à 4,66 h ;
  - opti-epargne : 0,47 h et 0,88 h, pour une valeur identique (8,57 vs 8,59) ;
  - i-experimente et i-debutant : Chroniques à 0 % en 6 h.
- **Gravité** : la décision n'est pas informée et retarde le contenu d'environ 4 h.
- **Impact sur l'expérience** : le contenu de fin de partie est découvert tard, ou jamais.
- **Probabilité que le problème soit réel** : Forte.
- **Correction proposée** : objectif suggéré (« Prochain jalon : Alliances 90 ⚜️ ») ou réduction du prix des petites améliorations après un certain seuil.
- **Effets secondaires potentiels** : aucun sur la puissance (l'épargne ne coûte rien).
- **Méthode de vérification** : nouveau profil « suit l'objectif suggéré ». Alliances ≤ 1 h.

### [PBA-13] Débutant réaliste : successions oubliées et pauses involontaires (×9)
- **Priorité** : Moyenne
- **Domaine** : onboarding
- **Description** : la succession est non bloquante et la pause tient en un clic sur l'activité en cours (`app.ts:481`). Un débutant oublie l'une et active l'autre sans le vouloir.
- **Preuve / observation** : [SIMULÉ] C300, hypothèses du profil en §3.
  - 106 s d'attente par succession ; 11,9 % du temps en pause.
  - log10V 7,25 contre 8,22 pour le débutant C000 (×9) ; aucune amélioration Alliances en 6 h.
- **Gravité** : perte de tempo invisible.
- **Impact sur l'expérience** : progression lente et incompréhensible.
- **Probabilité que le problème soit réel** : Moyenne (hypothèses fortes sur les erreurs).
- **Correction proposée** : rappel (vibration ou toast) quand une succession attend plus de 30 s ; confirmation de la pause les 3 premières générations, ou pause uniquement sur le bouton dédié.
- **Effets secondaires potentiels** : bruit pour les experts. Limiter aux premières générations.
- **Méthode de vérification** : variante du profil avec rappel (délai ramené à 30 s). Écart avec i-debutant ≤ 0,3 log10.

### [PBA-14] Choix des Échos non décisif, et classement aveugle aux surnoms
- **Priorité** : Faible
- **Domaine** : Échos
- **Description** : garder les plus récents, les meilleurs en pts/s ou les meilleurs en valeur donne le même résultat. Le classement (`app.ts:809`, `echoValueRate`) ignore le bonus de surnom (`game.ts:52`, +15 à +50 %).
- **Preuve / observation** : [SIMULÉ] C300, log10V : 8,00 (récents) / 8,00 (pts/s) / 7,99 (valeur) ; [CODE].
- **Gravité** : la décision de succession est cosmétique ; quand elle compte, l'information affichée est incomplète.
- **Impact sur l'expérience** : le choix des Échos ne pèse rien.
- **Probabilité que le problème soit réel** : Forte.
- **Correction proposée** : inclure `1 + mods.pow` dans le pts/s affiché ; rendre les Échos plus différenciés (variance de puissance).
- **Effets secondaires potentiels** : aucun.
- **Méthode de vérification** : écart echo-par-valeur / opti-fort ≥ 0,1 log10 après rééquilibrage.

### [PBA-15] Bazar céleste : effet quasi nul, même avec des Éclats illimités
- **Priorité** : Faible
- **Domaine** : Bazar, boucle d'Éclats
- **Description** : Temps suspendu et Bénédictions rallongent les vies, donc réduisent le nombre de générations. Le gain net est faible.
- **Preuve / observation** : [SIMULÉ] sans-bazar 7,99 vs opti-fort 8,00 (C300). Éclats illimités (C303) : 8,31, ⚜️ 2 308 vs 2 345, 121 générations vs 175.
- **Gravité** : la récompense des événements (Éclats) n'a pas d'enjeu, donc pas de raison de revenir.
- **Impact sur l'expérience** : la boucle sociale tourne à vide.
- **Probabilité que le problème soit réel** : Moyenne (horizon 6 h, sans événements).
- **Correction proposée** : Bénédictions qui ne rallongent pas la vie (Élu plutôt qu'Éternel suggéré), ou des achats de long terme (slot d'Écho temporaire).
- **Effets secondaires potentiels** : à coupler avec PBA-02 et PBA-03 avant d'augmenter la valeur des Éclats.
- **Méthode de vérification** : C303 contre C300. Écart ≥ +0,2 log10 sans exploit d'horloge.

### [PBA-16] « Le Maudit glorieux », légendaire, reste net négatif
- **Priorité** : Amélioration facultative
- **Domaine** : surnoms
- **Description** : puissance = max(0,2 ; 1 + echo) × (1 + pow) (`game.ts:52`). Avec Maudit : 0,6 × 1,5 = 0,9, moins qu'un Écho ordinaire. [CODE]
- **Gravité** : aucune, cohérent avec « adoucit la malédiction ».
- **Impact sur l'expérience** : un légendaire peut décevoir.
- **Probabilité que le problème soit réel** : Certaine (arithmétique).
- **Correction proposée** : texte du Codex « adoucit la malédiction », ou pow +0,8.
- **Effets secondaires potentiels** : aucun.
- **Méthode de vérification** : lecture.

## 6. Points forts (à ne pas casser)

- **Codes du Destin du jour** : un score gonflé est refusé, la vérification est déterministe, et un code de 900 actions se rejoue en 0,6 ms.
- **Hors-ligne au pas de 1 s** : il vaut exactement le jeu en ligne (ratio 1,004). Pas d'incitation à fermer ni à rester ouvert.
- **Exploits de surnoms et de pause non rentables** :

  | Exploit | Écart de log10V |
  |---|---|
  | Phénix | −0,30 |
  | Sans-Repos | −0,48 |
  | pause-harmonie | −0,71 |
  | pause hors événements | ×7 moins de valeur |

- **Bornes des codes AL1** : un seul légendaire, aucun trait du Bazar, quatre traits au plus, vocation au plus à rang + 2. Toutes tiennent.
- **Héritiers déterministes** (`s.seed`) : pas de reroll par rechargement [CODE].
- **Aucun effondrement du Domaine**, Harmonie min ≤ 0,3 dans 0 vie ; aucune anomalie.
- **Vocation perdue rare** : 0,5–4 % des successions.

## 7. Questions ouvertes / mesures à faire

1. Revérifier PBA-05, 06, 07 et 08 à `--dt=0.1` (non fait).
2. Tester PBA-01 dans un vrai Chrome en arrière-plan (throttling natif), ainsi que l'onglet masqué sur mobile (iOS PWA, Android).
3. Alliances sur 72 h, avec et sans mariage. Ferme d'héritiers (Fertile, Sang fécond).
4. Refaire la référence C001 avec un départ hors fenêtre d'événement (biais PBA-03).
5. Profils réels : tout ce rapport porte sur des bots. Un test avec de vrais joueurs (5 à 10 personnes) permettrait de valider les hypothèses de PBA-05, PBA-11 et PBA-13.

## 8. Annexes

Toutes les commandes se lancent depuis la racine du dépôt. Commit des campagnes : `6f47e27` (C300, C301), `263a439` (C302, C303), `10324b4` (C304). `src/` est identique sur ces trois commits.

```bash
R="node --import ./lab/sim/register.mjs lab/profiles/run.ts --workers=2"
$R --profiles=debutant-realiste,i-debutant,i-experimente,i-optimiseur,opti-fort,sans-bazar,sans-alliance,sans-echo-choix,echo-par-valeur,phenix,sans-repos,faussaire,mariage-pnj-max,affut-provoc,pause-harmonie,i-mono-commercer,i-mono-chasser,i-mono-cultiver --seeds=1-100 --hours=6 --id=C300-pba-profils-6h
$R --profiles=i-optimiseur,opti-fort,evt-focus,evt-reload,pause-hors-evt --seeds=1-60 --hours=24 --events --startH=1 --id=C301-pba-evenements-24h
$R --profiles=occ-quotidien,occ-3x-jour,assidu,i-occasionnel,i-experimente,opti-fort --seeds=1-40 --hours=72 --id=C302-pba-occasionnels-72h
$R --profiles=eclats-infinis --seeds=1-100 --hours=6 --id=C303-pba-eclats-infinis-6h
$R --profiles=opti-epargne,opti-commerce,sans-vocation-piege --seeds=1-100 --hours=6 --id=C304-pba-piege-vocation-6h
node lab/profiles/analyze.mjs lab/profiles/results/<id>
node --import ./lab/sim/register.mjs lab/profiles/exploit-offline.ts --seeds=1-20 --warm=2
node --import ./lab/sim/register.mjs lab/profiles/exploit-daily.ts --days=30 --iters=1500
node --import ./lab/sim/register.mjs lab/profiles/exploit-alliances.ts
npx vite --port 5190 --strictPort &   # puis :
node --import ./lab/sim/register.mjs lab/profiles/pw-background-tab.ts --min=30
```

Fichiers :
- Profils : `lab/profiles/pba-profiles.ts`.
- Lanceur : `run.ts`, `worker.ts`, `analyze.mjs`.
- Scripts d'exploit : `exploit-offline.ts`, `exploit-daily.ts`, `exploit-alliances.ts`, `pw-background-tab.ts`.
- Résultats : `lab/profiles/results/C300…C304/` (runs.jsonl avec le champ `frustr`, summary.md, summary.json) et `lab/profiles/results/exploit-*.txt`.
- Lignes C300 à C304 ajoutées à `lab/campaigns/CAMPAIGNS.md`.
- Références réutilisées : `lab/results/C000-reference-sans-evenements/`, `lab/results/C001-reference-avec-evenements/`.
