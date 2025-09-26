// Service pour générer les URLs HashScan correctes
class HashScanService {
  constructor() {
    this.baseUrl = 'https://hashscan.io';
    this.network = process.env.HEDERA_NETWORK || 'testnet';
    this.topicId = process.env.HEDERA_ECDSA_TOPIC_ID || '0.0.6854064';
    this.accountId = process.env.HEDERA_ECDSA_ACCOUNT_ID || '0.0.6089195';
  }

  // URL pour voir le topic complet
  getTopicUrl(topicId = null) {
    const id = topicId || this.topicId;
    return `${this.baseUrl}/${this.network}/topic/${id}`;
  }

  // URL pour une transaction spécifique
  getTransactionUrl(transactionId) {
    if (!transactionId) return null;
    return `${this.baseUrl}/${this.network}/transaction/${transactionId}`;
  }

  // URL pour un message spécifique dans le topic
  getTopicMessageUrl(topicId = null, sequenceNumber = null) {
    const id = topicId || this.topicId;
    if (!sequenceNumber) {
      return this.getTopicUrl(id);
    }
    return `${this.baseUrl}/${this.network}/topic/${id}/${sequenceNumber}`;
  }

  // URL pour un compte Hedera
  getAccountUrl(accountId = null) {
    const id = accountId || this.accountId;
    return `${this.baseUrl}/${this.network}/account/${id}`;
  }

  // URL pour un token NFT
  getTokenUrl(tokenId, serialNumber = null) {
    if (!tokenId) return null;
    const baseTokenUrl = `${this.baseUrl}/${this.network}/token/${tokenId}`;
    return serialNumber ? `${baseTokenUrl}/${serialNumber}` : baseTokenUrl;
  }

  // Générer un lien de vérification complet avec métadonnées
  generateVerificationLink(record, hederaResult) {
    const verification = {
      record: {
        id: record.id,
        type: record.type,
        hash: hederaResult.hash,
        timestamp: hederaResult.timestamp
      },
      hedera: {
        topicId: hederaResult.topicId || this.topicId,
        sequenceNumber: hederaResult.sequenceNumber,
        transactionId: hederaResult.transactionId
      },
      verification: {
        topicUrl: this.getTopicUrl(hederaResult.topicId),
        messageUrl: this.getTopicMessageUrl(hederaResult.topicId, hederaResult.sequenceNumber),
        transactionUrl: hederaResult.transactionId ? this.getTransactionUrl(hederaResult.transactionId) : null
      }
    };

    return verification;
  }

  // URL principale pour la démonstration Quest 3
  getMainDemoUrl() {
    return {
      title: 'FADJMA Hedera Integration - Live Verification',
      description: 'Verify FADJMA medical records anchored on Hedera Testnet',
      urls: {
        mainTopic: this.getTopicUrl(),
        account: this.getAccountUrl(),
        explorer: `${this.baseUrl}/${this.network}`
      },
      instructions: [
        '1. Visit the main topic to see all anchored medical records',
        '2. Each message represents a medical record hash',
        '3. Sequence numbers correspond to record creation order',
        '4. Transaction IDs provide full audit trail'
      ]
    };
  }
}

module.exports = new HashScanService();