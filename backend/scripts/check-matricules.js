const { Prescription, BaseUser } = require('../src/models');
const logger = require('../src/utils/logger');

async function checkMatricules() {
  try {
    console.log('\n🔍 Vérification des matricules dans la base de données...\n');

    // Compter le nombre total de prescriptions
    const totalPrescriptions = await Prescription.count();
    console.log(`📊 Total prescriptions: ${totalPrescriptions}`);

    // Compter les prescriptions avec matricule
    const withMatricule = await Prescription.count({
      where: {
        matricule: {
          [require('sequelize').Op.ne]: null
        }
      }
    });
    console.log(`✅ Prescriptions avec matricule: ${withMatricule}`);

    // Compter les prescriptions sans matricule
    const withoutMatricule = totalPrescriptions - withMatricule;
    console.log(`❌ Prescriptions SANS matricule: ${withoutMatricule}\n`);

    // Afficher quelques exemples de prescriptions
    console.log('📋 Exemples de prescriptions:\n');
    const prescriptions = await Prescription.findAll({
      limit: 10,
      include: [
        { model: BaseUser, as: 'patient', attributes: ['id', 'firstName', 'lastName'] },
        { model: BaseUser, as: 'doctor', attributes: ['id', 'firstName', 'lastName'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    prescriptions.forEach((p, index) => {
      console.log(`${index + 1}. ID: ${p.id}`);
      console.log(`   Médicament: ${p.medication}`);
      console.log(`   Matricule: ${p.matricule || '⚠️  MANQUANT'}`);
      console.log(`   Statut: ${p.deliveryStatus}`);
      console.log(`   Patient: ${p.patient?.firstName} ${p.patient?.lastName}`);
      console.log(`   Date création: ${p.createdAt}`);
      console.log('');
    });

    // Vérifier les prescriptions en attente sans matricule
    const pendingWithoutMatricule = await Prescription.findAll({
      where: {
        deliveryStatus: 'pending',
        matricule: null
      },
      include: [
        { model: BaseUser, as: 'patient', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    if (pendingWithoutMatricule.length > 0) {
      console.log(`\n⚠️  PROBLÈME DÉTECTÉ: ${pendingWithoutMatricule.length} prescription(s) en attente SANS matricule\n`);
      console.log('Ces prescriptions ne peuvent pas être trouvées par recherche de matricule!\n');

      pendingWithoutMatricule.forEach((p, index) => {
        console.log(`${index + 1}. Prescription ID ${p.id} - ${p.medication} - Patient: ${p.patient?.firstName} ${p.patient?.lastName}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

checkMatricules();
