# 📋 PLAN D'ARCHITECTURE COMPLET - FADJMA MEDICAL SYSTEM

**Date:** 2025-09-30
**Version:** 1.0
**Objectif:** Corriger les erreurs existantes et implémenter les nouvelles fonctionnalités

---

## 📌 TABLE DES MATIÈRES

1. [Corrections des Erreurs Existantes](#1-corrections-des-erreurs-existantes)
2. [Architecture Base de Données](#2-architecture-base-de-données)
3. [Backend - API & Services](#3-backend---api--services)
4. [Frontend - UI/UX](#4-frontend---uiux)
5. [Sécurité & Permissions](#5-sécurité--permissions)
6. [Plan de Migration](#6-plan-de-migration)
7. [Points Critiques](#7-points-critiques)

---

## 1. CORRECTIONS DES ERREURS EXISTANTES

### 🔴 Problème 1: Erreur 404 sur `/api/admin/status/update`

**Diagnostic:**
- Route manquante dans `adminRoutes.js`
- Contrôleur `adminController.js` ne contient pas de fonction `updateStatus`

**Solution:**

#### Backend - Ajouter la route et le contrôleur

**Fichier:** `/backend/src/controllers/adminController.js`
```javascript
// Nouvelle fonction à ajouter
exports.updateSystemStatus = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const { component, status, reason } = req.body;

    // Validation
    if (!component || !status) {
      return res.status(400).json({
        success: false,
        message: 'Component et status sont requis'
      });
    }

    // Enregistrer dans une table SystemStatus (à créer)
    const statusUpdate = await SystemStatus.create({
      component,
      status,
      reason,
      updatedBy: req.user.id,
      timestamp: new Date()
    });

    logger.info(`System status updated by admin ${req.user.id}: ${component} -> ${status}`);

    res.json({
      success: true,
      statusUpdate
    });

  } catch (error) {
    logger.error('Error updating system status:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut',
      error: error.message
    });
  }
};
```

**Fichier:** `/backend/src/routes/adminRoutes.js`
```javascript
// Ajouter cette route
router.put('/status/update', adminController.updateSystemStatus);
```

---

### 🔴 Problème 2: Export JSON/CSV défectueux

**Diagnostic:**
- La fonction `exportRegistryData` appelle `getRegistryData` de manière incorrecte (ligne 448)
- Tentative de passer un objet modifié au lieu d'utiliser une fonction dédiée

**Solution:**

**Fichier:** `/backend/src/controllers/adminController.js`
```javascript
// Remplacer la fonction exportRegistryData
exports.exportRegistryData = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const { format = 'json', type = 'all', dateRange = '30days' } = req.query;

    // Construire le whereClause directement
    let whereClause = {};

    if (dateRange !== 'all') {
      const now = new Date();
      const cutoffDays = {
        '1day': 1,
        '7days': 7,
        '30days': 30
      };
      if (cutoffDays[dateRange]) {
        whereClause.createdAt = {
          [Op.gte]: new Date(now.getTime() - cutoffDays[dateRange] * 24 * 60 * 60 * 1000)
        };
      }
    }

    const exportData = [];

    // Récupérer les données sans limite
    if (type === 'all' || type === 'medical_record') {
      const records = await MedicalRecord.findAll({
        where: whereClause,
        include: [
          { model: BaseUser, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: BaseUser, as: 'doctor', attributes: ['id', 'firstName', 'lastName', 'email'] }
        ],
        order: [['createdAt', 'DESC']]
      });

      records.forEach(record => {
        exportData.push({
          id: record.id,
          type: 'medical_record',
          timestamp: record.createdAt,
          transactionId: record.hederaTransactionId,
          hash: record.hash,
          status: record.isVerified ? 'verified' : 'pending',
          patientId: record.patientId,
          patientName: `${record.patient?.firstName} ${record.patient?.lastName}`,
          doctorId: record.doctorId,
          doctorName: `${record.doctor?.firstName} ${record.doctor?.lastName}`,
          recordType: record.type,
          title: record.title
        });
      });
    }

    if (type === 'all' || type === 'prescription') {
      const prescriptions = await Prescription.findAll({
        where: { ...whereClause, matricule: { [Op.not]: null } },
        include: [
          { model: BaseUser, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: BaseUser, as: 'doctor', attributes: ['id', 'firstName', 'lastName', 'email'] }
        ],
        order: [['createdAt', 'DESC']]
      });

      prescriptions.forEach(prescription => {
        exportData.push({
          id: prescription.id,
          type: 'prescription',
          timestamp: prescription.createdAt,
          transactionId: prescription.hederaTransactionId,
          hash: prescription.deliveryConfirmationHash,
          status: prescription.isVerified ? 'verified' : 'pending',
          matricule: prescription.matricule,
          patientId: prescription.patientId,
          patientName: `${prescription.patient?.firstName} ${prescription.patient?.lastName}`,
          doctorId: prescription.doctorId,
          doctorName: `${prescription.doctor?.firstName} ${prescription.doctor?.lastName}`,
          medication: prescription.medication,
          dosage: prescription.dosage,
          deliveryStatus: prescription.deliveryStatus
        });
      });
    }

    if (format === 'csv') {
      // Conversion en CSV
      if (exportData.length === 0) {
        return res.status(404).json({ success: false, message: 'Aucune donnée à exporter' });
      }

      const csvHeaders = Object.keys(exportData[0]).join(',');
      const csvRows = exportData.map(row =>
        Object.values(row).map(val => `"${val || ''}"`).join(',')
      ).join('\n');
      const csvContent = `${csvHeaders}\n${csvRows}`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="registry-export-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send('\ufeff' + csvContent); // BOM pour UTF-8
    } else {
      // Export JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="registry-export-${new Date().toISOString().split('T')[0]}.json"`);
      return res.json({
        exportedAt: new Date().toISOString(),
        filters: { type, dateRange },
        totalRecords: exportData.length,
        data: exportData
      });
    }

  } catch (error) {
    logger.error('Error exporting registry data:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'export des données',
      error: error.message
    });
  }
};
```

---


### 🔴 Problème 4: Afficher les logs dans le dashboard admin

**Solution:**

#### Backend - Ajouter endpoint logs

**Fichier:** `/backend/src/controllers/adminController.js`
```javascript
exports.getSystemLogs = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const { limit = 100, level = 'all', search, startDate, endDate } = req.query;

    // Lire les logs depuis le fichier (winston logs)
    const fs = require('fs');
    const path = require('path');
    const readline = require('readline');

    const logFilePath = path.join(__dirname, '../../logs/combined.log');
    const logs = [];

    // Lire le fichier ligne par ligne
    const fileStream = fs.createReadStream(logFilePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      try {
        const logEntry = JSON.parse(line);

        // Filtrer par niveau
        if (level !== 'all' && logEntry.level !== level) continue;

        // Filtrer par recherche
        if (search && !JSON.stringify(logEntry).toLowerCase().includes(search.toLowerCase())) continue;

        // Filtrer par date
        if (startDate && new Date(logEntry.timestamp) < new Date(startDate)) continue;
        if (endDate && new Date(logEntry.timestamp) > new Date(endDate)) continue;

        logs.push(logEntry);

        // Limiter le nombre de résultats
        if (logs.length >= parseInt(limit)) break;

      } catch (parseError) {
        // Ignorer les lignes invalides
      }
    }

    // Trier par timestamp décroissant
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      logs: logs.slice(0, parseInt(limit)),
      total: logs.length,
      filters: { level, search, startDate, endDate }
    });

  } catch (error) {
    logger.error('Error fetching system logs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des logs',
      error: error.message
    });
  }
};
```

**Fichier:** `/backend/src/routes/adminRoutes.js`
```javascript
// Ajouter cette route
router.get('/logs', adminController.getSystemLogs);
```

#### Frontend - Afficher les logs

**Fichier:** `/frontend/src/services/adminService.js`
```javascript
// Ajouter cette fonction
export const getSystemLogs = async (limit = 100, level = null) => {
  const params = new URLSearchParams({ limit });
  if (level) params.append('level', level);

  const response = await api.get(`/admin/logs?${params}`);
  return response.data;
};
```

**Composant Frontend:**
```jsx
// Dans AdminMonitoring.jsx - Section Logs
<div className="bg-white rounded-lg shadow p-6">
  <h3 className="text-lg font-semibold mb-4">Logs Système</h3>

  <div className="flex gap-4 mb-4">
    <select
      value={selectedLogType}
      onChange={(e) => setSelectedLogType(e.target.value)}
      className="px-3 py-2 border rounded"
    >
      <option value="all">Tous les logs</option>
      <option value="error">Erreurs</option>
      <option value="warn">Avertissements</option>
      <option value="info">Informations</option>
    </select>
  </div>

  <div className="space-y-2 max-h-96 overflow-y-auto">
    {logs.map((log, index) => (
      <div
        key={index}
        className={`p-3 rounded border-l-4 ${
          log.level === 'error' ? 'border-red-500 bg-red-50' :
          log.level === 'warn' ? 'border-yellow-500 bg-yellow-50' :
          'border-blue-500 bg-blue-50'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="font-mono text-sm">{log.message}</p>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(log.timestamp).toLocaleString()}
            </p>
          </div>
          <span className={`px-2 py-1 text-xs rounded ${
            log.level === 'error' ? 'bg-red-200 text-red-800' :
            log.level === 'warn' ? 'bg-yellow-200 text-yellow-800' :
            'bg-blue-200 text-blue-800'
          }`}>
            {log.level}
          </span>
        </div>
      </div>
    ))}
  </div>
</div>
```

---

## 2. ARCHITECTURE BASE DE DONNÉES

### 📊 Nouveaux Modèles à Créer

#### 2.1. Modèle `Appointment` (Rendez-vous)

**Fichier:** `/backend/src/models/Appointment.js`
```javascript
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  patientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'BaseUsers',
      key: 'id'
    }
  },
  doctorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'BaseUsers',
      key: 'id'
    }
  },
  specialtyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Specialties',
      key: 'id'
    }
  },
  appointmentDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  appointmentTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER, // en minutes
    defaultValue: 30
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no_show', 'emergency'),
    defaultValue: 'pending'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isEmergency: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  emergencyApprovedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'BaseUsers',
      key: 'id'
    }
  },
  emergencyApprovedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  managedBy: {
    type: DataTypes.UUID, // Assistant/Secrétariat
    allowNull: true,
    references: {
      model: 'BaseUsers',
      key: 'id'
    }
  },
  cancellationReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cancelledBy: {
    type: DataTypes.UUID,
    allowNull: true
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['patientId']
    },
    {
      fields: ['doctorId']
    },
    {
      fields: ['appointmentDate', 'status']
    },
    {
      fields: ['specialtyId']
    }
  ]
});

module.exports = Appointment;
```

#### 2.2. Modèle `Specialty` (Spécialités médicales)

**Fichier:** `/backend/src/models/Specialty.js`
```javascript
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Specialty = sequelize.define('Specialty', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true // Ex: "CARDIO", "GENERAL", "RADIO"
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  dailyAppointmentLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 20,
    comment: 'Nombre maximum de RDV par jour pour cette spécialité'
  },
  averageConsultationDuration: {
    type: DataTypes.INTEGER, // en minutes
    defaultValue: 30
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  color: {
    type: DataTypes.STRING(7), // Couleur hex pour l'UI (#FF5733)
    defaultValue: '#3B82F6'
  },
  icon: {
    type: DataTypes.STRING,
    allowNull: true // Nom de l'icône Lucide
  }
}, {
  timestamps: true
});

module.exports = Specialty;
```

#### 2.3. Modèle `DoctorSpecialty` (Liaison Médecin-Spécialité)

**Fichier:** `/backend/src/models/DoctorSpecialty.js`
```javascript
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DoctorSpecialty = sequelize.define('DoctorSpecialty', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  doctorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'BaseUsers',
      key: 'id'
    }
  },
  specialtyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Specialties',
      key: 'id'
    }
  },
  isPrimary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Spécialité principale du médecin'
  },
  yearsOfExperience: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  certifications: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['doctorId', 'specialtyId']
    }
  ]
});

module.exports = DoctorSpecialty;
```

#### 2.4. Modèle `DoctorAvailability` (Disponibilités médecin)

**Fichier:** `/backend/src/models/DoctorAvailability.js`
```javascript
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DoctorAvailability = sequelize.define('DoctorAvailability', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  doctorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'BaseUsers',
      key: 'id'
    }
  },
  dayOfWeek: {
    type: DataTypes.INTEGER, // 0 = Dimanche, 6 = Samedi
    allowNull: false,
    validate: {
      min: 0,
      max: 6
    }
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  slotDuration: {
    type: DataTypes.INTEGER, // en minutes
    defaultValue: 30
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['doctorId', 'dayOfWeek']
    }
  ]
});

module.exports = DoctorAvailability;
```

#### 2.5. Modèle `SystemStatus` (Statuts système)

**Fichier:** `/backend/src/models/SystemStatus.js`
```javascript
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SystemStatus = sequelize.define('SystemStatus', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  component: {
    type: DataTypes.STRING,
    allowNull: false // Ex: 'hedera', 'database', 'api'
  },
  status: {
    type: DataTypes.ENUM('operational', 'degraded', 'down', 'maintenance'),
    defaultValue: 'operational'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'BaseUsers',
      key: 'id'
    }
  }
}, {
  timestamps: true
});

module.exports = SystemStatus;
```

#### 2.6. Modèle `PrescriptionGroup` (Groupement prescriptions)

**Fichier:** `/backend/src/models/PrescriptionGroup.js`
```javascript
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PrescriptionGroup = sequelize.define('PrescriptionGroup', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  groupMatricule: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Matricule de groupe format: PGR-YYYYMMDD-XXXX'
  },
  patientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'BaseUsers',
      key: 'id'
    }
  },
  doctorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'BaseUsers',
      key: 'id'
    }
  },
  issueDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('pending', 'delivered', 'cancelled'),
    defaultValue: 'pending'
  },
  deliveryStatus: {
    type: DataTypes.STRING,
    defaultValue: 'pending'
  },
  pharmacyId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'BaseUsers',
      key: 'id'
    }
  },
  hederaTransactionId: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = PrescriptionGroup;
```

#### 2.7. Table de liaison `PrescriptionGroupItems`

**Fichier:** `/backend/src/models/PrescriptionGroupItem.js`
```javascript
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PrescriptionGroupItem = sequelize.define('PrescriptionGroupItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  groupId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'PrescriptionGroups',
      key: 'id'
    }
  },
  prescriptionId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Prescriptions',
      key: 'id'
    }
  },
  orderIndex: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['groupId', 'prescriptionId']
    }
  ]
});

module.exports = PrescriptionGroupItem;
```

### 📋 Modifications des Modèles Existants

#### 2.8. Modifier `Doctor.js` - Ajouter spécialité

```javascript
// Ajouter dans Doctor.js
specialty: {
  type: DataTypes.STRING,
  allowNull: true,
  comment: 'DEPRECATED: Utiliser DoctorSpecialty'
},
// Note: Garder pour compatibilité, mais migration vers table DoctorSpecialty
```

#### 2.9. Modifier `BaseUser.js` - Ajouter rôle "assistant"

```javascript
// Dans BaseUser.js, modifier la validation role:
role: {
  type: DataTypes.STRING,
  allowNull: false,
  validate: {
    isIn: [['patient', 'doctor', 'pharmacy', 'admin', 'assistant', 'radiologist']]
  }
}
```

#### 2.10. Modifier `MedicalRecordAccess` - Ajouter mode urgence

```javascript
// Ajouter dans medical_record_access_requests (ou créer modèle)
isEmergency: {
  type: DataTypes.BOOLEAN,
  defaultValue: false
},
emergencyJustification: {
  type: DataTypes.TEXT,
  allowNull: true
},
emergencyApprovedBy: {
  type: DataTypes.UUID,
  allowNull: true,
  references: {
    model: 'BaseUsers',
    key: 'id'
  }
},
emergencyApprovedAt: {
  type: DataTypes.DATE,
  allowNull: true
}
```

---

## 3. BACKEND - API & SERVICES

### 3.1. Nouvelles Routes d'Administration

**Fichier:** `/backend/src/routes/adminRoutes.js`

```javascript
// Ajouter ces routes

// Statuts système
router.put('/status/update', adminController.updateSystemStatus);
router.get('/status', adminController.getSystemStatus);

// Logs
router.get('/logs', adminController.getSystemLogs);

// Gestion des spécialités
router.post('/specialties', adminController.createSpecialty);
router.put('/specialties/:id', adminController.updateSpecialty);
router.delete('/specialties/:id', adminController.deleteSpecialty);
router.put('/specialties/:id/limits', adminController.updateSpecialtyLimits);

// Gestion des assistants
router.post('/assistants', adminController.createAssistant);
router.get('/assistants', adminController.getAssistants);
router.put('/assistants/:id', adminController.updateAssistant);
router.delete('/assistants/:id', adminController.deactivateAssistant);

// Approbation des urgences
router.post('/access-requests/:id/approve-emergency', adminController.approveEmergencyAccess);
router.get('/access-requests/emergency/pending', adminController.getPendingEmergencies);
```

### 3.2. Nouvelles Routes Rendez-vous

**Fichier:** `/backend/src/routes/appointmentRoutes.js` (NOUVEAU)

```javascript
const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Routes publiques (pour voir les spécialités et disponibilités)
router.get('/specialties', appointmentController.getSpecialties);
router.get('/specialties/:specialtyId/doctors', appointmentController.getDoctorsBySpecialty);
router.get('/doctors/:doctorId/availability', appointmentController.getDoctorAvailability);
router.get('/doctors/:doctorId/slots', appointmentController.getAvailableSlots);

// Routes authentifiées - Patients
router.use(authMiddleware);

router.post('/',
  authorize(['patient']),
  appointmentController.createAppointment
);

router.get('/my-appointments',
  authorize(['patient']),
  appointmentController.getMyAppointments
);

router.put('/:id/cancel',
  authorize(['patient', 'assistant']),
  appointmentController.cancelAppointment
);

// Routes Médecins
router.get('/doctor/appointments',
  authorize(['doctor']),
  appointmentController.getDoctorAppointments
);

router.put('/:id/confirm',
  authorize(['doctor', 'assistant']),
  appointmentController.confirmAppointment
);

router.put('/:id/complete',
  authorize(['doctor']),
  appointmentController.completeAppointment
);

// Routes Assistants
router.get('/assistant/appointments',
  authorize(['assistant']),
  appointmentController.getAssistantAppointments
);

router.post('/assistant/create-on-behalf',
  authorize(['assistant']),
  appointmentController.createAppointmentOnBehalf
);

router.get('/assistant/calls',
  authorize(['assistant']),
  appointmentController.getPhoneCalls
);

module.exports = router;
```

### 3.3. Nouvelles Routes Prescriptions Groupées

**Fichier:** `/backend/src/routes/prescriptionGroupRoutes.js` (NOUVEAU)

```javascript
const express = require('express');
const router = express.Router();
const prescriptionGroupController = require('../controllers/prescriptionGroupController');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize');

router.use(authMiddleware);

// Créer un groupe de prescriptions
router.post('/',
  authorize(['doctor']),
  prescriptionGroupController.createPrescriptionGroup
);

// Récupérer un groupe par matricule
router.get('/by-matricule/:groupMatricule',
  authorize(['patient', 'doctor', 'pharmacy']),
  prescriptionGroupController.getGroupByMatricule
);

// Recherche pharmacie
router.get('/pharmacy/search/:groupMatricule',
  authorize(['pharmacy']),
  prescriptionGroupController.searchGroupForPharmacy
);

// Délivrer un groupe complet
router.put('/pharmacy/deliver/:groupMatricule',
  authorize(['pharmacy']),
  prescriptionGroupController.deliverPrescriptionGroup
);

module.exports = router;
```

### 3.4. Service de Chiffrement Hedera Multi-niveaux

**Fichier:** `/backend/src/services/encryptionService.js` (NOUVEAU)

```javascript
const crypto = require('crypto');
const logger = require('../utils/logger');

class EncryptionService {

  constructor() {
    // Différentes clés pour différents niveaux
    this.keys = {
      level1: process.env.ENCRYPTION_KEY_LEVEL1, // Public (metadata)
      level2: process.env.ENCRYPTION_KEY_LEVEL2, // Sensible (dossiers)
      level3: process.env.ENCRYPTION_KEY_LEVEL3  // Très sensible (prescriptions)
    };

    this.algorithm = 'aes-256-gcm';
  }

  /**
   * Chiffrer des données selon le niveau de sécurité
   * @param {Object} data - Données à chiffrer
   * @param {Number} securityLevel - Niveau (1, 2, 3)
   * @returns {Object} Données chiffrées avec IV et tag
   */
  encrypt(data, securityLevel = 2) {
    try {
      const key = this.getKeyForLevel(securityLevel);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(key, 'hex'), iv);

      const dataString = JSON.stringify(data);
      let encrypted = cipher.update(dataString, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      return {
        encrypted: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        securityLevel
      };

    } catch (error) {
      logger.error('Encryption error:', error);
      throw new Error('Erreur lors du chiffrement des données');
    }
  }

  /**
   * Déchiffrer des données
   * @param {Object} encryptedData - Données chiffrées
   * @returns {Object} Données déchiffrées
   */
  decrypt(encryptedData) {
    try {
      const { encrypted, iv, authTag, securityLevel } = encryptedData;
      const key = this.getKeyForLevel(securityLevel);

      const decipher = crypto.createDecipheriv(
        this.algorithm,
        Buffer.from(key, 'hex'),
        Buffer.from(iv, 'hex')
      );

      decipher.setAuthTag(Buffer.from(authTag, 'hex'));

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return JSON.parse(decrypted);

    } catch (error) {
      logger.error('Decryption error:', error);
      throw new Error('Erreur lors du déchiffrement des données');
    }
  }

  /**
   * Obtenir la clé pour un niveau donné
   */
  getKeyForLevel(level) {
    const keyMap = {
      1: this.keys.level1,
      2: this.keys.level2,
      3: this.keys.level3
    };

    if (!keyMap[level]) {
      throw new Error(`Niveau de sécurité invalide: ${level}`);
    }

    return keyMap[level];
  }

  /**
   * Préparer les données pour Hedera avec chiffrement adaptatif
   */
  prepareForHedera(data, recordType) {
    // Déterminer le niveau selon le type
    let securityLevel;
    switch (recordType) {
      case 'prescription':
      case 'dispensation':
        securityLevel = 3; // Très sensible
        break;
      case 'medical_record':
        securityLevel = 2; // Sensible
        break;
      case 'metadata':
      default:
        securityLevel = 1; // Public
    }

    return this.encrypt(data, securityLevel);
  }
}

module.exports = new EncryptionService();
```

### 3.5. Contrôleur Rendez-vous

**Fichier:** `/backend/src/controllers/appointmentController.js` (NOUVEAU - extrait)

```javascript
const { Appointment, Specialty, DoctorAvailability, BaseUser, DoctorSpecialty } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

exports.getSpecialties = async (req, res) => {
  try {
    const specialties = await Specialty.findAll({
      where: { isActive: true },
      attributes: ['id', 'name', 'code', 'description', 'color', 'icon', 'averageConsultationDuration'],
      include: [{
        model: DoctorSpecialty,
        as: 'doctors',
        include: [{
          model: BaseUser,
          as: 'doctor',
          attributes: ['id', 'firstName', 'lastName'],
          where: { isActive: true }
        }]
      }]
    });

    res.json({
      success: true,
      specialties: specialties.map(s => ({
        ...s.toJSON(),
        doctorCount: s.doctors?.length || 0
      }))
    });

  } catch (error) {
    logger.error('Error fetching specialties:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des spécialités'
    });
  }
};

exports.getDoctorsBySpecialty = async (req, res) => {
  try {
    const { specialtyId } = req.params;

    const doctorSpecialties = await DoctorSpecialty.findAll({
      where: { specialtyId },
      include: [{
        model: BaseUser,
        as: 'doctor',
        attributes: ['id', 'firstName', 'lastName', 'email'],
        where: { isActive: true, role: 'doctor' }
      }, {
        model: Specialty,
        as: 'specialty',
        attributes: ['name', 'code']
      }]
    });

    res.json({
      success: true,
      doctors: doctorSpecialties.map(ds => ({
        ...ds.doctor.toJSON(),
        specialty: ds.specialty,
        isPrimary: ds.isPrimary,
        yearsOfExperience: ds.yearsOfExperience
      }))
    });

  } catch (error) {
    logger.error('Error fetching doctors by specialty:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des médecins'
    });
  }
};

exports.getAvailableSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query; // Format: YYYY-MM-DD

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date requise'
      });
    }

    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    // Récupérer les disponibilités du médecin pour ce jour
    const availabilities = await DoctorAvailability.findAll({
      where: {
        doctorId,
        dayOfWeek,
        isActive: true
      }
    });

    if (availabilities.length === 0) {
      return res.json({
        success: true,
        slots: []
      });
    }

    // Récupérer les RDV existants pour ce jour
    const existingAppointments = await Appointment.findAll({
      where: {
        doctorId,
        appointmentDate: date,
        status: { [Op.in]: ['pending', 'confirmed'] }
      }
    });

    // Générer les créneaux disponibles
    const slots = [];
    availabilities.forEach(avail => {
      const slotDuration = avail.slotDuration;
      let currentTime = new Date(`1970-01-01T${avail.startTime}`);
      const endTime = new Date(`1970-01-01T${avail.endTime}`);

      while (currentTime < endTime) {
        const timeStr = currentTime.toTimeString().slice(0, 5);

        // Vérifier si ce créneau est déjà pris
        const isBooked = existingAppointments.some(apt =>
          apt.appointmentTime === timeStr + ':00'
        );

        if (!isBooked) {
          slots.push({
            time: timeStr,
            available: true
          });
        }

        currentTime.setMinutes(currentTime.getMinutes() + slotDuration);
      }
    });

    res.json({
      success: true,
      date: date,
      slots: slots.sort((a, b) => a.time.localeCompare(b.time))
    });

  } catch (error) {
    logger.error('Error fetching available slots:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des créneaux'
    });
  }
};

exports.createAppointment = async (req, res) => {
  try {
    const { doctorId, specialtyId, appointmentDate, appointmentTime, reason } = req.body;
    const patientId = req.user.id;

    // Vérifier la limite quotidienne pour la spécialité
    const specialty = await Specialty.findByPk(specialtyId);
    if (!specialty) {
      return res.status(404).json({
        success: false,
        message: 'Spécialité non trouvée'
      });
    }

    // Compter les RDV existants pour ce jour et cette spécialité
    const appointmentsCount = await Appointment.count({
      where: {
        specialtyId,
        appointmentDate,
        status: { [Op.in]: ['pending', 'confirmed'] }
      }
    });

    if (appointmentsCount >= specialty.dailyAppointmentLimit) {
      return res.status(400).json({
        success: false,
        message: `Limite de rendez-vous atteinte pour cette spécialité (${specialty.dailyAppointmentLimit}/jour)`
      });
    }

    // Vérifier que le créneau est disponible
    const existingAppointment = await Appointment.findOne({
      where: {
        doctorId,
        appointmentDate,
        appointmentTime,
        status: { [Op.in]: ['pending', 'confirmed'] }
      }
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'Ce créneau n\'est plus disponible'
      });
    }

    // Créer le rendez-vous
    const appointment = await Appointment.create({
      patientId,
      doctorId,
      specialtyId,
      appointmentDate,
      appointmentTime,
      reason,
      status: 'pending'
    });

    logger.info(`Appointment created: ${appointment.id} by patient ${patientId}`);

    res.status(201).json({
      success: true,
      appointment
    });

  } catch (error) {
    logger.error('Error creating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du rendez-vous'
    });
  }
};

// ... Autres fonctions (confirmAppointment, cancelAppointment, etc.)
```

### 3.6. Contrôleur Prescriptions Groupées

**Fichier:** `/backend/src/controllers/prescriptionGroupController.js` (NOUVEAU - extrait)

```javascript
const { PrescriptionGroup, PrescriptionGroupItem, Prescription, BaseUser } = require('../models');
const hederaService = require('../services/hederaService');
const logger = require('../utils/logger');
const crypto = require('crypto');

exports.createPrescriptionGroup = async (req, res) => {
  try {
    const { prescriptionIds, patientId } = req.body;
    const doctorId = req.user.id;

    if (!prescriptionIds || prescriptionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Au moins une prescription requise'
      });
    }

    // Vérifier que toutes les prescriptions existent et appartiennent au patient
    const prescriptions = await Prescription.findAll({
      where: {
        id: prescriptionIds,
        patientId,
        doctorId
      }
    });

    if (prescriptions.length !== prescriptionIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Certaines prescriptions sont invalides'
      });
    }

    // Générer le matricule de groupe
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = crypto.randomBytes(2).toString('hex').toUpperCase();
    const groupMatricule = `PGR-${date}-${random}`;

    // Créer le groupe
    const group = await PrescriptionGroup.create({
      groupMatricule,
      patientId,
      doctorId,
      issueDate: new Date()
    });

    // Ajouter les prescriptions au groupe
    await Promise.all(
      prescriptionIds.map((prescriptionId, index) =>
        PrescriptionGroupItem.create({
          groupId: group.id,
          prescriptionId,
          orderIndex: index
        })
      )
    );

    logger.info(`Prescription group created: ${groupMatricule} with ${prescriptionIds.length} items`);

    res.status(201).json({
      success: true,
      group: {
        id: group.id,
        groupMatricule,
        prescriptionCount: prescriptionIds.length,
        prescriptions: prescriptions.map(p => ({
          id: p.id,
          matricule: p.matricule,
          medication: p.medication,
          dosage: p.dosage,
          quantity: p.quantity
        }))
      }
    });

  } catch (error) {
    logger.error('Error creating prescription group:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du groupe de prescriptions'
    });
  }
};

exports.searchGroupForPharmacy = async (req, res) => {
  try {
    const { groupMatricule } = req.params;

    // Rechercher le groupe
    const group = await PrescriptionGroup.findOne({
      where: { groupMatricule },
      include: [{
        model: PrescriptionGroupItem,
        as: 'items',
        include: [{
          model: Prescription,
          as: 'prescription',
          include: [
            { model: BaseUser, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'email'] },
            { model: BaseUser, as: 'doctor', attributes: ['id', 'firstName', 'lastName'] }
          ]
        }],
        order: [['orderIndex', 'ASC']]
      }]
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Groupe de prescriptions non trouvé'
      });
    }

    if (group.status === 'delivered') {
      return res.status(409).json({
        success: false,
        message: 'Ce groupe a déjà été délivré'
      });
    }

    res.json({
      success: true,
      group: {
        id: group.id,
        groupMatricule: group.groupMatricule,
        issueDate: group.issueDate,
        status: group.status,
        patient: group.items[0]?.prescription?.patient,
        doctor: group.items[0]?.prescription?.doctor,
        prescriptions: group.items.map(item => ({
          id: item.prescription.id,
          matricule: item.prescription.matricule,
          medication: item.prescription.medication,
          dosage: item.prescription.dosage,
          quantity: item.prescription.quantity,
          instructions: item.prescription.instructions,
          deliveryStatus: item.prescription.deliveryStatus
        }))
      }
    });

  } catch (error) {
    logger.error('Error searching prescription group:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche du groupe'
    });
  }
};

exports.deliverPrescriptionGroup = async (req, res) => {
  try {
    const { groupMatricule } = req.params;
    const pharmacyId = req.user.id;

    // Récupérer le groupe
    const group = await PrescriptionGroup.findOne({
      where: { groupMatricule },
      include: [{
        model: PrescriptionGroupItem,
        as: 'items',
        include: [{
          model: Prescription,
          as: 'prescription'
        }]
      }]
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Groupe non trouvé'
      });
    }

    // Délivrer toutes les prescriptions du groupe en parallèle
    const deliveryResults = await Promise.all(
      group.items.map(async (item) => {
        try {
          const prescription = item.prescription;

          // Ancrer sur Hedera
          const deliveryData = {
            id: prescription.id,
            matricule: prescription.matricule,
            groupMatricule,
            patientId: prescription.patientId,
            doctorId: prescription.doctorId,
            pharmacyId,
            type: 'prescription_delivery',
            medication: prescription.medication,
            deliveryDate: new Date()
          };

          const hederaResult = await hederaService.anchorRecord(deliveryData);

          // Mettre à jour la prescription
          await prescription.update({
            deliveryStatus: 'delivered',
            deliveryConfirmationHash: hederaResult.hash,
            hederaTransactionId: hederaResult.transactionId,
            pharmacyId,
            isVerified: true,
            verifiedAt: new Date()
          });

          return {
            prescriptionId: prescription.id,
            matricule: prescription.matricule,
            success: true,
            hederaTransactionId: hederaResult.transactionId
          };

        } catch (error) {
          logger.error(`Error delivering prescription ${item.prescriptionId}:`, error);
          return {
            prescriptionId: item.prescriptionId,
            success: false,
            error: error.message
          };
        }
      })
    );

    // Ancrer le groupe lui-même
    try {
      const groupData = {
        groupMatricule,
        patientId: group.patientId,
        doctorId: group.doctorId,
        pharmacyId,
        type: 'prescription_group_delivery',
        prescriptionCount: group.items.length,
        deliveryDate: new Date()
      };

      const groupHederaResult = await hederaService.anchorRecord(groupData);

      // Mettre à jour le groupe
      await group.update({
        status: 'delivered',
        deliveryStatus: 'delivered',
        pharmacyId,
        hederaTransactionId: groupHederaResult.transactionId
      });

    } catch (hederaError) {
      logger.error('Error anchoring group:', hederaError);
    }

    const successful = deliveryResults.filter(r => r.success).length;
    const failed = deliveryResults.filter(r => !r.success).length;

    logger.info(`Group ${groupMatricule} delivered: ${successful} success, ${failed} failed`);

    res.json({
      success: true,
      message: `Groupe délivré avec succès: ${successful} prescription(s)`,
      groupMatricule,
      deliveryResults,
      summary: { successful, failed, total: group.items.length }
    });

  } catch (error) {
    logger.error('Error delivering prescription group:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la délivrance du groupe'
    });
  }
};
```

---

## 4. FRONTEND - UI/UX

### 4.1. Page Prise de Rendez-vous Patient

**Fichier:** `/frontend/src/pages/PatientAppointments.jsx` (NOUVEAU)

```jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, MapPin, Phone } from 'lucide-react';
import { appointmentService } from '../services/appointmentService';
import toast from 'react-hot-toast';

const PatientAppointments = () => {
  const [specialties, setSpecialties] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');
  const [step, setStep] = useState(1); // 1: Spécialité, 2: Médecin, 3: Date/Heure

  useEffect(() => {
    loadSpecialties();
  }, []);

  const loadSpecialties = async () => {
    try {
      const response = await appointmentService.getSpecialties();
      setSpecialties(response.specialties);
    } catch (error) {
      toast.error('Erreur lors du chargement des spécialités');
    }
  };

  const handleSpecialtySelect = async (specialty) => {
    setSelectedSpecialty(specialty);
    try {
      const response = await appointmentService.getDoctorsBySpecialty(specialty.id);
      setDoctors(response.doctors);
      setStep(2);
    } catch (error) {
      toast.error('Erreur lors du chargement des médecins');
    }
  };

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    setStep(3);
  };

  const loadAvailableSlots = async (date) => {
    if (!selectedDoctor) return;

    try {
      const response = await appointmentService.getAvailableSlots(selectedDoctor.id, date);
      setAvailableSlots(response.slots);
    } catch (error) {
      toast.error('Erreur lors du chargement des créneaux');
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    loadAvailableSlots(date);
  };

  const handleSubmit = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      await appointmentService.createAppointment({
        doctorId: selectedDoctor.id,
        specialtyId: selectedSpecialty.id,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        reason
      });

      toast.success('Rendez-vous créé avec succès !');
      // Reset ou redirection
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création du rendez-vous');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Prendre un rendez-vous</h1>

      {/* Étape 1: Sélection spécialité */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Choisissez une spécialité</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {specialties.map(specialty => (
              <div
                key={specialty.id}
                onClick={() => handleSpecialtySelect(specialty)}
                className="p-6 border-2 rounded-lg cursor-pointer hover:border-blue-500 hover:shadow-lg transition"
                style={{ borderColor: specialty.color }}
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">{specialty.icon || '🏥'}</div>
                  <h3 className="font-semibold text-lg">{specialty.name}</h3>
                  <p className="text-sm text-gray-600 mt-2">{specialty.description}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {specialty.doctorCount} médecin(s) disponible(s)
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Étape 2: Sélection médecin */}
      {step === 2 && (
        <div>
          <button
            onClick={() => setStep(1)}
            className="mb-4 text-blue-600 hover:underline"
          >
            ← Retour aux spécialités
          </button>

          <h2 className="text-xl font-semibold mb-4">
            Choisissez un médecin - {selectedSpecialty?.name}
          </h2>

          <div className="space-y-4">
            {doctors.map(doctor => (
              <div
                key={doctor.id}
                onClick={() => handleDoctorSelect(doctor)}
                className="p-4 border rounded-lg cursor-pointer hover:border-blue-500 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Dr. {doctor.firstName} {doctor.lastName}</h3>
                      <p className="text-sm text-gray-600">
                        {doctor.yearsOfExperience} ans d'expérience
                      </p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Choisir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Étape 3: Date et heure */}
      {step === 3 && (
        <div>
          <button
            onClick={() => setStep(2)}
            className="mb-4 text-blue-600 hover:underline"
          >
            ← Retour aux médecins
          </button>

          <h2 className="text-xl font-semibold mb-4">
            Choisissez la date et l'heure
          </h2>

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-2 border rounded"
              />
            </div>

            {selectedDate && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Créneaux disponibles</label>
                <div className="grid grid-cols-4 gap-2">
                  {availableSlots.map(slot => (
                    <button
                      key={slot.time}
                      onClick={() => setSelectedTime(slot.time)}
                      className={`p-2 border rounded ${
                        selectedTime === slot.time
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white hover:border-blue-500'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Motif de consultation (optionnel)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2 border rounded"
                rows={3}
                placeholder="Décrivez brièvement la raison de votre visite..."
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!selectedDate || !selectedTime}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirmer le rendez-vous
            </button>
          </div>

          {/* Récapitulatif */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Récapitulatif</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Spécialité:</strong> {selectedSpecialty?.name}</p>
              <p><strong>Médecin:</strong> Dr. {selectedDoctor?.firstName} {selectedDoctor?.lastName}</p>
              <p><strong>Date:</strong> {selectedDate}</p>
              <p><strong>Heure:</strong> {selectedTime}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientAppointments;
```

### 4.2. Dashboard Secrétariat/Assistant

**Fichier:** `/frontend/src/pages/AssistantDashboard.jsx` (NOUVEAU - extrait)

```jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Phone, Users, Clock, CheckCircle, XCircle } from 'lucide-react';
import { appointmentService } from '../services/appointmentService';
import toast from 'react-hot-toast';

const AssistantDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('today'); // today, upcoming, pending
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadAppointments();
  }, [filter, selectedDate]);

  const loadAppointments = async () => {
    try {
      const response = await appointmentService.getAssistantAppointments({
        filter,
        date: selectedDate
      });
      setAppointments(response.appointments);
    } catch (error) {
      toast.error('Erreur lors du chargement des rendez-vous');
    }
  };

  const handleConfirm = async (appointmentId) => {
    try {
      await appointmentService.confirmAppointment(appointmentId);
      toast.success('Rendez-vous confirmé');
      loadAppointments();
    } catch (error) {
      toast.error('Erreur lors de la confirmation');
    }
  };

  const handleCancel = async (appointmentId, reason) => {
    try {
      await appointmentService.cancelAppointment(appointmentId, reason);
      toast.success('Rendez-vous annulé');
      loadAppointments();
    } catch (error) {
      toast.error('Erreur lors de l\'annulation');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Tableau de bord Secrétariat</h1>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Aujourd'hui</p>
              <p className="text-2xl font-bold">12</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">En attente</p>
              <p className="text-2xl font-bold">5</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Confirmés</p>
              <p className="text-2xl font-bold">8</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Appels reçus</p>
              <p className="text-2xl font-bold">23</p>
            </div>
            <Phone className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('today')}
              className={`px-4 py-2 rounded ${
                filter === 'today' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-4 py-2 rounded ${
                filter === 'upcoming' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}
            >
              À venir
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded ${
                filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}
            >
              En attente
            </button>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="p-2 border rounded"
          />
        </div>
      </div>

      {/* Liste des rendez-vous */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Rendez-vous</h2>
        </div>

        <div className="divide-y">
          {appointments.map(apt => (
            <div key={apt.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-12 rounded ${
                      apt.status === 'confirmed' ? 'bg-green-500' :
                      apt.status === 'pending' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`} />

                    <div>
                      <p className="font-semibold">
                        {apt.appointmentTime} - Dr. {apt.doctor.firstName} {apt.doctor.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        Patient: {apt.patient.firstName} {apt.patient.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {apt.specialty.name}
                      </p>
                      {apt.reason && (
                        <p className="text-sm text-gray-500 mt-1">
                          Motif: {apt.reason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {apt.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleConfirm(apt.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Confirmer
                      </button>
                      <button
                        onClick={() => handleCancel(apt.id, 'Annulé par le secrétariat')}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Annuler
                      </button>
                    </>
                  )}

                  {apt.status === 'confirmed' && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      Confirmé
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AssistantDashboard;
```

### 4.3. Page Radiologie (Stub)

**Fichier:** `/frontend/src/pages/RadiologyDashboard.jsx` (NOUVEAU)

```jsx
import React from 'react';
import { FileImage, Upload, Search, Calendar } from 'lucide-react';

const RadiologyDashboard = () => {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Espace Radiologie</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Nouveau examen */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Upload className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nouveau examen</h3>
            <p className="text-sm text-gray-600 mb-4">
              Télécharger et enregistrer un nouvel examen radiologique
            </p>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Commencer
            </button>
          </div>
        </div>

        {/* Rechercher examen */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Rechercher</h3>
            <p className="text-sm text-gray-600 mb-4">
              Rechercher un examen par patient ou numéro
            </p>
            <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Rechercher
            </button>
          </div>
        </div>

        {/* Examens du jour */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Examens du jour</h3>
            <p className="text-sm text-gray-600 mb-4">
              Voir la liste des examens programmés aujourd'hui
            </p>
            <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              Voir la liste
            </button>
          </div>
        </div>
      </div>

      {/* TODO: Implémenter les fonctionnalités complètes */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 text-sm">
          <strong>⚠️ En développement:</strong> Les fonctionnalités de radiologie seront implémentées dans une phase ultérieure.
        </p>
      </div>
    </div>
  );
};

export default RadiologyDashboard;
```

---

## 5. SÉCURITÉ & PERMISSIONS

### 5.1. Matrice des Permissions

```
| Action                          | Patient | Doctor | Pharmacy | Admin | Assistant | Radiologist |
|---------------------------------|---------|--------|----------|-------|-----------|-------------|
| Créer dossier médical          |    ❌   |   ✅   |    ❌    |  ✅   |     ❌    |     ❌      |
| Voir ses dossiers              |    ✅   |   ✅   |    ❌    |  ✅   |     ❌    |     ❌      |
| Créer prescription             |    ❌   |   ✅   |    ❌    |  ❌   |     ❌    |     ❌      |
| Délivrer prescription          |    ❌   |   ❌   |    ✅    |  ❌   |     ❌    |     ❌      |
| Créer RDV                      |    ✅   |   ❌   |    ❌    |  ❌   |     ✅    |     ❌      |
| Gérer RDV                      |    ❌   |   ✅   |    ❌    |  ✅   |     ✅    |     ❌      |
| Approuver urgences             |    ❌   |   ❌   |    ❌    |  ✅   |     ❌    |     ❌      |
| Voir logs système              |    ❌   |   ❌   |    ❌    |  ✅   |     ❌    |     ❌      |
| Export données                 |    ❌   |   ❌   |    ❌    |  ✅   |     ❌    |     ❌      |
| Gérer spécialités              |    ❌   |   ❌   |    ❌    |  ✅   |     ❌    |     ❌      |
| Créer assistant                |    ❌   |   ❌   |    ❌    |  ✅   |     ❌    |     ❌      |
| Upload examen radio            |    ❌   |   ❌   |    ❌    |  ❌   |     ❌    |     ✅      |
```

### 5.2. Middleware d'Autorisation Amélioré

**Fichier:** `/backend/src/middleware/authorize.js` (Mise à jour)

```javascript
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Non authentifié' });
    }

    // Admin a accès à tout
    if (req.user.role === 'admin') {
      return next();
    }

    // Vérifier si le rôle est autorisé
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Accès refusé - Permissions insuffisantes',
        requiredRoles: allowedRoles,
        yourRole: req.user.role
      });
    }

    next();
  };
};

// Fonction spécifique pour les urgences
const authorizeEmergencyAccess = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Non authentifié' });
  }

  const { accessRequestId } = req.params;

  // Seul l'admin peut approuver les urgences
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Seul un administrateur peut approuver les demandes d\'urgence'
    });
  }

  next();
};

module.exports = { authorize, authorizeEmergencyAccess };
```

### 5.3. Variables d'Environnement

**Fichier:** `/backend/.env` (Ajouter)

```env
# Clés de chiffrement multi-niveaux
ENCRYPTION_KEY_LEVEL1=abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
ENCRYPTION_KEY_LEVEL2=1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
ENCRYPTION_KEY_LEVEL3=7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456

# Limites rendez-vous par défaut
DEFAULT_DAILY_APPOINTMENT_LIMIT=20

# Mode urgence
EMERGENCY_ACCESS_TIMEOUT_HOURS=24
```

---

## 6. PLAN DE MIGRATION

### Étape 1: Base de données (Priorité: HAUTE)
```bash
# Créer les nouveaux modèles
1. Créer Specialty.js
2. Créer DoctorSpecialty.js
3. Créer Appointment.js
4. Créer DoctorAvailability.js
5. Créer SystemStatus.js
6. Créer PrescriptionGroup.js et PrescriptionGroupItem.js

# Modifier les modèles existants
7. Ajouter role "assistant" et "radiologist" à BaseUser
8. Ajouter champs urgence à medical_record_access_requests

# Script de migration
node scripts/create-new-tables.js
```

### Étape 2: Backend - Corrections (Priorité: HAUTE)
```bash
1. Corriger adminController.js (export, status update)
2. Ajouter route /api/admin/status/update
3. Ajouter route /api/admin/logs
4. Créer encryptionService.js
```

### Étape 3: Backend - Nouvelles fonctionnalités (Priorité: MOYENNE)
```bash
1. Créer appointmentController.js
2. Créer prescriptionGroupController.js
3. Créer appointmentRoutes.js
4. Créer prescriptionGroupRoutes.js
5. Ajouter routes admin pour spécialités et assistants
```

### Étape 4: Frontend - Corrections (Priorité: HAUTE)
```bash
1. Corriger AdminMonitoring.jsx (afficher logs)
2. Corriger l'export JSON/CSV
3. Renommer "Historique docteur & Patient"
```

### Étape 5: Frontend - Nouvelles pages (Priorité: MOYENNE)
```bash
1. Créer PatientAppointments.jsx
2. Créer AssistantDashboard.jsx
3. Créer RadiologyDashboard.jsx (stub)
4. Créer PrescriptionGroupView.jsx
```

### Étape 6: Intégration & Tests (Priorité: HAUTE)
```bash
1. Tester toutes les routes admin
2. Tester système de rendez-vous
3. Tester groupement prescriptions
4. Tester mode urgence
5. Tester chiffrement multi-niveaux
```

---

## 7. POINTS CRITIQUES

### 🔴 Sécurité
1. **Clés de chiffrement**: Générer des clés uniques pour production
2. **Mode urgence**: Nécessite validation admin obligatoire
3. **Rate limiting**: Appliquer sur toutes les routes sensibles
4. **Logs**: Ne jamais logger de données sensibles (mots de passe, données patients)

### 🔴 Performance
1. **Indexes database**: Ajouter indexes sur `appointmentDate`, `specialtyId`, `doctorId`
2. **Cache**: Implémenter cache Redis pour disponibilités médecins
3. **Pagination**: Toutes les listes doivent être paginées

### 🔴 UX
1. **Feedback temps réel**: Utiliser WebSocket pour notifications RDV
2. **Validation**: Valider côté client ET serveur
3. **Messages d'erreur**: Clairs et actionnables

### 🔴 Maintenabilité
1. **Documentation**: Documenter toutes les nouvelles API
2. **Tests**: Écrire tests unitaires pour logique critique
3. **Logs**: Structurer les logs avec niveaux appropriés

---

## 📝 RÉSUMÉ DES LIVRABLES

### Backend
- ✅ 7 nouveaux modèles de base de données
- ✅ 3 nouveaux contrôleurs
- ✅ 4 nouveaux fichiers de routes
- ✅ 1 service de chiffrement multi-niveaux
- ✅ Corrections de 4 bugs existants

### Frontend
- ✅ 3 nouvelles pages complètes
- ✅ Corrections de 3 bugs UI
- ✅ 1 service API pour rendez-vous

### Documentation
- ✅ Plan d'architecture complet
- ✅ Matrice de permissions
- ✅ Plan de migration étape par étape

---

**Fin du document - Version 1.0**