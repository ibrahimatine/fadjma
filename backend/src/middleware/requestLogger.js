const logger = require('../utils/logger');

/**
 * Middleware pour logger toutes les requêtes des clients
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Extraire les informations de la requête
  const requestInfo = {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.connection.remoteAddress || req.socket.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: req.user ? req.user.id : null,
    userRole: req.user ? req.user.role : null,
    body: sanitizeRequestBody(req.body),
    query: req.query,
    params: req.params
  };

  // Override de res.end pour capturer la réponse
  const originalEnd = res.end;
  let responseBody = '';

  // Capturer le corps de la réponse si possible
  const originalSend = res.send;
  res.send = function(body) {
    responseBody = body;
    return originalSend.call(this, body);
  };

  res.end = function(...args) {
    const responseTime = Date.now() - startTime;

    // Logger l'action du client
    const actionType = determineActionType(req);
    const resourceInfo = extractResourceInfo(req);

    logger.logClientAction(actionType, {
      ...requestInfo,
      statusCode: res.statusCode,
      responseTime,
      resourceType: resourceInfo.type,
      resourceId: resourceInfo.id,
      data: {
        request: {
          body: requestInfo.body,
          query: requestInfo.query,
          params: requestInfo.params
        },
        response: {
          statusCode: res.statusCode,
          body: sanitizeResponseBody(responseBody, res.statusCode)
        }
      }
    });

    // Logger les erreurs spécifiquement
    if (res.statusCode >= 400) {
      const error = new Error(`HTTP ${res.statusCode}: ${req.method} ${req.url}`);
      error.statusCode = res.statusCode;

      logger.logError(error, {
        service: 'HTTP_REQUEST',
        action: actionType,
        userId: requestInfo.userId,
        ip: requestInfo.ip,
        url: requestInfo.url,
        method: requestInfo.method,
        data: {
          request: requestInfo,
          response: { statusCode: res.statusCode, body: responseBody }
        }
      });
    }

    // Appeler la méthode originale
    return originalEnd.apply(this, args);
  };

  next();
};

/**
 * Déterminer le type d'action basé sur la requête
 */
function determineActionType(req) {
  const { method, url } = req;
  const path = url.split('?')[0]; // Enlever les query params

  // Actions d'authentification
  if (path.includes('/auth/login')) return 'LOGIN';
  if (path.includes('/auth/register')) return 'REGISTER';
  if (path.includes('/auth/logout')) return 'LOGOUT';
  if (path.includes('/auth/refresh')) return 'TOKEN_REFRESH';

  // Actions sur les dossiers médicaux
  if (path.includes('/medical-records')) {
    if (method === 'GET' && path.match(/\/medical-records\/\d+$/)) return 'VIEW_MEDICAL_RECORD';
    if (method === 'GET') return 'LIST_MEDICAL_RECORDS';
    if (method === 'POST') return 'CREATE_MEDICAL_RECORD';
    if (method === 'PUT' || method === 'PATCH') return 'UPDATE_MEDICAL_RECORD';
    if (method === 'DELETE') return 'DELETE_MEDICAL_RECORD';
  }

  // Actions sur les prescriptions
  if (path.includes('/prescriptions')) {
    if (method === 'GET' && path.match(/\/prescriptions\/\d+$/)) return 'VIEW_PRESCRIPTION';
    if (method === 'GET') return 'LIST_PRESCRIPTIONS';
    if (method === 'POST') return 'CREATE_PRESCRIPTION';
    if (method === 'PUT' || method === 'PATCH') return 'UPDATE_PRESCRIPTION';
    if (method === 'DELETE') return 'DELETE_PRESCRIPTION';
  }

  // Actions de vérification
  if (path.includes('/verify')) {
    if (path.includes('/hcs-status')) return 'VERIFY_HCS_STATUS';
    if (path.includes('/topic-stats')) return 'VIEW_TOPIC_STATS';
    if (path.includes('/record')) return 'VERIFY_RECORD';
    return 'VERIFICATION_ACTION';
  }

  // Actions d'administration
  if (path.includes('/admin')) {
    if (path.includes('/registry')) return 'ADMIN_REGISTRY_ACCESS';
    if (path.includes('/monitoring')) return 'ADMIN_MONITORING_ACCESS';
    if (path.includes('/export')) return 'ADMIN_EXPORT_DATA';
    return 'ADMIN_ACTION';
  }

  // Actions de monitoring
  if (path.includes('/monitoring')) {
    if (path.includes('/metrics')) return 'VIEW_METRICS';
    if (path.includes('/health')) return 'VIEW_HEALTH';
    if (path.includes('/alerts')) return 'VIEW_ALERTS';
    if (path.includes('/logs')) return 'VIEW_LOGS';
    return 'MONITORING_ACTION';
  }

  // Actions sur les patients
  if (path.includes('/patients')) {
    if (method === 'GET' && path.match(/\/patients\/\d+$/)) return 'VIEW_PATIENT';
    if (method === 'GET') return 'LIST_PATIENTS';
    if (method === 'POST') return 'CREATE_PATIENT';
    if (method === 'PUT' || method === 'PATCH') return 'UPDATE_PATIENT';
    return 'PATIENT_ACTION';
  }

  // Actions pharmacy
  if (path.includes('/pharmacy')) {
    if (path.includes('/dispense')) return 'DISPENSE_MEDICATION';
    if (path.includes('/search')) return 'SEARCH_PRESCRIPTION';
    return 'PHARMACY_ACTION';
  }

  // Actions par défaut basées sur la méthode HTTP
  switch (method) {
    case 'GET': return 'VIEW_RESOURCE';
    case 'POST': return 'CREATE_RESOURCE';
    case 'PUT':
    case 'PATCH': return 'UPDATE_RESOURCE';
    case 'DELETE': return 'DELETE_RESOURCE';
    default: return 'UNKNOWN_ACTION';
  }
}

/**
 * Extraire les informations de ressource de la requête
 */
function extractResourceInfo(req) {
  const { url, params = {} } = req;
  const path = url.split('?')[0];

  // Extraire l'ID de ressource depuis les paramètres ou l'URL
  const resourceId = params.id || params.recordId || params.prescriptionId ||
                    params.patientId || params.userId || params.topicId ||
                    extractIdFromPath(path);

  // Déterminer le type de ressource
  let resourceType = 'unknown';
  if (path.includes('/medical-records')) resourceType = 'medical_record';
  else if (path.includes('/prescriptions')) resourceType = 'prescription';
  else if (path.includes('/patients')) resourceType = 'patient';
  else if (path.includes('/users')) resourceType = 'user';
  else if (path.includes('/verify')) resourceType = 'verification';
  else if (path.includes('/admin')) resourceType = 'admin_panel';
  else if (path.includes('/monitoring')) resourceType = 'monitoring';

  return {
    type: resourceType,
    id: resourceId
  };
}

/**
 * Extraire l'ID depuis le chemin de l'URL
 */
function extractIdFromPath(path) {
  const matches = path.match(/\/(\d+)$/);
  return matches ? matches[1] : null;
}

/**
 * Nettoyer et sécuriser le corps de la requête pour le logging
 */
function sanitizeRequestBody(body) {
  if (!body || typeof body !== 'object') return body;

  const sanitized = { ...body };

  // Supprimer les champs sensibles
  const sensitiveFields = [
    'password',
    'confirmPassword',
    'currentPassword',
    'newPassword',
    'token',
    'secret',
    'privateKey',
    'apiKey',
    'authorization'
  ];

  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  // Limiter la taille pour éviter les logs trop volumineux
  const stringified = JSON.stringify(sanitized);
  if (stringified.length > 1000) {
    return { ...sanitized, _truncated: true, _originalSize: stringified.length };
  }

  return sanitized;
}

/**
 * Nettoyer et sécuriser le corps de la réponse pour le logging
 */
function sanitizeResponseBody(body, statusCode) {
  // Ne logger que les métadonnées pour les réponses volumineuses
  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body);
      return sanitizeResponseObject(parsed, statusCode);
    } catch {
      // Si ce n'est pas du JSON, limiter la taille
      return body.length > 500 ?
        { _truncated: true, _preview: body.substring(0, 100), _size: body.length } :
        body;
    }
  }

  return sanitizeResponseObject(body, statusCode);
}

/**
 * Nettoyer un objet de réponse
 */
function sanitizeResponseObject(obj, statusCode) {
  if (!obj || typeof obj !== 'object') return obj;

  // Pour les erreurs, garder plus d'informations
  if (statusCode >= 400) {
    return {
      success: obj.success,
      message: obj.message,
      error: obj.error,
      code: obj.code,
      statusCode: statusCode
    };
  }

  // Pour les succès, limiter aux métadonnées importantes
  const sanitized = {
    success: obj.success,
    message: obj.message
  };

  // Ajouter des informations sur les données sans les données sensibles
  if (obj.data) {
    if (Array.isArray(obj.data)) {
      sanitized.dataCount = obj.data.length;
      sanitized.dataType = 'array';
    } else if (typeof obj.data === 'object') {
      sanitized.dataKeys = Object.keys(obj.data);
      sanitized.dataType = 'object';
    }
  }

  return sanitized;
}

module.exports = requestLogger;