-- ============================================================================
-- SCHEMA DE BASE DE DONNÉES - SYSTÈME DE REDEVANCES D'ÉDITION
-- ============================================================================
-- Version SQLite 3.x
-- Encodage: UTF-8
-- Date: 2025-12-05
-- ============================================================================

-- Activation des clés étrangères (nécessaire pour SQLite)
PRAGMA foreign_keys = ON;

-- ============================================================================
-- TABLE: AUTEUR
-- Description: Stocke les informations des auteurs
-- ============================================================================

CREATE TABLE IF NOT EXISTS AUTEUR (
    id_auteur INTEGER PRIMARY KEY AUTOINCREMENT,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telephone VARCHAR(20),
    adresse TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Contraintes de validation
    CHECK (LENGTH(nom) >= 2),
    CHECK (LENGTH(prenom) >= 2),
    CHECK (email LIKE '%_@_%._%')
);

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_auteur_nom ON AUTEUR(nom, prenom);
CREATE INDEX IF NOT EXISTS idx_auteur_email ON AUTEUR(email);

-- ============================================================================
-- TABLE: EDITEUR
-- Description: Stocke les informations des maisons d'édition
-- ============================================================================

CREATE TABLE IF NOT EXISTS EDITEUR (
    id_editeur INTEGER PRIMARY KEY AUTOINCREMENT,
    nom_editeur VARCHAR(200) NOT NULL,
    adresse TEXT,
    telephone VARCHAR(20),
    email VARCHAR(255) NOT NULL UNIQUE,
    siret VARCHAR(14) NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Contraintes de validation
    CHECK (LENGTH(nom_editeur) >= 2),
    CHECK (LENGTH(siret) = 14),
    CHECK (email LIKE '%_@_%._%')
);

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_editeur_nom ON EDITEUR(nom_editeur);
CREATE INDEX IF NOT EXISTS idx_editeur_siret ON EDITEUR(siret);

-- ============================================================================
-- TABLE: LIVRE
-- Description: Stocke les informations des livres publiés
-- ============================================================================

CREATE TABLE IF NOT EXISTS LIVRE (
    id_livre INTEGER PRIMARY KEY AUTOINCREMENT,
    isbn VARCHAR(17) NOT NULL UNIQUE,
    titre VARCHAR(300) NOT NULL,
    date_publication DATE NOT NULL,
    prix_vente DECIMAL(10,2) NOT NULL,
    nombre_pages INTEGER NOT NULL,
    genre VARCHAR(100),
    id_editeur INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Clé étrangère
    -- ON DELETE RESTRICT : Empêche la suppression d'un éditeur si des livres y sont liés
    -- ON UPDATE CASCADE : Si l'id_editeur change, met à jour automatiquement dans LIVRE
    FOREIGN KEY (id_editeur) REFERENCES EDITEUR(id_editeur) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    
    -- Contraintes de validation
    CHECK (LENGTH(titre) >= 1),
    CHECK (prix_vente > 0),
    CHECK (nombre_pages > 0),
    CHECK (LENGTH(isbn) >= 10 AND LENGTH(isbn) <= 17)
);

-- Index pour optimiser les recherches et jointures
CREATE INDEX IF NOT EXISTS idx_livre_isbn ON LIVRE(isbn);
CREATE INDEX IF NOT EXISTS idx_livre_titre ON LIVRE(titre);
CREATE INDEX IF NOT EXISTS idx_livre_editeur ON LIVRE(id_editeur);
CREATE INDEX IF NOT EXISTS idx_livre_date_publication ON LIVRE(date_publication);
CREATE INDEX IF NOT EXISTS idx_livre_genre ON LIVRE(genre);

-- ============================================================================
-- TABLE: PARTICIPATION
-- Description: Table d'association entre auteurs et livres avec droits
-- ============================================================================

CREATE TABLE IF NOT EXISTS PARTICIPATION (
    id_participation INTEGER PRIMARY KEY AUTOINCREMENT,
    id_auteur INTEGER NOT NULL,
    id_livre INTEGER NOT NULL,
    pourcentage_redevance DECIMAL(5,2) NOT NULL,
    role VARCHAR(100) NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Clés étrangères
    -- ON DELETE RESTRICT : Empêche la suppression d'un auteur si des participations existent
    -- ON UPDATE CASCADE : Si l'id_auteur change, propage le changement automatiquement
    FOREIGN KEY (id_auteur) REFERENCES AUTEUR(id_auteur) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    -- ON DELETE CASCADE : Si un livre est supprimé, supprime automatiquement ses participations
    -- ON UPDATE CASCADE : Si l'id_livre change, propage le changement automatiquement
    FOREIGN KEY (id_livre) REFERENCES LIVRE(id_livre) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    
    -- Contraintes de validation
    CHECK (pourcentage_redevance >= 0 AND pourcentage_redevance <= 100),
    CHECK (role IN ('auteur principal', 'co-auteur', 'traducteur', 'illustrateur', 'préfacier')),
    CHECK (date_fin IS NULL OR date_fin >= date_debut),
    
    -- Contrainte d'unicité: un auteur ne peut avoir qu'un seul rôle par livre
    UNIQUE (id_auteur, id_livre, role)
);

-- Index pour optimiser les jointures et recherches
CREATE INDEX IF NOT EXISTS idx_participation_auteur ON PARTICIPATION(id_auteur);
CREATE INDEX IF NOT EXISTS idx_participation_livre ON PARTICIPATION(id_livre);
CREATE INDEX IF NOT EXISTS idx_participation_dates ON PARTICIPATION(date_debut, date_fin);
CREATE INDEX IF NOT EXISTS idx_participation_role ON PARTICIPATION(role);

-- ============================================================================
-- TRIGGER: Validation de la somme des pourcentages par livre
-- Description: S'assure que la somme des pourcentages ne dépasse pas 100%
-- ============================================================================

CREATE TRIGGER IF NOT EXISTS trg_check_total_pourcentage_insert
BEFORE INSERT ON PARTICIPATION
FOR EACH ROW
BEGIN
    SELECT CASE
        WHEN (
            SELECT COALESCE(SUM(pourcentage_redevance), 0) 
            FROM PARTICIPATION 
            WHERE id_livre = NEW.id_livre
        ) + NEW.pourcentage_redevance > 100
        THEN RAISE(ABORT, 'La somme des pourcentages de redevance pour ce livre dépasse 100%')
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_check_total_pourcentage_update
BEFORE UPDATE ON PARTICIPATION
FOR EACH ROW
BEGIN
    SELECT CASE
        WHEN (
            SELECT COALESCE(SUM(pourcentage_redevance), 0) 
            FROM PARTICIPATION 
            WHERE id_livre = NEW.id_livre 
            AND id_participation != NEW.id_participation
        ) + NEW.pourcentage_redevance > 100
        THEN RAISE(ABORT, 'La somme des pourcentages de redevance pour ce livre dépasse 100%')
    END;
END;

-- ============================================================================
-- TRIGGER: Validation des dates (remplace CHECK avec DATE('now'))
-- Description: SQLite n'accepte pas les fonctions non-déterministes dans CHECK
--              Ces triggers remplacent les contraintes CHECK pour les dates
-- ============================================================================

CREATE TRIGGER IF NOT EXISTS trg_check_date_publication_insert
BEFORE INSERT ON LIVRE
FOR EACH ROW
BEGIN
    SELECT CASE
        WHEN NEW.date_publication > DATE('now')
        THEN RAISE(ABORT, 'La date de publication ne peut pas être dans le futur')
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_check_date_publication_update
BEFORE UPDATE OF date_publication ON LIVRE
FOR EACH ROW
BEGIN
    SELECT CASE
        WHEN NEW.date_publication > DATE('now')
        THEN RAISE(ABORT, 'La date de publication ne peut pas être dans le futur')
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_check_date_debut_insert
BEFORE INSERT ON PARTICIPATION
FOR EACH ROW
BEGIN
    SELECT CASE
        WHEN NEW.date_debut > DATE('now')
        THEN RAISE(ABORT, 'La date de début de collaboration ne peut pas être dans le futur')
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_check_date_debut_update
BEFORE UPDATE OF date_debut ON PARTICIPATION
FOR EACH ROW
BEGIN
    SELECT CASE
        WHEN NEW.date_debut > DATE('now')
        THEN RAISE(ABORT, 'La date de début de collaboration ne peut pas être dans le futur')
    END;
END;

-- ============================================================================
-- TRIGGER: Mise à jour automatique du champ updated_at
-- ============================================================================

CREATE TRIGGER IF NOT EXISTS trg_auteur_updated_at
AFTER UPDATE ON AUTEUR
FOR EACH ROW
BEGIN
    UPDATE AUTEUR SET updated_at = CURRENT_TIMESTAMP 
    WHERE id_auteur = NEW.id_auteur;
END;

CREATE TRIGGER IF NOT EXISTS trg_editeur_updated_at
AFTER UPDATE ON EDITEUR
FOR EACH ROW
BEGIN
    UPDATE EDITEUR SET updated_at = CURRENT_TIMESTAMP 
    WHERE id_editeur = NEW.id_editeur;
END;

CREATE TRIGGER IF NOT EXISTS trg_livre_updated_at
AFTER UPDATE ON LIVRE
FOR EACH ROW
BEGIN
    UPDATE LIVRE SET updated_at = CURRENT_TIMESTAMP 
    WHERE id_livre = NEW.id_livre;
END;

CREATE TRIGGER IF NOT EXISTS trg_participation_updated_at
AFTER UPDATE ON PARTICIPATION
FOR EACH ROW
BEGIN
    UPDATE PARTICIPATION SET updated_at = CURRENT_TIMESTAMP 
    WHERE id_participation = NEW.id_participation;
END;

-- ============================================================================
-- VÉRIFICATION DE L'INTÉGRITÉ DU SCHÉMA
-- ============================================================================

-- Affichage des tables créées
SELECT '✓ Schéma créé avec succès!' as message;
SELECT name as table_name FROM sqlite_master WHERE type='table' ORDER BY name;
