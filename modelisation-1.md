# Modélisation - 1

#### 📋 Informations

* **Durée estimée** : 45 minutes
* **Niveau** : Intermédiaire 
* **Prérequis** :
  * Maîtrise de MERISE (entités, associations, cardinalités)
  * Compréhension des contraintes d'intégrité

    \

#### 🎯 Compétences évaluées

#### 📖 Contexte élargi

En tant que consultant pour un groupe d'édition, vous devez modéliser le système de calcul des redevances. Le client exprime ces besoins spécifiques :


1. **Vue administrateur** : Gérer auteurs, livres et éditeurs
2. **Vue comptable** : Calculer les redevances mensuelles
3. **Vue auteur** : Consulter ses participations et droits

#### 💼 Travail demandé (amélioré)

**Phase 1 - Analyse conceptuelle**


1. Identifier les entités et attributs avec leurs cardinalités
2. Définir les associations et contraintes d'intégrité
3. Produire le MCD avec notation standard

**Phase 2 - Transformation technique** 4. Convertir en MLD avec clés étrangères


5. Ajouter les contraintes SQL (CHECK, NOT NULL, etc.)
6. Proposer une structure de tables optimisée

**Phase 3 - Implémentation partielle** 7. Écrire un script SQL de création des tables


8. Ajouter 2-3 lignes d'exemple par table
9. Documenter les choix de modélisation

#### 📊 Livrables attendus

#### 💡 Indices avancés

* Utiliser des contraintes CHECK pour valider les pourcentages (0-100)
* Prévoir des index sur les colonnes de jointure
* Anticiper l'évolution du système (nouveaux types d'ouvrages)

#### 🏆 Critères d'évaluation

| Compétence | Pondération |
|----|----|
| Exactitude de la modélisation | 30% |
| Respect des règles MERISE | 25% |
| Qualité du code SQL | 20% |
| Documentation technique | 15% |
| Solutions créatives | 10% |