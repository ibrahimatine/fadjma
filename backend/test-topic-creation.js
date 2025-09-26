// Test de création d'un nouveau topic
require('dotenv').config();
const hederaClient = require('./src/config/hedera');

async function testTopicCreation() {
  console.log('🔧 Test de création d\'un nouveau topic Hedera...\n');

  try {
    console.log('1. Tentative de création d\'un nouveau topic...');
    const newTopicId = await hederaClient.createTopic();
    console.log(`   Nouveau topic créé: ${newTopicId}\n`);

    // Test avec le nouveau topic
    console.log('2. Test de soumission sur le nouveau topic...');
    const oldTopicId = hederaClient.topicId;
    hederaClient.topicId = newTopicId;

    const testMessage = JSON.stringify({
      test: true,
      message: 'Test avec nouveau topic FADJMA',
      timestamp: new Date().toISOString(),
      type: 'NEW_TOPIC_TEST'
    });

    const result = await hederaClient.submitMessage(testMessage);
    console.log('   Résultat:', result);

    // Restaurer l'ancien topic
    hederaClient.topicId = oldTopicId;

    if (result.status === 'SUCCESS') {
      console.log('\n✅ Nouveau topic fonctionne !');
      console.log(`   Utilisez ce topic ID: ${newTopicId}`);
    } else {
      console.log('\n❌ Problème persiste même avec nouveau topic');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la création de topic:', error.message);
  }
}

testTopicCreation();