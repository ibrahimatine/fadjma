const { sequelize } = require('./src/models');

async function addColumns() {
  try {
    console.log('🔄 Ajout des nouvelles colonnes à Prescriptions...');

    // Ajouter les colonnes une par une
    await sequelize.query(`
      ALTER TABLE Prescriptions
      ADD COLUMN isVerified BOOLEAN DEFAULT 0;
    `).catch(() => console.log('   isVerified existe déjà'));

    await sequelize.query(`
      ALTER TABLE Prescriptions
      ADD COLUMN verifiedAt DATETIME NULL;
    `).catch(() => console.log('   verifiedAt existe déjà'));

    await sequelize.query(`
      ALTER TABLE Prescriptions
      ADD COLUMN hederaSequenceNumber VARCHAR(255) NULL;
    `).catch(() => console.log('   hederaSequenceNumber existe déjà'));

    await sequelize.query(`
      ALTER TABLE Prescriptions
      ADD COLUMN hederaTopicId VARCHAR(255) NULL;
    `).catch(() => console.log('   hederaTopicId existe déjà'));

    console.log('✅ Colonnes ajoutées avec succès');

    // Vérifier la structure
    const [results] = await sequelize.query(`PRAGMA table_info(Prescriptions);`);
    console.log('📋 Structure de la table Prescriptions:');
    results.forEach(col => {
      if (['isVerified', 'verifiedAt', 'hederaSequenceNumber', 'hederaTopicId'].includes(col.name)) {
        console.log(`   ✅ ${col.name}: ${col.type}`);
      }
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

addColumns();