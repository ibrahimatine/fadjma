const express = require('express');
const router = express.Router();
const pharmacyController = require('../controllers/pharmacyController');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const {
  matriculeSearchLimit,
  validateMatriculeAccess,
  logFailedAccess,
  sanitizeResponse,
  validatePrescriptionPermissions
} = require('../middleware/prescriptionSecurity');

// Get all prescriptions for the authenticated pharmacy
router.get(
  '/',
  authMiddleware,
  authorize(['pharmacy']),
  pharmacyController.getPharmacyPrescriptions
);

// Get prescription by matricule (secure access for pharmacies)
router.get(
  '/by-matricule/:matricule',
  authMiddleware,
  authorize(['pharmacy']),
  matriculeSearchLimit,
  validateMatriculeAccess,
  logFailedAccess,
  sanitizeResponse,
  pharmacyController.getPrescriptionByMatricule
);

// Confirm drug delivery for a specific prescription
router.put(
  '/:prescriptionId/confirm-delivery',
  authMiddleware,
  authorize(['pharmacy']),
  validatePrescriptionPermissions,
  sanitizeResponse,
  pharmacyController.confirmDrugDelivery
);

// Nouvelle route: Confirmer délivrance par matricule
router.put(
  '/deliver/:matricule',
  authMiddleware,
  authorize(['pharmacy']),
  matriculeSearchLimit,
  validateMatriculeAccess,
  logFailedAccess,
  sanitizeResponse,
  pharmacyController.confirmDeliveryByMatricule
);

// Route pour obtenir les informations de matricule (médecins et patients)
router.get(
  '/prescription/:prescriptionId/matricule',
  authMiddleware,
  authorize(['doctor', 'patient']),
  sanitizeResponse,
  pharmacyController.getPrescriptionMatricule
);

module.exports = router;