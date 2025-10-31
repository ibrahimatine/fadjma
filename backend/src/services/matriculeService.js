const logger = require('../utils/logger');

/**
 * Service pour gérer l'affichage et la transmission sécurisée des matricules
 */
class MatriculeService {

  /**
   * Génère des informations de transmission du matricule pour le médecin/patient
   * @param {Object} prescription - La prescription avec le matricule
   * @param {string} userRole - Le rôle de l'utilisateur (doctor, patient)
   * @returns {Object} Informations formatées pour l'affichage
   */
  static formatMatriculeForUser(prescription, userRole) {
    if (!prescription.matricule) {
      throw new Error('Matricule manquant pour la prescription');
    }

    const matricule = prescription.matricule;

    // Informations de base
    const info = {
      matricule,
      displayText: `Matricule: ${matricule}`,
      instructions: {
        fr: [
          "Communiquez ce matricule à votre pharmacien",
          "Le pharmacien utilisera ce code pour accéder à votre ordonnance",
          "Gardez ce matricule confidentiel"
        ],
        en: [
          "Share this reference number with your pharmacist",
          "The pharmacist will use this code to access your prescription",
          "Keep this reference number confidential"
        ]
      },
      qrCode: null, // Peut être ajouté plus tard
      expirationDate: prescription.issueDate ? new Date(new Date(prescription.issueDate).getTime() + (30 * 24 * 60 * 60 * 1000)) : null // 30 jours
    };

    // Informations spécifiques au rôle
    if (userRole === 'doctor') {
      info.context = "Transmettez ce matricule à votre patient";
      info.sharing = {
        methods: [
          "Affichage sur l'écran",
          "Impression sur l'ordonnance",
          "Envoi sécurisé par email/SMS"
        ]
      };
    } else if (userRole === 'patient') {
      info.context = "Présentez ce matricule à votre pharmacien";
      info.sharing = {
        methods: [
          "Montrez ce code au pharmacien",
          "Dictez le matricule au téléphone si nécessaire",
          "Screenshot de cet écran"
        ]
      };
    }

    return info;
  }

  /**
   * Valide l'accès d'un utilisateur à un matricule
   * @param {string} matricule - Le matricule demandé
   * @param {Object} user - L'utilisateur qui fait la demande
   * @param {Object} prescription - La prescription associée
   * @returns {boolean} True si l'accès est autorisé
   */
  static validateAccess(matricule, user, prescription) {
    try {
      // Validation de base
      if (!matricule || !user || !prescription) {
        return false;
      }

      // Seuls les médecins, patients concernés et pharmacies peuvent accéder
      switch (user.role) {
        case 'doctor':
          return prescription.doctorId === user.id;

        case 'patient':
          return prescription.patientId === user.id;

        case 'pharmacy':
          // Les pharmacies peuvent accéder à toutes les prescriptions
          // La sécurité supplémentaire est gérée par les middlewares
          return true;

        default:
          return false;
      }
    } catch (error) {
      logger.error('Erreur lors de la validation de l\'accès au matricule:', error);
      return false;
    }
  }

  /**
   * Génère un QR Code pour le matricule (optionnel)
   * @param {string} matricule - Le matricule à encoder
   * @returns {string|null} URL du QR Code ou null si non disponible
   */
  static generateQRCode(matricule) {
    try {
      // Implémentation future avec une bibliothèque QR Code
      // Pour l'instant, retourne une URL factice
      const data = encodeURIComponent(matricule);
      return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${data}`;
    } catch (error) {
      logger.error('Erreur lors de la génération du QR Code:', error);
      return null;
    }
  }

  /**
   * Journalise l'accès à un matricule
   * @param {string} matricule - Le matricule accédé
   * @param {Object} user - L'utilisateur qui accède
   * @param {string} action - L'action effectuée (view, share, etc.)
   * @param {Object} context - Contexte supplémentaire
   */
  static logAccess(matricule, user, action = 'view', context = {}) {
    logger.info(`Accès au matricule ${matricule}`, {
      matricule,
      userId: user.id,
      userRole: user.role,
      action,
      context,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Masque partiellement un matricule pour l'affichage public
   * @param {string} matricule - Le matricule complet
   * @returns {string} Matricule masqué
   */
  static maskMatricule(matricule) {
    if (!matricule || matricule.length < 10) {
      return 'PRX-****-****';
    }

    // Masquer la partie centrale : PRX-20240125-A1B2 -> PRX-****-**B2
    const parts = matricule.split('-');
    if (parts.length === 3) {
      return `${parts[0]}-****-**${parts[2].slice(-2)}`;
    }

    return 'PRX-****-****';
  }

  /**
   * Valide le format d'un matricule
   * @param {string} matricule - Le matricule à valider
   * @returns {boolean} True si le format est valide
   */
  static isValidFormat(matricule) {
    return /^PRX-\d{8}-[A-F0-9]{8}$/.test(matricule);
  }

  /**
   * Extrait la date de création depuis le matricule
   * @param {string} matricule - Le matricule
   * @returns {Date|null} Date de création ou null si invalide
   */
  static extractCreationDate(matricule) {
    try {
      if (!this.isValidFormat(matricule)) {
        return null;
      }

      const dateStr = matricule.split('-')[1];
      const year = parseInt(dateStr.slice(0, 4));
      const month = parseInt(dateStr.slice(4, 6)) - 1; // Les mois commencent à 0
      const day = parseInt(dateStr.slice(6, 8));

      return new Date(year, month, day);
    } catch (error) {
      logger.warn('Impossible d\'extraire la date du matricule:', { matricule, error: error.message });
      return null;
    }
  }
}

module.exports = MatriculeService;