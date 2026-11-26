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
