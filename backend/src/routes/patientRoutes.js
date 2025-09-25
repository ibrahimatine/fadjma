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
router.get('/:id', patienController.getPatientById);
router.get('/:id/stats', patienController.getPatientStats);
// router.post('/', patienController.createPatient);
// router.put('/:id', patienController.updatePatient);
// router.delete('/:id', patienController.deletePatient);

module.exports = router;


