require('dotenv').config();
const { sequelize, User, MedicalRecord } = require('../src/models'); // Utiliser le nouveau fichier index.js
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  try {
    console.log('🔄 Connexion à la base de données...');
    await sequelize.authenticate();
    
    console.log('🔄 Suppression des données existantes...');
    await sequelize.sync({ force: true });
    
    console.log('🔄 Création des utilisateurs de test...');
    
    // Créer les utilisateurs
    const users = await User.bulkCreate([
      {
        email: 'dr.martin@fadjma.com',
        password: 'Demo2024!',
        firstName: 'Marie',
        lastName: 'Martin',
        role: 'doctor',
        licenseNumber: 'MED-12345'
      },
      {
        email: 'dr.diop@fadjma.com',
        password: 'Demo2024!',
        firstName: 'Amadou',
        lastName: 'Diop',
        role: 'doctor',
        licenseNumber: 'MED-67890'
      },
      {
        email: 'jean.dupont@demo.com',
        password: 'Demo2024!',
        firstName: 'Jean',
        lastName: 'Dupont',
        role: 'patient'
      },
      {
        email: 'fatou.sall@demo.com',
        password: 'Demo2024!',
        firstName: 'Fatou',
        lastName: 'Sall',
        role: 'patient'
      },
      {
        email: 'admin@fadjma.com',
        password: 'Admin2024!',
        firstName: 'Admin',
        lastName: 'FadjMa',
        role: 'admin'
      }
    ], { individualHooks: true });
    
    console.log('✅ Utilisateurs créés:');
    users.forEach(u => console.log(`   - ${u.email} (${u.role})`));
    
    // Récupérer les IDs
    const drMartin = users[0];
    const drDiop = users[1];
    const patientJean = users[2];
    const patientFatou = users[3];
    
    console.log('🔄 Création des dossiers médicaux...');
    
    // Créer des dossiers médicaux pour Jean Dupont
    const recordsJean = await MedicalRecord.bulkCreate([
      {
        patientId: patientJean.id,
        doctorId: drMartin.id,
        type: 'allergy',
        title: 'Allergie sévère aux arachides',
        description: 'Patient présente une allergie sévère aux arachides avec risque de choc anaphylactique.',
        diagnosis: 'Allergie de grade 4. Prescription d\'EpiPen. Éviter tout contact avec arachides et dérivés.',
        prescription: {
          medications: [
            { name: 'EpiPen', dosage: '0.3mg', frequency: 'En cas d\'urgence' },
            { name: 'Cetirizine', dosage: '10mg', frequency: '1x/jour' }
          ]
        },
        metadata: {
          severity: 'high',
          firstDiagnosed: '2020-03-15',
          lastReaction: '2023-11-20'
        }
      },
      {
        patientId: patientJean.id,
        doctorId: drMartin.id,
        type: 'vaccination',
        title: 'Vaccination COVID-19 - Dose de rappel',
        description: 'Administration de la 3ème dose du vaccin COVID-19 (Pfizer-BioNTech)',
        diagnosis: 'Aucune réaction adverse observée. Patient en bonne santé.',
        prescription: null,
        metadata: {
          vaccine: 'Pfizer-BioNTech',
          doseNumber: 3,
          batchNumber: 'FE4721',
          nextDose: '2025-06-15'
        }
      }
    ]);
    
    // Créer des dossiers médicaux pour Fatou Sall
    const recordsFatou = await MedicalRecord.bulkCreate([
      {
        patientId: patientFatou.id,
        doctorId: drDiop.id,
        type: 'prescription',
        title: 'Traitement hypertension',
        description: 'Prescription pour hypertension artérielle diagnostiquée.',
        diagnosis: 'Hypertension artérielle essentielle de grade 1',
        prescription: {
          medications: [
            { name: 'Amlodipine', dosage: '5mg', frequency: '1x/jour matin' },
            { name: 'Ramipril', dosage: '2.5mg', frequency: '1x/jour soir' }
          ],
          duration: '3 mois',
          nextConsultation: '2025-02-15'
        },
        metadata: {
          bloodPressureAvg: '150/95',
          startDate: '2024-11-15'
        }
      }
    ]);
    
    console.log('✅ Dossiers médicaux créés:');
    console.log(`   - ${recordsJean.length} dossiers pour Jean Dupont`);
    console.log(`   - ${recordsFatou.length} dossiers pour Fatou Sall`);
    
    // Simuler l'ancrage Hedera pour quelques records
    console.log('🔄 Simulation ancrage Hedera...');
    const hashService = require('../src/services/hashService');
    
    for (const record of [...recordsJean.slice(0, 2), ...recordsFatou.slice(0, 1)]) {
      const hash = hashService.generateRecordHash(record);
      await record.update({
        hash: hash,
        hederaTransactionId: `0.0.${Math.floor(Math.random() * 1000000)}@${Date.now()}`,
        hederaSequenceNumber: Math.floor(Math.random() * 1000).toString(),
        hederaTimestamp: new Date(),
        isVerified: true,
        lastVerifiedAt: new Date()
      });
    }
    
    console.log('✅ Certains dossiers ancrés sur Hedera (simulation)');
    
    // Résumé
    console.log('\n' + '='.repeat(50));
    console.log('📊 RÉSUMÉ DES DONNÉES DE TEST');
    console.log('='.repeat(50));
    console.log('\n👥 Comptes utilisateurs:');
    console.log('------------------------');
    console.log('MÉDECINS:');
    console.log('  Email: dr.martin@fadjma.com | Password: Demo2024!');
    console.log('  Email: dr.diop@fadjma.com   | Password: Demo2024!');
    console.log('\nPATIENTS:');
    console.log('  Email: jean.dupont@demo.com | Password: Demo2024!');
    console.log('  Email: fatou.sall@demo.com  | Password: Demo2024!');
    console.log('\nADMIN:');
    console.log('  Email: admin@fadjma.com     | Password: Admin2024!');
    console.log('\n✅ Base de données prête pour les tests!');
    console.log('='.repeat(50));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

// Script pour réinitialiser la DB rapidement
if (process.argv[2] === '--reset') {
  console.log('🔄 Reset complet de la base de données...');
  sequelize.sync({ force: true }).then(() => {
    console.log('✅ Base de données réinitialisée');
    process.exit(0);
  });
} else {
  seedDatabase();
}