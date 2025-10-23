'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('hedera_transactions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      type: {
        type: Sequelize.ENUM(
          'PRESCRIPTION',
          'MEDICAL_RECORD',
          'PRESCRIPTION_DELIVERY',
          'ACCESS_LOG',
          'BATCH'
        ),
        allowNull: false,
        comment: 'Type de données ancrées'
      },
      entityType: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Type d\'entité (Prescription, MedicalRecord, etc.)'
      },
      entityId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'ID de l\'entité dans sa table respective'
      },
      hash: {
        type: Sequelize.STRING(64),
        allowNull: false,
        comment: 'Hash SHA-256 des données'
      },
      hederaTransactionId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Transaction ID Hedera (format: 0.0.xxx@timestamp)'
      },
      hederaTopicId: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Topic ID utilisé (0.0.xxx)'
      },
      hederaSequenceNumber: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Numéro de séquence dans le topic'
      },
      hederaConsensusTimestamp: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Timestamp de consensus Hedera'
      },
      isBatch: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Indique si c\'est un batch Merkle'
      },
      batchId: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'ID du batch Merkle si applicable'
      },
      merkleRoot: {
        type: Sequelize.STRING(64),
        allowNull: true,
        comment: 'Racine Merkle du batch'
      },
      merkleProof: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Preuve Merkle pour cet item (si batché)'
      },
      merkleIndex: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Index de l\'item dans le batch Merkle'
      },
      compressed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Indique si le message a été compressé'
      },
      messageSize: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Taille du message en bytes'
      },
      compressionRatio: {
        type: Sequelize.FLOAT,
        allowNull: true,
        comment: 'Ratio de compression si applicable'
      },
      responseTime: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Temps de réponse en ms'
      },
      attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        comment: 'Nombre de tentatives avant succès'
      },
      rateLimitWaitTime: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Temps d\'attente du rate limiter en ms'
      },
      status: {
        type: Sequelize.ENUM('SUCCESS', 'FAILED', 'PENDING'),
        defaultValue: 'SUCCESS',
        allowNull: false
      },
      error: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Message d\'erreur si échec'
      },
      estimatedCost: {
        type: Sequelize.DECIMAL(10, 6),
        allowNull: true,
        comment: 'Coût estimé en HBAR'
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Métadonnées supplémentaires'
      },
      verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Indique si la transaction a été vérifiée via Mirror Node'
      },
      verifiedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Date de vérification'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Créer les index
    await queryInterface.addIndex('hedera_transactions', ['hederaTransactionId'], {
      name: 'hedera_transactions_transaction_id_index'
    });

    await queryInterface.addIndex('hedera_transactions', ['hash'], {
      name: 'hedera_transactions_hash_index'
    });

    await queryInterface.addIndex('hedera_transactions', ['entityType', 'entityId'], {
      name: 'hedera_transactions_entity_index'
    });

    await queryInterface.addIndex('hedera_transactions', ['type'], {
      name: 'hedera_transactions_type_index'
    });

    await queryInterface.addIndex('hedera_transactions', ['batchId'], {
      name: 'hedera_transactions_batch_id_index'
    });

    await queryInterface.addIndex('hedera_transactions', ['status'], {
      name: 'hedera_transactions_status_index'
    });

    await queryInterface.addIndex('hedera_transactions', ['createdAt'], {
      name: 'hedera_transactions_created_at_index'
    });
  },

  async down(queryInterface, Sequelize) {
    // Supprimer les index d'abord
    await queryInterface.removeIndex('hedera_transactions', 'hedera_transactions_transaction_id_index');
    await queryInterface.removeIndex('hedera_transactions', 'hedera_transactions_hash_index');
    await queryInterface.removeIndex('hedera_transactions', 'hedera_transactions_entity_index');
    await queryInterface.removeIndex('hedera_transactions', 'hedera_transactions_type_index');
    await queryInterface.removeIndex('hedera_transactions', 'hedera_transactions_batch_id_index');
    await queryInterface.removeIndex('hedera_transactions', 'hedera_transactions_status_index');
    await queryInterface.removeIndex('hedera_transactions', 'hedera_transactions_created_at_index');

    // Supprimer la table
    await queryInterface.dropTable('hedera_transactions');
  }
};
