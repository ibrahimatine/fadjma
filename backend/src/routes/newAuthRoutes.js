const express = require('express');
const router = express.Router();
const authController = require('../controllers/newAuthController');
const patientController = require('../controllers/patientContoller');
const { body } = require('express-validator');

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('role').isIn(['patient', 'doctor', 'pharmacy']),

  // Phone number validation (optional)
  body('phoneNumber')
    .optional()
    .matches(/^[+]?[0-9\s\-()]{0,20}$/i)
    .withMessage('Invalid phone number format'),

  // Conditional validations for role-specific fields
  body('licenseNumber')
    .if(body('role').isIn(['doctor', 'pharmacy']))
    .notEmpty()
    .withMessage('License number is required for doctors and pharmacists'),

  body('specialty')
    .if(body('role').equals('doctor'))
    .notEmpty()
    .withMessage('Specialty is required for doctors'),

  body('hospital')
    .if(body('role').equals('doctor'))
    .notEmpty()
    .withMessage('Hospital/Clinic is required for doctors'),

  body('pharmacyName')
    .if(body('role').equals('pharmacy'))
    .notEmpty()
    .withMessage('Pharmacy name is required for pharmacists'),

  body('pharmacyAddress')
    .if(body('role').equals('pharmacy'))
    .notEmpty()
    .withMessage('Pharmacy address is required for pharmacists'),

  // Patient-specific validations (optional)
  body('dateOfBirth')
    .if(body('role').equals('patient'))
    .optional()
    .isISO8601()
    .withMessage('Valid date of birth required'),

  body('gender')
    .if(body('role').equals('patient'))
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),

  body('emergencyContactPhone')
    .optional()
    .matches(/^[+]?[0-9\s\-()]{0,20}$/i)
    .withMessage('Invalid emergency contact phone number format')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

const linkPatientValidation = [
  body('patientIdentifier')
    .matches(/^PAT-\d{8}-[A-F0-9]{4}$/)
    .withMessage('Invalid patient identifier format'),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phoneNumber')
    .optional()
    .matches(/^[+]?[0-9\s\-()]{0,20}$/i)
    .withMessage('Invalid phone number format')
];

// Routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.get('/me', authController.getCurrentUser);
router.post('/logout', authController.logout);

// Patient identifier routes (public)
router.get('/verify-patient-identifier/:identifier', patientController.verifyPatientIdentifier);
router.post('/link-patient-identifier', linkPatientValidation, patientController.linkPatientIdentifier);

module.exports = router;