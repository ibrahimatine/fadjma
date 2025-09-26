const express = require('express');
const router = express.Router();
const { MedicalRecord, Prescription, BaseUser } = require('../models');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const hashscanService = require('../services/hashscanService');

// GET /api/history/doctor-patient/:doctorId/:patientId - Historique docteur-patient
router.get('/doctor-patient/:doctorId/:patientId', auth, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé - Administrateur uniquement' });
    }

    const { doctorId, patientId } = req.params;
    const {
      dateFrom,
      dateTo,
      type = 'all', // all, medical_record, prescription
      includeUnverified = 'false',
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;


    // Construction des filtres
    let whereClause = {
      doctorId: doctorId,
      patientId: patientId
    };

    // Filtre par date
    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) whereClause.createdAt[Op.gte] = new Date(dateFrom);
      if (dateTo) whereClause.createdAt[Op.lte] = new Date(dateTo);
    }

    // Filtre par statut de vérification
    if (includeUnverified === 'false') {
      whereClause.hederaTransactionId = { [Op.ne]: null };
    }

    let history = [];

    // Récupérer les dossiers médicaux
    if (type === 'all' || type === 'medical_record') {
      const medicalRecords = await MedicalRecord.findAll({
        where: whereClause,
        include: [
          { model: BaseUser, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: BaseUser, as: 'doctor', attributes: ['id', 'firstName', 'lastName', 'email'] }
        ]
      });

      history = history.concat(medicalRecords.map(record => ({
        id: record.id,
        type: 'medical_record',
        date: record.createdAt,
        hederaTimestamp: record.hederaTimestamp,
        isVerified: record.isVerified,
        hederaTransactionId: record.hederaTransactionId,
        hederaSequenceNumber: record.hederaSequenceNumber,
        hash: record.hash,
        details: {
          title: record.title,
          recordType: record.type,
          diagnosis: record.diagnosis,
          treatment: record.treatment,
          notes: record.notes
        },
        patient: record.patient,
        doctor: record.doctor,
        verification: {
          topicUrl: record.hederaTransactionId ? hashscanService.getTopicUrl() : null,
          transactionUrl: record.hederaTransactionId ? hashscanService.getTransactionUrl(record.hederaTransactionId) : null
        }
      })));
    }

    // Récupérer les prescriptions
    if (type === 'all' || type === 'prescription') {
      const prescriptions = await Prescription.findAll({
        where: whereClause,
        include: [
          { model: BaseUser, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: BaseUser, as: 'doctor', attributes: ['id', 'firstName', 'lastName', 'email'] }
        ]
      });

      history = history.concat(prescriptions.map(prescription => ({
        id: prescription.id,
        type: 'prescription',
        date: prescription.createdAt,
        hederaTimestamp: prescription.createdAt,
        isVerified: prescription.isVerified,
        hederaTransactionId: prescription.hederaTransactionId,
        hederaSequenceNumber: prescription.hederaSequenceNumber,
        hash: prescription.deliveryConfirmationHash,
        details: {
          matricule: prescription.matricule,
          medication: prescription.medication,
          dosage: prescription.dosage,
          quantity: prescription.quantity,
          instructions: prescription.instructions,
          deliveryStatus: prescription.deliveryStatus
        },
        patient: prescription.patient,
        doctor: prescription.doctor,
        verification: {
          topicUrl: prescription.hederaTransactionId ? hashscanService.getTopicUrl() : null,
          transactionUrl: prescription.hederaTransactionId ? hashscanService.getTransactionUrl(prescription.hederaTransactionId) : null
        }
      })));
    }

    // Trier l'historique
    history.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case 'date':
          aVal = new Date(a.date);
          bVal = new Date(b.date);
          break;
        case 'type':
          aVal = a.type;
          bVal = b.type;
          break;
        case 'verification':
          aVal = a.isVerified ? 1 : 0;
          bVal = b.isVerified ? 1 : 0;
          break;
        default:
          aVal = new Date(a.date);
          bVal = new Date(b.date);
      }

      if (sortOrder === 'desc') {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      } else {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      }
    });

    // Statistiques de l'historique
    const stats = {
      totalInteractions: history.length,
      medicalRecords: history.filter(item => item.type === 'medical_record').length,
      prescriptions: history.filter(item => item.type === 'prescription').length,
      verifiedOnHedera: history.filter(item => item.isVerified).length,
      dateRange: {
        from: history.length > 0 ? new Date(Math.min(...history.map(h => new Date(h.date)))).toISOString() : null,
        to: history.length > 0 ? new Date(Math.max(...history.map(h => new Date(h.date)))).toISOString() : null
      }
    };

    res.json({
      success: true,
      data: {
        doctorId,
        patientId,
        stats,
        history
      }
    });

  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/history/topic-messages/:topicId - Messages d'un topic spécifique
router.get('/topic-messages/:topicId', auth, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé - Administrateur uniquement' });
    }

    const { topicId } = req.params;
    const { limit = 50, sequenceStart, sequenceEnd } = req.query;

    // Rechercher tous les enregistrements liés à ce topic
    const medicalRecords = await MedicalRecord.findAll({
      where: {
        hederaTransactionId: { [Op.like]: `${topicId}%` }
      },
      include: [
        { model: BaseUser, as: 'patient', attributes: ['firstName', 'lastName'] },
        { model: BaseUser, as: 'doctor', attributes: ['firstName', 'lastName'] }
      ],
      order: [['hederaSequenceNumber', 'ASC']]
    });

    const prescriptions = await Prescription.findAll({
      where: {
        hederaTopicId: topicId
      },
      include: [
        { model: BaseUser, as: 'patient', attributes: ['firstName', 'lastName'] },
        { model: BaseUser, as: 'doctor', attributes: ['firstName', 'lastName'] }
      ],
      order: [['hederaSequenceNumber', 'ASC']]
    });

    // Combiner et formater les messages
    const messages = [];

    medicalRecords.forEach(record => {
      messages.push({
        sequenceNumber: record.hederaSequenceNumber,
        timestamp: record.hederaTimestamp,
        type: 'medical_record',
        hash: record.hash,
        transactionId: record.hederaTransactionId,
        participants: {
          patient: `${record.patient.firstName} ${record.patient.lastName}`,
          doctor: `${record.doctor.firstName} ${record.doctor.lastName}`
        },
        content: {
          recordId: record.id,
          recordType: record.type,
          title: record.title
        },
        verification: {
          topicUrl: hashscanService.getTopicUrl(topicId),
          messageUrl: hashscanService.getTopicMessageUrl(topicId, record.hederaSequenceNumber)
        }
      });
    });

    prescriptions.forEach(prescription => {
      messages.push({
        sequenceNumber: prescription.hederaSequenceNumber,
        timestamp: prescription.createdAt,
        type: 'prescription',
        hash: prescription.deliveryConfirmationHash,
        transactionId: prescription.hederaTransactionId,
        participants: {
          patient: `${prescription.patient.firstName} ${prescription.patient.lastName}`,
          doctor: `${prescription.doctor.firstName} ${prescription.doctor.lastName}`
        },
        content: {
          matricule: prescription.matricule,
          medication: prescription.medication,
          dosage: prescription.dosage
        },
        verification: {
          topicUrl: hashscanService.getTopicUrl(topicId),
          messageUrl: hashscanService.getTopicMessageUrl(topicId, prescription.hederaSequenceNumber)
        }
      });
    });

    // Trier par numéro de séquence
    messages.sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0));

    res.json({
      success: true,
      data: {
        topicId,
        totalMessages: messages.length,
        messages: messages.slice(0, parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Topic messages error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/history/patient/:patientId - Historique complet d'un patient
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé - Administrateur uniquement' });
    }

    const { patientId } = req.params;

    // Vérifier les permissions
    if (req.user.role === 'patient' && req.user.id !== patientId) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    // Récupérer tous les docteurs qui ont interagi avec ce patient
    const doctorInteractions = await MedicalRecord.findAll({
      where: { patientId },
      attributes: ['doctorId'],
      include: [{ model: BaseUser, as: 'doctor', attributes: ['firstName', 'lastName', 'email'] }],
      group: ['doctorId']
    });

    const interactions = [];

    for (const interaction of doctorInteractions) {
      // Utiliser l'endpoint existant pour chaque docteur
      const history = await router.get(`/doctor-patient/${interaction.doctorId}/${patientId}`);
      interactions.push({
        doctor: interaction.doctor,
        ...history
      });
    }

    res.json({
      success: true,
      data: {
        patientId,
        doctorInteractions: interactions
      }
    });

  } catch (error) {
    console.error('Patient history error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/history/search-users - Rechercher utilisateurs par nom
router.get('/search-users', auth, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé - Administrateur uniquement' });
    }

    const { name, role } = req.query;

    if (!name || name.length < 2) {
      return res.status(400).json({ message: 'Le nom doit contenir au moins 2 caractères' });
    }

    // Construire le filtre
    let whereClause = {
      [Op.or]: [
        { firstName: { [Op.like]: `%${name}%` } },
        { lastName: { [Op.like]: `%${name}%` } },
        // Recherche combinée prénom + nom
        {
          [Op.and]: [
            { firstName: { [Op.like]: `%${name.split(' ')[0]}%` } },
            { lastName: { [Op.like]: `%${name.split(' ').slice(1).join(' ')}%` } }
          ]
        }
      ]
    };

    // Filtrer par rôle si spécifié
    if (role && ['doctor', 'patient'].includes(role)) {
      whereClause.role = role;
    }

    // Admins peuvent chercher tous les types d'utilisateurs

    const users = await BaseUser.findAll({
      where: whereClause,
      attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
      limit: 20 // Limiter les résultats
    });

    const formattedUsers = users.map(user => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      displayName: user.role === 'doctor'
        ? `Dr. ${user.firstName} ${user.lastName}`
        : `${user.firstName} ${user.lastName}`
    }));

    res.json({
      success: true,
      data: formattedUsers
    });

  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;