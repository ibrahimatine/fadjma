const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Specialty = sequelize.define('Specialty', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true // Ex: "CARDIO", "GENERAL", "RADIO"
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  dailyAppointmentLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 20,
    comment: 'Nombre maximum de RDV par jour pour cette spécialité'
  },
  averageConsultationDuration: {
    type: DataTypes.INTEGER, // en minutes
    defaultValue: 30
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  color: {
    type: DataTypes.STRING(7), // Couleur hex pour l'UI (#FF5733)
    defaultValue: '#3B82F6'
  },
  icon: {
    type: DataTypes.STRING,
    allowNull: true // Nom de l'icône Lucide
  }
}, {
  timestamps: true
});

module.exports = Specialty;