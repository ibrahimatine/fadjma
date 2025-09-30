const express = require('express');
const router = express.Router();
const prescriptionGroupController = require('../controllers/prescriptionGroupController');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize');

router.use(authMiddleware);

// Créer un groupe de prescriptions
router.post('/',
  authorize(['doctor']),
  prescriptionGroupController.createPrescriptionGroup
);

// Récupérer un groupe par matricule
router.get('/by-matricule/:groupMatricule',
  authorize(['patient', 'doctor', 'pharmacy']),
  prescriptionGroupController.getGroupByMatricule
);

// Obtenir les groupes d'un patient
router.get('/patient/my-groups',
  authorize(['patient']),
  prescriptionGroupController.getPatientGroups
);

// Obtenir les groupes créés par un médecin
router.get('/doctor/my-groups',
  authorize(['doctor']),
  prescriptionGroupController.getDoctorGroups
);

// Recherche pharmacie
router.get('/pharmacy/search/:groupMatricule',
  authorize(['pharmacy']),
  prescriptionGroupController.searchGroupForPharmacy
);

// Délivrer un groupe complet
router.put('/pharmacy/deliver/:groupMatricule',
  authorize(['pharmacy']),
  prescriptionGroupController.deliverPrescriptionGroup
);

module.exports = router;