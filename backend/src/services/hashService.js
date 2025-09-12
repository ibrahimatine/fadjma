const crypto = require('crypto');

class HashService {
  generateHash(data) {
    const stringData = typeof data === 'object' ? JSON.stringify(data) : data;
    return crypto
      .createHash('sha256')
      .update(stringData)
      .digest('hex');
  }

  generateRecordHash(record) {
    // Create deterministic hash from record data
    const hashData = {
      patientId: record.patientId,
      doctorId: record.doctorId,
      type: record.type,
      title: record.title,
      description: record.description,
      diagnosis: record.diagnosis,
      prescription: record.prescription,
      timestamp: record.createdAt
    };
    
    return this.generateHash(hashData);
  }

  verifyHash(data, hash) {
    const calculatedHash = this.generateHash(data);
    return calculatedHash === hash;
  }
}

module.exports = new HashService();