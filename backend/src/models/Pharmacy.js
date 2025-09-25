const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const BaseUser = require('./BaseUser');

const Pharmacy = sequelize.define('Pharmacy', {
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
  licenseNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  pharmacyName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  pharmacyAddress: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verificationDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  openingHours: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  timestamps: true
});

// Associations
Pharmacy.belongsTo(BaseUser, {
  foreignKey: 'baseUserId',
  as: 'user',
  onDelete: 'CASCADE'
});

BaseUser.hasOne(Pharmacy, {
  foreignKey: 'baseUserId',
  as: 'pharmacyProfile',
  onDelete: 'CASCADE'
});

module.exports = Pharmacy;