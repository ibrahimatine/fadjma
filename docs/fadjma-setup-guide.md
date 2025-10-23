# 🔧 Configuration SQLite + Hedera + Lancement

## 📊 Étape 1: Installation SQLite (10 min)

### Sur Windows
```bash
# Télécharger depuis https://www.postgresql.org/download/windows/
# Installer avec l'installateur (noter le mot de passe!)
# Port par défaut: 5432
```

### Sur Mac
```bash
# Avec Homebrew
brew install postgresql@14
brew services start postgresql@14
```

### Sur Linux
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

## 🗄️ Étape 2: Créer la Base de Données (5 min)

### Option A: Ligne de commande
```bash
# Se connecter à SQLite (pas de commande directe comme psql)
# Pour SQLite, vous interagissez directement avec le fichier de base de données.
# Vous pouvez utiliser `sqlite3` si installé, ou un client GUI.
# Exemple: sqlite3 database.sqlite

# Créer la base de données
CREATE DATABASE fadjma_db;

# Créer un utilisateur (optionnel mais recommandé)
CREATE USER fadjma_user WITH PASSWORD 'FadjMa2024!';
GRANT ALL PRIVILEGES ON DATABASE fadjma_db TO fadjma_user;

# Vérifier que la base existe
\l

# Sortir
\q
```

### Option B: Avec pgAdmin (interface graphique)
1. Ouvrir pgAdmin
2. Click droit sur "Databases" → "Create" → "Database"
3. Name: `fadjma_db`
4. Owner: `postgres`
5. Save

## 🔐 Étape 3: Créer Compte Hedera Testnet (15 min)

### 3.1 Créer le compte
1. **Aller sur** : https://portal.hedera.com/register
2. **S'inscrire** avec votre email
3. **Confirmer** l'email
4. **Se connecter** au portal

### 3.2 Obtenir les credentials Testnet
1. Dans le dashboard, cliquer sur **"Testnet"**
2. Cliquer **"Create Testnet Account"**
3. **IMPORTANT** - Copier et sauvegarder :
   ```
   Account ID: 0.0.XXXXXXX
   Private Key: 302e020100300506032b657004220420...
   Public Key: 302a300506032b6570032100...
   ```

### 3.3 Obtenir des HBAR de test
1. Toujours dans le portal Hedera
2. Aller dans **"Testnet Faucet"**
3. Entrer votre **Account ID**
4. Cliquer **"Receive HBAR"**
5. Vous devriez recevoir **10,000 HBAR de test**

### 3.4 Créer un Topic ID (optionnel - on peut le faire par code)
```javascript
// On va créer le topic au premier lancement
// Pas besoin de le faire manuellement
```

## ⚙️ Étape 4: Configuration des Fichiers .env

### backend/.env
```env
# Server
PORT=5000
NODE_ENV=development

# Database - ADAPTER SELON VOTRE CONFIG
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fadjma_db
DB_USER=postgres  # ou fadjma_user si vous l'avez créé
DB_PASSWORD=VotreMotDePassePostgres  # ⚠️ CHANGER ICI

# JWT
JWT_SECRET=fadjma-hackathon-secret-key-2024-change-this
JWT_EXPIRE=7d

# Hedera - COPIER VOS VRAIES VALEURS ICI
HEDERA_ECDSA_ACCOUNT_ID=0.0.XXXXXXX  # ⚠️ REMPLACER
HEDERA_ECDSA_PRIVATE_KEY=302e020100300506032b657004220420...  # ⚠️ REMPLACER
HEDERA_TOPIC_ID=  # Laisser vide pour l'instant
HEDERA_NETWORK=testnet

# CORS
FRONTEND_URL=http://localhost:3000
```

### frontend/.env
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_APP_NAME=FadjMa
```

## 🚀 Étape 5: Création du Topic Hedera (Script d'initialisation)

Créez ce fichier : **backend/scripts/setup-hedera.js**

```javascript
require('dotenv').config();
const { Client, TopicCreateTransaction } = require("@hashgraph/sdk");

async function createTopic() {
  console.log("🔄 Configuration Hedera...");
  
  const accountId = process.env.HEDERA_ECDSA_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_ECDSA_PRIVATE_KEY;

  if (!accountId || !privateKey) {
    console.error("❌ Erreur: HEDERA_ECDSA_ACCOUNT_ID et HEDERA_ECDSA_PRIVATE_KEY requis dans .env");
    process.exit(1);
  }

  try {
    // Connexion au testnet
    const client = Client.forTestnet();
    client.setOperator(accountId, privateKey);
    console.log("✅ Client Hedera connecté");

    // Créer le topic
    console.log("🔄 Création du topic...");
    const transaction = await new TopicCreateTransaction()
      .setAdminKey(client.operatorPublicKey)
      .setSubmitKey(client.operatorPublicKey)
      .execute(client);

    const receipt = await transaction.getReceipt(client);
    const topicId = receipt.topicId.toString();
    
    console.log("✅ Topic créé avec succès!");
    console.log("📋 Topic ID:", topicId);
    console.log("");
    console.log("⚠️  IMPORTANT: Ajoutez cette ligne dans backend/.env :");
    console.log(`HEDERA_TOPIC_ID=${topicId}`);
    console.log("");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    process.exit(1);
  }
}

createTopic();
```

Puis exécutez :
```bash
cd backend
node scripts/setup-hedera.js
```

**Copiez le Topic ID affiché et ajoutez-le dans backend/.env**

## 🏃 Étape 6: Installation des Dépendances

### Backend
```bash
cd backend
npm install

# Si erreur avec pg, essayer:
npm install pg --save
```

### Frontend
```bash
cd ../frontend
npm install

# Si erreur avec React Scripts:
npm install react-scripts --save
```

## ✅ Étape 7: Test de Connexion Database

Créez **backend/scripts/test-db.js** :

```javascript
require('dotenv').config();
const { sequelize } = require('../src/config/database');

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion SQLite réussie!');
    
    // Sync les modèles
    await sequelize.sync({ alter: true });
    console.log('✅ Tables créées/mises à jour!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    console.log('Vérifiez votre configuration dans .env');
    process.exit(1);
  }
}

testConnection();
```

Exécutez :
```bash
cd backend
node scripts/test-db.js
```

## 🎮 Étape 8: Lancement de l'Application

### Terminal 1 - Backend
```bash
cd backend
npm run dev

# Vous devriez voir:
# ✅ Database connected successfully
# ✅ Database synchronized
# 🚀 Server running on port 5000
# 📍 Environment: development
```

### Terminal 2 - Frontend
```bash
cd frontend
npm start

# Ouvrira automatiquement http://localhost:3000
```

## 🧪 Étape 9: Test Rapide

### 1. Test API Health
```bash
curl http://localhost:5000/health
# Devrait retourner: {"status":"OK","timestamp":"..."}
```

### 2. Test Inscription
Allez sur http://localhost:3000/register et créez un compte :
- Email: patient@test.com
- Password: Test123!
- Prénom: Test
- Nom: Patient
- Role: Patient

### 3. Test Hedera
Dans la console backend, vous devriez voir les logs Hedera lors de la création d'un record.

## 🐛 Troubleshooting

### Erreur SQLite
```bash
# Vérifier le mot de passe dans .env
# Essayer avec l'utilisateur postgres par défaut
DB_USER=postgres
DB_PASSWORD=VotreVraiMotDePasse
```

### Erreur "Cannot find module"
```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

### Erreur Hedera "INSUFFICIENT_PAYER_BALANCE"
```bash
# Retourner sur https://portal.hedera.com
# Utiliser le faucet pour obtenir plus de HBAR de test
```

### Port déjà utilisé
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5000
kill -9 <PID>
```

## ✅ Checklist de Validation

- [ ] SQLite configuré
- [ ] Database `fadjma_db` (fichier .sqlite) créée
- [ ] Compte Hedera créé avec HBAR de test
- [ ] Topic ID créé et ajouté dans .env
- [ ] Backend démarre sans erreur
- [ ] Frontend démarre sans erreur
- [ ] Peut créer un compte utilisateur
- [ ] API health check répond OK

## 🎯 Prochaines Étapes

Une fois tout configuré :

1. **Créer des données de test** (je peux vous fournir un script)
2. **Tester le flow complet** : Inscription → Login → Créer Record → Vérifier
3. **Commencer les features** selon la roadmap jour par jour

## 💡 Scripts Utiles à Ajouter

### backend/package.json - Ajouter ces scripts
```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js",
  "test": "jest",
  "setup:db": "node scripts/test-db.js",
  "setup:hedera": "node scripts/setup-hedera.js",
  "seed": "node scripts/seed.js"
}
```

Vous pouvez maintenant lancer avec :
```bash
npm run setup:db      # Test database
npm run setup:hedera  # Créer topic
npm run dev          # Lancer le serveur
```

## 🆘 Besoin d'Aide ?

Si vous avez une erreur, envoyez-moi :
1. Le message d'erreur exact
2. La commande qui a causé l'erreur
3. Le contenu de votre .env (sans les clés privées!)

**Prêt à lancer ? Faites-moi savoir quand SQLite et Hedera sont configurés !**