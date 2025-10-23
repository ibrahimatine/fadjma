const express = require('express');
const router = express.Router();
const patienController = require('../controllers/patientContoller.js');
const auth = require('../middleware/auth');
const { body } = require('express-validator');


// All routes require authentication
router.use(auth);

// Routes
router.get('/', patienController.getAllPatients);
router.get('/accessible-patients', patienController.getAccessiblePatients); // Doit être avant /:id
router.get('/unclaimed/my', patienController.getMyUnclaimedPatients); // Doit être avant /:id
router.get('/:id', patienController.getPatientById);
router.get('/:id/stats', patienController.getPatientStats);

// Patient creation and linking routes
router.post('/create-unclaimed', [
  body('firstName').notEmpty().withMessage('Le prénom est requis'),
  body('lastName').notEmpty().withMessage('Le nom est requis'),
  body('dateOfBirth').optional().isISO8601().withMessage('Format de date invalide'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Genre invalide'),
  body('phoneNumber').optional().matches(/^[+]?[0-9\s\-()]{0,20}$/).withMessage('Format de téléphone invalide'),
  body('emergencyContactPhone').optional().matches(/^[+]?[0-9\s\-()]{0,20}$/).withMessage('Format de téléphone d\'urgence invalide')
], patienController.createUnclaimedPatient);

module.exports = router;
