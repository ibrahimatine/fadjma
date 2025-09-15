const { sequelize } = require('../config/database');
const User = require('./User');
const MedicalRecord = require('./MedicalRecord');

// Définir les associations
User.hasMany(MedicalRecord, { 
  as: 'patientRecords', 
  foreignKey: 'patientId' 
});

User.hasMany(MedicalRecord, { 
  as: 'doctorRecords', 
  foreignKey: 'doctorId' 
});

MedicalRecord.belongsTo(User, { 
  as: 'patient', 
  foreignKey: 'patientId' 
});

MedicalRecord.belongsTo(User, { 
  as: 'doctor', 
  foreignKey: 'doctorId' 
});

module.exports = {
  sequelize,
  User,
  MedicalRecord
};