const axios = require('axios');

class MirrorNodeService {
  constructor() {
    this.baseUrl = 'https://testnet.mirrornode.hedera.com/api/v1';
  }

  // Vérifier une transaction spécifique
  async verifyTransaction(transactionId) {
    try {
      const response = await axios.get(`${this.baseUrl}/transactions/${transactionId}`);

      if (response.data && response.data.transactions.length > 0) {
        const tx = response.data.transactions[0];
        return {
          isVerified: tx.result === 'SUCCESS',
          consensusTimestamp: tx.consensus_timestamp,
          result: tx.result,
          chargedTx: tx.charged_tx_fee
        };
      }

      return { isVerified: false, error: 'Transaction non trouvée' };

    } catch (error) {
      console.error('Mirror Node error:', error.message);
      return { isVerified: false, error: error.message };
    }
  }

  // Vérifier un message dans un topic
  async verifyTopicMessage(topicId, sequenceNumber) {
    try {
      const response = await axios.get(`${this.baseUrl}/topics/${topicId}/messages/${sequenceNumber}`);

      if (response.data) {
        return {
          isVerified: true,
          message: response.data.message,
          consensusTimestamp: response.data.consensus_timestamp,
          runningHash: response.data.running_hash
        };
      }

      return { isVerified: false, error: 'Message non trouvé' };

    } catch (error) {
      console.error('Mirror Node error:', error.message);
      return { isVerified: false, error: error.message };
    }
  }

  // Vérifier le hash d'un message
  async verifyMessageHash(topicId, expectedHash) {
    try {
      const response = await axios.get(`${this.baseUrl}/topics/${topicId}/messages?limit=100`);

      if (response.data && response.data.messages) {
        // Rechercher le message avec le hash attendu
        const matchingMessage = response.data.messages.find(msg => {
          const decodedMessage = Buffer.from(msg.message, 'base64').toString();
          return decodedMessage.includes(expectedHash);
        });

        if (matchingMessage) {
          return {
            isVerified: true,
            sequenceNumber: matchingMessage.sequence_number,
            consensusTimestamp: matchingMessage.consensus_timestamp
          };
        }
      }

      return { isVerified: false, error: 'Hash non trouvé dans le topic' };

    } catch (error) {
      console.error('Mirror Node error:', error.message);
      return { isVerified: false, error: error.message };
    }
  }
}

module.exports = new MirrorNodeService();