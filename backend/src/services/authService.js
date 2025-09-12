const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn } = require('../config/jwt');
const logger = require('../utils/logger');
const hederaService = require('./hederaService');

exports.authService = {
  register: async (username, email, password, role) => {
    let hederaAccountId = null;
    if (role === 'doctor') {
      const hederaAccount = await hederaService.createAccount();
      hederaAccountId = hederaAccount.accountId.toString();
      logger.info(`Hedera account created for new doctor: ${hederaAccountId}`);
    }

    const user = await User.create({
      username,
      email,
      password,
      role,
      hederaAccountId,
    });

    const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, {
      expiresIn: jwtExpiresIn,
    });

    logger.info(`User registered: ${user.email}, Role: ${user.role}`);
    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        hederaAccountId: user.hederaAccountId,
      },
      token,
    };
  },

  login: async (email, password) => {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, {
      expiresIn: jwtExpiresIn,
    });

    logger.info(`User logged in: ${user.email}, Role: ${user.role}`);
    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        hederaAccountId: user.hederaAccountId,
      },
      token,
    };
  },

  getCurrentUser: async (userId) => {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'email', 'role', 'hederaAccountId'],
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  },
};