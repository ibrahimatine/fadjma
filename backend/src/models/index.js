const { sequelize } = require('../config/database');
const BaseUser = require('./BaseUser');
const Patient = require('./Patient');
const Doctor = require('./Doctor');
const Pharmacy = require('./Pharmacy');
const MedicalRecord = require('./MedicalRecord');
const Prescription = require('./Prescription');
const MedicalRecordAccessRequest = require('./MedicalRecordAccess');
const SystemStatus = require('./SystemStatus');
const Appointment = require('./Appointment');
const Specialty = require('./Specialty');
const DoctorSpecialty = require('./DoctorSpecialty');
const DoctorAvailability = require('./DoctorAvailability');
const PrescriptionGroup = require('./PrescriptionGroup');
const PrescriptionGroupItem = require('./PrescriptionGroupItem');

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

// Associations pour les nouveaux modèles
Appointment.belongsTo(BaseUser, { as: 'patient', foreignKey: 'patientId' });
Appointment.belongsTo(BaseUser, { as: 'doctor', foreignKey: 'doctorId' });
Appointment.belongsTo(Specialty, { as: 'specialty', foreignKey: 'specialtyId' });
Appointment.belongsTo(BaseUser, { as: 'emergencyApprover', foreignKey: 'emergencyApprovedBy' });
Appointment.belongsTo(BaseUser, { as: 'manager', foreignKey: 'managedBy' });

DoctorSpecialty.belongsTo(BaseUser, { as: 'doctor', foreignKey: 'doctorId' });
DoctorSpecialty.belongsTo(Specialty, { as: 'specialty', foreignKey: 'specialtyId' });

DoctorAvailability.belongsTo(BaseUser, { as: 'doctor', foreignKey: 'doctorId' });

PrescriptionGroup.belongsTo(BaseUser, { as: 'patient', foreignKey: 'patientId' });
PrescriptionGroup.belongsTo(BaseUser, { as: 'doctor', foreignKey: 'doctorId' });
PrescriptionGroup.belongsTo(BaseUser, { as: 'pharmacy', foreignKey: 'pharmacyId' });

PrescriptionGroupItem.belongsTo(PrescriptionGroup, { as: 'group', foreignKey: 'groupId' });
PrescriptionGroupItem.belongsTo(Prescription, { as: 'prescription', foreignKey: 'prescriptionId' });

// Relations inverses
BaseUser.hasMany(Appointment, { as: 'patientAppointments', foreignKey: 'patientId' });
BaseUser.hasMany(Appointment, { as: 'doctorAppointments', foreignKey: 'doctorId' });
BaseUser.hasMany(DoctorSpecialty, { as: 'specialties', foreignKey: 'doctorId' });
BaseUser.hasMany(DoctorAvailability, { as: 'availabilities', foreignKey: 'doctorId' });
BaseUser.hasMany(PrescriptionGroup, { as: 'patientGroups', foreignKey: 'patientId' });
BaseUser.hasMany(PrescriptionGroup, { as: 'doctorGroups', foreignKey: 'doctorId' });

Specialty.hasMany(Appointment, { as: 'appointments', foreignKey: 'specialtyId' });
Specialty.hasMany(DoctorSpecialty, { as: 'doctors', foreignKey: 'specialtyId' });

PrescriptionGroup.hasMany(PrescriptionGroupItem, { as: 'items', foreignKey: 'groupId' });
Prescription.hasMany(PrescriptionGroupItem, { as: 'groupMemberships', foreignKey: 'prescriptionId' });

module.exports = {
  sequelize,
  BaseUser,
  Patient,
  Doctor,
  Pharmacy,
  MedicalRecord,
  Prescription,
  MedicalRecordAccessRequest,
  SystemStatus,
  Appointment,
  Specialty,
  DoctorSpecialty,
  DoctorAvailability,
  PrescriptionGroup,
  PrescriptionGroupItem
};