const { sequelize } = require('../config/database');
const User = require('./User'); // Ancien modèle - sera supprimé
const BaseUser = require('./BaseUser');
const Patient = require('./Patient');
const Doctor = require('./Doctor');
const Pharmacy = require('./Pharmacy');
const MedicalRecord = require('./MedicalRecord');
const Prescription = require('./Prescription');
const MedicalRecordAccessRequest = require('./MedicalRecordAccess');

// Définir les associations avec BaseUser
BaseUser.hasMany(MedicalRecord, {
  as: 'patientRecords',
  foreignKey: 'patientId'
});

BaseUser.hasMany(MedicalRecord, {
  as: 'doctorRecords',
  foreignKey: 'doctorId'
});

MedicalRecord.belongsTo(BaseUser, {
  as: 'patient',
  foreignKey: 'patientId'
});

MedicalRecord.belongsTo(BaseUser, {
  as: 'doctor',
  foreignKey: 'doctorId'
});

BaseUser.hasMany(MedicalRecordAccessRequest, {
  as: 'patientAccessRequests',
  foreignKey: 'patientId'
});

BaseUser.hasMany(MedicalRecordAccessRequest, {
  as: 'requesterAccessRequests',
  foreignKey: 'requesterId'
});

MedicalRecordAccessRequest.belongsTo(BaseUser, { as: 'patient', foreignKey: 'patientId' });
MedicalRecordAccessRequest.belongsTo(BaseUser, { as: 'requester', foreignKey: 'requesterId' });
MedicalRecordAccessRequest.belongsTo(BaseUser, { as: 'reviewer', foreignKey: 'reviewedBy' });


module.exports = {
  sequelize,
  User, // Ancien modèle - conservé pour compatibilité temporaire
  BaseUser,
  Patient,
  Doctor,
  Pharmacy,
  MedicalRecord,
  Prescription,
  MedicalRecordAccessRequest
};