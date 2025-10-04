/**
 * KMS (Key Management Service) Configuration
 * Support pour AWS KMS, Google Cloud KMS, et HashiCorp Vault
 */

const logger = require('../utils/logger');

class KMSConfig {
  constructor() {
    this.provider = process.env.KMS_PROVIDER || 'env'; // 'aws', 'gcp', 'vault', 'env'
    this.hederaPrivateKey = null;
  }

  /**
   * Initialise le KMS et récupère les clés
   */
  async initialize() {
    logger.info(`🔐 Initializing KMS with provider: ${this.provider}`);

    try {
      switch (this.provider) {
        case 'aws':
          await this.initializeAWSKMS();
          break;

        case 'gcp':
          await this.initializeGCPKMS();
          break;

        case 'vault':
          await this.initializeVault();
          break;

        case 'env':
        default:
          this.initializeEnvVars();
          break;
      }

      logger.info('✅ KMS initialized successfully');
      return true;

    } catch (error) {
      logger.error('❌ KMS initialization failed:', error);
      throw new Error(`KMS initialization failed: ${error.message}`);
    }
  }

  /**
   * Initialisation avec AWS KMS
   */
  async initializeAWSKMS() {
    try {
      // Nécessite: npm install @aws-sdk/client-kms
      const { KMSClient, DecryptCommand } = require('@aws-sdk/client-kms');

      const client = new KMSClient({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
      });

      // Clé Hedera chiffrée stockée en base64
      const encryptedKey = process.env.HEDERA_PRIVATE_KEY_ENCRYPTED;

      if (!encryptedKey) {
        throw new Error('HEDERA_PRIVATE_KEY_ENCRYPTED not found in environment');
      }

      const command = new DecryptCommand({
        CiphertextBlob: Buffer.from(encryptedKey, 'base64'),
        KeyId: process.env.AWS_KMS_KEY_ID
      });

      const response = await client.send(command);
      this.hederaPrivateKey = Buffer.from(response.Plaintext).toString('utf-8');

      logger.info('✅ Hedera private key decrypted from AWS KMS');

    } catch (error) {
      logger.error('❌ AWS KMS initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialisation avec Google Cloud KMS
   */
  async initializeGCPKMS() {
    try {
      // Nécessite: npm install @google-cloud/kms
      const { KeyManagementServiceClient } = require('@google-cloud/kms');

      const client = new KeyManagementServiceClient({
        projectId: process.env.GCP_PROJECT_ID,
        keyFilename: process.env.GCP_KEY_FILE
      });

      const encryptedKey = process.env.HEDERA_PRIVATE_KEY_ENCRYPTED;

      if (!encryptedKey) {
        throw new Error('HEDERA_PRIVATE_KEY_ENCRYPTED not found in environment');
      }

      const name = `projects/${process.env.GCP_PROJECT_ID}/locations/${process.env.GCP_LOCATION}/keyRings/${process.env.GCP_KEY_RING}/cryptoKeys/${process.env.GCP_CRYPTO_KEY}`;

      const [result] = await client.decrypt({
        name: name,
        ciphertext: Buffer.from(encryptedKey, 'base64')
      });

      this.hederaPrivateKey = result.plaintext.toString('utf-8');

      logger.info('✅ Hedera private key decrypted from GCP KMS');

    } catch (error) {
      logger.error('❌ GCP KMS initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialisation avec HashiCorp Vault
   */
  async initializeVault() {
    try {
      // Nécessite: npm install node-vault
      const vault = require('node-vault');

      const client = vault({
        apiVersion: 'v1',
        endpoint: process.env.VAULT_ADDR || 'http://localhost:8200',
        token: process.env.VAULT_TOKEN
      });

      const secretPath = process.env.VAULT_SECRET_PATH || 'secret/data/hedera';

      const result = await client.read(secretPath);

      if (!result.data || !result.data.data || !result.data.data.privateKey) {
        throw new Error('Private key not found in Vault');
      }

      this.hederaPrivateKey = result.data.data.privateKey;

      logger.info('✅ Hedera private key retrieved from HashiCorp Vault');

    } catch (error) {
      logger.error('❌ Vault initialization failed:', error);
      throw error;
    }
  }

  /**
   * Fallback: utilise les variables d'environnement (NON recommandé en production)
   */
  initializeEnvVars() {
    this.hederaPrivateKey = process.env.HEDERA_PRIVATE_KEY || process.env.HEDERA_ECDSA_PRIVATE_KEY;

    if (!this.hederaPrivateKey) {
      throw new Error('HEDERA_PRIVATE_KEY not found in environment variables');
    }

    if (process.env.NODE_ENV === 'production') {
      logger.warn('⚠️  WARNING: Using private key from environment variables in production is NOT recommended. Use KMS instead.');
    } else {
      logger.info('🔑 Using private key from environment variables (development mode)');
    }
  }

  /**
   * Récupère la clé privée Hedera
   */
  getHederaPrivateKey() {
    if (!this.hederaPrivateKey) {
      throw new Error('KMS not initialized. Call initialize() first.');
    }

    return this.hederaPrivateKey;
  }

  /**
   * Rotation de clé (pour migration future)
   */
  async rotateKey() {
    logger.warn('🔄 Key rotation requested - feature not yet implemented');
    // TODO: Implémenter la rotation de clé
    throw new Error('Key rotation not implemented');
  }

  /**
   * Audit de l'utilisation de la clé
   */
  logKeyUsage(operation, metadata = {}) {
    logger.info('🔑 Hedera key usage', {
      operation,
      timestamp: new Date().toISOString(),
      provider: this.provider,
      ...metadata
    });
  }
}

// Singleton
const kmsConfig = new KMSConfig();

module.exports = kmsConfig;
