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
