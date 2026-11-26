# Référentiel des indicateurs d'équilibrage (v1, Game Data Analyst, 2026-11-14)

> **Note (2026-11-15)** : les valeurs « C000 » ci-dessous décrivent la version 0.2.1. Les références de la 0.2.2 sont C090 (sans événements) et C091 (avec événements) ; les écarts dus aux corrections R1–R16 sont détaillés dans `lab/CHANGELOG-EQUILIBRAGE.md`.

v0 posée par le Technical Lead ; v1 complétée pendant l'audit (phase 1). Toutes les valeurs sont **[SIMULÉES]** (profils automatiques de `lab/sim/profiles.ts`, pas de vrais joueurs).

- **Sources** : champs de `RunResult` (`lab/sim/runner.ts`), agrégés par `lab/sim/stats.ts` ; KPI dérivés dans `lab/metrics/guardrails.ts` (`kpis()`) ; KPI non collectés par le runner dans `lab/metrics/collect-extra.ts` (sortie `extra.jsonl`).
- **Valeurs de référence** : C000 (1 800 parties, graines 1–200, 6 h, dt 0,5, sans événements, commit a53d1b5), C001 (avec événements), C402 (12 h, 50 graines), C404 (collecteur additionnel, 100 graines). Détails : `lab/reports/analysis-C000-reference-sans-evenements.md`, `lab/reports/robustness.md`.
- **Garde-fous exécutables** : `node --import ./lab/sim/register.mjs lab/metrics/guardrails.ts <réf> <cand>` (code de sortie 1 = ROUGE → retour arrière recommandé ; 2 = campagnes incomparables).
- **Profils de référence** : `experimente` (joueur de référence), `optimiseur` (glouton), `debutant`, `occasionnel` (sessions 20 min / 4 h), `mono-*` (une seule activité après 30 min). « Compétent » = experimente, optimiseur, occasionnel. Une mécanique utilisée dans < 5 % des parties d'un profil compétent est **sous-utilisée**.

## 1. Règles de lecture

1. **Échelle log.** `log10Value` est un log : un écart relatif sur le log n'a pas de sens (5 % de 8,5 = ×2,7 de valeur). Exprimer tout écart de valeur en % de valeur : `10^Δ − 1`.
2. **Sentinelle « jamais ».** `unlockAt.* = -1` signifie « jamais ». Ne jamais en faire la moyenne : rapporter la part « jamais » et les quantiles des parties qui débloquent (`lab/metrics/analyze.ts`). `summary.md` actuel est faux sur ce point (DATA-02).
3. **n, moyenne, é.-t., p10/p50/p90, IC95** pour chaque KPI. Une différence entre campagnes n'est retenue que si |z| ≥ 3 (Welch, ou apparié si mêmes graines) **et** si elle dépasse le seuil de pertinence du KPI.
4. **Comparer des campagnes comparables** : même `hours`, `dt`, `events`, mêmes graines si possible. `guardrails.ts` refuse sinon.
5. **Nombre de graines** (C000, puissance 0,8, α 0,05, écart de valeur 5 %) : experimente 41, mono-cultiver/chasser ~30, mono-commercer 64, mono-etudier 203, debutant 334, optimiseur 393, mono-mediter 475, occasionnel 2 171. **Conséquence : 200 graines suffisent pour experimente et les mono-cultiver/chasser/commercer, pas pour optimiseur, debutant, mono-etudier/mediter ni occasionnel** ; pour ceux-là, utiliser le seuil de 10 % (≈ ¼ des graines) ou 400+ graines.
6. **dt** : 0,5 s suffit pour la valeur, les générations et l'Héritage des profils « réguliers » (Δ ≤ 5 %, C401), mais **pas** pour l'Harmonie (harmonyMin +0,02 à +0,03, z 6–12) ni pour l'optimiseur (valeur −15,7 % à dt 0,1, z −2,3). Toute conclusion sur l'Harmonie ou l'optimiseur se confirme à `--dt=0.1`.
7. **Horizon** : le classement des profils est stable entre 3 h et 12 h (ρ = 0,90), mais les **écarts** grandissent (vocations ×12,5 à 3 h → ×41,6 à 12 h). Les garde-fous d'écart entre stratégies se vérifient à 6 h **et** à 12 h.

## 2. Indicateurs

Plage cible = valeur attendue d'un jeu sain ; garde-fou = seuil dont le franchissement déclenche un retour arrière (Δ = écart candidat − référence, mêmes conditions). État C000 : ✓ dans la plage, ✕ hors plage (dette connue, voir l'audit).

### 2.1 Robustesse

| KPI | Formule / source | C000 | Plage cible | Garde-fou | Justification |
|---|---|---|---|---|---|
| Anomalies | `anomalies.length` (NaN, Infinity, ressource ou Héritage négatif ; contrôle chaque minute + fin) | 0 sur 1 800 ✓ | 0 | **0 obligatoire, sur toutes les parties** | Robustesse ; une seule anomalie invalide la campagne. |
| Reproductibilité | même graine → même résultat au bit près | 40/40 (C403) ✓ | 100 % | 100 % | Moteur déterministe (GDD 4) ; sans cela aucune comparaison avant/après n'est valable. |

### 2.2 Puissance économique et tempo

| KPI | Formule / source | C000 (moy. ± é.-t.) | Plage cible | Garde-fou (Δ vs réf.) | Justification |
|---|---|---|---|---|---|
| Valeur produite | `log10Value` = log10 Σ_r totalEver[r] × valeur[r] | exp. 8,26 ± 0,03 · opt. 8,59 ± 0,11 · déb. 8,22 ± 0,10 · occ. 6,22 ± 0,25 | exp. 8,0–8,6 à 6 h | **ROUGE si perte > 10 % de valeur** (Δlog10 < −0,041) avec |z| ≥ 3 ; **ROUGE si inflation > ×2** (Δlog10 > +0,30) | Coûts ×1,9–2,4 et Héritage en racine cubique (GDD 1) : une inflation ×2 décale tout le rythme. |
| Courbe horaire | `hourly[].log10Value` (médiane par heure) | exp. 6,04 → 8,25 (h1 → h6) | croissance monotone ; débit horaire `valueRate` sans baisse > 5 % d'une heure à l'autre | part de parties avec ≥ 1 baisse de débit > 5 % : ≤ 5 % (debutant 15 % ✕) | « sans mur » ; **non mesurée pour l'occasionnel** (DATA-09). |
| Générations | `gen` | exp. 168,8 ± 2,5 | exp. 150–190 à 6 h (vie de 60 s + bonus) | ±5 % | Tempo dynastique (GDD 2.1). |
| Héritage total | `legacyTotal` | exp. 2 197 ± 50 | exp. 1 800–2 800 à 6 h | ±15 % | Boucle longue ; conditionne Alliances (90) et Chroniques (160). |
| Durée moyenne d'une vie | `(temps − attente de succession) / lives` (C404) | exp. 128 s · opt. 140 s | 60–200 s | ±15 % | Boucle courte : vie de 60 s ou plus (GDD 2.1). **Non collecté par le runner.** |

### 2.3 Piliers de design

| KPI | Formule / source | C000 | Plage cible | Garde-fou | Justification |
|---|---|---|---|---|---|
| Part des Échos | `echoShare` = Σ echoRate·dt / Σ valeur brute (en ligne) ; **avec hors-ligne : `echoShareAll` (C404)** | exp. 0,929 · opt. 0,859 · mono 0,855–0,882 · occ. 0,138 (runner) / **0,927 (réel, C404)** | profils en continu : **0,30–0,60 depuis la 0.7** (0,60–0,97 avant ; V07-lot-sans : exp. 0,457 · opt. 0,404 · mono 0,356–0,393) | ±3 points ; **ne pas utiliser `echoShare` pour un profil à sessions** (DATA-03) | Pilier 1 « chaque vie compte » : les Échos portent la production sans rendre le héros inutile. |
| Harmonie moyenne | `harmonyAvg` = moyenne de ecoHealth sur les pas | exp. 0,981 · opt. 0,840 (bimodal : p50 0,818, p90 0,971) · mono-cultiver 0,869 | exp. ≥ 0,90 ; gourmands ≥ 0,80 | −3 points | « L'optimum n'est pas le maximum » (GDD 2.4) : la gourmandise doit coûter sans effondrer (×0,7 = plancher). Vérifier à dt 0,1 (+0,037 pour l'optimiseur). |
| Harmonie minimale | `harmonyMin` | 0,695–0,722, **identique au bit près entre 4 profils mono** | — | **pas de garde-fou sur ce champ** (DATA-05) | Capte le creux de la première demi-heure, pas la stratégie. Remplacé par les deux suivants. |
| Harmonie min. hors démarrage | `harmonyMinAfter30` (C404) | exp. 0,736 · mono-cultiver 0,782 · mono-commercer 0,935 · opt. 0,730 | ≥ 0,70 | −0,05 | Mesure la stratégie, pas l'amorçage de l'écosystème. |
| Harmonie p05 (pondérée temps) | `harmonyP05` (C404) | exp. 0,855 · opt. 0,761 · mono-cultiver 0,791 | ≥ 0,75 | −0,05 | Robuste à un minimum ponctuel. |
| Diversité génétique | `traitCombos60` = combinaisons distinctes chez les 60 derniers ancêtres | exp. 33,8 ± 4,5 · déb. 52,1 · opt. **16,4** ± 4,5 · occ. 24,3 | exp./déb. ≥ 20 (GDD 2.3 : 27–30 à 8 h) ; opt. ≥ 15 | −20 % | Budget génétique : pas de retour à 2–5 combinaisons. Bruit élevé (110 graines pour 5 %). |
| Fréquence des traits | `traitFreq60[t]` | Élu 83–86 % chez exp./mono ; Éternel 77 % chez opt. ; Béni des astres 0 % partout | aucun trait positif > 90 % chez exp. | +10 points sur le trait dominant | Détecte une combinaison dominante (Élu + Éternel = poids 6, tient dans le budget). |

### 2.4 Onboarding (secondes de jeu, p90 ; « jamais » séparé)

| KPI | Source | C000 (p50 / p90, part « jamais ») | Garde-fou | Justification |
|---|---|---|---|---|
| Commercer | `unlockAt.commercer` | exp. 17,5 / 17,5 ; déb. 19,5 / 19,5 ; 0 % jamais | p90 ≤ 60 s | Seuil 40 Vivres. |
| Étudier | `unlockAt.etudier` | exp. 60,5 / 78 ; déb. 385 / 1 084 ; **opt. 73 % jamais** | exp. p90 ≤ 180 s ; déb. p90 ≤ 1 800 s | Seuil 50 Or : un joueur qui ne commerce jamais ne voit jamais Étudier ni Méditer. |
| Méditer | `unlockAt.mediter` | exp. 93 / 154 ; **opt. 98 % jamais** | exp. p90 ≤ 300 s | Seuil 25 Savoir. |

### 2.5 Fin de partie

| KPI | Formule / source | C000 | Plage cible | Garde-fou | Justification |
|---|---|---|---|---|---|
| Achat d'Alliances | `upgradeAt.alliances` (absent de `summary.json`, DATA-04) | exp. p50 269 min, 100 % ; occ. 0 % | exp. entre 1 h et 5 h | plage | GDD 2.7 (90 ⚜️). |
| Achat de Chroniques | `upgradeAt.chroniques` | **exp. 0 %** · déb. 0 % · occ. 0 % · opt. 99 % (p50 282 min) · mono 0–100 % | ≥ 90 % des parties de 6 h d'un joueur compétent | plage | GDD 2.6 (160 ⚜️) : la fin de partie doit être atteinte. |
| Vies surnommées | `epithetLives / (lives × (1 − t_chroniques / T))` (approximation : vies postérieures à l'achat) | 78–85 % | 30–70 % (GDD 2.6 : ~50 %) | plage | GDD 2.6. |
| Surnoms distincts | `epithetsFound` (+ histogramme par id, C404) | **1,0 sur 34** ; 100 % « le Vénérable » (C404) | ≥ 3 en 6 h après achat ; aucun surnom > 60 % des vies | plage | 34 surnoms en 4 raretés : un seul surnom = système inexistant (DATA-01). |
| Mariages | `married` | opt. 1,9 (C000), 2,7 (C001) ; autres 0 | — (profils non mariés par construction) | — | Seul l'optimiseur se marie : KPI à lire profil par profil. |
| Événements | `eventsDone`, `eclatsEnd` (C001) | exp. 1,0 · occ. 1,5 · **opt. 0,25** | ≥ 1 par tranche de 6 h pour un joueur présent | −50 % | Boucle sociale (GDD 2.5). |
| Bénédictions du Bazar | `traitFreq60.astres` | 0 % partout (C001 inclus) | > 0 pour un profil compétent sur 12 h avec événements | — | Mécanique non exercée par les profils (à mesurer). |

### 2.6 Viabilité des stratégies (inter-profils)

| KPI | Formule | C000 / C402 | Plage cible | Garde-fou | Justification |
|---|---|---|---|---|---|
| Chasseur / paysan | `10^(log10Value(mono-chasser) − log10Value(mono-cultiver))` | 1 h 124 % · 3 h 60 % · 6 h 45 % · 12 h 38 % | 33–118 % (GDD 2.4) à 3 h **et** 6 h | ≥ 33 % | « Chasseur viable » (GDD 2.4). Tendance à la baisse avec l'horizon. |
| Écart des vocations | `10^(max − min)` sur les 5 profils mono | 3 h ×12,5 · **6 h ×25,4** · 12 h ×41,6 | ≤ ×10 (critère objectif du protocole) | ≤ ×10, signalé (DETTE) | Méditer est ×25 sous Commercer à 6 h (DATA-08, BAL). |
| Répartition des activités | `heroActShare.*`, `echoActShare.*`, part des parties où une activité ≥ 5 % du temps héros | exp. : Échos 0 % Cultiver, 0 % Chasser, 0 % Méditer ; opt. : Méditer 0 %, Étudier 3 % | chaque activité ≥ 5 % chez au moins un profil compétent | — | Viabilité de chaque vocation ; activité jamais gardée en Écho = sous-utilisée. |
| Pause | `pausedShare` | 0 partout | — | — | **Aucun profil ne met en pause** : mécanique non mesurée (DATA-10). |

### 2.7 KPI manquants (non collectés par `lab/sim/runner.ts`)

| KPI | Pourquoi | État |
|---|---|---|
| Surnoms par identifiant | Détecter un surnom dominant | Collecté par `lab/metrics/collect-extra.ts` (`epithetById`). |
| Part des Échos hors ligne | `echoShare` ignore la production hors ligne | `echoShareAll`, `offlineShareOfValue` (collect-extra). |
| Instant / min. d'Harmonie hors démarrage, p05 | `harmonyMin` capte la première demi-heure | `harmonyMinAt`, `harmonyMinAfter30`, `harmonyP05` (collect-extra). |
| Temps en succession en attente | Coût réel du « non bloquant » pour le joueur à sessions | `successionWaitSec` (collect-extra) : occasionnel 19 252 s sur 21 600 (89 %). |
| Échos gardés en fin de partie par activité dominante | Quelles vies valent d'être gardées | `echoesEndDominant` (collect-extra). |
| Courbe horaire des profils à sessions | Le runner n'écrit `hourly` qu'en ligne | À corriger dans le runner (phase 4). |
| `upgradeAt.*`, `epithetLives`, `lives`, `legacyUnspent`, `traitFreq60` dans `summary.json` | Invisibles pour `sim:compare` | À ajouter à `scalars()` (phase 4) ; en attendant, `guardrails.ts` lit `runs.jsonl`. |
| Score du Destin du jour par stratégie | GDD 1 : 400–800 selon la stratégie | Non mesuré par la simulation (hors `runGame`). |
| Décisions du joueur (pause, choix d'héritier, d'Écho) | Nécessite des profils qui les exercent | À couvrir par l'agent comportements. |

## 3. Procédure de décision (phase 4)

1. Rejouer la référence sur les mêmes graines et le même commit de base (`C000` : `--seeds=1-200 --hours=6`), puis la candidate.
2. `node --import ./lab/sim/register.mjs lab/metrics/guardrails.ts C000-reference-sans-evenements <id-candidat>` :
   - code 0 et aucun ROUGE → accepter ; ORANGE → relancer avec 2× plus de graines ;
   - ROUGE → `git revert` sauf justification écrite dans `lab/CHANGELOG-EQUILIBRAGE.md` ;
   - DETTE → garde-fou déjà hors plage : la correction visée doit le faire revenir dans la plage.
3. `npm run sim:compare` reste utile pour l'exploration, **pas pour décider** : au test A/A (même code, deux moitiés de graines) il signale 8,6 % (C000) à 16,9 % (C001) des lignes, il ne vérifie pas que les campagnes sont comparables et son code de sortie vaut toujours 0 (DATA-04).
4. Confirmer à `--dt=0.1` (40 graines suffisent pour experimente) tout changement touchant l'Harmonie ou l'optimiseur ; confirmer à 12 h tout changement touchant l'écart entre vocations.
5. Régénérer `lab/reports/dashboard.html` : `node --import ./lab/sim/register.mjs lab/reports/build-dashboard.ts --ref=<réf> --cand=<cand>`.
