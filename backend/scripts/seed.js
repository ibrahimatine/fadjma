require('dotenv').config();
const { sequelize, BaseUser, Patient, Doctor, Pharmacy, MedicalRecord, Prescription, MedicalRecordAccessRequest, Specialty, DoctorSpecialty, DoctorAvailability } = require('../src/models');
const PatientIdentifierService = require('../src/services/patientIdentifierService');

async function seedDatabase() {
  try {
    console.log('🔄 Connexion à la base de données...');
    await sequelize.authenticate();

    console.log('🔄 Suppression des données existantes...');
    await sequelize.sync({ force: true });

    console.log('🔄 Création des utilisateurs de test avec nouvelle architecture...');

    // Créer les BaseUsers
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
      {
        email: 'dr.fall@fadjma.com',
        password: 'Demo2024!',
        firstName: 'Aissatou',
        lastName: 'Fall',
        role: 'doctor',
        phoneNumber: '+221 77 321 1003',
        address: '22 Boulevard du Centenaire, Dakar'
      },
      {
        email: 'dr.kane@fadjma.com',
        password: 'Demo2024!',
        firstName: 'Ousmane',
        lastName: 'Kane',
        role: 'doctor',
        phoneNumber: '+221 77 321 1004',
        address: '5 Place de l\'Indépendance, Dakar'
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
      {
        email: 'mamadou.ba@demo.com',
        password: 'Demo2024!',
        firstName: 'Mamadou',
        lastName: 'Ba',
        role: 'patient',
        phoneNumber: '+221 78 345 6789',
        address: '789 Rue Félix Faure, Dakar'
      },
      {
        email: 'awa.ndiaye@demo.com',
        password: 'Demo2024!',
        firstName: 'Awa',
        lastName: 'Ndiaye',
        role: 'patient',
        phoneNumber: '+221 76 456 7890',
        address: '321 Avenue Lamine Gueye, Dakar'
      },
      {
        email: 'ibrahim.diallo@demo.com',
        password: 'Demo2024!',
        firstName: 'Ibrahim',
        lastName: 'Diallo',
        role: 'patient',
        phoneNumber: '+221 77 567 8901',
        address: '654 Rue Carnot, Dakar'
      },

      // Pharmacies
      {
        email: 'pharmacie.centrale@fadjma.com',
        password: 'Demo2024!',
        firstName: 'Pharmacie',
        lastName: 'Centrale',
        role: 'pharmacy',
        phoneNumber: '+221 33 821 1001',
        address: '10 Avenue Georges Pompidou, Dakar'
      },
      {
        email: 'pharmacie.plateau@fadjma.com',
        password: 'Demo2024!',
        firstName: 'Pharmacie du',
        lastName: 'Plateau',
        role: 'pharmacy',
        phoneNumber: '+221 33 821 1002',
        address: '25 Place de l\'Indépendance, Dakar'
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

      // Assistants/Secrétaires
      {
        email: 'secretaire.accueil@fadjma.com',
        password: 'Demo2024!',
        firstName: 'Fatou',
        lastName: 'Diallo',
        role: 'assistant',
        phoneNumber: '+221 77 400 5001',
        address: '10 Rue de la Clinique, Dakar'
      },
      {
        email: 'secretaire.rdv@fadjma.com',
        password: 'Demo2024!',
        firstName: 'Aminata',
        lastName: 'Sy',
        role: 'assistant',
        phoneNumber: '+221 77 400 5002',
        address: '12 Avenue des Soins, Dakar'
      },

      // Radiologue
      {
        email: 'radio.imaging@fadjma.com',
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
    
    // Créer les profils spécialisés
    console.log('🔄 Création des profils spécialisés...');

    // Créer les profils docteurs
    const doctorProfiles = await Doctor.bulkCreate([
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
      },
      {
        baseUserId: baseUsers[2].id, // Dr. Fall
        licenseNumber: 'MED-11111',
        specialty: 'Pédiatrie',
        hospital: 'Hôpital d\'Enfants Albert Royer',
        isVerified: true
      },
      {
        baseUserId: baseUsers[3].id, // Dr. Kane
        licenseNumber: 'MED-22222',
        specialty: 'Gynécologie-Obstétrique',
        hospital: 'Maternité Nationale',
        isVerified: true
      }
    ]);

    // Créer les profils patients
    const patientProfiles = await Patient.bulkCreate([
      {
        baseUserId: baseUsers[4].id, // Jean Dupont
        dateOfBirth: new Date('1985-03-15'),
        gender: 'male',
        emergencyContactName: 'Marie Dupont',
        emergencyContactPhone: '+221 77 987 6543',
        socialSecurityNumber: 'SSN123456789'
      },
      {
        baseUserId: baseUsers[5].id, // Fatou Sall
        dateOfBirth: new Date('1990-07-22'),
        gender: 'female',
        emergencyContactName: 'Ibrahima Sall',
        emergencyContactPhone: '+221 77 876 5432',
        socialSecurityNumber: 'SSN987654321'
      },
      {
        baseUserId: baseUsers[6].id, // Mamadou Ba
        dateOfBirth: new Date('1982-11-10'),
        gender: 'male',
        emergencyContactName: 'Aminata Ba',
        emergencyContactPhone: '+221 76 111 2222',
        socialSecurityNumber: 'SSN111222333'
      },
      {
        baseUserId: baseUsers[7].id, // Awa Ndiaye
        dateOfBirth: new Date('1995-05-18'),
        gender: 'female',
        emergencyContactName: 'Moussa Ndiaye',
        emergencyContactPhone: '+221 77 333 4444',
        socialSecurityNumber: 'SSN444555666'
      },
      {
        baseUserId: baseUsers[8].id, // Ibrahim Diallo
        dateOfBirth: new Date('1988-09-03'),
        gender: 'male',
        emergencyContactName: 'Khadija Diallo',
        emergencyContactPhone: '+221 78 555 6666',
        socialSecurityNumber: 'SSN777888999'
      }
    ]);

    // Créer les profils pharmacies
    const pharmacyProfiles = await Pharmacy.bulkCreate([
      {
        baseUserId: baseUsers[9].id, // Pharmacie Centrale
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
      },
      {
        baseUserId: baseUsers[10].id, // Pharmacie du Plateau
        licenseNumber: 'PHARM-2001',
        pharmacyName: 'Pharmacie du Plateau',
        pharmacyAddress: '25 Place de l\'Indépendance, Dakar',
        isVerified: true,
        openingHours: {
          lundi: '07:30-19:30',
          mardi: '07:30-19:30',
          mercredi: '07:30-19:30',
          jeudi: '07:30-19:30',
          vendredi: '07:30-19:30',
          samedi: '08:00-17:00',
          dimanche: 'Fermé'
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
      },
      {
        name: 'Pédiatrie',
        code: 'PEDIATRIE',
        description: 'Soins médicaux pour les enfants et adolescents',
        dailyAppointmentLimit: 25,
        averageConsultationDuration: 30,
        color: '#10B981',
        icon: 'baby',
        isActive: true
      },
      {
        name: 'Gynécologie-Obstétrique',
        code: 'GYNECO',
        description: 'Santé reproductive et suivi de grossesse',
        dailyAppointmentLimit: 20,
        averageConsultationDuration: 40,
        color: '#EC4899',
        icon: 'user',
        isActive: true
      }
    ]);

    console.log('✅ Spécialités créées:', specialties.length);

    // Récupérer les IDs
    const drMartin = baseUsers[0];
    const drDiop = baseUsers[1];
    const drFall = baseUsers[2];
    const drKane = baseUsers[3];

    // Lier les médecins à leurs spécialités
    console.log('🔄 Liaison des médecins aux spécialités...');

    await DoctorSpecialty.bulkCreate([
      {
        doctorId: drMartin.id,
        specialtyId: specialties[0].id, // Médecine Générale
        isPrimary: true,
        yearsOfExperience: 15
      },
      {
        doctorId: drDiop.id,
        specialtyId: specialties[1].id, // Cardiologie
        isPrimary: true,
        yearsOfExperience: 12
      },
      {
        doctorId: drFall.id,
        specialtyId: specialties[2].id, // Pédiatrie
        isPrimary: true,
        yearsOfExperience: 8
      },
      {
        doctorId: drKane.id,
        specialtyId: specialties[3].id, // Gynécologie
        isPrimary: true,
        yearsOfExperience: 10
      }
    ]);

    console.log('✅ Médecins liés aux spécialités');

    // Créer les disponibilités pour les médecins (Lundi à Vendredi, 8h-18h)
    console.log('🔄 Création des disponibilités des médecins...');

    const availabilities = [];
    const doctors = [drMartin, drDiop, drFall, drKane];

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

    console.log('✅ Disponibilités créées:', availabilities.length);
    const patientJean = baseUsers[4];
    const patientFatou = baseUsers[5];
    const patientMamadou = baseUsers[6];
    const patientAwa = baseUsers[7];
    const patientIbrahim = baseUsers[8];

    // Créer des profils patients non réclamés pour démonstration
    console.log('🔄 Création de profils patients non réclamés...');

    const unclaimedPatients = [];

    // Profil créé par Dr. Martin
    const unclaimedPatient1 = await PatientIdentifierService.createUnclaimedPatient({
      firstName: 'Sophie',
      lastName: 'Diallo',
      dateOfBirth: new Date('1992-08-14'),
      gender: 'female',
      phoneNumber: '+221 77 999 1111',
      address: '456 Rue Victor Hugo, Dakar',
      emergencyContactName: 'Omar Diallo',
      emergencyContactPhone: '+221 77 999 2222',
      socialSecurityNumber: 'SSN123456ABC'
    }, drMartin.id);

    // Profil créé par Dr. Diop
    const unclaimedPatient2 = await PatientIdentifierService.createUnclaimedPatient({
      firstName: 'Aliou',
      lastName: 'Ndoye',
      dateOfBirth: new Date('1987-03-22'),
      gender: 'male',
      phoneNumber: '+221 76 888 3333',
      address: '789 Avenue Blaise Diagne, Dakar',
      emergencyContactName: 'Mariam Ndoye',
      emergencyContactPhone: '+221 76 888 4444'
    }, drDiop.id);

    // Profil créé par Dr. Fall (pédiatre)
    const unclaimedPatient3 = await PatientIdentifierService.createUnclaimedPatient({
      firstName: 'Aminata',
      lastName: 'Sarr',
      dateOfBirth: new Date('2018-12-05'), // Enfant
      gender: 'female',
      address: '321 Rue de la Médina, Dakar',
      emergencyContactName: 'Binta Sarr (Mère)',
      emergencyContactPhone: '+221 78 777 5555'
    }, drFall.id);

    unclaimedPatients.push(unclaimedPatient1, unclaimedPatient2, unclaimedPatient3);

    // Créer automatiquement les demandes d'accès approuvées pour les médecins
    const accessRequests = [];
    for (const patient of unclaimedPatients) {
      const accessRequest = await MedicalRecordAccessRequest.create({
        patientId: patient.id,
        requesterId: patient.createdByDoctorId,
        reason: 'Médecin créateur du profil patient',
        accessLevel: 'write',
        status: 'approved',
        reviewedBy: patient.id, // Auto-approuvé
        reviewedAt: new Date()
      });
      accessRequests.push(accessRequest);
    }

    console.log('✅ Profils patients non réclamés créés:');
    unclaimedPatients.forEach((patient, index) => {
      const doctor = [drMartin, drDiop, drFall].find(d => d.id === patient.createdByDoctorId);
      console.log(`   👤 ${patient.firstName} ${patient.lastName} - ${patient.patientIdentifier} (Dr. ${doctor.firstName} ${doctor.lastName})`);
    });
    
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
      },
      {
        patientId: patientJean.id,
        doctorId: drMartin.id,
        type: 'consultation',
        title: 'Consultation de routine - Bilan de santé',
        description: 'Consultation annuelle avec bilan sanguin complet.',
        diagnosis: 'État général satisfaisant. Légère carence en vitamine D détectée.',
        prescription: {
          medications: [
            { name: 'Cholecalciferol', dosage: '1000 UI', frequency: '1x/jour pendant 3 mois' }
          ]
        },
        metadata: {
          weight: '78kg',
          height: '175cm',
          bloodPressure: '125/80',
          cholesterol: '1.8g/L'
        }
      }
    ], { individualHooks: true });

    // Créer des dossiers médicaux pour Fatou Sall
    const recordsFatou = await MedicalRecord.bulkCreate([
      {
        patientId: patientFatou.id,
        doctorId: drDiop.id,
        type: 'prescription',
        title: 'Ordonnance - Traitement hypertension',
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
      },
      {
        patientId: patientFatou.id,
        doctorId: drDiop.id,
        type: 'test_result',
        title: 'Électrocardiogramme (ECG)',
        description: 'ECG de contrôle dans le cadre du suivi de l\'hypertension.',
        diagnosis: 'ECG normal. Pas de signe d\'hypertrophie ventriculaire.',
        prescription: null,
        metadata: {
          testType: 'ECG',
          result: 'Normal',
          heartRate: '68 bpm'
        }
      }
    ], { individualHooks: true });

    // Créer des dossiers médicaux pour Mamadou Ba
    const recordsMamadou = await MedicalRecord.bulkCreate([
      {
        patientId: patientMamadou.id,
        doctorId: drFall.id,
        type: 'consultation',
        title: 'Consultation pédiatrique - Suivi de croissance',
        description: 'Consultation de suivi pour son fils âgé de 8 ans.',
        diagnosis: 'Croissance normale. Vaccination à jour.',
        prescription: null,
        metadata: {
          childAge: '8 ans',
          weight: '28kg',
          height: '130cm',
          vaccinesUpToDate: true
        }
      },
      {
        patientId: patientMamadou.id,
        doctorId: drMartin.id,
        type: 'prescription',
        title: 'Ordonnance - Traitement diabète type 2',
        description: 'Diagnostic récent de diabète type 2. Mise en place du traitement.',
        diagnosis: 'Diabète de type 2 nouvellement diagnostiqué. HbA1c à 7.2%.',
        prescription: {
          medications: [
            { name: 'Metformine', dosage: '500mg', frequency: '2x/jour' },
            { name: 'Gliclazide', dosage: '30mg', frequency: '1x/jour matin' }
          ],
          duration: '6 mois',
          nextConsultation: '2025-03-01'
        },
        metadata: {
          hba1c: '7.2%',
          glucoseLevel: '180mg/dL',
          weight: '85kg'
        }
      }
    ], { individualHooks: true });

    // Créer des dossiers médicaux pour Awa Ndiaye
    const recordsAwa = await MedicalRecord.bulkCreate([
      {
        patientId: patientAwa.id,
        doctorId: drKane.id,
        type: 'consultation',
        title: 'Consultation gynécologique - Suivi contraceptif',
        description: 'Consultation de routine avec renouvellement de contraception.',
        diagnosis: 'Examen gynécologique normal. Contraception bien tolérée.',
        prescription: {
          medications: [
            { name: 'Pilule contraceptive', dosage: '1cp', frequency: '1x/jour' }
          ],
          duration: '12 mois'
        },
        metadata: {
          contraceptionType: 'Pilule œstro-progestative',
          sideEffects: 'Aucun'
        }
      },
      {
        patientId: patientAwa.id,
        doctorId: drKane.id,
        type: 'test_result',
        title: 'Frottis cervical',
        description: 'Dépistage de routine du cancer du col de l\'utérus.',
        diagnosis: 'Frottis normal. Aucune anomalie détectée.',
        prescription: null,
        metadata: {
          testType: 'Frottis cervical',
          result: 'Normal',
          nextScreening: '2027-09-25'
        }
      }
    ], { individualHooks: true });

    // Créer des dossiers médicaux pour Ibrahim Diallo
    const recordsIbrahim = await MedicalRecord.bulkCreate([
      {
        patientId: patientIbrahim.id,
        doctorId: drMartin.id,
        type: 'consultation',
        title: 'Consultation traumatologie - Entorse cheville',
        description: 'Consultation suite à une chute avec douleur à la cheville droite.',
        diagnosis: 'Entorse légère de la cheville droite. Pas de fracture visible à la radiographie.',
        prescription: {
          medications: [
            { name: 'Ibuprofène', dosage: '400mg', frequency: '3x/jour pendant 5 jours' },
            { name: 'Paracétamol', dosage: '1g', frequency: 'Si douleur' }
          ]
        },
        metadata: {
          injury: 'Entorse cheville droite',
          severity: 'Légère',
          radiography: 'Normale'
        }
      },
      {
        patientId: patientIbrahim.id,
        doctorId: drMartin.id,
        type: 'vaccination',
        title: 'Vaccination Tétanos-Diphtérie',
        description: 'Rappel vaccinal Tétanos-Diphtérie dans le cadre du suivi de la blessure.',
        diagnosis: 'Vaccination effectuée. Aucune réaction adverse.',
        prescription: null,
        metadata: {
          vaccine: 'Tétanos-Diphtérie',
          batchNumber: 'TD2024-891',
          nextRecall: '2034-09-25'
        }
      }
    ], { individualHooks: true });

    // Créer quelques dossiers médicaux pour les patients non réclamés
    const recordsUnclaimed = await MedicalRecord.bulkCreate([
      {
        patientId: unclaimedPatient1.id, // Sophie Diallo
        doctorId: drMartin.id,
        type: 'consultation',
        title: 'Consultation initiale - Douleurs abdominales',
        description: 'Patient présente des douleurs abdominales récurrentes depuis 2 semaines.',
        diagnosis: 'Syndrome de l\'intestin irritable probable. Recommandations diététiques.',
        prescription: {
          medications: [
            { name: 'Spasmocalm', dosage: '80mg', frequency: '2x/jour pendant 1 semaine' }
          ]
        },
        metadata: {
          symptoms: ['douleurs abdominales', 'ballonnements'],
          patientIdentifier: unclaimedPatient1.patientIdentifier
        }
      },
      {
        patientId: unclaimedPatient2.id, // Aliou Ndoye
        doctorId: drDiop.id,
        type: 'consultation',
        title: 'Consultation cardiologique - Hypertension nouvellement diagnostiquée',
        description: 'Dépistage systématique révélant une hypertension artérielle.',
        diagnosis: 'Hypertension artérielle grade 1. Mise en place du traitement.',
        prescription: {
          medications: [
            { name: 'Losartan', dosage: '50mg', frequency: '1x/jour matin' }
          ]
        },
        metadata: {
          bloodPressure: '155/90',
          patientIdentifier: unclaimedPatient2.patientIdentifier
        }
      },
      {
        patientId: unclaimedPatient3.id, // Aminata Sarr (enfant)
        doctorId: drFall.id,
        type: 'vaccination',
        title: 'Vaccination de routine - ROR',
        description: 'Vaccination ROR (Rougeole-Oreillons-Rubéole) selon calendrier vaccinal.',
        diagnosis: 'Vaccination effectuée. Enfant en bonne santé.',
        prescription: null,
        metadata: {
          vaccine: 'ROR',
          age: '5 ans',
          weight: '18kg',
          patientIdentifier: unclaimedPatient3.patientIdentifier
        }
      }
    ], { individualHooks: true });

    console.log('✅ Dossiers médicaux créés:');
    console.log(`   - ${recordsJean.length} dossiers pour Jean Dupont`);
    console.log(`   - ${recordsFatou.length} dossiers pour Fatou Sall`);
    console.log(`   - ${recordsMamadou.length} dossiers pour Mamadou Ba`);
    console.log(`   - ${recordsAwa.length} dossiers pour Awa Ndiaye`);
    console.log(`   - ${recordsIbrahim.length} dossiers pour Ibrahim Diallo`);
    console.log(`   - ${recordsUnclaimed.length} dossiers pour patients non réclamés`);
    
    // Simuler l'ancrage Hedera pour quelques records
    console.log('🔄 Simulation ancrage Hedera...');
    const hashService = require('../src/services/hashService');

    // Ancrer quelques dossiers de chaque patient
    const recordsToAnchor = [
      ...recordsJean.slice(0, 2),
      ...recordsFatou.slice(0, 1),
      ...recordsMamadou.slice(0, 1),
      ...recordsAwa.slice(0, 1),
      ...recordsIbrahim.slice(0, 1)
    ];

    for (const record of recordsToAnchor) {
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

    // Afficher les matricules d'ordonnances générés
    console.log('\n🆔 MATRICULES D\'ORDONNANCES GÉNÉRÉS:');
    console.log('----------------------------------------');
    const prescriptionRecords = [
      ...recordsFatou.filter(r => r.type === 'prescription'),
      ...recordsMamadou.filter(r => r.type === 'prescription')
    ];

    prescriptionRecords.forEach(record => {
      const patient = [patientJean, patientFatou, patientMamadou, patientAwa, patientIbrahim]
        .find(p => p.id === record.patientId);
      const doctor = [drMartin, drDiop, drFall, drKane]
        .find(d => d.id === record.doctorId);

      if (record.prescriptionMatricule) {
        console.log(`   🎫 ${record.prescriptionMatricule} → ${record.title}`);
        console.log(`      Patient: ${patient?.firstName} ${patient?.lastName}`);
        console.log(`      Médecin: Dr. ${doctor?.firstName} ${doctor?.lastName}`);
        console.log('');
      }
    });

    // Créer des prescriptions avec matricules automatiques
    console.log('🔄 Création des prescriptions (médicaments individuels) avec matricules...');

    const prescriptions = await Prescription.bulkCreate([
      // Prescriptions du Dr Martin
      {
        patientId: patientJean.id,
        doctorId: drMartin.id,
        medicalRecordId: recordsJean[2].id, // Lié au bilan de santé
        medication: 'Cholécalciférol (Vitamine D3)',
        dosage: '1000 UI',
        quantity: 90,
        instructions: '1 comprimé par jour pendant 3 mois. À prendre au cours du repas.',
        issueDate: new Date(),
        deliveryStatus: 'pending'
      },
      {
        patientId: patientIbrahim.id,
        doctorId: drMartin.id,
        medicalRecordId: recordsIbrahim[0].id, // Lié à l'entorse
        medication: 'Ibuprofène',
        dosage: '400mg',
        quantity: 15,
        instructions: '1 comprimé 3 fois par jour pendant 5 jours. À prendre pendant les repas.',
        issueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Hier
        deliveryStatus: 'pending'
      },
      {
        patientId: patientMamadou.id,
        doctorId: drMartin.id,
        medicalRecordId: recordsMamadou[1].id, // Lié au diabète
        medication: 'Metformine',
        dosage: '500mg',
        quantity: 180,
        instructions: '1 comprimé matin et soir pendant les repas. Contrôle glycémique dans 1 mois.',
        issueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Avant-hier
        deliveryStatus: 'pending'
      },

      // Prescriptions du Dr Diop (Cardiologue) - Liées à l'ordonnance d'hypertension
      {
        patientId: patientFatou.id,
        doctorId: drDiop.id,
        medicalRecordId: recordsFatou[0].id, // Lié à l'ordonnance d'hypertension
        medication: 'Amlodipine',
        dosage: '5mg',
        quantity: 90,
        instructions: '1 comprimé le matin au réveil. Contrôle tension dans 15 jours.',
        issueDate: new Date(),
        deliveryStatus: 'pending'
      },
      {
        patientId: patientFatou.id,
        doctorId: drDiop.id,
        medicalRecordId: recordsFatou[0].id, // Lié à l'ordonnance d'hypertension
        medication: 'Ramipril',
        dosage: '2.5mg',
        quantity: 90,
        instructions: '1 comprimé le soir avant le coucher. À associer à l\'Amlodipine.',
        issueDate: new Date(),
        deliveryStatus: 'pending'
      },

      // Prescriptions du Dr Kane (Gynécologue)
      {
        patientId: patientAwa.id,
        doctorId: drKane.id,
        medicalRecordId: recordsAwa[0].id, // Lié à la contraception
        medication: 'Pilule contraceptive (Lévonorgestrel/Éthinylestradiol)',
        dosage: '0.15mg/0.03mg',
        quantity: 84,
        instructions: '1 comprimé par jour à heure fixe. Pause de 7 jours toutes les 3 plaquettes.',
        issueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Il y a 3 jours
        deliveryStatus: 'pending'
      },

      // Prescriptions d'urgence (pour test livraison)
      {
        patientId: patientJean.id,
        doctorId: drMartin.id,
        medication: 'EpiPen (Épinéphrine)',
        dosage: '0.3mg',
        quantity: 2,
        instructions: 'URGENCE - Injection intramusculaire en cas de réaction allergique sévère. Toujours avoir sur soi.',
        issueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Il y a 1 semaine
        deliveryStatus: 'pending'
      },

      // Prescriptions déjà délivrées (pour tests)
      {
        patientId: patientIbrahim.id,
        doctorId: drMartin.id,
        medication: 'Paracétamol',
        dosage: '1000mg',
        quantity: 20,
        instructions: '1 comprimé en cas de douleur. Maximum 4 comprimés par jour.',
        issueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Il y a 5 jours
        deliveryStatus: 'delivered',
        pharmacyId: baseUsers[9].id, // Pharmacie Centrale
        deliveryConfirmationHash: `0.0.${Math.floor(Math.random() * 1000000)}@${Date.now()}`
      },

      // Prescription annulée (pour tests)
      {
        patientId: patientMamadou.id,
        doctorId: drMartin.id,
        medication: 'Gliclazide',
        dosage: '30mg',
        quantity: 90,
        instructions: 'ANNULÉE - Remplacée par un autre traitement',
        issueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Il y a 10 jours
        deliveryStatus: 'cancelled'
      }
    ], { individualHooks: true }); // Permet d'exécuter les hooks pour générer les matricules

    console.log('✅ Prescriptions créées avec matricules:');
    prescriptions.forEach((p, index) => {
      const patient = [patientJean, patientFatou, patientMamadou, patientAwa, patientIbrahim]
        .find(patient => patient.id === p.patientId);
      const doctor = [drMartin, drDiop, drFall, drKane]
        .find(doctor => doctor.id === p.doctorId);

      console.log(`   📋 ${p.matricule || 'MATRICULE_PENDING'} - ${p.medication} (${patient?.firstName} ${patient?.lastName}) - Dr. ${doctor?.firstName} ${doctor?.lastName} - ${p.deliveryStatus}`);
    });

    console.log(`\n💊 Statistiques prescriptions:`);
    console.log(`   📊 Total: ${prescriptions.length}`);
    console.log(`   ⏳ En attente: ${prescriptions.filter(p => p.deliveryStatus === 'pending').length}`);
    console.log(`   ✅ Délivrées: ${prescriptions.filter(p => p.deliveryStatus === 'delivered').length}`);
    console.log(`   ❌ Annulées: ${prescriptions.filter(p => p.deliveryStatus === 'cancelled').length}`);

    // Afficher quelques matricules pour les tests
    const pendingPrescriptions = prescriptions.filter(p => p.deliveryStatus === 'pending' && p.matricule);
    if (pendingPrescriptions.length > 0) {
      console.log(`\n🧪 Matricules de test (pour pharmaciens):`);
      console.log('\n   📋 MATRICULES D\'ORDONNANCES (ORD-...) :');
      prescriptionRecords.forEach(record => {
        const patient = [patientJean, patientFatou, patientMamadou, patientAwa, patientIbrahim]
          .find(p => p.id === record.patientId);
        if (record.prescriptionMatricule) {
          console.log(`   🎫 ${record.prescriptionMatricule} → ${record.title} (${patient?.firstName} ${patient?.lastName})`);
        }
      });

      console.log('\n   💊 MATRICULES DE MÉDICAMENTS (PRX-...) :');
      pendingPrescriptions.slice(0, 3).forEach(p => {
        const patient = [patientJean, patientFatou, patientMamadou, patientAwa, patientIbrahim]
          .find(patient => patient.id === p.patientId);
        console.log(`   🔍 ${p.matricule} → ${p.medication} (${patient?.firstName} ${patient?.lastName})`);
      });
    }

    // Résumé
    console.log('\n' + '='.repeat(70));
    console.log('📊 RÉSUMÉ DES DONNÉES DE TEST ENRICHIES');
    console.log('='.repeat(70));
    console.log('\n👨‍⚕️ MÉDECINS (4 comptes):');
    console.log('----------------------------------------');
    console.log('  📧 dr.martin@fadjma.com     🔑 Demo2024!  (Médecine générale)');
    console.log('  📧 dr.diop@fadjma.com       🔑 Demo2024!  (Cardiologie)');
    console.log('  📧 dr.fall@fadjma.com       🔑 Demo2024!  (Pédiatrie)');
    console.log('  📧 dr.kane@fadjma.com       🔑 Demo2024!  (Gynécologie-Obstétrique)');

    console.log('\n👤 PATIENTS (5 comptes):');
    console.log('----------------------------------------');
    console.log('  📧 jean.dupont@demo.com     🔑 Demo2024!  (3 dossiers médicaux)');
    console.log('  📧 fatou.sall@demo.com      🔑 Demo2024!  (2 dossiers médicaux)');
    console.log('  📧 mamadou.ba@demo.com      🔑 Demo2024!  (2 dossiers médicaux)');
    console.log('  📧 awa.ndiaye@demo.com      🔑 Demo2024!  (2 dossiers médicaux)');
    console.log('  📧 ibrahim.diallo@demo.com  🔑 Demo2024!  (2 dossiers médicaux)');

    console.log('\n🏥 PATIENTS NON RÉCLAMÉS (3 profils - pour test identifiants):');
    console.log('----------------------------------------');
    unclaimedPatients.forEach(patient => {
      const doctor = [drMartin, drDiop, drFall].find(d => d.id === patient.createdByDoctorId);
      console.log(`  🆔 ${patient.patientIdentifier} - ${patient.firstName} ${patient.lastName} (Dr. ${doctor.firstName})`);
    });

    console.log('\n🏥 PHARMACIES (2 comptes):');
    console.log('----------------------------------------');
    console.log('  📧 pharmacie.centrale@fadjma.com  🔑 Demo2024!');
    console.log('  📧 pharmacie.plateau@fadjma.com   🔑 Demo2024!');

    console.log('\n👨‍💼 ADMINISTRATEUR:');
    console.log('----------------------------------------');
    console.log('  📧 admin@fadjma.com         🔑 Admin2024!');

    console.log('\n📊 STATISTIQUES:');
    console.log('----------------------------------------');
    console.log(`  👥 Total utilisateurs: ${baseUsers.length + unclaimedPatients.length}`);
    console.log(`  👤 Patients réclamés: ${baseUsers.filter(u => u.role === 'patient').length}`);
    console.log(`  🏥 Patients non réclamés: ${unclaimedPatients.length}`);
    console.log(`  📋 Total dossiers médicaux: ${recordsJean.length + recordsFatou.length + recordsMamadou.length + recordsAwa.length + recordsIbrahim.length + recordsUnclaimed.length}`);
    console.log(`  💊 Total prescriptions: ${prescriptions.length}`);
    console.log(`  🔐 Dossiers ancrés Hedera: ${recordsToAnchor.length}`);
    console.log(`  🏥 Spécialités médicales: ${specialties.length}`);
    console.log(`  👨‍⚕️ Médecins avec spécialités: 4`);
    console.log(`  📅 Créneaux de disponibilité: ${availabilities.length}`);
    console.log(`  💊 Pharmacies partenaires: 2`);
    console.log(`  🎫 Ordonnances avec matricules (ORD-...): ${prescriptionRecords.filter(r => r.prescriptionMatricule).length}`);
    console.log(`  🎯 Médicaments avec matricules (PRX-...): ${prescriptions.filter(p => p.matricule).length}`);
    console.log(`  🆔 Identifiants patients générés: ${unclaimedPatients.length}`);
    console.log(`  🔑 Demandes d'accès auto-approuvées: ${accessRequests.length}`);

    console.log('\n🧪 IDENTIFIANTS PATIENTS POUR TESTS:');
    console.log('----------------------------------------');
    console.log('Pour tester le système d\'identifiants patients :');
    console.log('1. Connectez-vous en tant que médecin');
    console.log('2. Cliquez sur "Nouveau dossier" → "Créer un profil patient"');
    console.log('3. Utilisez un identifiant généré pour lier un compte patient :');
    unclaimedPatients.forEach(patient => {
      console.log(`   🔗 ${patient.patientIdentifier} → ${patient.firstName} ${patient.lastName}`);
    });
    console.log('\n4. Allez sur /link-patient pour tester la liaison');
    console.log('5. Créez un compte patient avec email/mot de passe');
    console.log('6. Le compte sera automatiquement lié au dossier médical');

    console.log('\n✅ Base de données enrichie prête pour les tests!');
    console.log('='.repeat(70));
    
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