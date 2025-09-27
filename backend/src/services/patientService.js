const { MedicalRecord } = require('../models');

exports.getPatientStats = async (patientId) => {
  const totalRecords = await MedicalRecord.count({
    where: { patientId },
  });

  const verifiedRecords = await MedicalRecord.count({
    where: { patientId, isVerified: true },
  });

  const pendingRecords = totalRecords - verifiedRecords;

  return {
    totalRecords,
    verifiedRecords,
    pendingRecords,
  };
};