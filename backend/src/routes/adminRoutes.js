const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const rateLimit = require('express-rate-limit');

// Rate limiting pour les opérations d'administration
const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Maximum 100 requêtes par IP toutes les 15 minutes
  message: {
    error: 'Trop de requêtes d\'administration. Réessayez dans 15 minutes.',
    code: 'ADMIN_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Ne pas appliquer la limite pour les environnements de développement
    return process.env.NODE_ENV === 'development';
  }
});

// Rate limiting plus strict pour les exports
const exportRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10, // Maximum 10 exports par heure
  message: {
    error: 'Trop d\'exports. Réessayez dans 1 heure.',
    code: 'EXPORT_RATE_LIMIT_EXCEEDED'
  }
});

// Middleware d'authentification et d'autorisation pour tous les routes admin
router.use(authMiddleware);
router.use(authorize(['admin']));
router.use(adminRateLimit);

// Route pour obtenir les statistiques du registre
router.get('/registry/overview', adminController.getRegistryOverview);

// Route pour obtenir les données du registre avec filtres
router.get('/registry/data', adminController.getRegistryData);

// Route pour vérifier une entrée spécifique du registre
router.post('/registry/verify/:type/:id', adminController.verifyRegistryEntry);

// Route pour obtenir les détails d'un topic Hedera
router.get('/registry/topic/:topicId', adminController.getTopicDetails);

// Route pour exporter les données du registre (avec rate limiting plus strict)
router.get('/registry/export', exportRateLimit, adminController.exportRegistryData);

// Routes pour les ancrages échoués
router.get('/anchors/failed', adminController.getFailedAnchors);
router.post('/anchors/retry', adminController.retryAnchor);

// Route pour mettre à jour le statut système
router.put('/status/update', adminController.updateSystemStatus);

// Route pour obtenir les logs système
router.get('/logs', adminController.getSystemLogs);

// Routes de gestion des utilisateurs
router.get('/users', adminController.getAllUsers);
router.post('/users', adminController.createUser);
router.put('/users/:userId', adminController.updateUser);
router.put('/users/:userId/reset-password', adminController.resetUserPassword);
router.delete('/users/:userId', adminController.deleteUser);

// Route pour obtenir l'historique des actions admin (optionnel)
router.get('/audit-log', (req, res) => {
  // Simulation d'un audit log
  res.json({
    success: true,
    logs: [
      {
        id: 1,
        adminId: req.user.id,
        action: 'REGISTRY_ACCESS',
        timestamp: new Date().toISOString(),
        details: { type: 'overview' }
      }
    ]
  });
});

// Route pour vérifier l'intégrité globale du système (optionnel)
router.post('/system/integrity-check', async (req, res) => {
  try {
    // Simulation d'un check d'intégrité global
    const integrityCheck = {
      checkId: 'CHECK-' + Date.now(),
      timestamp: new Date().toISOString(),
      status: 'completed',
      results: {
        totalRecords: 42,
        verifiedRecords: 38,
        pendingVerification: 3,
        failedVerification: 1,
        integrityScore: 95.2
      },
      issues: [
        {
          type: 'hash_mismatch',
          recordId: 'record-123',
          severity: 'low',
          description: 'Hash calculé ne correspond pas au hash stocké'
        }
      ]
    };

    res.json({
      success: true,
      integrityCheck
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors du check d\'intégrité',
      error: error.message
    });
  }
});

// Route pour synchroniser avec Hedera (optionnel)
router.post('/hedera/sync', async (req, res) => {
  try {
    // Simulation d'une synchronisation avec Hedera
    const syncResult = {
      syncId: 'SYNC-' + Date.now(),
      timestamp: new Date().toISOString(),
      status: 'completed',
      results: {
        recordsProcessed: 15,
        recordsUpdated: 12,
        recordsVerified: 10,
        errors: 2
      },
      duration: '2.3s'
    };

    res.json({
      success: true,
      sync: syncResult
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la synchronisation Hedera',
      error: error.message
    });
  }
});

module.exports = router;