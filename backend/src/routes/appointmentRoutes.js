const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Routes publiques (pour voir les spécialités et disponibilités)
router.get('/specialties', appointmentController.getSpecialties);
router.get('/specialties/:specialtyId/doctors', appointmentController.getDoctorsBySpecialty);
router.get('/doctors/:doctorId/availability', appointmentController.getDoctorAvailability);
router.get('/doctors/:doctorId/slots', appointmentController.getAvailableSlots);

// Routes authentifiées
router.use(authMiddleware);

// Routes Patients
router.post('/',
  authorize(['patient']),
  appointmentController.createAppointment
);

router.get('/my-appointments',
  authorize(['patient']),
  appointmentController.getMyAppointments
);

router.put('/:id/cancel',
  authorize(['patient', 'assistant']),
  appointmentController.cancelAppointment
);

// Routes Médecins
router.get('/doctor/appointments',
  authorize(['doctor']),
  appointmentController.getDoctorAppointments
);

router.put('/:id/confirm',
  authorize(['doctor', 'assistant']),
  appointmentController.confirmAppointment
);

router.put('/:id/complete',
  authorize(['doctor']),
  appointmentController.completeAppointment
);

// Routes Assistants
router.get('/assistant/appointments',
  authorize(['assistant']),
  appointmentController.getAssistantAppointments
);

router.post('/assistant/create-on-behalf',
  authorize(['assistant']),
  appointmentController.createAppointmentOnBehalf
);

router.get('/assistant/calls',
  authorize(['assistant']),
  appointmentController.getPhoneCalls
);

// Routes Admin - Gestion des spécialités
router.get('/admin/specialties',
  authorize(['admin']),
  appointmentController.getAllSpecialtiesForAdmin
);

router.get('/admin/available-specialties',
  authorize(['admin']),
  appointmentController.getAvailableMedicalSpecialties
);

router.post('/admin/specialties',
  authorize(['admin']),
  appointmentController.createSpecialty
);

router.put('/admin/specialties/:specialtyId',
  authorize(['admin']),
  appointmentController.updateSpecialty
);

module.exports = router;