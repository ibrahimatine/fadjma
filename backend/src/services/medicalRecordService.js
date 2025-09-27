const { MedicalRecord, BaseUser, MedicalRecordAccessRequest } = require('../models');
const { Op } = require('sequelize');

exports.getDoctorStats = async (doctorId) => {
  const totalPatients = await BaseUser.count({
    where: {
      createdByDoctorId: doctorId,
      role: 'patient'
    }
  });

  const accessiblePatients = await MedicalRecordAccessRequest.count({
    where: {
      requesterId: doctorId,
      status: 'approved',
      [Op.or]: [
        { expiresAt: null },
        { expiresAt: { [Op.gt]: new Date() } }
      ]
    }
  });

  const totalRecords = await MedicalRecord.count({
    where: { doctorId }
  });

  // You can add more specific stats here if needed, e.g., verified records
  const verifiedRecords = await MedicalRecord.count({
    where: { doctorId, isVerified: true }
  });

  return {
    totalPatients: totalPatients + accessiblePatients, // Combine created and accessible
    totalRecords,
    verifiedRecords,
    pendingRecords: totalRecords - verifiedRecords // Example of a derived stat
  };
};