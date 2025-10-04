const crypto = require('crypto');

/**
 * Service de sanitization des logs pour conformité RGPD/HIPAA
 * Pseudonymise et hashe les données sensibles
 */
class LogSanitizer {
  constructor() {
    // Clé secrète pour hashing (devrait être en env)
    this.salt = process.env.LOG_SALT || 'default-log-salt-change-in-production';

    // Champs considérés comme sensibles (données de santé)
    this.sensitiveFields = [
      'medication',
      'diagnosis',
      'description',
      'prescription',
      'symptoms',
      'treatment',
      'allergies',
      'medicalHistory',
      'labResults',
      'vitalSigns',
      'firstName',
      'lastName',
      'email',
      'phone',
      'address',
      'dateOfBirth'
    ];
  }

  /**
   * Hash une valeur de manière déterministe
   * @param {string} value - Valeur à hasher
   * @returns {string} Hash tronqué (8 premiers caractères)
   */
  hash(value) {
    if (!value) return '***EMPTY***';

    const hash = crypto
      .createHmac('sha256', this.salt)
      .update(String(value))
      .digest('hex')
      .substring(0, 8);

    return `***${hash}`;
  }

  /**
   * Pseudonymise un ID (garde le format mais masque)
   * @param {string} id - ID à pseudonymiser
   * @returns {string}
   */
  pseudonymizeId(id) {
    if (!id) return '***';

    // Garder les 4 premiers et 4 derniers caractères, hasher le milieu
    if (id.length <= 8) {
      return this.hash(id);
    }

    const start = id.substring(0, 4);
    const end = id.substring(id.length - 4);
    const middle = this.hash(id);

    return `${start}${middle}${end}`;
  }

  /**
   * Sanitize un objet pour les logs
   * @param {object} data - Données à sanitizer
   * @returns {object} Données sanitizées
   */
  sanitize(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    // Array
    if (Array.isArray(data)) {
      return data.map(item => this.sanitize(item));
    }

    // Object
    const sanitized = {};

    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();

      // Champs sensibles -> hash
      if (this.sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()))) {
        if (typeof value === 'string') {
          sanitized[key] = this.hash(value);
        } else if (typeof value === 'object') {
          sanitized[key] = this.sanitize(value); // Récursif
        } else {
          sanitized[key] = '***REDACTED***';
        }
      }
      // IDs -> pseudonymiser
      else if (key.endsWith('Id') || key === 'id') {
        sanitized[key] = this.pseudonymizeId(String(value));
      }
      // Matricules -> garder format mais masquer partie
      else if (key === 'matricule' && typeof value === 'string') {
        sanitized[key] = this.sanitizeMatricule(value);
      }
      // Objets imbriqués -> récursif
      else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitize(value);
      }
      // Autres valeurs -> conserver
      else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Sanitize un matricule (garde le format)
   * @param {string} matricule - Ex: PRX-20250104-A1B2C3D4
   * @returns {string} - Ex: PRX-20250104-***A1B2
   */
  sanitizeMatricule(matricule) {
    if (!matricule || typeof matricule !== 'string') {
      return '***';
    }

    const parts = matricule.split('-');
    if (parts.length !== 3) {
      return this.hash(matricule);
    }

    // Garder préfixe et date, masquer code unique
    const prefix = parts[0];
    const date = parts[1];
    const code = parts[2];

    // Masquer milieu du code, garder début/fin
    const maskedCode = code.length > 4
      ? `***${code.substring(code.length - 4)}`
      : '***';

    return `${prefix}-${date}-${maskedCode}`;
  }

  /**
   * Créer un message de log sanitizé
   * @param {string} level - Niveau de log (info, warn, error)
   * @param {string} message - Message principal
   * @param {object} metadata - Métadonnées à sanitizer
   * @returns {object}
   */
  createSafeLog(level, message, metadata = {}) {
    return {
      level,
      message,
      metadata: this.sanitize(metadata),
      timestamp: new Date().toISOString(),
      sanitized: true
    };
  }

  /**
   * Logger sécurisé pour données médicales
   * @param {object} logger - Instance de logger (winston, etc.)
   * @param {string} level - Niveau
   * @param {string} message - Message
   * @param {object} data - Données
   */
  safeLog(logger, level, message, data = {}) {
    const safeLogData = this.createSafeLog(level, message, data);
    logger[level](safeLogData.message, safeLogData.metadata);
  }
}

module.exports = new LogSanitizer();
