# 🚀 Guide de Démarrage Rapide FadjMa

## 📦 Installation Jour 1 (30 minutes)

### Prérequis
- Node.js 18+ et npm
- PostgreSQL 14+
- Git
- Compte Hedera Testnet

### 1. Setup Hedera Testnet (10 min)
```bash
# Aller sur https://portal.hedera.com/
# Créer un compte testnet
# Noter: Account ID et Private Key
# Recevoir des HBAR de test via le faucet
```

### 2. Clone et Installation (5 min)
```bash
# Clone du repo
git clone https://github.com/votre-repo/fadjma.git
cd fadjma

# Installation Backend
cd backend
npm install
cp .env.example .env

# Installation Frontend
cd ../frontend
npm install
cp .env.example .env
```

### 3. Configuration Base de Données (5 min)
```bash
# Créer la base de données
psql -U postgres
CREATE DATABASE fadjma_db;
\q
```

### 4. Configuration Environnement (5 min)

**backend/.env**
```env
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fadjma_db
DB_USER=postgres
DB_PASSWORD=votre_password

# JWT
JWT_SECRET=fadjma-hackathon-secret-2024
JWT_EXPIRE=7d

# Hedera
HEDERA_ACCOUNT_ID=0.0.xxxxxx
HEDERA_PRIVATE_KEY=302e...
HEDERA_NETWORK=testnet

# CORS
FRONTEND_URL=http://localhost:3000
```

**frontend/.env**
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 5. Création Topic Hedera (5 min)
```bash
# Dans backend/
npm run hedera:setup
# Note le Topic ID généré et l'ajouter dans .env
```

### 6. Lancement (2 min)
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

## 👥 Répartition des Tâches Jour par Jour

### 🔴 Personne A - Backend/Blockchain

#### Jour 1 - Setup & Auth
```bash
# Matin (4h)
- [ ] Setup projet Node.js + Express
- [ ] Configuration PostgreSQL
- [ ] Modèles User et MedicalRecord
- [ ] Installation et config Hedera SDK

# Après-midi (4h)
- [ ] Routes auth (login/register)
- [ ] JWT implementation
- [ ] Test connexion Hedera Testnet
- [ ] Premier message sur HCS
```

#### Jour 2 - CRUD Records
```bash
# Matin (4h)
- [ ] Controller création records
- [ ] Service validation données
- [ ] Routes GET records avec pagination

# Après-midi (4h)
- [ ] Routes UPDATE/DELETE
- [ ] Permissions patient vs médecin
- [ ] Tests unitaires CRUD
```

#### Jour 3 - Hedera Integration
```bash
# Matin (4h)
- [ ] Service hashing SHA256
- [ ] Envoi hash vers HCS
- [ ] Stockage transaction ID

# Après-midi (4h)
- [ ] Auto-hash sur create/update
- [ ] Gestion erreurs Hedera
- [ ] Queue système pour retry
```

### 🔵 Personne B - Frontend/UI

#### Jour 1 - Setup & Auth UI
```bash
# Matin (4h)
- [ ] Setup React + Tailwind
- [ ] Routing configuration
- [ ] Page login/register
- [ ] AuthContext

# Après-midi (4h)
- [ ] Header/Navigation
- [ ] Protected routes
- [ ] Toast notifications
- [ ] Loading states
```

#### Jour 2 - Forms & Dashboard
```bash
# Matin (4h)
- [ ] Formulaire création record
- [ ] Validation client-side
- [ ] Integration API backend

# Après-midi (4h)
- [ ] Dashboard patient
- [ ] Liste des records
- [ ] Filtres et recherche
```

#### Jour 3 - Hedera UI
```bash
# Matin (4h)
- [ ] Bouton Proof of Integrity
- [ ] Modal de vérification
- [ ] Animation de validation

# Après-midi (4h)
- [ ] Affichage transaction ID
- [ ] Badge statut blockchain
- [ ] Timeline modifications
```

## 🎯 Checkpoints Quotidiens

### Stand-up 9h00 (15 min)
```markdown
1. Qu'est-ce que j'ai fait hier ?
2. Qu'est-ce que je fais aujourd'hui ?
3. Y a-t-il des blocages ?
```

### Review 18h00 (30 min)
```markdown
1. Demo des features du jour
2. Test d'intégration
3. Planning jour suivant
4. Commit et push
```

## 🧪 Tests Rapides

### Test Auth (Jour 1)
```bash
# Backend
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@test.com",
    "password": "Test123!",
    "firstName": "Jean",
    "lastName": "Dupont",
    "role": "patient"
  }'
```

### Test Record Creation (Jour 2)
```bash
# Avec token JWT
curl -X POST http://localhost:5000/api/records \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "allergy",
    "title": "Allergie aux arachides",
    "description": "Patient allergique aux arachides",
    "diagnosis": "Allergie sévère confirmée"
  }'
```

### Test Hedera Verification (Jour 3)
```bash
curl -X POST http://localhost:5000/api/verify/record/RECORD_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📱 Données de Démo

### Utilisateurs de Test
```javascript
// Médecin
{
  email: "dr.martin@fadjma.com",
  password: "Demo2024!",
  firstName: "Marie",
  lastName: "Martin",
  role: "doctor",
  licenseNumber: "MED-12345"
}

// Patient
{
  email: "jean.dupont@demo.com",
  password: "Demo2024!",
  firstName: "Jean",
  lastName: "Dupont",
  role: "patient"
}
```

### Records de Démo
```javascript
[
  {
    type: "allergy",
    title: "Allergie aux arachides",
    description: "Allergie sévère diagnostiquée en 2023",
    diagnosis: "Réaction anaphylactique possible"
  },
  {
    type: "vaccination",
    title: "Vaccin COVID-19",
    description: "3ème dose Pfizer",
    diagnosis: "Aucun effet secondaire"
  },
  {
    type: "consultation",
    title: "Consultation générale",
    description: "Visite de routine",
    diagnosis: "Patient en bonne santé"
  }
]
```

## 🐛 Troubleshooting

### Erreur PostgreSQL
```bash
# Vérifier que PostgreSQL est lancé
sudo service postgresql status
sudo service postgresql start
```

### Erreur Hedera
```bash
# Vérifier les crédits HBAR
# Utiliser le faucet: https://portal.hedera.com/
# Vérifier Account ID et Private Key
```

### Port déjà utilisé
```bash
# Tuer les processus
lsof -i :5000  # Backend
lsof -i :3000  # Frontend
kill -9 <PID>
```

## 📈 Métriques de Succès Jour 3

✅ **Backend**
- [ ] Auth fonctionne (login/register)
- [ ] CRUD records complet
- [ ] Hash envoyé sur Hedera
- [ ] Transaction ID stocké
- [ ] 10+ tests passent

✅ **Frontend**
- [ ] Login/Register UI
- [ ] Dashboard affiche records
- [ ] Formulaire création fonctionne
- [ ] Bouton Proof of Integrity visible
- [ ] Responsive mobile

✅ **Integration**
- [ ] Frontend → Backend OK
- [ ] Backend → Hedera OK
- [ ] Cycle complet: Create → Hash → Verify

## 🎬 Script Démo Jour 3

1. **Login** en tant que patient
2. **Créer** un dossier médical (allergie)
3. **Voir** le hash et transaction ID
4. **Vérifier** l'intégrité
5. **Montrer** la console Hedera Explorer

## 💪 Go Team FadjMa!

> "En 3 jours, on aura la base solide. Les 12 jours suivants, on polish et on impressionne le jury!"

**Contact rapide:**
- Personne A: @backend_lead
- Personne B: @frontend_lead
- Mentor: @mentor_hedera