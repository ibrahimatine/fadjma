const crypto = require('crypto');

/**
 * Configuration de sécurité centralisée
 */
class SecurityConfig {
  /**
   * Configuration JWT
   */
  static getJWTConfig() {
    const secret = process.env.JWT_SECRET;

    if (!secret || secret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long');
    }

    return {
      secret,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      issuer: process.env.JWT_ISSUER || 'fadjma-api',
      audience: process.env.JWT_AUDIENCE || 'fadjma-frontend',
      algorithm: 'HS256'
    };
  }

  /**
   * Configuration des mots de passe
   */
  static getPasswordConfig() {
    return {
      minLength: 8,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      saltRounds: 12, // bcrypt salt rounds
      maxAttempts: 5, // Nombre max de tentatives de connexion
      lockoutDuration: 15 * 60 * 1000 // 15 minutes en ms
    };
  }

  /**
   * Configuration Rate Limiting
   */
  static getRateLimitConfig() {
    return {
      login: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // 5 tentatives par IP
        skipSuccessfulRequests: true
      },
      register: {
        windowMs: 60 * 60 * 1000, // 1 heure
        max: 3, // 3 inscriptions par IP par heure
        skipSuccessfulRequests: true
      },
      api: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000, // 1000 requêtes par IP
        skipSuccessfulRequests: true
      },
      patientCreation: {
        windowMs: 60 * 60 * 1000, // 1 heure
        max: 10, // 10 créations par utilisateur par heure
        skipSuccessfulRequests: true
      }
    };
  }

  /**
   * Configuration CORS
   */
  static getCORSConfig() {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'https://localhost:3000'
    ];

    return {
      origin: (origin, callback) => {
        // Autoriser les requêtes sans origin (applications mobiles, Postman, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'Cache-Control'
      ],
      exposedHeaders: ['X-Total-Count'],
      maxAge: 86400 // 24 heures
    };
  }

  /**
   * Configuration Helmet (sécurité HTTP)
   */
  static getHelmetConfig() {
    return {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      },
      crossOriginEmbedderPolicy: false, // Désactivé pour les API
      hsts: {
        maxAge: 31536000, // 1 an
        includeSubDomains: true,
        preload: true
      },
      noSniff: true,
      frameguard: { action: 'deny' },
      xssFilter: true
    };
  }

  /**
   * Configuration de session (si utilisée)
   */
  static getSessionConfig() {
    const secret = process.env.SESSION_SECRET;

    if (!secret || secret.length < 32) {
      throw new Error('SESSION_SECRET must be at least 32 characters long');
    }

    return {
      secret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS en production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 heures
        sameSite: 'strict'
      },
      name: 'fadjma_session'
    };
  }

  /**
   * Configuration de validation des données
   */
  static getValidationConfig() {
    return {
      maxRequestSize: '10mb',
      maxFileSize: '5mb',
      allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
      maxFilesPerRequest: 5,
      sanitizeStrings: true,
      trimStrings: true,
      allowEmptyStrings: false
    };
  }

  /**
   * Configuration de logging de sécurité
   */
  static getSecurityLoggingConfig() {
    return {
      logFailedLogins: true,
      logAccountLockouts: true,
      logSuspiciousActivity: true,
      logPrivilegeEscalation: true,
      alertThresholds: {
        failedLoginsPerMinute: 10,
        newAccountsPerHour: 5,
        patientCreationsPerHour: 20
      }
    };
  }

  /**
   * Génère une clé secrète sécurisée
   */
  static generateSecretKey(length = 64) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Valide la configuration de sécurité
   */
  static validateSecurityConfig() {
    const errors = [];

    // Vérifier JWT_SECRET
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters long');
    }

    // Vérifier NODE_ENV
    if (!process.env.NODE_ENV) {
      errors.push('NODE_ENV must be set (development, production, test)');
    }

    // Vérifier FRONTEND_URL en production
    if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
      errors.push('FRONTEND_URL must be set in production');
    }

    if (errors.length > 0) {
      throw new Error(`Security configuration errors:\n- ${errors.join('\n- ')}`);
    }

    return true;
  }

  /**
   * Configuration de chiffrement pour les données sensibles
   */
  static getEncryptionConfig() {
    const encryptionKey = process.env.ENCRYPTION_KEY;

    if (!encryptionKey || encryptionKey.length !== 64) {
      throw new Error('ENCRYPTION_KEY must be exactly 64 characters (32 bytes hex)');
    }

    return {
      algorithm: 'aes-256-gcm',
      key: Buffer.from(encryptionKey, 'hex'),
      ivLength: 12, // GCM recommande 12 bytes
      tagLength: 16
    };
  }
}

module.exports = SecurityConfig;