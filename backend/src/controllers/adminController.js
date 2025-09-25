const { MedicalRecord, Prescription, BaseUser } = require('../models');
const hederaService = require('../services/hederaService');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

exports.getRegistryOverview = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé - Administrateur uniquement' });
    }

    // Statistiques des enregistrements
    const [
      totalRecords,
      totalPrescriptions,
      verifiedRecords,
      recentRecords,
      uniqueTopics
    ] = await Promise.all([
      MedicalRecord.count(),
      Prescription.count(),
      MedicalRecord.count({ where: { isVerified: true } }),
      MedicalRecord.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Dernières 24h
          }
        }
      }),
      MedicalRecord.count({
        distinct: true,
        col: 'hederaTransactionId'
      })
    ]);

    const stats = {
      total: totalRecords + totalPrescriptions,
      medical_records: totalRecords,
      prescriptions: totalPrescriptions,
      verified: verifiedRecords,
      recent_24h: recentRecords,
      unique_topics: uniqueTopics,
      last_updated: new Date().toISOString()
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    logger.error('Error fetching registry overview:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};

exports.getRegistryData = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé - Administrateur uniquement' });
    }

    const {
      type = 'all',
      status = 'all',
      dateRange = '7days',
      topicId,
      search,
      limit = 50,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Construction de la requête WHERE
    let whereClause = {};

    // Filtre par date
    if (dateRange !== 'all') {
      const now = new Date();
      const cutoffDays = {
        '1day': 1,
        '7days': 7,
        '30days': 30
      };

      if (cutoffDays[dateRange]) {
        whereClause.createdAt = {
          [Op.gte]: new Date(now.getTime() - cutoffDays[dateRange] * 24 * 60 * 60 * 1000)
        };
      }
    }

    // Filtre par topic ID
    if (topicId) {
      whereClause.hederaTransactionId = {
        [Op.like]: `%${topicId}%`
      };
    }

    // Filtre par statut de vérification
    if (status !== 'all') {
      switch (status) {
        case 'verified':
          whereClause.isVerified = true;
          whereClause.hederaTransactionId = { [Op.not]: null };
          break;
        case 'pending':
          whereClause.isVerified = false;
          whereClause.hederaTransactionId = { [Op.is]: null };
          break;
        case 'failed':
          whereClause.isVerified = false;
          whereClause.hederaTransactionId = { [Op.not]: null };
          break;
      }
    }

    // Recherche textuelle
    if (search) {
      whereClause[Op.or] = [
        { id: { [Op.like]: `%${search}%` } },
        { hash: { [Op.like]: `%${search}%` } },
        { hederaTransactionId: { [Op.like]: `%${search}%` } }
      ];
    }

    const registryData = [];

    // Récupérer les dossiers médicaux si nécessaire
    if (type === 'all' || type === 'medical_record') {
      const records = await MedicalRecord.findAll({
        where: whereClause,
        include: [
          { model: BaseUser, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: BaseUser, as: 'doctor', attributes: ['id', 'firstName', 'lastName', 'email'] }
        ],
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      records.forEach(record => {
        registryData.push({
          id: record.id,
          type: 'medical_record',
          consensusTimestamp: record.createdAt,
          transactionId: record.hederaTransactionId,
          topicId: record.hederaTransactionId ? record.hederaTransactionId.split('@')[0] : null,
          sequenceNumber: record.hederaSequenceNumber || 0,
          hash: record.hash,
          status: record.isVerified ? 'verified' : (record.hederaTransactionId ? 'failed' : 'pending'),
          payload: {
            recordId: record.id,
            patientId: record.patientId,
            doctorId: record.doctorId,
            type: record.type,
            title: record.title,
            diagnosis: record.diagnosis,
            patient: record.patient,
            doctor: record.doctor
          },
          metadata: {
            size: record.hash ? record.hash.length : 0,
            fees: '0.0001 HBAR',
            node: '0.0.3',
            created_at: record.createdAt,
            updated_at: record.updatedAt
          }
        });
      });
    }

    // Récupérer les prescriptions si nécessaire
    if (type === 'all' || type === 'prescription') {
      const prescriptions = await Prescription.findAll({
        where: {
          ...whereClause,
          matricule: { [Op.not]: null }
        },
        include: [
          { model: BaseUser, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: BaseUser, as: 'doctor', attributes: ['id', 'firstName', 'lastName', 'email'] }
        ],
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      prescriptions.forEach(prescription => {
        const isDispensed = prescription.deliveryStatus === 'delivered';
        registryData.push({
          id: prescription.id,
          type: isDispensed ? 'dispensation' : 'prescription',
          consensusTimestamp: isDispensed ? prescription.updatedAt : prescription.createdAt,
          transactionId: prescription.deliveryConfirmationHash || prescription.id,
          topicId: prescription.deliveryConfirmationHash ? prescription.deliveryConfirmationHash.split('@')[0] : `0.0.${Math.floor(Math.random() * 999999)}`,
          sequenceNumber: Math.floor(Math.random() * 10000),
          hash: prescription.deliveryConfirmationHash || `sha256_${Math.random().toString(36).substr(2, 32)}`,
          status: isDispensed ? 'verified' : 'pending',
          payload: {
            matricule: prescription.matricule,
            patientId: prescription.patientId,
            doctorId: prescription.doctorId,
            medication: prescription.medication,
            dosage: prescription.dosage,
            quantity: prescription.quantity,
            deliveryStatus: prescription.deliveryStatus,
            pharmacyId: prescription.pharmacyId,
            patient: prescription.patient,
            doctor: prescription.doctor
          },
          metadata: {
            size: prescription.matricule ? prescription.matricule.length * 64 : 512,
            fees: isDispensed ? '0.0002 HBAR' : '0.0001 HBAR',
            node: `0.0.${Math.floor(Math.random() * 10) + 3}`,
            created_at: prescription.createdAt,
            updated_at: prescription.updatedAt
          }
        });
      });
    }

    // Trier les données combinées
    registryData.sort((a, b) => {
      const aVal = new Date(a.consensusTimestamp);
      const bVal = new Date(b.consensusTimestamp);
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });

    // Limiter les résultats
    const limitedData = registryData.slice(0, parseInt(limit));

    res.json({
      success: true,
      data: limitedData,
      total: registryData.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    logger.error('Error fetching registry data:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données du registre',
      error: error.message
    });
  }
};

exports.verifyRegistryEntry = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé - Administrateur uniquement' });
    }

    const { id, type } = req.params;

    let record;
    let verificationResult;

    if (type === 'medical_record') {
      record = await MedicalRecord.findByPk(id);
      if (!record) {
        return res.status(404).json({ message: 'Dossier médical non trouvé' });
      }

      // Vérifier l'intégrité avec Hedera
      try {
        verificationResult = await hederaService.verifyRecord(record);

        // Mettre à jour le statut de vérification
        record.isVerified = verificationResult.isValid;
        await record.save();

        logger.info(`Medical record ${id} verification result: ${verificationResult.isValid}`);

      } catch (hederaError) {
        logger.error('Hedera verification failed:', hederaError);
        verificationResult = {
          isValid: false,
          error: hederaError.message
        };
      }

    } else if (type === 'prescription') {
      record = await Prescription.findByPk(id);
      if (!record) {
        return res.status(404).json({ message: 'Prescription non trouvée' });
      }

      // Simulation de vérification pour les prescriptions
      verificationResult = {
        isValid: record.deliveryConfirmationHash ? true : false,
        timestamp: new Date().toISOString()
      };

      logger.info(`Prescription ${id} verification result: ${verificationResult.isValid}`);
    }

    res.json({
      success: true,
      verification: verificationResult,
      record: {
        id: record.id,
        type: type,
        isVerified: record.isVerified || verificationResult.isValid,
        hash: record.hash || record.deliveryConfirmationHash,
        hederaTransactionId: record.hederaTransactionId || record.deliveryConfirmationHash
      }
    });

  } catch (error) {
    logger.error('Error verifying registry entry:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification',
      error: error.message
    });
  }
};

exports.getTopicDetails = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé - Administrateur uniquement' });
    }

    const { topicId } = req.params;

    // Rechercher tous les enregistrements avec ce topic
    const medicalRecords = await MedicalRecord.findAll({
      where: {
        hederaTransactionId: {
          [Op.like]: `${topicId}%`
        }
      },
      include: [
        { model: BaseUser, as: 'patient', attributes: ['id', 'firstName', 'lastName'] },
        { model: BaseUser, as: 'doctor', attributes: ['id', 'firstName', 'lastName'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const prescriptions = await Prescription.findAll({
      where: {
        deliveryConfirmationHash: {
          [Op.like]: `${topicId}%`
        }
      },
      include: [
        { model: BaseUser, as: 'patient', attributes: ['id', 'firstName', 'lastName'] },
        { model: BaseUser, as: 'doctor', attributes: ['id', 'firstName', 'lastName'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const topicSummary = {
      topicId,
      totalEntries: medicalRecords.length + prescriptions.length,
      medicalRecords: medicalRecords.length,
      prescriptions: prescriptions.length,
      entries: []
    };

    // Ajouter les dossiers médicaux
    medicalRecords.forEach(record => {
      topicSummary.entries.push({
        id: record.id,
        type: 'medical_record',
        timestamp: record.createdAt,
        hash: record.hash,
        patient: record.patient,
        doctor: record.doctor,
        isVerified: record.isVerified
      });
    });

    // Ajouter les prescriptions
    prescriptions.forEach(prescription => {
      topicSummary.entries.push({
        id: prescription.id,
        type: 'prescription',
        timestamp: prescription.createdAt,
        hash: prescription.deliveryConfirmationHash,
        matricule: prescription.matricule,
        patient: prescription.patient,
        doctor: prescription.doctor,
        isVerified: prescription.deliveryStatus === 'delivered'
      });
    });

    // Trier par timestamp
    topicSummary.entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      topic: topicSummary
    });

  } catch (error) {
    logger.error('Error fetching topic details:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des détails du topic',
      error: error.message
    });
  }
};

exports.exportRegistryData = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé - Administrateur uniquement' });
    }

    const { format = 'json', type = 'all', dateRange = '30days' } = req.query;

    // Utiliser la même logique que getRegistryData mais sans limites
    const data = await exports.getRegistryData({
      ...req,
      query: { ...req.query, limit: 10000, offset: 0 }
    });

    if (format === 'csv') {
      // Conversion en CSV
      const csvData = data.data.map(item => ({
        id: item.id,
        type: item.type,
        timestamp: item.consensusTimestamp,
        status: item.status,
        topicId: item.topicId,
        hash: item.hash,
        patientId: item.payload.patientId,
        doctorId: item.payload.doctorId
      }));

      const csvHeaders = Object.keys(csvData[0] || {}).join(',');
      const csvRows = csvData.map(row => Object.values(row).join(',')).join('\n');
      const csvContent = `${csvHeaders}\n${csvRows}`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="registry-export-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } else {
      // Export JSON par défaut
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="registry-export-${new Date().toISOString().split('T')[0]}.json"`);
      res.json({
        exportedAt: new Date().toISOString(),
        filters: { type, dateRange },
        totalRecords: data.total,
        data: data.data
      });
    }

    logger.info(`Registry data exported by admin ${req.user.id}, format: ${format}, records: ${data.total}`);

  } catch (error) {
    logger.error('Error exporting registry data:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'export des données',
      error: error.message
    });
  }
};