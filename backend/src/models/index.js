const { sequelize } = require('../config/database');
const User = require('./User');
const MedicalRecord = require('./MedicalRecord');
const Prescription = require('./Prescription');
const MedicalRecordAccess = require('./MedicalRecordAccess');

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

User.hasMany(MedicalRecordAccess, {
  as: 'patient',
  foreignKey: 'patientId'
});

User.hasMany(MedicalRecordAccess, {
  as: 'requester',
  foreignKey: 'requesterId'
});

MedicalRecordAccess.belongsTo(User, { as: 'patient', foreignKey: 'patientId' });
MedicalRecordAccess.belongsTo(User, { as: 'requester', foreignKey: 'requesterId' });


module.exports = {
  sequelize,
  User,
  MedicalRecord,
  Prescription,
  MedicalRecordAccess
};