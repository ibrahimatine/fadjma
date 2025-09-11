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

// backend/src/models/User.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('patient', 'doctor', 'admin'),
    defaultValue: 'patient'
  },
  licenseNumber: {
    type: DataTypes.STRING,
    allowNull: true // Only for doctors
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      user.password = await bcrypt.hash(user.password, 10);
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  }
});

User.prototype.validatePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  return values;
};

module.exports = User;
