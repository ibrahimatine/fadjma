const logger = require('../utils/logger');
const rateLimit = require('express-rate-limit');

// Rate limiter pour les recherches de matricules (par userId uniquement)
const matriculeSearchLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    // Limite variable selon rôle
    const role = req.user?.role;
    if (role === 'admin') return 200;
    if (role === 'pharmacy') return 100;
    return 50; // Default pour autres rôles
  },
  message: {
    error: 'Trop de tentatives de recherche. Réessayez dans 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Clé simple: userId pour éviter problème IPv6
  keyGenerator: (req) => {
    const userId = req.user?.id || 'anonymous';
    return `user:${userId}`;
  },
  // Skip en développement pour faciliter les tests
  skip: (req) => process.env.NODE_ENV === 'development',
  // Handler personnalisé pour logging
  handler: (req, res) => {
    const userId = req.user?.id || 'anonymous';
    logger.warn(`Rate limit exceeded for user ${userId}`, {
      userId,
      path: req.path,
      timestamp: new Date().toISOString()
    });

    res.status(429).json({
      error: 'Trop de tentatives de recherche. Réessayez dans 15 minutes.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 900 // 15 minutes en secondes
    });
  }
});

// Middleware de validation des paramètres de recherche
const validateMatriculeAccess = (req, res, next) => {
  const { matricule } = req.params;
  const { id: pharmacyId, role } = req.user;

  // Vérifier que l'utilisateur est bien une pharmacie
  if (role !== 'pharmacy') {
    logger.warn(`Tentative d'accès non autorisé au matricule ${matricule} par ${req.user.id} (rôle: ${role})`);
    return res.status(403).json({
      message: 'Accès refusé. Seules les pharmacies peuvent accéder aux prescriptions par matricule.',
      code: 'UNAUTHORIZED_ROLE'
    });
  }

  // Validation du format du matricule (PRX pour médicaments, ORD pour ordonnances)
  const isPrescriptionMatricule = /^PRX-\d{8}-[A-F0-9]{8}$/.test(matricule);
  const isOrdonnanceMatricule = /^ORD-\d{8}-[A-F0-9]{4,8}$/.test(matricule); // 4-8 chars pour compatibilité

  if (!matricule || (!isPrescriptionMatricule && !isOrdonnanceMatricule)) {
    logger.warn(`Format de matricule invalide: ${matricule} par pharmacie ${pharmacyId}`);
    return res.status(400).json({
      message: 'Format de matricule invalide',
      code: 'INVALID_MATRICULE_FORMAT',
      expected: 'PRX-YYYYMMDD-XXXXXXXX (médicament) ou ORD-YYYYMMDD-XXXX/XXXXXXXX (ordonnance)'
    });
  }

  // Journaliser l'accès pour audit
  const matriculeType = isPrescriptionMatricule ? 'médicament' : 'ordonnance';
  logger.info(`Tentative d'accès au matricule ${matriculeType} ${matricule} par la pharmacie ${pharmacyId}`, {
    pharmacyId,
    matricule,
    matriculeType,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  next();
};

// Middleware pour journaliser les tentatives d'accès échouées
const logFailedAccess = (req, res, next) => {
  // Intercepter les réponses d'erreur pour les journaliser
  const originalSend = res.send;
  res.send = function(data) {
    if (res.statusCode >= 400) {
      const { matricule } = req.params;
      const { id: pharmacyId } = req.user;

      logger.warn(`Échec d'accès au matricule ${matricule} par la pharmacie ${pharmacyId}`, {
        pharmacyId,
        matricule,
        statusCode: res.statusCode,
        error: typeof data === 'string' ? data : JSON.stringify(data),
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
    }

    originalSend.call(this, data);
  };

  next();
};

// Middleware pour limiter les informations exposées
const sanitizeResponse = (req, res, next) => {
  const originalJson = res.json;
  res.json = function(data) {
    // Si c'est une erreur, ne pas exposer d'informations sensibles
    if (res.statusCode >= 400 && data.error) {
      delete data.error.stack;
      delete data.error.details;
    }

    // Pour les prescriptions, s'assurer qu'on ne fuit pas d'informations sensibles
    if (data.prescription && res.statusCode === 200) {
      // Masquer certains champs sensibles si nécessaire
      if (data.prescription.patient) {
        // Ne garder que les informations nécessaires
        const { id, firstName, lastName, dateOfBirth } = data.prescription.patient;
        data.prescription.patient = { id, firstName, lastName, dateOfBirth };
      }
    }

    originalJson.call(this, data);
  };

  next();
};

// Middleware de validation des permissions sur les prescriptions
const validatePrescriptionPermissions = async (req, res, next) => {
  const { prescriptionId } = req.params;
  const { id: pharmacyId, role } = req.user;

  if (role !== 'pharmacy') {
    return res.status(403).json({
      message: 'Accès refusé. Action réservée aux pharmacies.',
      code: 'UNAUTHORIZED_ROLE'
    });
  }

  try {
    const { Prescription } = require('../models');
    const prescription = await Prescription.findByPk(prescriptionId);

    if (!prescription) {
      return res.status(404).json({
        message: 'Prescription non trouvée',
        code: 'PRESCRIPTION_NOT_FOUND'
      });
    }

    // Vérifier que la pharmacie a accès à cette prescription
    if (prescription.pharmacyId && prescription.pharmacyId !== pharmacyId) {
      logger.warn(`Tentative d'accès à une prescription d'une autre pharmacie`, {
        prescriptionId,
        requestingPharmacy: pharmacyId,
        owningPharmacy: prescription.pharmacyId
      });

      return res.status(403).json({
        message: 'Cette prescription est déjà assignée à une autre pharmacie',
        code: 'PRESCRIPTION_ASSIGNED_TO_OTHER_PHARMACY'
      });
    }

    // Ajouter la prescription au contexte de la requête
    req.prescription = prescription;
    next();

  } catch (error) {
    logger.error('Erreur lors de la vérification des permissions:', error);
    return res.status(500).json({
      message: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

module.exports = {
  matriculeSearchLimit,
  validateMatriculeAccess,
  logFailedAccess,
  sanitizeResponse,
  validatePrescriptionPermissions
};