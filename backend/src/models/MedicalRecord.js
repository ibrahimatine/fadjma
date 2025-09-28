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
  }
}, {
  timestamps: true
});

module.exports = MedicalRecord;
