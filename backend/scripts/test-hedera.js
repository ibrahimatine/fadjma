require('dotenv').config();
const hederaClient = require('../src/config/hedera');

async function testHedera() {
  console.log('🔍 Test de la configuration Hedera...\n');
  
  // Vérifier les variables d'environnement
  console.log('📋 Configuration:');
  console.log('   HEDERA_ECDSA_ACCOUNT_ID:', process.env.HEDERA_ECDSA_ACCOUNT_ID ? '✅ Configuré' : '❌ Manquant');
  console.log('   HEDERA_ECDSA_PRIVATE_KEY:', process.env.HEDERA_ECDSA_PRIVATE_KEY ? '✅ Configuré' : '❌ Manquant');
  console.log('   HEDERA_TOPIC_ID:', process.env.HEDERA_TOPIC_ID || '⚠️ À créer');
  console.log('');
  
  // Tester la balance
  try {
    console.log('💰 Test de la balance...');
    const balance = await hederaClient.getBalance();
    console.log('   Balance HBAR:', balance);
  } catch (error) {
    console.error('❌ Erreur balance:', error.message);
  }
  
  // Créer un topic si nécessaire
  if (!process.env.HEDERA_TOPIC_ID) {
    console.log('\n📝 Création d\'un nouveau topic...');
    try {
      const topicId = await hederaClient.createTopic();
      console.log('✅ Topic créé:', topicId);
      console.log('');
      console.log('⚠️  IMPORTANT: Ajoutez cette ligne dans backend/.env :');
      console.log(`HEDERA_TOPIC_ID=${topicId}`);
    } catch (error) {
      console.error('❌ Erreur création topic:', error.message);
    }
  }
  
  // Tester l'envoi d'un message
  console.log('\n📤 Test d\'envoi de message...');
  try {
    const result = await hederaClient.submitMessage(
      JSON.stringify({
        test: true,
        timestamp: new Date().toISOString(),
        message: 'Test FadjMa Hackathon'
      })
    );
    console.log('✅ Message envoyé:', result);
  } catch (error) {
    console.error('❌ Erreur envoi:', error.message);
  }
  
  console.log('\n✨ Test terminé!');
  process.exit(0);
}

testHedera();