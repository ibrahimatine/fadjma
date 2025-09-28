const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');
const auth = require('../middleware/auth');
const { MedicalRecord, Prescription } = require('../models');
const hederaService = require('../services/hederaService');
const hashscanService = require('../services/hashscanService');
const hashService = require('../services/hashService');
const mirrorNodeService = require('../services/mirrorNodeService');

// Routes existantes (avec auth)
router.post('/record/:id', auth, verificationController.verifyRecord);
router.get('/history/:id', auth, verificationController.getVerificationHistory);

// Nouvelles routes HashScan

// GET /api/verify/hashscan-info - Informations générales HashScan (public)
router.get('/hashscan-info', (req, res) => {
  try {
    const demoInfo = hashscanService.getMainDemoUrl();
    res.json({
      success: true,
      data: demoInfo
    });
  } catch (error) {
    console.error('Error getting HashScan info:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/verify/record/:id - Vérifier un dossier médical avec HCS (auth required)
router.get('/record/:id', auth, async (req, res) => {
  try {
    const record = await MedicalRecord.findByPk(req.params.id);

    if (!record) {
      return res.status(404).json({ message: 'Dossier médical non trouvé' });
    }

    // Effectuer la vérification complète avec HCS
    const hcsVerification = await hashService.verifyHashWithHCS(record);

    // Générer les informations de vérification étendues
    const verification = {
      record: {
        id: record.id,
        type: record.type,
        hash: record.hash,
        isVerified: record.isVerified,
        hederaTimestamp: record.hederaTimestamp
      },
      hedera: {
        topicId: record.hederaTransactionId,
        sequenceNumber: record.hederaSequenceNumber,
        status: hcsVerification.isFullyVerified ? 'VERIFIED' : 'PENDING'
      },
      verification: {
        ...hcsVerification,
        topicUrl: hashscanService.getTopicUrl(record.hederaTransactionId),
        messageUrl: hashscanService.getTopicMessageUrl(
          record.hederaTransactionId,
          record.hederaSequenceNumber
        )
      }
    };

    res.json({ success: true, data: verification });

  } catch (error) {
    console.error('Record verification error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/verify/prescription/:matricule - Vérifier prescription (public)
router.get('/prescription/:matricule', async (req, res) => {
  try {
    const { matricule } = req.params;

    if (!/^PRX-\d{8}-[A-F0-9]{4}$/.test(matricule)) {
      return res.status(400).json({
        message: 'Format de matricule invalide. Format: PRX-YYYYMMDD-XXXX'
      });
    }

    const prescription = await Prescription.findOne({
      where: { matricule }
    });

    if (!prescription) {
      return res.status(404).json({
        message: 'Prescription non trouvée avec ce matricule'
      });
    }

    // Informations publiques limitées
    const verification = {
      prescription: {
        matricule: prescription.matricule,
        medication: prescription.medication,
        status: prescription.deliveryStatus,
        issueDate: prescription.issueDate
      },
      hedera: {
        isAnchored: !!prescription.hederaTransactionId,
        timestamp: prescription.hederaTimestamp
      },
      verification: {
        topicUrl: hashscanService.getTopicUrl(),
        message: prescription.hederaTransactionId ?
          'Prescription authentique vérifiée sur blockchain Hedera' :
          'Prescription en cours de traitement'
      }
    };

    res.json({ success: true, data: verification });

  } catch (error) {
    console.error('Prescription verification error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/verify/hcs-status/:transactionId - Vérifier le statut HCS d'une transaction (public)
router.get('/hcs-status/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { topicId, sequenceNumber } = req.query;

    if (!topicId || !sequenceNumber) {
      return res.status(400).json({
        message: 'topicId et sequenceNumber requis en paramètres de requête'
      });
    }

    // Vérifier le statut complet via Mirror Node
    const hcsStatus = await mirrorNodeService.verifyHCSTransactionStatus(
      transactionId,
      topicId,
      sequenceNumber
    );

    res.json({
      success: true,
      data: {
        transactionId,
        topicId,
        sequenceNumber,
        ...hcsStatus,
        verifiedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('HCS status verification error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/verify/topic-stats/:topicId - Statistiques d'un topic (public)
router.get('/topic-stats/:topicId', async (req, res) => {
  try {
    const { topicId } = req.params;

    const [details, stats] = await Promise.allSettled([
      mirrorNodeService.getTopicDetails(topicId),
      mirrorNodeService.getTopicStats(topicId)
    ]);

    const response = {
      topicId,
      details: details.status === 'fulfilled' ? details.value : { error: details.reason },
      stats: stats.status === 'fulfilled' ? stats.value : { error: stats.reason }
    };

    res.json({ success: true, data: response });

  } catch (error) {
    console.error('Topic stats error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/verify/demo-links - Liens de démonstration Quest 3 (public)
router.get('/demo-links', (req, res) => {
  try {
    const demoLinks = {
      title: 'FADJMA - Hedera Integration Demo Links',
      description: 'Live verification links for Quest 3 submission',
      links: {
        mainTopic: {
          url: hashscanService.getTopicUrl(),
          title: 'Main Hedera Topic - All FADJMA Records',
          description: 'View all medical records anchored to Hedera Consensus Service'
        },
        account: {
          url: hashscanService.getAccountUrl(),
          title: 'FADJMA Hedera Account',
          description: 'View the Hedera account used for transactions'
        },
        explorer: {
          url: 'https://hashscan.io/testnet',
          title: 'Hedera Testnet Explorer',
          description: 'General Hedera testnet explorer'
        }
      },
      questInfo: {
        quest: 'Quest 3: Rearden Digital Assets',
        bounty: '$2,000',
        topicId: '0.0.6854064',
        accountId: '0.0.6089195'
      }
    };

    res.json({ success: true, data: demoLinks });

  } catch (error) {
    console.error('Demo links error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;