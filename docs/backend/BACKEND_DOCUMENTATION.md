# 🚀 Documentation Backend FADJMA

## 📋 **Vue d'Ensemble**

Le backend FADJMA est une API REST Node.js/Express qui gère l'intégralité de l'écosystème médical décentralisé avec intégration blockchain Hedera.

### **Architecture Générale**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │────│   Backend       │────│   Hedera        │
│   React         │    │   Node.js       │    │   Blockchain    │
│                 │    │   Express       │    │                 │
│ - Dashboard     │    │ - API REST      │    │ - HCS Topics    │
│ - Auth Forms    │    │ - Auth JWT      │    │ - Transactions  │
│ - Medical UI    │    │ - SQLite DB     │    │ - Mirror Node   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Stack Technique**
- **Runtime** : Node.js 18+
- **Framework** : Express.js
- **Base de données** : SQLite avec Sequelize ORM
- **Authentification** : JWT (JSON Web Tokens)
- **Blockchain** : Hedera SDK (@hashgraph/sdk)
- **Logging** : Winston (4 fichiers spécialisés)
- **Validation** : Express-validator
- **CORS** : Configuration sécurisée
- **Monitoring** : Système custom temps réel

---

## 📁 **Structure du Projet**

```
backend/
├── src/
│   ├── app.js                 # Point d'entrée principal
│   ├── config/
│   │   ├── database.js        # Configuration Sequelize
│   │   └── hedera.js          # Configuration Hedera
│   ├── controllers/           # Logique métier des routes
│   │   ├── authController.js
│   │   ├── recordController.js
│   │   ├── adminController.js
│   │   ├── verificationController.js
│   │   └── prescriptionController.js
│   ├── middleware/            # Middlewares Express
│   │   ├── auth.js
│   │   ├── validation.js
│   │   └── requestLogger.js
│   ├── models/                # Modèles Sequelize
│   │   ├── index.js
│   │   ├── BaseUser.js
│   │   ├── MedicalRecord.js
│   │   ├── Prescription.js
│   │   └── MedicalRecordAccessRequest.js
│   ├── routes/                # Définition des routes
│   │   ├── authRoutes.js
│   │   ├── recordRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── verificationRoutes.js
│   │   ├── prescriptionRoutes.js
│   │   ├── monitoringRoutes.js
│   │   └── logRoutes.js
│   ├── services/              # Services métier
│   │   ├── hederaService.js
│   │   ├── hashService.js
│   │   ├── mirrorNodeService.js
│   │   ├── medicalRecordService.js
│   │   ├── monitoringService.js
│   │   └── nftService.js
│   └── utils/
│       └── logger.js          # Configuration Winston
├── logs/                      # Fichiers de logs
│   ├── client-actions.log
│   ├── server-internal.log
│   ├── errors.log
│   └── combined.log
├── package.json
├── .env.example
└── database.sqlite            # Base SQLite locale
```

---

## 🔧 **Configuration et Démarrage**

### **Variables d'Environnement**
```env
# Serveur
PORT=5000
NODE_ENV=development

# Base de données SQLite
DB_PATH=./database.sqlite

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Verification Mode
USE_MIRROR_NODE=false

# Hedera EC25519 (Primary Account)
HEDERA_ACCOUNT_ID=0.0.xxxxxx
HEDERA_PRIVATE_KEY=302e020100300506032b657004220420xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
HEDERA_TOPIC_ID=0.0.xxxxxx
HEDERA_NETWORK=testnet

# Hedera ECDSA (Production Account)
HEDERA_ECDSA_ACCOUNT_ID=0.0.6089195
HEDERA_ECDSA_PRIVATE_KEY=3030020100300706052b8104000a0422042xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
HEDERA_ECDSA_TOPIC_ID=0.0.6854064

# CORS
FRONTEND_URL=http://localhost:3000
```

### **Installation et Lancement**
```bash
# Installation dépendances
npm install

# Initialisation base de données
npm run init:db

# Démarrage développement
npm run dev

# Démarrage production
npm start

# Tests
npm test
```

### **Scripts Package.json**
```json
{
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "init:db": "node scripts/initDatabase.js",
    "seed": "node scripts/seedDatabase.js",
    "test": "jest",
    "test:integration": "node backend/test-all-features.js"
  }
}
```

---

## 🗄️ **Base de Données SQLite**

### **Modèles Principaux**

#### **BaseUser** - Utilisateurs du système
```javascript
{
  id: UUID (PRIMARY KEY),
  email: STRING UNIQUE,
  password: STRING (bcrypt),
  role: ENUM('patient', 'doctor', 'pharmacy', 'admin'),
  firstName: STRING,
  lastName: STRING,
  phone: STRING,
  // Champs spécifiques patients
  dateOfBirth: DATE,
  gender: ENUM('male', 'female', 'other'),
  address: TEXT,
  emergencyContact: STRING,
  socialSecurityNumber: STRING,
  // Champs spécifiques médecins
  licenseNumber: STRING,
  specialization: STRING,
  hospitalAffiliation: STRING,
  // Liens
  createdByDoctorId: UUID, // Pour patients créés par médecin
  patientIdentifier: STRING, // Identifiant patient unique
  // Timestamps
  createdAt: DATE,
  updatedAt: DATE
}
```

#### **MedicalRecord** - Dossiers médicaux
```javascript
{
  id: UUID (PRIMARY KEY),
  patientId: UUID (FOREIGN KEY → BaseUser),
  doctorId: UUID (FOREIGN KEY → BaseUser),
  type: ENUM('consultation', 'prescription', 'vaccination', 'allergy', 'surgery', 'laboratory', 'radiology', 'emergency', 'chronic_disease', 'mental_health', 'pediatric', 'gynecology'),
  title: STRING,
  description: TEXT,
  diagnosis: TEXT,
  prescription: JSON, // Array of medications
  metadata: JSON, // Type-specific data
  attachments: JSON, // File references

  // Blockchain integration
  hash: STRING, // SHA-256 of record data
  hederaTransactionId: STRING,
  hederaSequenceNumber: INTEGER,
  hederaTopicId: STRING,
  isVerified: BOOLEAN DEFAULT false,
  lastVerifiedAt: DATE,

  // Timestamps
  createdAt: DATE,
  updatedAt: DATE
}
```

#### **Prescription** - Prescriptions détaillées
```javascript
{
  id: UUID (PRIMARY KEY),
  matricule: STRING UNIQUE, // Format: PRX-YYYYMMDD-XXXX
  patientId: UUID (FOREIGN KEY → BaseUser),
  doctorId: UUID (FOREIGN KEY → BaseUser),
  pharmacyId: UUID (FOREIGN KEY → BaseUser),
  medicalRecordId: UUID (FOREIGN KEY → MedicalRecord),

  // Prescription details
  medication: STRING,
  dosage: STRING,
  instructions: TEXT,
  quantity: INTEGER,

  // Workflow status
  issueDate: DATE,
  expiryDate: DATE,
  deliveryStatus: ENUM('pending', 'dispensed', 'expired'),
  deliveryDate: DATE,

  // Blockchain integration
  deliveryConfirmationHash: STRING,
  hederaTransactionId: STRING,
  hederaSequenceNumber: INTEGER,
  hederaTopicId: STRING,

  // Timestamps
  createdAt: DATE,
  updatedAt: DATE
}
```

#### **MedicalRecordAccessRequest** - Demandes d'accès
```javascript
{
  id: UUID (PRIMARY KEY),
  patientId: UUID (FOREIGN KEY → BaseUser),
  requesterId: UUID (FOREIGN KEY → BaseUser),
  status: ENUM('pending', 'approved', 'denied', 'expired'),
  requestReason: TEXT,
  responseMessage: TEXT,
  requestDate: DATE,
  responseDate: DATE,
  expiresAt: DATE,

  // Timestamps
  createdAt: DATE,
  updatedAt: DATE
}
```

### **Relations Base de Données**
```javascript
// Associations Sequelize
BaseUser.hasMany(MedicalRecord, { foreignKey: 'patientId', as: 'patientRecords' });
BaseUser.hasMany(MedicalRecord, { foreignKey: 'doctorId', as: 'doctorRecords' });
BaseUser.hasMany(Prescription, { foreignKey: 'patientId', as: 'patientPrescriptions' });
BaseUser.hasMany(Prescription, { foreignKey: 'doctorId', as: 'doctorPrescriptions' });
BaseUser.hasMany(Prescription, { foreignKey: 'pharmacyId', as: 'pharmacyPrescriptions' });

MedicalRecord.belongsTo(BaseUser, { foreignKey: 'patientId', as: 'patient' });
MedicalRecord.belongsTo(BaseUser, { foreignKey: 'doctorId', as: 'doctor' });
MedicalRecord.hasMany(Prescription, { foreignKey: 'medicalRecordId' });

Prescription.belongsTo(BaseUser, { foreignKey: 'patientId', as: 'patient' });
Prescription.belongsTo(BaseUser, { foreignKey: 'doctorId', as: 'doctor' });
Prescription.belongsTo(BaseUser, { foreignKey: 'pharmacyId', as: 'pharmacy' });
Prescription.belongsTo(MedicalRecord, { foreignKey: 'medicalRecordId' });
```

---

## 🔐 **Authentification et Autorisation**

### **JWT Strategy**
```javascript
// Génération token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Middleware authentification
const auth = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Accès refusé - Token requis' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await BaseUser.findByPk(decoded.id);
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token invalide' });
  }
};
```

### **Contrôle d'Accès par Rôle (RBAC)**
```javascript
// Middleware rôles
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Accès refusé - Permissions insuffisantes'
      });
    }
    next();
  };
};

// Usage dans les routes
router.get('/admin/users', auth, requireRole(['admin']), adminController.getUsers);
router.post('/records', auth, requireRole(['doctor']), recordController.create);
router.get('/prescriptions', auth, requireRole(['patient', 'doctor', 'pharmacy']), prescriptionController.getAll);
```

---

## 🌐 **API REST Endpoints**

### **Authentication Routes** (`/api/auth`)
```javascript
POST   /api/auth/register     // Inscription utilisateur
POST   /api/auth/login        // Connexion
POST   /api/auth/logout       // Déconnexion
GET    /api/auth/me           // Profil utilisateur
PUT    /api/auth/profile      // Mise à jour profil
POST   /api/auth/change-password // Changement mot de passe
```

### **Medical Records Routes** (`/api/records`)
```javascript
GET    /api/records           // Liste dossiers (avec filtres)
POST   /api/records           // Création dossier
GET    /api/records/:id       // Détail dossier
PUT    /api/records/:id       // Mise à jour dossier
DELETE /api/records/:id       // Suppression dossier
POST   /api/records/:id/share // Partage dossier
```

### **Prescription Routes** (`/api/prescriptions`)
```javascript
GET    /api/prescriptions     // Liste prescriptions
POST   /api/prescriptions     // Création prescription
GET    /api/prescriptions/:id // Détail prescription
PUT    /api/prescriptions/:id // Mise à jour prescription
POST   /api/prescriptions/search // Recherche par matricule
POST   /api/prescriptions/:id/dispense // Dispensation pharmacie
```

### **Verification Routes** (`/api/verify`)
```javascript
POST   /api/verify/record/:id // Vérification intégrité dossier
POST   /api/verify/prescription/:id // Vérification prescription
GET    /api/verify/hedera/:transactionId // Vérification Hedera
```

### **Admin Routes** (`/api/admin`)
```javascript
GET    /api/admin/users       // Gestion utilisateurs
GET    /api/admin/records     // Vue admin dossiers
GET    /api/admin/stats       // Statistiques système
POST   /api/admin/export      // Export données
GET    /api/admin/registry    // Registre Hedera
POST   /api/admin/update-statuses // Mise à jour statuts
```

### **Monitoring Routes** (`/api/monitoring`)
```javascript
GET    /api/monitoring/metrics // Métriques système
GET    /api/monitoring/health  // Santé du système
GET    /api/monitoring/alerts  // Alertes actives
GET    /api/monitoring/logs    // Logs système
POST   /api/monitoring/reset   // Reset métriques
```

---

## ⛓️ **Intégration Blockchain Hedera**

### **Configuration Hedera**
```javascript
// config/hedera.js
const { Client, PrivateKey, AccountId } = require('@hashgraph/sdk');

const client = Client.forTestnet().setOperator(
  AccountId.fromString(process.env.HEDERA_ACCOUNT_ID),
  PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY)
);

const TOPIC_ID = process.env.HEDERA_TOPIC_ID || '0.0.6854064';
```

### **Service Hedera Principal**
```javascript
// services/hederaService.js
class HederaService {
  // Ancrage enrichi de données médicales
  async anchorRecord(record) {
    const enrichedData = this.enrichMedicalData(record);
    const message = JSON.stringify(enrichedData);

    // Envoi vers HCS Topic
    const transaction = new TopicMessageSubmitTransaction()
      .setTopicId(TOPIC_ID)
      .setMessage(message);

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);

    return {
      transactionId: response.transactionId.toString(),
      sequenceNumber: receipt.topicSequenceNumber,
      topicId: TOPIC_ID,
      hash: this.calculateHash(enrichedData),
      timestamp: new Date()
    };
  }

  // Enrichissement spécialisé par type
  enrichMedicalData(record) {
    const baseData = {
      recordId: record.id,
      hash: this.calculateHash(record),
      timestamp: new Date().toISOString(),
      type: 'MEDICAL_RECORD',
      actionType: 'CREATED',
      patientId: record.patientId,
      doctorId: record.doctorId,
      recordType: record.type,
      version: '2.0' // Innovation enrichie
    };

    // Classification automatique
    const consultationType = this.classifyConsultationType(record.type);

    // Extraction données spécialisées
    const medicalData = this.extractMedicalData(record, consultationType);

    return {
      ...baseData,
      ...record,
      consultationType,
      medicalData
    };
  }

  // Classification intelligente 12+ types
  classifyConsultationType(type) {
    const mapping = {
      'consultation': 'GENERAL_CONSULTATION',
      'prescription': 'PRESCRIPTION',
      'vaccination': 'VACCINATION',
      'allergy': 'ALLERGY_MANAGEMENT',
      'surgery': 'SURGICAL_PROCEDURE',
      'laboratory': 'LAB_RESULTS',
      'radiology': 'IMAGING_STUDY',
      'emergency': 'EMERGENCY_CARE',
      'chronic_disease': 'CHRONIC_DISEASE_MANAGEMENT',
      'mental_health': 'MENTAL_HEALTH',
      'pediatric': 'PEDIATRIC_CARE',
      'gynecology': 'GYNECOLOGICAL_CARE'
    };
    return mapping[type] || 'GENERAL_CONSULTATION';
  }

  // Extraction spécialisée selon le type
  extractMedicalData(record, consultationType) {
    const baseData = {
      symptoms: this.extractSymptoms(record.description),
      treatments: this.extractTreatments(record.description),
      recommendations: this.extractRecommendations(record.description),
      vitalSigns: this.extractVitalSigns(record.description),
      allergies: this.extractAllergies(record.description),
      medications: this.extractMedications(record.prescription)
    };

    // Enrichissement spécialisé par type
    switch (consultationType) {
      case 'VACCINATION':
        return {
          ...baseData,
          vaccineType: this.extractVaccineType(record),
          batchNumber: record.metadata?.batchNumber,
          administrationSite: this.extractAdministrationSite(record.description),
          nextDoseDate: this.calculateNextDose(record.metadata)
        };

      case 'PRESCRIPTION':
        return {
          ...baseData,
          prescriptionType: this.categorizePrescription(record.prescription),
          drugInteractions: this.checkDrugInteractions(record.prescription),
          dosageOptimization: this.optimizeDosage(record.prescription)
        };

      case 'LAB_RESULTS':
        return {
          ...baseData,
          testType: record.metadata?.testType,
          normalRanges: this.getNormalRanges(record.metadata?.testType),
          criticalValues: this.identifyCriticalValues(record.description)
        };

      default:
        return baseData;
    }
  }
}
```

### **Service Mirror Node**
```javascript
// services/mirrorNodeService.js
class MirrorNodeService {
  async getTransactionDetails(transactionId) {
    // Conversion format ID pour Mirror Node API
    const formattedId = this.formatTransactionId(transactionId);

    const url = `https://testnet.mirrornode.hedera.com/api/v1/transactions/${formattedId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Mirror Node error: ${response.status}`);
    }

    return await response.json();
  }

  // Conversion @-format vers --format
  formatTransactionId(transactionId) {
    if (transactionId.includes('@')) {
      return transactionId.replace('@', '-').replace('.', '-');
    }
    return transactionId;
  }

  async getTopicMessages(topicId, limit = 10) {
    const url = `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages?limit=${limit}&order=desc`;
    const response = await fetch(url);
    return await response.json();
  }
}
```

---

## 📊 **Système de Monitoring**

### **MonitoringService** - Métriques temps réel
```javascript
// services/monitoringService.js
class MonitoringService extends EventEmitter {
  constructor() {
    super();
    this.metrics = {
      hedera: {
        totalTransactions: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
        averageResponseTime: 0,
        uptime: 100
      },
      system: {
        memoryUsage: 0,
        cpuUsage: 0,
        requestsPerMinute: 0,
        errorRate: 0
      },
      database: {
        totalRecords: 0,
        prescriptions: 0,
        verificationRequests: 0
      }
    };

    this.startPeriodicMonitoring();
  }

  // Enregistrement transaction Hedera
  recordHederaTransaction(status, responseTime, details = {}) {
    this.metrics.hedera.totalTransactions++;

    if (status === 'SUCCESS') {
      this.metrics.hedera.successfulTransactions++;
      this.metrics.hedera.lastSuccessTime = new Date();
    } else {
      this.metrics.hedera.failedTransactions++;
    }

    // Calcul uptime
    const successRate = this.metrics.hedera.successfulTransactions /
                       this.metrics.hedera.totalTransactions;
    this.metrics.hedera.uptime = Math.round(successRate * 100);

    // Émission événement pour WebSocket
    this.emit('hederaTransaction', {
      status,
      responseTime,
      metrics: this.metrics.hedera
    });
  }

  // Enregistrement opération DB
  recordDatabaseOperation(type, queryTime, details = {}) {
    switch(type) {
      case 'record':
        this.metrics.database.totalRecords++;
        break;
      case 'prescription':
        this.metrics.database.prescriptions++;
        break;
      case 'verification':
        this.metrics.database.verificationRequests++;
        break;
    }
  }
}
```

### **Logger Winston** - 4 fichiers spécialisés
```javascript
// utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Actions utilisateurs
    new winston.transports.File({
      filename: 'logs/client-actions.log',
      level: 'info'
    }),

    // Opérations serveur Hedera
    new winston.transports.File({
      filename: 'logs/server-internal.log'
    }),

    // Erreurs système
    new winston.transports.File({
      filename: 'logs/errors.log',
      level: 'error'
    }),

    // Tous les logs
    new winston.transports.File({
      filename: 'logs/combined.log'
    }),

    // Console en développement
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

---

## 🔍 **Services Métier**

### **HashService** - Vérification intégrité
```javascript
// services/hashService.js
class HashService {
  calculateHash(data) {
    const crypto = require('crypto');
    const normalizedData = this.normalizeData(data);
    return crypto.createHash('sha256')
                 .update(JSON.stringify(normalizedData))
                 .digest('hex');
  }

  async verifyHashWithHCS(record) {
    try {
      // Hash actuel du record
      const currentHash = this.calculateHash(record);

      // Récupération données Hedera
      const hederaData = await mirrorNodeService.getTransactionDetails(
        record.hederaTransactionId
      );

      // Comparaison avec hash stocké
      const hashMatch = currentHash === record.hash;
      const hederaMatch = hederaData && hederaData.valid_start_timestamp;

      return {
        isFullyVerified: hashMatch && hederaMatch,
        currentHash,
        storedHash: record.hash,
        hederaVerified: hederaMatch,
        localVerified: hashMatch,
        verificationTime: new Date(),
        details: {
          hederaTransaction: hederaData,
          lastModified: record.updatedAt
        }
      };
    } catch (error) {
      logger.error('Hash verification failed:', error);
      return {
        isFullyVerified: false,
        error: error.message
      };
    }
  }
}
```

### **MedicalRecordService** - Logique métier
```javascript
// services/medicalRecordService.js
class MedicalRecordService {
  async createRecord(recordData, doctorId) {
    const transaction = await sequelize.transaction();

    try {
      // Création record en DB
      const record = await MedicalRecord.create({
        ...recordData,
        doctorId
      }, { transaction });

      // Ancrage enrichi sur Hedera
      const hederaResult = await hederaService.anchorRecord(record);

      // Mise à jour avec infos Hedera
      await record.update({
        hash: hederaResult.hash,
        hederaTransactionId: hederaResult.transactionId,
        hederaSequenceNumber: hederaResult.sequenceNumber,
        hederaTopicId: hederaResult.topicId
      }, { transaction });

      // Enregistrement monitoring
      monitoringService.recordDatabaseOperation('record', Date.now() - startTime);

      await transaction.commit();
      return record;

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateRecord(recordId, updateData, userId) {
    // Vérification permissions
    const record = await this.getRecordWithPermissions(recordId, userId);

    // Mise à jour
    await record.update(updateData);

    // Re-ancrage si données critiques modifiées
    if (this.requiresReAnchoring(updateData)) {
      const hederaResult = await hederaService.anchorRecord(record);
      await record.update({
        hash: hederaResult.hash,
        hederaTransactionId: hederaResult.transactionId
      });
    }

    return record;
  }
}
```

---

## 🧪 **Tests et Validation**

### **Tests d'Intégration**
```javascript
// Fichiers de test existants
backend/test-enriched-anchoring.js     // Test ancrage enrichi
backend/test-all-types-anchoring.js    // Test 12+ types consultations
backend/test-hcs-verification.js       // Test vérification HCS
backend/test-logging.js                // Test système logging
```

### **Tests Unitaires**
```javascript
// Exemple test controller
describe('RecordController', () => {
  test('should create medical record with Hedera anchoring', async () => {
    const recordData = {
      type: 'vaccination',
      title: 'COVID-19 Vaccine',
      description: 'Third dose administered',
      patientId: 'patient-uuid'
    };

    const response = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send(recordData)
      .expect(201);

    expect(response.body.record).toHaveProperty('hederaTransactionId');
    expect(response.body.record.type).toBe('vaccination');
  });
});
```

---

## 🚀 **Déploiement et Production**

### **Configuration Production**
```javascript
// Optimisations production
if (process.env.NODE_ENV === 'production') {
  // Compression responses
  app.use(compression());

  // Rate limiting
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // Limite par IP
  }));

  // Security headers
  app.use(helmet());

  // HTTPS only
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

### **Monitoring Production**
```javascript
// Health check endpoint
app.get('/health', (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    hedera: {
      connected: hederaService.isConnected(),
      lastTransaction: monitoringService.metrics.hedera.lastSuccessTime
    },
    database: {
      connected: sequelize.authenticate()
    }
  };

  res.json(health);
});
```

---

## 📈 **Performance et Optimisation**

### **Stratégies Actuelles**
- **Pagination** : Limite 10-50 résultats par défaut
- **Index DB** : Sur colonnes fréquemment recherchées
- **Retry Logic** : 3 tentatives pour Hedera avec backoff
- **Cache** : Headers cache pour ressources statiques
- **Compression** : Gzip pour responses JSON

### **Optimisations Futures**
- **Redis Cache** : Cache intelligent requêtes fréquentes
- **Batch Processing** : Groupement transactions Hedera
- **Database Optimization** : Migration PostgreSQL pour scale
- **CDN** : Fichiers statiques et images médicales
- **Load Balancing** : Multiples instances backend

---

## 🔒 **Sécurité**

### **Mesures Implémentées**
- **JWT** : Tokens signés avec rotation
- **bcrypt** : Hash passwords (rounds: 12)
- **CORS** : Configuration restrictive
- **Input Validation** : Express-validator sur toutes les routes
- **SQL Injection** : Requêtes paramétrées Sequelize
- **Rate Limiting** : Protection DDoS
- **Audit Trail** : Logs immutables de toutes les actions

### **Sécurité Future**
- **Chiffrement AES-256** : Données sensibles
- **WAF** : Web Application Firewall
- **2FA** : Authentification double facteur
- **Vault** : Gestion sécurisée des secrets
- **SIEM** : Monitoring sécurité temps réel

---

## 📞 **Support et Maintenance**

### **Logs et Debugging**
```bash
# Consulter les logs
tail -f logs/combined.log
tail -f logs/errors.log

# Monitoring en temps réel
curl http://localhost:5000/api/monitoring/health
curl http://localhost:5000/api/monitoring/metrics
```

### **Commandes Utiles**
```bash
# Reset base de données
rm database.sqlite && npm run init:db

# Reset métriques monitoring
curl -X POST http://localhost:5000/api/monitoring/reset

# Test connectivité Hedera
node scripts/testHedera.js

# Backup base de données
cp database.sqlite backups/db-$(date +%Y%m%d).sqlite
```

---

**Documentation Backend v1.0** - Mise à jour : 28 septembre 2025
**Contact** : équipe technique FADJMA
**Prochaine révision** : Décembre 2025

---

*Backend FADJMA - Innovation blockchain au service de la santé* ⚕️