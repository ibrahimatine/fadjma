/**
 * Script de migration pour ré-ancrer tous les enregistrements Hedera échoués
 *
 * Ce script:
 * 1. Identifie tous les dossiers médicaux et prescriptions avec ancrage échoué
 * 2. Ré-ancre chacun sur Hedera avec la nouvelle configuration fixée
 * 3. Met à jour la base de données avec les nouvelles informations
 */

// Charger les variables d'environnement
require('dotenv').config();

const { MedicalRecord, Prescription, sequelize } = require('./src/models');
const hederaService = require('./src/services/hederaService');
const hederaClient = require('./src/config/hedera');
const logger = require('./src/utils/logger');

const Op = sequelize.Sequelize.Op;

async function reanchorFailedRecords() {
  console.log('🔄 Starting re-anchor process for failed Hedera transactions...\n');

  try {
    // Initialiser le client Hedera
    await hederaClient.init();
    console.log('✅ Hedera client initialized\n');

    // 1. Ré-ancrer les dossiers médicaux échoués
    console.log('📋 Processing Medical Records...');
    const failedRecords = await MedicalRecord.findAll({
      where: {
        [Op.or]: [
          { hederaTransactionId: null },
          { hederaTransactionId: 'FALLBACK' },
          {
            [Op.and]: [
              { hederaTransactionId: { [Op.not]: null } },
              { isVerified: false }
            ]
          }
        ]
      },
      order: [['createdAt', 'ASC']]
    });

    console.log(`Found ${failedRecords.length} failed medical records\n`);

    let recordsSuccess = 0;
    let recordsFailed = 0;

    for (const record of failedRecords) {
      try {
        console.log(`  Ré-ancrage record ${record.id}...`);

        const result = await hederaService.anchorRecord(record);

        if (result.success) {
          // Mettre à jour le record avec les nouvelles informations Hedera
          if (!result.batched) {
            await record.update({
              hederaTransactionId: result.transactionId,
              hederaSequenceNumber: result.sequenceNumber,
              hederaTopicId: result.topicId,
              hederaTimestamp: result.consensusTimestamp,
              hash: result.hash,
              isVerified: true,
              lastVerifiedAt: new Date()
            });
            console.log(`  ✅ Success: ${result.transactionId}`);
          } else {
            console.log(`  📦 Batched for later processing`);
          }
          recordsSuccess++;
        }

        // Délai pour éviter de surcharger Hedera
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`  ❌ Failed to re-anchor record ${record.id}:`, error.message);
        recordsFailed++;
      }
    }

    console.log(`\n📊 Medical Records Results:`);
    console.log(`  ✅ Successfully re-anchored: ${recordsSuccess}`);
    console.log(`  ❌ Failed: ${recordsFailed}`);

    // 2. Ré-ancrer les prescriptions échouées
    console.log('\n💊 Processing Prescriptions...');
    const failedPrescriptions = await Prescription.findAll({
      where: {
        matricule: { [Op.not]: null },
        [Op.or]: [
          { hederaTransactionId: null },
          { hederaTransactionId: 'FALLBACK' },
          {
            [Op.and]: [
              { hederaTransactionId: { [Op.not]: null } },
              { isVerified: false }
            ]
          }
        ]
      },
      order: [['createdAt', 'ASC']]
    });

    console.log(`Found ${failedPrescriptions.length} failed prescriptions\n`);

    let prescriptionsSuccess = 0;
    let prescriptionsFailed = 0;

    for (const prescription of failedPrescriptions) {
      try {
        console.log(`  Ré-ancrage prescription ${prescription.id} (${prescription.matricule})...`);

        const result = await hederaService.anchorPrescription(prescription, 'RE_ANCHORED');

        if (result.success) {
          if (!result.batched) {
            await prescription.update({
              isVerified: true,
              lastVerifiedAt: new Date()
            });
            console.log(`  ✅ Success: ${result.transactionId}`);
          } else {
            console.log(`  📦 Batched for later processing`);
          }
          prescriptionsSuccess++;
        }

        // Délai pour éviter de surcharger Hedera
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`  ❌ Failed to re-anchor prescription ${prescription.id}:`, error.message);
        prescriptionsFailed++;
      }
    }

    console.log(`\n📊 Prescriptions Results:`);
    console.log(`  ✅ Successfully re-anchored: ${prescriptionsSuccess}`);
    console.log(`  ❌ Failed: ${prescriptionsFailed}`);

    // Statistiques finales
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL STATISTICS');
    console.log('='.repeat(60));
    console.log(`Total processed: ${failedRecords.length + failedPrescriptions.length}`);
    console.log(`✅ Total success: ${recordsSuccess + prescriptionsSuccess}`);
    console.log(`❌ Total failed: ${recordsFailed + prescriptionsFailed}`);
    console.log('='.repeat(60));

    console.log('\n✅ Re-anchor process completed!');

  } catch (error) {
    console.error('\n❌ Error during re-anchor process:', error);
    logger.error('Re-anchor script failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Exécuter le script
reanchorFailedRecords();
