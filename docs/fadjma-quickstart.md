# 🚀 Guide de Démarrage Rapide FADJMA - Innovation Mondiale

## 🌟 **Qu'est-ce que FADJMA ?**
Premier système mondial d'ancrage enrichi de données médicales complètes sur blockchain Hedera.

**✅ DÉJÀ EN PRODUCTION TESTNET** : Compte 0.0.6089195, Topic 0.0.6854064

## 📦 Installation Rapide (2 options)

### Option A : Docker 🐳 (Recommandé - 5 minutes)

```bash
# 1. Cloner et configurer
git clone https://github.com/votre-repo/fadjma.git
cd fadjma
cp .env.example .env

# 2. Démarrer tous les services
docker-compose up -d

# 3. Initialiser et charger données
docker-compose exec backend npm run init:sqlite
docker-compose exec backend npm run seed:full

# 4. Accéder à l'application
# Frontend: http://localhost:3000
# Backend:  http://localhost:5000
```

✅ **Avantages** : PostgreSQL inclus, configuration automatique, prêt pour la production

📖 **Documentation complète** : [DOCKER_SETUP.md](DOCKER_SETUP.md)

---

### Option B : Installation Locale (20 minutes)

#### Prérequis
- Node.js 18+ et npm
- SQLite (par défaut) ou PostgreSQL (optionnel)
- Git
- **Optionnel** : Compte Hedera Testnet (pour créer vos propres topics)

#### 1. ✅ **Hedera DÉJÀ CONFIGURÉ** (0 min)
```bash
# ✅ FADJMA utilise déjà des comptes Hedera production !
# Compte EC25519: 0.0.6164695
# Compte ECDSA:   0.0.6089195
# Topic Principal: 0.0.6854064
# Topics ECDSA:    0.0.7070750
# Pas besoin de créer votre propre compte pour tester
```

#### 2. Clone et Installation (5 min)
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

### 3. Configuration Base de Données SQLite (2 min)
```bash
# ✅ SQLite par défaut - pas de configuration requise !
# La base de données est créée automatiquement
\q
```

#### 4. Configuration Environnement (5 min)

**backend/.env**
```env
# Server
PORT=5000
NODE_ENV=development

# Verification Mode
USE_MIRROR_NODE=false

# Database - SQLite (Default - No configuration needed!)
# Database file created automatically in backend/data/database.sqlite

# JWT
JWT_SECRET=fadjma-hackathon-secret-2024
JWT_EXPIRE=7d

# Hedera EC25519 (Primary)
HEDERA_ECDSA_ACCOUNT_ID=0.0.6164695
HEDERA_ECDSA_PRIVATE_KEY=302e...
HEDERA_TOPIC_ID=0.0.6854064
HEDERA_NETWORK=testnet

# Hedera ECDSA (Secondary)
HEDERA_ECDSA_ACCOUNT_ID=0.0.6089195
HEDERA_ECDSA_PRIVATE_KEY=3030...
HEDERA_ECDSA_TOPIC_ID=0.0.7070750

# CORS
FRONTEND_URL=http://localhost:3000

# KMS & Optimisations (optionnels)
KMS_PROVIDER=env
HEDERA_USE_BATCHING=false
HEDERA_USE_COMPRESSION=true
HEDERA_MAX_TPS=8
```

**frontend/.env**
```env
REACT_APP_API_URL=http://localhost:5000/api
```

#### 5. Initialisation Base de Données (2 min)
```bash
# Dans backend/
npm run init:sqlite    # Créer la base et les tables
npm run seed:full      # Charger les données de test
```

#### 6. Lancement (2 min)
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
- [ ] Configuration SQLite
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

### Erreur de Base de Données
```bash
# SQLite : Supprimer et recréer
rm backend/database.sqlite
npm run init:sqlite

# PostgreSQL : Vérifier le service
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