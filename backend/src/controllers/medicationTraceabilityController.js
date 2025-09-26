const { Prescription, BaseUser } = require('../models');
const hederaService = require('../services/hederaService');
const hashService = require('../services/hashService');

// POST /api/pharmacy/deliver-medication - ANCRAGE BLOCKCHAIN À LA REMISE
exports.deliverMedication = async (req, res) => {
  try {
    const { matricule, patientConfirmation, pharmacistNotes } = req.body;

    // Vérifier que l'utilisateur est pharmacien
    if (req.user.role !== 'pharmacy') {
      return res.status(403).json({ message: 'Accès refusé - Pharmacien uniquement' });
    }

    // Trouver la prescription
    const prescription = await Prescription.findOne({
      where: { matricule },
      include: [
        { model: BaseUser, as: 'patient', attributes: ['firstName', 'lastName', 'phoneNumber'] },
        { model: BaseUser, as: 'doctor', attributes: ['firstName', 'lastName'] }
      ]
    });

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription introuvable' });
    }

    if (prescription.deliveryStatus === 'delivered') {
      return res.status(400).json({ message: 'Médicament déjà délivré' });
    }

    // 🔥 NOUVEAU MODÈLE : Ancrage blockchain SEULEMENT à la remise
    const deliveryData = {
      // Données de traçabilité complète
      chain: {
        step: 'MEDICATION_DELIVERY', // Étape finale de la chaîne
        previousStep: 'PRESCRIPTION_ISSUED'
      },
      prescription: {
        matricule: prescription.matricule,
        medication: prescription.medication,
        dosage: prescription.dosage,
        quantity: prescription.quantity,
        issueDate: prescription.issueDate
      },
      delivery: {
        timestamp: new Date().toISOString(),
        pharmacyId: req.user.id,
        patientConfirmation: patientConfirmation, // Signature/accord du patient
        pharmacistNotes: pharmacistNotes || null,
        location: req.body.pharmacyLocation || 'Unknown'
      },
      participants: {
        patientId: prescription.patientId,
        doctorId: prescription.doctorId,
        pharmacistId: req.user.id
      },
      integrity: {
        prescriptionHash: prescription.deliveryConfirmationHash, // Hash original si existant
        deliveryHash: null // Sera calculé
      }
    };

    // Générer le hash de la remise complète
    deliveryData.integrity.deliveryHash = hashService.generateHash(JSON.stringify(deliveryData));

    console.log(`🏥 TRAÇABILITÉ BLOCKCHAIN: Ancrage remise médicament ${matricule}`);
    console.log(`📋 Docteur → Prescription → Pharmacie → BLOCKCHAIN`);

    // 🎯 ANCRAGE HEDERA UNIQUEMENT ICI (preuve de remise réelle)
    const hederaResult = await hederaService.anchorRecord({
      id: prescription.id,
      type: 'medication_traceability',
      patientId: prescription.patientId,
      doctorId: prescription.doctorId,
      pharmacyId: req.user.id,
      data: deliveryData
    });

    // Mettre à jour la prescription avec les preuves blockchain
    await prescription.update({
      deliveryStatus: 'delivered',
      deliveryConfirmationHash: deliveryData.integrity.deliveryHash,
      hederaTransactionId: hederaResult.transactionId,
      hederaSequenceNumber: hederaResult.sequenceNumber,
      hederaTopicId: hederaResult.topicId,
      isVerified: hederaResult.status === 'SUCCESS',
      pharmacyId: req.user.id,
      deliveryTimestamp: new Date(),
      patientConfirmation: patientConfirmation,
      pharmacistNotes: pharmacistNotes
    });

    console.log(`✅ TRAÇABILITÉ COMPLÈTE: ${matricule} ancré sur Hedera`);
    console.log(`🔗 Preuve blockchain: ${hederaResult.transactionId}`);
    console.log(`📍 Topic: ${hederaResult.topicId}`);

    res.json({
      success: true,
      message: 'Médicament délivré et tracé sur blockchain',
      traceability: {
        matricule: prescription.matricule,
        medication: prescription.medication,
        patient: `${prescription.patient.firstName} ${prescription.patient.lastName}`,
        deliveryHash: deliveryData.integrity.deliveryHash,
        blockchain: {
          transactionId: hederaResult.transactionId,
          topicId: hederaResult.topicId,
          sequenceNumber: hederaResult.sequenceNumber,
          verified: hederaResult.status === 'SUCCESS',
          hashScanUrl: `https://hashscan.io/testnet/transaction/${hederaResult.transactionId}`
        },
        chain: {
          prescription: 'Émise par docteur',
          dispensation: 'Préparée par pharmacie',
          delivery: 'Remise au patient ✅',
          blockchain: 'Preuve immutable 🔒'
        }
      }
    });

  } catch (error) {
    console.error('Medication delivery error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /api/pharmacy/trace/:matricule - Traçabilité complète d'un médicament
exports.traceMedication = async (req, res) => {
  try {
    const { matricule } = req.params;

    const prescription = await Prescription.findOne({
      where: { matricule },
      include: [
        { model: BaseUser, as: 'patient', attributes: ['firstName', 'lastName'] },
        { model: BaseUser, as: 'doctor', attributes: ['firstName', 'lastName'] },
        { model: BaseUser, as: 'pharmacy', attributes: ['firstName', 'lastName', 'email'] }
      ]
    });

    if (!prescription) {
      return res.status(404).json({ message: 'Médicament introuvable' });
    }

    // Construire la chaîne de traçabilité
    const traceability = {
      medication: {
        name: prescription.medication,
        matricule: prescription.matricule,
        dosage: prescription.dosage,
        quantity: prescription.quantity
      },
      chain: [
        {
          step: 1,
          action: 'Prescription émise',
          actor: prescription.doctor ?
            `Dr. ${prescription.doctor.firstName} ${prescription.doctor.lastName}` : 'Docteur inconnu',
          date: prescription.issueDate,
          status: 'completed',
          blockchain: false
        },
        {
          step: 2,
          action: 'Médicament préparé',
          actor: prescription.pharmacy ?
            `${prescription.pharmacy.firstName} ${prescription.pharmacy.lastName}` : 'Pharmacie inconnue',
          date: prescription.createdAt,
          status: prescription.deliveryStatus === 'pending' ? 'in_progress' : 'completed',
          blockchain: false
        },
        {
          step: 3,
          action: 'Remise au patient',
          actor: prescription.patient ?
            `${prescription.patient.firstName} ${prescription.patient.lastName}` : 'Patient inconnu',
          date: prescription.deliveryTimestamp,
          status: prescription.deliveryStatus === 'delivered' ? 'completed' : 'pending',
          blockchain: !!prescription.hederaTransactionId // 🔥 BLOCKCHAIN SEULEMENT ICI
        }
      ],
      blockchain: prescription.hederaTransactionId ? {
        anchored: true,
        transactionId: prescription.hederaTransactionId,
        verified: prescription.isVerified,
        proofUrl: `https://hashscan.io/testnet/transaction/${prescription.hederaTransactionId}`,
        hash: prescription.deliveryConfirmationHash
      } : {
        anchored: false,
        reason: 'Médicament pas encore délivré au patient'
      }
    };

    res.json({
      success: true,
      data: traceability
    });

  } catch (error) {
    console.error('Traceability error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = {
  deliverMedication: exports.deliverMedication,
  traceMedication: exports.traceMedication
};