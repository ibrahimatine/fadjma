const hederaClient = require('../config/hedera');
const hashService = require('./hashService');

class HederaService {
  async anchorRecord(record) {
    try {
      // Generate hash
      const hash = hashService.generateRecordHash(record);
      
      // Prepare message for Hedera
      const message = JSON.stringify({
        recordId: record.id,
        hash: hash,
        timestamp: new Date().toISOString(),
        type: 'MEDICAL_RECORD'
      });
      
      // Submit to Hedera
      const result = await hederaClient.submitMessage(message);
      
      return {
        hash,
        ...result
      };
    } catch (error) {
      console.error('Error anchoring record:', error);
      throw error;
    }
  }

  async verifyRecord(record) {
    try {
      // Calculate current hash
      const currentHash = hashService.generateRecordHash(record);
      
      // Compare with stored hash
      const isValid = currentHash === record.hash;
      
      // In production, also verify against Hedera
      // This would require Mirror Node API integration
      
      return {
        isValid,
        currentHash,
        storedHash: record.hash,
        hederaTransactionId: record.hederaTransactionId,
        verifiedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error verifying record:', error);
      throw error;
    }
  }
}

module.exports = new HederaService();