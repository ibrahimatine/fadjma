const { MedicalRecord, Prescription, BaseUser } = require('../models');
const SystemStatus = require('../models/SystemStatus');
const hederaService = require('../services/hederaService');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

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
        // Déterminer le statut en fonction des données Hedera
        let status = 'failed';
        let topicId = null;

        if (record.hederaTransactionId && record.hederaTransactionId !== 'FALLBACK') {
          status = record.isVerified ? 'verified' : 'pending';
          topicId = record.hederaTopicId || (record.hederaTransactionId.split('@')[0]);
        }

        registryData.push({
          id: record.id,
          type: 'medical_record',
          consensusTimestamp: record.hederaTimestamp || record.createdAt,
          transactionId: record.hederaTransactionId || null,
          topicId: topicId,
          sequenceNumber: record.hederaSequenceNumber || null,
          hash: record.hash,
          status: status,
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
            size: JSON.stringify(record.toJSON()).length,
            fees: '0.0001 HBAR',
            node: '0.0.3', // Consistent node for testnet
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
        // Déterminer le statut en fonction des données Hedera
        let status = 'failed';
        let topicId = null;

        if (prescription.hederaTransactionId && prescription.hederaTransactionId !== 'FALLBACK') {
          status = prescription.isVerified ? 'verified' : 'pending';
          topicId = prescription.hederaTopicId || (prescription.hederaTransactionId.split('@')[0]);
        }

        const isDispensed = prescription.deliveryStatus === 'delivered';
        registryData.push({
          id: prescription.id,
          type: isDispensed ? 'dispensation' : 'prescription',
          consensusTimestamp: prescription.hederaTimestamp || (isDispensed ? prescription.updatedAt : prescription.createdAt),
          transactionId: prescription.hederaTransactionId || null,
          topicId: topicId,
          sequenceNumber: prescription.hederaSequenceNumber || null,
          hash: prescription.deliveryConfirmationHash || null,
          status: status,
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
            size: JSON.stringify(prescription.toJSON()).length,
            fees: isDispensed ? '0.0002 HBAR' : '0.0001 HBAR',
            node: '0.0.3', // Consistent node for testnet
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
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const { format = 'json', type = 'all', dateRange = '30days' } = req.query;

    // Construire le whereClause directement
    let whereClause = {};

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

    const exportData = [];

    // Récupérer les données sans limite
    if (type === 'all' || type === 'medical_record') {
      const records = await MedicalRecord.findAll({
        where: whereClause,
        include: [
          { model: BaseUser, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: BaseUser, as: 'doctor', attributes: ['id', 'firstName', 'lastName', 'email'] }
        ],
        order: [['createdAt', 'DESC']]
      });

      records.forEach(record => {
        exportData.push({
          id: record.id,
          type: 'medical_record',
          timestamp: record.createdAt,
          transactionId: record.hederaTransactionId,
          hash: record.hash,
          status: record.isVerified ? 'verified' : 'pending',
          patientId: record.patientId,
          patientName: `${record.patient?.firstName} ${record.patient?.lastName}`,
          doctorId: record.doctorId,
          doctorName: `${record.doctor?.firstName} ${record.doctor?.lastName}`,
          recordType: record.type,
          title: record.title
        });
      });
    }

    if (type === 'all' || type === 'prescription') {
      const prescriptions = await Prescription.findAll({
        where: { ...whereClause, matricule: { [Op.not]: null } },
        include: [
          { model: BaseUser, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'email'] },
          { model: BaseUser, as: 'doctor', attributes: ['id', 'firstName', 'lastName', 'email'] }
        ],
        order: [['createdAt', 'DESC']]
      });

      prescriptions.forEach(prescription => {
        exportData.push({
          id: prescription.id,
          type: 'prescription',
          timestamp: prescription.createdAt,
          transactionId: prescription.hederaTransactionId,
          hash: prescription.deliveryConfirmationHash,
          status: prescription.isVerified ? 'verified' : 'pending',
          matricule: prescription.matricule,
          patientId: prescription.patientId,
          patientName: `${prescription.patient?.firstName} ${prescription.patient?.lastName}`,
          doctorId: prescription.doctorId,
          doctorName: `${prescription.doctor?.firstName} ${prescription.doctor?.lastName}`,
          medication: prescription.medication,
          dosage: prescription.dosage,
          deliveryStatus: prescription.deliveryStatus
        });
      });
    }

    if (format === 'csv') {
      // Conversion en CSV
      if (exportData.length === 0) {
        return res.status(404).json({ success: false, message: 'Aucune donnée à exporter' });
      }

      const csvHeaders = Object.keys(exportData[0]).join(',');
      const csvRows = exportData.map(row =>
        Object.values(row).map(val => `"${val || ''}"`).join(',')
      ).join('\n');
      const csvContent = `${csvHeaders}\n${csvRows}`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="registry-export-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send('\ufeff' + csvContent); // BOM pour UTF-8
    } else {
      // Export JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="registry-export-${new Date().toISOString().split('T')[0]}.json"`);
      return res.json({
        exportedAt: new Date().toISOString(),
        filters: { type, dateRange },
        totalRecords: exportData.length,
        data: exportData
      });
    }

  } catch (error) {
    logger.error('Error exporting registry data:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'export des données',
      error: error.message
    });
  }
};

// Nouvelle fonction pour mettre à jour le statut système
exports.updateSystemStatus = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const { component, status, reason } = req.body;

    // Validation
    if (!component || !status) {
      return res.status(400).json({
        success: false,
        message: 'Component et status sont requis'
      });
    }

    // Valider les valeurs
    const validComponents = ['database', 'hedera', 'websocket', 'api', 'blockchain', 'storage', 'authentication'];
    const validStatuses = ['operational', 'degraded', 'outage', 'maintenance'];

    if (!validComponents.includes(component)) {
      return res.status(400).json({
        success: false,
        message: `Component invalide. Valeurs acceptées: ${validComponents.join(', ')}`
      });
    }

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status invalide. Valeurs acceptées: ${validStatuses.join(', ')}`
      });
    }

    // Enregistrer dans la table SystemStatus
    const statusUpdate = await SystemStatus.create({
      component,
      status,
      reason,
      updatedBy: req.user.id,
      timestamp: new Date()
    });

    logger.info(`System status updated by admin ${req.user.id}: ${component} -> ${status}`);

    res.json({
      success: true,
      statusUpdate
    });

  } catch (error) {
    logger.error('Error updating system status:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut',
      error: error.message
    });
  }
};

// Nouvelle fonction pour obtenir les logs système
exports.getSystemLogs = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const {
      level = 'all',
      limit = 100,
      offset = 0,
      startDate,
      endDate
    } = req.query;

    // Construction du filtre de date
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) {
        dateFilter.timestamp[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        dateFilter.timestamp[Op.lte] = new Date(endDate);
      }
    }

    // Récupérer les logs depuis SystemStatus
    const logs = await SystemStatus.findAll({
      where: dateFilter,
      include: [
        {
          model: BaseUser,
          as: 'updater',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalLogs = await SystemStatus.count({ where: dateFilter });

    // Formater les logs pour l'affichage
    const formattedLogs = logs.map(log => ({
      id: log.id,
      timestamp: log.timestamp,
      level: log.status === 'operational' ? 'info' : log.status === 'degraded' ? 'warn' : 'error',
      component: log.component,
      status: log.status,
      message: log.reason || `Status changed to ${log.status}`,
      admin: log.updater ? `${log.updater.firstName} ${log.updater.lastName}` : 'System',
      metadata: log.metadata
    }));

    res.json({
      success: true,
      logs: formattedLogs,
      pagination: {
        total: totalLogs,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + formattedLogs.length < totalLogs
      }
    });

  } catch (error) {
    logger.error('Error fetching system logs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des logs',
      error: error.message
    });
  }
};

// Gestion des utilisateurs
exports.getAllUsers = async (req, res) => {
  try {
    const { role, isActive, search } = req.query;

    let whereClause = {};

    if (role) {
      whereClause.role = role;
    }

    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const users = await BaseUser.findAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      users,
      total: users.length
    });

  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs'
    });
  }
};

exports.createUser = async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      role,
      dateOfBirth,
      address,
      specialization,
      licenseNumber
    } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email, mot de passe, prénom, nom et rôle sont obligatoires'
      });
    }

    // Vérifier que l'email n'existe pas déjà
    const existingUser = await BaseUser.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }

    // Valider le rôle
    const validRoles = ['patient', 'doctor', 'pharmacy', 'admin', 'assistant', 'radiologist'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rôle invalide'
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const user = await BaseUser.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phoneNumber,
      role,
      dateOfBirth,
      address,
      specialization: role === 'doctor' ? specialization : null,
      licenseNumber: role === 'doctor' || role === 'pharmacy' ? licenseNumber : null,
      isActive: true
    });

    logger.info(`New user created by admin ${req.user.id}: ${user.email} (${user.role})`);

    // Retourner sans le mot de passe
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      user: userResponse
    });

  } catch (error) {
    logger.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'utilisateur'
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      firstName,
      lastName,
      phoneNumber,
      dateOfBirth,
      address,
      specialization,
      licenseNumber,
      isActive
    } = req.body;

    const user = await BaseUser.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Ne pas permettre de modifier le rôle ou l'email via cette route
    await user.update({
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      phoneNumber: phoneNumber !== undefined ? phoneNumber : user.phoneNumber,
      dateOfBirth: dateOfBirth !== undefined ? dateOfBirth : user.dateOfBirth,
      address: address !== undefined ? address : user.address,
      specialization: specialization !== undefined ? specialization : user.specialization,
      licenseNumber: licenseNumber !== undefined ? licenseNumber : user.licenseNumber,
      isActive: isActive !== undefined ? isActive : user.isActive
    });

    logger.info(`User ${userId} updated by admin ${req.user.id}`);

    const userResponse = user.toJSON();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      user: userResponse
    });

  } catch (error) {
    logger.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'utilisateur'
    });
  }
};

exports.resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    const user = await BaseUser.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    logger.info(`Password reset for user ${userId} by admin ${req.user.id}`);

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });

  } catch (error) {
    logger.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réinitialisation du mot de passe'
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await BaseUser.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Ne pas permettre de supprimer son propre compte
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte'
      });
    }

    // Désactiver au lieu de supprimer (soft delete)
    await user.update({ isActive: false });

    logger.info(`User ${userId} deactivated by admin ${req.user.id}`);

    res.json({
      success: true,
      message: 'Utilisateur désactivé avec succès'
    });

  } catch (error) {
    logger.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'utilisateur'
    });
  }
};