const winston = require('winston');
const path = require('path');
const fs = require('fs');
const logSanitizer = require('./logSanitizer');

// Créer le dossier logs s'il n'existe pas
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Format personnalisé pour les logs
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, userId, ip, userAgent, method, url, statusCode, responseTime, service, action, data, stack, ...meta }) => {
    const baseLog = {
      timestamp,
      level: level.toUpperCase(),
      message
    };

    // Ajouter les métadonnées spécifiques selon le type de log
    if (userId) baseLog.userId = userId;
    if (ip) baseLog.ip = ip;
    if (userAgent) baseLog.userAgent = userAgent;
    if (method) baseLog.method = method;
    if (url) baseLog.url = url;
    if (statusCode) baseLog.statusCode = statusCode;
    if (responseTime) baseLog.responseTime = responseTime;
    if (service) baseLog.service = service;
    if (action) baseLog.action = action;
    if (data) baseLog.data = data;
    if (stack) baseLog.stack = stack;

    // Ajouter toutes les autres métadonnées
    Object.keys(meta).forEach(key => {
      if (meta[key] !== undefined && meta[key] !== null) {
        baseLog[key] = meta[key];
      }
    });

    return JSON.stringify(baseLog);
  })
);

// Logger pour les actions des clients
const clientLogger = winston.createLogger({
  level: 'info',
  format: customFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'client-actions.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    })
  ]
});

// Logger pour les actions internes du serveur
const serverLogger = winston.createLogger({
  level: 'info',
  format: customFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'server-internal.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    })
  ]
});

// Logger pour les erreurs
const errorLogger = winston.createLogger({
  level: 'error',
  format: customFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'errors.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    // Aussi afficher les erreurs en console en développement
    ...(process.env.NODE_ENV === 'development' ? [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ] : [])
  ]
});

// Logger principal pour les logs généraux (console + fichier combiné)
const mainLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    // Console en développement
    ...(process.env.NODE_ENV === 'development' ? [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ] : [])
  ]
});

class FadjmaLogger {
  constructor() {
    this.clientLogger = clientLogger;
    this.serverLogger = serverLogger;
    this.errorLogger = errorLogger;
    this.mainLogger = mainLogger;
  }

  // === ACTIONS CLIENT ===

  /**
   * Logger une action utilisateur (connexion, consultation, création, etc.)
   */
  logClientAction(action, details = {}) {
    const logData = {
      action,
      userId: details.userId,
      userRole: details.userRole,
      ip: details.ip,
      userAgent: details.userAgent,
      method: details.method,
      url: details.url,
      statusCode: details.statusCode,
      responseTime: details.responseTime,
      resourceId: details.resourceId,
      resourceType: details.resourceType,
      data: details.data,
      message: this._generateClientMessage(action, details)
    };

    this.clientLogger.info('CLIENT_ACTION', logData);
  }

  /**
   * Logger une authentification
   */
  logAuthentication(type, details = {}) {
    this.logClientAction(`AUTH_${type.toUpperCase()}`, {
      ...details,
      authType: type
    });
  }

  /**
   * Logger l'accès à une ressource
   */
  logResourceAccess(resourceType, resourceId, operation, details = {}) {
    this.logClientAction(`RESOURCE_${operation.toUpperCase()}`, {
      ...details,
      resourceType,
      resourceId,
      operation
    });
  }

  // === ACTIONS INTERNES SERVEUR ===

  /**
   * Logger une action interne du serveur
   */
  logServerAction(service, action, details = {}) {
    const logData = {
      service,
      action,
      data: details.data,
      duration: details.duration,
      success: details.success,
      recordId: details.recordId,
      transactionId: details.transactionId,
      topicId: details.topicId,
      message: this._generateServerMessage(service, action, details)
    };

    this.serverLogger.info('SERVER_ACTION', logData);
  }

  /**
   * Logger une transaction Hedera
   */
  logHederaTransaction(type, details = {}) {
    this.logServerAction('HEDERA', `TRANSACTION_${type}`, {
      ...details,
      transactionType: type
    });
  }

  /**
   * Logger une opération base de données
   */
  logDatabaseOperation(operation, table, details = {}) {
    this.logServerAction('DATABASE', `${operation.toUpperCase()}_${table.toUpperCase()}`, {
      ...details,
      table,
      operation
    });
  }

  /**
   * Logger une vérification d'intégrité
   */
  logIntegrityCheck(type, result, details = {}) {
    this.logServerAction('INTEGRITY', `CHECK_${type.toUpperCase()}`, {
      ...details,
      checkType: type,
      result,
      isValid: result.isValid || result.success
    });
  }

  // === GESTION DES ERREURS ===

  /**
   * Logger une erreur
   */
  logError(error, context = {}) {
    const errorData = {
      error: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode,
      service: context.service,
      action: context.action,
      userId: context.userId,
      ip: context.ip,
      url: context.url,
      method: context.method,
      data: context.data,
      message: `ERROR: ${error.message}`
    };

    this.errorLogger.error('APPLICATION_ERROR', errorData);
  }

  /**
   * Logger une erreur Hedera spécifique
   */
  logHederaError(error, context = {}) {
    this.logError(error, {
      ...context,
      service: 'HEDERA',
      action: context.action || 'UNKNOWN_HEDERA_ACTION'
    });
  }

  /**
   * Logger une erreur de base de données
   */
  logDatabaseError(error, context = {}) {
    this.logError(error, {
      ...context,
      service: 'DATABASE',
      action: context.action || 'UNKNOWN_DB_ACTION'
    });
  }

  /**
   * Logger une erreur d'authentification
   */
  logAuthError(error, context = {}) {
    this.logError(error, {
      ...context,
      service: 'AUTHENTICATION',
      action: context.action || 'AUTH_FAILURE'
    });
  }

  // === LOGS GÉNÉRAUX ===

  /**
   * Logs généraux (info, warn, debug)
   */
  info(message, meta = {}) {
    this.mainLogger.info(message, meta);
  }

  warn(message, meta = {}) {
    this.mainLogger.warn(message, meta);
  }

  debug(message, meta = {}) {
    this.mainLogger.debug(message, meta);
  }

  // === MÉTHODES UTILITAIRES ===

  /**
   * Générer un message lisible pour les actions client
   */
  _generateClientMessage(action, details) {
    const user = details.userId ? `User ${details.userId}` : 'Anonymous user';
    const resource = details.resourceType && details.resourceId ?
      ` on ${details.resourceType} ${details.resourceId}` : '';

    return `${user} performed ${action}${resource}`;
  }

  /**
   * Générer un message lisible pour les actions serveur
   */
  _generateServerMessage(service, action, details) {
    const duration = details.duration ? ` (${details.duration}ms)` : '';
    const success = details.success !== undefined ?
      (details.success ? ' [SUCCESS]' : ' [FAILED]') : '';

    return `${service}: ${action}${success}${duration}`;
  }

  /**
   * Obtenir les statistiques des logs
   */
  async getLogStats() {
    const logFiles = [
      'client-actions.log',
      'server-internal.log',
      'errors.log',
      'combined.log'
    ];

    const stats = {};

    for (const file of logFiles) {
      const filePath = path.join(logsDir, file);
      try {
        const stat = fs.statSync(filePath);
        stats[file] = {
          size: stat.size,
          created: stat.birthtime,
          modified: stat.mtime,
          exists: true
        };
      } catch (error) {
        stats[file] = {
          exists: false,
          error: error.message
        };
      }
    }

    return stats;
  }

  /**
   * Lire les dernières lignes d'un fichier de log
   */
  async readLogFile(type = 'combined', lines = 100) {
    const fileMap = {
      'client': 'client-actions.log',
      'server': 'server-internal.log',
      'errors': 'errors.log',
      'combined': 'combined.log'
    };

    const filename = fileMap[type];
    if (!filename) {
      throw new Error(`Invalid log type: ${type}`);
    }

    const filePath = path.join(logsDir, filename);

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const allLines = content.split('\n').filter(line => line.trim());
      const recentLines = allLines.slice(-lines);

      return recentLines.map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return { raw: line };
        }
      });
    } catch (error) {
      throw new Error(`Failed to read log file ${filename}: ${error.message}`);
    }
  }

  // === COMPATIBILITÉ AVEC L'ANCIEN LOGGER ===
  error(message, meta = {}) {
    if (typeof message === 'object' && message.message) {
      // Si c'est un objet Error
      this.logError(message, meta);
    } else {
      // Si c'est un message string
      this.mainLogger.error(message, meta);
    }
  }

  // === LOGGING SÉCURISÉ RGPD/HIPAA ===

  /**
   * Log sécurisé avec sanitization automatique des données sensibles
   * @param {string} level - info, warn, error
   * @param {string} message - Message principal
   * @param {object} data - Données à logger (seront sanitizées)
   */
  safeLog(level, message, data = {}) {
    const sanitizedData = logSanitizer.sanitize(data);
    this.mainLogger[level](message, {
      ...sanitizedData,
      _sanitized: true // Flag pour indiquer que les données sont sanitizées
    });
  }

  /**
   * Shortcuts pour logging sécurisé
   */
  safeInfo(message, data) {
    this.safeLog('info', message, data);
  }

  safeWarn(message, data) {
    this.safeLog('warn', message, data);
  }

  safeError(message, data) {
    this.safeLog('error', message, data);
  }

  /**
   * Log action médicale (toujours sanitizé)
   */
  logMedicalAction(action, userId, patientId, data = {}) {
    this.safeInfo(`Medical action: ${action}`, {
      action,
      userId,
      patientId,
      ...data,
      _category: 'medical'
    });
  }

  /**
   * Log accès dossier médical (toujours sanitizé)
   */
  logMedicalRecordAccess(userId, recordId, action, data = {}) {
    this.safeInfo(`Medical record ${action}`, {
      userId,
      recordId,
      action,
      ...data,
      _category: 'medical_access'
    });
  }
}

// Export singleton
module.exports = new FadjmaLogger();