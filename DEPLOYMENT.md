# Guide de Déploiement FADJMA

## Vue d'ensemble

Ce guide vous accompagne dans le déploiement de la plateforme FADJMA sur des services gratuits/abordables.

## Architecture de Déploiement Recommandée

### Option 1 : Vercel + Railway (Recommandé)
- **Frontend** : Vercel (gratuit)
- **Backend** : Railway ($5/mois avec crédit gratuit)
- **Base de données** : SQLite (incluse)

### Option 2 : Netlify + Render
- **Frontend** : Netlify (gratuit)
- **Backend** : Render (gratuit avec limitations)
- **Base de données** : SQLite ou PostgreSQL

---

## 🚀 Déploiement Frontend (React)

### Vercel (Recommandé)

#### Étape 1 : Préparation
```bash
cd frontend
npm run build  # Tester le build localement
```

#### Étape 2 : Configuration Vercel
1. Connectez-vous sur [vercel.com](https://vercel.com)
2. Importez votre repository GitHub
3. Configurez les paramètres :
   - **Framework Preset** : Create React App
   - **Root Directory** : `frontend`
   - **Build Command** : `npm run build`
   - **Output Directory** : `build`

#### Étape 3 : Variables d'environnement
```env
# Variables Vercel
REACT_APP_API_URL=https://votre-backend.railway.app
REACT_APP_ENVIRONMENT=production
```

### Netlify (Alternative)

#### Configuration netlify.toml
```toml
[build]
  base = "frontend"
  command = "npm run build"
  publish = "build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  REACT_APP_API_URL = "https://votre-backend.onrender.com"
```

---

## 🖥️ Déploiement Backend (Node.js)

### Railway (Recommandé)

#### Étape 1 : Préparation du code
```bash
cd backend
# Vérifier que le PORT est configuré
echo "const PORT = process.env.PORT || 5000;" >> check-port.js
```

#### Étape 2 : Configuration Railway
1. Connectez-vous sur [railway.app](https://railway.app)
2. Créez un nouveau projet depuis GitHub
3. Sélectionnez le dossier `backend`

#### Étape 3 : Variables d'environnement Railway
```env
# Configuration serveur
PORT=5000
NODE_ENV=production

# JWT
JWT_SECRET=votre_jwt_secret_super_securise_production

# Hedera Configuration
HEDERA_NETWORK=testnet
HEDERA_ACCOUNT_ID=0.0.votre_account_id
HEDERA_PRIVATE_KEY=votre_private_key
HEDERA_TOPIC_ID=0.0.votre_topic_id

# CORS
FRONTEND_URL=https://votre-app.vercel.app

# Base de données (SQLite - automatique)
DATABASE_URL=sqlite:./database.sqlite
```

#### Étape 4 : Scripts de déploiement
Railway détecte automatiquement le `package.json` et utilise `npm start`.

### Render (Alternative)

#### Étape 1 : Configuration render.yaml
```yaml
services:
  - type: web
    name: fadjma-backend
    env: node
    plan: free
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        generateValue: true
      - key: JWT_SECRET
        generateValue: true
```

---

## 🔧 Configuration Spécifique

### 1. Modification CORS pour Production

#### backend/server.js
```javascript
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://votre-app.vercel.app',
    'https://votre-app.netlify.app'
  ],
  credentials: true
};
```

### 2. Configuration Base de Données Production

#### backend/src/config/database.js
```javascript
const config = {
  production: {
    dialect: 'sqlite',
    storage: process.env.DATABASE_URL || './database.sqlite',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
};
```

### 3. Scripts de Migration Automatique

#### backend/package.json
```json
{
  "scripts": {
    "start": "node scripts/migrate-and-start.js",
    "dev": "nodemon server.js",
    "build": "echo 'No build step required'",
    "postinstall": "npm run init:sqlite"
  }
}
```

---

## 📋 Checklist de Déploiement

### Avant le Déploiement
- [ ] Tests locaux passent (`npm test`)
- [ ] Build frontend réussit (`npm run build`)
- [ ] Variables d'environnement configurées
- [ ] Credentials Hedera testnet/mainnet prêts

### Déploiement Frontend
- [ ] Repository connecté à Vercel/Netlify
- [ ] Variables d'environnement ajoutées
- [ ] Premier build réussi
- [ ] URL de production obtenue

### Déploiement Backend
- [ ] Service Railway/Render créé
- [ ] Variables d'environnement configurées
- [ ] Base SQLite initialisée
- [ ] API accessible

### Post-Déploiement
- [ ] CORS mis à jour avec nouvelles URLs
- [ ] Tests de bout en bout
- [ ] Monitoring configuré
- [ ] DNS custom (optionnel)

---

## 🔍 Dépannage

### Problèmes Courants

#### 1. Build Frontend Échoue
```bash
# Vérifier les dépendances
npm install
npm audit fix

# Tester localement
npm run build
```

#### 2. Backend ne Démarre Pas
```bash
# Vérifier les logs Railway/Render
# Variables PORT et NODE_ENV configurées ?
```

#### 3. CORS Errors
```javascript
// Mettre à jour les origins dans server.js
const corsOptions = {
  origin: ['https://nouvelle-url.vercel.app']
};
```

#### 4. Base de Données SQLite
```bash
# Railway : stockage persistant automatique
# Render : utiliser PostgreSQL gratuite si problème
```

---

## 💰 Estimation des Coûts

### Option Gratuite (Netlify + Render)
- **Frontend** : Gratuit (100GB/mois)
- **Backend** : Gratuit (750h/mois)
- **Total** : 0€/mois

### Option Recommandée (Vercel + Railway)
- **Frontend** : Gratuit (100GB/mois)
- **Backend** : $5/mois (après crédit gratuit)
- **Total** : ~$5/mois

---

## 🚀 Déploiement Rapide

### Script de Déploiement Automatique
```bash
#!/bin/bash
# deploy.sh

echo "🚀 Déploiement FADJMA..."

# Frontend
echo "📦 Build Frontend..."
cd frontend
npm install
npm run build

# Backend
echo "🖥️ Préparation Backend..."
cd ../backend
npm install
npm test

echo "✅ Prêt pour le déploiement !"
echo "1. Pushez sur GitHub"
echo "2. Connectez Vercel/Railway"
echo "3. Configurez les variables d'env"
```

---

## 📞 Support

### En cas de problème
1. Vérifiez les logs de la plateforme de déploiement
2. Consultez la documentation officielle :
   - [Vercel Docs](https://vercel.com/docs)
   - [Railway Docs](https://docs.railway.app)
   - [Netlify Docs](https://docs.netlify.com)
   - [Render Docs](https://render.com/docs)

### Ressources Utiles
- [GETTING_STARTED.md](./docs/GETTING_STARTED.md)
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- [CONFIGURATION.md](./docs/backend/CONFIGURATION.md)

---

**Dernière mise à jour** : Septembre 2024
**Version** : 2.0