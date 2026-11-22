# SIMPLIF — Récolter simple : retrait des consignes et du Domaine (chantier A, comparaison en mémoire)

Date : 2026-11-22 · commit de départ `00219a1` (moteur identique au lot 0.4 `8191bb4`) · aucune écriture dans `src/`.
Toutes les variantes passent par `BAL_PATCH` (`lab/balance/register.mjs`) ; scripts dans ce dossier.

## 0. Critères de décision (fixés AVANT toute mesure)

Variantes : V0 jeu actuel ; V1 consignes retirées (héros toujours en Équilibre), Domaine gardé ;
V2 Domaine retiré (ecoFactor = 1, ecoImpact et ecoStep sans effet, Garde forestier retiré) et Harmonie figée
à une constante unique mesurée sur V0 ; V3 Domaine retiré, Harmonie = 1, compensation reportée dans les
rendements (`ACT`, et/ou facteur global).

Une variante est **acceptable** si :

1. **Économie** : valeur produite (`log10Value`, moyenne sur les graines) et Héritage (`legacyTotal`) à ±5 %
   de V0 pour **chacun** des 8 profils de T04-lot-sans (200 graines × 6 h, dt 0,5, mêmes graines) ; et, en
   garde-fou, à ±5 % sur les 4 profils de T04-lot-avec (`--events`). ±5 % de valeur = ±0,0212 en log10.
2. **Pas de nouvelle stratégie dominante** : l'écart de valeur entre profils mono-activité (max/min de
   mono-cultiver, mono-commercer, mono-etudier, mono-mediter, en log10) n'est pas plus grand qu'en V0
   (tolérance +0,02 en log10, soit ~5 %). L'écart propre à mono-etudier est signalé à part.
3. **Part de Récolter** : la part du temps héros (`heroAct.cultiver`) et des Échos (`echoAct.cultiver`)
   de chaque profil ne dépasse pas V0 de plus de 5 points.
4. **Pas** : la variante retenue est revalidée à `--dt=0.1` (2 profils × 50 graines au moins) ; écart à V0
   (dt 0,1, mêmes graines) dans la même tolérance que le critère 1.

Indicateurs suivis sans être éliminatoires : générations, part des Échos, combinaisons de traits,
surnoms, légendaires (`lab/balance/evo/kpi.mjs`), `sim:guard` contre V0.

Règle de choix entre variantes acceptables : la plus simple (V3 > V2 > V1), car le but est de retirer du code.

## 1. Méthode

- Surcharges en mémoire (`variants.mjs` → `BAL_PATCH`) : V1 force `posture: 'equilibre'` dans `makeCtx` ;
  V2/V3 coupent `ecoStep`, `ecoImpact`, la Grande migration (Gibier), renvoient `ecoFactor = 1`,
  `harmonyMult = H` (V2) ou `1` (V3), retirent le Garde forestier de `BUILDINGS`, et lisent une santé constante
  `HF` dans `lifeFacts` (défaut 1). V3 remplace les rendements de `ACT`. [CODE] `lab/balance/simplif/variants.mjs`
- Instrumentation neutre (même `log10Value` et Héritage au bit près que la référence T04-lot-sans figée dans
  `lab/baselines/`, vérifié sur les 8 × 200 parties) : Harmonie pondérée par la valeur produite, facteur du
  Domaine sur Récolter (`ecoFactor` pondéré). [MESURÉ]
- Lanceur : `bash lab/balance/simplif/run.sh <V> "<clés>" <id> <arguments de npm run sim>` (copie de
  `lab/sim/cli.ts` avec un worker instrumenté ; mêmes `runs.jsonl`, `sim:guard` compatible).
- Crible à **50 graines** (8 profils × 6 h, dt 0,5) pour éliminer et ajuster (7 points V2 + 1 contrôle du
  Garde), puis **200 graines** sur les finalistes, `--events` (4 profils × 200), dt 0,1 (2 profils × 50).
  Comparaison appariée par graine (`analyse.mjs`), erreur type de la différence moyenne.
- Profils [SIMULÉ] : ceux de `lab/sim/profiles.ts` (aucun ne pilote les consignes dans T04-lot-*). Charge
  machine partagée : ~7 min par campagne de 1 600 parties.

## 2. Ce que vaut l'Harmonie aujourd'hui (V0) [SIMULÉ]

S-V0-sans (8 × 200, dt 0,5) et S-V0-avec ; « valeur » = moyenne pondérée par la valeur produite.

| profil | Harmonie (temps) | Harmonie (valeur) | facteur Domaine sur Récolter | multiplicateur effectif de Récolter (H × facteur) |
|---|---|---|---|---|
| experimente | 1,297 | 1,297 | 1,013 | 1,31 |
| debutant | 1,255 | 1,245 | 1,192 | 1,48 |
| occasionnel | 1,297 | 1,298 | 1,005 | 1,30 |
| optimiseur | 1,208 | 1,201 | 1,361 | 1,63 |
| mono-cultiver | 1,222 | 1,212 | 1,320 | 1,60 |
| mono-commercer | 1,290 | 1,289 | 0,979 | 1,26 |
| mono-etudier | 1,299 | 1,300 | 0,995 | 1,29 |
| mono-mediter | 1,300 | 1,300 | 1,013 | 1,32 |
| **tous (1 600)** | 1,271 ± 0,035 | **1,268 ± 0,040** | 1,110 ± 0,148 | — |
| evenementiel (avec) | 1,298 | 1,300 | 1,000 | 1,30 |

Écart type entre graines d'un même profil ≤ 0,004 : les écarts sont **entre profils**, pas du bruit.
À dt 0,1 (50 graines) : experimente 1,297 / 1,013 ; optimiseur 1,198 / 1,371 (l'optimiseur exploite un peu
plus le Domaine au pas fin). [MESURÉ sur la simulation]

Lecture : l'hypothèse « ×1,2–1,28 » est juste en moyenne (1,268) mais cache deux effets opposés. Les joueurs
qui ménagent le Domaine touchent ×1,30 sur tout ; ceux qui le surexploitent perdent ~7 % d'Harmonie mais
gagnent +19 à +36 % sur Récolter en chassant le surplus de Gibier (P12 confirmé : le Domaine récompense la
surexploitation). Le multiplicateur effectif de Récolter va de ×1,26 à ×1,63 selon le profil.

## 3. Élimination (crible 50 graines) [SIMULÉ]

- **V1 ≡ V0** sur les 8 profils de T04-lot (0,0 % partout, au bit près) : aucun de ces profils ne touche aux
  consignes [CODE] `lab/sim/profiles.ts`. Le coût de V1 se lit sur T04-5 : le profil `consignes` perd son
  +2,8 % (+1,7 % à dt 0,1) et `mono-battue` son piège (−76 %). V1 passe les quatre critères par construction.
- **V2 sans compensation de Récolter** (H = 1,27, kc = 1 ; H = 1,30, kc = 1) : optimiseur −31 à −33 %,
  mono-cultiver −24 à −27 %, débutant −19 % → éliminé.
- **Garde forestier** (H 1,27 / kc 1,15, gardé ou retiré) : le retirer rend +0 à +4 % de valeur (ressources
  qui ne partent plus dans un bâtiment devenu inutile). Il est retiré dans V2/V3.
- **Élasticités** (ajustement Δln(valeur) = c + a·ln H + b·ln kc sur 7 points, `ajuste.mjs`) :

| profil | valeur / H | valeur / kc | Héritage / H | Héritage / kc |
|---|---|---|---|---|
| debutant | 1,43 | 1,81 | 0,40 | 0,49 |
| experimente | 1,24 | 0,10 | 0,42 | 0,09 |
| mono-commercer | 2,08 | 0,43 | 0,69 | 0,18 |
| mono-cultiver | 1,48 | 1,45 | 0,46 | 0,45 |
| mono-etudier | 2,38 | 0,23 | 0,69 | 0,09 |
| mono-mediter | 2,73 | 0,20 | 0,71 | 0,05 |
| occasionnel | 3,49 | 0,71 | 0,70 | 0,19 |
| optimiseur | 1,51 | 1,54 | 0,50 | 0,45 |

  La valeur amplifie tout écart de multiplicateur ×1,2 à ×3,5 (les bâtiments réinvestissent la production) ;
  l'Héritage (racine cubique) l'atténue (×0,4 à ×0,7).

- **Conséquence : ±5 % de valeur sur les 8 profils est hors d'atteinte pour toute Récolter sans état.**
  Avec un seul H et un seul kc, le modèle donne au mieux ±13,6 % (H = kc = 1,235 : débutant +13,5 %,
  optimiseur −12,0 %, mono-mediter −9,2 %). Exiger ±5 % sur experimente et optimiseur (les profils de
  référence des garde-fous) donne H = 1,265, kc = 1,27 avec débutant +24 %, occasionnel +21 %,
  mono-commercer +10 % (prédits). [SIMULÉ + modèle local] La cause est le tableau du § 2 : ce que l'on
  retire est précisément une prime **différente selon la façon de jouer**, qu'aucune constante ne reproduit.

## 4. Finalistes à 200 graines [SIMULÉ]

V2 et V3 sont équivalents dans la partie principale : `harmonyMult` constant multiplie toutes les productions
dans `prodMult` et ne touche pas aux consommations, comme une échelle des `ACT.produce` [CODE]
`src/engine/game.ts:47-53`, `src/engine/sim.ts:36-41`. Les finalistes sont donc mesurés directement en V3,
avec des rendements **arrondis** tels qu'ils seraient écrits dans `data.ts`.

- **V3-A (retenue)** : Récolter 1,92 · Commercer 1,58 · Étudier 0,76 · Méditer 0,127 (soit H ≈ 1,265 sur tout,
  et Récolter ×1,265 en plus). Santé neutralisée à 1.
- **V3-B (minimax 8 profils)** : 1,83 · 1,54 · 0,74 · 0,124 (H = kc ≈ 1,235).

### 4.1 T04-lot-sans (8 profils × 200 graines × 6 h, dt 0,5 ; S-V3-sans, S-V3b-sans contre S-V0-sans)

| profil | V0 log10 valeur (p50) | V3-A valeur | V3-A Héritage | V3-A générations | V3-B valeur | V3-B Héritage |
|---|---|---|---|---|---|---|
| experimente | 8,21 | **+3,2 % ± 0,9** | +2,9 % | −0,3 % | −2,1 % | +1,2 % |
| optimiseur | 8,76 | **−3,5 % ± 1,0** | −0,8 % | −4,2 % | −11,1 % ❌ | −2,9 % |
| debutant | 8,28 | +22,6 % ± 2,2 ❌ | +6,1 % ❌ | −3,1 % | +9,2 % ❌ | +3,0 % |
| occasionnel | 6,34 | +31,3 % ± 3,9 ❌ | +6,5 % ❌ | −0,4 % | +16,0 % ❌ | +3,6 % |
| mono-cultiver | 8,88 | +3,2 % ± 1,1 | +1,1 % | −1,8 % | −5,1 % ❌ | −1,0 % |
| mono-commercer | 8,82 | +14,4 % ± 1,2 ❌ | +4,4 % | −0,1 % | +5,7 % ❌ | +2,3 % |
| mono-etudier | 8,06 | +4,8 % ± 1,5 | +1,6 % | −0,0 % | −0,7 % | +0,3 % |
| mono-mediter | 8,88 | −1,6 % ± 1,6 | −0,3 % | +0,2 % | −10,1 % ❌ | −2,1 % |

`sim:guard S-V0-sans S-V3-sans` : VERT 73 · ROUGE 1 (part de vies surnommées du débutant 0,63 → 0,80 : effet de
la santé neutralisée à 1, voir § 5). `sim:guard S-V0-sans S-V3b-sans` : ROUGE 2 (optimiseur −13,7 % en log10,
même surnoms). V3-B est écartée : elle sort le joueur de référence optimiseur du garde-fou −10 %.

### 4.2 T04-lot-avec (4 profils × 200 graines, `--events` ; S-V3-avec contre S-V0-avec)

| profil | valeur | Héritage | générations |
|---|---|---|---|
| experimente | +2,7 % ± 0,9 | +2,7 % | −0,3 % |
| optimiseur | −3,6 % ± 1,0 | −0,9 % | −4,2 % |
| evenementiel | −1,9 % ± 1,9 | +2,2 % | −0,3 % |
| occasionnel | +31,3 % ± 3,9 ❌ | +6,5 % ❌ | −0,4 % |

`sim:guard` : VERT 34 · ROUGE 0. Paliers d'événements inchangés (experimente 1,89 → 1,88 ; evenementiel 3,0).

### 4.3 Verdict des critères (V3-A)

| critère | verdict | détail |
|---|---|---|
| 1. valeur et Héritage ±5 % (8 profils sans, 4 avec) | ❌ | tenu sur 5/8 profils (experimente, optimiseur, mono-cultiver, mono-etudier, mono-mediter) et 3/4 avec événements ; débutant +22,6 %, occasionnel +31,3 %, mono-commercer +14,4 % de valeur ; Héritage hors tolérance de peu (débutant +6,1 %, occasionnel +6,5 %). Infaisable pour toute variante sans état (§ 3). |
| 2. pas de nouvelle stratégie dominante | ✅ | écart des mono-activités 0,796 → 0,790 en log10 (×6,3 → ×6,2). **Étudier** reste la pire mono-activité de 0,79 log10 (×6,2 sous la meilleure), comme en V0. |
| 3. part de Récolter ≤ V0 + 5 points | ❌ de peu | héros : −0,2 à −4,0 points partout ; Échos : +6,5 points chez l'occasionnel seulement (14 % → 21 %, écart type par graine 17 points), ≤ 0 ailleurs. |
| 4. dt 0,1 (experimente, optimiseur × 50 graines, S-V3-dt01 contre S-V0-dt01) | ❌ de peu | experimente +2,2 % ± 1,8 ; optimiseur **−7,8 % ± 2,4** (−5,9 % sur les mêmes 50 graines à dt 0,5 : effet du pas ≈ −2 points, l'optimiseur tirait un peu plus du Domaine au pas fin). Héritage −0,8 % / +1,7 % ; `sim:guard` VERT 28 · ROUGE 0. |

Observation hors critères : l'optimiseur passe 100 % de son temps héros à Récolter en V0 comme en V3
[SIMULÉ] — Récolter est déjà l'activité de meilleure valeur nette instantanée ; la simplification ne crée pas
cette dominance, elle ne la corrige pas non plus.

## 5. Neutralisation de la santé du Domaine (évolutions, surnoms, haut fait)

`lifeFacts` lit `harmonyAvg`/`harmonyMin` ; Domaine figé à l'équilibre ⇒ santé = 1 d'elle-même. Deux bornes
mesurées (V3-A, 8 × 200) : HF = 1 (« le Domaine n'est jamais troublé », conditions toujours remplies) et
HF = 0,5 (aucune condition de santé remplie, et pas de Dévastateur, seuil 0,3). [SIMULÉ]
Fréquences chez les 60 derniers ancêtres (`legendaires.mjs`) :

| profil | Centenaire V0 → HF 1 → HF 0,5 | parties ≥ 1 légendaire mûri V0 → HF 1 → HF 0,5 | offres légendaires V0 → HF 1 → HF 0,5 |
|---|---|---|---|
| experimente | 19,5 → 18,7 → 7,8 % | 25,5 → 23,0 → **0,0 %** | 0,54 → 0,60 → 0,29 % |
| optimiseur | 54,4 → **75,4** → 53,9 % | 52,5 → 71,0 → 52,5 % | 3,85 → 5,45 → 3,90 % |
| debutant | 11,4 → **35,7** → 12,8 % | 46,0 → 60,0 → 36,5 % | 1,10 → 1,81 → 1,00 % |
| mono-cultiver | 9,1 → 21,6 → 8,2 % | 63,5 → 68,5 → 56,0 % | 4,39 → 3,99 → 4,37 % |
| mono-mediter | 19,1 → 19,1 → 7,5 % | 74,5 → 68,5 → 54,5 % | 3,64 → 4,21 → 2,96 % |

Éternel reste ≤ 0,6 % partout ; « Récolte raisonnée » n'est obtenue dans **aucune** partie, V0 compris (il
faut 7 Échos). Effet économique de HF = 0,5 contre HF = 1 : mono-mediter **−10,1 %** de valeur (l'Ermite,
qui exige `harmonyAvg ≥ 0,8`, donne Méditer +25 % à l'Écho [CODE] `src/engine/epithets.ts:79`), occasionnel
−7 %, autres ±3 %. Surnoms : HF = 1 fait passer la part de vies surnommées du débutant de 0,63 à 0,80 (ROUGE
`epithetLivesShare`) [HYPOTHÈSE : le Juste et le Jardinier, qui ne demandent plus que de travailler la terre] ;
HF = 0,5 fait tomber celle de l'expérimenté de 0,44 à 0,23 (ROUGE).

**Choix provisoire : HF = 1** (fidèle aux profils qui ménageaient le Domaine, qui sont la majorité). Ce qu'il
faudra compenser quand le game designer réécrira les conditions : Robuste → Longévité (santé ≥ 95 %),
Longévité → Centenaire, Centenaire → Éternel, l'Ermite (santé ≥ 0,8), le Juste, le Glorieux, le Jardinier,
le Dévastateur, « Récolte raisonnée ». Cibles de fréquence : la colonne V0 ci-dessus (Centenaire ~19 % chez
experimente, ~10 % chez débutant / mono-cultiver ; ≥ 1 légendaire mûri dans ~25 % des parties expérimentées,
toutes issues de la chaîne Robuste → Éternel ou Mémoire → Éternel).

## 6. Recommandation

1. **Variante recommandée : V3-A** (Domaine, Harmonie, Garde et consignes retirés ; compensation dans `ACT`).
   C'est la seule mesurée qui garde les deux profils de référence des garde-fous (experimente, optimiseur) à
   ±5 % et tous les `sim:guard` de valeur au vert, sans et avec événements. Les critères 1, 3 et 4 ne sont
   **pas** tenus à la lettre ; je ne les assouplis pas après coup : c'est au propriétaire de trancher. Ce qui
   change : les profils peu optimisés (débutant +23 %, occasionnel +31 %) et mono-commercer (+14 %) gagnent,
   car ils perdaient de l'Harmonie sans toucher la prime de surexploitation ; l'écart d'adresse entre débutant et
   optimiseur passe de 0,48 à 0,37 en log10 (Héritage : +6 % / −1 %).
2. **Valeurs à reporter dans `src/engine/data.ts`** (consommations inchangées : Commercer 3 Vivres, Étudier 2 Or) :

| paramètre | valeur actuelle | valeur proposée | effet mesuré |
|---|---|---|---|
| `ACT.cultiver.produce.vivres` | 1,2 (×H×facteur Domaine) | **1,92** | voir § 4 (V3-A) |
| `ACT.commercer.produce.or` | 1,25 (×H) | **1,58** | idem |
| `ACT.etudier.produce.savoir` | 0,6 (×H) | **0,76** | idem |
| `ACT.mediter.produce.essence` | 0,1 (×H) | **0,127** | idem |
| `harmonyMult` dans `prodMult` | 0,7–1,3 | retiré (= 1) | — |
| `ecoFactor`, `ecoImpact`, `ecoStep`, `ecoRegen`, `POSTURE` | — | retirés | — |
| Garde forestier (`BUILDINGS`) | 10 niveaux | retiré | +0 à +4 % de valeur (crible, H 1,27 / kc 1,15) |
| santé lue par `lifeFacts` | moyenne / minimum de la vie | 1 en attendant la réécriture (§ 5) | — |

   Facteurs exacts équivalents : global **×1,265** sur les quatre rendements, Récolter **×1,265** de plus
   (soit 1,6 sur Récolter). Les arrondis (1,264 à 1,270) sont ceux qui ont été mesurés.
3. Si le propriétaire préfère des écarts symétriques sur les 8 profils plutôt que la fidélité aux profils de
   référence : V3-B (1,83 / 1,54 / 0,74 / 0,124), mesurée : pire écart −11 % (optimiseur, garde-fou ROUGE).
4. Si l'on refuse tout écart au-delà de ±5 %, il faut garder un état qui récompense différemment selon la
   pression exercée — c'est-à-dire le Domaine (V1, qui passe tout par construction).

## 7. Points à recalibrer avant d'intégrer

- **Destin du jour** (`lab/balance/commande/calibrage.ts`, 60 dates, sous surcharge V3-A) : la commande se
  recalcule seule (solveur 60/60 dans [50, 75] ans, Or faisable 60/60), mais le joueur réactif décroche l'Or
  **13 %** des jours (cible < 10 % ; V0 : 4 %) et le Bronze 100 % (V0 : 81 %) : sans Domaine, le profil
  « réactif en Battue » ne vide plus les hardes. Revoir la marge de l'Or (+2 ans). Les codes de choix 4 et 5
  (Semer, Battue) n'ont plus de sens : `DAILY_CHOICES` passe à 4 choix ; les fantômes `EL3` stockés qui
  contiennent 4 ou 5 doivent être lus comme 0 (Récolter) ou effacés. [SIMULÉ]
- Le trait **Harmonieux** (`eco: 0.4`) et les `eco` des surnoms (Juste, Ermite, Boucher, Semeur…) deviennent
  sans effet ; le Semeur, le Grand Veneur et le Boucher ne peuvent plus être obtenus. [CODE]
  `src/engine/data.ts:130`, `src/engine/epithets.ts:73-96`
- Événement **Grande migration** (« le Gibier afflue ») : garder Récolter ×2, retirer le texte et l'effet sur le
  Gibier [CODE] `src/engine/game.ts:223`, `src/engine/data.ts:274`. Description de Méditer (« ramène
  l'écosystème… ») à réécrire.
- Garde-fous `harmonyAvg` de `lab/metrics/guardrails.ts` et profils qui lisent le Domaine (`consignes`,
  `mono-battue`, `mono-consignes`, `actNetValue`) à retirer ; nouvelles références à produire (T05-lot-*).
- Revalider à dt 0,1 sur 200 graines après intégration : l'optimiseur y perd 2 points de plus qu'à dt 0,5.

## 8. Reproduire

```bash
P8=experimente,debutant,occasionnel,optimiseur,mono-cultiver,mono-commercer,mono-etudier,mono-mediter
bash lab/balance/simplif/run.sh V0 "" S-V0-sans --profiles=$P8 --seeds=1-200 --hours=6
bash lab/balance/simplif/run.sh V0 "" S-V0-avec --profiles=experimente,optimiseur,occasionnel,evenementiel --seeds=1-200 --hours=6 --events
bash lab/balance/simplif/crible.sh "V1" "V2 H=1.27" "V2 H=1.27 kc=1.15" "V2 H=1.3 kc=1.1" "V2 H=1.3" "V2 H=1.3 kc=1.25" "V2 H=1.24 kc=1.27" "V2 H=1.25 kc=1.35" "V2 H=1.27 kc=1.15 garde=1"
bash lab/balance/simplif/finale.sh        # S-V3-sans, S-V3-avec, S-V0-dt01, S-V3-dt01, S-V3-HF05-sans
bash lab/balance/simplif/run.sh V3 "yc=1.83 yo=1.54 ys=0.74 ye=0.124" S-V3b-sans --profiles=$P8 --seeds=1-200 --hours=6
node lab/balance/simplif/harmonie.mjs S-V0-sans          # § 2
node lab/balance/simplif/analyse.mjs S-V0-sans S-V3-sans  # § 4 (critères 1 à 3)
node lab/balance/simplif/ajuste.mjs S-V0-sans S50-V2-H_1.27:1.27:1 …   # § 3
node lab/balance/simplif/legendaires.mjs S-V0-sans S-V3-sans S-V3-HF05-sans   # § 5
BAL_PATCH="$(node lab/balance/simplif/variants.mjs V3 instr=0 yc=1.92 yo=1.58 ys=0.76 ye=0.127)" \
  node --import ./lab/balance/register.mjs lab/balance/commande/calibrage.ts 60   # § 7
```

Sorties complètes des scripts : `sorties.md`. Les `runs.jsonl` (`lab/results/S-*`, `S50-*`) ne sont pas versionnés.
