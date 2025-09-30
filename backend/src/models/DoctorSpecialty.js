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