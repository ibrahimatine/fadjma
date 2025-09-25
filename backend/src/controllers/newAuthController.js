const { BaseUser, Patient, Doctor, Pharmacy } = require('../models');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

const getUserWithProfile = async (baseUser) => {
  let profile = null;

  switch (baseUser.role) {
    case 'patient':
      profile = await Patient.findOne({ where: { baseUserId: baseUser.id } });
      break;
    case 'doctor':
      profile = await Doctor.findOne({ where: { baseUserId: baseUser.id } });
      break;
    case 'pharmacy':
      profile = await Pharmacy.findOne({ where: { baseUserId: baseUser.id } });
      break;
  }

  const userJson = baseUser.toJSON();
  if (profile) {
    userJson.profile = profile.toJSON();
  }

  return userJson;
};

exports.register = async (req, res) => {
  const transaction = await BaseUser.sequelize.transaction();

  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await transaction.rollback();
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      email, password, firstName, lastName, role,
      // Patient fields
      dateOfBirth, gender, emergencyContactName, emergencyContactPhone, socialSecurityNumber,
      // Doctor fields
      licenseNumber, specialty, hospital,
      // Pharmacy fields
      pharmacyName, pharmacyAddress,
      // Common fields
      phoneNumber, address
    } = req.body;

    console.log('📝 Registration data received:', { email, role, firstName, lastName });

    // Check if user exists
    const existingUser = await BaseUser.findOne({ where: { email } });
    if (existingUser) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create base user
    const baseUserData = {
      email,
      password,
      firstName,
      lastName,
      role,
      phoneNumber,
      address
    };

    const baseUser = await BaseUser.create(baseUserData, { transaction });
    console.log('✅ Base user created:', baseUser.id);

    // Create role-specific profile
    let profile = null;

    switch (role) {
      case 'patient':
        profile = await Patient.create({
          baseUserId: baseUser.id,
          dateOfBirth: dateOfBirth || null,
          gender: gender || null,
          emergencyContactName: emergencyContactName || null,
          emergencyContactPhone: emergencyContactPhone || null,
          socialSecurityNumber: socialSecurityNumber || null
        }, { transaction });
        console.log('✅ Patient profile created');
        break;

      case 'doctor':
        if (!licenseNumber || !specialty || !hospital) {
          await transaction.rollback();
          return res.status(400).json({
            message: 'License number, specialty and hospital are required for doctors'
          });
        }
        profile = await Doctor.create({
          baseUserId: baseUser.id,
          licenseNumber,
          specialty,
          hospital
        }, { transaction });
        console.log('✅ Doctor profile created');
        break;

      case 'pharmacy':
        if (!licenseNumber || !pharmacyName || !pharmacyAddress) {
          await transaction.rollback();
          return res.status(400).json({
            message: 'License number, pharmacy name and address are required for pharmacies'
          });
        }
        profile = await Pharmacy.create({
          baseUserId: baseUser.id,
          licenseNumber,
          pharmacyName,
          pharmacyAddress
        }, { transaction });
        console.log('✅ Pharmacy profile created');
        break;

      default:
        await transaction.rollback();
        return res.status(400).json({ message: 'Invalid role' });
    }

    await transaction.commit();

    // Generate token
    const token = generateToken(baseUser);

    // Get complete user data with profile
    const userData = await getUserWithProfile(baseUser);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: userData
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Register error:', error);

    let errorMessage = 'Server error';
    if (error.name === 'SequelizeUniqueConstraintError') {
      errorMessage = 'License number already exists';
    } else if (error.name === 'SequelizeValidationError') {
      errorMessage = error.errors[0]?.message || 'Validation error';
    }

    res.status(500).json({
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const baseUser = await BaseUser.findOne({ where: { email } });
    if (!baseUser) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await baseUser.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(baseUser);

    // Get complete user data with profile
    const userData = await getUserWithProfile(baseUser);

    res.json({
      message: 'Login successful',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const baseUser = await BaseUser.findByPk(decoded.id);

    if (!baseUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get complete user data with profile
    const userData = await getUserWithProfile(baseUser);

    res.json({ user: userData });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

exports.logout = (req, res) => {
  // Client-side will remove the token
  res.json({ message: 'Logout successful' });
};