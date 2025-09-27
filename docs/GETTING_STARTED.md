# Guide de Démarrage - FADJMA

## Introduction

Ce guide vous accompagne pas à pas pour configurer et lancer l'application FADJMA en local.

## Prérequis Système

### Logiciels Requis

```bash
# Node.js (version 18 ou supérieure)
node --version  # doit afficher v18.x.x ou plus

# npm (généralement installé avec Node.js)
npm --version   # doit afficher 9.x.x ou plus

# Git pour le versioning
git --version

# PostgreSQL (optionnel, SQLite par défaut)
psql --version  # si vous voulez utiliser PostgreSQL
```

### Installation des Prérequis

#### Sur macOS
```bash
# Installer Node.js via Homebrew
brew install node

# Ou télécharger depuis https://nodejs.org/

# PostgreSQL (optionnel)
brew install postgresql
brew services start postgresql
```

#### Sur Ubuntu/Debian
```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL (optionnel)
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Sur Windows
```bash
# Télécharger Node.js depuis https://nodejs.org/
# Installer PostgreSQL depuis https://www.postgresql.org/download/windows/
```

## Installation du Projet

### 1. Cloner le Repository

```bash
# Cloner le projet
git clone [URL_DU_REPOSITORY]
cd fadjma

# Vérifier la structure
ls -la
# Vous devriez voir : backend/ frontend/ docs/ README.md
```

### 2. Configuration Backend

```bash
cd backend

# Installer les dépendances
npm install

# Créer le fichier de configuration
cp .env.example .env

# Éditer le fichier .env avec vos paramètres
nano .env  # ou votre éditeur préféré
```

#### Configuration de la Base de Données

**Option A : SQLite (Recommandé pour le développement)**
```bash
# Initialiser SQLite avec données de test
npm run init:sqlite
```

**Option B : PostgreSQL (Production)**
```bash
# Créer une base de données
createdb fadjma_dev

# Mettre à jour .env
DATABASE_URL=postgresql://username:password@localhost:5432/fadjma_dev

# Synchroniser la base
npm run setup:db
```

#### Variables d'Environnement Essentielles

```env
# .env
NODE_ENV=development
PORT=3001

# Base de données
DB_HOST=localhost
DB_NAME=fadjma_dev
DB_USER=your_username
DB_PASS=your_password

# JWT (générer une clé sécurisée)
JWT_SECRET=your-super-secret-jwt-key-very-long-and-secure

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Hedera (optionnel pour le développement)
HEDERA_NETWORK=testnet
HEDERA_ACCOUNT_ID=your-account-id
HEDERA_PRIVATE_KEY=your-private-key
```

#### Générer des Clés Sécurisées

```bash
# Générer JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Générer ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Démarrage Backend

```bash
# Démarrage en mode développement
npm run dev

# Ou en mode production
npm start

# Vérifier que le serveur fonctionne
curl http://localhost:3001/health
# Devrait retourner : {"status":"OK","timestamp":"..."}
```

### 4. Configuration Frontend

```bash
# Nouveau terminal
cd ../frontend

# Installer les dépendances
npm install

# Créer le fichier de configuration (optionnel)
# Le frontend utilise des variables par défaut
```

#### Variables d'Environnement Frontend (optionnel)

```env
# frontend/.env (optionnel)
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WEBSOCKET_URL=http://localhost:3001
```

### 5. Démarrage Frontend

```bash
# Démarrage en mode développement
npm start

# L'application s'ouvre automatiquement sur http://localhost:3000
```

## Vérification de l'Installation

### 1. Accès à l'Application

Ouvrez votre navigateur et accédez à :
- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:3001

### 2. Test avec Comptes de Démonstration

L'application inclut des comptes de test préchargés :

#### Patients
```
Email: jean.dupont@demo.com
Mot de passe: Demo2024!

Email: fatou.sall@demo.com
Mot de passe: Demo2024!
```

#### Médecins
```
Email: dr.martin@fadjma.com
Mot de passe: Demo2024!

Email: dr.diop@fadjma.com
Mot de passe: Demo2024!
```

#### Pharmacie
```
Email: pharmacie.centrale@fadjma.com
Mot de passe: Demo2024!
```

#### Administrateur
```
Email: admin@fadjma.com
Mot de passe: Admin2024!
```

### 3. Test des Fonctionnalités Principales

#### Workflow Médecin → Patient
1. **Connexion médecin** avec dr.martin@fadjma.com
2. **Créer un profil patient** via "Nouveau dossier" → "Créer un profil patient"
3. **Noter l'identifiant patient** généré (format PAT-YYYYMMDD-XXXX)
4. **Se déconnecter** et aller sur "Lier mon identifiant"
5. **Saisir l'identifiant** et créer un compte patient
6. **Se connecter** avec les nouveaux identifiants

#### Test de l'API
```bash
# Health check
curl http://localhost:3001/health

# Login test
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dr.martin@fadjma.com","password":"Demo2024!"}'

# Devrait retourner un token JWT
```

## Scripts Disponibles

### Backend
```bash
npm start           # Démarrage production
npm run dev         # Démarrage développement (avec nodemon)
npm test            # Exécuter les tests
npm run test:coverage # Tests avec couverture
npm run seed        # Charger les données de test
npm run seed:clean  # Nettoyer la base de données
npm run init:sqlite # Initialiser SQLite avec données
```

### Frontend
```bash
npm start           # Démarrage développement
npm run build       # Build de production
npm test            # Exécuter les tests (si configurés)
npm run eject       # Ejecter la configuration CRA (non recommandé)
```

## Résolution des Problèmes Courants

### Erreur de Port Déjà Utilisé

```bash
# Vérifier quel processus utilise le port
lsof -i :3001  # pour le backend
lsof -i :3000  # pour le frontend

# Tuer le processus
kill -9 [PID]

# Ou changer le port
PORT=3002 npm start
```

### Erreur de Base de Données

```bash
# SQLite : Supprimer et recréer
rm backend/database.sqlite
npm run init:sqlite

# PostgreSQL : Vérifier la connexion
psql -U your_username -d fadjma_dev -c "SELECT version();"
```

### Erreurs de Dépendances

```bash
# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install

# Ou forcer la réinstallation
npm ci
```

### Problèmes de CORS

Vérifiez que `FRONTEND_URL` dans le backend .env correspond à l'URL du frontend.

### Erreurs JWT

```bash
# Générer une nouvelle clé JWT
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Mettre à jour JWT_SECRET dans .env
```

## Configuration Avancée

### Base de Données PostgreSQL

```bash
# Créer un utilisateur dédié
sudo -u postgres createuser --interactive fadjma_user
sudo -u postgres createdb -O fadjma_user fadjma_dev

# Configuration .env
DB_HOST=localhost
DB_NAME=fadjma_dev
DB_USER=fadjma_user
DB_PASS=secure_password
```

### HTTPS en Développement

```bash
# Générer des certificats auto-signés
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Configurer le frontend pour HTTPS
HTTPS=true npm start
```

### Variables d'Environnement Complètes

```env
# Backend .env complet
NODE_ENV=development
PORT=3001

# Base de données
DB_HOST=localhost
DB_NAME=fadjma_dev
DB_USER=fadjma_user
DB_PASS=secure_password

# Sécurité
JWT_SECRET=your-64-char-jwt-secret
ENCRYPTION_KEY=your-32-char-encryption-key
SESSION_SECRET=your-session-secret

# CORS
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Hedera (optionnel)
HEDERA_NETWORK=testnet
HEDERA_ACCOUNT_ID=0.0.123456
HEDERA_PRIVATE_KEY=302e020100300506032b657004220420...

# Logging
LOG_LEVEL=debug
```

## Prochaines Étapes

Après avoir configuré avec succès l'environnement de développement :

1. **Explorer l'interface** avec les comptes de démonstration
2. **Consulter la documentation** spécifique :
   - [Architecture](./ARCHITECTURE.md) pour comprendre la structure
   - [Backend API](./backend/API_REFERENCE.md) pour l'API
   - [Frontend Components](./frontend/COMPONENTS.md) pour l'interface
3. **Tester les fonctionnalités** principales
4. **Lire les guides de développement** pour contribuer

## Aide et Support

### Logs et Debugging

```bash
# Backend logs
npm run dev  # Les logs s'affichent en temps réel

# Vérifier les erreurs
tail -f logs/error.log  # si configuré

# Frontend debugging
# Ouvrir les outils développeur du navigateur (F12)
# Consulter la console pour les erreurs
```

### Ressources Utiles

- [Documentation Node.js](https://nodejs.org/docs/)
- [Documentation React](https://reactjs.org/docs/)
- [Documentation Express](https://expressjs.com/)
- [Documentation Sequelize](https://sequelize.org/docs/)

### Contacts

Pour les problèmes techniques :
1. Vérifier cette documentation
2. Consulter les fichiers de documentation spécialisés
3. Vérifier les logs d'erreur
4. Tester avec les données de démonstration

---

**Félicitations ! 🎉** Votre environnement FADJMA est maintenant prêt pour le développement.