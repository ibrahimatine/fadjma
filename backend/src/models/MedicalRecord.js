const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MedicalRecord = sequelize.define('MedicalRecord', {
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
  type: {
    type: DataTypes.STRING,  // PAS D'ENUM !
    allowNull: false,
    validate: {
      isIn: [['consultation', 'prescription', 'test_result', 'vaccination', 'allergy']]
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  diagnosis: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  prescription: {
    type: DataTypes.JSON,  // JSON au lieu de JSONB pour compatibilité
    allowNull: true
  },
  attachments: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  hash: {
    type: DataTypes.STRING,
    allowNull: true
  },
  hederaTransactionId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  hederaSequenceNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  hederaTopicId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  hederaTimestamp: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lastVerifiedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  prescriptionMatricule: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  }
}, {
  timestamps: true
});

// Hook pour générer automatiquement un matricule global de prescription
MedicalRecord.beforeCreate(async (record) => {
  // Générer un matricule seulement si c'est une prescription
  if (record.type === 'prescription') {
    const crypto = require('crypto');
    let matricule;
    let exists = true;

    while (exists) {
      // Format: ORD-YYYYMMDD-XXXXXXXX (ORD = ordonnance, 8 caractères hexadécimaux)
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const random = crypto.randomBytes(4).toString('hex').toUpperCase(); // 4 bytes = 8 hex chars
      matricule = `ORD-${date}-${random}`;

      // Vérifier l'unicité
      const existing = await MedicalRecord.findOne({ where: { prescriptionMatricule: matricule } });
      exists = !!existing;
    }

    record.prescriptionMatricule = matricule;
  }
});

module.exports = MedicalRecord;
