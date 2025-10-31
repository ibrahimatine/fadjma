const { sequelize } = require('../models');

async function syncDatabase() {
  try {
    console.log('🔄 Synchronisation de la base de données...');

    // Force sync pour ajouter les nouvelles colonnes
    await sequelize.sync({ alter: true });

    console.log('✅ Base de données synchronisée avec succès');
    console.log('📝 Nouvelles colonnes ajoutées:');
    console.log('   - Prescription.isVerified');
    console.log('   - Prescription.verifiedAt');
    console.log('   - Prescription.hederaSequenceNumber');
    console.log('   - Prescription.hederaTopicId');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error);
    process.exit(1);
  }
}

syncDatabase();