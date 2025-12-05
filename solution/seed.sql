-- ============================================================================
-- DONNÉES D'EXEMPLE - SYSTÈME DE REDEVANCES D'ÉDITION
-- ============================================================================
-- Ce fichier contient des données de test réalistes pour valider le schéma
-- ============================================================================

-- ============================================================================
-- INSERTION DES ÉDITEURS
-- ============================================================================

INSERT INTO EDITEUR (nom_editeur, adresse, telephone, email, siret) VALUES
('Éditions Gallimard', '5 rue Gaston Gallimard, 75007 Paris', '0149544200', 'contact@gallimard.fr', '55204282800212'),
('Hachette Livre', '58 rue Jean Bleuzen, 92170 Vanves', '0143926000', 'info@hachette.fr', '35421485700014'),
('Le Seuil', '92 avenue de France, 75013 Paris', '0140468450', 'contact@seuil.com', '32227641500036');

-- ============================================================================
-- INSERTION DES AUTEURS
-- ============================================================================

INSERT INTO AUTEUR (nom, prenom, email, telephone, adresse) VALUES
('Leroy', 'Sophie', 'sophie.leroy@email.fr', '0612345678', '12 rue de la Paix, 75002 Paris'),
('Martin', 'Jean', 'jean.martin@email.fr', '0623456789', '45 avenue Victor Hugo, 69003 Lyon'),
('Dubois', 'Marie', 'marie.dubois@email.fr', '0634567890', '78 boulevard de la Liberté, 59000 Lille'),
('Bernard', 'Pierre', 'pierre.bernard@email.fr', '0645678901', '23 rue du Faubourg, 33000 Bordeaux'),
('Petit', 'Claire', 'claire.petit@email.fr', '0656789012', '56 cours Mirabeau, 13100 Aix-en-Provence');

-- ============================================================================
-- INSERTION DES LIVRES
-- ============================================================================

INSERT INTO LIVRE (isbn, titre, date_publication, prix_vente, nombre_pages, genre, id_editeur) VALUES
('978-2-07-012345-6', 'Les Mystères de Paris', '2023-03-15', 22.50, 384, 'Roman policier', 1),
('978-2-01-234567-8', 'Histoire de France Contemporaine', '2022-09-20', 35.00, 612, 'Histoire', 2),
('978-2-02-345678-9', 'Le Guide du Développeur Python', '2023-11-10', 42.00, 528, 'Informatique', 3),
('978-2-07-456789-0', 'Nouvelles du Siècle', '2024-01-25', 18.90, 256, 'Nouvelles', 1),
('978-2-01-567890-1', 'L''Art de la Négociation', '2023-06-12', 28.50, 320, 'Développement personnel', 2);

-- ============================================================================
-- INSERTION DES PARTICIPATIONS
-- ============================================================================

-- Livre 1: Les Mystères de Paris (Sophie Leroy - auteur unique)
INSERT INTO PARTICIPATION (id_auteur, id_livre, pourcentage_redevance, role, date_debut, date_fin) VALUES
(1, 1, 100.00, 'auteur principal', '2022-01-10', NULL);

-- Livre 2: Histoire de France Contemporaine (Jean Martin et Marie Dubois en co-auteurs)
INSERT INTO PARTICIPATION (id_auteur, id_livre, pourcentage_redevance, role, date_debut, date_fin) VALUES
(2, 2, 60.00, 'auteur principal', '2021-03-01', NULL),
(3, 2, 40.00, 'co-auteur', '2021-06-15', NULL);

-- Livre 3: Le Guide du Développeur Python (Pierre Bernard auteur, Claire Petit traductrice)
INSERT INTO PARTICIPATION (id_auteur, id_livre, pourcentage_redevance, role, date_debut, date_fin) VALUES
(4, 3, 85.00, 'auteur principal', '2022-08-20', NULL),
(5, 3, 15.00, 'traducteur', '2023-05-10', NULL);

-- Livre 4: Nouvelles du Siècle (Plusieurs auteurs)
INSERT INTO PARTICIPATION (id_auteur, id_livre, pourcentage_redevance, role, date_debut, date_fin) VALUES
(1, 4, 50.00, 'auteur principal', '2023-04-01', NULL),
(2, 4, 30.00, 'co-auteur', '2023-04-01', NULL),
(3, 4, 20.00, 'co-auteur', '2023-04-01', NULL);

-- Livre 5: L'Art de la Négociation (Marie Dubois auteur, Pierre Bernard préfacier)
INSERT INTO PARTICIPATION (id_auteur, id_livre, pourcentage_redevance, role, date_debut, date_fin) VALUES
(3, 5, 95.00, 'auteur principal', '2022-11-15', NULL),
(4, 5, 5.00, 'préfacier', '2023-02-20', NULL);

-- ============================================================================
-- VÉRIFICATION DES DONNÉES INSÉRÉES
-- ============================================================================

SELECT '✓ Données insérées avec succès!' as message;

SELECT '--- STATISTIQUES ---' as section;
SELECT 'Éditeurs: ' || COUNT(*) as count FROM EDITEUR;
SELECT 'Auteurs: ' || COUNT(*) as count FROM AUTEUR;
SELECT 'Livres: ' || COUNT(*) as count FROM LIVRE;
SELECT 'Participations: ' || COUNT(*) as count FROM PARTICIPATION;

-- ============================================================================
-- VÉRIFICATION DE L'INTÉGRITÉ DES POURCENTAGES
-- ============================================================================

SELECT '--- VÉRIFICATION DES POURCENTAGES PAR LIVRE ---' as section;
SELECT 
    l.titre as livre,
    SUM(p.pourcentage_redevance) as total_pourcentage
FROM LIVRE l
LEFT JOIN PARTICIPATION p ON l.id_livre = p.id_livre
GROUP BY l.id_livre, l.titre
ORDER BY l.id_livre;

-- ============================================================================
-- VÉRIFICATION DES LIVRES SANS AUTEUR (ORPHELINS)
-- ============================================================================

SELECT '--- VÉRIFICATION DES LIVRES ORPHELINS ---' as section;
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✓ Tous les livres ont au moins un auteur'
        ELSE '⚠ ' || COUNT(*) || ' livre(s) sans auteur détecté(s)'
    END as statut_orphelins
FROM LIVRE l
LEFT JOIN PARTICIPATION p ON l.id_livre = p.id_livre
WHERE p.id_participation IS NULL;

-- Liste des livres orphelins (si applicable)
SELECT 
    l.id_livre,
    l.titre,
    l.isbn,
    e.nom_editeur
FROM LIVRE l
INNER JOIN EDITEUR e ON l.id_editeur = e.id_editeur
LEFT JOIN PARTICIPATION p ON l.id_livre = p.id_livre
WHERE p.id_participation IS NULL;
