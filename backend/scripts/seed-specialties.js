require('dotenv').config();
const { Specialty, DoctorSpecialty, DoctorAvailability, BaseUser } = require('../src/models');

const specialties = [
  {
    name: 'Médecine Générale',
    code: 'GENERAL',
    description: 'Consultation générale, suivi médical, prévention',
    dailyAppointmentLimit: 30,
    averageConsultationDuration: 20,
    color: '#3B82F6',
    icon: 'Stethoscope'
  },
  {
    name: 'Cardiologie',
    code: 'CARDIO',
    description: 'Maladies cardiovasculaires, hypertension, insuffisance cardiaque',
    dailyAppointmentLimit: 15,
    averageConsultationDuration: 30,
    color: '#EF4444',
    icon: 'Heart'
  },
  {
    name: 'Pédiatrie',
    code: 'PEDIATRIE',
    description: 'Santé des enfants et adolescents',
    dailyAppointmentLimit: 25,
    averageConsultationDuration: 25,
    color: '#10B981',
    icon: 'Baby'
  },
  {
    name: 'Dermatologie',
    code: 'DERMATO',
    description: 'Maladies de la peau, des cheveux et des ongles',
    dailyAppointmentLimit: 20,
    averageConsultationDuration: 20,
    color: '#F59E0B',
    icon: 'User'
  },
  {
    name: 'Radiologie',
    code: 'RADIO',
    description: 'Imagerie médicale, échographie, scanner, IRM',
    dailyAppointmentLimit: 40,
    averageConsultationDuration: 15,
    color: '#8B5CF6',
    icon: 'Scan'
  },
  {
    name: 'Gynécologie',
    code: 'GYNECO',
    description: 'Santé de la femme, suivi de grossesse',
    dailyAppointmentLimit: 18,
    averageConsultationDuration: 30,
    color: '#EC4899',
    icon: 'UserCircle'
  },
  {
    name: 'Ophtalmologie',
    code: 'OPHTALMO',
    description: 'Santé des yeux, troubles de la vision',
    dailyAppointmentLimit: 25,
    averageConsultationDuration: 20,
    color: '#06B6D4',
    icon: 'Eye'
  },
  {
    name: 'Dentisterie',
    code: 'DENT',
    description: 'Soins dentaires, orthodontie',
    dailyAppointmentLimit: 20,
    averageConsultationDuration: 30,
    color: '#14B8A6',
    icon: 'Activity'
  }
];

async function seedSpecialties() {
  try {
    console.log('🌱 Seeding specialties...');

    // Vérifier si les spécialités existent déjà
    const existingCount = await Specialty.count();
    if (existingCount > 0) {
      console.log(`⚠️  ${existingCount} spécialités déjà présentes. Voulez-vous les remplacer?`);
      console.log('   Suppression et recréation...');
      await Specialty.destroy({ where: {}, truncate: true });
    }

    // Créer les spécialités
    const createdSpecialties = await Specialty.bulkCreate(specialties);
    console.log(`✅ ${createdSpecialties.length} spécialités créées`);

    // Afficher les spécialités créées
    console.log('\n📋 Spécialités disponibles:');
    createdSpecialties.forEach(s => {
      console.log(`   - ${s.name} (${s.code}) - Limite: ${s.dailyAppointmentLimit}/jour`);
    });

    // Créer des disponibilités de test pour les médecins existants
    console.log('\n🕐 Création des disponibilités de test...');

    const doctors = await BaseUser.findAll({
      where: { role: 'doctor', isActive: true }
    });

    if (doctors.length > 0) {
      console.log(`   Trouvé ${doctors.length} médecin(s)`);

      let availabilityCount = 0;
      for (const doctor of doctors) {
        // Assigner une spécialité aléatoire au médecin
        const randomSpecialty = createdSpecialties[Math.floor(Math.random() * createdSpecialties.length)];

        try {
          await DoctorSpecialty.create({
            doctorId: doctor.id,
            specialtyId: randomSpecialty.id,
            isPrimary: true,
            yearsOfExperience: Math.floor(Math.random() * 20) + 1
          });

          // Créer des disponibilités pour la semaine
          const weekDays = [1, 2, 3, 4, 5]; // Lundi à Vendredi
          for (const day of weekDays) {
            await DoctorAvailability.create({
              doctorId: doctor.id,
              dayOfWeek: day,
              startTime: '09:00:00',
              endTime: '17:00:00',
              slotDuration: 30,
              isActive: true
            });
            availabilityCount++;
          }

          console.log(`   ✓ Dr. ${doctor.firstName} ${doctor.lastName} - ${randomSpecialty.name}`);
        } catch (error) {
          if (error.name === 'SequelizeUniqueConstraintError') {
            console.log(`   ⚠️  Dr. ${doctor.firstName} ${doctor.lastName} déjà configuré`);
          } else {
            throw error;
          }
        }
      }

      console.log(`✅ ${availabilityCount} disponibilités créées`);
    } else {
      console.log('   ⚠️  Aucun médecin trouvé. Créez des médecins d\'abord avec npm run seed');
    }

    console.log('\n✨ Seeding terminé avec succès!');
    console.log('\n📝 Prochaines étapes:');
    console.log('   1. npm start (démarrer le serveur)');
    console.log('   2. Tester l\'API /api/appointments/specialties');
    console.log('   3. Créer des rendez-vous via le frontend');

    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    console.error('\nDétails:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

seedSpecialties();