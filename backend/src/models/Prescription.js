const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const BaseUser = require('./BaseUser');
const MedicalRecord = require('./MedicalRecord');

const Prescription = sequelize.define('Prescription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  patientId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: BaseUser,
      key: 'id',
    },
  },
  doctorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: BaseUser,
      key: 'id',
    },
  },
  medicalRecordId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: MedicalRecord,
      key: 'id',
    },
  },
  medication: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  dosage: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  instructions: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  issueDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  deliveryStatus: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'delivered', 'cancelled']],
    },
  },
  matricule: {
    type: DataTypes.STRING,
    allowNull: true, // Temporairement null pour les prescriptions existantes
    unique: true,
  },
  deliveryConfirmationHash: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  hederaTransactionId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  pharmacyId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: BaseUser,
      key: 'id',
    },
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  verifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  hederaSequenceNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  hederaTopicId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
});

// Hook pour générer automatiquement un matricule unique (UUID-based, no race condition)
Prescription.beforeCreate(async (prescription) => {
  const matriculeGenerator = require('../utils/matriculeGenerator');

  // Générer matricule unique basé sur UUID (pas de race condition possible)
  prescription.matricule = matriculeGenerator.generatePrescription(prescription.issueDate);
});

Prescription.belongsTo(BaseUser, { as: 'patient', foreignKey: 'patientId' });
Prescription.belongsTo(BaseUser, { as: 'doctor', foreignKey: 'doctorId' });
Prescription.belongsTo(BaseUser, { as: 'pharmacy', foreignKey: 'pharmacyId' });
Prescription.belongsTo(MedicalRecord, { foreignKey: 'medicalRecordId' });

module.exports = Prescription;