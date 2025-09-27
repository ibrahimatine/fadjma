const logger = require('../utils/logger');
const { BaseUser } = require('../models');

/**
 * Service de monitoring et alertes de sécurité
 */
class SecurityMonitoringService {
  constructor() {
    this.securityEvents = new Map();
    this.alertThresholds = {
      failedLoginsPerMinute: 10,
      newAccountsPerHour: 5,
      patientCreationsPerHour: 20,
      suspiciousPatternThreshold: 5
    };
  }

  /**
   * Enregistre une tentative de connexion échouée
   */
  logFailedLogin(email, ip, userAgent, reason = 'invalid_credentials') {
    const event = {
      type: 'failed_login',
      email,
      ip,
      userAgent,
      reason,
      timestamp: new Date(),
      severity: 'medium'
    };

    this.recordSecurityEvent(event);

    // Vérifier si l'IP a trop de tentatives échouées
    this.checkFailedLoginThreshold(ip);

    logger.warn('Failed login attempt', event);
  }

  /**
   * Enregistre une connexion réussie
   */
  logSuccessfulLogin(userId, email, ip, userAgent) {
    const event = {
      type: 'successful_login',
      userId,
      email,
      ip,
      userAgent,
      timestamp: new Date(),
      severity: 'low'
    };

    this.recordSecurityEvent(event);

    // Nettoyer les tentatives échouées pour cette IP
    this.clearFailedLogins(ip);

    logger.info('Successful login', event);
  }

  /**
   * Enregistre un verrouillage de compte
   */
  logAccountLockout(userId, email, reason) {
    const event = {
      type: 'account_lockout',
      userId,
      email,
      reason,
      timestamp: new Date(),
      severity: 'high'
    };

    this.recordSecurityEvent(event);
    logger.error('Account locked', event);

    // Envoyer une alerte
    this.sendSecurityAlert('Account Lockout', event);
  }

  /**
   * Enregistre une activité suspecte
   */
  logSuspiciousActivity(userId, activity, details, severity = 'medium') {
    const event = {
      type: 'suspicious_activity',
      userId,
      activity,
      details,
      timestamp: new Date(),
      severity
    };

    this.recordSecurityEvent(event);
    logger.warn('Suspicious activity detected', event);

    if (severity === 'high') {
      this.sendSecurityAlert('Suspicious Activity', event);
    }
  }

  /**
   * Enregistre une escalade de privilèges
   */
  logPrivilegeEscalation(userId, fromRole, toRole, adminId) {
    const event = {
      type: 'privilege_escalation',
      userId,
      fromRole,
      toRole,
      adminId,
      timestamp: new Date(),
      severity: 'high'
    };

    this.recordSecurityEvent(event);
    logger.error('Privilege escalation', event);

    this.sendSecurityAlert('Privilege Escalation', event);
  }

  /**
   * Enregistre la création d'un nouveau compte
   */
  logAccountCreation(userId, email, role, ip, createdBy = null) {
    const event = {
      type: 'account_creation',
      userId,
      email,
      role,
      ip,
      createdBy,
      timestamp: new Date(),
      severity: 'low'
    };

    this.recordSecurityEvent(event);
    logger.info('New account created', event);

    // Vérifier le taux de création de comptes
    this.checkAccountCreationRate(ip);
  }

  /**
   * Enregistre l'accès à des données sensibles
   */
  logSensitiveDataAccess(userId, dataType, resourceId, action = 'read') {
    const event = {
      type: 'sensitive_data_access',
      userId,
      dataType,
      resourceId,
      action,
      timestamp: new Date(),
      severity: 'medium'
    };

    this.recordSecurityEvent(event);
    logger.info('Sensitive data access', event);
  }

  /**
   * Détecte les patterns d'attaque
   */
  detectAttackPatterns(ip, timeWindowMinutes = 60) {
    const since = new Date(Date.now() - (timeWindowMinutes * 60 * 1000));
    const events = this.getEventsForIP(ip, since);

    // Pattern 1: Tentatives de connexion avec différents emails
    const loginAttempts = events.filter(e => e.type === 'failed_login');
    const uniqueEmails = new Set(loginAttempts.map(e => e.email));

    if (uniqueEmails.size > 5 && loginAttempts.length > 10) {
      this.logSuspiciousActivity(null, 'credential_stuffing', {
        ip,
        uniqueEmails: uniqueEmails.size,
        attempts: loginAttempts.length,
        timeWindow: timeWindowMinutes
      }, 'high');
    }

    // Pattern 2: Accès rapide à de nombreuses ressources
    const dataAccess = events.filter(e => e.type === 'sensitive_data_access');
    if (dataAccess.length > 50) {
      this.logSuspiciousActivity(dataAccess[0]?.userId, 'data_scraping', {
        ip,
        accessCount: dataAccess.length,
        timeWindow: timeWindowMinutes
      }, 'high');
    }

    // Pattern 3: Création de comptes en masse
    const accountCreations = events.filter(e => e.type === 'account_creation');
    if (accountCreations.length > this.alertThresholds.newAccountsPerHour) {
      this.logSuspiciousActivity(null, 'mass_registration', {
        ip,
        accountsCreated: accountCreations.length,
        timeWindow: timeWindowMinutes
      }, 'high');
    }
  }

  /**
   * Vérifie le seuil de tentatives de connexion échouées
   */
  checkFailedLoginThreshold(ip) {
    const since = new Date(Date.now() - (60 * 1000)); // Dernière minute
    const failedLogins = this.getEventsForIP(ip, since, 'failed_login');

    if (failedLogins.length >= this.alertThresholds.failedLoginsPerMinute) {
      this.logSuspiciousActivity(null, 'brute_force_attempt', {
        ip,
        attempts: failedLogins.length,
        timeWindow: '1 minute'
      }, 'high');

      // Bloquer temporairement l'IP (implémentation dépendante du proxy/firewall)
      this.blockIP(ip, 15); // 15 minutes
    }
  }

  /**
   * Vérifie le taux de création de comptes
   */
  checkAccountCreationRate(ip) {
    const since = new Date(Date.now() - (60 * 60 * 1000)); // Dernière heure
    const creations = this.getEventsForIP(ip, since, 'account_creation');

    if (creations.length >= this.alertThresholds.newAccountsPerHour) {
      this.logSuspiciousActivity(null, 'excessive_account_creation', {
        ip,
        accounts: creations.length,
        timeWindow: '1 hour'
      }, 'medium');
    }
  }

  /**
   * Enregistre un événement de sécurité
   */
  recordSecurityEvent(event) {
    const key = `${event.type}_${Date.now()}_${Math.random()}`;
    this.securityEvents.set(key, event);

    // Nettoyer les événements anciens (garder seulement les 24 dernières heures)
    this.cleanupOldEvents();
  }

  /**
   * Récupère les événements pour une IP donnée
   */
  getEventsForIP(ip, since = null, type = null) {
    const events = Array.from(this.securityEvents.values());
    return events.filter(event => {
      if (event.ip !== ip) return false;
      if (since && event.timestamp < since) return false;
      if (type && event.type !== type) return false;
      return true;
    });
  }

  /**
   * Nettoie les événements anciens
   */
  cleanupOldEvents() {
    const oneDayAgo = new Date(Date.now() - (24 * 60 * 60 * 1000));

    for (const [key, event] of this.securityEvents.entries()) {
      if (event.timestamp < oneDayAgo) {
        this.securityEvents.delete(key);
      }
    }
  }

  /**
   * Efface les tentatives de connexion échouées pour une IP
   */
  clearFailedLogins(ip) {
    for (const [key, event] of this.securityEvents.entries()) {
      if (event.ip === ip && event.type === 'failed_login') {
        this.securityEvents.delete(key);
      }
    }
  }

  /**
   * Bloque temporairement une IP (interface pour système externe)
   */
  blockIP(ip, durationMinutes) {
    logger.error('IP blocked due to suspicious activity', {
      ip,
      duration: durationMinutes,
      reason: 'Excessive failed login attempts'
    });

    // Ici on pourrait intégrer avec un système de firewall
    // ou maintenir une liste noire temporaire
  }

  /**
   * Envoie une alerte de sécurité
   */
  sendSecurityAlert(title, event) {
    const alert = {
      title,
      event,
      timestamp: new Date(),
      severity: event.severity
    };

    logger.error('SECURITY ALERT', alert);

    // Ici on pourrait intégrer avec un système d'alertes
    // (email, Slack, webhooks, etc.)
  }

  /**
   * Génère un rapport de sécurité
   */
  generateSecurityReport(hours = 24) {
    const since = new Date(Date.now() - (hours * 60 * 60 * 1000));
    const events = Array.from(this.securityEvents.values())
      .filter(e => e.timestamp >= since);

    const report = {
      period: `Last ${hours} hours`,
      totalEvents: events.length,
      eventsByType: {},
      eventsBySeverity: {},
      topIPs: {},
      timeline: []
    };

    // Compter les événements par type
    events.forEach(event => {
      report.eventsByType[event.type] = (report.eventsByType[event.type] || 0) + 1;
      report.eventsBySeverity[event.severity] = (report.eventsBySeverity[event.severity] || 0) + 1;

      if (event.ip) {
        report.topIPs[event.ip] = (report.topIPs[event.ip] || 0) + 1;
      }
    });

    return report;
  }

  /**
   * Vérifie la santé de la sécurité
   */
  getSecurityHealth() {
    const report = this.generateSecurityReport(1); // Dernière heure

    const health = {
      status: 'healthy',
      score: 100,
      issues: [],
      recommendations: []
    };

    // Vérifier les événements de haute sévérité
    if (report.eventsBySeverity.high > 0) {
      health.status = 'critical';
      health.score -= 50;
      health.issues.push(`${report.eventsBySeverity.high} high severity security events in the last hour`);
    }

    // Vérifier les tentatives de connexion échouées
    if (report.eventsByType.failed_login > 20) {
      health.status = health.status === 'healthy' ? 'warning' : health.status;
      health.score -= 20;
      health.issues.push(`High number of failed login attempts: ${report.eventsByType.failed_login}`);
      health.recommendations.push('Consider implementing additional rate limiting');
    }

    return health;
  }
}

module.exports = new SecurityMonitoringService();