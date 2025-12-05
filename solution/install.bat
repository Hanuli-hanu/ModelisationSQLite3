@echo off
REM ============================================================================
REM SCRIPT D'INSTALLATION SQLITE3 POUR WINDOWS
REM ============================================================================
echo ========================================
echo Installation de SQLite3 pour Windows
echo ========================================
echo.

REM Vérification si SQLite3 est déjà installé
where sqlite3 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] SQLite3 est deja installe!
    sqlite3 --version
    goto :init_db
)

echo [INFO] SQLite3 n'est pas installe.
echo.
echo Options d'installation:
echo.
echo 1. Via Chocolatey (recommande)
echo    Executer dans PowerShell (Admin):
echo    choco install sqlite
echo.
echo 2. Via Scoop
echo    Executer dans PowerShell:
echo    scoop install sqlite
echo.
echo 3. Telechargement manuel
echo    1. Aller sur: https://www.sqlite.org/download.html
echo    2. Telecharger "sqlite-tools-win32-x86-*.zip"
echo    3. Extraire dans C:\sqlite\
echo    4. Ajouter C:\sqlite\ au PATH systeme
echo.
echo Appuyez sur une touche apres l'installation...
pause >nul

REM Revérification
where sqlite3 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] SQLite3 n'a pas ete trouve. Veuillez l'installer manuellement.
    pause
    exit /b 1
)

:init_db
echo.
echo ========================================
echo Initialisation de la base de donnees
echo ========================================
echo.

REM Création de la base de données
echo [1/4] Creation du schema...
sqlite3 database.db < schema.sql
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Echec de la creation du schema
    pause
    exit /b 1
)
echo [OK] Schema cree avec succes

echo [2/4] Insertion des donnees d'exemple...
sqlite3 database.db < seed.sql
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Echec de l'insertion des donnees
    pause
    exit /b 1
)
echo [OK] Donnees inserees avec succes

echo [3/4] Creation des vues...
sqlite3 database.db < vues.sql
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Echec de la creation des vues
    pause
    exit /b 1
)
echo [OK] Vues creees avec succes

echo [4/4] Execution des tests de validation...
sqlite3 database.db < tests.sql
if %ERRORLEVEL% NEQ 0 (
    echo [AVERTISSEMENT] Certains tests ont echoue
)

echo.
echo ========================================
echo Installation terminee avec succes!
echo ========================================
echo.
echo Base de donnees: database.db
echo.
echo Commandes utiles:
echo   sqlite3 database.db              - Ouvrir en mode interactif
echo   sqlite3 database.db "SELECT * FROM vue_administrateur;"
echo   sqlite3 database.db ".tables"    - Lister les tables
echo   sqlite3 database.db ".schema"    - Voir le schema complet
echo.
pause
