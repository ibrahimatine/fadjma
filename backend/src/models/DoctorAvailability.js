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