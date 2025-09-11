const { MedicalRecord, User } = require('../models');
const hederaService = require('../services/hederaService');
const { validationResult } = require('express-validator');

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, patientId } = req.query;
    const offset = (page - 1) * limit;
    
    const where = {};
    
    // Filter by user role
    if (req.user.role === 'patient') {
      where.patientId = req.user.id;
    } else if (req.user.role === 'doctor') {
      // Doctors can see records they created or are assigned to
      where.doctorId = req.user.id;
    }
    
    // Additional filters
    if (type) where.type = type;
    if (patientId && req.user.role === 'doctor') where.patientId = patientId;
    
    const records = await MedicalRecord.findAndCountAll({
      where,
      include: [
        { model: User, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'doctor', attributes: ['id', 'firstName', 'lastName', 'email'] }
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

exports.getById = async (req, res) => {
  try {
    const record = await MedicalRecord.findByPk(req.params.id, {
      include: [
        { model: User, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'doctor', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ]
    });
    
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }
    
    // Check access rights
    if (req.user.role === 'patient' && record.patientId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
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
      const doctor = await User.findOne({ where: { role: 'doctor' } });
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
        { model: User, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'doctor', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ]
    });
    
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
        { model: User, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'doctor', attributes: ['id', 'firstName', 'lastName', 'email'] }
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