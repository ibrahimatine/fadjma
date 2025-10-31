const { MedicalRecord, BaseUser } = require('../src/models');
const logger = require('../src/utils/logger');

async function checkOrdonnances() {
  try {
    console.log('\n🔍 Vérification des ordonnances dans la base de données...\n');

    // Compter le nombre total d'ordonnances (prescriptions)
    const totalOrdonnances = await MedicalRecord.count({
      where: { type: 'prescription' }
    });
    console.log(`📊 Total ordonnances: ${totalOrdonnances}`);

    // Compter les ordonnances avec matricule
    const withMatricule = await MedicalRecord.count({
      where: {
        type: 'prescription',
        prescriptionMatricule: {
          [require('sequelize').Op.ne]: null
        }
      }
    });
    console.log(`✅ Ordonnances avec matricule: ${withMatricule}`);

    // Compter les ordonnances sans matricule
    const withoutMatricule = totalOrdonnances - withMatricule;
    console.log(`❌ Ordonnances SANS matricule: ${withoutMatricule}\n`);

    // Afficher quelques exemples d'ordonnances
    console.log('📋 Exemples d\'ordonnances:\n');
    const ordonnances = await MedicalRecord.findAll({
      where: { type: 'prescription' },
      limit: 10,
      include: [
        { model: BaseUser, as: 'patient', attributes: ['id', 'firstName', 'lastName'] },
        { model: BaseUser, as: 'doctor', attributes: ['id', 'firstName', 'lastName'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    ordonnances.forEach((ord, index) => {
      console.log(`${index + 1}. ID: ${ord.id}`);
      console.log(`   Titre: ${ord.title}`);
      console.log(`   Matricule: ${ord.prescriptionMatricule || '⚠️  MANQUANT'}`);
      if (ord.prescriptionMatricule) {
        // Vérifier la longueur du matricule
        const parts = ord.prescriptionMatricule.split('-');
        if (parts.length === 3) {
          const hexPart = parts[2];
          console.log(`   Longueur code hexa: ${hexPart.length} caractères (${hexPart})`);
        }
      }
      console.log(`   Patient: ${ord.patient?.firstName} ${ord.patient?.lastName}`);
      console.log(`   Date création: ${ord.createdAt}`);
      console.log('');
    });

    // Analyser les formats de matricules
    const ordonnancesAvecMatricule = await MedicalRecord.findAll({
      where: {
        type: 'prescription',
        prescriptionMatricule: {
          [require('sequelize').Op.ne]: null
        }
      }
    });

    if (ordonnancesAvecMatricule.length > 0) {
      console.log('\n📊 Analyse des formats de matricules:\n');

      const formats = {};
      ordonnancesAvecMatricule.forEach(ord => {
        const parts = ord.prescriptionMatricule.split('-');
        if (parts.length === 3) {
          const hexLength = parts[2].length;
          formats[hexLength] = (formats[hexLength] || 0) + 1;
        }
      });

      Object.keys(formats).forEach(length => {
        console.log(`   ${formats[length]} ordonnance(s) avec ${length} caractères hexadécimaux`);
      });

      // Tester le regex 4 caractères
      const regex4 = /^ORD-\d{8}-[A-F0-9]{4}$/;
      const matching4 = ordonnancesAvecMatricule.filter(o => regex4.test(o.prescriptionMatricule)).length;
      console.log(`\n   ✅ Regex 4 caractères (ancien): ${matching4} ordonnances correspondent`);

      // Tester le regex 8 caractères
      const regex8 = /^ORD-\d{8}-[A-F0-9]{8}$/;
      const matching8 = ordonnancesAvecMatricule.filter(o => regex8.test(o.prescriptionMatricule)).length;
      console.log(`   ✅ Regex 8 caractères (nouveau): ${matching8} ordonnances correspondent\n`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

checkOrdonnances();
