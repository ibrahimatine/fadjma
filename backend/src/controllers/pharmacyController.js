const { Prescription, User } = require('../models');
const hederaService = require('../services/hederaService');
const logger = require('../utils/logger');

exports.getPharmacyPrescriptions = async (req, res) => {
  try {
    const { id: pharmacyId } = req.user; // Assuming req.user is populated by auth middleware

    const prescriptions = await Prescription.findAll({
      where: { pharmacyId },
      include: [
        { model: User, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'doctor', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
      order: [['issueDate', 'DESC']],
    });

    res.status(200).json(prescriptions);
  } catch (error) {
    logger.error('Error fetching pharmacy prescriptions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.confirmDrugDelivery = async (req, res) => {
  try {
    const { id: pharmacyId } = req.user;
    const { prescriptionId } = req.params;

    const prescription = await Prescription.findOne({
      where: { id: prescriptionId, pharmacyId, deliveryStatus: 'pending' },
    });

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found or already delivered/cancelled' });
    }

    // Record delivery on Hedera
    const memo = `Drug delivery confirmed for Prescription ID: ${prescription.id} by Pharmacy ID: ${pharmacyId}`;
    const hederaTransactionId = await hederaService.submitMedicalRecord(memo); // Reusing submitMedicalRecord for simplicity, can create a specific one

    prescription.deliveryStatus = 'delivered';
    prescription.deliveryConfirmationHash = hederaTransactionId;
    await prescription.save();

    res.status(200).json({ message: 'Drug delivery confirmed and recorded on Hedera', prescription });
  } catch (error) {
    logger.error('Error confirming drug delivery:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};