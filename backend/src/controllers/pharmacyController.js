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
    if (!matricule || !/^PRX-\d{8}-[A-F0-9]{8}$/.test(matricule)) {
      return res.status(400).json({
        message: 'Format de matricule invalide. Format attendu: PRX-YYYYMMDD-XXXXXXXX'
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

    // Rechercher toutes les prescriptions en attente pour le même patient
    const patientPrescriptions = await Prescription.findAll({
      where: {
        patientId: prescription.patientId,
        deliveryStatus: 'pending'
      },
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
      order: [['issueDate', 'DESC']]
    });

    logger.info(`${patientPrescriptions.length} prescription(s) en attente trouvée(s) pour le patient ${prescription.patientId}`);

    res.status(200).json({
      message: 'Prescription trouvée avec succès',
      prescription,
      allPrescriptions: patientPrescriptions,
      totalPrescriptions: patientPrescriptions.length
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

    console.log(`🏪 Tentative de confirmation de délivrance - Prescription: ${prescriptionId}, Pharmacie: ${pharmacyId}`);

    const prescription = await Prescription.findOne({
      where: { id: prescriptionId, pharmacyId, deliveryStatus: 'pending' },
      include: [
        { model: BaseUser, as: 'patient', attributes: ['id', 'firstName', 'lastName'] },
        { model: BaseUser, as: 'doctor', attributes: ['id', 'firstName', 'lastName'] },
        { model: BaseUser, as: 'pharmacy', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found or already delivered/cancelled' });
    }

    console.log(`💊 Prescription trouvée: ${prescription.medication} - Matricule: ${prescription.matricule}`);

    // Ancrage complet de la délivrance sur Hedera avec toutes les informations
    try {
      console.log(`🔗 Début ancrage délivrance pour ${prescription.matricule}...`);

      const deliveryData = {
        id: prescription.id,
        matricule: prescription.matricule,
        patientId: prescription.patientId,
        doctorId: prescription.doctorId,
        pharmacyId,
        type: 'prescription_delivery',
        medication: prescription.medication,
        dosage: prescription.dosage,
        quantity: prescription.quantity,
        deliveryDate: new Date(),
        originalIssueDate: prescription.issueDate,
        deliveryStatus: 'delivered'
      };

      const hederaResult = await hederaService.anchorRecord(deliveryData);

      // Mise à jour complète des informations de délivrance
      await prescription.update({
        deliveryStatus: 'delivered',
        deliveryConfirmationHash: hederaResult.hash,
        hederaTransactionId: hederaResult.transactionId,
        hederaSequenceNumber: hederaResult.sequenceNumber,
        hederaTopicId: hederaResult.topicId,
        isVerified: true,
        verifiedAt: new Date()
      });

      console.log(`✅ Prescription ${prescription.matricule} délivrée et ancrée avec succès - TX: ${hederaResult.transactionId}`);

    } catch (hederaError) {
      console.error(`❌ Échec ancrage délivrance ${prescription.matricule}:`, hederaError);

      // Même en cas d'échec d'ancrage, on peut marquer comme délivré localement
      await prescription.update({
        deliveryStatus: 'delivered',
        deliveryConfirmationHash: `LOCAL_DELIVERY_${Date.now()}`, // Hash local de secours
        verifiedAt: new Date()
      });

      console.log(`⚠️ Prescription ${prescription.matricule} marquée comme délivrée localement (ancrage échoué)`);
    }

    // Send WebSocket notification to patient about delivery
    if (req.io && prescription.patient) {
      req.io.notifyPrescriptionUpdate(
        prescription.id,
        'delivered',
        prescription.patient.id,
        pharmacyId
      );

      console.log(`🔔 WebSocket notification sent for delivered prescription: ${prescription.id} to patient: ${prescription.patient.id}`);
    }

    res.status(200).json({
      message: 'Médicament délivré avec succès et enregistré sur Hedera',
      prescription,
      hederaInfo: {
        transactionId: prescription.hederaTransactionId,
        isAnchored: prescription.isVerified,
        verifiedAt: prescription.verifiedAt
      }
    });

  } catch (error) {
    logger.error('Error confirming drug delivery:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Nouvelle fonction: Confirmer délivrance par matricule
exports.confirmDeliveryByMatricule = async (req, res) => {
  try {
    const { matricule } = req.params;
    const { id: pharmacyId } = req.user;

    console.log(`🏪 Tentative de délivrance par matricule: ${matricule} - Pharmacie: ${pharmacyId}`);

    // Validation du format du matricule
    if (!matricule || !/^PRX-\d{8}-[A-F0-9]{8}$/.test(matricule)) {
      return res.status(400).json({
        success: false,
        message: 'Format de matricule invalide. Format attendu: PRX-YYYYMMDD-XXXXXXXX'
      });
    }

    // Rechercher la prescription par matricule
    const prescription = await Prescription.findOne({
      where: {
        matricule,
        deliveryStatus: 'pending'
      },
      include: [
        { model: BaseUser, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: BaseUser, as: 'doctor', attributes: ['id', 'firstName', 'lastName'] },
        { model: BaseUser, as: 'pharmacy', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription non trouvée ou déjà délivrée/annulée'
      });
    }

    // Assigner la pharmacie si pas encore assignée
    if (!prescription.pharmacyId) {
      await prescription.update({ pharmacyId });
      console.log(`📋 Prescription ${matricule} assignée à la pharmacie ${pharmacyId}`);
    } else if (prescription.pharmacyId !== pharmacyId) {
      return res.status(403).json({
        success: false,
        message: 'Cette prescription est assignée à une autre pharmacie'
      });
    }

    console.log(`💊 Délivrance: ${prescription.medication} - Patient: ${prescription.patient?.firstName} ${prescription.patient?.lastName}`);

    // Ancrage complet de la délivrance sur Hedera
    try {
      console.log(`🔗 Ancrage délivrance matricule ${matricule}...`);

      const deliveryData = {
        id: prescription.id,
        matricule: prescription.matricule,
        patientId: prescription.patientId,
        doctorId: prescription.doctorId,
        pharmacyId,
        type: 'prescription_delivery',
        medication: prescription.medication,
        dosage: prescription.dosage,
        quantity: prescription.quantity,
        deliveryDate: new Date(),
        originalIssueDate: prescription.issueDate,
        deliveryStatus: 'delivered'
      };

      const hederaResult = await hederaService.anchorRecord(deliveryData);

      // Mise à jour complète des informations de délivrance
      await prescription.update({
        deliveryStatus: 'delivered',
        deliveryConfirmationHash: hederaResult.hash,
        hederaTransactionId: hederaResult.transactionId,
        hederaSequenceNumber: hederaResult.sequenceNumber,
        hederaTopicId: hederaResult.topicId,
        isVerified: true,
        verifiedAt: new Date()
      });

      console.log(`✅ Matricule ${matricule} délivré et ancré - TX: ${hederaResult.transactionId}`);

    } catch (hederaError) {
      console.error(`❌ Échec ancrage délivrance ${matricule}:`, hederaError);

      // Délivrance locale en cas d'échec d'ancrage
      await prescription.update({
        deliveryStatus: 'delivered',
        deliveryConfirmationHash: `LOCAL_DELIVERY_${Date.now()}`,
        verifiedAt: new Date()
      });

      console.log(`⚠️ Matricule ${matricule} délivré localement (ancrage échoué)`);
    }

    // Notification WebSocket
    if (req.io && prescription.patient) {
      req.io.notifyPrescriptionUpdate(
        prescription.id,
        'delivered',
        prescription.patient.id,
        pharmacyId
      );

      console.log(`🔔 Notification délivrance envoyée - Patient: ${prescription.patient.id}`);
    }

    res.status(200).json({
      success: true,
      message: `Médicament ${prescription.medication} délivré avec succès`,
      prescription: {
        id: prescription.id,
        matricule: prescription.matricule,
        medication: prescription.medication,
        dosage: prescription.dosage,
        quantity: prescription.quantity,
        deliveryStatus: prescription.deliveryStatus,
        patient: prescription.patient,
        doctor: prescription.doctor
      },
      hederaInfo: {
        transactionId: prescription.hederaTransactionId,
        isAnchored: prescription.isVerified,
        verifiedAt: prescription.verifiedAt
      }
    });

  } catch (error) {
    logger.error('Error confirming delivery by matricule:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la confirmation de délivrance',
      error: error.message
    });
  }
};

// Nouvelle fonction: Recherche par matricule global d'ordonnance
exports.getMedicationsByOrdonnanceMatricule = async (req, res) => {
  try {
    const { matricule } = req.params;
    const { id: pharmacyId } = req.user;

    // Validation du format du matricule d'ordonnance (4-8 caractères pour compatibilité)
    if (!matricule || !/^ORD-\d{8}-[A-F0-9]{4,8}$/.test(matricule)) {
      return res.status(400).json({
        message: 'Format de matricule invalide. Format attendu: ORD-YYYYMMDD-XXXX ou ORD-YYYYMMDD-XXXXXXXX'
      });
    }

    const { MedicalRecord } = require('../models');

    // Rechercher le dossier médical (ordonnance) par matricule
    const medicalRecord = await MedicalRecord.findOne({
      where: { prescriptionMatricule: matricule },
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
      ]
    });

    if (!medicalRecord) {
      return res.status(404).json({
        message: 'Aucune ordonnance trouvée avec ce matricule'
      });
    }

    // Vérifier que c'est bien une prescription
    if (medicalRecord.type !== 'prescription') {
      return res.status(400).json({
        message: 'Ce matricule ne correspond pas à une ordonnance'
      });
    }

    // Récupérer toutes les prescriptions (médicaments) liées à ce dossier médical
    const prescriptions = await Prescription.findAll({
      where: {
        medicalRecordId: medicalRecord.id,
        deliveryStatus: 'pending'
      },
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
      order: [['createdAt', 'ASC']]
    });

    if (prescriptions.length === 0) {
      return res.status(404).json({
        message: 'Aucun médicament en attente pour cette ordonnance'
      });
    }

    // Générer les matricules manquants
    const crypto = require('crypto');
    for (const prescription of prescriptions) {
      if (!prescription.matricule) {
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
    }

    logger.info(`Ordonnance ${matricule} trouvée avec ${prescriptions.length} médicament(s) par pharmacie ${pharmacyId}`);

    res.status(200).json({
      message: 'Ordonnance trouvée avec succès',
      ordonnance: {
        matricule: medicalRecord.prescriptionMatricule,
        title: medicalRecord.title,
        description: medicalRecord.description,
        diagnosis: medicalRecord.diagnosis,
        patient: medicalRecord.patient,
        doctor: medicalRecord.doctor,
        createdAt: medicalRecord.createdAt
      },
      medications: prescriptions.map(p => ({
        id: p.id,
        matricule: p.matricule,
        medication: p.medication,
        dosage: p.dosage,
        quantity: p.quantity,
        instructions: p.instructions,
        issueDate: p.issueDate,
        deliveryStatus: p.deliveryStatus
      })),
      totalMedications: prescriptions.length
    });

  } catch (error) {
    logger.error('Error fetching medications by ordonnance matricule:', error);
    res.status(500).json({
      message: 'Erreur serveur lors de la recherche de l\'ordonnance',
      error: error.message
    });
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