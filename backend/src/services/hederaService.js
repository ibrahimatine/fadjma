const hederaClient = require('../config/hedera');
const hashService = require('./hashService');
const monitoringService = require('./monitoringService');
const hashscanService = require('./hashscanService');
const compressionService = require('./compressionService');
const rateLimiterService = require('./rateLimiterService');
const batchAggregatorService = require('./batchAggregatorService');
const logger = require('../utils/logger');

class HederaService {
  constructor() {
    this.retryAttempts = 3;
    this.retryDelay = 2000; // 2 secondes
    this.useBatching = process.env.HEDERA_USE_BATCHING !== 'false'; // Activé par défaut
    this.useCompression = process.env.HEDERA_USE_COMPRESSION !== 'false'; // Activé par défaut

    // Écouter les événements de batch
    this.setupBatchListener();
  }

  /**
   * Configure l'écoute des batches prêts à être ancrés
   */
  setupBatchListener() {
    batchAggregatorService.on('batch-ready', async (batchData) => {
      try {
        await this.anchorBatch(batchData.batch, batchData.type);
      } catch (error) {
        logger.error('Error anchoring batch:', error);
      }
    });
  }

  /**
   * Ancre une prescription sur Hedera (OPTIMISÉ - hash only)
   * Les données complètes restent en DB, seul le hash est ancré
   */
  async anchorPrescription(prescription, actionType = 'CREATED') {
    const startTime = Date.now();

    logger.logServerAction('HEDERA', 'PRESCRIPTION_ANCHOR_START', {
      prescriptionId: prescription.id,
      matricule: prescription.matricule,
      actionType: actionType,
      useBatching: this.useBatching,
      success: true
    });

    try {
      // Generate hash des données complètes (les données restent en DB)
      const prescriptionData = {
        matricule: prescription.matricule,
        medication: prescription.medication,
        dosage: prescription.dosage,
        quantity: prescription.quantity,
        instructions: prescription.instructions,
        patientId: prescription.patientId,
        doctorId: prescription.doctorId,
        deliveryStatus: prescription.deliveryStatus,
        pharmacyId: prescription.pharmacyId,
        issueDate: prescription.issueDate,
        actionType: actionType
      };

      const hash = hashService.generateDataHash(prescriptionData);

      // Update prescription avec le hash (avant anchoring)
      await prescription.update({
        hash: hash,
        lastVerifiedAt: new Date()
      });

      // Si batching activé, ajouter au batch
      if (this.useBatching) {
        const batchResult = await batchAggregatorService.addToBatch('PRESCRIPTION', {
          id: prescription.id,
          matricule: prescription.matricule,
          actionType: actionType,
          ...prescriptionData
        });

        logger.logServerAction('HEDERA', 'PRESCRIPTION_BATCHED', {
          prescriptionId: prescription.id,
          hash: hash.substring(0, 16) + '...',
          batchSize: batchResult.currentBatchSize,
          success: true
        });

        return {
          success: true,
          batched: true,
          hash: hash,
          batchSize: batchResult.currentBatchSize,
          responseTime: Date.now() - startTime
        };
      }

      // Sinon, ancrer directement (hash only avec compression)
      const result = await this.anchorHashDirect(hash, 'PRESCRIPTION', {
        prescriptionId: prescription.id,
        matricule: prescription.matricule,
        actionType: actionType,
        timestamp: new Date().toISOString()
      });

      // Update prescription avec les infos Hedera
      await prescription.update({
        hederaTransactionId: result.transactionId,
        hederaSequenceNumber: result.sequenceNumber,
        hederaTopicId: result.topicId,
        hederaTimestamp: result.consensusTimestamp
      });

      const responseTime = Date.now() - startTime;

      logger.logServerAction('HEDERA', 'PRESCRIPTION_ANCHOR_SUCCESS', {
        prescriptionId: prescription.id,
        transactionId: result.transactionId,
        sequenceNumber: result.sequenceNumber,
        responseTime: responseTime,
        compressed: result.compressed,
        success: true
      });

      return {
        success: true,
        batched: false,
        transactionId: result.transactionId,
        sequenceNumber: result.sequenceNumber,
        topicId: result.topicId,
        hash: hash,
        responseTime: responseTime,
        compressed: result.compressed
      };

    } catch (error) {
      logger.logServerAction('HEDERA', 'PRESCRIPTION_ANCHOR_FAILED', {
        prescriptionId: prescription.id,
        error: error.message,
        success: false
      });

      throw new Error(`Échec ancrage prescription: ${error.message}`);
    }
  }

  /**
   * Ancre un hash directement sur Hedera avec compression et rate limiting
   */
  async anchorHashDirect(hash, messageType, metadata = {}) {
    let attempt = 0;
    let lastError;

    while (attempt < this.retryAttempts) {
      try {
        attempt++;

        // Créer le message minimal (hash + métadonnées essentielles)
        const messageData = {
          hash: hash,
          type: messageType,
          ...metadata,
          version: '3.0' // Version 3.0 = hash only
        };

        // Compresser si activé
        let message;
        let compressed = false;

        if (this.useCompression) {
          const compressionResult = await compressionService.compressHederaMessage(messageData);
          message = JSON.stringify(compressionResult);
          compressed = compressionResult.c;
        } else {
          message = JSON.stringify(messageData);
        }

        // Utiliser le rate limiter
        const result = await rateLimiterService.execute(async () => {
          return await Promise.race([
            hederaClient.submitMessage(message, messageType),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Timeout Hedera')), 15000)
            )
          ]);
        });

        return {
          ...result,
          compressed: compressed,
          attempt: attempt
        };

      } catch (error) {
        lastError = error;

        if (attempt < this.retryAttempts) {
          logger.logServerAction('HEDERA', 'ANCHOR_RETRY', {
            attempt: attempt,
            error: error.message,
            success: false
          });
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        }
      }
    }

    throw new Error(`Échec après ${this.retryAttempts} tentatives: ${lastError.message}`);
  }

  /**
   * Ancre un batch Merkle sur Hedera
   */
  async anchorBatch(batch, batchType) {
    try {
      logger.info('Anchoring batch to Hedera', {
        batchId: batch.metadata.batchId,
        type: batchType,
        itemCount: batch.metadata.itemCount,
        merkleRoot: batch.merkleRoot.substring(0, 16) + '...'
      });

      const batchMessage = {
        batchId: batch.metadata.batchId,
        merkleRoot: batch.merkleRoot,
        itemCount: batch.metadata.itemCount,
        type: 'BATCH',
        batchType: batchType,
        timestamp: batch.metadata.timestamp,
        version: '3.0'
      };

      // Ancrer le batch
      const result = await this.anchorHashDirect(batch.merkleRoot, 'BATCH', batchMessage);

      logger.info('Batch anchored successfully', {
        batchId: batch.metadata.batchId,
        transactionId: result.transactionId,
        topicId: result.topicId
      });

      // TODO: Sauvegarder les preuves Merkle en DB pour chaque item
      // Pour permettre la vérification individuelle plus tard

      return result;

    } catch (error) {
      logger.error('Error anchoring batch:', error);
      throw error;
    }
  }

  // Déterminer le type de consultation pour un ancrage enrichi
  getConsultationType(record) {
    const type = record.type?.toLowerCase();

    const consultationTypes = {
      'consultation': 'GENERAL_CONSULTATION',
      'urgence': 'EMERGENCY',
      'controle': 'FOLLOW_UP',
      'specialiste': 'SPECIALIST',
      'chirurgie': 'SURGERY',
      'radiologie': 'RADIOLOGY',
      'laboratoire': 'LABORATORY',
      'vaccination': 'VACCINATION',
      'dentaire': 'DENTAL',
      'psychiatrie': 'PSYCHIATRY',
      'cardiologie': 'CARDIOLOGY',
      'dermatologie': 'DERMATOLOGY'
    };

    return consultationTypes[type] || 'GENERAL_CONSULTATION';
  }

  // Extraire les données médicales enrichies selon le type
  extractMedicalData(record) {
    const baseData = {
      symptoms: this.extractSymptoms(record.description),
      treatments: this.extractTreatments(record.prescription),
      recommendations: this.extractRecommendations(record.description),
      vitalSigns: this.extractVitalSigns(record.metadata),
      allergies: this.extractAllergies(record.metadata),
      medications: this.extractMedications(record.prescription)
    };

    // Données spécifiques selon le type de consultation
    switch (record.type?.toLowerCase()) {
      case 'urgence':
        return {
          ...baseData,
          emergencyLevel: this.extractEmergencyLevel(record),
          triageCategory: this.extractTriageCategory(record),
          admissionRequired: this.extractAdmissionStatus(record)
        };

      case 'controle':
        return {
          ...baseData,
          followUpReason: this.extractFollowUpReason(record),
          previousVisitRef: this.extractPreviousVisitRef(record),
          improvementStatus: this.extractImprovementStatus(record)
        };

      case 'vaccination':
        return {
          ...baseData,
          vaccineType: this.extractVaccineType(record),
          batchNumber: this.extractBatchNumber(record),
          administrationSite: this.extractAdministrationSite(record),
          nextDoseDate: this.extractNextDoseDate(record)
        };

      case 'laboratoire':
        return {
          ...baseData,
          testType: this.extractTestType(record),
          results: this.extractLabResults(record),
          referenceValues: this.extractReferenceValues(record),
          interpretation: this.extractResultInterpretation(record)
        };

      default:
        return baseData;
    }
  }

  // Méthodes d'extraction de données spécifiques
  extractSymptoms(description) {
    if (!description) return [];
    const symptomsKeywords = ['douleur', 'fièvre', 'toux', 'fatigue', 'nausée', 'maux de tête'];
    return symptomsKeywords.filter(keyword =>
      description.toLowerCase().includes(keyword)
    );
  }

  extractTreatments(prescription) {
    if (!prescription) return [];

    // Si c'est un array, extraire les noms des médicaments
    if (Array.isArray(prescription)) {
      return prescription.map(p => {
        if (typeof p === 'object' && p.medication) {
          return p.medication;
        } else if (typeof p === 'string') {
          return p;
        }
        return null;
      }).filter(t => t && t.length > 0);
    }

    // Si c'est une chaîne, diviser par virgules
    if (typeof prescription === 'string') {
      return prescription.split(',').map(t => t.trim()).filter(t => t.length > 0);
    }

    // Si c'est un objet unique avec medication
    if (typeof prescription === 'object' && prescription.medication) {
      return [prescription.medication];
    }

    return [];
  }

  extractRecommendations(description) {
    if (!description) return [];
    const recommendations = [];
    if (description.includes('repos')) recommendations.push('rest');
    if (description.includes('hydratation')) recommendations.push('hydration');
    if (description.includes('suivi')) recommendations.push('follow_up');
    return recommendations;
  }

  extractVitalSigns(metadata) {
    if (!metadata || typeof metadata !== 'object') return {};
    return {
      temperature: metadata.temperature || null,
      bloodPressure: metadata.bloodPressure || null,
      heartRate: metadata.heartRate || null,
      weight: metadata.weight || null,
      height: metadata.height || null
    };
  }

  extractAllergies(metadata) {
    if (!metadata || !metadata.allergies) return [];
    return Array.isArray(metadata.allergies) ? metadata.allergies : [];
  }

  extractMedications(prescription) {
    if (!prescription) return [];

    // Si c'est un array d'objets medication
    if (Array.isArray(prescription)) {
      return prescription.map(p => {
        if (typeof p === 'object' && p.medication) {
          return {
            name: p.medication,
            dosage: p.dosage || 'non spécifié'
          };
        } else if (typeof p === 'string') {
          const parts = p.trim().split(' ');
          return {
            name: parts[0],
            dosage: parts.slice(1).join(' ') || 'non spécifié'
          };
        }
        return null;
      }).filter(m => m !== null);
    }

    // Si c'est une chaîne, parser les médicaments
    if (typeof prescription === 'string') {
      const medications = prescription.split(',').map(med => {
        const parts = med.trim().split(' ');
        return {
          name: parts[0],
          dosage: parts.slice(1).join(' ') || 'non spécifié'
        };
      });
      return medications;
    }

    // Si c'est un objet unique
    if (typeof prescription === 'object' && prescription.medication) {
      return [{
        name: prescription.medication,
        dosage: prescription.dosage || 'non spécifié'
      }];
    }

    return [];
  }

  // Méthodes pour types spécifiques
  extractEmergencyLevel(record) {
    const description = record.description?.toLowerCase() || '';
    if (description.includes('critique') || description.includes('urgent')) return 'HIGH';
    if (description.includes('modéré')) return 'MEDIUM';
    return 'LOW';
  }

  extractTriageCategory(record) {
    const title = record.title?.toLowerCase() || '';
    if (title.includes('rouge')) return 'RED';
    if (title.includes('orange')) return 'ORANGE';
    if (title.includes('jaune')) return 'YELLOW';
    if (title.includes('vert')) return 'GREEN';
    return 'UNASSIGNED';
  }

  extractAdmissionStatus(record) {
    const description = record.description?.toLowerCase() || '';
    return description.includes('hospitalisation') || description.includes('admission');
  }

  extractFollowUpReason(record) {
    return record.title?.includes('contrôle') ? 'ROUTINE_CHECKUP' : 'TREATMENT_MONITORING';
  }

  extractPreviousVisitRef(record) {
    // Extraire référence à visite précédente depuis metadata
    return record.metadata?.previousVisitId || null;
  }

  extractImprovementStatus(record) {
    const description = record.description?.toLowerCase() || '';
    if (description.includes('amélioration')) return 'IMPROVED';
    if (description.includes('stable')) return 'STABLE';
    if (description.includes('détérioration')) return 'WORSENED';
    return 'UNKNOWN';
  }

  extractVaccineType(record) {
    const prescription = record.prescription?.toLowerCase() || '';
    if (prescription.includes('covid')) return 'COVID-19';
    if (prescription.includes('grippe')) return 'INFLUENZA';
    if (prescription.includes('hepatite')) return 'HEPATITIS';
    return 'OTHER';
  }

  extractBatchNumber(record) {
    return record.metadata?.batchNumber || null;
  }

  extractAdministrationSite(record) {
    return record.metadata?.administrationSite || 'bras gauche';
  }

  extractNextDoseDate(record) {
    return record.metadata?.nextDoseDate || null;
  }

  extractTestType(record) {
    const title = record.title?.toLowerCase() || '';
    if (title.includes('sang')) return 'BLOOD_TEST';
    if (title.includes('urine')) return 'URINE_TEST';
    if (title.includes('biopsie')) return 'BIOPSY';
    return 'OTHER';
  }

  extractLabResults(record) {
    return record.metadata?.labResults || {};
  }

  extractReferenceValues(record) {
    return record.metadata?.referenceValues || {};
  }

  extractResultInterpretation(record) {
    const diagnosis = record.diagnosis?.toLowerCase() || '';
    if (diagnosis.includes('normal')) return 'NORMAL';
    if (diagnosis.includes('élevé') || diagnosis.includes('haut')) return 'HIGH';
    if (diagnosis.includes('bas') || diagnosis.includes('faible')) return 'LOW';
    return 'REQUIRES_REVIEW';
  }

  /**
   * Ancre un dossier médical sur Hedera (OPTIMISÉ - hash only)
   */
  async anchorRecord(record) {
    const startTime = Date.now();

    logger.logServerAction('HEDERA', 'RECORD_ANCHOR_START', {
      recordId: record.id,
      recordType: record.type,
      patientId: record.patientId,
      doctorId: record.doctorId,
      useBatching: this.useBatching,
      success: true
    });

    try {
      // Generate hash (les données complètes restent en DB)
      const hash = hashService.generateRecordHash(record);

      // Si batching activé, ajouter au batch
      if (this.useBatching) {
        const batchResult = await batchAggregatorService.addToBatch('MEDICAL_RECORD', record);

        logger.logServerAction('HEDERA', 'RECORD_BATCHED', {
          recordId: record.id,
          hash: hash.substring(0, 16) + '...',
          batchSize: batchResult.currentBatchSize,
          success: true
        });

        return {
          success: true,
          batched: true,
          hash: hash,
          batchSize: batchResult.currentBatchSize,
          responseTime: Date.now() - startTime
        };
      }

      // Sinon, ancrer directement (hash only)
      const result = await this.anchorHashDirect(hash, 'MEDICAL_RECORD', {
        recordId: record.id,
        recordType: record.type,
        patientId: record.patientId,
        doctorId: record.doctorId,
        timestamp: new Date().toISOString()
      });

      const responseTime = Date.now() - startTime;

      // Mettre à jour le record avec les informations Hedera
      await record.update({
        hash: hash,
        hederaTransactionId: result.transactionId,
        hederaSequenceNumber: result.sequenceNumber,
        hederaTopicId: result.topicId,
        hederaTimestamp: result.consensusTimestamp,
        isVerified: true,
        lastVerifiedAt: new Date()
      });

      logger.logServerAction('HEDERA', 'RECORD_ANCHOR_SUCCESS', {
        recordId: record.id,
        transactionId: result.transactionId,
        sequenceNumber: result.sequenceNumber,
        responseTime: responseTime,
        compressed: result.compressed,
        success: true
      });

      // Monitoring
      monitoringService.recordHederaTransaction('SUCCESS', responseTime, {
        recordId: record.id,
        recordType: record.type,
        sequenceNumber: result.sequenceNumber
      });

      // Générer les liens de vérification
      const verificationLinks = hashscanService.generateVerificationLink(record, {
        hash: hash,
        transactionId: result.transactionId,
        topicId: result.topicId,
        sequenceNumber: result.sequenceNumber,
        timestamp: result.timestamp
      });

      return {
        success: true,
        batched: false,
        hash,
        ...result,
        responseTime,
        verification: verificationLinks.verification
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;

      logger.logServerAction('HEDERA', 'RECORD_ANCHOR_FAILED', {
        recordId: record.id,
        error: error.message,
        duration: responseTime,
        success: false
      });

      monitoringService.recordHederaTransaction('FAILED', responseTime, {
        recordId: record.id,
        recordType: record.type,
        error: error.message
      });

      throw new Error(`Échec ancrage record: ${error.message}`);
    }
  }

  async verifyRecord(record) {
    try {
      // Utiliser la nouvelle méthode de vérification avec HCS
      return await hashService.verifyHashWithHCS(record);
    } catch (error) {
      console.error('Error verifying record:', error);
      throw error;
    }
  }
}

module.exports = new HederaService();