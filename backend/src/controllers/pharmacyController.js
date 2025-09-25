const { Prescription, BaseUser } = require('../models');
const hederaService = require('../services/hederaService');
const matriculeService = require('../services/matriculeService');
const logger = require('../utils/logger');

exports.getPharmacyPrescriptions = async (req, res) => {
  try {
    const { id: pharmacyId } = req.user; // Assuming req.user is populated by auth middleware

    const prescriptions = await Prescription.findAll({
      where: { pharmacyId },
      include: [
        { model: BaseUser, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: BaseUser, as: 'doctor', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
      order: [['issueDate', 'DESC']],
    });

    res.status(200).json(prescriptions);
  } catch (error) {
    logger.error('Error fetching pharmacy prescriptions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getPrescriptionByMatricule = async (req, res) => {
  try {
    const { matricule } = req.params;
    const { id: pharmacyId } = req.user;

    // Validation du format du matricule
    if (!matricule || !/^PRX-\d{8}-[A-F0-9]{4}$/.test(matricule)) {
      return res.status(400).json({
        message: 'Format de matricule invalide. Format attendu: PRX-YYYYMMDD-XXXX'
      });
    }

    // Rechercher la prescription par matricule
    const prescription = await Prescription.findOne({
      where: { matricule },
      include: [
        {
          model: BaseUser,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: BaseUser,
          as: 'doctor',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
      ],
    });

    if (!prescription) {
      return res.status(404).json({
        message: 'Aucune prescription trouvée avec ce matricule'
      });
    }

    // Gestion spéciale pour SQLite: générer un matricule si manquant
    if (!prescription.matricule) {
      logger.warn(`Prescription ${prescription.id} trouvée sans matricule. Génération en cours...`);

      // Générer un matricule pour cette prescription
      const crypto = require('crypto');
      let newMatricule;
      let exists = true;

      while (exists) {
        const date = prescription.issueDate
          ? new Date(prescription.issueDate).toISOString().slice(0, 10).replace(/-/g, '')
          : new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const random = crypto.randomBytes(2).toString('hex').toUpperCase();
        newMatricule = `PRX-${date}-${random}`;

        const existing = await Prescription.findOne({ where: { matricule: newMatricule } });
        exists = !!existing;
      }

      prescription.matricule = newMatricule;
      await prescription.save();

      logger.info(`Matricule ${newMatricule} généré pour la prescription ${prescription.id}`);
    }

    // Vérifications de sécurité
    if (prescription.deliveryStatus === 'delivered') {
      return res.status(409).json({
        message: 'Cette prescription a already été délivrée',
        prescription: {
          id: prescription.id,
          matricule: prescription.matricule,
          deliveryStatus: prescription.deliveryStatus,
          deliveryConfirmationHash: prescription.deliveryConfirmationHash
        }
      });
    }

    if (prescription.deliveryStatus === 'cancelled') {
      return res.status(409).json({
        message: 'Cette prescription a été annulée',
        prescription: {
          id: prescription.id,
          matricule: prescription.matricule,
          deliveryStatus: prescription.deliveryStatus
        }
      });
    }

    // Assigner la pharmacie si pas encore assignée
    if (!prescription.pharmacyId) {
      prescription.pharmacyId = pharmacyId;
      await prescription.save();
      logger.info(`Prescription ${prescription.id} assignée à la pharmacie ${pharmacyId}`);
    }

    // Enregistrer l'accès pour audit
    logger.info(`Accès à la prescription ${prescription.id} (matricule: ${matricule}) par la pharmacie ${pharmacyId}`);

    res.status(200).json({
      message: 'Prescription trouvée avec succès',
      prescription
    });

  } catch (error) {
    logger.error('Error fetching prescription by matricule:', error);
    res.status(500).json({
      message: 'Erreur serveur lors de la recherche de prescription',
      error: error.message
    });
  }
};

exports.confirmDrugDelivery = async (req, res) => {
  try {
    const { id: pharmacyId } = req.user;
    const { prescriptionId } = req.params;

    const prescription = await Prescription.findOne({
      where: { id: prescriptionId, pharmacyId, deliveryStatus: 'pending' },
    });

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found or already delivered/cancelled' });
    }

    // Record delivery on Hedera
    const memo = `Drug delivery confirmed for Prescription ID: ${prescription.id} by Pharmacy ID: ${pharmacyId}`;
    const hederaTransactionId = await hederaService.submitMedicalRecord(memo); // Reusing submitMedicalRecord for simplicity, can create a specific one

    prescription.deliveryStatus = 'delivered';
    prescription.deliveryConfirmationHash = hederaTransactionId;
    await prescription.save();

    res.status(200).json({ message: 'Drug delivery confirmed and recorded on Hedera', prescription });
  } catch (error) {
    logger.error('Error confirming drug delivery:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getPrescriptionMatricule = async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    const { id: userId, role } = req.user;

    // Récupérer la prescription
    const prescription = await Prescription.findByPk(prescriptionId, {
      include: [
        { model: BaseUser, as: 'patient', attributes: ['id', 'firstName', 'lastName'] },
        { model: BaseUser, as: 'doctor', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    if (!prescription) {
      return res.status(404).json({
        message: 'Prescription non trouvée'
      });
    }

    // Gestion SQLite: Générer un matricule si manquant
    if (!prescription.matricule) {
      logger.warn(`Prescription ${prescription.id} sans matricule. Génération...`);

      const crypto = require('crypto');
      let newMatricule;
      let exists = true;

      while (exists) {
        const date = prescription.issueDate
          ? new Date(prescription.issueDate).toISOString().slice(0, 10).replace(/-/g, '')
          : new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const random = crypto.randomBytes(2).toString('hex').toUpperCase();
        newMatricule = `PRX-${date}-${random}`;

        const existing = await Prescription.findOne({ where: { matricule: newMatricule } });
        exists = !!existing;
      }

      prescription.matricule = newMatricule;
      await prescription.save();

      logger.info(`Matricule ${newMatricule} généré pour prescription ${prescription.id}`);
    }

    // Valider l'accès
    if (!matriculeService.validateAccess(prescription.matricule, req.user, prescription)) {
      return res.status(403).json({
        message: 'Accès refusé à cette prescription'
      });
    }

    // Formater les informations du matricule selon le rôle
    const matriculeInfo = matriculeService.formatMatriculeForUser(prescription, role);

    // Ajouter le QR Code si demandé
    if (req.query.qr === 'true') {
      matriculeInfo.qrCode = matriculeService.generateQRCode(prescription.matricule);
    }

    // Journaliser l'accès
    matriculeService.logAccess(prescription.matricule, req.user, 'view', {
      prescriptionId,
      method: 'api'
    });

    res.status(200).json({
      prescription: {
        id: prescription.id,
        medication: prescription.medication,
        dosage: prescription.dosage,
        quantity: prescription.quantity,
        issueDate: prescription.issueDate,
        deliveryStatus: prescription.deliveryStatus,
        patient: prescription.patient,
        doctor: prescription.doctor
      },
      matricule: matriculeInfo
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération du matricule:', error);
    res.status(500).json({
      message: 'Erreur serveur lors de la récupération du matricule',
      error: error.message
    });
  }
};