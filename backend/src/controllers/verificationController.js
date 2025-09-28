const { MedicalRecord } = require('../models'); // Utiliser le nouveau fichier index.js
const hederaService = require('../services/hederaService');
const monitoringService = require('../services/monitoringService');

exports.verifyRecord = async (req, res) => {
  try {
    const startTime = Date.now();
    const record = await MedicalRecord.findByPk(req.params.id);

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Verify the record using hashService instead of hederaService
    const hashService = require('../services/hashService');
    const verificationResult = await hashService.verifyHashWithHCS(record);

    // Record verification operation metrics
    const verificationTime = Date.now() - startTime;
    monitoringService.recordDatabaseOperation('verification', verificationTime, {
      recordId: record.id,
      isValid: verificationResult.isFullyVerified,
      type: record.type
    });

    // Update last verified timestamp
    await record.update({
      lastVerifiedAt: new Date(),
      isVerified: verificationResult.isFullyVerified
    });

    // Format response for frontend IntegrityButton
    res.json({
      message: 'Verification completed',
      isValid: verificationResult.isFullyVerified,
      currentHash: verificationResult.currentHash,
      storedHash: verificationResult.storedHash,
      hederaTransactionId: record.hederaTransactionId,
      verification: verificationResult
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