const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Module pour historiser toutes les transactions Hedera
 * Permet un audit complet et la récupération des preuves Merkle
 */
const HederaTransaction = sequelize.define('HederaTransaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  // Type de transaction
  type: {
    type: DataTypes.ENUM(
      'PRESCRIPTION',
      'MEDICAL_RECORD',
      'PRESCRIPTION_DELIVERY',
      'ACCESS_LOG',
      'BATCH'
    ),
    allowNull: false,
    comment: 'Type de donn�es ancr�es'
  },

  // Identifiant de l'entit� ancr�e
  entityType: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Type d\'entit� (Prescription, MedicalRecord, etc.)'
  },

  entityId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID de l\'entit� dans sa table respective'
  },

  // Hash ancr�
  hash: {
    type: DataTypes.STRING(64),
    allowNull: false,
    comment: 'Hash SHA-256 des donn�es'
  },

  // Informations Hedera
  hederaTransactionId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Transaction ID Hedera (format: 0.0.xxx@timestamp)'
  },

  hederaTopicId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Topic ID utilis� (0.0.xxx)'
  },

  hederaSequenceNumber: {
    type: DataTypes.STRING,
    comment: 'Num�ro de s�quence dans le topic'
  },

  hederaConsensusTimestamp: {
    type: DataTypes.STRING,
    comment: 'Timestamp de consensus Hedera'
  },

  // Batch information (si applicable)
  isBatch: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Indique si c\'est un batch Merkle'
  },

  batchId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'ID du batch Merkle si applicable'
  },

  merkleRoot: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: 'Racine Merkle du batch'
  },

  merkleProof: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Preuve Merkle pour cet item (si batch�)'
  },

  merkleIndex: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Index de l\'item dans le batch Merkle'
  },

  // M�tadonn�es de la transaction
  compressed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Indique si le message a �t� compress�'
  },

  messageSize: {
    type: DataTypes.INTEGER,
    comment: 'Taille du message en bytes'
  },

  compressionRatio: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'Ratio de compression si applicable'
  },

  // Performance
  responseTime: {
    type: DataTypes.INTEGER,
    comment: 'Temps de r�ponse en ms'
  },

  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'Nombre de tentatives avant succ�s'
  },

  rateLimitWaitTime: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Temps d\'attente du rate limiter en ms'
  },

  // Statut
  status: {
    type: DataTypes.ENUM('SUCCESS', 'FAILED', 'PENDING'),
    defaultValue: 'SUCCESS',
    allowNull: false
  },

  error: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Message d\'erreur si �chec'
  },

  // Co�t estim�
  estimatedCost: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: true,
    comment: 'Co�t estim� en HBAR'
  },

  // M�tadonn�es additionnelles
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'M�tadonn�es suppl�mentaires'
  },

  // Verification
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Indique si la transaction a �t� v�rifi�e via Mirror Node'
  },

  verifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date de v�rification'
  },

  // Timestamps
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },

  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'hedera_transactions',
  timestamps: true,
  indexes: [
    {
      fields: ['hederaTransactionId']
    },
    {
      fields: ['hash']
    },
    {
      fields: ['entityType', 'entityId']
    },
    {
      fields: ['type']
    },
    {
      fields: ['batchId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['createdAt']
    }
  ]
});

/**
 * M�thodes statiques
 */

// Cr�er une transaction pour un anchoring direct
HederaTransaction.createForAnchor = async function(data) {
  return await this.create({
    type: data.type,
    entityType: data.entityType,
    entityId: data.entityId,
    hash: data.hash,
    hederaTransactionId: data.transactionId,
    hederaTopicId: data.topicId,
    hederaSequenceNumber: data.sequenceNumber,
    hederaConsensusTimestamp: data.consensusTimestamp,
    compressed: data.compressed || false,
    messageSize: data.messageSize,
    compressionRatio: data.compressionRatio,
    responseTime: data.responseTime,
    attempts: data.attempts || 1,
    rateLimitWaitTime: data.rateLimitWaitTime || 0,
    status: 'SUCCESS',
    estimatedCost: data.estimatedCost || 0.0001,
    metadata: data.metadata || {}
  });
};

// Cr�er une transaction pour un batch
HederaTransaction.createForBatch = async function(batchData, items) {
  const transactions = [];

  // Cr�er la transaction du batch principal
  const batchTx = await this.create({
    type: 'BATCH',
    entityType: 'Batch',
    entityId: 0,
    hash: batchData.merkleRoot,
    hederaTransactionId: batchData.transactionId,
    hederaTopicId: batchData.topicId,
    hederaSequenceNumber: batchData.sequenceNumber,
    hederaConsensusTimestamp: batchData.consensusTimestamp,
    isBatch: true,
    batchId: batchData.batchId,
    merkleRoot: batchData.merkleRoot,
    compressed: batchData.compressed || false,
    messageSize: batchData.messageSize,
    responseTime: batchData.responseTime,
    status: 'SUCCESS',
    estimatedCost: 0.0001,
    metadata: {
      itemCount: items.length,
      batchType: batchData.batchType
    }
  });

  transactions.push(batchTx);

  // Cr�er une entr�e pour chaque item du batch
  for (const item of items) {
    const itemTx = await this.create({
      type: item.type,
      entityType: item.entityType,
      entityId: item.entityId,
      hash: item.hash,
      hederaTransactionId: batchData.transactionId, // M�me transaction
      hederaTopicId: batchData.topicId,
      hederaSequenceNumber: batchData.sequenceNumber,
      hederaConsensusTimestamp: batchData.consensusTimestamp,
      isBatch: false,
      batchId: batchData.batchId,
      merkleRoot: batchData.merkleRoot,
      merkleProof: item.proof,
      merkleIndex: item.index,
      status: 'SUCCESS',
      estimatedCost: 0.0001 / items.length, // Co�t divis�
      metadata: item.metadata || {}
    });

    transactions.push(itemTx);
  }

  return transactions;
};

// Rechercher une transaction par hash
HederaTransaction.findByHash = async function(hash) {
  return await this.findOne({
    where: { hash },
    order: [['createdAt', 'DESC']]
  });
};

// Rechercher les transactions d'une entit�
HederaTransaction.findByEntity = async function(entityType, entityId) {
  return await this.findAll({
    where: {
      entityType,
      entityId
    },
    order: [['createdAt', 'DESC']]
  });
};

// Rechercher les transactions d'un batch
HederaTransaction.findByBatchId = async function(batchId) {
  return await this.findAll({
    where: { batchId },
    order: [['merkleIndex', 'ASC']]
  });
};

// Obtenir les statistiques
HederaTransaction.getStats = async function(startDate, endDate) {
  const { Op } = require('sequelize');

  const where = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt[Op.gte] = startDate;
    if (endDate) where.createdAt[Op.lte] = endDate;
  }

  const [stats] = await this.findAll({
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalTransactions'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN "isBatch" = true THEN 1 END')), 'batchTransactions'],
      [sequelize.fn('AVG', sequelize.col('responseTime')), 'avgResponseTime'],
      [sequelize.fn('AVG', sequelize.col('compressionRatio')), 'avgCompressionRatio'],
      [sequelize.fn('SUM', sequelize.col('estimatedCost')), 'totalCost'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN "status" = \'SUCCESS\' THEN 1 END')), 'successCount'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN "status" = \'FAILED\' THEN 1 END')), 'failedCount']
    ],
    where,
    raw: true
  });

  return stats;
};

module.exports = HederaTransaction;
