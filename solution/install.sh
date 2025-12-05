#!/bin/bash
# ============================================================================
# SCRIPT D'INSTALLATION SQLITE3 POUR LINUX/MAC
# ============================================================================

set -e  # Arrêter en cas d'erreur

echo "========================================"
echo "Installation de SQLite3"
echo "========================================"
echo ""

# Vérification si SQLite3 est déjà installé
if command -v sqlite3 &> /dev/null; then
    echo "✓ SQLite3 est déjà installé!"
    sqlite3 --version
else
    echo "⚠ SQLite3 n'est pas installé."
    echo ""
    
    # Détection du système d'exploitation
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "Détection: Linux"
        echo "Installation via apt-get..."
        sudo apt-get update
        sudo apt-get install -y sqlite3
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "Détection: macOS"
        echo "Installation via Homebrew..."
        if command -v brew &> /dev/null; then
            brew install sqlite3
        else
            echo "⚠ Homebrew n'est pas installé."
            echo "Installer Homebrew: /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            exit 1
        fi
    else
        echo "⚠ Système d'exploitation non supporté: $OSTYPE"
        exit 1
    fi
    
    # Vérification de l'installation
    if command -v sqlite3 &> /dev/null; then
        echo "✓ SQLite3 installé avec succès!"
        sqlite3 --version
    else
        echo "✗ Échec de l'installation de SQLite3"
        exit 1
    fi
fi

echo ""
echo "========================================"
echo "Initialisation de la base de données"
echo "========================================"
echo ""

# Suppression de l'ancienne base si elle existe
if [ -f "database.db" ]; then
    echo "⚠ Une base de données existe déjà."
    read -p "Voulez-vous la supprimer et recréer? (o/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Oo]$ ]]; then
        rm database.db
        echo "✓ Ancienne base supprimée"
    else
        echo "✓ Conservation de la base existante"
        exit 0
    fi
fi

# Création de la base de données
echo "[1/4] Création du schéma..."
sqlite3 database.db < schema.sql
echo "✓ Schéma créé avec succès"

echo "[2/4] Insertion des données d'exemple..."
sqlite3 database.db < seed.sql
echo "✓ Données insérées avec succès"

echo "[3/4] Création des vues..."
sqlite3 database.db < vues.sql
echo "✓ Vues créées avec succès"

echo "[4/4] Exécution des tests de validation..."
sqlite3 database.db < tests.sql

echo ""
echo "========================================"
echo "Installation terminée avec succès!"
echo "========================================"
echo ""
echo "Base de données: database.db"
echo ""
echo "Commandes utiles:"
echo "  sqlite3 database.db              # Ouvrir en mode interactif"
echo "  sqlite3 database.db 'SELECT * FROM vue_administrateur;'"
echo "  sqlite3 database.db '.tables'    # Lister les tables"
echo "  sqlite3 database.db '.schema'    # Voir le schéma complet"
echo ""
