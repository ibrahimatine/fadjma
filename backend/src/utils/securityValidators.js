const { body, param, query } = require('express-validator');
const rateLimit = require('express-rate-limit');

/**
 * Validateurs de sécurité renforcés
 */
class SecurityValidators {
  /**
   * Validation sécurisée pour les emails
   */
  static email() {
    return body('email')
      .isEmail()
      .normalizeEmail()
      .isLength({ max: 254 }) // RFC 5321 limit
      .withMessage('Email address is invalid or too long');
  }

  /**
   * Validation sécurisée pour les mots de passe
   */
  static password() {
    return body('password')
      .isLength({ min: 8, max: 128 })
      .withMessage('Password must be between 8 and 128 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character');
  }

  /**
   * Validation pour mots de passe existants (connexion)
   */
  static existingPassword() {
    return body('password')
      .isLength({ min: 1, max: 128 })
      .withMessage('Password is required');
  }

  /**
   * Validation pour les noms (prénom, nom)
   */
  static name(field) {
    return body(field)
      .trim()
      .isLength({ min: 1, max: 50 })
      .matches(/^[a-zA-ZÀ-ÿ\s\-']+$/)
      .withMessage(`${field} must be 1-50 characters and contain only letters, spaces, hyphens, and apostrophes`);
  }

  /**
   * Validation pour les numéros de téléphone
   */
  static phoneNumber() {
    return body('phoneNumber')
      .optional()
      .matches(/^[+]?[1-9]\d{1,14}$/)
      .withMessage('Phone number must be in international format (max 15 digits)');
  }

  /**
   * Validation pour les UUIDs
   */
  static uuid(field, location = 'param') {
    const validator = location === 'param' ? param(field) : body(field);
    return validator
      .isUUID(4)
      .withMessage(`${field} must be a valid UUID`);
  }

  /**
   * Validation pour les identifiants patients
   */
  static patientIdentifier() {
    return body('patientIdentifier')
      .matches(/^PAT-20[2-3][0-9](0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])-[A-F0-9]{4}$/)
      .withMessage('Patient identifier must be in format PAT-YYYYMMDD-XXXX');
  }

  /**
   * Validation pour les rôles utilisateur
   */
  static userRole() {
    return body('role')
      .isIn(['patient', 'doctor', 'pharmacy'])
      .withMessage('Role must be patient, doctor, or pharmacy');
  }

  /**
   * Validation pour les numéros de licence
   */
  static licenseNumber() {
    return body('licenseNumber')
      .isLength({ min: 5, max: 20 })
      .matches(/^[A-Z0-9\-]+$/)
      .withMessage('License number must be 5-20 characters and contain only uppercase letters, numbers, and hyphens');
  }

  /**
   * Validation pour les paramètres de pagination
   */
  static pagination() {
    return [
      query('page')
        .optional()
        .isInt({ min: 1, max: 1000 })
        .withMessage('Page must be between 1 and 1000'),
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
    ];
  }

  /**
   * Validation pour les termes de recherche
   */
  static searchTerm() {
    return query('search')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .matches(/^[a-zA-ZÀ-ÿ0-9\s\-@.]+$/)
      .withMessage('Search term must be max 100 characters and contain only letters, numbers, spaces, hyphens, @ and dots');
  }

  /**
   * Validation pour les dates
   */
  static dateOfBirth() {
    return body('dateOfBirth')
      .optional()
      .isISO8601()
      .custom((value) => {
        const date = new Date(value);
        const now = new Date();
        const minDate = new Date(now.getFullYear() - 120, 0, 1); // Max 120 years old
        const maxDate = new Date(now.getFullYear() - 13, now.getMonth(), now.getDate()); // Min 13 years old

        if (date < minDate || date > maxDate) {
          throw new Error('Date of birth must be between 13 and 120 years ago');
        }
        return true;
      });
  }

  /**
   * Rate limiting pour les endpoints sensibles
   */
  static loginRateLimit() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 tentatives par IP
      message: {
        error: 'Too many login attempts, please try again later',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
  }

  /**
   * Rate limiting pour l'inscription
   */
  static registerRateLimit() {
    return rateLimit({
      windowMs: 60 * 60 * 1000, // 1 heure
      max: 3, // 3 inscriptions par IP par heure
      message: {
        error: 'Too many registration attempts, please try again later',
        retryAfter: '1 hour'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
  }

  /**
   * Rate limiting pour la création de patients
   */
  static createPatientRateLimit() {
    return rateLimit({
      windowMs: 60 * 60 * 1000, // 1 heure
      max: 10, // 10 créations par IP par heure
      message: {
        error: 'Too many patient creation attempts, please try again later',
        retryAfter: '1 hour'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
  }

  /**
   * Sanitisation des entrées pour prévenir les attaques XSS
   */
  static sanitizeInput(field) {
    return body(field)
      .trim()
      .escape(); // Échappe les caractères HTML
  }

  /**
   * Validation pour les adresses
   */
  static address(field = 'address') {
    return body(field)
      .optional()
      .trim()
      .isLength({ max: 500 })
      .matches(/^[a-zA-ZÀ-ÿ0-9\s\-,.'()]+$/)
      .withMessage(`${field} must be max 500 characters and contain only letters, numbers, spaces, and common punctuation`);
  }

  /**
   * Validation pour les genres
   */
  static gender() {
    return body('gender')
      .optional()
      .isIn(['male', 'female', 'other'])
      .withMessage('Gender must be male, female, or other');
  }

  /**
   * Validation pour les spécialités médicales
   */
  static medicalSpecialty() {
    return body('specialty')
      .trim()
      .isLength({ min: 2, max: 100 })
      .matches(/^[a-zA-ZÀ-ÿ\s\-]+$/)
      .withMessage('Medical specialty must be 2-100 characters and contain only letters, spaces, and hyphens');
  }

  /**
   * Empêche l'injection SQL en validant les opérateurs de tri
   */
  static sortOrder() {
    return query('order')
      .optional()
      .isIn(['ASC', 'DESC'])
      .withMessage('Sort order must be ASC or DESC');
  }

  /**
   * Validation des colonnes pour le tri (whitelist)
   */
  static sortField(allowedFields) {
    return query('sortBy')
      .optional()
      .isIn(allowedFields)
      .withMessage(`Sort field must be one of: ${allowedFields.join(', ')}`);
  }
}

module.exports = SecurityValidators;