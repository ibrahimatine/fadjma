// Service de monitoring système temps réel
const EventEmitter = require('events');

class MonitoringService extends EventEmitter {
  constructor() {
    super();
    this.metrics = {
      hedera: {
        totalTransactions: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
        simulatedTransactions: 0,
        averageResponseTime: 0,
        lastSuccessTime: null,
        lastFailureTime: null,
        uptime: 100
      },
      system: {
        memoryUsage: 0,
        cpuUsage: 0,
        activeConnections: 0,
        requestsPerMinute: 0,
        errorRate: 0
      },
      database: {
        totalRecords: 0,
        prescriptions: 0,
        verificationRequests: 0,
        averageQueryTime: 0
      }
    };

    this.requestLog = [];
    this.maxLogSize = 1000;

    // Démarrer le monitoring périodique
    this.startPeriodicMonitoring();
  }

  // Enregistrer une transaction Hedera
  recordHederaTransaction(status, responseTime, details = {}) {
    const now = new Date();

    this.metrics.hedera.totalTransactions++;

    switch(status) {
      case 'SUCCESS':
        this.metrics.hedera.successfulTransactions++;
        this.metrics.hedera.lastSuccessTime = now;
        break;
      case 'SIMULATED':
        this.metrics.hedera.simulatedTransactions++;
        break;
      case 'ERROR':
      case 'FAILED_FALLBACK':
        this.metrics.hedera.failedTransactions++;
        this.metrics.hedera.lastFailureTime = now;
        break;
    }

    // Calculer le temps de réponse moyen
    const currentAvg = this.metrics.hedera.averageResponseTime;
    const totalTx = this.metrics.hedera.totalTransactions;
    this.metrics.hedera.averageResponseTime =
      ((currentAvg * (totalTx - 1)) + responseTime) / totalTx;

    // Calculer l'uptime
    const successRate = this.metrics.hedera.successfulTransactions /
                       (this.metrics.hedera.totalTransactions - this.metrics.hedera.simulatedTransactions);
    this.metrics.hedera.uptime = Math.round(successRate * 100) || 0;

    // Log de la transaction
    this.logRequest('hedera', status, responseTime, details);

    // Émettre l'événement pour les WebSockets
    this.emit('hederaTransaction', {
      status,
      responseTime,
      metrics: this.metrics.hedera,
      timestamp: now
    });
  }

  // Enregistrer une requête système
  recordSystemRequest(endpoint, method, status, responseTime) {
    const now = new Date();

    this.logRequest('system', status, responseTime, {
      endpoint,
      method
    });

    // Calculer les métriques en temps réel
    this.calculateSystemMetrics();

    this.emit('systemRequest', {
      endpoint,
      method,
      status,
      responseTime,
      metrics: this.metrics.system,
      timestamp: now
    });
  }

  // Enregistrer une opération base de données
  recordDatabaseOperation(type, queryTime, details = {}) {
    const now = new Date();

    // Mettre à jour les métriques DB
    const currentAvg = this.metrics.database.averageQueryTime;
    this.metrics.database.averageQueryTime =
      (currentAvg + queryTime) / 2;

    switch(type) {
      case 'record':
        this.metrics.database.totalRecords++;
        break;
      case 'prescription':
        this.metrics.database.prescriptions++;
        break;
      case 'verification':
        this.metrics.database.verificationRequests++;
        break;
    }

    this.emit('databaseOperation', {
      type,
      queryTime,
      metrics: this.metrics.database,
      timestamp: now
    });
  }

  // Log des requêtes
  logRequest(type, status, responseTime, details) {
    const logEntry = {
      timestamp: new Date(),
      type,
      status,
      responseTime,
      details
    };

    this.requestLog.push(logEntry);

    // Limiter la taille du log
    if (this.requestLog.length > this.maxLogSize) {
      this.requestLog.shift();
    }
  }

  // Calculer les métriques système
  calculateSystemMetrics() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Requêtes par minute
    const recentRequests = this.requestLog.filter(
      log => log.timestamp.getTime() > oneMinuteAgo && log.type === 'system'
    );
    this.metrics.system.requestsPerMinute = recentRequests.length;

    // Taux d'erreur
    const errorRequests = recentRequests.filter(
      req => req.status >= 400
    );
    this.metrics.system.errorRate = recentRequests.length > 0
      ? Math.round((errorRequests.length / recentRequests.length) * 100)
      : 0;

    // Mémoire et CPU (simulation)
    this.metrics.system.memoryUsage = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    this.metrics.system.cpuUsage = Math.round(Math.random() * 20 + 10); // Simulation
  }

  // Initialiser les compteurs avec les données existantes
  async initializeDatabaseCounters() {
    try {
      const { MedicalRecord, Prescription } = require('../models');

      // Compter les records existants
      const totalRecords = await MedicalRecord.count();
      const totalPrescriptions = await Prescription.count();

      // Initialiser les métriques
      this.metrics.database.totalRecords = totalRecords;
      this.metrics.database.prescriptions = totalPrescriptions;

      console.log(`📊 Métriques initialisées: ${totalRecords} records, ${totalPrescriptions} prescriptions`);
    } catch (error) {
      console.error('Erreur initialisation métriques DB:', error);
    }
  }

  // Monitoring périodique
  startPeriodicMonitoring() {
    // Initialiser les compteurs au démarrage
    this.initializeDatabaseCounters();

    setInterval(() => {
      this.calculateSystemMetrics();

      // Émettre les métriques globales
      this.emit('systemHealth', {
        hedera: this.metrics.hedera,
        system: this.metrics.system,
        database: this.metrics.database,
        timestamp: new Date()
      });

    }, 10000); // Toutes les 10 secondes
  }

  // Obtenir toutes les métriques
  getAllMetrics() {
    return {
      ...this.metrics,
      recentLogs: this.requestLog.slice(-100), // 100 dernières entrées
      timestamp: new Date()
    };
  }

  // Obtenir les alertes actives
  getActiveAlerts() {
    const alerts = [];

    // Alert si trop d'échecs Hedera
    const hederaFailureRate = this.metrics.hedera.totalTransactions > 0
      ? (this.metrics.hedera.failedTransactions / this.metrics.hedera.totalTransactions) * 100
      : 0;

    if (hederaFailureRate > 20) {
      alerts.push({
        type: 'warning',
        message: `Taux d'échec Hedera élevé: ${Math.round(hederaFailureRate)}%`,
        timestamp: new Date()
      });
    }

    // Alert si temps de réponse élevé
    if (this.metrics.hedera.averageResponseTime > 10000) {
      alerts.push({
        type: 'warning',
        message: `Temps de réponse Hedera élevé: ${Math.round(this.metrics.hedera.averageResponseTime)}ms`,
        timestamp: new Date()
      });
    }

    // Alert si taux d'erreur système élevé
    if (this.metrics.system.errorRate > 10) {
      alerts.push({
        type: 'error',
        message: `Taux d'erreur système élevé: ${this.metrics.system.errorRate}%`,
        timestamp: new Date()
      });
    }

    return alerts;
  }

  // Reset des métriques (pour les tests)
  resetMetrics() {
    this.metrics = {
      hedera: {
        totalTransactions: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
        simulatedTransactions: 0,
        averageResponseTime: 0,
        lastSuccessTime: null,
        lastFailureTime: null,
        uptime: 100
      },
      system: {
        memoryUsage: 0,
        cpuUsage: 0,
        activeConnections: 0,
        requestsPerMinute: 0,
        errorRate: 0
      },
      database: {
        totalRecords: 0,
        prescriptions: 0,
        verificationRequests: 0,
        averageQueryTime: 0
      }
    };
    this.requestLog = [];
  }
}

module.exports = new MonitoringService();