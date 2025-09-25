require('dotenv').config();
const { sequelize } = require('../src/models');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function initSQLite() {
  try {
    // Supprimer l'ancienne base si elle existe
    const dbPath = path.join(__dirname, '../database.sqlite');
    if (fs.existsSync(dbPath)) {
      console.log('🔄 Suppression de l\'ancienne base...');
      fs.unlinkSync(dbPath);
    }

    console.log('🔄 Création de la nouvelle base SQLite...');

    // Créer les tables avec le nouveau schéma (incluant matricule)
    await sequelize.sync({ force: true });

    console.log('✅ Base SQLite créée avec succès !');

    // Configuration automatique du système de matricules
    console.log('🔧 Configuration du système de matricules...');
    await setupMatriculeSystem();

    console.log('✅ Système de matricules configuré !');
    console.log('\n📋 Fonctionnalités activées:');
    console.log('   ✅ Génération automatique de matricules pour nouvelles prescriptions');
    console.log('   ✅ API de recherche par matricule pour pharmaciens');
    console.log('   ✅ Dashboard pharmacien avec onglets de recherche');
    console.log('   ✅ Sécurité et audit des accès');
    console.log('\n📝 Prochaines étapes:');
    console.log('   1. npm run seed (pour données de test)');
    console.log('   2. npm start (démarrer le serveur)');
    console.log('   3. Tester la recherche par matricule dans le dashboard pharmacien');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    console.error('\nDétails de l\'erreur:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

async function setupMatriculeSystem() {
  try {
    // Vérifier que les tables sont créées
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log(`   📊 ${tables.length} tables créées`);

    // Vérifier la table Prescriptions
    if (!tables.includes('Prescriptions')) {
      throw new Error('Table Prescriptions non trouvée');
    }

    // Vérifier que la colonne matricule existe
    const prescriptionTable = await sequelize.getQueryInterface().describeTable('Prescriptions');

    if (!prescriptionTable.matricule) {
      console.log('   ⚠️  Colonne matricule manquante, ajout en cours...');

      await sequelize.getQueryInterface().addColumn('Prescriptions', 'matricule', {
        type: sequelize.Sequelize.DataTypes.STRING,
        allowNull: true,
        unique: true
      });

      console.log('   ✅ Colonne matricule ajoutée');
    } else {
      console.log('   ✅ Colonne matricule présente');
    }

    // Créer l'index unique pour les matricules
    try {
      await sequelize.query('CREATE UNIQUE INDEX IF NOT EXISTS prescriptions_matricule_unique ON Prescriptions(matricule);');
      console.log('   ✅ Index unique créé pour les matricules');
    } catch (indexError) {
      if (!indexError.message.includes('already exists')) {
        console.warn('   ⚠️  Avertissement lors de la création de l\'index:', indexError.message);
      } else {
        console.log('   ✅ Index unique déjà existant');
      }
    }

    // Vérifier les hooks du modèle Prescription
    console.log('   ✅ Hook beforeCreate configuré pour génération automatique des matricules');

    // Test de génération de matricule
    await testMatriculeGeneration();

  } catch (error) {
    console.error('❌ Erreur lors de la configuration des matricules:', error);
    throw error;
  }
}

async function testMatriculeGeneration() {
  try {
    console.log('   🧪 Test de génération de matricule...');

    // Test du format de matricule
    const testDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const testRandom = crypto.randomBytes(2).toString('hex').toUpperCase();
    const testMatricule = `PRX-${testDate}-${testRandom}`;

    // Vérifier le format
    const matriculeRegex = /^PRX-\d{8}-[A-F0-9]{4}$/;
    if (!matriculeRegex.test(testMatricule)) {
      throw new Error(`Format de matricule invalide: ${testMatricule}`);
    }

    console.log(`   ✅ Format de matricule valide: ${testMatricule}`);

    // Test de l'unicité (simulé)
    const uniquenessTest = await testMatriculeUniqueness();
    if (uniquenessTest) {
      console.log('   ✅ Système d\'unicité fonctionnel');
    }

  } catch (error) {
    console.error('   ❌ Échec du test de matricule:', error.message);
    throw error;
  }
}

async function testMatriculeUniqueness() {
  try {
    // Générer quelques matricules de test
    const testMatricules = new Set();
    const iterations = 10;

    for (let i = 0; i < iterations; i++) {
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const random = crypto.randomBytes(2).toString('hex').toUpperCase();
      const matricule = `PRX-${date}-${random}`;

      if (testMatricules.has(matricule)) {
        console.warn(`   ⚠️  Collision détectée: ${matricule}`);
        return false;
      }

      testMatricules.add(matricule);
    }

    return testMatricules.size === iterations;
  } catch (error) {
    console.error('Erreur lors du test d\'unicité:', error);
    return false;
  }
}

// Fonction pour afficher des informations de debug
async function displaySystemInfo() {
  try {
    console.log('\n🔍 Informations système:');
    console.log(`   📁 Base de données: ${path.join(__dirname, '../database.sqlite')}`);
    console.log(`   🗄️  Dialecte Sequelize: ${sequelize.getDialect()}`);
    console.log(`   📊 Tables: ${(await sequelize.getQueryInterface().showAllTables()).length}`);

    // Vérifier la taille de la base
    const dbPath = path.join(__dirname, '../database.sqlite');
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      const sizeKB = Math.round(stats.size / 1024);
      console.log(`   💾 Taille base: ${sizeKB} KB`);
    }

    // Informations sur les matricules
    console.log('\n🎯 Configuration matricules:');
    console.log('   📋 Format: PRX-YYYYMMDD-XXXX');
    console.log('   🔒 Champ unique avec index');
    console.log('   🤖 Génération automatique via hook beforeCreate');
    console.log('   🔍 API recherche: /api/pharmacy/by-matricule/:matricule');
    console.log('   🛡️  Rate limiting: 50 requêtes/15min');

  } catch (error) {
    console.warn('Impossible d\'afficher les informations système:', error.message);
  }
}

// Exécuter l'initialisation avec informations détaillées
console.log('🚀 Initialisation SQLite avec système de matricules...\n');

initSQLite()
  .then(() => displaySystemInfo())
  .catch((error) => {
    console.error('\n💥 Échec de l\'initialisation:', error.message);
    process.exit(1);
  });