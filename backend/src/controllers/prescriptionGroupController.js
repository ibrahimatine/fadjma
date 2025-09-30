const { PrescriptionGroup, PrescriptionGroupItem, Prescription, BaseUser } = require('../models');
const hederaService = require('../services/hederaService');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

// Créer un groupe de prescriptions
exports.createPrescriptionGroup = async (req, res) => {
  try {
    const { prescriptionIds, patientId } = req.body;
    const doctorId = req.user.id;

    if (!prescriptionIds || prescriptionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Au moins une prescription requise'
      });
    }

    // Vérifier que toutes les prescriptions existent et appartiennent au patient
    const prescriptions = await Prescription.findAll({
      where: {
        id: { [Op.in]: prescriptionIds },
        patientId: patientId,
        doctorId: doctorId
      }
    });

    if (prescriptions.length !== prescriptionIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Certaines prescriptions sont invalides ou n\'existent pas'
      });
    }

    // Vérifier qu'aucune prescription n'est déjà dans un groupe
    const alreadyInGroup = await PrescriptionGroupItem.findOne({
      where: {
        prescriptionId: { [Op.in]: prescriptionIds }
      }
    });

    if (alreadyInGroup) {
      return res.status(400).json({
        success: false,
        message: 'Une ou plusieurs prescriptions font déjà partie d\'un groupe'
      });
    }

    // Créer le groupe (le matricule sera généré automatiquement via le hook)
    const group = await PrescriptionGroup.create({
      patientId,
      doctorId,
      issueDate: new Date(),
      status: 'pending',
      deliveryStatus: 'pending'
    });

    // Ajouter les prescriptions au groupe
    const groupItems = await Promise.all(
      prescriptionIds.map((prescriptionId, index) =>
        PrescriptionGroupItem.create({
          groupId: group.id,
          prescriptionId,
          orderIndex: index
        })
      )
    );

    logger.info(`Prescription group created: ${group.groupMatricule} with ${prescriptionIds.length} items`);

    // Récupérer le groupe complet avec ses prescriptions
    const fullGroup = await PrescriptionGroup.findByPk(group.id, {
      include: [
        {
          model: PrescriptionGroupItem,
          as: 'items',
          include: [{
            model: Prescription,
            as: 'prescription'
          }]
        },
        { model: BaseUser, as: 'patient', attributes: ['firstName', 'lastName'] },
        { model: BaseUser, as: 'doctor', attributes: ['firstName', 'lastName'] }
      ]
    });

    res.status(201).json({
      success: true,
      group: fullGroup
    });

  } catch (error) {
    logger.error('Error creating prescription group:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du groupe de prescriptions',
      error: error.message
    });
  }
};

// Récupérer un groupe par matricule
exports.getGroupByMatricule = async (req, res) => {
  try {
    const { groupMatricule } = req.params;

    const group = await PrescriptionGroup.findOne({
      where: { groupMatricule },
      include: [
        {
          model: PrescriptionGroupItem,
          as: 'items',
          include: [{
            model: Prescription,
            as: 'prescription'
          }],
          order: [['orderIndex', 'ASC']]
        },
        { model: BaseUser, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'patientIdentifier'] },
        { model: BaseUser, as: 'doctor', attributes: ['id', 'firstName', 'lastName'] },
        { model: BaseUser, as: 'pharmacy', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Groupe de prescriptions non trouvé'
      });
    }

    // Vérifier les permissions
    if (req.user.role === 'patient' && group.patientId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    if (req.user.role === 'doctor' && group.doctorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    res.json({
      success: true,
      group
    });

  } catch (error) {
    logger.error('Error fetching group by matricule:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du groupe'
    });
  }
};

// Recherche pour pharmacie
exports.searchGroupForPharmacy = async (req, res) => {
  try {
    const { groupMatricule } = req.params;

    const group = await PrescriptionGroup.findOne({
      where: {
        groupMatricule,
        deliveryStatus: 'pending'
      },
      include: [
        {
          model: PrescriptionGroupItem,
          as: 'items',
          include: [{
            model: Prescription,
            as: 'prescription',
            attributes: ['id', 'medication', 'dosage', 'quantity', 'instructions', 'issueDate']
          }],
          order: [['orderIndex', 'ASC']]
        },
        { model: BaseUser, as: 'patient', attributes: ['firstName', 'lastName', 'patientIdentifier', 'phoneNumber'] },
        { model: BaseUser, as: 'doctor', attributes: ['firstName', 'lastName'] }
      ]
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Groupe de prescriptions non trouvé ou déjà délivré'
      });
    }

    res.json({
      success: true,
      group,
      totalItems: group.items.length
    });

  } catch (error) {
    logger.error('Error searching group for pharmacy:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche du groupe'
    });
  }
};

// Délivrer un groupe complet
exports.deliverPrescriptionGroup = async (req, res) => {
  try {
    const { groupMatricule } = req.params;
    const { dispensationData } = req.body;
    const pharmacyId = req.user.id;

    const group = await PrescriptionGroup.findOne({
      where: {
        groupMatricule,
        deliveryStatus: 'pending'
      },
      include: [
        {
          model: PrescriptionGroupItem,
          as: 'items',
          include: [{
            model: Prescription,
            as: 'prescription'
          }]
        }
      ]
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Groupe de prescriptions non trouvé ou déjà délivré'
      });
    }

    // Préparer les données pour l'ancrage Hedera
    const groupData = {
      groupMatricule: group.groupMatricule,
      patientId: group.patientId,
      doctorId: group.doctorId,
      pharmacyId: pharmacyId,
      deliveryDate: new Date().toISOString(),
      prescriptions: group.items.map(item => ({
        matricule: item.prescription.matricule,
        medication: item.prescription.medication,
        quantity: item.prescription.quantity
      })),
      dispensationData
    };

    // Ancrer dans Hedera
    let hederaTransactionId = null;
    try {
      const hederaResult = await hederaService.submitMessage({
        type: 'prescription_group_delivery',
        data: groupData
      });

      if (hederaResult.success) {
        hederaTransactionId = hederaResult.transactionId;
        logger.info(`Group ${groupMatricule} anchored to Hedera: ${hederaTransactionId}`);
      }
    } catch (hederaError) {
      logger.error('Hedera anchoring failed for group:', hederaError);
      // Continuer même si l'ancrage échoue
    }

    // Mettre à jour le groupe
    await group.update({
      status: 'delivered',
      deliveryStatus: 'delivered',
      pharmacyId,
      hederaTransactionId
    });

    // Mettre à jour toutes les prescriptions du groupe
    await Promise.all(
      group.items.map(item =>
        Prescription.update(
          {
            deliveryStatus: 'delivered',
            pharmacyId,
            isVerified: hederaTransactionId ? true : false
          },
          { where: { id: item.prescriptionId } }
        )
      )
    );

    logger.info(`Prescription group ${groupMatricule} delivered by pharmacy ${pharmacyId}`);

    // Récupérer le groupe mis à jour
    const updatedGroup = await PrescriptionGroup.findByPk(group.id, {
      include: [
        {
          model: PrescriptionGroupItem,
          as: 'items',
          include: [{
            model: Prescription,
            as: 'prescription'
          }]
        },
        { model: BaseUser, as: 'patient', attributes: ['firstName', 'lastName'] },
        { model: BaseUser, as: 'doctor', attributes: ['firstName', 'lastName'] },
        { model: BaseUser, as: 'pharmacy', attributes: ['firstName', 'lastName'] }
      ]
    });

    res.json({
      success: true,
      group: updatedGroup,
      hederaInfo: {
        isAnchored: !!hederaTransactionId,
        transactionId: hederaTransactionId
      }
    });

  } catch (error) {
    logger.error('Error delivering prescription group:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la délivrance du groupe de prescriptions',
      error: error.message
    });
  }
};

// Obtenir tous les groupes d'un patient
exports.getPatientGroups = async (req, res) => {
  try {
    const patientId = req.user.role === 'patient' ? req.user.id : req.params.patientId;

    const groups = await PrescriptionGroup.findAll({
      where: { patientId },
      include: [
        {
          model: PrescriptionGroupItem,
          as: 'items',
          include: [{
            model: Prescription,
            as: 'prescription',
            attributes: ['medication', 'dosage']
          }]
        },
        { model: BaseUser, as: 'doctor', attributes: ['firstName', 'lastName'] },
        { model: BaseUser, as: 'pharmacy', attributes: ['firstName', 'lastName'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      groups
    });

  } catch (error) {
    logger.error('Error fetching patient groups:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des groupes'
    });
  }
};

// Obtenir tous les groupes créés par un médecin
exports.getDoctorGroups = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { status } = req.query;

    let whereClause = { doctorId };
    if (status) {
      whereClause.status = status;
    }

    const groups = await PrescriptionGroup.findAll({
      where: whereClause,
      include: [
        {
          model: PrescriptionGroupItem,
          as: 'items',
          include: [{
            model: Prescription,
            as: 'prescription',
            attributes: ['medication']
          }]
        },
        { model: BaseUser, as: 'patient', attributes: ['firstName', 'lastName', 'patientIdentifier'] },
        { model: BaseUser, as: 'pharmacy', attributes: ['firstName', 'lastName'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      groups
    });

  } catch (error) {
    logger.error('Error fetching doctor groups:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des groupes'
    });
  }
};