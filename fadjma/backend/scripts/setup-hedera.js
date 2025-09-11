require('dotenv').config();
const { Client, TopicCreateTransaction } = require("@hashgraph/sdk");

async function createTopic() {
  console.log("🔄 Configuration Hedera...");
  
  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_PRIVATE_KEY;

  if (!accountId || !privateKey) {
    console.error("❌ Erreur: HEDERA_ACCOUNT_ID et HEDERA_PRIVATE_KEY requis dans .env");
    process.exit(1);
  }

  try {
    // Connexion au testnet
    const client = Client.forTestnet();
    client.setOperator(accountId, privateKey);
    console.log("✅ Client Hedera connecté");

    // Créer le topic
    console.log("🔄 Création du topic...");
    const transaction = await new TopicCreateTransaction()
      .setAdminKey(client.operatorPublicKey)
      .setSubmitKey(client.operatorPublicKey)
      .execute(client);

    const receipt = await transaction.getReceipt(client);
    const topicId = receipt.topicId.toString();
    
    console.log("✅ Topic créé avec succès!");
    console.log("📋 Topic ID:", topicId);
    console.log("");
    console.log("⚠️  IMPORTANT: Ajoutez cette ligne dans backend/.env :");
    console.log(`HEDERA_TOPIC_ID=${topicId}`);
    console.log("");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    process.exit(1);
  }
}

createTopic();