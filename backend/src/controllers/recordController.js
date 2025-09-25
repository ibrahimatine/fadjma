const { MedicalRecord, BaseUser, MedicalRecordAccessRequest, Prescription } = require('../models');
const hederaService = require('../services/hederaService');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, patientId } = req.query;
    const offset = (page - 1) * limit;
    
    const where = {};
    
    // Filter by user role
    if (req.user.role === 'patient') {
      where.patientId = req.user.id;
    } else if (req.user.role === 'doctor') {
      if (patientId) {
        // Check if doctor has access to this specific patient
        const hasAccess = await MedicalRecordAccessRequest.findOne({
          where: {
            patientId,
            requesterId: req.user.id,
            status: 'approved',
            [Op.or]: [
              { expiresAt: null },
              { expiresAt: { [Op.gt]: new Date() } }
            ]
          }
        });

        if (hasAccess) {
          where.patientId = patientId;
        } else {
          // No access to this patient, return empty results
          return res.json({
            records: [],
            total: 0,
            page: parseInt(page),
            totalPages: 0
          });
        }
      } else {
        // Get all patients the doctor has access to
        const accessiblePatients = await MedicalRecordAccessRequest.findAll({
          where: {
            requesterId: req.user.id,
            status: 'approved',
            [Op.or]: [
              { expiresAt: null },
              { expiresAt: { [Op.gt]: new Date() } }
            ]
          },
          attributes: ['patientId']
        });

        const patientIds = accessiblePatients.map(access => access.patientId);

        if (patientIds.length > 0) {
          where.patientId = { [Op.in]: patientIds };
        } else {
          // No access to any patients, return empty results
          return res.json({
            records: [],
            total: 0,
            page: parseInt(page),
            totalPages: 0
          });
        }
      }
    }

    // Additional filters
    if (type) where.type = type;
    
    const records = await MedicalRecord.findAndCountAll({
      where,
      include: [
        { model: BaseUser, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'address'] },
        { model: BaseUser, as: 'doctor', attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'address'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      records: records.rows,
      total: records.count,
      page: parseInt(page),
      totalPages: Math.ceil(records.count / limit)
    });
  } catch (error) {
    console.error('Get records error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// New endpoint: Get records grouped by patient for doctors
exports.getGroupedByPatient = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Access denied - doctors only' });
    }

    // Get all patients the doctor has access to
    const accessiblePatients = await MedicalRecordAccessRequest.findAll({
      where: {
        requesterId: req.user.id,
        status: 'approved',
        [Op.or]: [
          { expiresAt: null },
          { expiresAt: { [Op.gt]: new Date() } }
        ]
      },
      attributes: ['patientId']
    });

    const patientIds = accessiblePatients.map(access => access.patientId);

    if (patientIds.length === 0) {
      return res.json({
        patients: [],
        total: 0,
        page: parseInt(page),
        totalPages: 0
      });
    }

    // Get all records for these patients
    const records = await MedicalRecord.findAll({
      where: {
        patientId: { [Op.in]: patientIds }
      },
      include: [
        {
          model: BaseUser,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'address']
        },
        {
          model: BaseUser,
          as: 'doctor',
          attributes: ['id', 'firstName', 'lastName']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Group records by patient
    const groupedData = {};

    records.forEach(record => {
      const patientId = record.patientId;

      if (!groupedData[patientId]) {
        groupedData[patientId] = {
          patient: record.patient,
          records: [],
          totalRecords: 0,
          lastRecordDate: null,
          recordTypes: new Set()
        };
      }

      groupedData[patientId].records.push(record);
      groupedData[patientId].totalRecords++;
      groupedData[patientId].recordTypes.add(record.type);

      // Update last record date
      const recordDate = new Date(record.createdAt);
      if (!groupedData[patientId].lastRecordDate || recordDate > groupedData[patientId].lastRecordDate) {
        groupedData[patientId].lastRecordDate = recordDate;
      }
    });

    // Convert to array and add summary data
    const patientsWithRecords = Object.values(groupedData).map(patientData => ({
      patient: patientData.patient,
      records: patientData.records,
      summary: {
        totalRecords: patientData.totalRecords,
        lastRecordDate: patientData.lastRecordDate,
        recordTypes: Array.from(patientData.recordTypes),
        recentRecords: patientData.records.slice(0, 3) // Last 3 records for preview
      }
    }));

    // Sort by last record date (most recent first)
    patientsWithRecords.sort((a, b) => new Date(b.summary.lastRecordDate) - new Date(a.summary.lastRecordDate));

    // Apply pagination
    const totalPatients = patientsWithRecords.length;
    const paginatedPatients = patientsWithRecords.slice(offset, offset + parseInt(limit));

    res.json({
      patients: paginatedPatients,
      total: totalPatients,
      page: parseInt(page),
      totalPages: Math.ceil(totalPatients / limit)
    });

  } catch (error) {
    console.error('Get grouped records error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const record = await MedicalRecord.findByPk(req.params.id, {
      include: [
        { model: BaseUser, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'address'] },
        { model: BaseUser, as: 'doctor', attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'address'] }
      ]
    });
    
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }
    
    // Check access rights
    if (req.user.role === 'patient' && record.patientId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'doctor' && record.patientId !== req.user.id) {
      // Check if doctor has access to this patient's records
      const hasAccess = await MedicalRecordAccessRequest.findOne({
        where: {
          patientId: record.patientId,
          requesterId: req.user.id,
          status: 'approved',
          [Op.or]: [
            { expiresAt: null },
            { expiresAt: { [Op.gt]: new Date() } }
          ]
        }
      });

      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied - no permission to view this patient\'s records' });
      }
    }
    
    res.json(record);
  } catch (error) {
    console.error('Get record error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { type, title, description, diagnosis, prescription, metadata } = req.body;
    
    // Determine patient and doctor IDs
    let patientId, doctorId;
    
    if (req.user.role === 'patient') {
      patientId = req.user.id;
      // For demo, assign to first available doctor
      const doctor = await BaseUser.findOne({ where: { role: 'doctor' } });
      doctorId = doctor ? doctor.id : req.user.id;
    } else if (req.user.role === 'doctor') {
      doctorId = req.user.id;
      patientId = req.body.patientId || req.user.id; // Doctor must specify patient
    } else {
      return res.status(403).json({ message: 'Only patients and doctors can create records' });
    }
    
    // Create record
    const record = await MedicalRecord.create({
      patientId,
      doctorId,
      type,
      title,
      description,
      diagnosis,
      prescription,
      metadata: metadata || {}
    });
    
    // Anchor to Hedera
    try {
      console.log('Anchoring record to Hedera...');
      const hederaResult = await hederaService.anchorRecord(record);
      
      // Update record with Hedera info
      await record.update({
        hash: hederaResult.hash,
        hederaTransactionId: hederaResult.topicId,
        hederaSequenceNumber: hederaResult.sequenceNumber,
        hederaTimestamp: new Date(),
        isVerified: true
      });
      
      console.log('Record anchored successfully:', hederaResult);
    } catch (hederaError) {
      console.error('Hedera anchoring failed:', hederaError);
      // Continue without Hedera for now
    }
    
    // Reload with associations
    const fullRecord = await MedicalRecord.findByPk(record.id, {
      include: [
        { model: BaseUser, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'address'] },
        { model: BaseUser, as: 'doctor', attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'address'] }
      ]
    });

    // Send WebSocket notification for new medical record
    if (req.io && fullRecord) {
      // Notify the patient if the record was created by a doctor
      if (req.user.role === 'doctor' && patientId !== doctorId) {
        req.io.notifyUser(patientId, {
          type: 'new_medical_record',
          title: 'Nouveau dossier médical',
          message: `Un nouveau dossier médical a été ajouté à votre dossier : ${title}`,
          data: {
            recordId: fullRecord.id,
            recordTitle: title,
            recordType: type,
            doctorName: `${fullRecord.doctor.firstName} ${fullRecord.doctor.lastName}`
          }
        });
      }

      // Broadcast to all connected users (except the creator) about the new record
      req.io.notifyNewMedicalRecord(patientId, {
        id: fullRecord.id,
        title: fullRecord.title,
        type: fullRecord.type,
        patientName: `${fullRecord.patient.firstName} ${fullRecord.patient.lastName}`,
        doctorName: `${fullRecord.doctor.firstName} ${fullRecord.doctor.lastName}`,
        createdAt: fullRecord.createdAt
      }, doctorId);

      console.log(`📄 WebSocket notifications sent for new medical record: ${fullRecord.id}`);
    }

    res.status(201).json(fullRecord);
  } catch (error) {
    console.error('Create record error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const record = await MedicalRecord.findByPk(req.params.id);
    
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }
    
    // Check permissions
    if (req.user.role === 'patient' && record.patientId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (req.user.role === 'doctor' && record.doctorId !== req.user.id) {
      return res.status(403).json({ message: 'Only the assigned doctor can update this record' });
    }
    
    // Update record
    await record.update(req.body);
    
    // Re-anchor to Hedera
    try {
      const hederaResult = await hederaService.anchorRecord(record);
      await record.update({
        hash: hederaResult.hash,
        hederaTransactionId: hederaResult.topicId,
        hederaSequenceNumber: hederaResult.sequenceNumber,
        hederaTimestamp: new Date()
      });
    } catch (hederaError) {
      console.error('Hedera re-anchoring failed:', hederaError);
    }
    
    // Reload with associations
    const fullRecord = await MedicalRecord.findByPk(record.id, {
      include: [
        { model: BaseUser, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'address'] },
        { model: BaseUser, as: 'doctor', attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'address'] }
      ]
    });
    
    res.json(fullRecord);
  } catch (error) {
    console.error('Update record error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const record = await MedicalRecord.findByPk(req.params.id);

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Check permissions (only admin or assigned doctor)
    if (req.user.role !== 'admin' && req.user.role === 'doctor' && record.doctorId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await record.destroy();

    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Delete record error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getPrescriptionsByRecordId = async (req, res) => {
  try {
    const { id: recordId } = req.params;

    // Vérifier que le dossier médical existe
    const record = await MedicalRecord.findByPk(recordId);
    if (!record) {
      return res.status(404).json({ message: 'Dossier médical non trouvé' });
    }

    // Vérifier les droits d'accès au dossier
    if (req.user.role === 'patient' && record.patientId !== req.user.id) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    if (req.user.role === 'doctor') {
      // Vérifier que le médecin a accès à ce patient
      const hasAccess = await MedicalRecordAccessRequest.findOne({
        where: {
          patientId: record.patientId,
          requesterId: req.user.id,
          status: 'approved',
          [Op.or]: [
            { expiresAt: null },
            { expiresAt: { [Op.gt]: new Date() } }
          ]
        }
      });

      if (!hasAccess && record.doctorId !== req.user.id) {
        return res.status(403).json({ message: 'Accès refusé - pas de permission pour voir ce dossier' });
      }
    }

    // Récupérer les prescriptions liées à ce dossier médical
    const prescriptions = await Prescription.findAll({
      where: { medicalRecordId: recordId },
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
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      prescriptions,
      recordId,
      total: prescriptions.length
    });

  } catch (error) {
    console.error('Get prescriptions by record ID error:', error);
    res.status(500).json({
      message: 'Erreur serveur lors de la récupération des prescriptions',
      error: error.message
    });
  }
};