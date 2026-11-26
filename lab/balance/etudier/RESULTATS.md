# Étudier — diagnostic du manque d'Or (2026-11-26)

Origine : `lab/balance/compagnonnage/RESULTATS.md` (C3) — un joueur Étudier gagne +19 % d'Héritage, sans récompense, en passant 30 % de
sa vie à Commercer. Question : la vocation pure est-elle un piège du **jeu** ou du **profil simulé** (repli, achats gourmands) ?
Le Comptoir (30 Or) et la Bibliothèque (40 Or + 15 Savoir) consomment l'Or dont Étudier a besoin [CODE] `data.ts:227-228`.

## Critères fixés AVANT les mesures

- **D1** — défaut du **jeu** si la meilleure variante « part-X » (X < 1) dépasse encore de plus de 10 % d'Héritage la meilleure variante
  « vocation pure » (base ou réserve d'Or) ; défaut du **profil** si l'écart tombe à 5 % ou moins ; entre les deux : mixte.
- **D2** — Étudier est **faible** si sa meilleure variante fait moins de 0,85 × la médiane d'Héritage des trois autres mono-vocations.

## E0 — diagnostic (`diagnostic.ts`, 40 graines × 6 h, dt 0,5 ; confirmé à dt 0,1 sur 20 graines, `results/E0-dt01.md`) [SIMULÉ]

| variante | ⚜️ 6 h | Δ vs base | part Étudier | Étudier voulu, Or manquant |
|---|---|---|---|---|
| base (mono-etudier) | 2 552 | — | 0,69 | 43 % |
| réserve d'Or 30 / 60 / 120 s | 2 542 à 2 570 | −0,3 à +0,8 % | 0,69 | 43–44 % |
| part-50 / part-60 | 3 316 / 3 322 | **+30 %** | 0,48 / 0,58 | 0–1 % |
| part-70 / 80 / 90 | 2 686 / 2 125 / 1 494 | +5 / −17 / −42 % | 0,67–0,85 | 26 / 63 / 87 % |
| autres mono : Récolter / Commercer / Méditer | 4 026 / 3 311 / 3 214 | | | |

- **Ce n'est pas l'achat de bâtiments** : garder une réserve d'Or ne change rien (±1 %).
- **D1 : défaut du jeu** (+30 % > 10 %) : un Érudit rapporte le plus en étudiant **50 à 60 %** de sa vie et en produisant son Or le reste
  du temps. Au-delà de 70 %, il manque d'Or et la vie s'effondre. Le profil mono-etudier pâtit en plus de son repli : il alterne
  Étudier et Commercer par petites touches (43 % des décisions sans Or), ce qui est pire que produire l'Or par blocs.
- **D2 : Étudier n'est pas faible** : bien joué, il fait 3 340 ⚜️, soit 1,01 × la médiane des trois autres (3 311). Récolter reste au-dessus de tout (4 026, +22 %).
- dt 0,1 : mêmes conclusions au point près (part-50 +30 %, part-60 +29,9 %).

**Lecture** : Étudier est une activité de **transformation** (Or → Savoir) dont le meilleur jeu est déjà ≈ 55 % Étudier / 45 % Commercer.
L'Érudit est donc naturellement à moitié Marchand : la paire Notaire (Commercer + Étudier) se forme d'elle-même chez un Érudit bien joué
(K1 du Compagnonnage ✗ pour cette paire).

## Décision du propriétaire (2026-11-26)

**Option A retenue** : Étudier garde son identité d'activité de transformation (meilleur jeu ≈ 55 % Étudier / 45 % production d'Or).
Aucune modification des rendements, **aucun avertissement dans l'interface** : le joueur le comprend en voyant le Savoir cesser
d'augmenter. Conséquence pour le Compagnonnage : la paire Notaire (Commercer + Étudier) est la paire « naturelle » de l'Érudit
(voir `lab/design/BACKLOG-compagnonnage.md`).

## E1 — coût en attention (`attention.ts`, 20 graines × 6 h, dt 0,5 ; `results/attention.md`) [SIMULÉ]

Question du propriétaire : l'Érudit bien joué doit changer d'activité au bon moment, alors qu'un Érudit pur jouerait AFK entre deux successions.

| façon de jouer | ⚜️ 6 h | changements par vie |
|---|---|---|
| Étudier sans jamais changer (AFK) | 231 | 0 |
| mono-etudier (repli au coup par coup) | 2 545 | 64,7 |
| blocs de Commerce de 5 / 15 / 30 s (quota d'Étude 55 %) | 3 326 / 3 345 / 3 368 | 3 / 1,7 / 1,3 |
| mono-cultiver (référence AFK) | 4 030 | 0 |

- **Étudier AFK n'existe pas** : sans changer d'activité, l'Or s'épuise et la lignée s'effondre (−91 % contre le repli). L'Érudit est par nature
  la vocation **active** ; Récolter est la vocation AFK (aucun changement nécessaire, et la plus forte).
- **Le coût en attention est faible** : un ou deux changements par vie (un bloc de Commerce) suffisent à atteindre le meilleur résultat ;
  les petits blocs n'apportent rien de plus.
- Le profil mono-etudier change 65 fois par vie : son « repli » n'est jouable par aucun humain, ses chiffres surestiment ce qu'obtiendrait
  un joueur réel qui n'a pas compris le besoin d'Or.
