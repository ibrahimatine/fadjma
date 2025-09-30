const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const crypto = require('crypto');

const PrescriptionGroup = sequelize.define('PrescriptionGroup', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  groupMatricule: {
    type: DataTypes.STRING,
    allowNull: true,
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
    type: DataTypes.STRING,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'delivered', 'cancelled']]
    }
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

// Hook pour générer automatiquement un matricule de groupe unique
PrescriptionGroup.beforeCreate(async (group) => {
  let matricule;
  let exists = true;
  let attempts = 0;
  const maxAttempts = 10;

  // Générer un matricule unique
  while (exists && attempts < maxAttempts) {
    // Format: PGR-YYYYMMDD-XXXX
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = crypto.randomBytes(2).toString('hex').toUpperCase();
    matricule = `PGR-${date}-${random}`;

    // Vérifier l'unicité
    const existing = await PrescriptionGroup.findOne({ where: { groupMatricule: matricule } });
    exists = !!existing;
    attempts++;
  }

  if (!exists) {
    group.groupMatricule = matricule;
  } else {
    throw new Error('Impossible de générer un matricule de groupe unique après plusieurs tentatives');
  }
});

module.exports = PrescriptionGroup;