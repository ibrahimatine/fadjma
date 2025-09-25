const jwt = require('jsonwebtoken');
const { BaseUser, Patient, Doctor, Pharmacy } = require('../models');

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

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const baseUser = await BaseUser.findByPk(decoded.id);

    if (!baseUser || !baseUser.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    // Get complete user data with profile
    const user = await getUserWithProfile(baseUser);
    req.user = user;
    req.baseUser = baseUser; // Pour les cas où on a besoin du modèle Sequelize
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};