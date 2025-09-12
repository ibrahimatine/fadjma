// backend/scripts/reset-database.js
require('dotenv').config();
const { sequelize } = require('../src/models');

async function resetDatabase() {
  try {
    console.log('🔄 Réinitialisation complète de la base de données...');
    
    // Force la suppression et recréation de toutes les tables
    await sequelize.sync({ force: true });
    
    console.log('✅ Base de données réinitialisée avec succès !');
    console.log('📝 Vous pouvez maintenant lancer npm run seed pour créer les données de test');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error);
    process.exit(1);
  }
}

resetDatabase();