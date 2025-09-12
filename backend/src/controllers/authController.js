const { authService } = require('../services/authService');
const logger = require('../utils/logger');

const register = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;
    const { user, token } = await authService.register(username, email, password, role);

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token,
    });
  } catch (error) {
    logger.error(`Error during registration: ${error.message}`);
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.login(email, password);

    res.status(200).json({
      message: 'Logged in successfully',
      user,
      token,
    });
  } catch (error) {
    logger.error(`Error during login: ${error.message}`);
    next(error);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    res.status(200).json({ user });
  } catch (error) {
    logger.error(`Error fetching current user: ${error.message}`);
    next(error);
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
};