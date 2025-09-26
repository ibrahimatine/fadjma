require('dotenv').config();
const { sequelize, BaseUser, Patient, Doctor, Pharmacy } = require('../src/models');

async function seedCleanDatabase() {
  try {
    console.log('🔄 Connexion à la base de données...');
    await sequelize.authenticate();

    console.log('🔄 Suppression des données existantes...');
    await sequelize.sync({ force: true });

    console.log('🔄 Création des utilisateurs de base uniquement...');

    // Créer les BaseUsers uniquement
    const baseUsers = await BaseUser.bulkCreate([
      // Médecins
      {
        email: 'dr.martin@fadjma.com',
        password: 'Demo2024!',
        firstName: 'Marie',
        lastName: 'Martin',
        role: 'doctor',
        phoneNumber: '+221 77 321 1001',
        address: '15 Avenue Bourguiba, Dakar'
      },
      {
        email: 'dr.diop@fadjma.com',
        password: 'Demo2024!',
        firstName: 'Amadou',
        lastName: 'Diop',
        role: 'doctor',
        phoneNumber: '+221 77 321 1002',
        address: '8 Rue de la République, Dakar'
      },

      // Patients
      {
        email: 'patient1@demo.com',
        password: 'Demo2024!',
        firstName: 'Jean',
        lastName: 'Dupont',
        role: 'patient',
        phoneNumber: '+221 77 123 4567',
        address: '123 Rue de la Paix, Dakar'
      },
      {
        email: 'patient2@demo.com',
        password: 'Demo2024!',
        firstName: 'Fatou',
        lastName: 'Sall',
        role: 'patient',
        phoneNumber: '+221 76 234 5678',
        address: '456 Avenue Cheikh Anta Diop, Dakar'
      },

      // Pharmacies
      {
        email: 'pharmacie@fadjma.com',
        password: 'Demo2024!',
        firstName: 'Pharmacie',
        lastName: 'Centrale',
        role: 'pharmacy',
        phoneNumber: '+221 33 821 1001',
        address: '10 Avenue Georges Pompidou, Dakar'
      },

      // Admin
      {
        email: 'admin@fadjma.com',
        password: 'Admin2024!',
        firstName: 'Admin',
        lastName: 'FadjMa',
        role: 'admin',
        phoneNumber: '+221 33 900 0001',
        address: 'Siège FadjMa, Dakar'
      }
    ], { individualHooks: true });

    console.log('✅ Utilisateurs créés:');
    baseUsers.forEach(u => console.log(`   - ${u.email} (${u.role})`));

    // Créer les profils spécialisés de base
    console.log('🔄 Création des profils spécialisés...');

    // Profils docteurs
    await Doctor.bulkCreate([
      {
        baseUserId: baseUsers[0].id, // Dr. Martin
        licenseNumber: 'MED-12345',
        specialty: 'Médecine générale',
        hospital: 'Hôpital Général de Dakar',
        isVerified: true
      },
      {
        baseUserId: baseUsers[1].id, // Dr. Diop
        licenseNumber: 'MED-67890',
        specialty: 'Cardiologie',
        hospital: 'Centre Cardiologique de Dakar',
        isVerified: true
      }
    ]);

    // Profils patients
    await Patient.bulkCreate([
      {
        baseUserId: baseUsers[2].id, // Jean Dupont
        dateOfBirth: new Date('1985-03-15'),
        gender: 'male',
        emergencyContactName: 'Marie Dupont',
        emergencyContactPhone: '+221 77 987 6543',
        socialSecurityNumber: 'SSN123456789'
      },
      {
        baseUserId: baseUsers[3].id, // Fatou Sall
        dateOfBirth: new Date('1990-07-22'),
        gender: 'female',
        emergencyContactName: 'Ibrahima Sall',
        emergencyContactPhone: '+221 77 876 5432',
        socialSecurityNumber: 'SSN987654321'
      }
    ]);

    // Profil pharmacie
    await Pharmacy.bulkCreate([
      {
        baseUserId: baseUsers[4].id, // Pharmacie Centrale
        licenseNumber: 'PHARM-1001',
        pharmacyName: 'Pharmacie Centrale de Dakar',
        pharmacyAddress: '10 Avenue Georges Pompidou, Dakar',
        isVerified: true,
        openingHours: {
          lundi: '08:00-20:00',
          mardi: '08:00-20:00',
          mercredi: '08:00-20:00',
          jeudi: '08:00-20:00',
          vendredi: '08:00-20:00',
          samedi: '08:00-18:00',
          dimanche: '09:00-15:00'
        }
      }
    ]);

    console.log('✅ Profils spécialisés créés');

    // Résumé
    console.log('\n' + '='.repeat(60));
    console.log('📊 BASE DE DONNÉES PROPRE POUR VOS TESTS');
    console.log('='.repeat(60));
    console.log('\n👨‍⚕️ MÉDECINS:');
    console.log('  📧 dr.martin@fadjma.com     🔑 Demo2024!  (Médecine générale)');
    console.log('  📧 dr.diop@fadjma.com       🔑 Demo2024!  (Cardiologie)');

    console.log('\n👤 PATIENTS:');
    console.log('  📧 patient1@demo.com        🔑 Demo2024!  (Jean Dupont)');
    console.log('  📧 patient2@demo.com        🔑 Demo2024!  (Fatou Sall)');

    console.log('\n🏥 PHARMACIE:');
    console.log('  📧 pharmacie@fadjma.com     🔑 Demo2024!');

    console.log('\n👨‍💼 ADMINISTRATEUR:');
    console.log('  📧 admin@fadjma.com         🔑 Admin2024!');

    console.log('\n✅ Base de données propre prête pour vos tests personnalisés!');
    console.log('🚀 Vous pouvez maintenant créer vos propres données via l\'interface');
    console.log('='.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

seedCleanDatabase();