const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const BaseUser = require('./BaseUser');

const Doctor = sequelize.define('Doctor', {
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
  specialty: {
    type: DataTypes.STRING,
    allowNull: false
  },
  hospital: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verificationDate: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true
});

// Associations
Doctor.belongsTo(BaseUser, {
  foreignKey: 'baseUserId',
  as: 'user',
  onDelete: 'CASCADE'
});

BaseUser.hasOne(Doctor, {
  foreignKey: 'baseUserId',
  as: 'doctorProfile',
  onDelete: 'CASCADE'
});

module.exports = Doctor;