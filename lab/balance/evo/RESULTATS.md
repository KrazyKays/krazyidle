# Lot 0.3 « La lignée qui mûrit » : résultats

Critères fixés avant mesure : `lab/design/EVO-0.3-criteres.md`. Indicateurs : `node lab/balance/evo/kpi.mjs <runs.jsonl>`.
Référence : `EVO-ref-*`, code f910153 (= 0.2.2 + navigation UX-NAV, simulation identique à C092/C093 hors
nouveaux champs du simulateur). Toutes les mesures sont [SIMULÉ] (profils automatiques, pas de vrais joueurs).

## 1. Constat de départ (référence, 200 graines, 6 h, sans événements)

| Profil | Successions proposant un légendaire | … un épique | dont épique né d'une mutation | Héros choisis légendaires |
|---|---|---|---|---|
| experimente | 66,4 % | 86,1 % | 56,2 % | 62,7 % |
| optimiseur | 80,1 % | 80,3 % | 59,7 % | 78,5 % |

Fréquence chez les 60 derniers ancêtres : Élu 82 % (expérimenté), 86 % (optimiseur) ; Éternel 80 % (optimiseur).
Le légendaire n'avait plus rien d'un événement : une fois apparu, l'héritage (50 % et plus) le gardait.

## 2. Variantes comparées en mémoire (`BAL_PATCH`, 100 à 200 graines, 6 h)

| Variante | Réglage | log10 valeur exp. / opt. / déb. (réf. 8,221 / 8,665 / 8,276) | Lég. par évolution (parties, opt.) |
|---|---|---|---|
| v0.25 / v0.4 / v0.6 | chance d'évolution 0,25 / 0,4 / 0,6 (conditions de 1ʳᵉ version) | 8,088 / 8,583 (v0,25) | 100 % (trop facile) |
| base | conditions durcies (record ×1,5, vocation VI, santé ≥ 95 %…), chance 0,25 | 8,082 / 8,544 / 8,205 | 64 % |
| V1 | base + record ×1,25 | 8,082 / 8,560 / 8,206 | 94 % |
| V2 | base + vocation III | 8,099 / 8,525 / 8,217 | 63 % |
| V3 | V1 + V2 | 8,119 / 8,549 / 8,211 | 96 % |
| V4 | base + chance ×0,5 vers le légendaire | 8,081 / 8,530 / 8,202 | 44 % |
| V5 | V4 + Sang doré +60 % (au lieu de +35 %) | 8,181 / 8,630 / 8,244 | 58 % |
| **V6 (retenue)** | V5 + Élu +80 % (au lieu de +60 %) | **8,181 / 8,645 / 8,245** | **58 %** |

Les conditions plus douces (V1 à V3) ne récupèrent presque rien : la perte vient de ce qu'Élu n'est plus partout,
pas de la difficulté de l'atteindre. V6 compense par le plafond épique (Sang doré, le carrefour des évolutions)
et garde Élu au-dessus.

## 3. Campagnes officielles (lot complet : traits, Étoile filante, Éclats, hauts faits)

`EVO-lot-sans` (9 profils × 200 graines × 6 h) et `EVO-lot-avec` (4 profils, événements).

Chiffres de K1 à N1 : `EVO-lot-sans` (les mêmes à ±1 point avec événements).

| # | Critère | Mesure | Verdict |
|---|---|---|---|
| K1 | Successions proposant un légendaire −50 % | exp. 66,4 → 0,5 % ; opt. 80,1 → 9,7 % | ✅ |
| K2 | Successions proposant un épique −25 % (opt.) | 80,3 → 89,2 % | ❌ voir § 4 |
| K3 | ≥ 1 évolution dans ≥ 80 % des parties (exp.) | 100 % | ✅ |
| K4 | Légendaire par évolution dans 5–60 % des parties (opt.) | 55,0 % (exp. 19,5 %, déb. 50,5 %) | ✅ |
| K5 | Aucun ROUGE de valeur | sans év. : débutant −10,0 % (ROUGE de 0,005 log10) ; avec év. : expérimenté −10,9 % (ROUGE) | ❌ voir § 4 |
| N1 | Étoile filante proposée dans 10–50 % des parties (exp.) | 39,5 % (opt. 34,5 %) | ✅ |
| N2 | Jamais transmise, jamais d'Écho | test de régression NOVA | ✅ |
| E1 | Éclats du profil `evenementiel` +20 % | Éclats en fin de partie 15,1 → 27,5 (+82 %) ; expérimenté 11,9 → 19,3 | ✅ (solde de fin, dépenses déduites) |
| E2 | Pas de ROUGE de valeur avec événements | expérimenté −10,9 % | ❌ même cause que K5 |

`sim:guard` sans événements : 80 VERT, 6 DETTE préexistantes (part de vies surnommées), 1 ORANGE (occasionnel −13,7 %
de valeur, z −2,4), **2 ROUGE** : débutant −10,0 % de valeur, optimiseur +10 % de générations (153 → 168).
Avec événements : **2 ROUGE** : expérimenté −10,9 % de valeur, optimiseur +10 % de générations.
Profils mono-activité : valeur à ±5 %, générations à ±1 %.

## 4. Critères ratés : décision motivée

- **K2 (épiques proposés)** : les épiques **nés d'une mutation** baissent bien (59,7 → 36,0 % des successions de l’optimiseur), c'est-à-dire ceux qui
  apparaissent « d'un coup », ce que visait la demande. Les épiques qui montent sont ceux **obtenus par évolution**
  (Centenaire, Sang doré, Génie, Mémoire) puis transmis : c'est la mécanique voulue. Le critère, écrit sur tous les
  épiques, était mal ciblé ; on le note sans le réécrire après coup.
- **K5 / E2 (valeur)** : −9 à −11 % pour les profils généralistes, à la limite du seuil (10 %). C'est le prix mesuré de la
  rareté : Élu passe de 82–86 % des héros à moins de 10 %. Six variantes de compensation ont été essayées ; V6 ramène
  l'optimiseur à −1 %, l'expérimenté et le débutant restent près du seuil, parce que leur choix d'héritier
  (score `all + xp/2 + vocation`) ignore les dons d'activité mûris (+90 %), qu'un vrai joueur choisirait.
  En niveaux de bâtiment (coûts ×1,9 à ×2,4), −10 % de valeur représente moins d'un demi-niveau. **Gardé, rouge motivé.**
- **Tempo (optimiseur +10 % de générations)** : ses héros ne portent plus Éternel (+45 s de vie) dans 80 % des cas ; des
  vies plus courtes donnent plus de générations. Effet direct et voulu de la rareté. **Gardé, rouge motivé.**

## 5. Pas réel du jeu (dt 0,1)

`EVO-ref-dt01` → `EVO-lot-dt01` (experimente, debutant, optimiseur, mono-cultiver, mono-chasser ; 100 graines ; 6 h) :
valeur expérimenté −8,9 %, optimiseur −0,9 %, débutant −2,7 % (VERT) ; seul ROUGE : optimiseur +10 % de générations,
le même qu'à dt 0,5. Le lot se comporte de la même façon au pas réel du jeu.

## 6. Hauts faits

Critère : ≤ 60 % des parties à 6 h (non trivial) et ≥ 10 % à 48 h pour au moins un profil (atteignable), sauf
objectifs liés au calendrier (événements, maisons de la semaine).

| Haut fait | 6 h (FEAT-6h / FEAT2-6h / FEAT3-6h) | 48 h (EVO-lot-48h / FEAT2-48h / FEAT3-48h) | Verdict |
|---|---|---|---|
| Sang pur, 10 puis 30 générations sans négatif | 88–98 % | 100 % | ❌ trivial pour les profils : **remplacé** par Sang neuf |
| Paix du Domaine, santé moy. ≥ 98 % (puis min ≥ 97 %) | 12–100 % | 5–100 % | ❌ trivial : **remplacé** par Chasse raisonnée |
| Chasse raisonnée (moitié de vie à chasser, santé ≥ 95 %, 7 Échos) | 0 % | 100 % | ✅ |
| Transcendance | 7–50 % | 10–90 % | ✅ |
| Embrasement (Étoile filante, 5 Échos) | 0 % | 0–30 % | ✅ |
| Millénaire | 0 % | 100 % (opt., mono-chasser) | ✅ |
| Mémoire des Chroniques, 20 puis 15 surnoms | 0 % | 0 % puis 70 % (événementiel) | ✅ à 15 |
| Les cinq métiers (rang V puis III) | 0 % | 0 % | ⚠️ les profils se spécialisent : objectif humain, à suivre |
| Sang neuf (4 maisons) | 0 % | 0 % | ⚠️ 3 maisons du comté par semaine : demande deux semaines ou des alliances entre joueurs |
| L'Almanach complet | 0 % | 0 % | ⚠️ six types d'événement à l'Or : calendrier |
