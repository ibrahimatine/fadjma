const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Appointment = sequelize.define('Appointment', {
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
  specialtyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Specialties',
      key: 'id'
    }
  },
  appointmentDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  appointmentTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER, // en minutes
    defaultValue: 30
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'confirmed', 'cancelled', 'completed', 'no_show', 'emergency']]
    }
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isEmergency: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  emergencyApprovedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'BaseUsers',
      key: 'id'
    }
  },
  emergencyApprovedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  managedBy: {
    type: DataTypes.UUID, // Assistant/Secrétariat
    allowNull: true,
    references: {
      model: 'BaseUsers',
      key: 'id'
    }
  },
  cancellationReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cancelledBy: {
    type: DataTypes.UUID,
    allowNull: true
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['patientId']
    },
    {
      fields: ['doctorId']
    },
    {
      fields: ['appointmentDate', 'status']
    },
    {
      fields: ['specialtyId']
    }
  ]
});

module.exports = Appointment;