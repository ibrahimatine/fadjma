const { BaseUser } = require('../models'); // Utiliser BaseUser au lieu de User
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

exports.register = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      email, password, firstName, lastName, role = 'patient', licenseNumber,
      dateOfBirth, gender, address, phoneNumber, emergencyContactName, emergencyContactPhone, socialSecurityNumber,
      // Doctor specific fields
      specialty, hospital,
      // Pharmacy specific fields
      pharmacyName, pharmacyAddress
    } = req.body;

    // Check if user exists
    const existingUser = await BaseUser.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create user with role-specific fields
    const userData = {
      email,
      password,
      firstName,
      lastName,
      role,
      dateOfBirth,
      gender,
      address,
      phoneNumber,
      emergencyContactName,
      emergencyContactPhone,
      socialSecurityNumber
    };

    // Add role-specific fields
    if (role === 'doctor') {
      userData.licenseNumber = licenseNumber;
      userData.specialty = specialty;
      userData.hospital = hospital;
    } else if (role === 'pharmacy') {
      userData.licenseNumber = licenseNumber;
      userData.pharmacyName = pharmacyName;
      userData.pharmacyAddress = pharmacyAddress;
    }

    const user = await BaseUser.create(userData);

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
     console.error('Register error:', error);
    res.status(500).json({
      message: 'Server error',
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
    const user = await BaseUser.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON()
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
    const user = await BaseUser.findByPk(decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: user.toJSON() });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

exports.logout = (req, res) => {
  // Client-side will remove the token
  res.json({ message: 'Logout successful' });
};
