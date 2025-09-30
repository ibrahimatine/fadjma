const crypto = require('crypto');
const logger = require('../utils/logger');

class EncryptionService {

  constructor() {
    // Différentes clés pour différents niveaux
    // En production, ces clés doivent être dans les variables d'environnement
    this.keys = {
      level1: process.env.ENCRYPTION_KEY_LEVEL1 || crypto.randomBytes(32).toString('hex'), // Public (metadata)
      level2: process.env.ENCRYPTION_KEY_LEVEL2 || crypto.randomBytes(32).toString('hex'), // Sensible (dossiers)
      level3: process.env.ENCRYPTION_KEY_LEVEL3 || crypto.randomBytes(32).toString('hex')  // Très sensible (prescriptions)
    };

    this.algorithm = 'aes-256-gcm';
  }

  /**
   * Chiffrer des données selon le niveau de sécurité
   * @param {Object} data - Données à chiffrer
   * @param {Number} securityLevel - Niveau (1, 2, 3)
   * @returns {Object} Données chiffrées avec IV et tag
   */
  encrypt(data, securityLevel = 2) {
    try {
      const key = this.getKeyForLevel(securityLevel);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(key, 'hex'), iv);

      const dataString = JSON.stringify(data);
      let encrypted = cipher.update(dataString, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      return {
        encrypted: encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        securityLevel
      };

    } catch (error) {
      logger.error('Encryption error:', error);
      throw new Error('Erreur lors du chiffrement des données');
    }
  }

  /**
   * Déchiffrer des données
   * @param {Object} encryptedData - Données chiffrées
   * @returns {Object} Données déchiffrées
   */
  decrypt(encryptedData) {
    try {
      const { encrypted, iv, authTag, securityLevel } = encryptedData;
      const key = this.getKeyForLevel(securityLevel);

      const decipher = crypto.createDecipheriv(
        this.algorithm,
        Buffer.from(key, 'hex'),
        Buffer.from(iv, 'hex')
      );

      decipher.setAuthTag(Buffer.from(authTag, 'hex'));

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return JSON.parse(decrypted);

    } catch (error) {
      logger.error('Decryption error:', error);
      throw new Error('Erreur lors du déchiffrement des données');
    }
  }

  /**
   * Obtenir la clé pour un niveau donné
   */
  getKeyForLevel(level) {
    const keyMap = {
      1: this.keys.level1,
      2: this.keys.level2,
      3: this.keys.level3
    };

    if (!keyMap[level]) {
      throw new Error(`Niveau de sécurité invalide: ${level}`);
    }

    return keyMap[level];
  }

  /**
   * Préparer les données pour Hedera avec chiffrement adaptatif
   */
  prepareForHedera(data, recordType) {
    // Déterminer le niveau selon le type
    let securityLevel;
    switch (recordType) {
      case 'prescription':
      case 'dispensation':
      case 'prescription_group':
      case 'prescription_group_delivery':
        securityLevel = 3; // Très sensible
        break;
      case 'medical_record':
      case 'vaccination':
      case 'test_result':
        securityLevel = 2; // Sensible
        break;
      case 'metadata':
      case 'consultation':
      default:
        securityLevel = 1; // Public
    }

    return this.encrypt(data, securityLevel);
  }

  /**
   * Hash sécurisé pour vérification d'intégrité
   */
  createHash(data) {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Vérifier un hash
   */
  verifyHash(data, hash) {
    const computedHash = this.createHash(data);
    return computedHash === hash;
  }

  /**
   * Générer un token sécurisé
   */
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Chiffrer un texte simple (pour mots de passe, etc.)
   */
  encryptText(text, securityLevel = 2) {
    try {
      const key = this.getKeyForLevel(securityLevel);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(key, 'hex'), iv);

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };

    } catch (error) {
      logger.error('Text encryption error:', error);
      throw new Error('Erreur lors du chiffrement du texte');
    }
  }

  /**
   * Déchiffrer un texte simple
   */
  decryptText(encryptedData, securityLevel = 2) {
    try {
      const { encrypted, iv, authTag } = encryptedData;
      const key = this.getKeyForLevel(securityLevel);

      const decipher = crypto.createDecipheriv(
        this.algorithm,
        Buffer.from(key, 'hex'),
        Buffer.from(iv, 'hex')
      );

      decipher.setAuthTag(Buffer.from(authTag, 'hex'));

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;

    } catch (error) {
      logger.error('Text decryption error:', error);
      throw new Error('Erreur lors du déchiffrement du texte');
    }
  }
}

module.exports = new EncryptionService();