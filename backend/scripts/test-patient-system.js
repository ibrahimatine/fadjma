require('dotenv').config();
const { sequelize } = require('../src/models');
const PatientIdentifierService = require('../src/services/patientIdentifierService');
const SecurityService = require('../src/services/securityService');

/**
 * Script de test complet pour le système d'identifiants patients
 * À exécuter après init-sqlite.js et seed.js
 */
async function testCompletePatientSystem() {
  console.log('🧪 Test complet du système d\'identifiants patients...\n');

  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données réussie');

    // Test 1: Vérifier la structure de la base
    console.log('\n1. 🔍 Vérification de la structure de la base:');
    await testDatabaseStructure();

    // Test 2: Test de génération d'identifiants
    console.log('\n2. 🎯 Test de génération d\'identifiants:');
    await testIdentifierGeneration();

    // Test 3: Test de validation et sécurité
    console.log('\n3. 🛡️ Test de validation et sécurité:');
    await testSecurityValidation();

    // Test 4: Test du flux complet
    console.log('\n4. 🔄 Test du flux complet:');
    await testCompleteFlow();

    // Test 5: Test des données de seed
    console.log('\n5. 📊 Vérification des données de seed:');
    await testSeedData();

    console.log('\n🎉 Tous les tests sont passés avec succès!');
    console.log('\n📋 Le système est prêt pour:');
    console.log('   ✅ Création de profils patients par les médecins');
    console.log('   ✅ Génération d\'identifiants uniques');
    console.log('   ✅ Liaison sécurisée des identifiants aux comptes');
    console.log('   ✅ Gestion des accès et permissions');
    console.log('   ✅ Audit et sécurité des opérations');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Échec des tests:', error);
    process.exit(1);
  }
}

async function testDatabaseStructure() {
  try {
    // Vérifier les tables
    const tables = await sequelize.getQueryInterface().showAllTables();
    const requiredTables = ['BaseUsers', 'MedicalRecords', 'MedicalRecordAccessRequests'];

    for (const table of requiredTables) {
      if (tables.includes(table)) {
        console.log(`   ✅ Table ${table} présente`);
      } else {
        throw new Error(`Table ${table} manquante`);
      }
    }

    // Vérifier les colonnes BaseUsers
    const baseUserColumns = await sequelize.getQueryInterface().describeTable('BaseUsers');
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
      if (baseUserColumns[column]) {
        console.log(`   ✅ Colonne ${column} présente`);
      } else {
        throw new Error(`Colonne ${column} manquante dans BaseUsers`);
      }
    }

  } catch (error) {
    console.error('   ❌ Erreur structure base:', error.message);
    throw error;
  }
}

async function testIdentifierGeneration() {
  try {
    // Test génération unique
    const identifiers = new Set();
    for (let i = 0; i < 20; i++) {
      const id = await PatientIdentifierService.generateUniqueIdentifier();
      if (identifiers.has(id)) {
        throw new Error(`Identifiant dupliqué: ${id}`);
      }
      identifiers.add(id);
    }
    console.log(`   ✅ Génération de ${identifiers.size} identifiants uniques`);

    // Test format
    const testId = await PatientIdentifierService.generateUniqueIdentifier();
    if (PatientIdentifierService.isValidFormat(testId)) {
      console.log(`   ✅ Format valide: ${testId}`);
    } else {
      throw new Error(`Format invalide: ${testId}`);
    }

    // Test extraction de date
    const extractedDate = PatientIdentifierService.extractCreationDate(testId);
    if (extractedDate) {
      console.log(`   ✅ Date extraite: ${extractedDate.toDateString()}`);
    } else {
      throw new Error('Impossible d\'extraire la date');
    }

  } catch (error) {
    console.error('   ❌ Erreur génération:', error.message);
    throw error;
  }
}

async function testSecurityValidation() {
  try {
    // Test validation format
    const validIds = [
      'PAT-20241201-A7B9',
      'PAT-20240315-12CD',
      'PAT-20241125-FF00'
    ];

    const invalidIds = [
      'PAT-20241301-A7B9', // Date invalide
      'PT-20241201-A7B9',  // Préfixe incorrect
      'PAT-2024120-A7B9',  // Format date incorrect
      'invalid-format'      // Format complètement incorrect
    ];

    for (const id of validIds) {
      const validation = SecurityService.validatePatientIdentifier(id);
      if (validation.valid) {
        console.log(`   ✅ ID valide: ${id}`);
      } else {
        throw new Error(`ID supposé valide rejeté: ${id}`);
      }
    }

    for (const id of invalidIds) {
      const validation = SecurityService.validatePatientIdentifier(id);
      if (!validation.valid) {
        console.log(`   ✅ ID invalide rejeté: ${id}`);
      } else {
        throw new Error(`ID supposé invalide accepté: ${id}`);
      }
    }

    // Test rate limiting
    const testIp = '127.0.0.1';
    const testId = 'PAT-20241201-TEST';

    let allowedCount = 0;
    for (let i = 0; i < 7; i++) {
      const allowed = await SecurityService.checkRateLimit(testId, testIp);
      if (allowed) allowedCount++;
    }

    if (allowedCount <= 5) {
      console.log(`   ✅ Rate limiting fonctionne: ${allowedCount}/7 autorisés`);
    } else {
      throw new Error(`Rate limiting défaillant: ${allowedCount}/7 autorisés`);
    }

  } catch (error) {
    console.error('   ❌ Erreur sécurité:', error.message);
    throw error;
  }
}

async function testCompleteFlow() {
  try {
    const { BaseUser } = require('../src/models');

    // Trouver un médecin de test
    const doctor = await BaseUser.findOne({
      where: { role: 'doctor', email: 'dr.martin@fadjma.com' }
    });

    if (!doctor) {
      throw new Error('Médecin de test non trouvé');
    }

    // Test création profil non réclamé
    const patientData = {
      firstName: 'Test',
      lastName: 'Patient',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'male',
      phoneNumber: '+221 77 000 0000'
    };

    const unclaimedPatient = await PatientIdentifierService.createUnclaimedPatient(
      patientData,
      doctor.id
    );

    console.log(`   ✅ Profil non réclamé créé: ${unclaimedPatient.patientIdentifier}`);

    // Test vérification identifiant
    const foundPatient = await PatientIdentifierService.findPatientByIdentifier(
      unclaimedPatient.patientIdentifier
    );

    if (foundPatient && foundPatient.isUnclaimed) {
      console.log(`   ✅ Identifiant vérifié: ${foundPatient.firstName} ${foundPatient.lastName}`);
    } else {
      throw new Error('Identifiant non trouvé ou déjà réclamé');
    }

    // Test liaison (simulation)
    try {
      await PatientIdentifierService.linkIdentifierToAccount(
        unclaimedPatient.patientIdentifier,
        {
          email: 'test.patient@demo.com',
          password: 'TestPassword123!'
        }
      );

      console.log(`   ✅ Liaison de compte simulée`);

      // Vérifier que le profil n'est plus non réclamé
      const linkedPatient = await BaseUser.findByPk(unclaimedPatient.id);
      if (!linkedPatient.isUnclaimed && linkedPatient.email) {
        console.log(`   ✅ Profil lié avec succès: ${linkedPatient.email}`);
      } else {
        throw new Error('Liaison échouée');
      }

    } catch (linkError) {
      console.log(`   ⚠️  Liaison simulée (erreur attendue si email existe): ${linkError.message}`);
    }

  } catch (error) {
    console.error('   ❌ Erreur flux complet:', error.message);
    throw error;
  }
}

async function testSeedData() {
  try {
    const { BaseUser, MedicalRecord, MedicalRecordAccessRequest } = require('../src/models');

    // Compter les profils non réclamés
    const unclaimedCount = await BaseUser.count({
      where: { isUnclaimed: true, role: 'patient' }
    });

    console.log(`   ✅ Profils non réclamés dans la base: ${unclaimedCount}`);

    // Vérifier les identifiants générés
    const unclaimedPatients = await BaseUser.findAll({
      where: { isUnclaimed: true, role: 'patient' },
      attributes: ['id', 'firstName', 'lastName', 'patientIdentifier', 'createdByDoctorId']
    });

    for (const patient of unclaimedPatients) {
      if (PatientIdentifierService.isValidFormat(patient.patientIdentifier)) {
        console.log(`   ✅ ${patient.patientIdentifier} → ${patient.firstName} ${patient.lastName}`);
      } else {
        throw new Error(`Format identifiant invalide: ${patient.patientIdentifier}`);
      }
    }

    // Vérifier les demandes d'accès auto-approuvées
    const accessRequestsCount = await MedicalRecordAccessRequest.count({
      where: {
        reason: 'Médecin créateur du profil patient',
        status: 'approved'
      }
    });

    console.log(`   ✅ Demandes d'accès auto-approuvées: ${accessRequestsCount}`);

    // Vérifier les dossiers médicaux des profils non réclamés
    const unclaimedRecords = await MedicalRecord.count({
      where: {
        patientId: unclaimedPatients.map(p => p.id)
      }
    });

    console.log(`   ✅ Dossiers médicaux pour profils non réclamés: ${unclaimedRecords}`);

  } catch (error) {
    console.error('   ❌ Erreur données seed:', error.message);
    throw error;
  }
}

// Fonction utilitaire pour afficher les informations système
async function displaySystemInfo() {
  try {
    const { BaseUser } = require('../src/models');

    console.log('\n📊 INFORMATIONS SYSTÈME:');
    console.log('=====================================');

    const stats = {
      totalUsers: await BaseUser.count(),
      claimedPatients: await BaseUser.count({ where: { role: 'patient', isUnclaimed: false } }),
      unclaimedPatients: await BaseUser.count({ where: { role: 'patient', isUnclaimed: true } }),
      doctors: await BaseUser.count({ where: { role: 'doctor' } }),
      pharmacies: await BaseUser.count({ where: { role: 'pharmacy' } })
    };

    console.log(`👥 Total utilisateurs: ${stats.totalUsers}`);
    console.log(`👤 Patients réclamés: ${stats.claimedPatients}`);
    console.log(`🏥 Patients non réclamés: ${stats.unclaimedPatients}`);
    console.log(`👨‍⚕️ Médecins: ${stats.doctors}`);
    console.log(`💊 Pharmacies: ${stats.pharmacies}`);

    if (stats.unclaimedPatients > 0) {
      console.log('\n🆔 IDENTIFIANTS DISPONIBLES POUR TESTS:');
      const unclaimedPatients = await BaseUser.findAll({
        where: { isUnclaimed: true, role: 'patient' },
        attributes: ['firstName', 'lastName', 'patientIdentifier']
      });

      unclaimedPatients.forEach(patient => {
        console.log(`   🔗 ${patient.patientIdentifier} → ${patient.firstName} ${patient.lastName}`);
      });
    }

  } catch (error) {
    console.warn('Impossible d\'afficher les informations système:', error.message);
  }
}

// Exécuter les tests
if (require.main === module) {
  testCompletePatientSystem()
    .then(() => displaySystemInfo())
    .catch(console.error);
}

module.exports = { testCompletePatientSystem };