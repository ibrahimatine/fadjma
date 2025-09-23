const express = require('express');
const router = express.Router();
const pharmacyController = require('../controllers/pharmacyController');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize'); // Assuming an authorize middleware exists or will be created

// Get all prescriptions for the authenticated pharmacy
router.get(
  '/',
  authMiddleware,
  authorize(['pharmacy']),
  pharmacyController.getPharmacyPrescriptions
);

// Confirm drug delivery for a specific prescription
router.put(
  '/:prescriptionId/confirm-delivery',
  authMiddleware,
  authorize(['pharmacy']),
  pharmacyController.confirmDrugDelivery
);

module.exports = router;