const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/jwt');
const logger = require('../utils/logger');

module.exports = (req, res, next) => {
  const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error(`Token verification failed: ${error.message}`);
    res.status(401).json({ message: 'Token is not valid' });
  }
};