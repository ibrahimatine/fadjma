const { body, param, query, validationResult } = require('express-validator');
const createDOMPurify = require('isomorphic-dompurify');

const DOMPurify = createDOMPurify();

/**
 * Middleware de validation centralisé
 */

// Constantes de limites
const LIMITS = {
  TITLE_MAX: 200,
  DESCRIPTION_MAX: 5000,
  REASON_MAX: 1000,
  METADATA_MAX: 10000, // 10KB en caractères
  MEDICATION_NAME_MAX: 200,
  DOSAGE_MAX: 100,
  INSTRUCTIONS_MAX: 1000
};

/**
 * Sanitize HTML pour éviter XSS
 */
const sanitizeHTML = (dirty) => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'li', 'ol'],
    ALLOWED_ATTR: []
  });
};

/**
 * Middleware pour vérifier les résultats de validation
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }

  next();
};

/**
 * Validation création dossier médical
 */
const validateCreateMedicalRecord = [
  body('type')
    .trim()
    .isIn(['consultation', 'prescription', 'test_result', 'vaccination', 'allergy', 'surgery', 'hospitalization'])
    .withMessage('Type de dossier invalide'),

  body('title')
    .trim()
    .notEmpty().withMessage('Le titre est requis')
    .isLength({ max: LIMITS.TITLE_MAX }).withMessage(`Titre trop long (max ${LIMITS.TITLE_MAX} caractères)`)
    .customSanitizer(sanitizeHTML),

  body('description')
    .optional()
    .trim()
    .isLength({ max: LIMITS.DESCRIPTION_MAX }).withMessage(`Description trop longue (max ${LIMITS.DESCRIPTION_MAX} caractères)`)
    .customSanitizer(sanitizeHTML),

  body('diagnosis')
    .optional()
    .trim()
    .isLength({ max: LIMITS.DESCRIPTION_MAX }).withMessage(`Diagnostic trop long`)
    .customSanitizer(sanitizeHTML),

  body('patientId')
    .trim()
    .notEmpty().withMessage('Patient ID requis')
    .isUUID().withMessage('Patient ID invalide'),

  body('metadata')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        // Si c'est une chaîne, vérifier la taille
        if (value.length > LIMITS.METADATA_MAX) {
          throw new Error(`Metadata trop large (max ${LIMITS.METADATA_MAX} caractères)`);
        }
        // Valider que c'est du JSON valide
        try {
          JSON.parse(value);
        } catch (e) {
          throw new Error('Metadata JSON invalide');
        }
      } else if (typeof value === 'object') {
        // Si c'est un objet, vérifier la taille après stringification
        const stringified = JSON.stringify(value);
        if (stringified.length > LIMITS.METADATA_MAX) {
          throw new Error(`Metadata trop large (max ${LIMITS.METADATA_MAX} caractères)`);
        }
      }
      return true;
    }),

  body('prescription')
    .optional()
    .isArray().withMessage('Prescription doit être un tableau')
    .custom((prescriptions) => {
      if (prescriptions.length > 20) {
        throw new Error('Trop de médicaments (max 20)');
      }
      return true;
    }),

  body('prescription.*.name')
    .optional()
    .trim()
    .notEmpty().withMessage('Nom du médicament requis')
    .isLength({ max: LIMITS.MEDICATION_NAME_MAX }).withMessage('Nom de médicament trop long')
    .customSanitizer(sanitizeHTML),

  body('prescription.*.dosage')
    .optional()
    .trim()
    .notEmpty().withMessage('Dosage requis')
    .isLength({ max: LIMITS.DOSAGE_MAX }).withMessage('Dosage trop long')
    .customSanitizer(sanitizeHTML),

  body('prescription.*.frequency')
    .optional()
    .trim()
    .isLength({ max: LIMITS.INSTRUCTIONS_MAX }).withMessage('Instructions trop longues')
    .customSanitizer(sanitizeHTML),

  handleValidationErrors
];

/**
 * Validation demande d'accès
 */
const validateAccessRequest = [
  body('patientId')
    .trim()
    .notEmpty().withMessage('Patient ID requis')
    .isUUID().withMessage('Patient ID invalide'),

  body('accessLevel')
    .trim()
    .isIn(['read', 'read_write']).withMessage('Niveau d\'accès invalide'),

  body('reason')
    .trim()
    .notEmpty().withMessage('Raison requise')
    .isLength({ min: 10, max: LIMITS.REASON_MAX }).withMessage(`Raison entre 10 et ${LIMITS.REASON_MAX} caractères`)
    .customSanitizer(sanitizeHTML),

  handleValidationErrors
];

/**
 * Validation recherche matricule
 */
const validateMatriculeSearch = [
  param('matricule')
    .trim()
    .matches(/^(PRX|PAT|ORD)-\d{8}-[A-F0-9]{4,8}$/)
    .withMessage('Format de matricule invalide'),

  handleValidationErrors
];

/**
 * Validation pagination
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 }).withMessage('Page doit être entre 1 et 1000')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit doit être entre 1 et 100')
    .toInt(),

  query('sortBy')
    .optional()
    .trim()
    .matches(/^[a-zA-Z_]+$/).withMessage('Champ de tri invalide'),

  query('sortOrder')
    .optional()
    .trim()
    .isIn(['ASC', 'DESC', 'asc', 'desc']).withMessage('Ordre de tri invalide'),

  handleValidationErrors
];

/**
 * Validation ID générique
 */
const validateId = (paramName = 'id') => [
  param(paramName)
    .trim()
    .notEmpty().withMessage(`${paramName} requis`)
    .isUUID().withMessage(`${paramName} invalide`),

  handleValidationErrors
];

/**
 * Sanitize tous les strings d'un objet (récursif)
 */
const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeHTML(value);
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

module.exports = {
  validateCreateMedicalRecord,
  validateAccessRequest,
  validateMatriculeSearch,
  validatePagination,
  validateId,
  handleValidationErrors,
  sanitizeHTML,
  sanitizeObject,
  LIMITS
};
