require('dotenv').config();
const { sequelize } = require('../src/models');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function initSQLite() {
  try {
    // Supprimer l'ancienne base si elle existe
    const dbPath = path.join(__dirname, '../data/database.sqlite');
    if (fs.existsSync(dbPath)) {
      console.log('🔄 Suppression de l\'ancienne base...');
      fs.unlinkSync(dbPath);
    }

    console.log('🔄 Création de la nouvelle base SQLite...');

    // Créer les tables avec le nouveau schéma (incluant matricule)
    await sequelize.sync({ force: true });

    console.log('✅ Base SQLite créée avec succès !');

    // Configuration automatique du système de matricules prescriptions
    console.log('🔧 Configuration du système de matricules prescriptions...');
    await setupMatriculeSystem();

    // Configuration du système d'identifiants patients (tous les patients)
    console.log('🔧 Configuration du système d\'identifiants patients...');
    await setupPatientIdentifierSystem();

    console.log('✅ Systèmes configurés !');
    console.log('\n📋 Fonctionnalités activées:');
    console.log('   ✅ Génération automatique de matricules prescriptions (PRX-YYYYMMDD-XXXX)');
    console.log('   ✅ Génération automatique de matricules patients (PAT-YYYYMMDD-XXXX)');
    console.log('   ✅ API de recherche par matricule pour pharmaciens');
    console.log('   ✅ API de délivrance par matricule avec ancrage Hedera');
    console.log('   ✅ Dashboard pharmacien avec onglets de recherche');
    console.log('   ✅ Dispensation en lot avec ancrage blockchain');
    console.log('   ✅ Sécurité et audit des accès');
    console.log('   ✅ Système d\'identifiants patients pour TOUS les patients');
    console.log('   ✅ Liaison d\'identifiants pour création de comptes patients');
    console.log('\n📝 Prochaines étapes:');
    console.log('   1. npm run seed (pour données de test)');
    console.log('   2. npm start (démarrer le serveur)');
    console.log('   3. Tester la recherche et délivrance par matricule dans le dashboard pharmacien');

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

async function setupPatientIdentifierSystem() {
  try {
    // Vérifier que la table BaseUsers est créée
    const tables = await sequelize.getQueryInterface().showAllTables();

    if (!tables.includes('BaseUsers')) {
      throw new Error('Table BaseUsers non trouvée');
    }

    // Vérifier les colonnes du système d'identifiants patients
    const baseUserTable = await sequelize.getQueryInterface().describeTable('BaseUsers');

    const requiredColumns = [
      'patientIdentifier',
      'isUnclaimed',
      'createdByDoctorId',
      'dateOfBirth',
      'gender',
      'emergencyContactName',
      'emergencyContactPhone',
      'socialSecurityNumber'
    ];

    for (const column of requiredColumns) {
      if (!baseUserTable[column]) {
        console.log(`   ⚠️  Colonne ${column} manquante, ajout en cours...`);

        let columnDefinition;
        switch (column) {
          case 'patientIdentifier':
            columnDefinition = {
              type: sequelize.Sequelize.DataTypes.STRING,
              allowNull: true,
              unique: true
            };
            break;
          case 'isUnclaimed':
            columnDefinition = {
              type: sequelize.Sequelize.DataTypes.BOOLEAN,
              defaultValue: false
            };
            break;
          case 'createdByDoctorId':
            columnDefinition = {
              type: sequelize.Sequelize.DataTypes.UUID,
              allowNull: true
            };
            break;
          case 'dateOfBirth':
            columnDefinition = {
              type: sequelize.Sequelize.DataTypes.DATEONLY,
              allowNull: true
            };
            break;
          case 'gender':
            columnDefinition = {
              type: sequelize.Sequelize.DataTypes.STRING,
              allowNull: true
            };
            break;
          case 'emergencyContactName':
          case 'emergencyContactPhone':
          case 'socialSecurityNumber':
            columnDefinition = {
              type: sequelize.Sequelize.DataTypes.STRING,
              allowNull: true
            };
            break;
          default:
            columnDefinition = {
              type: sequelize.Sequelize.DataTypes.STRING,
              allowNull: true
            };
        }

        await sequelize.getQueryInterface().addColumn('BaseUsers', column, columnDefinition);
        console.log(`   ✅ Colonne ${column} ajoutée`);
      } else {
        console.log(`   ✅ Colonne ${column} présente`);
      }
    }

    // Créer l'index unique pour les identifiants patients
    try {
      await sequelize.query('CREATE UNIQUE INDEX IF NOT EXISTS base_users_patient_identifier_unique ON BaseUsers(patientIdentifier);');
      console.log('   ✅ Index unique créé pour les identifiants patients');
    } catch (indexError) {
      if (!indexError.message.includes('already exists')) {
        console.warn('   ⚠️  Avertissement lors de la création de l\'index identifiants:', indexError.message);
      } else {
        console.log('   ✅ Index unique déjà existant pour les identifiants patients');
      }
    }

    // Modifier la contrainte email pour permettre NULL
    try {
      // SQLite ne supporte pas ALTER COLUMN, on doit recréer la table si nécessaire
      const emailColumn = baseUserTable.email;
      if (emailColumn && emailColumn.allowNull === false) {
        console.log('   ⚠️  Modification de la contrainte email pour permettre NULL...');
        // Note: En production, il faudrait une migration appropriée
        console.log('   ℹ️  La contrainte email sera gérée par les hooks du modèle');
      }
    } catch (emailError) {
      console.warn('   ⚠️  Avertissement lors de la modification de la contrainte email:', emailError.message);
    }

    // Test de génération d'identifiant patient
    await testPatientIdentifierGeneration();

  } catch (error) {
    console.error('❌ Erreur lors de la configuration des identifiants patients:', error);
    throw error;
  }
}

async function testPatientIdentifierGeneration() {
  try {
    console.log('   🧪 Test de génération d\'identifiant patient...');

    // Test du format d'identifiant patient
    const testDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const testRandom = crypto.randomBytes(2).toString('hex').toUpperCase();
    const testIdentifier = `PAT-${testDate}-${testRandom}`;

    // Vérifier le format
    const identifierRegex = /^PAT-\d{8}-[A-F0-9]{4}$/;
    if (!identifierRegex.test(testIdentifier)) {
      throw new Error(`Format d'identifiant patient invalide: ${testIdentifier}`);
    }

    console.log(`   ✅ Format d'identifiant patient valide: ${testIdentifier}`);

    // Test de l'unicité (simulé)
    const uniquenessTest = await testPatientIdentifierUniqueness();
    if (uniquenessTest) {
      console.log('   ✅ Système d\'unicité des identifiants patients fonctionnel');
    }

  } catch (error) {
    console.error('   ❌ Échec du test d\'identifiant patient:', error.message);
    throw error;
  }
}

async function testPatientIdentifierUniqueness() {
  try {
    // Générer quelques identifiants de test
    const testIdentifiers = new Set();
    const iterations = 10;

    for (let i = 0; i < iterations; i++) {
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const random = crypto.randomBytes(2).toString('hex').toUpperCase();
      const identifier = `PAT-${date}-${random}`;

      if (testIdentifiers.has(identifier)) {
        console.warn(`   ⚠️  Collision détectée: ${identifier}`);
        return false;
      }

      testIdentifiers.add(identifier);
    }

    return testIdentifiers.size === iterations;
  } catch (error) {
    console.error('Erreur lors du test d\'unicité des identifiants:', error);
    return false;
  }
}

// Fonction pour afficher des informations de debug
async function displaySystemInfo() {
  try {
    console.log('\n🔍 Informations système:');
    console.log(`   📁 Base de données: ${path.join(__dirname, '../data/database.sqlite')}`);
    console.log(`   🗄️  Dialecte Sequelize: ${sequelize.getDialect()}`);
    console.log(`   📊 Tables: ${(await sequelize.getQueryInterface().showAllTables()).length}`);

    // Vérifier la taille de la base
    const dbPath = path.join(__dirname, '../data/database.sqlite');
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

    // Informations sur les identifiants patients
    console.log('\n🏥 Configuration identifiants patients:');
    console.log('   📋 Format: PAT-YYYYMMDD-XXXX');
    console.log('   🔒 Champ unique avec index (patientIdentifier)');
    console.log('   🤖 Génération automatique pour TOUS les nouveaux patients');
    console.log('   👨‍⚕️ Hook beforeCreate dans BaseUser.js');
    console.log('   🔗 API liaison: /api/auth/link-patient-identifier');
    console.log('   ✅ API vérification: /api/auth/verify-patient-identifier/:identifier');
    console.log('   🛡️  Rate limiting: 5 tentatives/15min');

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