# 🔗 Guide des Contraintes d'Intégrité Référentielle

## 📚 Comprendre ON DELETE et ON UPDATE

Les clauses `ON DELETE` et `ON UPDATE` définissent le comportement automatique des clés étrangères (Foreign Keys) lorsque les données référencées sont modifiées ou supprimées.

---

## 🎯 Les Actions Disponibles

### 1. **RESTRICT** (Par défaut)
**Comportement** : Bloque l'opération si des enregistrements dépendants existent.

**Exemple** :
```sql
FOREIGN KEY (id_editeur) REFERENCES EDITEUR(id_editeur) 
    ON DELETE RESTRICT
```

**Scénario** :
```sql
-- Tentative de suppression d'un éditeur
DELETE FROM EDITEUR WHERE id_editeur = 1;

-- ❌ ERREUR : "FOREIGN KEY constraint failed"
-- Car des livres référencent cet éditeur
```

**Utilisation** : Protéger les données importantes (éditeurs, auteurs).

---

### 2. **CASCADE** (Propagation)
**Comportement** : Propage automatiquement l'opération aux enregistrements dépendants.

**Exemple** :
```sql
FOREIGN KEY (id_livre) REFERENCES LIVRE(id_livre) 
    ON DELETE CASCADE
```

**Scénario DELETE CASCADE** :
```sql
-- Suppression d'un livre
DELETE FROM LIVRE WHERE id_livre = 5;

-- ✅ Supprime automatiquement toutes les participations liées
-- Équivalent automatique de :
DELETE FROM PARTICIPATION WHERE id_livre = 5;
DELETE FROM LIVRE WHERE id_livre = 5;
```

**Scénario UPDATE CASCADE** :
```sql
-- Mise à jour de l'ID d'un éditeur (rare mais possible)
UPDATE EDITEUR SET id_editeur = 999 WHERE id_editeur = 1;

-- ✅ Met à jour automatiquement tous les livres liés
-- Équivalent automatique de :
UPDATE LIVRE SET id_editeur = 999 WHERE id_editeur = 1;
UPDATE EDITEUR SET id_editeur = 999 WHERE id_editeur = 1;
```

**Utilisation** : Relations parent-enfant où l'enfant n'a pas de sens sans le parent.

---

### 3. **SET NULL**
**Comportement** : Met à NULL la clé étrangère dans les enregistrements dépendants.

**Exemple** :
```sql
FOREIGN KEY (id_editeur) REFERENCES EDITEUR(id_editeur) 
    ON DELETE SET NULL
```

**Scénario** :
```sql
-- Suppression d'un éditeur
DELETE FROM EDITEUR WHERE id_editeur = 2;

-- ✅ Les livres de cet éditeur ont maintenant id_editeur = NULL
UPDATE LIVRE SET id_editeur = NULL WHERE id_editeur = 2;
```

**⚠️ Attention** : La colonne doit accepter NULL.

**Utilisation** : Données optionnelles ou historisation.

---

### 4. **SET DEFAULT**
**Comportement** : Assigne une valeur par défaut à la clé étrangère.

**Exemple** :
```sql
id_editeur INTEGER DEFAULT 0,
FOREIGN KEY (id_editeur) REFERENCES EDITEUR(id_editeur) 
    ON DELETE SET DEFAULT
```

**Scénario** :
```sql
-- Suppression d'un éditeur
DELETE FROM EDITEUR WHERE id_editeur = 3;

-- ✅ Les livres sont réassignés à l'éditeur par défaut (id = 0)
```

**Utilisation** : Rarement utilisé, nécessite un enregistrement par défaut.

---

### 5. **NO ACTION**
**Comportement** : Identique à RESTRICT dans SQLite (vérifie à la fin de la transaction).

---

## 📊 Choix dans Notre Projet

### Table LIVRE → EDITEUR

```sql
FOREIGN KEY (id_editeur) REFERENCES EDITEUR(id_editeur) 
    ON DELETE RESTRICT 
    ON UPDATE CASCADE
```

**Justification** :
- **ON DELETE RESTRICT** : Un livre ne peut pas exister sans éditeur
  - Empêche la suppression accidentelle d'un éditeur ayant des livres
  - Force l'administrateur à réassigner ou supprimer les livres d'abord
  
- **ON UPDATE CASCADE** : Si l'ID d'un éditeur change (migration, refonte), propage automatiquement

**Scénario réel** :
```sql
-- ❌ Impossible de supprimer l'éditeur
DELETE FROM EDITEUR WHERE id_editeur = 1;
-- Erreur : Des livres sont liés

-- ✅ Procédure correcte :
-- 1. Réassigner les livres
UPDATE LIVRE SET id_editeur = 2 WHERE id_editeur = 1;
-- 2. Puis supprimer l'éditeur
DELETE FROM EDITEUR WHERE id_editeur = 1;
```

---

### Table PARTICIPATION → AUTEUR

```sql
FOREIGN KEY (id_auteur) REFERENCES AUTEUR(id_auteur) 
    ON DELETE RESTRICT 
    ON UPDATE CASCADE
```

**Justification** :
- **ON DELETE RESTRICT** : Un auteur ayant des participations ne peut être supprimé
  - Protège l'historique des contributions
  - Évite la perte de données de redevances
  
- **ON UPDATE CASCADE** : Propagation automatique si l'ID change

---

### Table PARTICIPATION → LIVRE

```sql
FOREIGN KEY (id_livre) REFERENCES LIVRE(id_livre) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
```

**Justification** :
- **ON DELETE CASCADE** : Si un livre est retiré du catalogue, ses participations n'ont plus de sens
  - Suppression automatique pour maintenir la cohérence
  - Les participations sont dépendantes du livre (relation parent-enfant stricte)
  
- **ON UPDATE CASCADE** : Propagation automatique si l'ID change

**Scénario réel** :
```sql
-- Retrait d'un livre du catalogue
DELETE FROM LIVRE WHERE id_livre = 3;

-- ✅ Supprime automatiquement :
-- - Toutes les participations d'auteurs sur ce livre
-- - Le livre lui-même
-- Résultat : Base cohérente, pas d'orphelins
```

---

## 🔄 Comparaison des Stratégies

| Situation | RESTRICT | CASCADE | SET NULL | Usage |
|-----------|----------|---------|----------|-------|
| **Éditeur → Livre** | ✅ | ❌ | ⚠️ | Protection : un livre a besoin d'un éditeur |
| **Auteur → Participation** | ✅ | ❌ | ❌ | Protection : historique des contributions |
| **Livre → Participation** | ❌ | ✅ | ❌ | Nettoyage : les participations suivent le livre |
| **Pays → Utilisateur** | ❌ | ❌ | ✅ | Donnée optionnelle |

---

## 🧪 Tests Pratiques

### Test 1 : RESTRICT bloque la suppression

```sql
-- Tentative de suppression d'un éditeur avec livres
DELETE FROM EDITEUR WHERE id_editeur = 1;
```

**Résultat attendu** :
```
✗ Error: FOREIGN KEY constraint failed
```

---

### Test 2 : CASCADE propage la suppression

```sql
-- Suppression d'un livre
DELETE FROM LIVRE WHERE id_livre = 3;

-- Vérification
SELECT COUNT(*) FROM PARTICIPATION WHERE id_livre = 3;
-- Résultat : 0 (participations supprimées automatiquement)
```

---

### Test 3 : UPDATE CASCADE propage la modification

```sql
-- Changement d'ID d'un éditeur (rare mais possible)
UPDATE EDITEUR SET id_editeur = 999 WHERE id_editeur = 1;

-- Vérification
SELECT id_editeur FROM LIVRE WHERE id_livre = 1;
-- Résultat : 999 (mis à jour automatiquement)
```

---

## 💡 Bonnes Pratiques

### ✅ À FAIRE

1. **Utiliser RESTRICT** pour les entités maîtres (référentiels)
   ```sql
   -- Éditeurs, catégories, pays, etc.
   ON DELETE RESTRICT
   ```

2. **Utiliser CASCADE** pour les relations de composition stricte
   ```sql
   -- Commande → Lignes de commande
   -- Livre → Participations
   ON DELETE CASCADE
   ```

3. **Toujours utiliser UPDATE CASCADE** (sauf cas particulier)
   ```sql
   -- Facilite les migrations et refontes
   ON UPDATE CASCADE
   ```

### ❌ À ÉVITER

1. **CASCADE sur des entités maîtres**
   ```sql
   -- ❌ Dangereux : supprimer un auteur supprime tous ses livres
   FOREIGN KEY (id_auteur) REFERENCES AUTEUR(id_auteur) ON DELETE CASCADE
   ```

2. **RESTRICT sur des détails triviaux**
   ```sql
   -- ❌ Trop contraignant : impossible de supprimer un produit avec logs
   FOREIGN KEY (id_produit) REFERENCES PRODUIT(id_produit) ON DELETE RESTRICT
   ```

3. **SET NULL sur des colonnes NOT NULL**
   ```sql
   -- ❌ Erreur SQL
   id_editeur INTEGER NOT NULL,
   FOREIGN KEY (id_editeur) REFERENCES EDITEUR(id_editeur) ON DELETE SET NULL
   ```

---

## 📖 Résumé Mnémotechnique

**RESTRICT** = 🛡️ Protection (ne touche à rien)  
**CASCADE** = 🌊 Propagation (effet domino)  
**SET NULL** = 🚫 Déconnexion (met à NULL)  
**SET DEFAULT** = 🔄 Réassignation (valeur par défaut)  

---

## 🎓 Exercice Pratique

Teste ces commandes dans ta base :

```bash
cd c:\Users\Fares\Modelisation1\solution
sqlite3 database.db
```

```sql
-- Test RESTRICT
DELETE FROM EDITEUR WHERE id_editeur = 1;
-- Doit échouer

-- Test CASCADE
DELETE FROM LIVRE WHERE id_livre = 5;
SELECT * FROM PARTICIPATION WHERE id_livre = 5;
-- Doit être vide

-- Test UPDATE CASCADE
UPDATE LIVRE SET id_livre = 999 WHERE id_livre = 1;
SELECT * FROM PARTICIPATION WHERE id_livre = 999;
-- Doit montrer les participations mises à jour
```

---

**Date** : 2025-12-05  
**Version** : 1.0  
**Projet** : Système de Redevances d'Édition
