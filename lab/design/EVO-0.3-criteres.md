# Lot 0.3 « Lignée qui mûrit » : critères de décision (fixés AVANT les mesures)

Discussion de design du 2026-11-20 avec le propriétaire, validée : mutations plafonnées, évolution
**méritée** des traits, Étoile filante, Éclats (palier Or, Almanach, prix des Bénédictions légendaires),
Hauts faits de fin de partie. Ce fichier fixe les critères avant toute simulation (PROTOCOLE, règle 3).

## Mesures

Champs ajoutés au simulateur (`lab/sim/runner.ts`, champ `traits`) et mesurés aussi sur la référence
(même code moins le lot) : part des successions qui **proposent** au moins un héritier légendaire / épique
(hors Bénédictions), part des héros **choisis** légendaires, nombre d'évolutions, Étoiles filantes vécues.

Campagne : `experimente,optimiseur`, graines 1–200, 6 h, dt 0,5, sans événements ; puis les 9 profils pour
`sim:guard`, et les 4 profils avec événements.

## Critères TRAIT (mutations + évolution), à 6 h

| # | Critère | Seuil |
|---|---|---|
| K1 | Successions proposant un légendaire (hors Bénédiction) | baisse ≥ 50 % pour experimente **et** optimiseur |
| K2 | Successions proposant un épique (optimiseur, qui achète Bonne étoile) | baisse ≥ 25 % |
| K3 | Parties où au moins une évolution a eu lieu (experimente) | ≥ 80 % : la mécanique se voit |
| K4 | Parties où un légendaire a été obtenu par évolution (optimiseur, 6 h) | entre 5 % et 60 % : atteignable sans être automatique |
| K5 | `sim:guard` sur les 9 profils | aucun ROUGE sur la valeur produite ; un ROUGE ailleurs doit être expliqué |

Variantes comparées en mémoire (`BAL_PATCH`) : chance d'évolution d'un don mûr 0,25 / 0,4 / 0,6
(+0,08 par niveau de Bonne étoile). On retient la plus faible qui passe K3 et K4.

## Critères Étoile filante

| # | Critère | Seuil |
|---|---|---|
| N1 | Parties où une Étoile filante est **proposée** en 6 h (experimente) | 10 % à 50 % : rare, mais vue |
| N2 | Aucune Étoile filante transmise, aucun Écho créé pour elle | 0 (test de régression) |

## Critères Éclats

| # | Critère | Seuil |
|---|---|---|
| E1 | Éclats gagnés par le profil `evenementiel` (avec événements) | hausse ≥ 20 % |
| E2 | Valeur produite des profils avec événements | pas de ROUGE `sim:guard` |

## Hauts faits

Seuils choisis sur une campagne longue (48 h, `experimente,optimiseur`, 50 graines) : chaque haut fait
doit être **non trivial** (≤ 60 % des parties à 6 h) et, sauf ceux liés à l'Étoile filante et à l'Almanach
(événements), **atteignable** (≥ 10 % des parties à 48 h pour au moins un profil).
