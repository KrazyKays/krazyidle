# Destin du jour — 14 dates (2026-11-01 → 2026-11-14)

Méthodes : 5 stratégies constantes, 3 familles de bascule réglées par date (grille 5 s), recherche aléatoire, évolutionnaire (µ+λ, population 40, amorcée par les heuristiques), escalade ; budget total par date indiqué dans la commande. Meilleur plan rejoué via `replay()` et code vérifié par `verifyCode()`.

| date | traits | modificateurs | meilleure constante | meilleure bascule réglée | règle universelle | meilleur trouvé | replay OK | palier atteint |
|---|---|---|---|---|---|---|---|---|
| 2026-11-01 | harmonieux, rat_biblio, distrait | fertiles, inflation | chasser 342 | 290 (chasser→commercer@80s) | 195 | **344** | oui | Bronze |
| 2026-11-02 | polyvalent, curieux, maladroit | inflation, lenteur | cultiver 319 | 268 (cultiver→commercer@80s) | 172 | **319** | oui | Bronze |
| 2026-11-03 | main_verte, oeil_faucon, distrait | loups, lenteur | cultiver 356 | 315 (cultiver→commercer@80s) | 240 | **362** | oui | Bronze |
| 2026-11-04 | ame_calme, harmonieux, distrait | brume, foire | mediter 818 | 431 (chasser→commercer@50s) | 367 | **818** | oui | Or |
| 2026-11-05 | ame_calme, harmonieux, maladroit | lenteur, inflation | mediter 355 | 231 (chasser→commercer@80s) | 125 | **355** | oui | Bronze |
| 2026-11-06 | polyvalent, prodige, distrait | lenteur, loups | cultiver 326 | 331 (cultiver→commercer@30→étudier@55) | 323 | **349** | oui | Bronze |
| 2026-11-07 | langue_argent, curieux, distrait | loups, prodiges | cultiver 413 | 440 (cultiver→commercer@30→étudier@55) | 414 | **449** | oui | Bronze |
| 2026-11-08 | polyvalent, rat_biblio, distrait | prodiges, academie | etudier 663 | 850 (cultiver→commercer@25→étudier@60) | 850 | **853** | oui | Or |
| 2026-11-09 | polyvalent, langue_argent, distrait | abondance, lenteur | cultiver 289 | 279 (cultiver→commercer@35→étudier@55) | 273 | **363** | oui | Bronze |
| 2026-11-10 | oeil_faucon, harmonieux, distrait | foire, lenteur | chasser 352 | 416 (chasser→commercer@45s) | 293 | **473** | oui | Bronze |
| 2026-11-11 | harmonieux, rat_biblio, distrait | brume, prodiges | mediter 699 | 387 (cultiver→commercer@25→étudier@45) | 386 | **699** | oui | Argent |
| 2026-11-12 | langue_argent, oeil_faucon, distrait | foire, abondance | commercer 386 | 575 (chasser→commercer@50s) | 395 | **767** | oui | Argent |
| 2026-11-13 | oeil_faucon, main_verte, maladroit | inflation, secheresse | mediter 289 | 212 (chasser→commercer@80s) | 119 | **314** | oui | Bronze |
| 2026-11-14 | prodige, rat_biblio, distrait | academie, lenteur | etudier 462 | 587 (cultiver→commercer@30→étudier@60) | 587 | **621** | oui | Argent |

- Meilleur score trouvé : 506 ± 201 (min 314, p50 449, max 853). Dates ≥ 800 (Or) : 2/14 ; ≥ 500 : 5/14 ; ≥ 250 : 14/14.
- Meilleure stratégie constante : 434 ± 168 (min 289, max 818).
- Règle universelle « Cultiver jusqu'à 30 s → Commercer jusqu'à 60 s → Étudier » (mêmes temps tous les jours, aucune adaptation) : 339 en moyenne, soit 65.5 % ± 21.8 du meilleur trouvé (min 35.2 %). Paliers de cette règle : ≥ 500 sur 2/14, ≥ 800 sur 1/14.
- Famille heuristique gagnante par date : {"constant:chasser":1,"constant:cultiver":3,"constant:mediter":4,"cultiver→commercer":4,"chasser→commercer":2}.
- Écart meilleur trouvé / meilleure heuristique : 1.069 (moyenne des ratios).

Plans optimaux trouvés (activité×secondes) :

- 2026-11-01 (344) : chas×58 etud×1 chas×2 cult×2 chas×27
- 2026-11-02 (319) : cult×90
- 2026-11-03 (362) : chas×1 cult×50 chas×2 cult×3 chas×3 cult×31
- 2026-11-04 (818) : medi×90
- 2026-11-05 (355) : medi×90
- 2026-11-06 (349) : chas×3 cult×22 comm×2 etud×1 comm×1 etud×2 comm×1 chas×1 comm×5 chas×4 comm×15 etud×3 comm×1 etud×1 comm×1 etud×27
- 2026-11-07 (449) : chas×2 cult×28 comm×19 etud×18 comm×4 etud×19
- 2026-11-08 (853) : cult×26 comm×20 cult×1 comm×1 cult×1 comm×1 cult×1 comm×1 cult×1 comm×1 cult×1 comm×1 cult×1 comm×1 cult×1 comm×1 etud×30
- 2026-11-09 (363) : chas×17 cult×1 chas×1 etud×2 cult×4 chas×1 comm×5 cult×1 comm×11 etud×2 comm×4 etud×1 comm×1 etud×1 comm×5 etud×33
- 2026-11-10 (473) : chas×12 comm×9 chas×5 comm×3 chas×4 comm×4 chas×7 comm×14 chas×4 comm×5 chas×4 comm×3 chas×1 comm×3 chas×4 comm×8
- 2026-11-11 (699) : medi×90
- 2026-11-12 (767) : chas×23 comm×25 chas×8 comm×9 chas×2 comm×4 chas×2 comm×1 chas×1 comm×4 chas×4 comm×3 chas×1 comm×3
- 2026-11-13 (314) : chas×16 medi×1 chas×3 medi×2 chas×1 medi×5 chas×3 medi×2 chas×4 medi×1 chas×1 medi×2 chas×1 medi×1 chas×2 medi×1 chas×2 medi×2 chas×6 medi×1 chas×1 medi×2 chas×3 medi×8 chas×3 medi×3 chas×2 medi×3 chas×8
- 2026-11-14 (621) : cult×1 chas×1 comm×4 cult×1 comm×3 chas×4 comm×1 chas×5 cult×3 chas×1 comm×1 cult×1 comm×2 chas×3 cult×2 comm×1 chas×1 comm×5 etud×4 comm×3 cult×3 chas×3 comm×2 chas×2 comm×2 chas×1 etud×16 comm×4 etud×6 comm×1 etud×2 chas×1
