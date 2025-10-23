const logger = require('../utils/logger');
const hederaClient = require('../config/hedera');
const hashService = require('./hashService');
const compressionService = require('./compressionService');
const rateLimiterService = require('./rateLimiterService');
const HederaTransaction = require('../models/HederaTransaction');

/**
 * Service de queue pour gérer les échecs d'ancrage Hedera
 * Implémente un système de retry avec backoff exponentiel
 */
class HederaQueueService {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.maxRetries = 5;
    this.baseDelay = 2000; // 2 secondes
    this.maxDelay = 60000; // 60 secondes
  }

  /**
   * Ajoute un enregistrement à la queue d'ancrage
   */
  async enqueue(data, type = 'MEDICAL_RECORD', metadata = {}) {
    const queueItem = {
      id: `${type}_${data.id}_${Date.now()}`,
      type,
      data,
      metadata,
      attempts: 0,
      maxRetries: this.maxRetries,
      addedAt: new Date(),
      lastAttempt: null,
      nextRetry: new Date(),
      status: 'pending',
      error: null
    };

    this.queue.push(queueItem);

    logger.info(`📥 Item added to Hedera queue: ${queueItem.id}`, {
      type,
      dataId: data.id,
      queueSize: this.queue.length
    });

    // Démarrer le traitement si pas déjà en cours
    if (!this.isProcessing) {
      this.processQueue();
    }

    return queueItem.id;
  }

  /**
   * Traite la queue d'ancrage
   */
  async processQueue() {
    if (this.isProcessing) return;

    this.isProcessing = true;
    logger.info('🔄 Starting Hedera queue processing...');

    while (this.queue.length > 0) {
      const now = new Date();

      // Trouver le prochain item prêt à être traité
      const itemIndex = this.queue.findIndex(
        item => item.status === 'pending' && item.nextRetry <= now
      );

      if (itemIndex === -1) {
        // Aucun item prêt, attendre
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Si toujours rien après attente, arrêter
        const readyItems = this.queue.filter(
          item => item.status === 'pending' && item.nextRetry <= now
        );

        if (readyItems.length === 0) {
          break;
        }
        continue;
      }

      const item = this.queue[itemIndex];
      await this.processItem(item);

      // Retirer de la queue si traité avec succès ou échec définitif
      if (item.status === 'success' || item.status === 'failed') {
        this.queue.splice(itemIndex, 1);
      }
    }

    this.isProcessing = false;
    logger.info('✅ Hedera queue processing completed', {
      remainingItems: this.queue.length
    });
  }

  /**
   * Traite un item de la queue
   */
  async processItem(item) {
    item.attempts++;
    item.lastAttempt = new Date();

    logger.info(`🔄 Processing queue item: ${item.id} (attempt ${item.attempts}/${item.maxRetries})`);

    try {
      let result;

      switch (item.type) {
        case 'MEDICAL_RECORD':
          result = await this.anchorMedicalRecord(item.data);
          break;

        case 'PRESCRIPTION':
          result = await this.anchorPrescription(item.data);
          break;

        case 'PRESCRIPTION_DELIVERY':
          result = await this.anchorDelivery(item.data);
          break;

        default:
          throw new Error(`Unknown item type: ${item.type}`);
      }

      // Succès
      item.status = 'success';
      item.result = result;

      logger.info(`✅ Queue item processed successfully: ${item.id}`, {
        transactionId: result.transactionId,
        attempts: item.attempts
      });

      // Mettre à jour la base de données si callback fourni
      if (item.metadata.onSuccess) {
        await item.metadata.onSuccess(result);
      }

    } catch (error) {
      logger.error(`❌ Queue item processing failed: ${item.id}`, {
        attempt: item.attempts,
        error: error.message
      });

      item.error = error.message;

      // Déterminer si on doit réessayer
      if (item.attempts >= item.maxRetries) {
        item.status = 'failed';

        logger.error(`🚫 Queue item permanently failed: ${item.id}`, {
          totalAttempts: item.attempts,
          error: error.message
        });

        // Notification d'échec définitif
        if (item.metadata.onFailure) {
          await item.metadata.onFailure(error);
        }

        // Alerte admin
        this.alertAdmin(item);

      } else {
        // Calculer le prochain délai avec backoff exponentiel
        const delay = Math.min(
          this.baseDelay * Math.pow(2, item.attempts - 1),
          this.maxDelay
        );

        item.nextRetry = new Date(Date.now() + delay);

        logger.info(`🔄 Queue item will retry: ${item.id}`, {
          nextRetry: item.nextRetry,
          delayMs: delay
        });
      }
    }
  }

  /**
   * Ancre un dossier médical (OPTIMISÉ - hash only + compression)
   */
  async anchorMedicalRecord(record) {
    const hash = hashService.generateRecordHash(record);

    // Message minimal
    const messageData = {
      hash: hash,
      recordId: record.id,
      type: 'MEDICAL_RECORD',
      recordType: record.type,
      patientId: record.patientId,
      doctorId: record.doctorId,
      timestamp: new Date().toISOString(),
      version: '3.0'
    };

    // Compresser le message
    const compressionResult = await compressionService.compressHederaMessage(messageData);
    const message = JSON.stringify(compressionResult);

    // Utiliser rate limiter et envoyer au bon topic
    const result = await rateLimiterService.execute(async () => {
      return await hederaClient.submitMessage(message, 'MEDICAL_RECORD');
    });

    // Sauvegarder dans l'historique
    await HederaTransaction.createForAnchor({
      type: 'MEDICAL_RECORD',
      entityType: 'MedicalRecord',
      entityId: record.id,
      hash: hash,
      transactionId: result.transactionId,
      topicId: result.topicId,
      sequenceNumber: result.sequenceNumber,
      consensusTimestamp: result.consensusTimestamp,
      compressed: compressionResult.c,
      messageSize: Buffer.byteLength(message, 'utf8'),
      compressionRatio: compressionResult.meta?.ratio
    });

    return {
      hash,
      transactionId: result.transactionId,
      sequenceNumber: result.sequenceNumber,
      topicId: result.topicId,
      consensusTimestamp: result.consensusTimestamp,
      compressed: compressionResult.c
    };
  }

  /**
   * Ancre une prescription (OPTIMISÉ - hash only + compression)
   */
  async anchorPrescription(prescription) {
    const prescriptionData = {
      matricule: prescription.matricule,
      medication: prescription.medication,
      dosage: prescription.dosage,
      quantity: prescription.quantity,
      patientId: prescription.patientId,
      doctorId: prescription.doctorId,
      actionType: 'CREATED'
    };

    const hash = hashService.generateDataHash(prescriptionData);

    // Message minimal
    const messageData = {
      hash: hash,
      prescriptionId: prescription.id,
      matricule: prescription.matricule,
      type: 'PRESCRIPTION',
      actionType: 'CREATED',
      timestamp: new Date().toISOString(),
      version: '3.0'
    };

    // Compresser le message
    const compressionResult = await compressionService.compressHederaMessage(messageData);
    const message = JSON.stringify(compressionResult);

    // Utiliser rate limiter et envoyer au bon topic
    const result = await rateLimiterService.execute(async () => {
      return await hederaClient.submitMessage(message, 'PRESCRIPTION');
    });

    // Sauvegarder dans l'historique
    await HederaTransaction.createForAnchor({
      type: 'PRESCRIPTION',
      entityType: 'Prescription',
      entityId: prescription.id,
      hash: hash,
      transactionId: result.transactionId,
      topicId: result.topicId,
      sequenceNumber: result.sequenceNumber,
      consensusTimestamp: result.consensusTimestamp,
      compressed: compressionResult.c,
      messageSize: Buffer.byteLength(message, 'utf8'),
      compressionRatio: compressionResult.meta?.ratio
    });

    return {
      hash,
      transactionId: result.transactionId,
      sequenceNumber: result.sequenceNumber,
      topicId: result.topicId,
      consensusTimestamp: result.consensusTimestamp,
      compressed: compressionResult.c
    };
  }

  /**
   * Ancre une délivrance de médicament (OPTIMISÉ - hash only + compression)
   */
  async anchorDelivery(deliveryData) {
    const hash = hashService.generateDataHash(deliveryData);

    // Message minimal
    const messageData = {
      hash: hash,
      prescriptionId: deliveryData.id,
      matricule: deliveryData.matricule,
      type: 'PRESCRIPTION_DELIVERY',
      actionType: 'DELIVERED',
      pharmacyId: deliveryData.pharmacyId,
      deliveryDate: deliveryData.deliveryDate,
      timestamp: new Date().toISOString(),
      version: '3.0'
    };

    // Compresser le message
    const compressionResult = await compressionService.compressHederaMessage(messageData);
    const message = JSON.stringify(compressionResult);

    // Utiliser rate limiter et envoyer au bon topic
    const result = await rateLimiterService.execute(async () => {
      return await hederaClient.submitMessage(message, 'PRESCRIPTION_DELIVERY');
    });

    // Sauvegarder dans l'historique
    await HederaTransaction.createForAnchor({
      type: 'PRESCRIPTION_DELIVERY',
      entityType: 'Prescription',
      entityId: deliveryData.id,
      hash: hash,
      transactionId: result.transactionId,
      topicId: result.topicId,
      sequenceNumber: result.sequenceNumber,
      consensusTimestamp: result.consensusTimestamp,
      compressed: compressionResult.c,
      messageSize: Buffer.byteLength(message, 'utf8'),
      compressionRatio: compressionResult.meta?.ratio
    });

    return {
      hash,
      transactionId: result.transactionId,
      sequenceNumber: result.sequenceNumber,
      topicId: result.topicId,
      consensusTimestamp: result.consensusTimestamp,
      compressed: compressionResult.c
    };
  }

  /**
   * Alerte l'administrateur en cas d'échec définitif
   */
  alertAdmin(item) {
    logger.error('🚨 ADMIN ALERT: Hedera anchoring permanently failed', {
      itemId: item.id,
      type: item.type,
      dataId: item.data.id,
      attempts: item.attempts,
      error: item.error,
      addedAt: item.addedAt,
      lastAttempt: item.lastAttempt
    });

    // TODO: Envoyer notification email/SMS/Slack à l'admin
    // Exemple: notificationService.sendAdminAlert({ ... });
  }

  /**
   * Obtient le statut de la queue
   */
  getQueueStatus() {
    return {
      size: this.queue.length,
      isProcessing: this.isProcessing,
      items: this.queue.map(item => ({
        id: item.id,
        type: item.type,
        status: item.status,
        attempts: item.attempts,
        nextRetry: item.nextRetry,
        error: item.error
      }))
    };
  }

  /**
   * Vide la queue (utiliser avec précaution)
   */
  clearQueue() {
    const count = this.queue.length;
    this.queue = [];
    logger.warn(`🗑️  Queue cleared: ${count} items removed`);
    return count;
  }
}

module.exports = new HederaQueueService();
