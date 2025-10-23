const merkleTreeService = require('./merkleTreeService');
const hashService = require('./hashService');
const logger = require('../utils/logger');
const EventEmitter = require('events');

/**
 * Service d'agrégation par batch pour optimiser l'anchoring sur Hedera
 * Collecte plusieurs enregistrements et les ancre ensemble via Merkle Tree
 */
class BatchAggregatorService extends EventEmitter {
  constructor() {
    super();

    // Configuration
    this.maxBatchSize = parseInt(process.env.HEDERA_MAX_BATCH_SIZE) || 50;
    this.minBatchSize = parseInt(process.env.HEDERA_MIN_BATCH_SIZE) || 10;
    this.batchTimeoutMs = parseInt(process.env.HEDERA_BATCH_TIMEOUT_MS) || 300000; // 5 minutes
    this.enabled = process.env.HEDERA_BATCHING_ENABLED !== 'false'; // Activé par défaut

    // Batches en cours par type
    this.batches = {
      PRESCRIPTION: [],
      MEDICAL_RECORD: [],
      PRESCRIPTION_DELIVERY: [],
      ACCESS_LOG: []
    };

    // Timers pour chaque type
    this.timers = {};

    // Statistiques
    this.stats = {
      batchesCreated: 0,
      itemsAggregated: 0,
      avgBatchSize: 0,
      totalSavings: 0
    };
  }

  /**
   * Ajoute un item à un batch
   */
  async addToBatch(type, data) {
    if (!this.enabled) {
      // Si batching désactivé, retourner immédiatement pour traitement individuel
      return {
        batched: false,
        reason: 'Batching disabled'
      };
    }

    if (!this.batches[type]) {
      this.batches[type] = [];
    }

    // Générer le hash de l'item
    const itemHash = this.generateItemHash(type, data);

    // Créer l'item de batch
    const batchItem = {
      type,
      data,
      hash: itemHash,
      addedAt: new Date(),
      batchId: null // Sera assigné lors de la création du batch
    };

    // Ajouter au batch en cours
    this.batches[type].push(batchItem);

    logger.debug(`Item added to ${type} batch`, {
      hash: itemHash.substring(0, 16) + '...',
      currentBatchSize: this.batches[type].length,
      maxBatchSize: this.maxBatchSize
    });

    // Démarrer le timer si c'est le premier item
    if (this.batches[type].length === 1) {
      this.startBatchTimer(type);
    }

    // Si le batch est plein, le traiter immédiatement
    if (this.batches[type].length >= this.maxBatchSize) {
      await this.processBatch(type);
    }

    return {
      batched: true,
      currentBatchSize: this.batches[type].length,
      maxBatchSize: this.maxBatchSize
    };
  }

  /**
   * Génère un hash pour un item selon son type
   */
  generateItemHash(type, data) {
    switch (type) {
      case 'PRESCRIPTION':
        return hashService.generateDataHash({
          matricule: data.matricule,
          medication: data.medication,
          dosage: data.dosage,
          quantity: data.quantity,
          patientId: data.patientId,
          doctorId: data.doctorId,
          actionType: data.actionType || 'CREATED'
        });

      case 'MEDICAL_RECORD':
        return hashService.generateRecordHash(data);

      case 'PRESCRIPTION_DELIVERY':
        return hashService.generateDataHash({
          prescriptionId: data.id,
          matricule: data.matricule,
          pharmacyId: data.pharmacyId,
          deliveryDate: data.deliveryDate,
          actionType: 'DELIVERED'
        });

      case 'ACCESS_LOG':
        return hashService.generateDataHash(data);

      default:
        return hashService.generateHash(data);
    }
  }

  /**
   * Démarre le timer pour un type de batch
   */
  startBatchTimer(type) {
    // Clear timer existant si présent
    if (this.timers[type]) {
      clearTimeout(this.timers[type]);
    }

    this.timers[type] = setTimeout(() => {
      logger.info(`Batch timeout reached for ${type}, processing...`);
      this.processBatch(type);
    }, this.batchTimeoutMs);
  }

  /**
   * Traite un batch (crée le Merkle Tree et émet un événement)
   */
  async processBatch(type) {
    // Clear le timer
    if (this.timers[type]) {
      clearTimeout(this.timers[type]);
      delete this.timers[type];
    }

    // Récupérer les items du batch
    const items = this.batches[type];

    // Vérifier si le batch a assez d'items
    if (items.length === 0) {
      return null;
    }

    // Si moins que le minimum, attendre encore un peu (sauf si timeout)
    if (items.length < this.minBatchSize && items.length < this.maxBatchSize) {
      logger.debug(`Batch size (${items.length}) below minimum (${this.minBatchSize}), extending timeout`);
      // Redémarrer le timer pour encore 1 minute
      this.timers[type] = setTimeout(() => {
        this.processBatch(type);
      }, 60000);
      return null;
    }

    // Réinitialiser le batch
    this.batches[type] = [];

    try {
      logger.info(`Processing ${type} batch`, {
        itemCount: items.length,
        minSize: this.minBatchSize,
        maxSize: this.maxBatchSize
      });

      // Extraire les hashs
      const hashes = items.map(item => item.hash);

      // Créer le Merkle Tree
      const batch = merkleTreeService.createBatch(hashes);

      // Ajouter les métadonnées
      batch.metadata.type = type;
      batch.metadata.items = items.map((item, index) => ({
        id: item.data.id,
        type: item.type,
        hash: item.hash,
        index: index,
        proof: batch.proofs[index]
      }));

      // Mettre à jour les statistiques
      this.stats.batchesCreated++;
      this.stats.itemsAggregated += items.length;
      this.stats.avgBatchSize = this.stats.itemsAggregated / this.stats.batchesCreated;

      // Calculer les économies
      const savings = merkleTreeService.calculateSavings(items.length, 500);
      this.stats.totalSavings += savings.savings.costSaved;

      logger.info(`Batch created successfully`, {
        batchId: batch.metadata.batchId,
        type: type,
        itemCount: items.length,
        merkleRoot: batch.merkleRoot.substring(0, 16) + '...',
        savings: `${savings.savings.savingsPercent}%`,
        costSaved: `${savings.savings.costSaved.toFixed(6)} HBAR`
      });

      // Émettre un événement pour que le hederaService puisse l'ancrer
      this.emit('batch-ready', {
        batch,
        type,
        items,
        savings
      });

      return batch;

    } catch (error) {
      logger.error(`Error processing ${type} batch:`, error);

      // Remettre les items dans le batch en cas d'erreur
      this.batches[type] = items;

      throw error;
    }
  }

  /**
   * Force le traitement de tous les batches en cours
   */
  async flushAll() {
    logger.info('Flushing all pending batches...');

    const results = {};

    for (const type of Object.keys(this.batches)) {
      if (this.batches[type].length > 0) {
        try {
          const batch = await this.processBatch(type);
          results[type] = {
            success: true,
            itemCount: batch?.metadata?.itemCount || 0,
            batchId: batch?.metadata?.batchId
          };
        } catch (error) {
          results[type] = {
            success: false,
            error: error.message
          };
        }
      }
    }

    return results;
  }

  /**
   * Force le traitement d'un type spécifique
   */
  async flush(type) {
    if (!this.batches[type] || this.batches[type].length === 0) {
      return null;
    }

    return await this.processBatch(type);
  }

  /**
   * Récupère les statistiques
   */
  getStats() {
    return {
      ...this.stats,
      currentBatches: Object.keys(this.batches).reduce((acc, type) => {
        acc[type] = this.batches[type].length;
        return acc;
      }, {}),
      config: {
        enabled: this.enabled,
        maxBatchSize: this.maxBatchSize,
        minBatchSize: this.minBatchSize,
        batchTimeoutMs: this.batchTimeoutMs
      }
    };
  }

  /**
   * Récupère le statut d'un batch
   */
  getBatchStatus(type) {
    return {
      type,
      currentSize: this.batches[type]?.length || 0,
      maxSize: this.maxBatchSize,
      minSize: this.minBatchSize,
      hasTimer: !!this.timers[type],
      items: this.batches[type] || []
    };
  }

  /**
   * Active/désactive le batching
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    logger.info(`Batch aggregation ${enabled ? 'enabled' : 'disabled'}`);

    if (!enabled) {
      // Traiter tous les batches en cours avant de désactiver
      this.flushAll();
    }
  }

  /**
   * Nettoie les ressources
   */
  cleanup() {
    // Clear tous les timers
    Object.keys(this.timers).forEach(type => {
      if (this.timers[type]) {
        clearTimeout(this.timers[type]);
      }
    });

    this.timers = {};

    logger.info('Batch aggregator cleaned up');
  }
}

module.exports = new BatchAggregatorService();
