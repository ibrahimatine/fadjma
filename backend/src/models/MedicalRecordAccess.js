const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MedicalRecordAccessRequest = sequelize.define('MedicalRecordAccessRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  patientId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  requesterId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'expired'),
    defaultValue: 'pending'
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: true
  },
  accessLevel: {
    type: DataTypes.ENUM('read', 'write', 'full'),
    allowNull: false,
    defaultValue: 'read' // Lecture seule par défaut
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true // Si null → accès illimité (à éviter en prod)
  },
  reviewedBy: {
    type: DataTypes.UUID,
    allowNull: true // Admin ou patient qui approuve/refuse
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'medical_record_access_requests',
  hooks: {
    afterFind: (records) => {
      if (!records) return;
      const checkAndUpdateStatus = (record) => {
        if (record.expiresAt && new Date(record.expiresAt) < new Date() && record.status === 'approved') {
          record.status = 'expired';
        }
      };
      if (Array.isArray(records)) {
        records.forEach(checkAndUpdateStatus);
      } else {
        checkAndUpdateStatus(records);
      }
    }
  }
});

module.exports = MedicalRecordAccessRequest;
