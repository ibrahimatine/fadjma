const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const medicationTraceabilityController = require('../controllers/medicationTraceabilityController');

// POST /api/medication/deliver - Remise médicament avec ancrage blockchain
router.post('/deliver', auth, medicationTraceabilityController.deliverMedication);

// GET /api/medication/trace/:matricule - Traçabilité complète d'un médicament
router.get('/trace/:matricule', medicationTraceabilityController.traceMedication);

module.exports = router;