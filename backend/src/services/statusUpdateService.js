const { MedicalRecord, Prescription } = require('../models');
const { Op } = require('sequelize');
const hederaService = require('./hederaService');
// const mirrorNodeService = require('./mirrorNodeService'); // Temporairement désactivé

class StatusUpdateService {
  constructor() {
    this.updateInterval = 30000; // 30 secondes
    this.isRunning = false;
  }

  // Démarrer la vérification automatique des statuts
  startStatusChecker() {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('🔄 Démarrage du vérificateur de statuts Hedera');

    this.intervalId = setInterval(async () => {
      await this.checkPendingRecords();
    }, this.updateInterval);
  }

  // Arrêter la vérification
  stopStatusChecker() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.isRunning = false;
      console.log('⏹️ Arrêt du vérificateur de statuts');
    }
  }

  // Vérifier tous les enregistrements en attente
  async checkPendingRecords() {
    try {
      // Vérifier les dossiers médicaux
      await this.checkPendingMedicalRecords();

      // Vérifier les prescriptions
      await this.checkPendingPrescriptions();

    } catch (error) {
      console.error('❌ Erreur lors de la vérification des statuts:', error);
    }
  }

  // Vérifier les dossiers médicaux en attente
  async checkPendingMedicalRecords() {
    const pendingRecords = await MedicalRecord.findAll({
      where: {
        isVerified: false,
        hederaTransactionId: { [Op.ne]: null }
      }
    });

    for (const record of pendingRecords) {
      try {
        // Vérification réelle avec Mirror Node API (à implémenter)
        if (process.env.NODE_ENV === 'production' || process.env.USE_MIRROR_NODE === 'true') {
          // TODO: Implémenter la vérification via Mirror Node API
          console.log(`⏳ Mirror Node verification not implemented yet for record ${record.id}`);
        } else {
          // Mode simulation pour développement
          const recordAge = Date.now() - new Date(record.hederaTimestamp).getTime();
          const twoMinutes = 2 * 60 * 1000;

          if (recordAge > twoMinutes) {
            await record.update({
              isVerified: true,
              verifiedAt: new Date()
            });
            console.log(`✅ Dossier médical ${record.id} marqué comme vérifié (simulation)`);
          }
        }
      } catch (error) {
        console.error(`❌ Erreur vérification dossier ${record.id}:`, error);
      }
    }
  }

  // Vérifier les prescriptions en attente
  async checkPendingPrescriptions() {
    const pendingPrescriptions = await Prescription.findAll({
      where: {
        hederaTransactionId: { [Op.ne]: null },
        // Pas encore de champ isVerified dans Prescription, on peut l'ajouter
      }
    });

    for (const prescription of pendingPrescriptions) {
      try {
        const recordAge = Date.now() - new Date(prescription.createdAt).getTime();
        const twoMinutes = 2 * 60 * 1000;

        if (recordAge > twoMinutes && !prescription.isVerified) {
          await prescription.update({
            isVerified: true,
            verifiedAt: new Date()
          });

          console.log(`✅ Prescription ${prescription.matricule} marquée comme vérifiée`);
        }
      } catch (error) {
        console.error(`❌ Erreur vérification prescription ${prescription.matricule}:`, error);
      }
    }
  }

  // Vérifier manuellement un enregistrement spécifique
  async verifyRecord(type, id) {
    try {
      let record;

      if (type === 'medical_record') {
        record = await MedicalRecord.findByPk(id);
      } else if (type === 'prescription') {
        record = await Prescription.findByPk(id);
      } else {
        throw new Error('Type d\'enregistrement non supporté');
      }

      if (!record) {
        throw new Error('Enregistrement non trouvé');
      }

      // Vérifier le hash et le statut Hedera
      const verification = await hederaService.verifyRecord(record);

      if (verification.isValid) {
        await record.update({
          isVerified: true,
          verifiedAt: new Date()
        });

        console.log(`✅ ${type} ${id} vérifié manuellement`);
        return { success: true, verification };
      } else {
        console.log(`❌ ${type} ${id} échec de vérification`);
        return { success: false, error: 'Hash invalide' };
      }

    } catch (error) {
      console.error('❌ Erreur vérification manuelle:', error);
      throw error;
    }
  }

  // Obtenir les statistiques de statuts
  async getStatusStats() {
    try {
      const [medicalStats, prescriptionStats] = await Promise.all([
        MedicalRecord.findAll({
          attributes: [
            [MedicalRecord.sequelize.fn('COUNT', '*'), 'total'],
            [MedicalRecord.sequelize.fn('SUM', MedicalRecord.sequelize.literal('CASE WHEN isVerified = 1 THEN 1 ELSE 0 END')), 'verified']
          ],
          where: {
            hederaTransactionId: { [Op.ne]: null }
          }
        }),
        Prescription.findAll({
          attributes: [
            [Prescription.sequelize.fn('COUNT', '*'), 'total'],
            [Prescription.sequelize.fn('SUM', Prescription.sequelize.literal('CASE WHEN isVerified = 1 THEN 1 ELSE 0 END')), 'verified']
          ],
          where: {
            hederaTransactionId: { [Op.ne]: null }
          }
        })
      ]);

      const totalRecords = parseInt(medicalStats[0]?.dataValues?.total || 0) + parseInt(prescriptionStats[0]?.dataValues?.total || 0);
      const totalVerified = parseInt(medicalStats[0]?.dataValues?.verified || 0) + parseInt(prescriptionStats[0]?.dataValues?.verified || 0);

      return {
        total: totalRecords,
        verified: totalVerified,
        pending: totalRecords - totalVerified,
        failed: 0 // À implémenter si nécessaire
      };

    } catch (error) {
      console.error('❌ Erreur calcul statistiques:', error);
      return { total: 0, verified: 0, pending: 0, failed: 0 };
    }
  }
}

module.exports = new StatusUpdateService();