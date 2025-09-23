const { User } = require('../models');
const { Op } = require('sequelize');

// 📌 Liste tous les patients (pagination + recherche optionnelle)
exports.getAllPatients = async (req, res) => {
  try {
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    const where = { role: 'patient' };

    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phoneNumber: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const patients = await User.findAndCountAll({
      where,
      attributes: [
        'id',
        'firstName',
        'lastName',
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['lastName', 'ASC']]
    });

    res.json({
      patients: patients.rows,
      total: patients.count,
      page: parseInt(page),
      totalPages: Math.ceil(patients.count / limit)
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 📌 Récupère un patient par son ID
exports.getPatientById = async (req, res) => {
  try {
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const patient = await User.findOne({
      where: { id: req.params.id, role: 'patient' },
      attributes: [
        'id',
        'firstName',
        'lastName',
        'email',
        'dateOfBirth',
        'gender',
        'address',
        'phoneNumber',
        'emergencyContactName',
        'emergencyContactPhone',
        'socialSecurityNumber'
      ]
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json(patient);
  } catch (error) {
    console.error('Get patient by ID error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
