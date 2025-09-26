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
    this.topicId = process.env.HEDERA_TOPIC_ID || null;
    this.accountId = process.env.HEDERA_ACCOUNT_ID || null;
    this.privateKey = process.env.HEDERA_PRIVATE_KEY || null;
    this.simulation = false;
    this.init();
  }

  init() {
    // Utiliser les credentials ECDSA qui correspondent au topic créé
    const accountId = process.env.HEDERA_ECDSA_ACCOUNT_ID;
    const privateKey = process.env.HEDERA_ECDSA_PRIVATE_KEY;

    if (!accountId || !privateKey) {
      console.warn("⚠️ Hedera ECDSA credentials missing - simulation mode enabled");
      this.simulation = true;
      return;
    }

    try {
      this.client = Client.forTestnet().setOperator(accountId, privateKey);
      this.accountId = accountId;
      this.privateKey = privateKey;
      console.log("✅ Hedera client initialized for Testnet with ECDSA credentials");
      console.log("   Account ID:", this.accountId);
      console.log("   Topic ID:", this.topicId || "To be created");
    } catch (error) {
      console.error("❌ Hedera client initialization error:", error.message);
      this.simulation = true;
    }
  }

  async createTopic() {
    if (this.simulation) {
      console.log("⚠️ Simulation mode: returning simulated topic ID");
      return "0.0.SIMULATED";
    }
    try {
      const tx = await new TopicCreateTransaction().execute(this.client);
      const receipt = await tx.getReceipt(this.client);
      this.topicId = receipt.topicId.toString();
      console.log(`✅ Topic created with ID: ${this.topicId}`);
      return this.topicId;
    } catch (error) {
      console.error("❌ Error creating topic:", error);
      throw error;
    }
  }

  async submitMessage(message) {
    if (this.simulation || !this.topicId) {
      console.log("⚠️ Simulation mode - message not sent");
      return {
        status: "SIMULATED",
        topicId: this.topicId || "0.0.SIMULATED",
        sequenceNumber: Math.floor(Math.random() * 1000).toString(),
        timestamp: new Date().toISOString()
      };
    }
    try {
      const tx = await new TopicMessageSubmitTransaction()
        .setTopicId(this.topicId)
        .setMessage(message)
        .freezeWith(this.client)
        .sign(PrivateKey.fromStringDer(this.privateKey));
      const submitMsgTxSubmit = await tx.execute(this.client);
      const receipt = await submitMsgTxSubmit.getReceipt(this.client);
      console.log("✅ Message sent to Hedera topic");
      return {
        status: receipt.status.toString(),
        topicId: this.topicId,
        transactionId: submitMsgTxSubmit.transactionId.toString(),
        sequenceNumber: receipt.topicSequenceNumber?.toString(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error("❌ Error submitting message:", error);
      return {
        status: "ERROR",
        topicId: this.topicId,
        transactionId: null,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async getBalance() {
    if (this.simulation) {
      return "Simulation mode";
    }
    try {
      const query = new AccountBalanceQuery().setAccountId(this.accountId);
      const balance = await query.execute(this.client);
      console.log("The hbar account balance for this account is " + balance.hbars);
      return balance.hbars.toString();
    } catch (error) {
      console.error("❌ Error fetching balance:", error);
      return "Error";
    }
  }
}

module.exports = new HederaClient();