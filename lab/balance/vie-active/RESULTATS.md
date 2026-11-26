# Refacto « vie active » (0.7) — résultats

Décisions de design : `lab/design/REFACTO-vie-active.md`. Outils : `mesure.ts` (indicateurs de décision) et
`variantes.mjs` (variantes en mémoire, `BAL_PATCH` / `BAL_OBJ`, aucun fichier du jeu modifié).
Référence : commit 7089cb2 (comportement identique à la 0.6). Les surcharges de `variantes.mjs` visent le code de ce commit : pour les rejouer, se placer sur 7089cb2 (`git worktree add`). Tous les chiffres sont [SIMULÉ] (profils automatiques,
pas de vrais joueurs), sans événements sauf mention.

## 1. Critères fixés avant les variantes

| # | Critère | Mesure |
|---|---|---|
| C1 | Part du héros en ligne entre 0,40 et 0,70 (expérimenté, optimiseur) | `1 − echoShare` (`runGame`) |
| C2 | Jouer activement rapporte ×2 à ×3 par rapport au hors-ligne, aux heures 3 et 5 | médiane du débit net d'1 h jouée / 1 h de `simulateOffline`, même état cloné (achats exclus) |
| C3 | Rythme du joueur actif à ±20 % : Héritage en 6 h, heure d'achat d'Alliances et de Chroniques | `legacyTotal`, `upgradeAt` |
| C4 | Aucun profil mono-activité dominant ; écart entre profils mono pas pire que la référence (×1,62) | Héritage des profils `mono-*` |
| C5 | Occasionnel (20 min / 4 h) : Héritage en 24 h ≥ 60 % de la référence | `--profiles=occasionnel --hours=24` |

## 2. Situation de départ (V0, 40 graines × 6 h, dt 0,5)

| profil | héros | actif / hors-ligne h1 · h3 · h5 | ⚜️ 6 h | Alliances (h) | Chroniques (h) |
|---|---|---|---|---|---|
| expérimenté | 0,07 | 4,2 · 1,3 · 1,2 | 2 175 | 2,6 | 4,7 |
| optimiseur | 0,13 | 4,5 · 1,4 · 1,3 | 4 381 | 1,7 | 2,7 |

Passé la première heure, jouer ne rapportait que ×1,2 à ×1,4 de plus qu'être absent.

## 3. Variantes (40 graines × 6 h ; ratio sur 20 graines)

Leviers : L = consommation ∝ puissance ; C = Commercer 1,5 Vivre et Étudier 1 Or (C′ : Commercer 1 Vivre) ;
force de rejeu de base ; Sanctuaire sans effet sur les Échos (toutes les variantes à partir de V3) ; plafonds de
Mémoire du sang et de Crypte.

| variante | réglages | héros exp. / opt. | ratio exp. h3 · h5 | ratio opt. h3 · h5 | C1 | C2 |
|---|---|---|---|---|---|---|
| V1 | L | 0,07 / 0,13 | 1,4 · 1,4 | 1,4 · 1,3 | ✗ | ✗ |
| V2 | L + C | 0,07 / 0,13 | 1,3 · 1,2 | 1,4 · 1,3 | ✗ | ✗ |
| V3 | + rejeu 0,25 | 0,19 / 0,20 | 1,5 · 1,3 | 1,5 · 1,4 | ✗ | ✗ |
| V4 | 0,25, Mém. 5, Crypte 3 | 0,22 / 0,24 | 1,5 · 1,4 | 1,5 · 1,4 | ✗ | ✗ |
| V5 | 0,20, Mém. 5, Crypte 3 | 0,26 / 0,30 | 1,7 · 1,5 | 1,7 · 1,5 | ✗ | ✗ |
| V6 | 0,15, Mém. 5, Crypte 3 | 0,32 / 0,36 | 1,8 · 1,6 | 1,8 · 1,7 | ✗ | ✗ |
| V7 | 0,20, Mém. 5, Crypte 2 | 0,29 / 0,33 | 1,6 · 1,5 | 1,8 · 1,7 | ✗ | ✗ |
| V8 | 0,15, Mém. 3, Crypte 2 | 0,39 / 0,44 | 1,8 · 1,7 | 2,1 · 1,9 | ✗ | ✗ |
| V9 | 0,10, Mém. 5, Crypte 3 | 0,41 / 0,45 | 1,9 · 1,8 | 2,1 · 1,7 | ✓ | ✗ |
| V10 | 0,10, Mém. 3, Crypte 2 | 0,49 / 0,55 | 2,1 · 2,0 | 2,3 · 2,3 | ✓ | ≈ |
| V11 | 0,08, Mém. 3, Crypte 2 | 0,55 / 0,60 | 2,5 · 2,3 | 2,8 · 2,4 | ✓ | ✓ |
| V12 | 0,12, Mém. 5, Crypte 2 | 0,40 / 0,46 | 1,7 · 1,7 | 2,1 · 2,0 | ✓ | ✗ |
| V13 | 0,15, Mém. 3, Crypte 1 | 0,45 / 0,51 | 2,1 · 2,0 | 2,3 · 2,4 | ✓ | ≈ |
| V14 | 0,20, Mém. 3, Crypte 1 | 0,38 / 0,44 | 1,8 · 1,7 | 1,9 · 2,0 | ✗ | ✗ |
| V15 | 0,12, Mém. 3, Crypte 1 | 0,50 / 0,57 | 2,1 · 2,1 | 2,4 · 2,5 | ✓ | ✓ |
| V16 | 0,10, Mém. 3, Crypte 1 | 0,55 / 0,62 | 2,6 · 2,2 | 2,5 · 3,0 | ✓ | ✓ (limite) |
| V17 | V16 + C′ | 0,55 / 0,62 | 2,4 · 2,3 | 2,5 · 3,0 | ✓ | ✓ (limite) |
| **V18** | **V11 + C′** | **0,54 / 0,60** | **2,3 · 2,2** | **2,8 · 2,4** | ✓ | ✓ |

Constats :
- **La consommation proportionnelle seule ne change rien** à l'équilibre entre héros et Échos (V1, V2).
- **Le plafond des améliorations compte autant que la force de base** : à 0,25, la Crypte vaut encore 3 à 4 héros
  (V3, V4). Il faut couper la force de base, Mémoire et le nombre d'emplacements ensemble.
- **Le rythme ne bouge presque pas** (C3) : l'Héritage se calcule sur la vie du héros seul. Héritage en 6 h de −1 à
  −5 % pour toutes les variantes, Alliances et Chroniques de −10 % à +5 %. Les coûts n'ont pas besoin d'être revus.
- **Commercer** : avec la consommation proportionnelle, une lignée qui ne fait que commercer s'affame (ses Échos
  consomment autant qu'ils produisent). Mono-commercer / mono-cultiver : 0,98 (V0) → 0,84 (V2) → 0,78 (V11) → **0,82**
  avec C′ (1 Vivre). C'est l'effet voulu (la vie doit s'équilibrer), et aucun profil mono ne domine.

## 4. Variante retenue : V18

Rejeu 8 %, Mémoire du sang 3 niveaux au plus, Crypte 2 niveaux au plus (4 emplacements), Sanctuaire sans effet sur
les Échos, consommation proportionnelle, Commercer 1 Vivre et Étudier 1 Or par unité de puissance. Choisie parce que
c'est la mieux centrée sur C1 et C2 en gardant deux niveaux de Crypte à acheter.

| critère | résultat V18 | |
|---|---|---|
| C1 | héros 0,54 (exp.) · 0,60 (opt.) ; 0,55 et 0,61 à dt 0,1 | ✓ |
| C2 | exp. ×2,3 · ×2,2 ; opt. ×2,8 · ×2,4 ; à dt 0,1 : ×2,5 · ×2,3 et ×2,8 · ×2,9 | ✓ |
| C3 | Héritage −4 % (exp.), −5 % (opt.) ; Alliances −7 % / −8 % ; Chroniques −10 % / −1 % | ✓ |
| C4 | écart mono ×1,58 (réf. ×1,62) ; mono-cultiver ≈ optimiseur, comme avant | ✓ |
| C5 | occasionnel 24 h (20 graines) : 579 ⚜️ contre 622, soit 93 % (mesuré sur le jeu après application, `V18-jeu-occ24`) | ✓ |

Validation au pas réel (dt 0,1, 16 graines, ratio sur 8 graines) : écarts de moins de 0,02 sur la part du héros.

## 5. Campagnes officielles (après application, commit dab13b8)

`V07-ref-*` (commit 7089cb2) → `V07-lot-*` (voir `lab/campaigns/CAMPAIGNS.md`). `sim:guard` :

- **Sans événements** : 44 VERT, 19 ROUGE, 6 DETTE préexistantes. Avec événements : 22 VERT, 7 ROUGE. dt 0,1 : 30 VERT,
  11 ROUGE.
- **Rouges voulus** :
  - part des Échos (14 rouges sans événements) : 0,87–0,94 → 0,36–0,46. C'est l'objet de la refacto ; la plage du garde-fou
    passe à [0,30 ; 0,60] (héros 40 à 70 %) ;
  - valeur produite (log10) : −0,7 à −1,0 (production brute ÷5 à ÷10, faute de multiplicateurs d'Échos). Les bâtiments
    ne perdent que 0 à 3 niveaux (coûts exponentiels) ; générations ±1 %, Héritage −4 à −12 % ;
  - Héritage de mono-commercer −20 % (4 130 → 3 322) : la racine carrée rendait une lignée de pur marchand autonome ;
    elle doit maintenant récolter.
- **Événements** : le profil événementiel garde l'or à 100 % des fenêtres ; l'expérimenté est inchangé (95 % Argent) ;
  l'optimiseur, qui ignore les événements, passe de 92 % à 33 % d'Argent : Concile et Éclipse dopent des Échos devenus
  faibles. C'est cohérent avec l'intention (récompenser celui qui joue l'événement).

## 6. Points ouverts

- La valeur d'une vie compte la production brute : Commercer gonfle encore l'Héritage et la valeur de ses Échos (non
  corrigé, sans effet mesurable sur C3).
- Le profil optimiseur ne choisit toujours que Récolter (déjà le cas en 0.6) : sa règle gloutonne ignore le besoin d'Or
  et de Savoir. À revoir côté outillage avant de juger l'intérêt de Commercer et d'Étudier.
- Destin du jour (en réserve) : il lit `ACT` et la règle de consommation ; ses commandes et paliers ne sont plus
  calibrés. À recalibrer (`lab/balance/commande/calibrage.ts`) si on le reprend.
