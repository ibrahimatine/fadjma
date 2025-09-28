# Architecture Technique - FADJMA

## Vue d'Ensemble

FADJMA utilise une architecture moderne en 3 couches avec intégration blockchain pour garantir la sécurité et la traçabilité des données médicales.

## Architecture Globale

```
┌─────────────────────────────────────────────────────────────┐
│                    FADJMA Platform                          │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React)          │  Backend (Node.js)            │
│  ┌─────────────────────┐   │  ┌─────────────────────────┐   │
│  │ Components          │   │  │ API Endpoints           │   │
│  │ ├─ Auth             │   │  │ ├─ /auth                │   │
│  │ ├─ Dashboard        │   │  │ ├─ /patients            │   │
│  │ ├─ Patients         │   │  │ ├─ /records             │   │
│  │ ├─ Records          │   │  │ └─ /admin               │   │
│  │ └─ Admin            │   │  │                         │   │
│  │                     │   │  │ Services                │   │
│  │ State Management    │   │  │ ├─ AuthService          │   │
│  │ ├─ Auth Context     │◄──┼──┤ ├─ PatientService       │   │
│  │ ├─ WebSocket        │   │  │ ├─ SecurityService      │   │
│  │ └─ API Calls        │   │  │ └─ HederaService        │   │
│  └─────────────────────┘   │  └─────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    Data Layer                               │
│  ┌─────────────────────────────────────────────────────────┤
│  │ SQLite              │  Hedera Blockchain              │  │
│  │ ├─ Users            │  ├─ Medical Records Hash        │  │
│  │ ├─ Medical Records  │  ├─ Prescriptions Hash         │  │
│  │ ├─ Access Requests  │  └─ Audit Trail                │  │
│  │ └─ Audit Logs       │                                │  │
│  └─────────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────────┘
```

## Architecture Frontend

### Structure des Composants

```
src/
├── components/
│   ├── common/              # Composants réutilisables
│   │   ├── Header.jsx       # Navigation principale
│   │   ├── Footer.jsx       # Pied de page
│   │   ├── LoadingSpinner.jsx
│   │   └── ErrorBoundary.jsx
│   │
│   ├── auth/                # Authentification
│   │   ├── LoginForm.jsx    # Formulaire de connexion
│   │   ├── RegisterForm.jsx # Inscription
│   │   ├── PatientLinkForm.jsx # Liaison identifiant
│   │   ├── ProtectedRoute.jsx  # Garde de route
│   │   └── PatientRecordGuard.jsx
│   │
│   ├── dashboard/           # Tableaux de bord
│   │   ├── DashboardLayout.jsx
│   │   ├── PatientDashboard.jsx
│   │   ├── DoctorDashboard.jsx
│   │   └── AdminDashboard.jsx
│   │
│   ├── patient/             # Gestion patients
│   │   ├── PatientList.jsx
│   │   ├── PatientProfile.jsx
│   │   ├── CreateUnclaimedPatientModal.jsx
│   │   └── PatientMedicalRecordsView.jsx
│   │
│   ├── records/             # Dossiers médicaux
│   │   ├── RecordList.jsx
│   │   ├── RecordForm.jsx
│   │   ├── RecordDetails.jsx
│   │   └── RecordHistory.jsx
│   │
│   └── doctor/              # Interface médecin
│       ├── PatientRecordGroups.jsx
│       └── DoctorPatientList.jsx
│
├── hooks/                   # Hooks personnalisés
│   ├── useAuth.js          # Gestion authentification
│   ├── useWebSocket.js     # WebSocket
│   └── useApi.js           # Appels API
│
├── services/               # Services métier
│   ├── authService.js      # API authentification
│   ├── patientService.js   # API patients
│   ├── recordService.js    # API dossiers
│   ├── accessService.js    # API accès
│   └── websocketService.js # WebSocket
│
├── pages/                  # Pages principales
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   ├── Records.jsx
│   ├── RecordDetails.jsx
│   ├── CreateMedicalRecord.jsx
│   ├── AdminRegistry.jsx
│   └── HistoryView.jsx
│
└── utils/                  # Utilitaires
    ├── constants.js
    ├── helpers.js
    └── formatters.js
```

### Flux de Données Frontend

```
User Action → Component → Hook → Service → API → Backend
     ↓
State Update → Re-render → UI Update
```

### Technologies Frontend

- **React 18+** : Framework principal
- **React Router v6** : Navigation
- **TailwindCSS** : Styling
- **Lucide React** : Icônes
- **React Hot Toast** : Notifications
- **Socket.io Client** : WebSocket

## Architecture Backend

### Structure des Couches

```
src/
├── app.js                  # Configuration Express
├── server.js              # Point d'entrée
│
├── routes/                 # Définition des routes
│   ├── newAuthRoutes.js    # Authentification
│   ├── patientRoutes.js    # Patients
│   ├── recordRoutes.js     # Dossiers médicaux
│   ├── accessRoutes.js     # Demandes d'accès
│   ├── pharmacyRoutes.js   # Pharmacies
│   ├── adminRoutes.js      # Administration
│   └── historyRoutes.js    # Historique
│
├── controllers/            # Logique métier
│   ├── newAuthController.js
│   ├── patientContoller.js
│   ├── recordController.js
│   ├── accessController.js
│   ├── pharmacyController.js
│   └── adminController.js
│
├── services/               # Services métier
│   ├── patientIdentifierService.js
│   ├── accessControlService.js
│   ├── securityService.js
│   ├── hederaService.js
│   ├── hashService.js
│   ├── nftService.js
│   ├── monitoringService.js
│   └── websocketService.js
│
├── models/                 # Modèles de données
│   ├── index.js           # Configuration Sequelize
│   ├── BaseUser.js        # Utilisateur principal
│   ├── Patient.js         # Profil patient
│   ├── Doctor.js          # Profil médecin
│   ├── Pharmacy.js        # Profil pharmacie
│   ├── MedicalRecord.js   # Dossier médical
│   ├── Prescription.js    # Ordonnance
│   └── MedicalRecordAccess.js # Accès aux dossiers
│
├── middleware/             # Middlewares
│   ├── auth.js            # Authentification JWT
│   ├── authorize.js       # Autorisation par rôle
│   ├── errorHandler.js    # Gestion d'erreurs
│   ├── websocket.js       # WebSocket
│   └── prescriptionSecurity.js
│
├── config/                 # Configuration
│   ├── database.js        # Base de données
│   ├── security.js        # Sécurité
│   └── hedera.js          # Blockchain
│
├── utils/                  # Utilitaires
│   ├── logger.js          # Logging
│   ├── validators.js      # Validations
│   ├── responseHelper.js  # Réponses HTTP
│   └── securityValidators.js
│
└── websocket/              # WebSocket
    └── socketHandlers.js   # Gestionnaires événements
```

### Flux de Données Backend

```
HTTP Request → Route → Middleware → Controller → Service → Model → Database
                ↓
Response ← JSON ← Controller ← Service ← Model ← Database
```

### Technologies Backend

- **Node.js 18+** : Runtime
- **Express.js** : Framework web
- **Sequelize** : ORM
- **SQLite** : Base de données
- **JWT** : Authentification
- **bcrypt** : Hachage mots de passe
- **Hedera SDK** : Blockchain
- **Socket.io** : WebSocket
- **Jest** : Tests

## Base de Données

### Schéma Principal

```sql
-- Table principale des utilisateurs
BaseUsers {
  id: UUID PRIMARY KEY
  email: VARCHAR UNIQUE
  password: VARCHAR (hashé)
  firstName: VARCHAR
  lastName: VARCHAR
  role: ENUM('patient', 'doctor', 'pharmacy', 'admin')
  isActive: BOOLEAN
  isUnclaimed: BOOLEAN
  patientIdentifier: VARCHAR UNIQUE
  createdByDoctorId: UUID FOREIGN KEY
  -- Champs spécifiques selon le rôle
  licenseNumber: VARCHAR
  specialty: VARCHAR
  hospital: VARCHAR
  pharmacyName: VARCHAR
  dateOfBirth: DATE
  gender: ENUM('male', 'female', 'other')
  -- Timestamps
  createdAt: TIMESTAMP
  updatedAt: TIMESTAMP
}

-- Dossiers médicaux
MedicalRecords {
  id: UUID PRIMARY KEY
  patientId: UUID FOREIGN KEY → BaseUsers
  doctorId: UUID FOREIGN KEY → BaseUsers
  title: VARCHAR
  content: TEXT
  category: VARCHAR
  isPublic: BOOLEAN
  hash: VARCHAR (Hedera)
  hederaTransactionId: VARCHAR
  hederaTimestamp: TIMESTAMP
  createdAt: TIMESTAMP
  updatedAt: TIMESTAMP
}

-- Demandes d'accès aux dossiers
MedicalRecordAccessRequests {
  id: UUID PRIMARY KEY
  patientId: UUID FOREIGN KEY → BaseUsers
  requesterId: UUID FOREIGN KEY → BaseUsers
  recordId: UUID FOREIGN KEY → MedicalRecords
  status: ENUM('pending', 'approved', 'denied')
  accessLevel: ENUM('read', 'write')
  reason: TEXT
  expiresAt: TIMESTAMP
  reviewedBy: UUID FOREIGN KEY → BaseUsers
  reviewedAt: TIMESTAMP
}

-- Ordonnances
Prescriptions {
  id: UUID PRIMARY KEY
  patientId: UUID FOREIGN KEY → BaseUsers
  doctorId: UUID FOREIGN KEY → BaseUsers
  pharmacyId: UUID FOREIGN KEY → BaseUsers
  medications: JSON
  dosage: TEXT
  duration: VARCHAR
  instructions: TEXT
  matricule: VARCHAR UNIQUE
  status: ENUM('pending', 'dispensed', 'expired')
  issueDate: DATE
  expirationDate: DATE
  hash: VARCHAR (Hedera)
  hederaTransactionId: VARCHAR
}
```

### Relations

```
BaseUsers 1:N MedicalRecords (as patient)
BaseUsers 1:N MedicalRecords (as doctor)
BaseUsers 1:N MedicalRecordAccessRequests (as patient)
BaseUsers 1:N MedicalRecordAccessRequests (as requester)
BaseUsers 1:N Prescriptions (as patient/doctor/pharmacy)
BaseUsers 1:N BaseUsers (as createdByDoctor)
```

## Sécurité

### Authentification

```
1. Login → JWT Token Generation
2. JWT includes: { id, role, exp }
3. Token validation on each request
4. Role-based authorization
5. Session management
```

### Autorisation

```
Patients → Own records only
Doctors → Patients they created + approved access
Pharmacies → Prescriptions assigned to them
Admins → All resources (with audit)
```

### Protection des Données

```
- Passwords: bcrypt hashing
- Sensitive data: AES encryption
- API: Rate limiting
- Database: Parameterized queries
- Headers: Security headers (Helmet.js)
```

## Intégration Blockchain

### Hedera Hashgraph

```javascript
// Workflow d'intégration
1. Medical Record Created → Hash Generated
2. Hash Submitted → Hedera Network
3. Transaction ID → Stored in Database
4. Verification → Hash Comparison
```

### Services Hedera

```
HederaService:
  - submitMedicalRecord()
  - verifyMedicalRecord()
  - createNFT()
  - updateConsensusData()

HashService:
  - generateRecordHash()
  - verifyIntegrity()
  - compareHashes()
```

## Communication Temps Réel

### WebSocket Architecture

```
Frontend ←→ Socket.io ←→ Backend ←→ Database
    ↓
Real-time updates:
- New medical records
- Access request notifications
- Status updates
- System notifications
```

### Événements WebSocket

```javascript
// Côté serveur
io.emit('newMedicalRecord', data)
io.emit('accessRequestUpdate', data)
io.emit('systemNotification', data)

// Côté client
socket.on('newMedicalRecord', handleNewRecord)
socket.on('accessRequestUpdate', handleAccessUpdate)
socket.on('systemNotification', showNotification)
```

## APIs et Intégrations

### API REST Structure

```
/api/auth/*          # Authentification
  POST /login        # Connexion
  POST /register     # Inscription
  GET  /me          # Profil utilisateur
  POST /logout      # Déconnexion

/api/patients/*      # Gestion patients
  GET    /          # Liste patients
  GET    /:id       # Détails patient
  POST   /unclaimed # Créer patient non réclamé
  GET    /unclaimed/my # Mes patients non réclamés

/api/records/*       # Dossiers médicaux
  GET    /          # Liste dossiers
  POST   /          # Créer dossier
  GET    /:id       # Détails dossier
  PUT    /:id       # Modifier dossier
  DELETE /:id       # Supprimer dossier

/api/access-requests/* # Demandes d'accès
  GET    /          # Liste demandes
  POST   /          # Créer demande
  PUT    /:id       # Modifier statut demande
```

### Standards API

```
Response Format:
{
  "success": boolean,
  "message": string,
  "data": object|array,
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number
  }
}

Error Format:
{
  "success": false,
  "error": true,
  "message": string,
  "validationErrors": array
}
```

## Performance et Scalabilité

### Optimisations Frontend

```
- Code splitting par route
- Lazy loading des composants
- Memoization (React.memo, useMemo)
- Optimistic UI updates
- Service Worker (future)
```

### Optimisations Backend

```
- Database indexing
- Query optimization
- Response caching
- Connection pooling
- Compression middleware
```

### Monitoring

```
- API response times
- Database query performance
- Memory usage
- Error rates
- User activity metrics
```

## Déploiement

### Environnements

```
Development → Staging → Production

Environment Variables:
- NODE_ENV
- DATABASE_URL
- JWT_SECRET
- HEDERA_CONFIG
- FRONTEND_URL
```

### Infrastructure

```
Frontend: Static hosting (Netlify, Vercel)
Backend: Node.js server (PM2, Docker)
Database: SQLite (managed service)
Blockchain: Hedera Mainnet/Testnet
```

## Tests

### Strategy de Test

```
Unit Tests: Services, utilities, helpers
Integration Tests: API endpoints, workflows
Component Tests: React components
E2E Tests: User workflows (future)
```

### Couverture

```
Target: >90% code coverage
Critical paths: 100% coverage
Security functions: 100% coverage
```

## Évolutions Futures

### Roadmap Technique

```
Phase 1: Performance optimization
Phase 2: Mobile app development
Phase 3: Microservices architecture
Phase 4: AI/ML integration
Phase 5: Multi-tenant architecture
```

### Technologies Futures

```
- GraphQL API
- Redis caching
- Elasticsearch
- Kubernetes orchestration
- Serverless functions
```

---

Cette architecture garantit la **scalabilité**, la **sécurité** et la **maintenabilité** de la plateforme FADJMA tout en respectant les standards de l'industrie médicale.