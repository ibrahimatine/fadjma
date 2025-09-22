require("dotenv").config();
const { Client, AccountBalanceQuery, PrivateKey, TopicCreateTransaction } = require("@hashgraph/sdk");

async function createTopic() {
  console.log("🔄 Configuration Hedera...");

  const accountId = process.env.HEDERA_ECDSA_ACCOUNT_ID;
  const privateKeyStr = process.env.HEDERA_ECDSA_PRIVATE_KEY;
  console.log("compte  te key", accountId, privateKeyStr)
  if (!accountId || !privateKeyStr) {
    console.error("❌ Erreur: HEDERA_ECDSA_ACCOUNT_ID et HEDERA_ECDSA_PRIVATE_KEY requis dans .env");
    process.exit(1);
  }

  // Choisir le parser approprié selon le format de la clé
  const keyClean = privateKeyStr.startsWith("0x") ? privateKeyStr.slice(2) : privateKeyStr;
  const operatorKey = privateKeyStr.startsWith("302") || privateKeyStr.startsWith("303")
    ? PrivateKey.fromStringDer(privateKeyStr)
    : PrivateKey.fromStringECDSA(keyClean);

  try {
    // Connexion au testnet avec la clé parsée
    const client = Client.forTestnet().setOperator(accountId, privateKeyStr);
    console.log("✅ Client Hedera connecté");
    console.log("🔄 Consultation du Solde...");
    const balance = await new AccountBalanceQuery()
      .setAccountId(accountId)
      .execute(client);
    console.log(`💰 Solde du compte ${accountId} : ${balance.hbars.toString()}`);

    // Créer un topic privé avec adminKey + submitKey = clé opérateur
    console.log("🔄 Création du topic...");
    const txResponse = await new TopicCreateTransaction()
      .setTopicMemo("FadjMa-Medical-Ledger")
      .setAdminKey(operatorKey.publicKey)
      .setSubmitKey(operatorKey.publicKey)
      .execute(client)
      .catch(err => {
        console.error("⏳ Échec de création du topic, tentative échouée :", err.message);
        process.exit(1);
      });

    const receipt = await txResponse.getReceipt(client);
    const topicId = receipt.topicId.toString();

    console.log("✅ Topic créé avec succès!");
    console.log("📋 Topic ID:", topicId);
    console.log("\n⚠️ IMPORTANT: Ajoutez cette ligne dans backend/.env :");
    console.log(`HEDERA_TOPIC_ID=${topicId}\n`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    process.exit(1);
  }
}

createTopic();