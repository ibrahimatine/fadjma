require('dotenv').config();
const { sequelize } = require('../src/models');
const fs = require('fs');
const path = require('path');

async function initSQLite() {
  try {
    // Supprimer l'ancienne base si elle existe
    const dbPath = path.join(__dirname, '../database.sqlite');
    if (fs.existsSync(dbPath)) {
      console.log('🔄 Suppression de l\'ancienne base...');
      fs.unlinkSync(dbPath);
    }
    
    console.log('🔄 Création de la nouvelle base SQLite...');
    
    // Créer les tables
    await sequelize.sync({ force: true });
    
    console.log('✅ Base SQLite créée avec succès !');
    console.log('📝 Lancez maintenant: npm run seed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

initSQLite();