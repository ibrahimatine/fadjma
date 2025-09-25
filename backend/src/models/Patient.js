const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const BaseUser = require('./BaseUser');

const Patient = sequelize.define('Patient', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  baseUserId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: BaseUser,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  gender: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isIn: [['male', 'female', 'other']]
    }
  },
  emergencyContactName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  emergencyContactPhone: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: {
        args: /^[+]?[0-9\s\-()]{0,20}$/i,
        msg: 'Le numéro de téléphone d\'urgence ne peut contenir que des chiffres, espaces, tirets et parenthèses'
      },
      len: {
        args: [0, 20],
        msg: 'Le numéro de téléphone d\'urgence ne peut pas dépasser 20 caractères'
      }
    }
  },
  socialSecurityNumber: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true
});

// Associations
Patient.belongsTo(BaseUser, {
  foreignKey: 'baseUserId',
  as: 'user',
  onDelete: 'CASCADE'
});

BaseUser.hasOne(Patient, {
  foreignKey: 'baseUserId',
  as: 'patientProfile',
  onDelete: 'CASCADE'
});

module.exports = Patient;