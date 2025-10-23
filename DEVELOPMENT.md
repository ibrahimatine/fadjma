# 🛠️ Guide de Développement FADJMA

Ce guide vous aide à démarrer rapidement l'environnement de développement FADJMA.

---

## 🚀 Démarrage Rapide

### Lancer l'environnement complet

```bash
./start-dev.sh
```

Ce script va :
- ✅ Vérifier Node.js et npm
- ✅ Installer les dépendances si nécessaire
- ✅ Créer les fichiers `.env` depuis `.env.example`
- ✅ Démarrer le backend (port 5000)
- ✅ Démarrer le frontend (port 3000)
- ✅ Créer des fichiers de logs

### Arrêter les services

```bash
# Méthode 1 : Ctrl+C dans le terminal où start-dev.sh tourne
# Méthode 2 : Utiliser le script stop
./stop-dev.sh
```

### Voir les logs en temps réel

```bash
# Les deux services
./logs-dev.sh

# Backend uniquement
./logs-dev.sh backend

# Frontend uniquement
./logs-dev.sh frontend
```

### Vérifier le statut

```bash
./status-dev.sh
```

---

## 📁 Structure des Scripts

```
fadjma/
├── start-dev.sh      # 🚀 Démarre backend + frontend
├── stop-dev.sh       # 🛑 Arrête tout proprement
├── logs-dev.sh       # 📋 Affiche les logs
├── status-dev.sh     # 📊 Vérifie le statut
├── logs/             # 📂 Logs de développement
│   ├── backend-dev.log
│   └── frontend-dev.log
├── .backend.pid      # PID du backend
└── .frontend.pid     # PID du frontend
```

---

## 🌐 URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Interface React |
| **Backend** | http://localhost:5000 | API Express |
| **Health Check** | http://localhost:5000/api/health | Vérification backend |

---

## 🔧 Scripts npm Disponibles

### Backend (backend/)

```bash
npm run dev           # Démarrage avec nodemon (hot reload)
npm start             # Démarrage production
npm test              # Tests Jest
npm run test:watch    # Tests en mode watch
npm run test:coverage # Tests avec couverture
npm run seed          # Seed base de données
```

### Frontend (frontend/)

```bash
npm start             # Démarrage dev (port 3000)
npm run build         # Build production
npm test              # Tests React
```

---

## ⚙️ Configuration

### Backend (.env)

Fichier : `backend/.env`

```env
# Hedera Configuration
HEDERA_ACCOUNT_ID=0.0.6089195
HEDERA_PRIVATE_KEY=your_private_key
HEDERA_TOPIC_ID=0.0.6854064
HEDERA_NETWORK=testnet

# JWT Configuration
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

# Database
DB_TYPE=sqlite
DB_PATH=./database.sqlite

# Server
PORT=5000
NODE_ENV=development
```

### Frontend (.env)

Fichier : `frontend/.env`

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
```

---

## 🐛 Dépannage

### Port déjà utilisé

```bash
# Trouver et tuer le processus sur le port 5000
lsof -ti:5000 | xargs kill -9

# Ou sur le port 3000
lsof -ti:3000 | xargs kill -9
```

### Backend ne démarre pas

1. Vérifier les logs : `tail -f logs/backend-dev.log`
2. Vérifier le fichier `.env`
3. Vérifier que SQLite est accessible
4. Vérifier les credentials Hedera

### Frontend ne démarre pas

1. Vérifier les logs : `tail -f logs/frontend-dev.log`
2. Vérifier que le port 3000 est libre
3. Nettoyer le cache : `cd frontend && rm -rf node_modules package-lock.json && npm install`

### Erreur de connexion Frontend → Backend

1. Vérifier que le backend tourne : `./status-dev.sh`
2. Vérifier l'URL dans `frontend/package.json` : `"proxy": "http://localhost:5000"`
3. Vérifier le CORS dans `backend/server.js`

### Réinstaller les dépendances

```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 🔍 Logs et Monitoring

### Fichiers de logs

- `logs/backend-dev.log` : Tous les logs backend
- `logs/frontend-dev.log` : Tous les logs frontend
- `backend/logs/combined.log` : Logs Winston backend
- `backend/logs/error.log` : Erreurs backend uniquement

### Voir les logs en direct

```bash
# Méthode 1 : Script dédié
./logs-dev.sh backend

# Méthode 2 : tail classique
tail -f logs/backend-dev.log

# Méthode 3 : Avec couleurs (si ccze installé)
tail -f logs/backend-dev.log | ccze -A
```

---

## 🧪 Tests

### Backend

```bash
cd backend

# Tous les tests
npm test

# Tests avec watch mode
npm run test:watch

# Tests avec couverture
npm run test:coverage

# Tests spécifiques
npm run test:unit          # Tests unitaires
npm run test:integration   # Tests d'intégration
npm run test:controllers   # Tests controllers
```

### Frontend

```bash
cd frontend

# Tous les tests
npm test

# Tests avec couverture
npm test -- --coverage
```

---

## 📦 Base de Données

### Réinitialiser la base

```bash
cd backend

# Supprimer la base
rm database.sqlite

# Recréer et seed
npm run init:sqlite
npm run seed:full
```

### Seed avec données de test

```bash
cd backend
npm run seed:full
```

---

## 🔐 Sécurité en Développement

### Variables sensibles

⚠️ **Ne jamais commit** :
- `backend/.env`
- `frontend/.env`
- `database.sqlite`
- `logs/*.log`

### Credentials Hedera

Utilisez des comptes **Testnet** uniquement en développement.

---

## 🚀 Workflow de Développement

### 1. Démarrer la journée

```bash
git pull origin main
./start-dev.sh
```

### 2. Développer

- Modifier le code (hot reload automatique)
- Consulter les logs si besoin
- Tester les fonctionnalités

### 3. Tester

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

### 4. Commit

```bash
git add .
git commit -m "feat: description"
git push
```

### 5. Arrêter

```bash
./stop-dev.sh
# ou Ctrl+C
```

---

## 🎨 Outils Recommandés

### Extensions VSCode

- **ESLint** : Linting JavaScript
- **Prettier** : Formatage de code
- **ES7+ React/Redux** : Snippets React
- **REST Client** : Tester les API
- **SQLite Viewer** : Voir la base de données

### Outils CLI

```bash
# Monitoring logs avec couleurs
sudo apt install ccze

# Voir plusieurs logs en parallèle
sudo apt install multitail

# HTTP requests
sudo apt install httpie

# Monitoring processus
sudo apt install htop
```

---

## 📚 Ressources

### Documentation Projet

- [README.md](README.md) - Vue d'ensemble
- [PLAN_ARCHITECTURE_COMPLET.md](PLAN_ARCHITECTURE_COMPLET.md) - Architecture
- [DEPLOYMENT.md](DEPLOYMENT.md) - Déploiement
- [docs/CAHIER_DES_CHARGES_FADJMA.md](docs/CAHIER_DES_CHARGES_FADJMA.md) - Cahier des charges
- [docs/PLAN_PHASE_1_Q1_2025.md](docs/PLAN_PHASE_1_Q1_2025.md) - Roadmap Phase 1

### Technologies

- [Hedera Hashgraph](https://hedera.com/)
- [React Documentation](https://react.dev/)
- [Express.js](https://expressjs.com/)
- [Sequelize ORM](https://sequelize.org/)

---

## 💡 Tips & Tricks

### Démarrage rapide avec alias

Ajoutez dans votre `~/.bashrc` ou `~/.zshrc` :

```bash
alias fadjma-start="cd ~/fadjma && ./start-dev.sh"
alias fadjma-stop="cd ~/fadjma && ./stop-dev.sh"
alias fadjma-logs="cd ~/fadjma && ./logs-dev.sh"
alias fadjma-status="cd ~/fadjma && ./status-dev.sh"
```

Puis :
```bash
source ~/.bashrc
fadjma-start  # Lance l'environnement
```

### Watcher de fichiers

Le hot reload est activé par défaut :
- **Backend** : nodemon surveille `backend/**/*.js`
- **Frontend** : react-scripts surveille `frontend/src/**/*`

### Debug

**Backend** (VSCode launch.json) :
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Backend",
  "program": "${workspaceFolder}/backend/server.js",
  "envFile": "${workspaceFolder}/backend/.env"
}
```

**Frontend** :
```bash
# Ouvrir Chrome DevTools
# React DevTools disponible dans l'extension
```

---

## ❓ FAQ

### Comment changer le port du backend ?

Modifier `backend/.env` :
```env
PORT=8080
```

Et `frontend/package.json` :
```json
"proxy": "http://localhost:8080"
```

### Comment accéder au backend depuis un autre appareil ?

1. Trouver votre IP : `ip addr show`
2. Modifier backend pour accepter toutes les IPs
3. Accéder depuis l'autre appareil : `http://YOUR_IP:5000`

### Comment réinitialiser complètement ?

```bash
./stop-dev.sh
rm -rf backend/node_modules frontend/node_modules
rm -rf backend/database.sqlite
rm -rf logs/*.log
./start-dev.sh
```

---

**Happy Coding! 🚀**
