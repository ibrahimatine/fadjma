const {
  Client,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  PrivateKey,
  AccountBalanceQuery
} = require("@hashgraph/sdk");

class HederaClient {
  constructor() {
    this.client = null;
    // Topic ID fixe pour le testnet FADJMA
    this.topicId = process.env.HEDERA_TOPIC_ID || process.env.HEDERA_ECDSA_TOPIC_ID || "0.0.6854064";
    this.accountId = process.env.HEDERA_ACCOUNT_ID || process.env.HEDERA_ECDSA_ACCOUNT_ID || "0.0.6089195";
    this.privateKey = process.env.HEDERA_PRIVATE_KEY || process.env.HEDERA_ECDSA_PRIVATE_KEY || null;
    this.init();
  }

  init() {
    // Utiliser les credentials ECDSA qui correspondent au topic créé
    const accountId = process.env.HEDERA_ECDSA_ACCOUNT_ID || this.accountId;
    const privateKey = process.env.HEDERA_ECDSA_PRIVATE_KEY || this.privateKey;

    // Mode développement: permettre un fonctionnement sans clés Hedera valides
    if (!privateKey || process.env.NODE_ENV === 'development') {
      console.log("⚠️ Mode développement: Hedera désactivé");
      console.log("   Pour activer Hedera, configurez les variables d'environnement HEDERA_*");
      this.developmentMode = true;
      return;
    }

    try {
      this.client = Client.forTestnet().setOperator(accountId, privateKey);
      this.accountId = accountId;
      this.privateKey = privateKey;
      this.developmentMode = false;
      console.log("✅ Hedera client initialized for Testnet (Production Mode)");
      console.log("   Account ID:", this.accountId);
      console.log("   Topic ID:", this.topicId);
      console.log("   Network: Hedera Testnet");
    } catch (error) {
      console.error("❌ Hedera client initialization error:", error.message);
      console.log("⚠️ Basculement en mode développement sans Hedera");
      this.developmentMode = true;
    }
  }

  async createTopic() {
    console.log("ℹ️ Using existing topic:", this.topicId);
    return this.topicId;
  }

  async submitMessage(message) {
    // Mode développement: simulation
    if (this.developmentMode) {
      console.log("🔧 Mode développement: Simulation d'ancrage Hedera");
      const result = {
        status: "SUCCESS_SIMULATION",
        topicId: this.topicId,
        transactionId: `DEV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sequenceNumber: Math.floor(Math.random() * 1000000).toString(),
        timestamp: new Date().toISOString(),
        consensusTimestamp: new Date().toISOString()
      };
      console.log("✅ Message simulé avec succès (mode développement)");
      console.log("   Transaction ID:", result.transactionId);
      console.log("   Sequence Number:", result.sequenceNumber);
      return result;
    }

    if (!this.topicId) {
      throw new Error("Topic ID is required for message submission");
    }

    try {
      console.log(`📤 Submitting message to Hedera topic ${this.topicId}...`);

      const tx = await new TopicMessageSubmitTransaction()
        .setTopicId(this.topicId)
        .setMessage(message)
        .freezeWith(this.client)
        .sign(PrivateKey.fromStringDer(this.privateKey));

      const submitMsgTxSubmit = await tx.execute(this.client);
      const receipt = await submitMsgTxSubmit.getReceipt(this.client);

      const result = {
        status: "SUCCESS",
        topicId: this.topicId,
        transactionId: submitMsgTxSubmit.transactionId.toString(),
        sequenceNumber: receipt.topicSequenceNumber?.toString(),
        timestamp: new Date().toISOString(),
        consensusTimestamp: receipt.consensusTimestamp?.toString()
      };

      console.log("✅ Message successfully submitted to Hedera testnet");
      console.log("   Transaction ID:", result.transactionId);
      console.log("   Sequence Number:", result.sequenceNumber);

      return result;
    } catch (error) {
      console.error("❌ Error submitting message to Hedera:", error);
      throw new Error(`Failed to submit message to Hedera: ${error.message}`);
    }
  }

  async getBalance() {
    // Mode développement: simulation
    if (this.developmentMode) {
      const simulatedBalance = "100.00000000 ℏ";
      console.log("💰 Solde simulé (mode développement):", simulatedBalance);
      return simulatedBalance;
    }

    try {
      const query = new AccountBalanceQuery().setAccountId(this.accountId);
      const balance = await query.execute(this.client);
      console.log("💰 Account balance:", balance.hbars.toString(), "HBAR");
      return balance.hbars.toString();
    } catch (error) {
      console.error("❌ Error fetching balance:", error);
      throw new Error(`Failed to fetch balance: ${error.message}`);
    }
  }
}

module.exports = new HederaClient();