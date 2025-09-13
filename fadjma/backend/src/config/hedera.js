const { Client, TopicCreateTransaction, TopicMessageSubmitTransaction, PrivateKey } = require("@hashgraph/sdk");

class HederaClient {
  constructor() {
    this.client = null;
    this.topicId = process.env.HEDERA_TOPIC_ID;
    this.init();
  }

  init() {
    try {
      const accountId = process.env.HEDERA_ACCOUNT_ID;
      const privateKey = process.env.HEDERA_PRIVATE_KEY;

      if (!accountId || !privateKey) {
        console.warn("⚠️ Hedera credentials manquantes - mode simulation activé");
        return;
      }

      // Initialiser le client pour testnet
      this.client = Client.forTestnet();
      
      // Configurer l'opérateur
      const operatorKey = PrivateKey.fromString(privateKey);
      this.client.setOperator(accountId, operatorKey);
      
      // Limiter les frais max pour éviter les surprises
      this.client.setDefaultMaxTransactionFee("1");
      this.client.setDefaultMaxQueryPayment("1");
      
      console.log("✅ Hedera client initialized pour Testnet");
      console.log("   Account ID:", accountId);
      console.log("   Topic ID:", this.topicId || "À créer");
    } catch (error) {
      console.error("❌ Erreur Hedera:", error.message);
      console.warn("⚠️ Mode simulation Hedera activé");
    }
  }

  async createTopic() {
    if (!this.client) {
      console.log("⚠️ Mode simulation: Topic ID simulé");
      return "0.0.SIMULATED";
    }

    try {
      const transaction = await new TopicCreateTransaction()
        .setSubmitKey(this.client.operatorPublicKey)
        .execute(this.client);

      const receipt = await transaction.getReceipt(this.client);
      const topicId = receipt.topicId;
      
      console.log(`✅ Topic créé avec ID: ${topicId}`);
      return topicId.toString();
    } catch (error) {
      console.error("❌ Erreur création topic:", error);
      throw error;
    }
  }

  async submitMessage(message) {
    // Mode simulation si pas de client
    if (!this.client || !this.topicId) {
      console.log("⚠️ Mode simulation Hedera - Message non envoyé");
      return {
        status: "SIMULATED",
        topicId: this.topicId || "0.0.SIMULATED",
        sequenceNumber: Math.floor(Math.random() * 1000).toString(),
        timestamp: new Date().toISOString()
      };
    }

    try {
      const transaction = await new TopicMessageSubmitTransaction()
        .setTopicId(this.topicId)
        .setMessage(message)
        .execute(this.client);

      const receipt = await transaction.getReceipt(this.client);
      
      console.log("✅ Message envoyé sur Hedera");
      
      return {
        status: receipt.status.toString(),
        topicId: this.topicId,
        sequenceNumber: receipt.topicSequenceNumber?.toString(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error("❌ Erreur Hedera submission:", error);
      
      // Retourner une réponse simulée en cas d'erreur
      return {
        status: "ERROR",
        topicId: this.topicId,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async getBalance() {
    if (!this.client) {
      return "Mode simulation";
    }

    try {
      const balance = await this.client.getAccountBalance(this.client.operatorAccountId);
      return balance.hbars.toString();
    } catch (error) {
      console.error("❌ Erreur balance:", error);
      return "Erreur";
    }
  }
}

module.exports = new HederaClient();
