const { sequelize } = require('../config/database');
const User = require('./User');
const MedicalRecord = require('./MedicalRecord');
const Prescription = require('./Prescription');
const MedicalRecordAccessRequest = require('./MedicalRecordAccess');

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

User.hasMany(MedicalRecordAccessRequest, {
  as: 'patientAccessRequests',
  foreignKey: 'patientId'
});

User.hasMany(MedicalRecordAccessRequest, {
  as: 'requesterAccessRequests',
  foreignKey: 'requesterId'
});

MedicalRecordAccessRequest.belongsTo(User, { as: 'patient', foreignKey: 'patientId' });
MedicalRecordAccessRequest.belongsTo(User, { as: 'requester', foreignKey: 'requesterId' });


module.exports = {
  sequelize,
  User,
  MedicalRecord,
  Prescription,
  MedicalRecordAccessRequest
};