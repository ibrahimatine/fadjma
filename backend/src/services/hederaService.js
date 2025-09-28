const hederaClient = require('../config/hedera');
const hashService = require('./hashService');
const monitoringService = require('./monitoringService');
const hashscanService = require('./hashscanService');
const logger = require('../utils/logger');

class HederaService {
  constructor() {
    this.retryAttempts = 3;
    this.retryDelay = 2000; // 2 secondes
  }

  // Ancrer une prescription avec toutes ses données médicales
  async anchorPrescription(prescription, actionType = 'CREATED') {
    const startTime = Date.now();
    let attempt = 0;
    let lastError;

    logger.logServerAction('HEDERA', 'PRESCRIPTION_ANCHOR_START', {
      prescriptionId: prescription.id,
      matricule: prescription.matricule,
      actionType: actionType,
      success: true
    });

    while (attempt < this.retryAttempts) {
      try {
        attempt++;

        // Generate hash sur les données complètes de la prescription
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

        // Prepare enriched message with ALL prescription data
        const message = JSON.stringify({
          // Identifiants
          prescriptionId: prescription.id,
          matricule: prescription.matricule,
          hash: hash,
          timestamp: new Date().toISOString(),
          type: 'PRESCRIPTION',
          actionType: actionType, // 'CREATED', 'DISPENSED', 'VERIFIED'

          // Données médicales complètes
          medication: prescription.medication,
          dosage: prescription.dosage,
          quantity: prescription.quantity,
          instructions: prescription.instructions || null,
          issueDate: prescription.issueDate,

          // Participants
          patientId: prescription.patientId,
          doctorId: prescription.doctorId,
          pharmacyId: prescription.pharmacyId || null,

          // Statut et traçabilité
          deliveryStatus: prescription.deliveryStatus,
          deliveredAt: prescription.deliveredAt || null,
          createdAt: prescription.createdAt,
          updatedAt: prescription.updatedAt,

          // Version et métadonnées
          version: '2.0',
          dataHash: hash
        });

        // Submit to Hedera
        const result = await Promise.race([
          hederaClient.submitMessage(message),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout Hedera')), 15000)
          )
        ]);

        const responseTime = Date.now() - startTime;

        // Update prescription with Hedera info
        await prescription.update({
          hash: hash,
          hederaTransactionId: result.transactionId,
          hederaSequenceNumber: result.sequenceNumber,
          hederaTopicId: result.topicId,
          hederaTimestamp: result.consensusTimestamp,
          lastVerifiedAt: new Date()
        });

        logger.logServerAction('HEDERA', 'PRESCRIPTION_ANCHOR_SUCCESS', {
          prescriptionId: prescription.id,
          matricule: prescription.matricule,
          transactionId: result.transactionId,
          sequenceNumber: result.sequenceNumber,
          responseTime: responseTime,
          attempt: attempt,
          success: true
        });

        return {
          success: true,
          transactionId: result.transactionId,
          sequenceNumber: result.sequenceNumber,
          topicId: result.topicId,
          hash: hash,
          responseTime: responseTime,
          message: message
        };

      } catch (error) {
        lastError = error;
        logger.logServerAction('HEDERA', 'PRESCRIPTION_ANCHOR_RETRY', {
          prescriptionId: prescription.id,
          attempt: attempt,
          error: error.message,
          success: false
        });

        if (attempt < this.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        }
      }
    }

    // Tous les essais ont échoué
    logger.logServerAction('HEDERA', 'PRESCRIPTION_ANCHOR_FAILED', {
      prescriptionId: prescription.id,
      error: lastError.message,
      attempts: this.retryAttempts,
      success: false
    });

    throw new Error(`Échec ancrage prescription après ${this.retryAttempts} tentatives: ${lastError.message}`);
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
    return prescription.split(',').map(t => t.trim()).filter(t => t.length > 0);
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
    // Parser les médicaments depuis la prescription
    const medications = prescription.split(',').map(med => {
      const parts = med.trim().split(' ');
      return {
        name: parts[0],
        dosage: parts.slice(1).join(' ') || 'non spécifié'
      };
    });
    return medications;
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

  async anchorRecord(record) {
    const startTime = Date.now();
    let attempt = 0;
    let lastError;

    // Logger le début de l'ancrage
    logger.logServerAction('HEDERA', 'ANCHOR_START', {
      recordId: record.id,
      recordType: record.type,
      patientId: record.patientId,
      doctorId: record.doctorId,
      success: true
    });

    while (attempt < this.retryAttempts) {
      try {
        attempt++;
        logger.logServerAction('HEDERA', 'ANCHOR_ATTEMPT', {
          recordId: record.id,
          attempt: attempt,
          maxAttempts: this.retryAttempts,
          success: true
        });

        // Generate hash
        const hash = hashService.generateRecordHash(record);

        // Prepare enriched message for Hedera with full medical data
        const message = JSON.stringify({
          // Identifiants techniques
          recordId: record.id,
          hash: hash,
          timestamp: new Date().toISOString(),
          type: 'MEDICAL_RECORD',
          actionType: 'CREATED',

          // Données médicales complètes selon le type
          patientId: record.patientId,
          doctorId: record.doctorId,
          recordType: record.type,

          // Contenu médical complet
          title: record.title,
          description: record.description,
          diagnosis: record.diagnosis,
          prescription: record.prescription,
          attachments: record.attachments || [],

          // Métadonnées médicales supplémentaires
          metadata: record.metadata || {},

          // Données spécifiques selon le type de consultation
          consultationType: this.getConsultationType(record),
          medicalData: this.extractMedicalData(record),

          // Métadonnées de traçabilité
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          isVerified: record.isVerified || false,
          version: '2.0' // Nouvelle version avec données enrichies
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
          // Logger le succès
          logger.logServerAction('HEDERA', 'ANCHOR_SUCCESS', {
            recordId: record.id,
            transactionId: result.transactionId,
            topicId: result.topicId,
            sequenceNumber: result.sequenceNumber,
            duration: responseTime,
            attempt: attempt,
            success: true
          });

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
        } else {
          throw new Error(`Hedera error: ${result.error || result.status}`);
        }

      } catch (error) {
        // Logger l'échec de la tentative
        logger.logHederaError(error, {
          action: 'ANCHOR_ATTEMPT_FAILED',
          recordId: record.id,
          attempt: attempt,
          maxAttempts: this.retryAttempts
        });

        lastError = error;

        // Si ce n'est pas le dernier essai, attendre avant de réessayer
        if (attempt < this.retryAttempts) {
          logger.logServerAction('HEDERA', 'ANCHOR_RETRY_WAIT', {
            recordId: record.id,
            attempt: attempt,
            retryDelay: this.retryDelay,
            success: true
          });

          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        }
      }
    }

    // Toutes les tentatives ont échoué - propager l'erreur
    const responseTime = Date.now() - startTime;

    // Logger l'échec final
    logger.logServerAction('HEDERA', 'ANCHOR_FAILED', {
      recordId: record.id,
      duration: responseTime,
      attempts: this.retryAttempts,
      error: lastError?.message,
      success: false
    });

    // Enregistrer l'échec dans le monitoring
    monitoringService.recordHederaTransaction('FAILED', responseTime, {
      recordId: record.id,
      recordType: record.type,
      error: lastError?.message,
      attempts: this.retryAttempts
    });

    // Propager l'erreur au lieu de retourner un fallback
    const finalError = new Error(`Failed to anchor record ${record.id} to Hedera after ${this.retryAttempts} attempts: ${lastError.message}`);
    logger.logHederaError(finalError, {
      action: 'ANCHOR_FINAL_FAILURE',
      recordId: record.id
    });

    throw finalError;
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