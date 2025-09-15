require('dotenv').config();
const { sequelize } = require('../src/models');

async function migrateToSQLite() {
  try {
    console.log('🔄 Création de la base SQLite...');
    
    // Force la création des tables
    await sequelize.sync({ force: true });
    
    console.log('✅ Base SQLite créée avec succès !');
    console.log('📁 Fichier créé : backend/database.sqlite');
    console.log('');
    console.log('🎯 Prochaines étapes :');
    console.log('1. npm run seed (pour créer les données de test)');
    console.log('2. npm run dev (pour lancer le serveur)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

migrateToSQLite();