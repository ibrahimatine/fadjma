const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const nftService = require('../services/nftService');
const healthTokenService = require('../services/healthTokenService');
const reminderService = require('../services/reminderService');
const MedicalRecord = require('../models/MedicalRecord');

// Route pour créer un NFT de vaccination
router.post('/vaccination/:recordId', auth, async (req, res) => {
  try {
    const record = await MedicalRecord.findByPk(req.params.recordId);
    if (!record) {
      return res.status(404).json({ message: 'Dossier non trouvé' });
    }

    // Créer le NFT
    const nft = await nftService.createVaccinationCertificate(record);
    
    // Récompenser avec des tokens HEALTH
    const reward = await healthTokenService.rewardUser(
      req.user.id, 
      'VACCINATION'
    );

    // Programmer un rappel pour la prochaine dose
    let reminder = null;
    if (record.metadata?.nextDose) {
      reminder = await reminderService.scheduleVaccinationReminder(
        record.patientId,
        record.metadata
      );
    }

    res.json({
      success: true,
      nft,
      reward,
      reminder,
      message: 'Certificat NFT créé avec succès'
    });
  } catch (error) {
    console.error('Erreur création NFT:', error);
    res.status(500).json({ message: 'Erreur lors de la création du NFT' });
  }
});

// Route pour obtenir le solde de tokens HEALTH
router.get('/health-tokens/balance', auth, async (req, res) => {
  try {
    const balance = await healthTokenService.getUserBalance(req.user.id);
    const price = await healthTokenService.getTokenPrice();
    
    res.json({
      balance,
      symbol: 'HEALTH',
      valueUSD: (balance * price.priceUSD).toFixed(2),
      price
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur récupération solde' });
  }
});

// Route pour obtenir les rappels
router.get('/reminders', auth, async (req, res) => {
  try {
    const reminders = await reminderService.getPatientReminders(req.user.id);
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ message: 'Erreur récupération rappels' });
  }
});

module.exports = router;
