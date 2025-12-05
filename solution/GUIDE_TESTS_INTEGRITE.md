# 🧪 Guide de Test des Vérifications d'Intégrité

## 📋 Vue d'ensemble

Ce document explique comment tester manuellement les 3 niveaux de vérifications d'intégrité implémentés dans `seed.sql`.

---

## ✅ Test 1 : Vérifications Automatiques (seed.sql)

### Commande
```bash
cd c:\Users\Fares\Modelisation1\solution
rm -f database.db && sqlite3 database.db < schema.sql > /dev/null 2>&1 && sqlite3 database.db < seed.sql 2>&1
```

### Résultat attendu
```
✓ Données insérées avec succès!
--- STATISTIQUES ---
Éditeurs: 3
Auteurs: 5
Livres: 5
Participations: 10
--- VÉRIFICATION DES POURCENTAGES PAR LIVRE ---
Les Mystères de Paris|100
Histoire de France Contemporaine|100
Le Guide du Développeur Python|100
Nouvelles du Siècle|100
L'Art de la Négociation|100
--- VÉRIFICATION DES LIVRES ORPHELINS ---
✓ Tous les livres ont au moins un auteur
```

### Ce qui est vérifié
- ✅ **Niveau 1** : Comptages corrects (3 éditeurs, 5 auteurs, 5 livres, 10 participations)
- ✅ **Niveau 2** : Tous les livres ont exactement 100% de redevances
- ✅ **Niveau 3** : Aucun livre orphelin (sans auteur)

---

## 🔴 Test 2 : Simulation d'un Livre Orphelin

### But
Tester la capacité du système à détecter un livre sans auteur.

### Commande
```bash
sqlite3 database.db "INSERT INTO LIVRE (isbn, titre, date_publication, prix_vente, nombre_pages, genre, id_editeur) VALUES ('978-TEST-ORPHELIN', 'Livre Test Sans Auteur', '2024-01-01', 25.00, 200, 'Test', 1); SELECT '--- TEST: Livre orphelin créé ---'; SELECT l.titre, COALESCE(COUNT(p.id_participation), 0) as nb_auteurs FROM LIVRE l LEFT JOIN PARTICIPATION p ON l.id_livre = p.id_livre WHERE l.isbn = '978-TEST-ORPHELIN' GROUP BY l.titre;"
```

### Résultat attendu
```
--- TEST: Livre orphelin créé ---
Livre Test Sans Auteur|0
```

### Interprétation
- ✅ Livre créé avec succès
- ⚠️ Nombre d'auteurs = **0** (problème détecté)

---

## 🔍 Test 3 : Vérification de la Détection

### But
Vérifier que la requête de détection des orphelins identifie bien le problème.

### Commande
```bash
sqlite3 database.db "SELECT '--- VÉRIFICATION DES LIVRES ORPHELINS ---'; SELECT CASE WHEN COUNT(*) = 0 THEN '✓ Tous les livres ont au moins un auteur' ELSE '⚠ ' || COUNT(*) || ' livre(s) sans auteur détecté(s)' END as statut FROM LIVRE l LEFT JOIN PARTICIPATION p ON l.id_livre = p.id_livre WHERE p.id_participation IS NULL; SELECT l.titre, l.isbn FROM LIVRE l LEFT JOIN PARTICIPATION p ON l.id_livre = p.id_livre WHERE p.id_participation IS NULL;"
```

### Résultat attendu
```
--- VÉRIFICATION DES LIVRES ORPHELINS ---
⚠ 1 livre(s) sans auteur détecté(s)
Livre Test Sans Auteur|978-TEST-ORPHELIN
```

### Interprétation
- ✅ Le système détecte le livre orphelin
- ✅ Affiche un message d'alerte clair
- ✅ Liste le titre et l'ISBN du livre problématique

---

## 🧹 Test 4 : Nettoyage (Bonus)

### Commande
```bash
sqlite3 database.db "DELETE FROM LIVRE WHERE isbn = '978-TEST-ORPHELIN'; SELECT '✓ Livre de test supprimé';"
```

### Résultat attendu
```
✓ Livre de test supprimé
```

### Note
Grâce à `ON DELETE CASCADE` sur la relation `LIVRE → PARTICIPATION`, si le livre avait eu des participations, elles auraient été supprimées automatiquement.

---

## 📊 Scénarios de Test Complets

### Scénario A : Données Valides (État Initial)

| Vérification | Statut | Message |
|--------------|--------|---------|
| Comptages | ✅ PASS | 3 éditeurs, 5 auteurs, 5 livres, 10 participations |
| Pourcentages | ✅ PASS | Tous les livres = 100% |
| Livres orphelins | ✅ PASS | Aucun livre sans auteur |

---

### Scénario B : Livre Sans Auteur (Test d'Erreur)

| Vérification | Statut | Message |
|--------------|--------|---------|
| Comptages | ⚠️ WARN | 6 livres mais seulement 10 participations |
| Pourcentages | ⚠️ WARN | Un livre avec 0% (NULL) |
| Livres orphelins | ❌ FAIL | 1 livre sans auteur détecté |

**Détail du problème** :
```
Livre Test Sans Auteur|978-TEST-ORPHELIN
```

---

### Scénario C : Pourcentage Incorrect (Simulation)

**Commande de test** :
```sql
-- Créer un livre avec 80% seulement
INSERT INTO LIVRE (isbn, titre, date_publication, prix_vente, nombre_pages, genre, id_editeur) 
VALUES ('978-TEST-80', 'Livre 80%', '2024-01-01', 30.00, 250, 'Test', 1);

INSERT INTO PARTICIPATION (id_auteur, id_livre, pourcentage_redevance, role, date_debut) 
VALUES (1, (SELECT id_livre FROM LIVRE WHERE isbn = '978-TEST-80'), 80.00, 'auteur principal', '2024-01-01');
```

**Résultat attendu** :
```
--- VÉRIFICATION DES POURCENTAGES PAR LIVRE ---
Livre 80%|80  ← ⚠️ PROBLÈME : Il manque 20%
```

**Note** : Ce test échouerait en pratique car le trigger `trg_check_total_pourcentage_insert` n'empêche pas une somme < 100%, seulement > 100%. Pour une validation complète, il faudrait un trigger supplémentaire.

---

## 🛠️ Commandes de Diagnostic Avancées

### Trouver les livres avec pourcentages incorrects

```sql
SELECT 
    l.titre,
    COALESCE(SUM(p.pourcentage_redevance), 0) as total,
    100 - COALESCE(SUM(p.pourcentage_redevance), 0) as ecart
FROM LIVRE l
LEFT JOIN PARTICIPATION p ON l.id_livre = p.id_livre
GROUP BY l.id_livre, l.titre
HAVING total != 100;
```

### Lister tous les auteurs sans participations

```sql
SELECT 
    a.id_auteur,
    a.prenom || ' ' || a.nom as nom_complet,
    COUNT(p.id_participation) as nb_participations
FROM AUTEUR a
LEFT JOIN PARTICIPATION p ON a.id_auteur = p.id_auteur
GROUP BY a.id_auteur, a.nom, a.prenom
HAVING nb_participations = 0;
```

### Statistiques détaillées par éditeur

```sql
SELECT 
    e.nom_editeur,
    COUNT(DISTINCT l.id_livre) as nb_livres,
    COUNT(DISTINCT p.id_auteur) as nb_auteurs_uniques,
    ROUND(AVG(l.prix_vente), 2) as prix_moyen
FROM EDITEUR e
LEFT JOIN LIVRE l ON e.id_editeur = l.id_editeur
LEFT JOIN PARTICIPATION p ON l.id_livre = p.id_livre
GROUP BY e.id_editeur, e.nom_editeur
ORDER BY nb_livres DESC;
```

---

## 🎯 Checklist de Test

Avant de considérer la base comme valide, vérifier :

- [ ] Tous les comptages correspondent aux données insérées
- [ ] Tous les livres ont exactement 100% de redevances
- [ ] Aucun livre sans auteur
- [ ] Aucun auteur sans email valide
- [ ] Tous les SIRET font 14 caractères
- [ ] Aucune date de publication future
- [ ] Aucune date de collaboration future
- [ ] Les triggers fonctionnent (test d'insertion invalide)
- [ ] Les clés étrangères sont respectées
- [ ] Les index sont créés

---

## 📝 Script de Test Complet

Créer un fichier `test_integrite.sh` :

```bash
#!/bin/bash
set -e

echo "=== TEST D'INTÉGRITÉ DE LA BASE DE DONNÉES ==="
echo ""

# Test 1 : Création et vérifications automatiques
echo "Test 1: Création de la base et vérifications automatiques"
rm -f database.db
sqlite3 database.db < schema.sql > /dev/null 2>&1
sqlite3 database.db < seed.sql 2>&1
echo ""

# Test 2 : Simulation livre orphelin
echo "Test 2: Simulation d'un livre orphelin"
sqlite3 database.db "INSERT INTO LIVRE (isbn, titre, date_publication, prix_vente, nombre_pages, genre, id_editeur) VALUES ('978-TEST-ORPHELIN', 'Livre Test Sans Auteur', '2024-01-01', 25.00, 200, 'Test', 1);"
echo "Livre orphelin créé"
echo ""

# Test 3 : Détection
echo "Test 3: Détection du livre orphelin"
sqlite3 database.db "SELECT CASE WHEN COUNT(*) = 0 THEN '✓ PASS' ELSE '⚠ FAIL: ' || COUNT(*) || ' orphelin(s)' END FROM LIVRE l LEFT JOIN PARTICIPATION p ON l.id_livre = p.id_livre WHERE p.id_participation IS NULL;"
sqlite3 database.db "SELECT titre FROM LIVRE l LEFT JOIN PARTICIPATION p ON l.id_livre = p.id_livre WHERE p.id_participation IS NULL;"
echo ""

# Test 4 : Nettoyage
echo "Test 4: Nettoyage du livre de test"
sqlite3 database.db "DELETE FROM LIVRE WHERE isbn = '978-TEST-ORPHELIN';"
echo "✓ Base nettoyée"
echo ""

# Test 5 : Vérification finale
echo "Test 5: Vérification finale"
sqlite3 database.db "SELECT COUNT(*) || ' livres' FROM LIVRE; SELECT CASE WHEN COUNT(*) = 0 THEN '✓ Aucun orphelin' ELSE '⚠ ' || COUNT(*) || ' orphelin(s)' END FROM LIVRE l LEFT JOIN PARTICIPATION p ON l.id_livre = p.id_livre WHERE p.id_participation IS NULL;"

echo ""
echo "=== TESTS TERMINÉS ==="
```

**Utilisation** :
```bash
chmod +x test_integrite.sh
./test_integrite.sh
```

---

## 🔗 Références

- **schema.sql** : Définition des tables et contraintes
- **seed.sql** : Insertion des données et vérifications
- **tests.sql** : Suite de tests unitaires complète
- **JUSTIFICATION_TECHNIQUE.md** : Explication des contraintes CHECK et TRIGGERS
- **GUIDE_FOREIGN_KEYS.md** : Guide sur ON DELETE CASCADE/RESTRICT

---

**Date** : 2025-12-05  
**Version** : 1.0  
**Projet** : Système de Redevances d'Édition
