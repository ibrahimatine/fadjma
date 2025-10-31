const axios = require("axios");
const logger = require("../utils/logger");

class MirrorNodeService {
  constructor() {
    this.baseUrl = "https://testnet.mirrornode.hedera.com/api/v1";
  }

  // Format transaction ID from Hedera @ format to Mirror Node - format
  formatTransactionId(transactionId) {
    if (typeof transactionId !== "string") {
      return transactionId;
    }

    // If already in correct format, return as is
    if (!transactionId.includes("@")) {
      return transactionId;
    }

    // Convert from: 0.0.6089195@1758958633.731955949
    // To:           0.0.6089195-1758958633-731955949
    const parts = transactionId.split("@");
    if (parts.length === 2) {
      const accountId = parts[0];
      const timestampParts = parts[1].split(".");
      if (timestampParts.length === 2) {
        const seconds = timestampParts[0];
        const nanoseconds = timestampParts[1];
        return `${accountId}-${seconds}-${nanoseconds}`;
      }
    }

    // If format is unexpected, return original
    return transactionId;
  }

  // Vérifier une transaction spécifique
  async verifyTransaction(transactionId) {
    try {
      // Convert transaction ID from @ format to - format for Mirror Node API
      // From: 0.0.6089195@1758958633.731955949
      // To:   0.0.6089195-1758958633-731955949
      const formattedTxId = this.formatTransactionId(transactionId);
      const response = await axios.get(
        `${this.baseUrl}/transactions/${formattedTxId}`,
        { proxy: false }
      );
      if (response.data && response.data.transactions.length > 0) {
        const tx = response.data.transactions[0];
        return {
          isVerified: tx.result === "SUCCESS",
          consensusTimestamp: tx.consensus_timestamp,
          result: tx.result,
          chargedTx: tx.charged_tx_fee,
        };
      }

      return { isVerified: false, error: "Transaction non trouvée" };
    } catch (error) {
      logger.error("Mirror Node transaction verification error", {
        transactionId,
        error: error.message,
        status: error.response?.status
      });

      return { isVerified: false, error: error.message };
    }
  }

  // Vérifier un message dans un topic
  async verifyTopicMessage(topicId, sequenceNumber) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/topics/${topicId}/messages/${sequenceNumber}`,
        { proxy: false }
      );
      if (response.data) {
        return {
          isVerified: true,
          message: response.data.message,
          consensusTimestamp: response.data.consensus_timestamp,
          runningHash: response.data.running_hash,
        };
      }

      return { isVerified: false, error: "Message non trouvé" };
    } catch (error) {
      logger.error("Mirror Node topic message verification error", { topicId, sequenceNumber, error: error.message });
      return { isVerified: false, error: error.message };
    }
  }

  // Vérifier le hash d'un message
  async verifyMessageHash(topicId, expectedHash) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/topics/${topicId}/messages?limit=100`,
        { proxy: false }
      );

      if (response.data && response.data.messages) {
        // Rechercher le message avec le hash attendu
        const matchingMessage = response.data.messages.find((msg) => {
          const decodedMessage = Buffer.from(msg.message, "base64").toString();
          return decodedMessage.includes(expectedHash);
        });

        if (matchingMessage) {
          return {
            isVerified: true,
            sequenceNumber: matchingMessage.sequence_number,
            consensusTimestamp: matchingMessage.consensus_timestamp,
          };
        }
      }

      return { isVerified: false, error: "Hash non trouvé dans le topic" };
    } catch (error) {
      logger.error("Mirror Node error", { error: error.message });
      return { isVerified: false, error: error.message };
    }
  }

  // Vérifier le statut complet d'une transaction HCS
  async verifyHCSTransactionStatus(transactionId, topicId, sequenceNumber) {
    try {
      const results = await Promise.allSettled([
        this.verifyTransaction(transactionId),
        this.verifyTopicMessage(topicId, sequenceNumber),
      ]);

      const [transactionResult, messageResult] = results;

      const verification = {
        transactionVerified: false,
        messageVerified: false,
        consensusTimestamp: null,
        transactionStatus: null,
        messageContent: null,
        errors: [],
      };

      // Analyser le résultat de la transaction
      if (transactionResult.status === "fulfilled") {
        const txData = transactionResult.value;
        verification.transactionVerified = txData.isVerified;
        verification.transactionStatus = txData.result;
        verification.consensusTimestamp = txData.consensusTimestamp;

        if (txData.error) {
          verification.errors.push(`Transaction: ${txData.error}`);
        }
      } else {
        verification.errors.push(
          `Transaction fetch failed: ${transactionResult.reason}`
        );
      }

      // Analyser le résultat du message
      if (messageResult.status === "fulfilled") {
        const msgData = messageResult.value;
        verification.messageVerified = msgData.isVerified;

        if (msgData.isVerified) {
          try {
            const decodedMessage = Buffer.from(
              msgData.message,
              "base64"
            ).toString();
            verification.messageContent = JSON.parse(decodedMessage);
          } catch (parseError) {
            verification.messageContent = decodedMessage;
          }
        }

        if (msgData.error) {
          verification.errors.push(`Message: ${msgData.error}`);
        }
      } else {
        verification.errors.push(
          `Message fetch failed: ${messageResult.reason}`
        );
      }

      verification.isFullyVerified = verification.messageVerified;

      return verification;
    } catch (error) {
      logger.error("HCS verification error", { error: error.message });
      return {
        transactionVerified: false,
        messageVerified: false,
        isFullyVerified: false,
        errors: [error.message],
      };
    }
  }

  // Obtenir les détails complets d'un topic
  async getTopicDetails(topicId) {
    try {
      const response = await axios.get(`${this.baseUrl}/topics/${topicId}`, { proxy: false });

      if (response.data) {
        return {
          success: true,
          topic: {
            id: response.data.topic_id,
            memo: response.data.memo,
            runningHash: response.data.running_hash,
            sequenceNumber: response.data.sequence_number,
            submitKey: response.data.submit_key,
            adminKey: response.data.admin_key,
            createdTimestamp: response.data.created_timestamp,
          },
        };
      }

      return { success: false, error: "Topic non trouvé" };
    } catch (error) {
      logger.error("Topic details error", { error: error.message });
      return { success: false, error: error.message };
    }
  }

  // Obtenir les statistiques d'un topic
  async getTopicStats(topicId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/topics/${topicId}/messages?limit=1`,
        { proxy: false }
      );

      if (response.data && response.data.messages) {
        const totalMessages =
          response.data.messages.length > 0
            ? response.data.messages[0].sequence_number
            : 0;

        return {
          success: true,
          stats: {
            totalMessages,
            lastMessageTimestamp:
              response.data.messages[0]?.consensus_timestamp,
            topicId,
          },
        };
      }

      return { success: false, error: "Pas de messages trouvés" };
    } catch (error) {
      logger.error("Topic stats error", { error: error.message });
      return { success: false, error: error.message };
    }
  }
}

module.exports = new MirrorNodeService();
