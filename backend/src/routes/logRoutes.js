const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Middleware d'autorisation admin pour toutes les routes
router.use(auth);
router.use(authorize(['admin']));

// GET /api/logs/stats - Statistiques des fichiers de logs
router.get('/stats', async (req, res) => {
  try {
    const stats = await logger.getLogStats();

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.logError(error, {
      service: 'LOG_API',
      action: 'GET_STATS',
      userId: req.user.id
    });

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques de logs',
      error: error.message
    });
  }
});

// GET /api/logs/:type - Consulter les logs par type
router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { lines = 100, search } = req.query;

    // Valider le type de log
    const validTypes = ['client', 'server', 'errors', 'combined'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Type de log invalide. Types valides: ${validTypes.join(', ')}`
      });
    }

    // Lire le fichier de log
    let logs = await logger.readLogFile(type, parseInt(lines));

    // Filtrer par recherche si spécifié
    if (search) {
      const searchLower = search.toLowerCase();
      logs = logs.filter(log => {
        const logString = JSON.stringify(log).toLowerCase();
        return logString.includes(searchLower);
      });
    }

    // Logger l'accès aux logs
    logger.logClientAction('VIEW_LOGS', {
      userId: req.user.id,
      userRole: req.user.role,
      ip: req.ip,
      logType: type,
      lines: parseInt(lines),
      search: search || null
    });

    res.json({
      success: true,
      data: {
        logs,
        meta: {
          type,
          totalLines: logs.length,
          requestedLines: parseInt(lines),
          searchTerm: search || null,
          timestamp: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    logger.logError(error, {
      service: 'LOG_API',
      action: 'READ_LOGS',
      userId: req.user.id,
      logType: req.params.type
    });

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la lecture des logs',
      error: error.message
    });
  }
});

// GET /api/logs/client/actions - Actions client spécifiques
router.get('/client/actions', async (req, res) => {
  try {
    const { userId, action, dateFrom, dateTo, limit = 100 } = req.query;

    let logs = await logger.readLogFile('client', parseInt(limit));

    // Filtrer par utilisateur
    if (userId) {
      logs = logs.filter(log => log.userId === userId);
    }

    // Filtrer par action
    if (action) {
      logs = logs.filter(log => log.action && log.action.includes(action.toUpperCase()));
    }

    // Filtrer par date
    if (dateFrom || dateTo) {
      logs = logs.filter(log => {
        const logDate = new Date(log.timestamp);
        if (dateFrom && logDate < new Date(dateFrom)) return false;
        if (dateTo && logDate > new Date(dateTo)) return false;
        return true;
      });
    }

    logger.logClientAction('VIEW_CLIENT_ACTIONS', {
      userId: req.user.id,
      userRole: req.user.role,
      ip: req.ip,
      filters: { userId, action, dateFrom, dateTo }
    });

    res.json({
      success: true,
      data: {
        actions: logs,
        meta: {
          totalActions: logs.length,
          filters: { userId, action, dateFrom, dateTo },
          timestamp: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    logger.logError(error, {
      service: 'LOG_API',
      action: 'READ_CLIENT_ACTIONS',
      userId: req.user.id
    });

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la lecture des actions client',
      error: error.message
    });
  }
});

// GET /api/logs/server/operations - Opérations serveur spécifiques
router.get('/server/operations', async (req, res) => {
  try {
    const { service, action, success, dateFrom, dateTo, limit = 100 } = req.query;

    let logs = await logger.readLogFile('server', parseInt(limit));

    // Filtrer par service
    if (service) {
      logs = logs.filter(log => log.service === service.toUpperCase());
    }

    // Filtrer par action
    if (action) {
      logs = logs.filter(log => log.action && log.action.includes(action.toUpperCase()));
    }

    // Filtrer par succès/échec
    if (success !== undefined) {
      const successBool = success === 'true';
      logs = logs.filter(log => log.success === successBool);
    }

    // Filtrer par date
    if (dateFrom || dateTo) {
      logs = logs.filter(log => {
        const logDate = new Date(log.timestamp);
        if (dateFrom && logDate < new Date(dateFrom)) return false;
        if (dateTo && logDate > new Date(dateTo)) return false;
        return true;
      });
    }

    logger.logClientAction('VIEW_SERVER_OPERATIONS', {
      userId: req.user.id,
      userRole: req.user.role,
      ip: req.ip,
      filters: { service, action, success, dateFrom, dateTo }
    });

    res.json({
      success: true,
      data: {
        operations: logs,
        meta: {
          totalOperations: logs.length,
          filters: { service, action, success, dateFrom, dateTo },
          timestamp: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    logger.logError(error, {
      service: 'LOG_API',
      action: 'READ_SERVER_OPERATIONS',
      userId: req.user.id
    });

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la lecture des opérations serveur',
      error: error.message
    });
  }
});

// GET /api/logs/errors/recent - Erreurs récentes avec détails
router.get('/errors/recent', async (req, res) => {
  try {
    const { service, severity, limit = 50 } = req.query;

    let logs = await logger.readLogFile('errors', parseInt(limit));

    // Filtrer par service
    if (service) {
      logs = logs.filter(log => log.service === service.toUpperCase());
    }

    // Filtrer par sévérité (basé sur la présence de stack trace)
    if (severity) {
      if (severity === 'critical') {
        logs = logs.filter(log => log.stack && log.stack.length > 0);
      } else if (severity === 'warning') {
        logs = logs.filter(log => !log.stack || log.stack.length === 0);
      }
    }

    // Ajouter des métadonnées sur les erreurs
    const errorSummary = {
      total: logs.length,
      byService: {},
      byStatusCode: {},
      last24h: 0
    };

    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    logs.forEach(log => {
      // Compter par service
      const service = log.service || 'UNKNOWN';
      errorSummary.byService[service] = (errorSummary.byService[service] || 0) + 1;

      // Compter par code de statut
      if (log.statusCode) {
        errorSummary.byStatusCode[log.statusCode] = (errorSummary.byStatusCode[log.statusCode] || 0) + 1;
      }

      // Compter les erreurs des dernières 24h
      if (new Date(log.timestamp) > last24h) {
        errorSummary.last24h++;
      }
    });

    logger.logClientAction('VIEW_RECENT_ERRORS', {
      userId: req.user.id,
      userRole: req.user.role,
      ip: req.ip,
      filters: { service, severity }
    });

    res.json({
      success: true,
      data: {
        errors: logs,
        summary: errorSummary,
        meta: {
          filters: { service, severity },
          timestamp: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    logger.logError(error, {
      service: 'LOG_API',
      action: 'READ_RECENT_ERRORS',
      userId: req.user.id
    });

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la lecture des erreurs récentes',
      error: error.message
    });
  }
});

module.exports = router;