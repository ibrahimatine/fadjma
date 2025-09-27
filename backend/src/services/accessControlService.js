const { BaseUser, MedicalRecordAccessRequest } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Service pour gérer le contrôle d'accès aux données patients
 */
class AccessControlService {
  /**
   * Vérifie si un docteur a accès à un patient donné
   * @param {string} doctorId - ID du docteur
   * @param {string} patientId - ID du patient
   * @returns {Promise<boolean>}
   */
  static async doctorHasAccessToPatient(doctorId, patientId) {
    try {
      // Vérifier l'accès via demande d'accès approuvée
      const hasAccessViaRequest = await MedicalRecordAccessRequest.findOne({
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

      if (hasAccessViaRequest) {
        return true;
      }

      // Vérifier l'accès via création du patient
      const hasAccessViaCreation = await BaseUser.findOne({
        where: {
          id: patientId,
          createdByDoctorId: doctorId,
          role: 'patient'
        }
      });

      return !!hasAccessViaCreation;
    } catch (error) {
      logger.error('Error checking doctor access to patient:', error);
      return false;
    }
  }

  /**
   * Récupère tous les patients accessibles par un docteur
   * @param {string} doctorId - ID du docteur
   * @returns {Promise<Array>}
   */
  static async getAccessiblePatientsForDoctor(doctorId) {
    try {
      // Patients créés par le docteur
      const createdPatients = await BaseUser.findAll({
        where: {
          role: 'patient',
          createdByDoctorId: doctorId,
          isActive: true
        },
        attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'createdAt']
      });

      // Patients avec accès approuvé
      const accessibleViaRequests = await MedicalRecordAccessRequest.findAll({
        where: {
          requesterId: doctorId,
          status: 'approved',
          [Op.or]: [
            { expiresAt: null },
            { expiresAt: { [Op.gt]: new Date() } }
          ]
        },
        include: [{
          model: BaseUser,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'createdAt']
        }]
      });

      const patientsFromRequests = accessibleViaRequests.map(access => access.patient);

      // Combiner et dédupliquer
      const allPatients = [...createdPatients];
      patientsFromRequests.forEach(reqPatient => {
        if (!allPatients.find(p => p.id === reqPatient.id)) {
          allPatients.push(reqPatient);
        }
      });

      return allPatients.sort((a, b) => a.lastName.localeCompare(b.lastName));
    } catch (error) {
      logger.error('Error getting accessible patients for doctor:', error);
      throw error;
    }
  }

  /**
   * Construit les conditions WHERE pour filtrer les enregistrements selon le rôle
   * @param {Object} user - Utilisateur connecté
   * @param {string} patientId - ID patient optionnel
   * @returns {Promise<Object>}
   */
  static async buildRecordAccessConditions(user, patientId = null) {
    const where = {};

    switch (user.role) {
      case 'patient':
        where.patientId = user.id;
        break;

      case 'doctor':
        if (patientId) {
          const hasAccess = await this.doctorHasAccessToPatient(user.id, patientId);
          if (hasAccess) {
            where.patientId = patientId;
          } else {
            // Retourner une condition impossible pour éviter les résultats
            where.id = null;
          }
        } else {
          // Récupérer tous les patients accessibles
          const accessiblePatients = await this.getAccessiblePatientsForDoctor(user.id);
          const patientIds = accessiblePatients.map(p => p.id);

          if (patientIds.length > 0) {
            where.patientId = { [Op.in]: patientIds };
          } else {
            where.id = null; // Aucun patient accessible
          }
        }
        break;

      case 'admin':
        // Les admins peuvent voir tous les enregistrements
        if (patientId) {
          where.patientId = patientId;
        }
        break;

      default:
        // Rôles non autorisés
        where.id = null;
    }

    return where;
  }

  /**
   * Vérifie si un utilisateur peut accéder à une ressource spécifique
   * @param {Object} user - Utilisateur connecté
   * @param {string} resourceType - Type de ressource (patient, record, etc.)
   * @param {string} resourceId - ID de la ressource
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<boolean>}
   */
  static async canAccessResource(user, resourceType, resourceId, options = {}) {
    try {
      switch (resourceType) {
        case 'patient':
          if (user.role === 'patient') {
            return user.id === resourceId;
          } else if (user.role === 'doctor') {
            return await this.doctorHasAccessToPatient(user.id, resourceId);
          } else if (user.role === 'admin') {
            return true;
          }
          return false;

        case 'medical_record':
          // Pour un dossier médical, vérifier l'accès au patient propriétaire
          const record = await require('../models').MedicalRecord.findByPk(resourceId);
          if (!record) return false;
          return await this.canAccessResource(user, 'patient', record.patientId, options);

        default:
          logger.warn(`Unknown resource type: ${resourceType}`);
          return false;
      }
    } catch (error) {
      logger.error('Error checking resource access:', error);
      return false;
    }
  }

  /**
   * Filtre une liste de ressources selon les autorisations de l'utilisateur
   * @param {Object} user - Utilisateur connecté
   * @param {Array} resources - Liste des ressources
   * @param {string} resourceType - Type de ressource
   * @returns {Promise<Array>}
   */
  static async filterAccessibleResources(user, resources, resourceType) {
    const accessibleResources = [];

    for (const resource of resources) {
      const canAccess = await this.canAccessResource(user, resourceType, resource.id);
      if (canAccess) {
        accessibleResources.push(resource);
      }
    }

    return accessibleResources;
  }
}

module.exports = AccessControlService;