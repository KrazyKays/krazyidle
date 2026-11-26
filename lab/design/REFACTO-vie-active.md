# Refacto « vie active » — décisions de design

> Statut : **appliquée en 0.7** (VIE-1 à VIE-6, variante V18 : rejeu 8 %, Mémoire du sang 3 niveaux, Crypte 2 niveaux, Commercer 1 Vivre, Étudier 1 Or). Chiffres et critères : `lab/balance/vie-active/RESULTATS.md`. Origine : discussion de design avec le propriétaire, 2026-11-26.
> Préalable au Compagnonnage (`BACKLOG-compagnonnage.md`). Toute valeur ci-dessous est une piste à fixer par
> simulation selon `lab/PROTOCOLE.md` (critères fixés avant les mesures, variantes en mémoire, `sim:guard`, dt 0,1).

## 1. Intention

Récompenser le joueur actif sans retirer le côté idle, **sans ajouter de règle** à la boucle de base :

> Choisis les activités du héros de ta lignée ; à sa mort, choisis son descendant ; le défunt rejoue sa vie en Écho.

Aucune sauvegarde à préserver (aucun joueur) : on peut repartir de zéro, sans migration ni remboursement.

## 2. Constat

- Les Échos font **86 à 93 %** de la production, joueur actif en ligne compris [SIMULÉ, `lab/metrics/KPIS.md`].
- Causes [CODE] : rejeu à 40 % × Mémoire du sang (+15 %/niv., sans plafond) × Sanctuaire (+10 %/niv. sur les
  Échos, sans plafond) × jusqu'à 8 emplacements. En fin de partie, la Crypte vaut plus de dix héros.
- La boucle sépare **déjà** l'actif de l'idle : en ligne, on a le héros (seul producteur flexible) et la Crypte ;
  hors ligne, le héros finit sa vie sur sa dernière activité, puis la succession attend : il ne reste que la Crypte.
  Le déséquilibre vient des chiffres, pas des règles.

## 3. Décisions [DÉCISION DU PROPRIÉTAIRE]

1. **Cible** : jouer activement rapporte **×2 à ×3** par rapport au hors-ligne ; le héros fait **40 à 70 %** de la
   production en ligne (la Crypte vaut environ un demi-héros en début de partie, 1 à 1,5 héros en fin de partie).
2. **Consommation proportionnelle à la production** (aujourd'hui : en racine carrée de la puissance, `runActivity`).
   But : une vie équilibrée (Récolter puis Commercer qui consomme pile ce qui a été récolté) reste **exactement**
   équilibrée dans son Écho, quelle que soit sa force de rejeu.
3. Pas de nouveau concept : ni multiplicateur réservé au héros, ni voies d'Héritage séparées, ni rendements
   décroissants entre Échos, ni Échos « conseillers » (pistes de la première discussion, écartées).

## 4. Leviers (réglages et retraits seulement)

| # | Levier | Aujourd'hui [CODE] | Piste | Nature |
|---|---|---|---|---|
| 1 | Force de rejeu d'un Écho | 40 % | ~20 à 25 % | chiffre |
| 2 | Mémoire du sang | +15 %/niv., sans plafond | plafonnée (~5 niveaux) | chiffre |
| 3 | Sanctuaire | Méditer +25 % et Échos +10 %/niv. | Méditer seulement | règle retirée |
| 4 | Crypte ancestrale | 2 → 8 emplacements | 2 → 4 ou 5 | chiffre |
| 5 | Consommation | ∝ √puissance | ∝ puissance | règle simplifiée |
| 6 | Rendements de Commercer et d'Étudier | voir § 5 | à recalibrer | chiffres |
| 7 | Coûts (bâtiments, arbre d'Héritage) | calés sur la Crypte actuelle | revus pour que l'actif garde son rythme | chiffres |

Effets attendus [HYPOTHÈSE] : chaque emplacement compte davantage, donc le choix des Échos redevient une vraie
décision ; la pause coûte plus cher ; les ajustements pendant la vie (selon ses stocks) ont un effet visible.

## 5. Conséquences de la consommation proportionnelle [CODE]

- **L'équilibre est conservé dans l'Écho.** Consommation et production d'une seconde rejouée sont toutes deux
  ∝ `pow` × force de rejeu. Les bâtiments, Prospérité et les événements ne jouent que sur la production : ils ne
  peuvent créer qu'un surplus, jamais un manque.
  - **Exception à corriger** : un surnom qui renforce une activité (`echoActMult`) multiplie aujourd'hui la puissance
    passée à `runActivity`, donc la consommation aussi. Il doit ne multiplier que la production.
  - Le stock sert de tampon à l'intérieur de la boucle (la phase de récolte doit précéder la phase de commerce, ce
    qui est le cas pour une vie qui a commencé par récolter).
- **Commercer devient une conversion presque neutre.** Sans bâtiment : 3 Vivres (valeur 3) → 1,58 Or (valeur 3,16),
  quelle que soit la puissance. Aujourd'hui, la racine carrée rend un héros fort plus efficace (puissance 4 : 6 Vivres
  → 6,3 Or, valeur 12,6). Étudier : 2 Or (valeur 4) → 0,76 Savoir (valeur 6,1). Il faut recalibrer `consume` ou
  `produce` de ces deux activités, sinon le temps du héros passé à commercer ne vaut presque rien.
  - Toucher à `ACT` change le Destin du jour (en réserve) : recalibrer alors avec `lab/balance/commande/calibrage.ts`,
    ou le laisser en réserve en l'état et le noter.
- **La valeur d'une vie compte la production brute** (`onProduce` → `life.value`), sans retirer ce qui a été
  consommé : Commercer gonfle l'Héritage et la valeur des Échos. À mesurer, et à corriger si ce biais devient visible
  une fois la conversion presque neutre.

## 6. Méthode

1. **Mesurer la situation actuelle** (T05) : part du héros en ligne, rapport entre le débit actif et hors ligne,
   Héritage par heure, moment où l'on débloque Alliances et Chroniques, profil par profil.
2. **Fixer les critères** avant les variantes. Proposition :
   - part du héros en ligne entre 0,40 et 0,70 (expérimenté, optimiseur) ;
   - débit actif ≥ ×2 le débit hors ligne (et ≤ ×3) ;
   - aucun profil mono-activité dominant ; Commercer et Étudier choisis par les profils qui optimisent ;
   - rythme du joueur actif (Héritage par heure, Alliances, Chroniques) à ±20 % de la référence.
3. **Variantes en mémoire** (`lab/balance/vie-active/`) : d'abord la consommation (5) avec les rendements (6), puis la
   force de rejeu (1) avec la Crypte (4), puis Mémoire (2), Sanctuaire (3) et les coûts (7). Revalider à dt 0,1.
4. **Implémenter ensuite** : un levier par commit, test de régression (dont : une vie Récolter → Commercer équilibrée
   reste équilibrée dans son Écho à toute force de rejeu), GDD et `lab/CHANGELOG-EQUILIBRAGE.md` à jour.
   Nouvelles références de simulation à figer après coup (les T05 ne correspondront plus au jeu).
