const hederaClient = require('../config/hedera');
const hashService = require('./hashService');
const monitoringService = require('./monitoringService');
const hashscanService = require('./hashscanService');

class HederaService {
  constructor() {
    this.retryAttempts = 3;
    this.retryDelay = 2000; // 2 secondes
  }

  async anchorRecord(record) {
    const startTime = Date.now();
    let attempt = 0;
    let lastError;

    while (attempt < this.retryAttempts) {
      try {
        attempt++;
        console.log(`🔗 Tentative ${attempt}/${this.retryAttempts} d'ancrage Hedera pour record ${record.id}`);

        // Generate hash
        const hash = hashService.generateRecordHash(record);

        // Prepare message for Hedera 
        const message = JSON.stringify({
          recordId: record.id,
          hash: hash,
          timestamp: new Date().toISOString(),
          type: 'MEDICAL_RECORD',
          patientId: record.patientId,
          doctorId: record.doctorId,
          recordType: record.type
        });

        // Submit to Hedera with timeout
        const result = await Promise.race([
          hederaClient.submitMessage(message),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout Hedera')), 15000)
          )
        ]);

        const responseTime = Date.now() - startTime;

        if (result.status === 'SUCCESS') {
          console.log(`✅ Record ${record.id} ancré avec succès sur Hedera`);

          // Enregistrer le succès dans le monitoring
          monitoringService.recordHederaTransaction('SUCCESS', responseTime, {
            recordId: record.id,
            recordType: record.type,
            sequenceNumber: result.sequenceNumber
          });

          // Générer les liens de vérification HashScan
          const verificationLinks = hashscanService.generateVerificationLink(record, {
            hash: hash,
            transactionId: result.transactionId,
            topicId: result.topicId,
            sequenceNumber: result.sequenceNumber,
            timestamp: result.timestamp
          });

          return {
            hash,
            ...result,
            verification: verificationLinks.verification
          };
        } else if (result.status === 'SIMULATED') {
          console.log(`⚠️ Record ${record.id} en mode simulation`);

          // Enregistrer la simulation
          monitoringService.recordHederaTransaction('SIMULATED', responseTime, {
            recordId: record.id,
            recordType: record.type
          });

          return { hash, ...result };
        } else {
          throw new Error(`Hedera error: ${result.error || result.status}`);
        }

      } catch (error) {
        console.error(`❌ Tentative ${attempt} échouée:`, error.message);
        lastError = error;

        // Si ce n'est pas le dernier essai, attendre avant de réessayer
        if (attempt < this.retryAttempts) {
          console.log(`⏳ Attente ${this.retryDelay}ms avant nouvel essai...`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        }
      }
    }

    // Toutes les tentatives ont échoué
    console.error(`❌ Échec définitif d'ancrage pour record ${record.id} après ${this.retryAttempts} tentatives`);

    const responseTime = Date.now() - startTime;

    // Enregistrer l'échec dans le monitoring
    monitoringService.recordHederaTransaction('FAILED_FALLBACK', responseTime, {
      recordId: record.id,
      recordType: record.type,
      error: lastError?.message,
      attempts: this.retryAttempts
    });

    // Retourner un résultat simulé pour ne pas bloquer l'application
    return {
      hash: hashService.generateRecordHash(record),
      status: 'FAILED_FALLBACK',
      topicId: 'FALLBACK',
      transactionId: null,
      sequenceNumber: 'FALLBACK',
      timestamp: new Date().toISOString(),
      error: lastError.message
    };
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