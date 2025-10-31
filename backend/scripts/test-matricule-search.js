const { Prescription, BaseUser } = require('../src/models');
const logger = require('../src/utils/logger');

async function testMatriculeSearch() {
  try {
    console.log('\n🧪 Test de la recherche par matricule...\n');

    // Récupérer une prescription de test avec son matricule
    const testPrescription = await Prescription.findOne({
      where: { deliveryStatus: 'pending' },
      include: [
        { model: BaseUser, as: 'patient', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    if (!testPrescription) {
      console.log('❌ Aucune prescription en attente trouvée pour le test');
      process.exit(1);
    }

    const testMatricule = testPrescription.matricule;
    console.log(`📋 Prescription de test trouvée:`);
    console.log(`   ID: ${testPrescription.id}`);
    console.log(`   Médicament: ${testPrescription.medication}`);
    console.log(`   Matricule: ${testMatricule}`);
    console.log(`   Patient: ${testPrescription.patient?.firstName} ${testPrescription.patient?.lastName}\n`);

    // Validation du format
    const regex = /^PRX-\d{8}-[A-F0-9]{8}$/;
    const isValid = regex.test(testMatricule);

    console.log(`🔍 Validation du format:`);
    console.log(`   Regex: ${regex}`);
    console.log(`   Matricule: ${testMatricule}`);
    console.log(`   Résultat: ${isValid ? '✅ VALIDE' : '❌ INVALIDE'}\n`);

    if (!isValid) {
      console.log('❌ Le matricule ne correspond pas au format attendu!');
      console.log('   Il faut corriger le générateur de matricules.\n');
      process.exit(1);
    }

    // Tester la recherche dans la base de données
    console.log(`🔍 Test de recherche dans la base de données...`);
    const foundPrescription = await Prescription.findOne({
      where: { matricule: testMatricule },
      include: [
        { model: BaseUser, as: 'patient', attributes: ['id', 'firstName', 'lastName'] },
        { model: BaseUser, as: 'doctor', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    if (!foundPrescription) {
      console.log(`❌ Prescription non trouvée avec le matricule ${testMatricule}`);
      process.exit(1);
    }

    console.log(`✅ Prescription trouvée avec succès!`);
    console.log(`   ID: ${foundPrescription.id}`);
    console.log(`   Médicament: ${foundPrescription.medication}`);
    console.log(`   Dosage: ${foundPrescription.dosage}`);
    console.log(`   Quantité: ${foundPrescription.quantity}`);
    console.log(`   Patient: ${foundPrescription.patient?.firstName} ${foundPrescription.patient?.lastName}`);
    console.log(`   Docteur: ${foundPrescription.doctor?.firstName} ${foundPrescription.doctor?.lastName}\n`);

    // Rechercher toutes les prescriptions du même patient
    console.log(`🔍 Recherche de toutes les prescriptions du patient...`);
    const patientPrescriptions = await Prescription.findAll({
      where: {
        patientId: foundPrescription.patientId,
        deliveryStatus: 'pending'
      },
      include: [
        { model: BaseUser, as: 'patient', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    console.log(`✅ ${patientPrescriptions.length} prescription(s) en attente trouvée(s) pour le patient\n`);

    patientPrescriptions.forEach((p, index) => {
      console.log(`   ${index + 1}. ${p.medication} - Matricule: ${p.matricule}`);
    });

    console.log('\n✅ Test de recherche par matricule réussi!\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    process.exit(1);
  }
}

testMatriculeSearch();
