const hashService = require('./src/services/hashService');
const mirrorNodeService = require('./src/services/mirrorNodeService');

async function testHCSVerification() {
  console.log('🧪 Test de la vérification HCS avec Mirror Nodes\n');

  // Mock d'un record médical
  const mockRecord = {
    id: 123,
    patientId: 1,
    doctorId: 2,
    type: 'consultation',
    title: 'Consultation cardiologique',
    description: 'Examen de routine',
    diagnosis: 'Rien d\'anormal',
    prescription: 'Repos recommandé',
    createdAt: '2024-01-15T10:30:00.000Z',
    hash: 'abc123def456',
    hederaTransactionId: '0.0.6854064@1634567890.123456789',
    hederaSequenceNumber: '42'
  };

  try {
    // Test 1: Vérification complète avec HCS
    console.log('📋 Test 1: Vérification complète avec HCS');
    const hcsResult = await hashService.verifyHashWithHCS(mockRecord);
    console.log('Résultat:', JSON.stringify(hcsResult, null, 2));
    console.log('✅ Test 1 terminé\n');

    // Test 2: Vérification du statut d'une transaction
    console.log('📋 Test 2: Vérification du statut d\'une transaction');
    const transactionStatus = await mirrorNodeService.verifyHCSTransactionStatus(
      mockRecord.hederaTransactionId,
      '0.0.6854064',
      mockRecord.hederaSequenceNumber
    );
    console.log('Statut transaction:', JSON.stringify(transactionStatus, null, 2));
    console.log('✅ Test 2 terminé\n');

    // Test 3: Détails d'un topic
    console.log('📋 Test 3: Détails du topic');
    const topicDetails = await mirrorNodeService.getTopicDetails('0.0.6854064');
    console.log('Détails topic:', JSON.stringify(topicDetails, null, 2));
    console.log('✅ Test 3 terminé\n');

    // Test 4: Statistiques d'un topic
    console.log('📋 Test 4: Statistiques du topic');
    const topicStats = await mirrorNodeService.getTopicStats('0.0.6854064');
    console.log('Stats topic:', JSON.stringify(topicStats, null, 2));
    console.log('✅ Test 4 terminé\n');

    console.log('🎉 Tous les tests HCS ont été exécutés avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Exécuter les tests si ce fichier est lancé directement
if (require.main === module) {
  testHCSVerification();
}

module.exports = { testHCSVerification };