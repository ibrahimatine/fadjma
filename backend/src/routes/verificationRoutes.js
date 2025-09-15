const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Routes
router.post('/record/:id', verificationController.verifyRecord);
router.get('/history/:id', verificationController.getVerificationHistory);

module.exports = router;