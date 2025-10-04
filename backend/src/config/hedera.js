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
    this.privateKey = null; // Sera chargé via KMS
    this.kmsInitialized = false;
  }

  async init() {
    // Charger la clé privée via KMS si configuré
    const kmsConfig = require('./kmsConfig');

    try {
      if (!this.kmsInitialized) {
        await kmsConfig.initialize();
        this.privateKey = kmsConfig.getHederaPrivateKey();
        this.kmsInitialized = true;

        kmsConfig.logKeyUsage('hedera_client_init', {
          accountId: this.accountId,
          topicId: this.topicId
        });
      }
    } catch (error) {
      console.error("❌ KMS initialization failed, falling back to env vars:", error.message);
      // Fallback aux variables d'environnement (développement uniquement)
      this.privateKey = process.env.HEDERA_PRIVATE_KEY || process.env.HEDERA_ECDSA_PRIVATE_KEY;
    }

    const accountId = process.env.HEDERA_ECDSA_ACCOUNT_ID || this.accountId;
    const privateKey = this.privateKey;

    if (!privateKey) {
      throw new Error("❌ Hedera private key is required - no simulation mode allowed");
    }

    try {
      this.client = Client.forTestnet().setOperator(accountId, privateKey);
      this.accountId = accountId;
      console.log("✅ Hedera client initialized for Testnet");
      console.log("   Account ID:", this.accountId);
      console.log("   Topic ID:", this.topicId);
      console.log("   Network: Hedera Testnet");
      console.log("   Key Source:", this.kmsInitialized ? 'KMS' : 'Environment');
    } catch (error) {
      console.error("❌ Hedera client initialization error:", error.message);
      throw new Error(`Failed to initialize Hedera client: ${error.message}`);
    }
  }

  async createTopic() {
    console.log("ℹ️ Using existing topic:", this.topicId);
    return this.topicId;
  }

  async submitMessage(message) {
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