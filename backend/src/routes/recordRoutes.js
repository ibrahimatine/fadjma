const express = require('express');
const router = express.Router();
const recordController = require('../controllers/recordController');
const auth = require('../middleware/auth');
const { body } = require('express-validator');

// Validation
const recordValidation = [
  body('type').isIn(['consultation', 'prescription', 'test_result', 'vaccination', 'allergy']),
  body('title').notEmpty().trim(),
  body('description').notEmpty().trim(),
  body('diagnosis').optional().trim()
];

// All routes require authentication
router.use(auth);

// Routes
router.get('/', recordController.getAll);
router.get('/:id', recordController.getById);
router.post('/', recordValidation, recordController.create);
router.put('/:id', recordValidation, recordController.update);
router.delete('/:id', recordController.delete);

module.exports = router;
