const crypto = require('crypto');
const { BaseUser } = require('../models');
const logger = require('../utils/logger');

/**
 * Service for generating and managing patient identifiers for unclaimed profiles
 */
class PatientIdentifierService {

  /**
   * Generates a unique patient identifier
   * Format: PAT-YYYYMMDD-XXXX (PAT-20241201-A7B9)
   * @returns {string} Unique patient identifier
   */
  static async generateUniqueIdentifier() {
    const maxAttempts = 10;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const identifier = this.generateIdentifier();

      // Check if identifier already exists
      const existing = await BaseUser.findOne({
        where: { patientIdentifier: identifier }
      });

      if (!existing) {
        return identifier;
      }

      attempts++;
    }

    throw new Error('Unable to generate unique patient identifier after maximum attempts');
  }

  /**
   * Generates a patient identifier
   * @returns {string} Patient identifier in format PAT-YYYYMMDD-XXXX
   */
  static generateIdentifier() {
    const now = new Date();
    const dateStr = now.getFullYear().toString() +
                   (now.getMonth() + 1).toString().padStart(2, '0') +
                   now.getDate().toString().padStart(2, '0');

    // Generate 4-character random suffix using alphanumeric characters
    const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();

    return `PAT-${dateStr}-${suffix}`;
  }

  /**
   * Validates patient identifier format
   * @param {string} identifier - Patient identifier to validate
   * @returns {boolean} True if format is valid
   */
  static isValidFormat(identifier) {
    return /^PAT-\d{8}-[A-F0-9]{4}$/.test(identifier);
  }

  /**
   * Finds a patient by their identifier
   * @param {string} identifier - Patient identifier
   * @returns {Object|null} Patient object or null if not found
   */
  static async findPatientByIdentifier(identifier) {
    if (!this.isValidFormat(identifier)) {
      return null;
    }

    try {
      const patient = await BaseUser.findOne({
        where: {
          patientIdentifier: identifier,
          role: 'patient'
        },
        attributes: [
          'id', 'firstName', 'lastName', 'email', 'isUnclaimed',
          'patientIdentifier', 'createdByDoctorId', 'dateOfBirth',
          'gender', 'phoneNumber', 'address', 'emergencyContactName',
          'emergencyContactPhone', 'socialSecurityNumber', 'createdAt'
        ]
      });

      return patient;
    } catch (error) {
      logger.error('Error finding patient by identifier:', error);
      return null;
    }
  }

  /**
   * Links a patient identifier to an existing user account
   * @param {string} identifier - Patient identifier
   * @param {Object} userData - User credentials and info
   * @returns {Object} Updated patient object
   */
  static async linkIdentifierToAccount(identifier, userData) {
    const { email, password, ...additionalData } = userData;

    if (!this.isValidFormat(identifier)) {
      throw new Error('Invalid patient identifier format');
    }

    // Find unclaimed patient profile
    const patient = await BaseUser.findOne({
      where: {
        patientIdentifier: identifier,
        role: 'patient',
        isUnclaimed: true
      }
    });

    if (!patient) {
      throw new Error('Patient identifier not found or already claimed');
    }

    // Check if email is already in use
    if (email) {
      const existingUser = await BaseUser.findOne({
        where: { email }
      });

      if (existingUser && existingUser.id !== patient.id) {
        throw new Error('Email address is already in use');
      }
    }

    // Update patient with credentials and mark as claimed
    await patient.update({
      email,
      password, // Will be hashed by the beforeUpdate hook
      isUnclaimed: false,
      ...additionalData
    });

    logger.info(`Patient identifier ${identifier} successfully linked to account`, {
      patientId: patient.id,
      email
    });

    return patient;
  }

  /**
   * Creates an unclaimed patient profile
   * @param {Object} patientData - Patient information
   * @param {string} doctorId - ID of the doctor creating the profile
   * @returns {Object} Created patient with identifier
   */
  static async createUnclaimedPatient(patientData, doctorId) {
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phoneNumber,
      address,
      emergencyContactName,
      emergencyContactPhone,
      socialSecurityNumber
    } = patientData;

    const identifier = await this.generateUniqueIdentifier();

    const patient = await BaseUser.create({
      firstName,
      lastName,
      role: 'patient',
      isUnclaimed: true,
      patientIdentifier: identifier,
      createdByDoctorId: doctorId,
      dateOfBirth,
      gender,
      phoneNumber,
      address,
      emergencyContactName,
      emergencyContactPhone,
      socialSecurityNumber
    });

    logger.info(`Unclaimed patient profile created with identifier ${identifier}`, {
      patientId: patient.id,
      doctorId,
      firstName,
      lastName
    });

    return patient;
  }

  /**
   * Gets unclaimed patients created by a specific doctor
   * @param {string} doctorId - Doctor's ID
   * @param {Object} options - Query options (limit, offset, search)
   * @returns {Object} Patients list with pagination
   */
  static async getUnclaimedPatientsByDoctor(doctorId, options = {}) {
    const { limit = 20, offset = 0, search } = options;

    const where = {
      createdByDoctorId: doctorId,
      isUnclaimed: true,
      role: 'patient'
    };

    if (search) {
      const { Op } = require('sequelize');
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { patientIdentifier: { [Op.iLike]: `%${search}%` } }
      ];
    }

    try {
      const result = await BaseUser.findAndCountAll({
        where,
        attributes: [
          'id', 'firstName', 'lastName', 'patientIdentifier',
          'dateOfBirth', 'gender', 'phoneNumber', 'createdAt'
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });

      return {
        patients: result.rows,
        total: result.count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      };
    } catch (error) {
      logger.error('Error getting unclaimed patients by doctor:', error);
      throw error;
    }
  }

  /**
   * Extracts creation date from patient identifier
   * @param {string} identifier - Patient identifier
   * @returns {Date|null} Creation date or null if invalid
   */
  static extractCreationDate(identifier) {
    try {
      if (!this.isValidFormat(identifier)) {
        return null;
      }

      const dateStr = identifier.split('-')[1];
      const year = parseInt(dateStr.slice(0, 4));
      const month = parseInt(dateStr.slice(4, 6)) - 1; // Months start at 0
      const day = parseInt(dateStr.slice(6, 8));

      return new Date(year, month, day);
    } catch (error) {
      logger.warn('Unable to extract date from patient identifier:', { identifier, error: error.message });
      return null;
    }
  }

  /**
   * Formats patient information for display to doctor
   * @param {Object} patient - Patient object
   * @returns {Object} Formatted patient information
   */
  static formatPatientForDoctor(patient) {
    return {
      id: patient.id,
      identifier: patient.patientIdentifier,
      fullName: `${patient.firstName} ${patient.lastName}`,
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      phoneNumber: patient.phoneNumber,
      isUnclaimed: patient.isUnclaimed,
      createdAt: patient.createdAt,
      displayText: `Identifiant patient: ${patient.patientIdentifier}`,
      instructions: [
        "Communiquez cet identifiant au patient",
        "Le patient l'utilisera pour créer son compte",
        "Une fois lié, vous aurez accès automatique au dossier"
      ]
    };
  }
}

module.exports = PatientIdentifierService;