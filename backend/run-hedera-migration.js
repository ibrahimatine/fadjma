/**
 * Script pour exécuter la migration HederaTransaction
 * Utilise directement Sequelize QueryInterface
 */

require('dotenv').config();
const { sequelize } = require('./src/config/database');

async function runMigration() {
  console.log('🚀 Exécution de la migration HederaTransaction...\n');

  try {
    const queryInterface = sequelize.getQueryInterface();
    const Sequelize = require('sequelize');

    // Vérifier si la table existe déjà
    const tables = await queryInterface.showAllTables();

    if (tables.includes('hedera_transactions')) {
      console.log('⚠️  La table hedera_transactions existe déjà');
      console.log('   Pour la recréer, supprimez-la d\'abord:');
      console.log('   DROP TABLE hedera_transactions;\n');
      process.exit(0);
    }

    console.log('📋 Création de la table hedera_transactions...');

    // Créer la table
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
        allowNull: false
      },
      entityType: {
        type: Sequelize.STRING,
        allowNull: false
      },
      entityId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      hash: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      hederaTransactionId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      hederaTopicId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      hederaSequenceNumber: {
        type: Sequelize.STRING,
        allowNull: true
      },
      hederaConsensusTimestamp: {
        type: Sequelize.STRING,
        allowNull: true
      },
      isBatch: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      batchId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      merkleRoot: {
        type: Sequelize.STRING(64),
        allowNull: true
      },
      merkleProof: {
        type: Sequelize.JSON,
        allowNull: true
      },
      merkleIndex: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      compressed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      messageSize: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      compressionRatio: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      responseTime: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      rateLimitWaitTime: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      status: {
        type: Sequelize.ENUM('SUCCESS', 'FAILED', 'PENDING'),
        defaultValue: 'SUCCESS',
        allowNull: false
      },
      error: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      estimatedCost: {
        type: Sequelize.DECIMAL(10, 6),
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true
      },
      verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      verifiedAt: {
        type: Sequelize.DATE,
        allowNull: true
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

    console.log('✅ Table créée avec succès\n');

    console.log('📊 Création des index...');

    // Créer les index
    const indexes = [
      { fields: ['hederaTransactionId'], name: 'hedera_transactions_transaction_id_index' },
      { fields: ['hash'], name: 'hedera_transactions_hash_index' },
      { fields: ['entityType', 'entityId'], name: 'hedera_transactions_entity_index' },
      { fields: ['type'], name: 'hedera_transactions_type_index' },
      { fields: ['batchId'], name: 'hedera_transactions_batch_id_index' },
      { fields: ['status'], name: 'hedera_transactions_status_index' },
      { fields: ['createdAt'], name: 'hedera_transactions_created_at_index' }
    ];

    for (const index of indexes) {
      await queryInterface.addIndex('hedera_transactions', index.fields, {
        name: index.name
      });
      console.log(`   ✅ Index ${index.name} créé`);
    }

    console.log('\n✅ Migration terminée avec succès!\n');
    console.log('📊 Structure de la table:');
    console.log('   - Colonnes: 28');
    console.log('   - Index: 7');
    console.log('   - Types ENUM: 2 (type, status)');
    console.log('\n🎉 Vous pouvez maintenant utiliser le modèle HederaTransaction\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erreur lors de la migration:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
