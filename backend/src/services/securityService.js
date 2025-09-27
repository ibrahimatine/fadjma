const { BaseUser, MedicalRecordAccessRequest } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * Service for handling security measures and access controls for patient identifiers
 */
class SecurityService {

  /**
   * Validates doctor's permission to create unclaimed patients
   * @param {string} doctorId - Doctor's ID
   * @returns {boolean} True if doctor can create unclaimed patients
   */
  static async canDoctorCreateUnclaimedPatients(doctorId) {
    try {
      const doctor = await BaseUser.findOne({
        where: {
          id: doctorId,
          role: 'doctor',
          isActive: true,
          isUnclaimed: false // Doctors must have completed accounts
        }
      });

      return !!doctor;
    } catch (error) {
      logger.error('Error checking doctor permissions:', error);
      return false;
    }
  }

  /**
   * Validates patient identifier format and prevents abuse
   * @param {string} identifier - Patient identifier to validate
   * @returns {Object} Validation result
   */
  static validatePatientIdentifier(identifier) {
    const result = {
      valid: false,
      error: null
    };

    // Check format
    if (!/^PAT-\d{8}-[A-F0-9]{4}$/.test(identifier)) {
      result.error = 'Invalid identifier format';
      return result;
    }

    // Extract date
    const dateStr = identifier.split('-')[1];
    const year = parseInt(dateStr.slice(0, 4));
    const month = parseInt(dateStr.slice(4, 6));
    const day = parseInt(dateStr.slice(6, 8));
    const identifierDate = new Date(year, month - 1, day);

    // Check if date is reasonable (not in future, not too old)
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

    if (identifierDate > now) {
      result.error = 'Invalid identifier date (future date)';
      return result;
    }

    if (identifierDate < oneYearAgo) {
      result.error = 'Identifier too old (more than 1 year)';
      return result;
    }

    result.valid = true;
    return result;
  }

  /**
   * Prevents duplicate identifier linking attempts
   * @param {string} identifier - Patient identifier
   * @param {string} email - Email attempting to link
   * @returns {Object} Check result
   */
  static async checkIdentifierLinkingEligibility(identifier, email) {
    try {
      // Check if identifier exists and is unclaimed
      const patient = await BaseUser.findOne({
        where: {
          patientIdentifier: identifier,
          role: 'patient'
        }
      });

      if (!patient) {
        return {
          eligible: false,
          error: 'Patient identifier not found'
        };
      }

      if (!patient.isUnclaimed) {
        return {
          eligible: false,
          error: 'This identifier has already been used to create an account'
        };
      }

      // Check if email is already in use
      if (email) {
        const existingUser = await BaseUser.findOne({
          where: { email }
        });

        if (existingUser && existingUser.id !== patient.id) {
          return {
            eligible: false,
            error: 'Email address is already in use'
          };
        }
      }

      return {
        eligible: true,
        patient
      };
    } catch (error) {
      logger.error('Error checking identifier linking eligibility:', error);
      return {
        eligible: false,
        error: 'Server error'
      };
    }
  }

  /**
   * Logs security events for audit purposes
   * @param {string} event - Event type
   * @param {Object} details - Event details
   */
  static logSecurityEvent(event, details) {
    logger.info(`Security Event: ${event}`, {
      event,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  /**
   * Rate limiting for identifier verification attempts
   * @param {string} identifier - Patient identifier
   * @param {string} ip - Client IP address
   * @returns {boolean} True if allowed
   */
  static async checkRateLimit(identifier, ip) {
    // In a production environment, this would use Redis or a similar store
    // For now, we'll implement a simple in-memory rate limiter
    const key = `${identifier}:${ip}`;
    const maxAttempts = 5;
    const windowMs = 15 * 60 * 1000; // 15 minutes

    if (!SecurityService.rateLimitStore) {
      SecurityService.rateLimitStore = new Map();
    }

    const now = Date.now();
    const attempts = SecurityService.rateLimitStore.get(key) || [];

    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(time => now - time < windowMs);

    if (recentAttempts.length >= maxAttempts) {
      this.logSecurityEvent('RATE_LIMIT_EXCEEDED', {
        identifier,
        ip,
        attempts: recentAttempts.length
      });
      return false;
    }

    // Add current attempt
    recentAttempts.push(now);
    SecurityService.rateLimitStore.set(key, recentAttempts);

    return true;
  }

  /**
   * Validates doctor access to patient records for unclaimed patients
   * @param {string} doctorId - Doctor's ID
   * @param {string} patientId - Patient's ID
   * @returns {boolean} True if doctor has access
   */
  static async validateDoctorAccessToUnclaimedPatient(doctorId, patientId) {
    try {
      const patient = await BaseUser.findByPk(patientId);

      if (!patient || patient.role !== 'patient') {
        return false;
      }

      // If patient is unclaimed, check if doctor created the profile
      if (patient.isUnclaimed) {
        return patient.createdByDoctorId === doctorId;
      }

      // For claimed patients, check access requests
      const accessRequest = await MedicalRecordAccessRequest.findOne({
        where: {
          patientId,
          requesterId: doctorId,
          status: 'approved',
          [Op.or]: [
            { expiresAt: null },
            { expiresAt: { [Op.gt]: new Date() } }
          ]
        }
      });

      return !!accessRequest;
    } catch (error) {
      logger.error('Error validating doctor access to unclaimed patient:', error);
      return false;
    }
  }

  /**
   * Sanitizes patient data for display
   * @param {Object} patient - Patient object
   * @param {string} viewerRole - Role of the viewer
   * @returns {Object} Sanitized patient data
   */
  static sanitizePatientData(patient, viewerRole) {
    const sanitized = {
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      isUnclaimed: patient.isUnclaimed
    };

    // Only show sensitive data to authorized viewers
    if (viewerRole === 'doctor' || viewerRole === 'admin') {
      sanitized.dateOfBirth = patient.dateOfBirth;
      sanitized.gender = patient.gender;
      sanitized.phoneNumber = patient.phoneNumber;

      if (patient.isUnclaimed) {
        sanitized.patientIdentifier = patient.patientIdentifier;
        sanitized.createdByDoctorId = patient.createdByDoctorId;
      }
    }

    // Never expose these fields
    delete sanitized.password;
    delete sanitized.socialSecurityNumber;

    return sanitized;
  }

  /**
   * Validates secure identifier transmission
   * @param {string} identifier - Patient identifier
   * @param {Object} context - Transmission context
   * @returns {Object} Validation result
   */
  static validateSecureTransmission(identifier, context) {
    const { method, doctorId, patientId } = context;

    // Log transmission attempt
    this.logSecurityEvent('IDENTIFIER_TRANSMISSION', {
      identifier: identifier.replace(/(.{3})(.{8})(.{4})/, '$1-****-$3'), // Mask middle part
      method,
      doctorId,
      patientId
    });

    // Validate transmission method
    const allowedMethods = ['display', 'print', 'secure_message'];
    if (!allowedMethods.includes(method)) {
      return {
        valid: false,
        error: 'Invalid transmission method'
      };
    }

    return {
      valid: true
    };
  }

  /**
   * Checks for suspicious activity patterns
   * @param {Object} activity - Activity details
   * @returns {boolean} True if suspicious
   */
  static detectSuspiciousActivity(activity) {
    const {
      userId,
      action,
      patientIdentifier,
      ip,
      userAgent,
      timestamp
    } = activity;

    // Implement suspicious activity detection logic
    // This is a placeholder for more sophisticated detection
    const suspiciousPatterns = [
      // Multiple rapid identifier verification attempts
      'RAPID_IDENTIFIER_CHECKS',
      // Attempts to link multiple identifiers to same email
      'MULTIPLE_IDENTIFIER_LINKING',
      // Unusual access patterns
      'UNUSUAL_ACCESS_PATTERN'
    ];

    // For now, just log the activity
    this.logSecurityEvent('ACTIVITY_CHECK', {
      userId,
      action,
      ip,
      timestamp,
      suspicious: false
    });

    return false; // Not suspicious for now
  }

  /**
   * Cleans up expired unclaimed patient profiles
   * @param {number} daysOld - Number of days after which to clean up
   * @returns {number} Number of profiles cleaned up
   */
  static async cleanupExpiredUnclaimedPatients(daysOld = 365) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const expiredPatients = await BaseUser.destroy({
        where: {
          role: 'patient',
          isUnclaimed: true,
          createdAt: {
            [Op.lt]: cutoffDate
          }
        }
      });

      this.logSecurityEvent('CLEANUP_EXPIRED_UNCLAIMED', {
        deletedCount: expiredPatients,
        cutoffDate: cutoffDate.toISOString()
      });

      return expiredPatients;
    } catch (error) {
      logger.error('Error cleaning up expired unclaimed patients:', error);
      return 0;
    }
  }
}

// Initialize rate limit store
SecurityService.rateLimitStore = new Map();

module.exports = SecurityService;