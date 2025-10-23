const crypto = require('crypto');
const mirrorNodeService = require('./mirrorNodeService');
const compressionService = require('./compressionService');

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

  /**
   * Décod et décompresse un message Hedera depuis le Mirror Node
   * Gère les formats: version 2.0 (compressé), version 3.0 (hash only), et anciens formats
   */
  async decodeHederaMessage(base64Message) {
    try {
      // 1. Décoder de base64
      const decodedString = Buffer.from(base64Message, 'base64').toString('utf8');

      // 2. Parser le JSON
      let messageWrapper = JSON.parse(decodedString);

      console.log('📦 Message Hedera décodé:', {
        hasVersion: !!messageWrapper.v,
        isCompressed: !!messageWrapper.c,
        type: messageWrapper.type,
        version: messageWrapper.version || messageWrapper.v
      });

      // 3. Vérifier si c'est un message compressé (format v2.0)
      if (messageWrapper.v && messageWrapper.hasOwnProperty('c')) {
        console.log('🗜️  Message au format compressé v2.0');

        // Décompresser si nécessaire
        const decompressResult = await compressionService.decompressHederaMessage(messageWrapper);

        if (!decompressResult.success) {
          throw new Error(`Échec décompression: ${decompressResult.error}`);
        }

        // Les données décompressées sont déjà parsées
        messageWrapper = decompressResult.data;

        console.log('✅ Message décompressé:', {
          type: messageWrapper.type,
          version: messageWrapper.version,
          hasHash: !!messageWrapper.hash
        });
      }

      return {
        success: true,
        data: messageWrapper,
        compressed: !!messageWrapper.c
      };

    } catch (error) {
      console.error('❌ Erreur lors du décodage du message Hedera:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
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

      console.log('Local hash verification:', localVerification);

      // 2. Vérification HCS via Hedera Mirror Node API (VRAIE VÉRIFICATION)
      // Initialisation avec valeurs par défaut (pour gérer le cas où le record n'est pas encore ancré)
      let hcsVerification = {
        isOnHedera: false,        // Sera mis à jour avec la vraie valeur de l'API
        transactionStatus: null,  // Sera mis à jour avec 'SUCCESS' ou autre statut réel
        consensusTimestamp: null, // Sera mis à jour avec le timestamp réel Hedera
        error: null              // Sera mis à jour si erreur API
      };

      if (record.hederaTransactionId) {
        console.log(`🔍 Vérification réelle Hedera pour transaction: ${record.hederaTransactionId}`);

        // ✅ APPEL RÉEL à l'API Hedera Mirror Node
        // URL: https://testnet.mirrornode.hedera.com/api/v1/transactions/{id}
        const transactionResult = await mirrorNodeService.verifyTransaction(record.hederaTransactionId);
        console.log('Hedera Mirror Node transaction result:', transactionResult);
        // ✅ MISE À JOUR avec les VRAIES données de l'API Hedera
        hcsVerification = {
          isOnHedera: transactionResult.isVerified,      // Résultat réel de l'API
          transactionStatus: transactionResult.result,   // 'SUCCESS', 'INVALID_SIGNATURE', etc.
          consensusTimestamp: transactionResult.consensusTimestamp, // Timestamp réel Hedera
          error: transactionResult.error || null         // Erreur réelle si échec API
        };


        console.log('✅ Transaction Hedera vérifiée:', {
          isVerified: transactionResult.isVerified,
          status: transactionResult.result,
          timestamp: transactionResult.consensusTimestamp
        });

        // 3. Vérifier que le hash est bien présent dans le message HCS
        if (record.hederaTransactionId && record.hederaSequenceNumber && record.hederaTopicId) {
          console.log(`🔍 Vérification du message HCS: Topic ${record.hederaTopicId}, Seq ${record.hederaSequenceNumber}`);

          // ✅ APPEL RÉEL à l'API Hedera Mirror Node pour récupérer le message
          // URL: https://testnet.mirrornode.hedera.com/api/v1/topics/{topicId}/messages/{seq}
          const messageResult = await mirrorNodeService.verifyTopicMessage(
            record.hederaTopicId,
            record.hederaSequenceNumber
          );

          if (messageResult.isVerified) {
            // ✅ DÉCODAGE RÉEL du message base64 depuis Hedera (avec support compression)
            console.log('🔍 Décodage du message HCS (peut être compressé)...');
            const decodeResult = await this.decodeHederaMessage(messageResult.message);

            if (!decodeResult.success) {
              console.log('❌ Erreur décodage message HCS:', decodeResult.error);
              hcsVerification.messageVerified = false;
              hcsVerification.messageError = decodeResult.error;
            } else {
              const messageData = decodeResult.data;
              const wasCompressed = decodeResult.compressed;

              console.log('✅ Message HCS décodé:', {
                compressed: wasCompressed,
                type: messageData.type,
                version: messageData.version,
                hasHash: !!messageData.hash
              });

              // ✅ VÉRIFICATION RÉELLE: Comparer le hash du message HCS avec le hash local
              const hashMatch = messageData.hash === record.hash;
              hcsVerification.messageVerified = hashMatch;
              hcsVerification.messageContent = messageData;
              hcsVerification.wasCompressed = wasCompressed;

              console.log('✅ Message HCS vérifié:', {
                hashMatch,
                hcsHash: messageData.hash,
                localHash: record.hash,
                messageType: messageData.type,
                compressed: wasCompressed
              });
            }
          } else {
            console.log('❌ Message HCS non trouvé ou non vérifié');
          }
        }
      }

      // 4. Résultat global de la vérification
      const isFullyVerified = localVerification.isValidLocal &&
                              hcsVerification.isOnHedera &&
                              (hcsVerification.messageVerified !== false);

      console.log('📊 Résultat final de la vérification:', {
        localValid: localVerification.isValidLocal,
        onHedera: hcsVerification.isOnHedera,
        messageVerified: hcsVerification.messageVerified,
        fullyVerified: isFullyVerified
      });

      return {
        ...localVerification,
        hcs: hcsVerification,
        isFullyVerified,
        verifiedAt: new Date().toISOString(),
        verificationMethod: 'LOCAL_AND_HCS_MIRROR_NODE_API' // Indique clairement l'API utilisée
      };

    } catch (error) {
      console.error('❌ Erreur lors de la vérification HCS (Mirror Node API probablement injoignable):', error.message);

      // Fallback vers vérification locale seulement (si l'API Hedera est down)
      const currentHash = this.generateRecordHash(record);

      console.log('⚠️  Fallback: Vérification locale uniquement');

      return {
        isValidLocal: currentHash === record.hash,
        currentHash,
        storedHash: record.hash,
        hcs: {
          isOnHedera: false,
          error: `API Hedera Mirror Node inaccessible: ${error.message}`
        },
        isFullyVerified: false,
        verifiedAt: new Date().toISOString(),
        verificationMethod: 'LOCAL_ONLY_FALLBACK_DUE_TO_API_ERROR'
      };
    }
  }
}

module.exports = new HashService();