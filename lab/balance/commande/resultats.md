# Commande du comté — calibrage (2026-11-17)

Règles validées par le propriétaire le 2026-11-17 (13 points, voir `docs/GAME_DESIGN.md`, Destin du jour).
Commande : `node --import ./lab/sim/register.mjs lab/balance/commande/calibrage.ts 365` (dates du 2026-11-01 au 2027-10-31).

## Critères fixés avant mesure

| # | Critère | Cible | Mesure [SIMULÉ] | Verdict |
|---|---|---|---|---|
| 1 | Or faisable (le solveur livre avant le seuil d'Or) | 100 % | 365/365 | ✅ |
| 2 | Une activité seule livre la commande | 0 jour | 0 | ✅ |
| 3 | Bronze par la règle naïve (Cultiver → Commercer → Étudier → Méditer, 22 s chacune, sans lire la commande) | ≥ 70 % | 1 % | ❌ |
| 4 | Or au premier essai, profils « raisonnables » (joueur réactif réglé par défaut, Cultiver ou Chasser) | < 10 % | 6 % (Bronze ou mieux : 93 %) | ✅ |
| 5 | Âge de livraison du solveur dans [50, 75] | — | 352/365 ; médiane 58,4 (41,2 à 68,1) | ✅ (96 %) |

**Critère 3 rouge, assumé et signalé au propriétaire** : la règle naïve est mal construite (Commercer consomme
3 Vivres/s et s'arrête faute de Vivres au bout de ~9 s). Même en réduisant la commande (cible 42–50 ans), elle
ne livre que 5 % des jours. Un joueur qui lit la commande et suit la ligne la plus en retard obtient au moins le
Bronze 93 % des jours. Décision : livrer, et suivre ce point chez les vrais joueurs.

## Réglages retenus (comparés sur 30 à 40 dates avant de figer)

| Réglage | Variantes | Retenu | Raison |
|---|---|---|---|
| Solveur | ≤ 6 phases ≥ 15 s ; ≤ 6 phases ≥ 5 s ; recherche locale depuis le joueur réactif | recherche locale | Les plans à 6 phases faisaient jusqu'à 18–24 ans de moins bien que le joueur réactif certains jours : l'Or aurait été donné. |
| Pénalité par changement d'activité | 0, 2 s, 5 s | 2 s | Or des profils raisonnables : 3 % / 7 % / 12 % ; changements du solveur : 18 / 14 / 10 (médiane). 5 s dépasse la cible des 10 %. |
| Cible du calibrage (âge du joueur réactif) | 56–66, 48–56, 42–50 | 56–66 | Âge du solveur dans [50, 75] : 39/40, 35/40, 14/40. |
| Marge de l'Or | +3 ans (proposé), +2 ans | +2 ans | Le solveur étant un minorant, la marge est réduite pour l'élite. |

Coût (Node) de la commande et des paliers d'une date : médiane 0,32 s, q90 0,54 s, max 1,2 s, une fois par jour et par session (cache).

## Recalibrage 0.4 (2026-11-22) : Récolter et ses consignes

Quatre activités et six choix (Récolter en Équilibre, Semer ou Battue ; codes `EL3`), plus de Prédateurs (« Hiver
rude » remplace « Hiver des loups »), traits de chasse fusionnés. La commande se recalibre d'elle-même
(`dailySetup`) ; le joueur réactif récolte en Équilibre ou en Battue. Même commande, 365 dates [SIMULÉ] :

| # | Critère | 0.3 | 0.4 | Verdict |
|---|---|---|---|---|
| 1 | Or faisable | 365/365 | 365/365 | ✅ |
| 2 | Une activité seule livre | 0 | 0 (six choix essayés) | ✅ |
| 3 | Bronze par la règle naïve | 1 % | 0 % | ❌ (inchangé, voir plus haut) |
| 4 | Or au premier essai, profils raisonnables | 6 % (Bronze+ 93 %) | 3 % (Bronze+ 80 %) | ✅ |
| 5 | Âge du solveur dans [50, 75] | 352/365, médiane 58,4 | 332/365, médiane 56,7 (36,9 à 72,2) | ✅ (91 %) |

Le Bronze des profils réactifs baisse (93 → 80 %) : le profil « réactif en Battue » tient la Battue et vide
les hardes (le Destin n'a pas de repli en Équilibre). Coût : médiane 0,27 s, q90 0,47 s, max 1,0 s.
