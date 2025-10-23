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

    // Configuration multi-topics par domaine
    this.topics = {
      PRESCRIPTION: process.env.HEDERA_TOPIC_PRESCRIPTIONS || "0.0.7070750",
      MEDICAL_RECORD: process.env.HEDERA_TOPIC_RECORDS || "0.0.7070750",
      PRESCRIPTION_DELIVERY: process.env.HEDERA_TOPIC_DELIVERIES || "0.0.7070750",
      ACCESS_LOG: process.env.HEDERA_TOPIC_ACCESS || "0.0.7070750",
      BATCH: process.env.HEDERA_TOPIC_BATCH || "0.0.7070750", // Pour les batches Merkle
      DEFAULT: process.env.HEDERA_TOPIC_ID || process.env.HEDERA_ECDSA_TOPIC_ID || "0.0.7070750"
    };

    // Topic ID par défaut (backward compatibility)
    this.topicId = this.topics.DEFAULT;

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

    // Utiliser la bonne paire compte/clé ensemble
    let accountId, privateKey;

    if (process.env.HEDERA_ECDSA_ACCOUNT_ID && process.env.HEDERA_ECDSA_PRIVATE_KEY) {
      accountId = process.env.HEDERA_ECDSA_ACCOUNT_ID;
      privateKey = process.env.HEDERA_ECDSA_PRIVATE_KEY;
    } else if (process.env.HEDERA_ACCOUNT_ID && this.privateKey) {
      accountId = process.env.HEDERA_ACCOUNT_ID;
      privateKey = this.privateKey;
    } else {
      accountId = this.accountId;
      privateKey = this.privateKey;
    }

    if (!privateKey) {
      throw new Error("❌ Hedera private key is required - no simulation mode allowed");
    }

    try {
      this.client = Client.forTestnet().setOperator(accountId, privateKey);
      this.accountId = accountId;
      this.privateKey = privateKey;
      console.log("✅ Hedera client initialized for Testnet");
      console.log("   Account ID:", this.accountId);
      console.log("   Topics configured:");
      Object.keys(this.topics).forEach(key => {
        console.log(`     ${key}: ${this.topics[key]}`);
      });
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

  async submitMessage(message, messageType = 'DEFAULT') {
    // Déterminer le topic à utiliser
    const topicId = this.topics[messageType] || this.topics.DEFAULT;

    if (!topicId) {
      throw new Error("Topic ID is required for message submission");
    }

    try {
      console.log(`📤 Submitting ${messageType} message to Hedera topic ${topicId}...`);

      const tx = await new TopicMessageSubmitTransaction()
        .setTopicId(topicId)
        .setMessage(message)
        .execute(this.client);

      const receipt = await tx.getReceipt(this.client);

      const result = {
        status: "SUCCESS",
        topicId: topicId,
        messageType: messageType,
        transactionId: tx.transactionId.toString(),
        sequenceNumber: receipt.topicSequenceNumber?.toString(),
        timestamp: new Date().toISOString(),
        consensusTimestamp: receipt.consensusTimestamp?.toString()
      };

      console.log("✅ Message successfully submitted to Hedera testnet");
      console.log("   Message Type:", messageType);
      console.log("   Topic ID:", topicId);
      console.log("   Transaction ID:", result.transactionId);
      console.log("   Sequence Number:", result.sequenceNumber);

      return result;
    } catch (error) {
      console.error("❌ Error submitting message to Hedera:", error);
      throw new Error(`Failed to submit message to Hedera: ${error.message}`);
    }
  }

  /**
   * Récupère le topic ID pour un type de message
   */
  getTopicId(messageType = 'DEFAULT') {
    return this.topics[messageType] || this.topics.DEFAULT;
  }

  /**
   * Liste tous les topics configurés
   */
  getTopics() {
    return { ...this.topics };
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