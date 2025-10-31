const { MedicalRecord, BaseUser } = require('../src/models');
const logger = require('../src/utils/logger');

async function testOrdonnanceSearch() {
  try {
    console.log('\n🧪 Test de recherche d\'ordonnances avec les deux formats...\n');

    // Test 1: Trouver une ordonnance avec ancien format (4 caractères)
    const oldFormatOrdonnance = await MedicalRecord.findOne({
      where: { type: 'prescription' },
      include: [
        { model: BaseUser, as: 'patient', attributes: ['id', 'firstName', 'lastName'] },
        { model: BaseUser, as: 'doctor', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    if (!oldFormatOrdonnance || !oldFormatOrdonnance.prescriptionMatricule) {
      console.log('❌ Aucune ordonnance trouvée pour le test');
      process.exit(1);
    }

    const oldMatricule = oldFormatOrdonnance.prescriptionMatricule;
    console.log('📋 Test 1: Ordonnance existante (ancien format)');
    console.log(`   Matricule: ${oldMatricule}`);
    console.log(`   Titre: ${oldFormatOrdonnance.title}`);
    console.log(`   Patient: ${oldFormatOrdonnance.patient?.firstName} ${oldFormatOrdonnance.patient?.lastName}`);

    // Vérifier le format
    const parts = oldMatricule.split('-');
    const hexLength = parts[2].length;
    console.log(`   Longueur code hexa: ${hexLength} caractères\n`);

    // Test regex
    const regex4 = /^ORD-\d{8}-[A-F0-9]{4}$/;
    const regex48 = /^ORD-\d{8}-[A-F0-9]{4,8}$/;
    const regex8 = /^ORD-\d{8}-[A-F0-9]{8}$/;

    console.log('🔍 Validation des regex:');
    console.log(`   Regex 4 caractères exact: ${regex4.test(oldMatricule) ? '✅ VALIDE' : '❌ INVALIDE'}`);
    console.log(`   Regex 4-8 caractères: ${regex48.test(oldMatricule) ? '✅ VALIDE' : '❌ INVALIDE'}`);
    console.log(`   Regex 8 caractères exact: ${regex8.test(oldMatricule) ? '✅ VALIDE' : '❌ INVALIDE'}\n`);

    // Test de recherche dans la base de données
    console.log('🔍 Test de recherche dans la base de données...');
    const foundOrdonnance = await MedicalRecord.findOne({
      where: { prescriptionMatricule: oldMatricule }
    });

    if (!foundOrdonnance) {
      console.log(`❌ Ordonnance non trouvée avec le matricule ${oldMatricule}`);
      process.exit(1);
    }

    console.log('✅ Ordonnance trouvée avec succès!\n');

    // Test 2: Simuler une nouvelle ordonnance avec 8 caractères
    console.log('📋 Test 2: Simulation nouveau format (8 caractères)');
    const newFormatExample = 'ORD-20251030-A1B2C3D4';
    console.log(`   Matricule simulé: ${newFormatExample}`);
    console.log(`   Longueur code hexa: 8 caractères\n`);

    console.log('🔍 Validation des regex pour nouveau format:');
    console.log(`   Regex 4 caractères exact: ${regex4.test(newFormatExample) ? '✅ VALIDE' : '❌ INVALIDE'}`);
    console.log(`   Regex 4-8 caractères: ${regex48.test(newFormatExample) ? '✅ VALIDE' : '❌ INVALIDE'}`);
    console.log(`   Regex 8 caractères exact: ${regex8.test(newFormatExample) ? '✅ VALIDE' : '❌ INVALIDE'}\n`);

    // Statistiques finales
    console.log('📊 Statistiques:');
    const allOrdonnances = await MedicalRecord.findAll({
      where: {
        type: 'prescription',
        prescriptionMatricule: {
          [require('sequelize').Op.ne]: null
        }
      }
    });

    const format4 = allOrdonnances.filter(o => {
      const parts = o.prescriptionMatricule.split('-');
      return parts[2] && parts[2].length === 4;
    }).length;

    const format8 = allOrdonnances.filter(o => {
      const parts = o.prescriptionMatricule.split('-');
      return parts[2] && parts[2].length === 8;
    }).length;

    console.log(`   Total ordonnances: ${allOrdonnances.length}`);
    console.log(`   Format 4 caractères (ancien): ${format4}`);
    console.log(`   Format 8 caractères (nouveau): ${format8}\n`);

    // Vérifier que tous les matricules sont valides avec le nouveau regex
    const allValid = allOrdonnances.every(o => regex48.test(o.prescriptionMatricule));

    if (allValid) {
      console.log('✅ SUCCÈS: Tous les matricules d\'ordonnances sont valides avec le nouveau regex!');
      console.log('✅ La recherche d\'ordonnances fonctionne pour les deux formats.\n');
    } else {
      console.log('❌ ÉCHEC: Certains matricules ne sont pas valides avec le nouveau regex.\n');
      process.exit(1);
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    process.exit(1);
  }
}

testOrdonnanceSearch();
