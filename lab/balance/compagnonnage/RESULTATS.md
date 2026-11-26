# Compagnonnage — calibrage (2026-11-26)

Spécification : `lab/design/BACKLOG-compagnonnage.md`. Rien n'est modifié dans le jeu : tout est simulé en mémoire
(la récompense est versée par l'enveloppe du profil, `recompense.ts`).

## Critères fixés AVANT les mesures C1

- **K1 — pas de récompense passive** : sans viser la paire, ≤ 10 % des vies (après l'achat) remplissent 50 % + 30 %.
- **K2 — viser rapporte, sans écraser** : pour un joueur concentré (`mono-<vocation>`), viser une paire avec récompense
  donne un Héritage à 6 h entre **+3 % et +15 %** (15 % = seuil rouge de `sim:guard`) par rapport à ne pas la viser.
- **K3 — paires comparables** : écart d'Héritage entre la meilleure et la pire paire (à N égal) ≤ 10 points.
- **K4 — la vocation reste première** : la récompense d'une vie ≤ 50 % de la valeur produite par cette vie.

## C0 — état des lieux (`etat-des-lieux.ts`, 4 profils × 40 graines × 6 h, dt 0,5) [SIMULÉ]

Voir `results/C0.md`.
- K1 tenu : vies 50 + 30 après h2 = 0 % (expérimenté, optimiseur), 2,1 % (débutant), 2,9 % (occasionnel).
  **Fragile** : la 2e activité de l'expérimenté vaut 0,30 en médiane (il commerce dès 70 % de sa vie) : il frôle le seuil.
- L'optimiseur ne joue que Récolter (déjà connu) et ne débloque jamais Étudier ni Méditer : seule la paire Récolter + Commercer lui est ouverte.
- Viser une paire SANS récompense fait **gagner** l'expérimenté (+8 à +41 % d'Héritage, sauf Commercer → Méditer −2 %) :
  sa rotation est plus faible qu'une vie structurée. Il n'est pas une référence de coût ; on mesure contre les mono-vocations.
- Héritage cumulé (p50) h1…h6 : expérimenté 218 / 534 / 900 / 1 282 / 1 684 / 2 085 ; optimiseur 410 / 961 / 1 679 / 2 479 / 3 301 / 4 141.

## C1 — coût de la visée et récompense R-base (`recompense.ts`, mono-<vocation> × 3 secondes vocations × 40 graines × 6 h, dt 0,5, visée dès h2) [SIMULÉ]

Récompense R-base : N s du débit de la vie en cours hors événements, à valeur égale entre les deux ressources.
`results/C1.md` (ressources seules), `results/C1-her.md` (récompense comptée aussi dans l'Héritage de la vie), `results/C1-s20.md` (2e à 20 %, N = 0).

- **Coût de la visée sans récompense : −10 à −24 % d'Héritage** (seule exception : mono-Commercer + Récolter ≈ 0, car il récolte
  déjà 27 % de sa vie quand il manque de Vivres). Abaisser la 2e à 20 % ne retire que 2 à 4 points : le coût vient des 30 %
  passés dans une activité de bas niveau, pas du seuil.
- **Ressources seules : ne compensent rien.** Même N = 120 s (≈ la valeur d'une vie entière, K4 ✗) laisse l'Héritage à −9 à −24 % :
  l'Héritage dépend de la production du héros (racine cubique), pas des stocks.
- **Comptée dans l'Héritage** : N = 120 ramène la plupart des paires à +2 à +6 % (K2 ✓) mais vaut une vie entière (K4 ✗) ;
  N = 60 (≈ 50 %, K4 limite) laisse −2 à −19 %.
- **K3 ✗ quelle que soit N** : Étudier + Commercer s'emballe (mono-Étudier → Commercer : +15 % à N = 30, +39 % à N = 120 ; +64 % comptée
  dans l'Héritage). L'Or versé débloque Étudier, affamé d'Or : la récompense lève un goulot au lieu de compenser un coût.
- [HYPOTHÈSE] une part du coût de Commercer → Étudier/Méditer vient de la visée naïve (Étudier sans Or en stock) ; un joueur qui
  prépare ses stocks avec les 20 % libres paierait moins. Non mesuré.

**Conclusion C1** : aucun N ne tient K2, K3 et K4 ensemble. Une récompense ponctuelle en ressources est le mauvais levier pour
compenser un coût structurel (niveau de la 2e activité). Pistes à trancher par le propriétaire avant C2 : voir la discussion.

## C2 — échange d'expérience (proposition du propriétaire) et Héritage ×k (piste E) [SIMULÉ]

Mêmes graines et protocole que C1, N = 0 (pas de lot de ressources). `results/C2-xp.md`, `results/C2-k*.md`.
k est approché en multipliant par k³ la valeur déjà produite au moment de la formation (les ≤ 20 % restants ne sont pas multipliés).

- **Échange d'expérience : gain ≤ 1,4 point d'Héritage** (ex. mono-Récolter + Commercer −10,8 → −10,1 %). La courbe d'expérience est
  exponentielle (`xpToNext` = 5·1,3ⁿ) : la vocation ne gagne que +0,6 à +1,7 niveau ; la 2e rattrape la vocation, mais il ne reste
  que ≤ 20 % de la vie pour en profiter, et le niveau repart de zéro à la vie suivante. **Écarté.**
- **Héritage ×k** : k = 1,15 / 1,25 / 1,35 → paires Récolter/Méditer entre −5 et +10 % ; mono-Commercer + Récolter +8,5 / +15 / +22 % ;
  paires vers ou depuis Commercer/Étudier encore −4 à −19 %. K3 ✗ (écart de 30 à 37 points). L'écart vient des chaînes de consommation :
  la visée naïve étudie ou commerce sans stock. **Avant de fixer k, mesurer une visée réaliste** (repli `feasible`, stocks préparés
  pendant les 20 % libres).

## C3 — visée réaliste (`--smart=1`) [SIMULÉ]

Le bot ne pratique une activité que si son intrant couvre 5 s ; sinon il passe à l'autre cible ou, s'il lui reste du temps libre,
produit l'intrant manquant. Paires formées : 98 à 99 % des vies visées. `results/C3-*.md`.

- **Coût réaliste sans récompense** : −10 à −14 % pour les vocations Récolter et Méditer (elles ne consomment rien, la 2e leur est
  inutile) ; −4 à −10 % pour Commercer et Étudier (la 2e peut nourrir la vocation) ; mono-Commercer + Récolter ≈ 0.
- **Anomalie hors Compagnonnage** : mono-Étudier + Commercer **+19 % sans aucune récompense**. Étudier seul manque d'Or : produire
  son Or soi-même vaut mieux que la vocation pure. C'est un défaut préexistant de la chaîne Étudier ← Or, à traiter à part.
- **Échange d'expérience (version du propriétaire : chaque métier reçoit l'expérience de l'autre, 50 + 30 = 80 s)** : +0,3 à +1 point
  d'Héritage, avec ou sans lot de ressources. Confirmé écarté.
- **Héritage ×k** : k = 1,25 → 10 paires sur 12 entre −0,6 et +16 % (Récolter et Méditer : 0 à +5 % ; Commercer et Étudier : +4 à
  +16 %) ; mono-Étudier + Commercer +42 %. K2 tenu en grande partie, K3 ✗ (≈ 16 points hors anomalie).
  Le coût dépend de la **vocation** (consomme-t-elle ?), pas de la paire : une règle symétrique ne peut pas l'égaliser exactement.

## Principe du propriétaire et vérification (2026-11-26)

Principe : ne pas équilibrer les métiers à outrance, car le joueur aura toujours besoin de Vivres (pour Commercer) et d'Essence (pour les
améliorations). Vérification [CODE] + [SIMULÉ, 10 graines × 6 h] : les améliorations d'Héritage se paient en ⚜️, pas en Essence ; l'Essence
ne sert qu'au Sanctuaire et à la Clepsydre (`data.ts:229-230`). Le profil optimiseur joue Récolter 100 % du temps, n'achète que les Champs,
ne produit ni Or ni Essence, achète les mêmes améliorations d'Héritage que mono-Récolter (Prospérité 14, Sève 10, Crypte 2…) et reste le
profil le plus fort. Le besoin de diversifier n'existe donc pas aujourd'hui pour Récolter ; il existe pour Commercer (Vivres) et Étudier (Or).

## C4 — calibrage de k (Héritage ×k) contre un Érudit bien joué : critères fixés AVANT les mesures

Validé par le propriétaire : **K3 assoupli à 20 points**, Notaire (Commercer + Étudier) à multiplicateur réduit kN.
Bases : mono-cultiver, mono-commercer, mono-mediter et **erudit** (Étudier 55 %, Or produit par blocs de 30 s : meilleur Érudit d'E1).
Visée réaliste (C3). k appliqué **exactement** : l'Héritage versé à la succession de la vie qui a formé la paire est multiplié par k
(C2-C3 l'approchaient par la valeur). Grille : k ∈ {1 ; 1,05 ; 1,1 ; 1,15 ; 1,2 ; 1,25 ; 1,3}, kN pris dans la même grille.

- **K1** : sans viser, part des vies 50 + 30 ≤ 10 % ; exception admise pour le Notaire chez l'Érudit (paire naturelle, décision A).
- **K2** : les 9 combinaisons hors Notaire entre **+3 % et +15 %** d'Héritage à 6 h ; les 3 combinaisons Notaire (Marchand → Étudier,
  Érudit → Commercer) entre **0 % et +15 %** (pas un piège, pas un cadeau).
- **K3** : écart entre la meilleure et la pire des 12 combinaisons ≤ **20 points**.
- **K4** (relu pour ×k, la récompense n'étant plus un lot) : k ≤ 1,3, soit au plus un rang et demi de vocation (+20 % par rang).
- **Règle de choix** : le plus petit k puis le plus petit kN qui tiennent K2 et K3. Si aucun couple ne les tient, celui qui minimise le
  nombre de combinaisons hors bornes, signalé comme tel.

## C4 — résultats (`calibrage.ts`, `choix.ts`, 4 bases × 3 × 7 valeurs de k × 40 graines × 6 h, dt 0,5) [SIMULÉ]

Tableau complet : `results/C4-choix.md`. Paires formées : 99 à 100 % des vies visées.

- **K1** : vies 50 + 30 sans viser = 0 à 0,5 % (Récolter, Commercer, Méditer) ; **87 % chez l'Érudit** (Notaire, exception admise).
- **Règle de choix appliquée telle que fixée : aucun couple ne tient K2 et K3.** Couple le moins hors bornes : **k = 1,3, kN = 1,15**
  (écart 18,5 points ✓), avec **1 combinaison hors bornes : Marchand → Récolter +22,9 %** (> 15 %, rouge de `sim:guard`).
- Cause : Marchand → Récolter ne coûte rien sans récompense (−0,2 %), comme le Notaire chez l'Érudit. Commercer consomme des Vivres :
  le **Colporteur** (Récolter + Commercer) est la paire naturelle du Marchand, de la même façon que le Notaire est celle de l'Érudit.
- La paire la plus chère est l'**Alchimiste** (Étudier + Méditer : −14 à −15 % sans récompense) : c'est elle qui impose k = 1,3.
- [PROPOSITION, non conforme à la règle fixée, à valider par le propriétaire] traiter le Colporteur comme le Notaire (kN). Avec
  k = 1,3 et kN = 1,2 : 12 combinaisons sur 12 dans les bornes, de +2,8 % (Paysan → Commercer) à +14,9 % (Marchand → Récolter), écart 12,1 points.
- À faire avant implémentation : revalider le couple retenu à dt 0,1 (règle 4) et le confronter à `sim:guard` sur les profils de référence.

**Décision du propriétaire (2026-11-26)** : proposition validée — Colporteur et Notaire = paires naturelles à kN = 1,2, autres paires k = 1,3.

## C4-dt01 — revalidation du couple retenu au pas réel (dt 0,1, 20 graines × 6 h ; `results/C4-dt01.md`) [SIMULÉ]

11 combinaisons sur 12 dans les bornes, écart 12,7 points ✓, K1 inchangé (Érudit 86 %, autres ≤ 0,3 %). Seule Érudit → Récolter
dépasse : **+15,5 %** (dt 0,5 : +13,6 % sur 40 graines), soit 0,5 point au-dessus de la borne, sur deux fois moins de graines :
dans le bruit, à surveiller au `sim:guard` après implémentation.

## C5 — prix de l'amélioration et boost de l'Écho, avec le vrai moteur (COMP-1) : critères fixés AVANT les mesures

Prix (grille 120 / 200 / 300 / 450 / 600 ⚜️, `prix.ts`, surcharge `BAL_OBJ=LEGACY.compagnonnage.base=…`) :
- **P1 — milieu de partie** : l'expérimenté l'achète entre **h2 et h4** (médiane, parties de 6 h).
- **P2 — après Chroniques** : pour chaque profil, achat médian après celui de Chroniques.
- Règle : le prix le plus haut qui tient P1 et P2 (un objectif de milieu de partie se mérite). Occasionnel : information seule.

Boost de l'Écho (grille 0 / 0,1 / 0,15 / 0,25, `reel.ts`, surcharge `BAL_PATCH` de `COMPAGNON_ECHO`), avec le prix retenu :
- **E1** : visée réaliste avec le vrai moteur (Héritage ×k, lot, échange d'expérience, boost) : K2 et K3 de C4 tenus
  (hors paires naturelles +3 à +15 %, paires naturelles 0 à +15 %, écart ≤ 20 points).
- Règle : le boost le plus fort qui tient E1. Si même 0 ne tient pas : lot 30 → 10 s, puis signalement.
- Tolérance de bruit déjà constatée (C4-dt01) : un dépassement ≤ 1 point est signalé, pas éliminatoire.

## C5 — résultats [SIMULÉ]

**Prix** (`results/C5-prix-*.md`, 6 profils × 40 graines × 6 h) :

| prix | expérimenté (h, part) | optimiseur | débutant | mono-Récolter | mono-Étudier |
|---|---|---|---|---|---|
| 120 | 5,10 (100 %) | 3,15 | 5,60 (90 %) | 3,27 | 4,28 |
| 150 | 5,83 (90 %) | 3,52 | jamais (23 %) | 3,61 | 4,85 |
| 200 | jamais (0 %) | 4,05 | jamais | 4,23 | 5,76 |
| ≥ 300 | jamais | 5,28 puis jamais | jamais | 5,41 puis jamais | jamais |

- **P1 ✗ pour tout prix supérieur à Chroniques** : l'expérimenté n'achète Chroniques (90 ⚜️) qu'à 4,22 h, car ses achats gourmands
  dépensent l'Héritage en Prospérité au fil de l'eau. P2 ✓ partout.
- La règle fixée n'est donc pas applicable telle quelle. **Retenu : 120 ⚜️**, le seul prix que l'expérimenté atteint dans 100 % des
  parties de 6 h (≈ 5 h, fin de partie), une heure environ après Chroniques pour tous les profils. Écart à la règle signalé.

**Boost de l'Écho** (`results/C5-e*.md`, vrai moteur, amélioration offerte à h2 aux deux bras) :
- Le boost ne change pas l'Héritage (moins de 0,5 point entre 0 et 0,25) : il touche les stocks, pas la production du héros.
  L'Écho d'un compagnon est gardé dans la Crypte dans 66 à 98 % des cas (vie de forte valeur) : le boost est visible.
- **E1 ✗ à tous les boosts, pour une raison indépendante du boost** : avec le vrai moteur, l'Érudit de référence forme déjà le Notaire
  dans 87 % de ses vies et touche ×1,2. Viser une autre paire lui fait perdre ce Notaire : Érudit → Récolter −1,4 %, Érudit → Méditer
  −11,2 % (C4 comparait à un Érudit sans ×1,2). Les 10 autres combinaisons : +1,8 à +14,3 %.
- Lot réduit à 10 s (règle de repli) : sans effet (Érudit → Méditer −10 %). **Signalé** : chaque paire garde au moins une voie
  rentable (Agronome par le Paysan +9 %, Alchimiste par le Mystique +4,5 %), mais pour l'Érudit le seul bon compagnonnage est le Notaire.
- **Retenus** : boost de l'Écho 0,15 (valeur initiale : la règle ne départage pas), lot 30 s.
