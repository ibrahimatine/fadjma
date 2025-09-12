const { Client, TopicCreateTransaction, TopicMessageSubmitTransaction } = require("@hashgraph/sdk");

class HederaClient {
  constructor() {
    this.client = null;
    this.topicId = process.env.HEDERA_TOPIC_ID;
    this.init();
  }

  init() {
    const accountId = process.env.HEDERA_ACCOUNT_ID;
    const privateKey = process.env.HEDERA_PRIVATE_KEY;

    if (!accountId || !privateKey) {
      throw new Error("Missing Hedera credentials");
    }

    this.client = Client.forTestnet();
    this.client.setOperator(accountId, privateKey);
    
    console.log("✅ Hedera client initialized");
  }

  async createTopic() {
    const transaction = await new TopicCreateTransaction()
      .setSubmitKey(this.client.operatorPublicKey)
      .execute(this.client);

    const receipt = await transaction.getReceipt(this.client);
    const topicId = receipt.topicId;
    
    console.log(`✅ Created topic with ID: ${topicId}`);
    return topicId.toString();
  }

  async submitMessage(message) {
    try {
      const transaction = await new TopicMessageSubmitTransaction()
        .setTopicId(this.topicId)
        .setMessage(message)
        .execute(this.client);

      const receipt = await transaction.getReceipt(this.client);
      
      return {
        status: receipt.status.toString(),
        topicId: this.topicId,
        sequenceNumber: receipt.topicSequenceNumber?.toString(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error("Hedera submission error:", error);
      throw error;
    }
  }

  async getTopicInfo() {
    // Implementation for getting topic messages
    // This would require Mirror Node API integration
    return {
      topicId: this.topicId,
      network: "testnet"
    };
  }
}

module.exports = new HederaClient();

