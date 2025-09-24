const express = require('express');
const router = express.Router();
const accessController = require('../controllers/accessController');
const auth = require('../middleware/auth');
const { body, param, query } = require('express-validator');

// All routes require authentication
router.use(auth);

// Validation rules
const createAccessRequestValidation = [
  body('patientId')
    .isUUID()
    .withMessage('patientId must be a valid UUID'),
  body('reason')
    .optional()
    .isLength({ min: 3, max: 500 })
    .withMessage('Reason must be between 3 and 500 characters'),
  body('accessLevel')
    .optional()
    .isIn(['read', 'write'])
    .withMessage('Access level must be read or write'),
  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('expiresAt must be a valid date')
];

const updateAccessRequestValidation = [
  param('id').isUUID().withMessage('Request ID must be a valid UUID'),
  body('status')
    .isIn(['approved', 'rejected'])
    .withMessage('Status must be approved or rejected'),
  body('reviewNotes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Review notes cannot exceed 1000 characters')
];

// Routes

// POST /api/access-requests - Create new access request
router.post('/', createAccessRequestValidation, accessController.createAccessRequest);

// GET /api/access-requests - Get access requests (with filters)
router.get('/', accessController.getAccessRequests);

// GET /api/access-requests/:id - Get specific access request
router.get('/:id',
  param('id').isUUID().withMessage('Request ID must be a valid UUID'),
  accessController.getAccessRequestById
);

// PUT /api/access-requests/:id - Update access request (approve/reject)
router.put('/:id', updateAccessRequestValidation, accessController.updateAccessRequest);

// DELETE /api/access-requests/:id - Cancel access request
router.delete('/:id',
  param('id').isUUID().withMessage('Request ID must be a valid UUID'),
  accessController.cancelAccessRequest
);

// GET /api/access-requests/patient/:patientId - Get requests for specific patient
router.get('/patient/:patientId',
  param('patientId').isUUID().withMessage('Patient ID must be a valid UUID'),
  accessController.getRequestsForPatient
);

// GET /api/access-requests/requester/:requesterId - Get requests by specific requester
router.get('/requester/:requesterId',
  param('requesterId').isUUID().withMessage('Requester ID must be a valid UUID'),
  accessController.getRequestsByRequester
);

// GET /api/access-requests/check/:patientId - Check if requester has access to patient's records
router.get('/check/:patientId',
  param('patientId').isUUID().withMessage('Patient ID must be a valid UUID'),
  accessController.checkMedicalRecordAccess
);

module.exports = router;