const crypto = require('crypto');
const mirrorNodeService = require('./mirrorNodeService');

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

  // Générer un hash pour n'importe quel objet de données (pour les prescriptions)
  generateDataHash(data) {
    // Nettoyer et ordonner les données pour un hash déterministe
    const cleanData = {};
    Object.keys(data).sort().forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        if (data[key] instanceof Date) {
          cleanData[key] = data[key].toISOString();
        } else {
          cleanData[key] = data[key];
        }
      }
    });

    return this.generateHash(cleanData);
  }

  verifyHash(data, hash) {
    const calculatedHash = this.generateHash(data);
    return calculatedHash === hash;
  }

  async verifyHashWithHCS(record) {
    try {
      // 1. Vérification locale du hash
      const currentHash = this.generateRecordHash(record);
      const localVerification = {
        isValidLocal: currentHash === record.hash,
        currentHash,
        storedHash: record.hash
      };

      // 2. Questionnement HCS - Vérifier si le record existe sur Hedera
      let hcsVerification = {
        isOnHedera: false,
        transactionStatus: null,
        consensusTimestamp: null,
        error: null
      };

      if (record.hederaTransactionId) {
        // Vérifier le statut de la transaction via Mirror Node
        const transactionResult = await mirrorNodeService.verifyTransaction(record.hederaTransactionId);

        hcsVerification = {
          isOnHedera: transactionResult.isVerified,
          transactionStatus: transactionResult.result,
          consensusTimestamp: transactionResult.consensusTimestamp,
          error: transactionResult.error || null
        };

        // 3. Vérifier que le hash est bien présent dans le message HCS
        if (record.hederaTransactionId && record.hederaSequenceNumber && record.hederaTopicId) {
          const messageResult = await mirrorNodeService.verifyTopicMessage(
            record.hederaTopicId, // Utiliser le topic ID stocké
            record.hederaSequenceNumber
          );

          if (messageResult.isVerified) {
            // Décoder et vérifier le contenu du message
            const decodedMessage = Buffer.from(messageResult.message, 'base64').toString();
            const messageData = JSON.parse(decodedMessage);

            hcsVerification.messageVerified = messageData.hash === record.hash;
            hcsVerification.messageContent = messageData;
          }
        }
      }

      // 4. Résultat global de la vérification
      const isFullyVerified = localVerification.isValidLocal &&
                              hcsVerification.isOnHedera &&
                              (hcsVerification.messageVerified !== false);

      return {
        ...localVerification,
        hcs: hcsVerification,
        isFullyVerified,
        verifiedAt: new Date().toISOString(),
        verificationMethod: 'LOCAL_AND_HCS'
      };

    } catch (error) {
      console.error('Error in HCS verification:', error);

      // Fallback vers vérification locale seulement
      const currentHash = this.generateRecordHash(record);
      return {
        isValidLocal: currentHash === record.hash,
        currentHash,
        storedHash: record.hash,
        hcs: {
          isOnHedera: false,
          error: error.message
        },
        isFullyVerified: false,
        verifiedAt: new Date().toISOString(),
        verificationMethod: 'LOCAL_ONLY_FALLBACK'
      };
    }
  }
}

module.exports = new HashService();