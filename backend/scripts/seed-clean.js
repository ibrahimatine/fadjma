require('dotenv').config();
const { sequelize, BaseUser, Patient, Doctor, Pharmacy, Specialty, DoctorSpecialty, DoctorAvailability } = require('../src/models');

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
        email: 'jean.dupont@demo.com',
        password: 'Demo2024!',
        firstName: 'Jean',
        lastName: 'Dupont',
        role: 'patient',
        phoneNumber: '+221 77 123 4567',
        address: '123 Rue de la Paix, Dakar'
      },
      {
        email: 'fatou.sall@demo.com',
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
      },

      // Assistant/Secrétaire
      {
        email: 'secretaire@fadjma.com',
        password: 'Demo2024!',
        firstName: 'Aminata',
        lastName: 'Sy',
        role: 'assistant',
        phoneNumber: '+221 77 400 5001',
        address: '10 Rue de la Clinique, Dakar'
      },

      // Radiologue
      {
        email: 'radio@fadjma.com',
        password: 'Demo2024!',
        firstName: 'Cheikh',
        lastName: 'Ndiaye',
        role: 'radiologist',
        phoneNumber: '+221 77 500 6001',
        address: 'Centre d\'Imagerie Médicale, Dakar'
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

    // Créer les spécialités médicales
    console.log('🔄 Création des spécialités médicales...');

    const specialties = await Specialty.bulkCreate([
      {
        name: 'Médecine Générale',
        code: 'GENERAL',
        description: 'Soins de santé primaires et consultations générales',
        dailyAppointmentLimit: 30,
        averageConsultationDuration: 30,
        color: '#3B82F6',
        icon: 'stethoscope',
        isActive: true
      },
      {
        name: 'Cardiologie',
        code: 'CARDIO',
        description: 'Diagnostic et traitement des maladies cardiovasculaires',
        dailyAppointmentLimit: 15,
        averageConsultationDuration: 45,
        color: '#EF4444',
        icon: 'heart-pulse',
        isActive: true
      }
    ]);

    console.log('✅ Spécialités créées');

    // Lier les médecins à leurs spécialités
    console.log('🔄 Liaison des médecins aux spécialités...');

    await DoctorSpecialty.bulkCreate([
      {
        doctorId: baseUsers[0].id, // Dr. Martin
        specialtyId: specialties[0].id, // Médecine Générale
        isPrimary: true,
        yearsOfExperience: 15
      },
      {
        doctorId: baseUsers[1].id, // Dr. Diop
        specialtyId: specialties[1].id, // Cardiologie
        isPrimary: true,
        yearsOfExperience: 12
      }
    ]);

    console.log('✅ Médecins liés aux spécialités');

    // Créer les disponibilités pour les médecins
    console.log('🔄 Création des disponibilités des médecins...');

    const availabilities = [];
    const doctors = [baseUsers[0], baseUsers[1]]; // Dr. Martin et Dr. Diop

    for (const doctor of doctors) {
      // Lundi à Vendredi (1-5)
      for (let dayOfWeek = 1; dayOfWeek <= 5; dayOfWeek++) {
        availabilities.push({
          doctorId: doctor.id,
          dayOfWeek: dayOfWeek,
          startTime: '08:00:00',
          endTime: '12:00:00',
          isActive: true
        });
        availabilities.push({
          doctorId: doctor.id,
          dayOfWeek: dayOfWeek,
          startTime: '14:00:00',
          endTime: '18:00:00',
          isActive: true
        });
      }
    }

    await DoctorAvailability.bulkCreate(availabilities);

    console.log('✅ Disponibilités créées');

    // Résumé
    console.log('\n' + '='.repeat(60));
    console.log('📊 BASE DE DONNÉES PROPRE POUR VOS TESTS');
    console.log('='.repeat(60));
    console.log('\n👨‍⚕️ MÉDECINS:');
    console.log('  📧 dr.martin@fadjma.com     🔑 Demo2024!  (Médecine générale)');
    console.log('  📧 dr.diop@fadjma.com       🔑 Demo2024!  (Cardiologie)');

    console.log('\n👤 PATIENTS:');
    console.log('  📧 jean.dupont@demo.com     🔑 Demo2024!  (Jean Dupont)');
    console.log('  📧 fatou.sall@demo.com      🔑 Demo2024!  (Fatou Sall)');

    console.log('\n🏥 PHARMACIE:');
    console.log('  📧 pharmacie@fadjma.com     🔑 Demo2024!');

    console.log('\n👨‍💼 ADMINISTRATEUR:');
    console.log('  📧 admin@fadjma.com         🔑 Admin2024!');

    console.log('\n👔 ASSISTANT/SECRÉTAIRE:');
    console.log('  📧 secretaire@fadjma.com    🔑 Demo2024!');

    console.log('\n🔬 RADIOLOGUE:');
    console.log('  📧 radio@fadjma.com         🔑 Demo2024!');

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