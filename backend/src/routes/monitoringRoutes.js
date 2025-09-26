// Routes pour le monitoring système
const express = require('express');
const router = express.Router();
const monitoringService = require('../services/monitoringService');
const auth = require('../middleware/auth');

// Middleware pour vérifier les permissions admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé - Admin requis' });
  }
  next();
};

// GET /api/monitoring/metrics - Obtenir toutes les métriques
router.get('/metrics', auth, requireAdmin, (req, res) => {
  try {
    const metrics = monitoringService.getAllMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Erreur récupération métriques:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/monitoring/health - Status de santé du système
router.get('/health', auth, requireAdmin, (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date(),
      hedera: {
        uptime: monitoringService.metrics.hedera.uptime,
        lastSuccess: monitoringService.metrics.hedera.lastSuccessTime,
        totalTransactions: monitoringService.metrics.hedera.totalTransactions
      },
      system: {
        memory: `${monitoringService.metrics.system.memoryUsage} MB`,
        errorRate: `${monitoringService.metrics.system.errorRate}%`,
        requestsPerMinute: monitoringService.metrics.system.requestsPerMinute
      }
    };

    // Déterminer le statut global
    if (monitoringService.metrics.hedera.uptime < 80) {
      health.status = 'degraded';
    }
    if (monitoringService.metrics.system.errorRate > 20) {
      health.status = 'unhealthy';
    }

    res.json(health);
  } catch (error) {
    console.error('Erreur status santé:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erreur serveur'
    });
  }
});

// GET /api/monitoring/alerts - Alertes actives
router.get('/alerts', auth, requireAdmin, (req, res) => {
  try {
    const alerts = monitoringService.getActiveAlerts();
    res.json({
      alerts,
      count: alerts.length,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Erreur récupération alertes:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /api/monitoring/reset - Reset des métriques (pour les tests)
router.post('/reset', auth, requireAdmin, (req, res) => {
  try {
    monitoringService.resetMetrics();
    res.json({
      message: 'Métriques réinitialisées avec succès',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Erreur reset métriques:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/monitoring/logs - Derniers logs système
router.get('/logs', auth, requireAdmin, (req, res) => {
  try {
    const { limit = 50, type } = req.query;
    let logs = monitoringService.requestLog;

    // Filtrer par type si spécifié
    if (type) {
      logs = logs.filter(log => log.type === type);
    }

    // Limiter les résultats
    logs = logs.slice(-parseInt(limit));

    res.json({
      logs,
      total: logs.length,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Erreur récupération logs:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;