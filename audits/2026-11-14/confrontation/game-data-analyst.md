# Confrontation (phase 2) — Game Data Analyst

Réponses aux points B4, B6, B7 et B10, plus un contrôle des corrections d'outillage du Lead (section C). Données **[SIMULÉES]** sauf mention contraire. Commit 8033a0e ; `src/` inchangé depuis a53d1b5.

## B4. Sensibilité à dt : **je nuance**. Le moteur n'est pas en cause ; c'est un artefact du profil `optimiseur`, qui est bistable.

- **Le moteur est robuste au pas.** [MESURÉ] QA, à actions fixes : dt 0,5 / dt 0,1 = 0,999 à 1,001. [SIMULÉ] BAL C201 : |Δlog10| ≤ 0,022. [SIMULÉ] C401 : |Δ valeur| ≤ 5 % pour experimente, mono-chasser et mono-cultiver.
- **L'optimiseur a deux régimes stables.** Il se fige tôt soit en « paysan », soit en « chasseur ». [SIMULÉ] C000, 200 graines :

| régime | parties | log10 valeur | Harmonie moy. | Chasser (temps héros) | Garde forestier (niv. moyen) |
|---|---|---|---|---|---|
| paysan | 172 | 8,611 | 0,826 | 0,4 % | 0,2 |
| chasseur | 28 | 8,453 | 0,972 | 67,6 % | 8,9 |

- **dt ne change que la proportion des deux régimes.** À l'intérieur d'un régime, la valeur est la même aux deux pas. [SIMULÉ] C401 contre C000, graines 1–40 :

| dt | parties « chasseur » | valeur des chasseurs | valeur des paysans |
|---|---|---|---|
| 0,5 | 3/40 | 8,273 | 8,622 |
| 0,1 | 12/40 | 8,263 | 8,632 |

  Le −15,7 % de DATA-07 et le 35,5 % de chasse de QA-08 sont donc **un seul et même effet de mélange** entre les deux régimes. Ni le moteur ni l'équilibrage n'en sont la cause. Cause probable [HYPOTHÈSE] : le choix glouton sur `actNetValue` est presque à égalité entre Cultiver et Chasser au démarrage, et le pas modifie les tout premiers rendements écologiques.
- **Conséquences.**
  1. Rapporter l'optimiseur **par régime** (part de « chasseurs », puis valeur dans chaque régime), jamais en moyenne simple.
  2. Revalider à dt 0,1, avant d'appliquer une correction, toute conclusion qui porte sur : Chasser ou l'Affût ; l'Harmonie (`harmonyMin` est biaisé de +0,02 à +0,03, z 6–12 ; `harmonyAvg` de l'optimiseur aussi) ; l'optimiseur. Inutile pour la valeur, les générations et l'Héritage des profils réguliers.
  3. Les conclusions BAL-01 et BAL-02 (Commercer domine) n'en dépendent pas : elles tiennent 50/50 à dt 0,1 (C201).
- **Priorité** : DATA-07 et QA-08 restent Moyenne (outillage). Ils ne changent aucune recommandation d'équilibrage.

## B6. Le Domaine : **je nuance BAL-05**. Il pèse sur une décision, mais il récompense la surexploitation. Le pilier « l'optimum n'est pas le maximum » n'est pas tenu.

- **Il pèse sur une décision.** C'est l'écosystème qui fait basculer l'optimiseur dans l'un ou l'autre régime (B4, via `ecoFactor` dans `actNetValue`).
- **Mais le régime qui malmène le Domaine gagne.** Les paysans de l'optimiseur (Harmonie 0,826) produisent **×1,44** de valeur par rapport aux chasseurs (Harmonie 0,972) [SIMULÉ, C000, 172 contre 28 parties]. mono-cultiver est 2ᵉ en valeur sur 9 profils avec l'Harmonie la plus basse des profils mono (0,869).
- **Moins d'Harmonie va avec plus de valeur.** Corrélation de Pearson entre `harmonyAvg` et la valeur, entre graines d'un même profil : debutant −0,63 ; optimiseur −0,53 ; mono-commercer −0,33. Aucune corrélation positive nette (maximum +0,21, mono-mediter). C'est une corrélation, pas une causalité : BAL-05 (C203, amplitude ±50 %) reste la mesure causale.
- **Conclusion.** Le Domaine n'est pas décoratif, mais sa pénalité est trop faible pour que préserver l'équilibre paie. Je soutiens la piste BAL d'élargir l'amplitude d'Harmonie, sous réserve du garde-fou suivant : `harmonyAvg` ≥ 0,80 pour les profils gourmands, ET le régime « paysan » de l'optimiseur ne doit plus dépasser le régime « chasseur » de plus de 10 % de valeur.
- **Priorité** : Moyenne (BAL-05). Le constat se vérifie avec l'analyse par régime ci-dessus, relancée sur la variante, à dt 0,1.

## B7. Correction BAL-02 (C207) : garde-fous passés. **1 ROUGE (onboarding), 0 régression économique ROUGE.**

**Comparabilité.** `fix1-runs.jsonl` (C207) n'est pas au format `RunResult` : il n'a ni Harmonie, ni traits, ni déblocages. J'ai donc lancé **C405** : mêmes surcharges en mémoire (`BAL_OBJ`), mais avec `runGame` (`lab/metrics/run-patched.ts`). Il est identique au bit près à C207 sur les 100 parties communes. Il couvre experimente, optimiseur, debutant et occasionnel (100 graines chacun) et mono-cultiver (89). J'ai arrêté la campagne faute de CPU (charge 7–8). Pour les autres profils mono, je reprends C207.

Commande : `node --import ./lab/sim/register.mjs lab/metrics/guardrails.ts C000-reference-sans-evenements C405-guardrails-fix1` → **49 VERT, 1 ROUGE, 5 DETTE**, code de sortie 1.

| KPI | C000 → fix1 | z | Verdict |
|---|---|---|---|
| experimente, Méditer débloqué (p90) | 154 s → **343 s** | — | **ROUGE** (seuil 300 s). Moins d'Or, donc moins de Savoir. |
| experimente, Étudier débloqué (p90) | 78 s → 92,5 s | — | VERT |
| experimente, valeur | 8,259 → 8,224 (**−7,7 %**) | −8,7 | VERT, mais près du seuil de −10 % |
| experimente, générations | 169 → 161 (−4,7 %) | −19,9 | VERT, mais près du seuil de ±5 % |
| experimente, Héritage | 2 197 → 2 068 (−5,9 %) | — | VERT |
| optimiseur, debutant, occasionnel : valeur | −1,6 % ; +7,4 % ; −6,0 % | ≤ 2,6 | VERT |
| Part des Échos, Harmonie, `traitCombos60` | Δ ≤ 0,01 | — | VERT |
| Écart entre vocations (C207) | ×26,6 → **×6,0** | — | **La DETTE se résorbe** |
| Chasseur / paysan (C207) | 45 % → 46 % | — | VERT |
| Surnoms, Chroniques | inchangés | — | DETTE (hors sujet) |

L'Harmonie de l'occasionnel (0,963 → 0,983) n'est **pas comparable** : C405 utilise le runner corrigé du Lead, qui pondère par le temps et inclut le hors-ligne. Il faut une référence au runner corrigé pour ce profil.

**Effets secondaires.**
- Le joueur de référence paie presque tout le coût : −7,7 % de valeur, −4,7 % de générations, Méditer débloqué plus tard.
- La domination s'inverse : mono-cultiver bat mono-commercer sur 47/50 graines (C207). C'est une nouvelle activité dominante, mais l'écart passe sous ×10.

**Variante plus prudente proposée** : Commercer **1,5 → 1,25** (au lieu de 1,1), Méditer 0,06 → 0,15. On vise ainsi : écart entre vocations ≤ ×10, valeur experimente ≥ −5 %, Méditer débloqué en moins de 300 s (p90).
- Commande : `BAL_OBJ='ACT.commercer.produce.or=1.25;ACT.mediter.produce.essence=0.15' node --import ./lab/balance/register.mjs lab/metrics/run-patched.ts --profiles=<9 profils> --seeds=1-100 --hours=6 --id=C406-fix1-prudent --shard={0,1}/2`, puis `--merge`, puis `npm run sim:guard`.
- Si le ROUGE sur Méditer persiste, l'alternative est d'abaisser le seuil de Méditer de 25 à 20 Savoir.
- Toute campagne finale se confirme aussi à dt 0,1 (cf. B4).

## B10. Garde-fou chiffré sur la distribution des surnoms

Il est implémenté dans `lab/metrics/epithet-guard.ts`, sur `extra.jsonl` (C404 ou suivantes). Seuils, par profil ayant acheté Chroniques avec au moins 50 vies surnommées, en 6 h :

| Mesure | Seuil | C404 (actuel) |
|---|---|---|
| Part du surnom le plus fréquent | ≤ 40 % des vies surnommées | **100 %** (Vénérable) |
| Nombre effectif de surnoms, exp(entropie de Shannon) | ≥ 5 | **1,00** |
| Surnoms distincts par partie (moyenne) | ≥ 3 | **0,79 à 1,00** |
| Part des vies surnommées (`guardrails.ts`) | 30 à 70 % (GDD : ~50 %) | **78 à 85 %** |
| Répartition par rareté | communs ≥ 35 % ; épiques ≤ 30 % ; légendaires ≤ 5 % | 0 % / 100 % / 0 % |
| Couverture de la campagne (indicatif) | ≥ 15/34 en 6 h (GD-04 : 12 à 15 chez les profils épargnants) | 1/34 |

[MESURÉ] `node --import ./lab/sim/register.mjs lab/metrics/epithet-guard.ts C404-kpi-additionnels` donne ROUGE pour les 5 profils concernés, code de sortie 1.

- **Pourquoi la rareté.** « Le plus rare l'emporte » n'a de sens que si le rare est rare. La pyramide fixe ce que veut dire « rareté ».
- **Pourquoi 40 %.** Ce seuil autorise un surnom thématique majoritaire par vocation (le Laboureur pour un paysan) sans monopole.
- **Vérification de la correction BAL.** `collect-extra.ts` avec la surcharge, puis `epithet-guard.ts` : le résultat doit être VERT pour mono-cultiver, mono-commercer et optimiseur.

## C. Contrôle des corrections d'outillage du Lead : **je confirme**

- **DATA-02** [CODE] `lab/sim/stats.ts:24-30` : `unlock.*` vaut NaN quand il n'y a pas de déblocage, et `never.*` est séparé. `dist()` filtre les valeurs non finies. Correct.
- **DATA-03 et DATA-09** [SIMULÉ] C405, runner corrigé : `echoShare` de l'occasionnel = 0,939, cohérent avec mon `echoShareAll` de C404 (0,927) ; la courbe horaire a bien 6 points.
- **DATA-04** : le contrôle de comparabilité existe dans `compare.ts:15`.
- **Réserve 1.** Changer la définition de l'Harmonie et de `echoShare` pour l'occasionnel rend toute campagne au runner corrigé **incomparable avec C000 pour ce profil** sur ces deux KPI. Il faut régénérer une référence sans événements au runner corrigé (C000 bis) avant tout `sim:guard` qui inclut l'occasionnel.
- **Réserve 2.** `harmonyMin` reste dans `summary.md`, alors que DATA-05 recommande de ne pas l'utiliser.
