// Test de connectivité Hedera
require('dotenv').config();
const hederaClient = require('./src/config/hedera');

async function testHederaConnection() {
  console.log('🔍 Test de la connectivité Hedera...\n');

  try {
    // Test 1: Vérifier la balance
    console.log('1. Test de balance du compte...');
    await hederaClient.init()
    const balance = await hederaClient.getBalance();
    if (balance === null) {
      console.log('   ⚠️  Mode simulation activé - credentials manquants');
      return;
    }
    console.log(`   Balance: ${balance}\n`);

    // Test 2: Envoyer un message test
    console.log('2. Test de soumission de message...');
    const testMessage = JSON.stringify({
      test: true,
      message: 'Test de connectivité FADJMA',
      timestamp: new Date().toISOString(),
      type: 'CONNECTION_TEST'
    });

    const result = await hederaClient.submitMessage(testMessage);
    console.log('   Résultat:', result);

    // Test 3: Vérifier le statut
    if (result.status === 'SUCCESS') {
      console.log('\n✅ Hedera Testnet connecté avec succès !');
      console.log(`   Topic ID: ${result.topicId}`);
      console.log(`   Sequence: ${result.sequenceNumber}`);
    } else if (result.status === 'SIMULATED') {
      console.log('\n⚠️  Mode simulation activé - credentials manquants');
    } else {
      console.log('\n❌ Échec de la connexion:', result.error);
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

testHederaConnection();