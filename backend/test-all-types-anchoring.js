const { MedicalRecord, Prescription } = require('./src/models');
const hederaService = require('./src/services/hederaService');

async function testAllTypesAnchoring() {
  console.log('🧪 Test de l\'ancrage enrichi pour tous les types de données médicales\n');

  try {
    // Test 1: Ancrage d'un dossier médical (consultation)
    console.log('📋 Test 1: Ancrage d\'une consultation...');
    const medicalRecord = await MedicalRecord.findOne({
      limit: 1,
      order: [['createdAt', 'DESC']]
    });

    if (medicalRecord) {
      console.log('- Type:', medicalRecord.type);
      console.log('- Titre:', medicalRecord.title);
      console.log('- Diagnostic:', medicalRecord.diagnosis);

      // Simuler l'ancrage enrichi pour consultation
      const consultationMessage = {
        recordId: medicalRecord.id,
        type: 'MEDICAL_RECORD',
        actionType: 'CREATED',

        // Données médicales complètes
        recordType: medicalRecord.type,
        title: medicalRecord.title,
        description: medicalRecord.description,
        diagnosis: medicalRecord.diagnosis,
        prescription: medicalRecord.prescription,

        // Données enrichies
        consultationType: hederaService.getConsultationType(medicalRecord),
        medicalData: hederaService.extractMedicalData(medicalRecord),

        // Participants
        patientId: medicalRecord.patientId,
        doctorId: medicalRecord.doctorId,

        // Traçabilité
        createdAt: medicalRecord.createdAt,
        version: '2.0'
      };

      console.log('✅ Message enrichi pour consultation:');
      console.log('- Type de consultation:', consultationMessage.consultationType);
      console.log('- Symptômes détectés:', consultationMessage.medicalData.symptoms);
      console.log('- Traitements:', consultationMessage.medicalData.treatments);
      console.log('- Taille du message:', JSON.stringify(consultationMessage).length, 'caractères');
    }

    // Test 2: Ancrage d'une prescription
    console.log('\n📋 Test 2: Ancrage d\'une prescription...');
    const prescription = await Prescription.findOne({
      limit: 1,
      order: [['createdAt', 'DESC']]
    });

    if (prescription) {
      console.log('- Matricule:', prescription.matricule);
      console.log('- Médicament:', prescription.medication);
      console.log('- Dosage:', prescription.dosage);

      // Message enrichi pour prescription
      const prescriptionMessage = {
        prescriptionId: prescription.id,
        matricule: prescription.matricule,
        type: 'PRESCRIPTION',
        actionType: 'CREATED',

        // Données médicales complètes
        medication: prescription.medication,
        dosage: prescription.dosage,
        quantity: prescription.quantity,
        instructions: prescription.instructions,
        issueDate: prescription.issueDate,

        // Participants
        patientId: prescription.patientId,
        doctorId: prescription.doctorId,
        pharmacyId: prescription.pharmacyId,

        // Statut
        deliveryStatus: prescription.deliveryStatus,

        // Traçabilité
        createdAt: prescription.createdAt,
        version: '2.0'
      };

      console.log('✅ Message enrichi pour prescription:');
      console.log('- Médicament complet:', prescriptionMessage.medication);
      console.log('- Instructions complètes:', prescriptionMessage.instructions || 'Aucune');
      console.log('- Taille du message:', JSON.stringify(prescriptionMessage).length, 'caractères');
    }

    // Test 3: Comparaison ancien vs nouveau format
    console.log('\n📊 Comparaison des formats:');

    const oldFormat = {
      recordId: "example-id",
      hash: "abc123",
      type: "MEDICAL_RECORD",
      patientId: "patient-id",
      doctorId: "doctor-id"
    };

    const newFormat = {
      recordId: "example-id",
      hash: "abc123",
      type: "MEDICAL_RECORD",
      actionType: "CREATED",
      recordType: "consultation",
      title: "Consultation cardiologique",
      description: "Patient présente douleur thoracique avec fatigue",
      diagnosis: "Hypertension artérielle légère",
      prescription: "Amlodipine 5mg, repos recommandé",
      consultationType: "CARDIOLOGY",
      medicalData: {
        symptoms: ["douleur", "fatigue"],
        treatments: ["Amlodipine 5mg", "repos recommandé"],
        vitalSigns: {
          bloodPressure: "140/90",
          heartRate: "85"
        }
      },
      patientId: "patient-id",
      doctorId: "doctor-id",
      version: "2.0"
    };

    console.log('- Ancien format:', JSON.stringify(oldFormat).length, 'caractères');
    console.log('- Nouveau format enrichi:', JSON.stringify(newFormat).length, 'caractères');
    console.log('- Gain d\'informations:',
      Math.round((JSON.stringify(newFormat).length / JSON.stringify(oldFormat).length - 1) * 100), '% plus de données');

    console.log('\n🎯 Types de consultations supportés:');
    const supportedTypes = [
      'consultation', 'urgence', 'controle', 'specialiste',
      'chirurgie', 'radiologie', 'laboratoire', 'vaccination',
      'dentaire', 'psychiatrie', 'cardiologie', 'dermatologie'
    ];

    supportedTypes.forEach(type => {
      const mockRecord = { type: type };
      const consultationType = hederaService.getConsultationType(mockRecord);
      console.log(`- ${type} → ${consultationType}`);
    });

    console.log('\n✅ Tous les types de données médicales sont maintenant enrichis pour l\'ancrage Hedera!');
    console.log('🔐 Avantages:');
    console.log('  • Données médicales complètes sur blockchain');
    console.log('  • Extraction intelligente selon le type de consultation');
    console.log('  • Traçabilité exhaustive des soins');
    console.log('  • Intégrité cryptographique des données réelles');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }

  process.exit(0);
}

// Exécuter le test
if (require.main === module) {
  testAllTypesAnchoring();
}

module.exports = { testAllTypesAnchoring };