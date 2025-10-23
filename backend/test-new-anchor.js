/**
 * Test de création d'un nouveau dossier médical avec ancrage Hedera
 * Pour vérifier que le fix fonctionne pour les nouvelles transactions
 */

// Charger les variables d'environnement
require('dotenv').config();

const { MedicalRecord, BaseUser, sequelize } = require('./src/models');
const hederaService = require('./src/services/hederaService');
const hederaClient = require('./src/config/hedera');

async function testNewAnchor() {
  console.log('🧪 Testing new medical record anchor with fixed configuration...\n');

  try {
    // Initialiser Hedera
    await hederaClient.init();
    console.log('✅ Hedera client initialized\n');

    // Trouver un patient et un docteur pour le test
    const patient = await BaseUser.findOne({ where: { role: 'patient' } });
    const doctor = await BaseUser.findOne({ where: { role: 'doctor' } });

    if (!patient || !doctor) {
      console.error('❌ Need at least 1 patient and 1 doctor in database');
      process.exit(1);
    }

    console.log(`Using patient: ${patient.firstName} ${patient.lastName}`);
    console.log(`Using doctor: ${doctor.firstName} ${doctor.lastName}\n`);

    // Créer un nouveau dossier médical de test
    console.log('📝 Creating test medical record...');
    const testRecord = await MedicalRecord.create({
      patientId: patient.id,
      doctorId: doctor.id,
      type: 'consultation',
      title: 'TEST - Hedera Anchor Verification',
      description: 'Test record created to verify Hedera anchoring after bug fix',
      diagnosis: 'Testing - No real diagnosis',
      prescription: JSON.stringify([{
        name: 'Test Medication',
        dosage: '1 tablet',
        frequency: 'Once',
        duration: 'Test only'
      }]),
      metadata: {
        test: true,
        timestamp: new Date().toISOString(),
        purpose: 'Verify Hedera fix'
      }
    });

    console.log(`✅ Test record created with ID: ${testRecord.id}\n`);

    // Tenter l'ancrage sur Hedera
    console.log('⛓️  Attempting to anchor on Hedera...');
    const anchorResult = await hederaService.anchorRecord(testRecord);

    console.log('\n📊 ANCHOR RESULT:');
    console.log(JSON.stringify(anchorResult, null, 2));

    if (anchorResult.success) {
      console.log('\n✅ SUCCESS! New anchor works correctly!');

      // Vérifier les données dans la DB
      await testRecord.reload();
      console.log('\n📋 Updated record in database:');
      console.log(`  Transaction ID: ${testRecord.hederaTransactionId}`);
      console.log(`  Sequence Number: ${testRecord.hederaSequenceNumber}`);
      console.log(`  Topic ID: ${testRecord.hederaTopicId}`);
      console.log(`  Hash: ${testRecord.hash}`);
      console.log(`  Verified: ${testRecord.isVerified}`);

      if (!anchorResult.batched) {
        console.log('\n🎉 The fix is working! New transactions are being anchored successfully!');
      } else {
        console.log('\n📦 Transaction was batched - this is also good!');
      }
    } else {
      console.log('\n❌ FAILED! There is still a problem with anchoring.');
      console.log('Error:', anchorResult.error || 'Unknown error');
    }

    process.exit(0);

  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    console.error('Error:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

// Exécuter le test
testNewAnchor();
