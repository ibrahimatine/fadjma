const { MedicalRecord } = require('../models'); // Utiliser le nouveau fichier index.js
const hederaService = require('../services/hederaService');

exports.verifyRecord = async (req, res) => {
  try {
    const record = await MedicalRecord.findByPk(req.params.id);
    
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }
    
    // Verify the record
    const verificationResult = await hederaService.verifyRecord(record);
    
    // Update last verified timestamp
    await record.update({
      lastVerifiedAt: new Date()
    });
    
    res.json({
      message: 'Verification completed',
      ...verificationResult
    });
  } catch (error) {
    console.error('Verify record error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getVerificationHistory = async (req, res) => {
  try {
    const record = await MedicalRecord.findByPk(req.params.id);
    
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }
    
    // For MVP, return basic history
    const history = {
      recordId: record.id,
      createdAt: record.createdAt,
      lastModified: record.updatedAt,
      lastVerified: record.lastVerifiedAt,
      hederaTransactionId: record.hederaTransactionId,
      isVerified: record.isVerified,
      verifications: [
        {
          timestamp: record.lastVerifiedAt || record.createdAt,
          status: 'success',
          hash: record.hash
        }
      ]
    };
    
    res.json(history);
  } catch (error) {
    console.error('Get verification history error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};