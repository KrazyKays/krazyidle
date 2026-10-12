# AGENTS.md — Digital InKrementation

## Objectif
Développer cet idle game rétro en privilégiant la simplicité, la rejouabilité, la fiabilité et une consommation minimale de tokens et de ressources.

## Contraintes techniques
- HTML, CSS et JavaScript natifs uniquement.
- Aucun framework, dépendance, build, backend, API ou appel réseau.
- Compatible avec GitHub Pages, ordinateur et mobile.
- Interface en français, esthétique terminal rétro 8-bit, visuels CSS uniquement.
- Sauvegarde `localStorage`, progression hors ligne plafonnée à 8 heures.
- Aucun son ni ressource externe.

## Règles de développement
- Lire uniquement les fichiers nécessaires à la tâche.
- Modifier le minimum de code et de fichiers possible.
- Réutiliser l'architecture et les fonctions existantes.
- Préférer la solution fonctionnelle la plus simple.
- Éviter les abstractions prématurées, dépendances, refactorisations et fonctionnalités non demandées.
- Ne pas réécrire un fichier entier pour une petite modification.
- Préserver les comportements existants et la compatibilité des sauvegardes.
- Maintenir une simulation efficace et un rendu DOM ciblé.
- Valider les données sauvegardées et éviter les gains hors ligne en double.

## Économie des requêtes Agent
- Pour une demande claire, agir directement sans plan détaillé.
- Effectuer une seule passe cohérente lorsque c'est possible.
- Ne pas lancer de sous-agents pour une tâche simple.
- Ne pas répéter les consignes ni explorer tout le dépôt sans nécessité.
- Vérifier uniquement les points pertinents après modification.
- Ne pas multiplier les passes de correction ou d'optimisation sans problème identifié.
- Poser une question uniquement si une ambiguïté importante bloque l'implémentation.

## Déploiement
- Privilégier la publication GitHub Pages depuis une branche.
- Ne pas ajouter de workflow, d'étape de build ou de dépendance de déploiement sans nécessité.
- Ne jamais inclure de secrets ou de données personnelles dans le dépôt.

## Fin de tâche
Répondre en 3 à 5 lignes maximum : fichiers modifiés, vérifications réellement effectuées et éventuel problème restant.

**Règle absolue : ne pas complexifier le projet sans bénéfice concret.**