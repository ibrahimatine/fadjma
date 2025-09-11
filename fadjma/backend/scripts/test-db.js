require('dotenv').config();
const { sequelize } = require('../src/config/database');

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion PostgreSQL réussie!');
    
    // Sync les modèles
    await sequelize.sync({ alter: true });
    console.log('✅ Tables créées/mises à jour!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    console.log('Vérifiez votre configuration dans .env');
    process.exit(1);
  }
}

testConnection();