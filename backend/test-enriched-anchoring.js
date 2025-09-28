const { Prescription } = require('./src/models');
const hederaService = require('./src/services/hederaService');

async function testEnrichedAnchoring() {
  console.log('🧪 Test de l\'ancrage enrichi avec données médicales complètes\n');

  try {
    // Récupérer une prescription existante
    const prescription = await Prescription.findOne({
      where: { matricule: 'PRX-20250928-132C' }
    });

    if (!prescription) {
      console.log('❌ Prescription de test non trouvée');
      return;
    }

    console.log('📋 Prescription trouvée:', prescription.matricule);
    console.log('- Médicament:', prescription.medication);
    console.log('- Dosage:', prescription.dosage);
    console.log('- Statut actuel:', prescription.deliveryStatus);

    // Test d'ancrage enrichi
    console.log('\n🔗 Test ancrage avec données médicales complètes...');
    const result = await hederaService.anchorPrescription(prescription, 'DISPENSED');

    console.log('✅ Ancrage réussi:');
    console.log('- Transaction ID:', result.transactionId);
    console.log('- Sequence Number:', result.sequenceNumber);
    console.log('- Hash des données:', result.hash);
    console.log('- Temps de réponse:', result.responseTime, 'ms');

    console.log('\n📄 Message ancré (aperçu):');
    const message = JSON.parse(result.message);
    console.log('- Type:', message.type);
    console.log('- Action:', message.actionType);
    console.log('- Médicament:', message.medication);
    console.log('- Dosage:', message.dosage);
    console.log('- Statut:', message.deliveryStatus);
    console.log('- Matricule:', message.matricule);
    console.log('- Version:', message.version);

    console.log('\n🎉 Test réussi ! Les données médicales complètes sont maintenant ancrées sur Hedera.');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }

  process.exit(0);
}

// Exécuter le test
if (require.main === module) {
  testEnrichedAnchoring();
}

module.exports = { testEnrichedAnchoring };