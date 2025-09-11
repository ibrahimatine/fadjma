# 🔧 Fix PostgreSQL + Git Setup + Guide Collaborateur

## 🐘 PARTIE 1: Résoudre l'erreur PostgreSQL

### Solution 1: Utiliser sudo (Plus simple)
```bash
# Se connecter avec sudo
sudo -u postgres psql

# Une fois connecté à PostgreSQL:
CREATE DATABASE fadjma_db;

# Créer un utilisateur avec mot de passe
CREATE USER fadjma_user WITH PASSWORD 'fadjma2024';
GRANT ALL PRIVILEGES ON DATABASE fadjma_db TO fadjma_user;

# Sortir
\q
```

### Solution 2: Changer le mot de passe postgres
```bash
# Se connecter en tant que postgres
sudo -u postgres psql

# Changer le mot de passe
ALTER USER postgres PASSWORD 'postgres123';

# Créer la base
CREATE DATABASE fadjma_db;
\q

# Maintenant vous pouvez vous connecter avec:
psql -U postgres -h localhost
# (entrer le mot de passe: postgres123)
```

### Solution 3: Modifier pg_hba.conf (Permanent)
```bash
# Trouver le fichier pg_hba.conf
sudo find / -name "pg_hba.conf" 2>/dev/null

# Ou directement (Ubuntu/Debian):
sudo nano /etc/postgresql/14/main/pg_hba.conf
# (remplacer 14 par votre version)

# Changer cette ligne:
local   all             postgres                                peer
# En:
local   all             postgres                                md5

# Redémarrer PostgreSQL
sudo systemctl restart postgresql

# Maintenant ça marche avec mot de passe
psql -U postgres
```

### ✅ Configuration backend/.env après fix
```env
# Si vous avez utilisé Solution 1:
DB_USER=fadjma_user
DB_PASSWORD=fadjma2024

# Si vous avez utilisé Solution 2:
DB_USER=postgres
DB_PASSWORD=postgres123

# Le reste:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fadjma_db
```

---

## 📁 PARTIE 2: Fichiers .gitignore

### backend/.gitignore
```gitignore
# Dependencies
node_modules/
package-lock.json

# Environment variables
.env
.env.local
.env.production
.env.test

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage/
.nyc_output/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Build
dist/
build/

# Database
*.sqlite
*.sqlite3
*.db

# Uploads (if any)
uploads/
temp/

# Hedera credentials
hedera-config.json
.hedera/
```

### frontend/.gitignore
```gitignore
# Dependencies
node_modules/
package-lock.json
yarn.lock

# Testing
coverage/

# Production
build/
dist/

# Misc
.DS_Store
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.vscode/
.idea/
*.swp
*.swo

# Debug
debug.log
```

### Racine du projet /.gitignore
```gitignore
# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.sublime-*

# Logs
*.log

# Environment
.env

# Documentation temporaire
*.tmp
~$*
```

---

## 📚 PARTIE 3: Guide pour votre Collègue

# 🚀 Guide d'Installation FadjMa - Pour Nouveau Développeur

## 📋 Prérequis
- Node.js 18+ et npm
- PostgreSQL 14+
- Git
- Un éditeur de code (VS Code recommandé)

## 🔄 1. Cloner le Projet
```bash
git clone [URL_DU_REPO]
cd fadjma
```

## 🐘 2. Setup PostgreSQL

### Sur Linux/Mac:
```bash
# Installer PostgreSQL si pas déjà fait
sudo apt install postgresql postgresql-contrib  # Ubuntu/Debian
brew install postgresql@14  # Mac

# Créer la base de données
sudo -u postgres psql
CREATE DATABASE fadjma_db;
CREATE USER fadjma_user WITH PASSWORD 'fadjma2024';
GRANT ALL PRIVILEGES ON DATABASE fadjma_db TO fadjma_user;
\q
```

### Sur Windows:
1. Télécharger PostgreSQL depuis postgresql.org
2. Installer avec l'assistant
3. Ouvrir pgAdmin et créer la base `fadjma_db`

## 🔑 3. Configuration Hedera Testnet

### Créer un compte Hedera:
1. Aller sur https://portal.hedera.com/register
2. S'inscrire et confirmer l'email
3. Dans le dashboard → "Testnet" → "Create Testnet Account"
4. **SAUVEGARDER ces informations:**
   ```
   Account ID: 0.0.XXXXXXX
   Private Key: 302e020100300506032b657004220420...
   ```
5. Utiliser le "Testnet Faucet" pour obtenir 10,000 HBAR gratuits

## ⚙️ 4. Configuration du Projet

### Backend:
```bash
cd backend
npm install

# Créer le fichier .env (copier depuis .env.example)
cp .env.example .env

# Éditer .env avec vos valeurs
nano .env  # ou ouvrir avec votre éditeur
```

**Contenu du backend/.env:**
```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fadjma_db
DB_USER=fadjma_user  # ou postgres
DB_PASSWORD=fadjma2024  # VOTRE mot de passe

# JWT
JWT_SECRET=fadjma-hackathon-secret-key-2024
JWT_EXPIRE=7d

# Hedera - REMPLACER avec VOS credentials
HEDERA_ACCOUNT_ID=0.0.XXXXXXX
HEDERA_PRIVATE_KEY=302e020100300506032b657004220420...
HEDERA_TOPIC_ID=  # Sera généré à l'étape suivante
HEDERA_NETWORK=testnet

# CORS
FRONTEND_URL=http://localhost:3000
```

### Frontend:
```bash
cd ../frontend
npm install

# Créer le .env
cp .env.example .env
```

**Contenu du frontend/.env:**
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_APP_NAME=FadjMa
```

## 🎯 5. Initialisation

### Créer le Topic Hedera:
```bash
cd backend
node scripts/setup-hedera.js
# Copier le Topic ID affiché et l'ajouter dans .env
```

### Tester la connexion DB:
```bash
node scripts/test-db.js
```

### Peupler la base avec des données:
```bash
node scripts/seed.js
```

## 🚀 6. Lancement

### Terminal 1 - Backend:
```bash
cd backend
npm run dev
# Doit afficher: Server running on port 5000
```

### Terminal 2 - Frontend:
```bash
cd frontend
npm start
# Ouvre automatiquement http://localhost:3000
```

## 👤 7. Comptes de Test

| Type | Email | Mot de passe |
|------|-------|--------------|
| Patient | jean.dupont@demo.com | Demo2024! |
| Patient | fatou.sall@demo.com | Demo2024! |
| Médecin | dr.martin@fadjma.com | Demo2024! |
| Médecin | dr.diop@fadjma.com | Demo2024! |
| Admin | admin@fadjma.com | Admin2024! |

## 🧪 8. Test Rapide

1. Ouvrir http://localhost:3000
2. Se connecter avec un compte test
3. Créer un dossier médical
4. Vérifier le hash et l'ID Hedera
5. Cliquer "Proof of Integrity"

## 📁 9. Structure du Projet

```
fadjma/
├── backend/          # API Node.js/Express
│   ├── src/
│   │   ├── config/   # Config DB, Hedera, JWT
│   │   ├── models/   # Modèles Sequelize
│   │   ├── routes/   # Routes API
│   │   └── services/ # Logique métier
│   └── scripts/      # Scripts utilitaires
│
└── frontend/         # App React
    └── src/
        ├── components/  # Composants React
        ├── pages/       # Pages principales
        └── services/    # Appels API
```

## 🔧 10. Scripts Utiles

### Backend:
```bash
npm run dev          # Lancer en mode dev
npm run seed         # Peupler la DB
npm run seed:reset   # Reset la DB
npm run test:api     # Tester l'API
```

### Frontend:
```bash
npm start           # Lancer en mode dev
npm run build       # Build production
```

## 🐛 11. Troubleshooting

### Erreur "Cannot connect to database"
```bash
# Vérifier PostgreSQL
sudo service postgresql status
# Si arrêté:
sudo service postgresql start
```

### Erreur "HEDERA_ACCOUNT_ID not found"
```bash
# Vérifier le .env
cat backend/.env | grep HEDERA
# S'assurer que les valeurs sont présentes
```

### Port déjà utilisé
```bash
lsof -i :5000  # Voir qui utilise le port
kill -9 <PID>  # Tuer le processus
```

## 📞 12. Contact & Support

- **Backend Lead**: [Personne A]
- **Frontend Lead**: [Personne B]
- **Repo GitHub**: [URL]
- **Documentation Hedera**: https://docs.hedera.com

## 🎯 13. Roadmap du Projet

**Sprint 1 (Jours 1-5)**: Auth + CRUD + Hedera basic
**Sprint 2 (Jours 6-10)**: UI Polish + Verification
**Sprint 3 (Jours 11-15)**: Tests + Demo + Pitch

---

## 💡 Tips pour Démarrer

1. **Commencer simple**: Tester d'abord le login/register
2. **Console ouverte**: Garder la console du navigateur ouverte
3. **Logs backend**: Observer les logs du terminal backend
4. **Git régulier**: Commit toutes les 2 heures minimum
5. **Questions**: Ne pas hésiter à demander!

Bon développement! 🚀