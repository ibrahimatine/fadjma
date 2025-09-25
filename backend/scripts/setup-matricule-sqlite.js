const { sequelize } = require('../src/config/database');
const { Prescription } = require('../src/models');
const crypto = require('crypto');

async function setupMatriculeForSQLite() {
  console.log('🚀 Configuration du système de matricules pour SQLite...');

  try {
    // Vérifier la connexion à la base
    await sequelize.authenticate();
    console.log('✅ Connexion à la base SQLite établie.');

    // Étape 1: Vérifier si la colonne matricule existe
    const tableDescription = await sequelize.getQueryInterface().describeTable('Prescriptions');

    if (!tableDescription.matricule) {
      console.log('📝 Ajout de la colonne matricule...');
      await sequelize.getQueryInterface().addColumn('Prescriptions', 'matricule', {
        type: sequelize.Sequelize.DataTypes.STRING,
        allowNull: true,
        unique: false // On ajoutera l'unicité après
      });
      console.log('✅ Colonne matricule ajoutée.');
    } else {
      console.log('ℹ️  La colonne matricule existe déjà.');
    }

    // Étape 2: Compter les prescriptions existantes sans matricule
    const prescriptionsWithoutMatricule = await Prescription.count({
      where: {
        matricule: null
      }
    });

    console.log(`📊 ${prescriptionsWithoutMatricule} prescriptions trouvées sans matricule.`);

    if (prescriptionsWithoutMatricule > 0) {
      console.log('🔧 Génération des matricules pour les prescriptions existantes...');

      // Traiter par petits lots pour éviter les problèmes de mémoire
      const batchSize = 50;
      let processed = 0;

      while (processed < prescriptionsWithoutMatricule) {
        const prescriptions = await Prescription.findAll({
          where: { matricule: null },
          limit: batchSize,
          offset: processed
        });

        if (prescriptions.length === 0) break;

        for (const prescription of prescriptions) {
          let matricule;
          let exists = true;
          let attempts = 0;
          const maxAttempts = 10;

          // Générer un matricule unique avec retry logic
          while (exists && attempts < maxAttempts) {
            const date = prescription.issueDate
              ? new Date(prescription.issueDate).toISOString().slice(0, 10).replace(/-/g, '')
              : new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const random = crypto.randomBytes(2).toString('hex').toUpperCase();
            matricule = `PRX-${date}-${random}`;

            // Vérifier l'unicité
            const existing = await Prescription.findOne({ where: { matricule } });
            exists = !!existing;
            attempts++;
          }

          if (attempts >= maxAttempts) {
            console.error(`❌ Impossible de générer un matricule unique pour la prescription ${prescription.id}`);
            continue;
          }

          // Mettre à jour directement avec une requête SQL pour éviter les hooks
          await sequelize.query(
            'UPDATE Prescriptions SET matricule = ? WHERE id = ?',
            {
              replacements: [matricule, prescription.id],
              type: sequelize.QueryTypes.UPDATE
            }
          );

          processed++;
          if (processed % 10 === 0) {
            console.log(`   📈 ${processed}/${prescriptionsWithoutMatricule} prescriptions traitées...`);
          }
        }
      }

      console.log(`✅ ${processed} matricules générés avec succès.`);
    }

    // Étape 3: Créer l'index unique
    console.log('🔧 Création de l\'index unique...');

    try {
      await sequelize.query('CREATE UNIQUE INDEX IF NOT EXISTS prescriptions_matricule_unique ON Prescriptions(matricule);');
      console.log('✅ Index unique créé.');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  L\'index unique existe déjà.');
      } else {
        throw error;
      }
    }

    // Étape 4: Vérifications finales
    console.log('🔍 Vérifications finales...');

    const totalPrescriptions = await Prescription.count();
    const prescriptionsWithMatricule = await Prescription.count({
      where: {
        matricule: { [sequelize.Sequelize.Op.ne]: null }
      }
    });

    console.log(`📊 Total prescriptions: ${totalPrescriptions}`);
    console.log(`📊 Avec matricule: ${prescriptionsWithMatricule}`);

    if (prescriptionsWithMatricule < totalPrescriptions) {
      console.log(`⚠️  ${totalPrescriptions - prescriptionsWithMatricule} prescriptions n'ont toujours pas de matricule.`);
    }

    // Tester l'unicité
    const duplicateCheck = await sequelize.query(`
      SELECT matricule, COUNT(*) as count
      FROM Prescriptions
      WHERE matricule IS NOT NULL
      GROUP BY matricule
      HAVING COUNT(*) > 1
    `, { type: sequelize.QueryTypes.SELECT });

    if (duplicateCheck.length > 0) {
      console.error('❌ Des matricules dupliqués ont été détectés:', duplicateCheck);
      throw new Error('Matricules dupliqués détectés');
    }

    console.log('✅ Aucun matricule dupliqué détecté.');

    // Tester la génération pour une nouvelle prescription
    console.log('🧪 Test de création d\'une nouvelle prescription...');

    const testPrescription = await Prescription.create({
      patientId: 'test-patient-' + Date.now(),
      doctorId: 'test-doctor-' + Date.now(),
      medication: 'Test Medication',
      dosage: '500mg',
      quantity: 30,
      issueDate: new Date()
    });

    if (!testPrescription.matricule) {
      throw new Error('Le hook beforeCreate ne fonctionne pas correctement');
    }

    console.log(`✅ Test réussi. Matricule généré: ${testPrescription.matricule}`);

    // Nettoyer la prescription de test
    await testPrescription.destroy();

    console.log('\n🎉 Configuration du système de matricules terminée avec succès !');
    console.log('\nℹ️  Prochaines étapes:');
    console.log('   1. Redémarrer l\'application backend');
    console.log('   2. Tester la recherche par matricule dans le dashboard pharmacien');
    console.log('   3. Vérifier les logs d\'audit');

  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error);
    console.error('\n🔧 Actions de dépannage:');
    console.error('   1. Vérifiez que la base SQLite est accessible');
    console.error('   2. Vérifiez les permissions sur le fichier de base');
    console.error('   3. Consultez les logs pour plus de détails');
    process.exit(1);
  }
}

// Fonction utilitaire pour vérifier l'état du système
async function checkMatriculeSystem() {
  try {
    console.log('🔍 Vérification de l\'état du système de matricules...');

    const stats = await Promise.all([
      Prescription.count(),
      Prescription.count({ where: { matricule: { [sequelize.Sequelize.Op.ne]: null } } }),
      sequelize.query("SELECT name FROM sqlite_master WHERE type='index' AND name='prescriptions_matricule_unique'",
        { type: sequelize.QueryTypes.SELECT }
      )
    ]);

    const [total, withMatricule, indexExists] = stats;

    console.log('\n📊 État actuel:');
    console.log(`   Total prescriptions: ${total}`);
    console.log(`   Avec matricule: ${withMatricule}`);
    console.log(`   Index unique: ${indexExists.length > 0 ? '✅ Existe' : '❌ Manquant'}`);
    console.log(`   Couverture: ${total > 0 ? Math.round((withMatricule / total) * 100) : 0}%`);

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
  }
}

// Exécuter le script selon les arguments
const args = process.argv.slice(2);

if (args.includes('--check')) {
  checkMatriculeSystem().then(() => process.exit(0));
} else {
  setupMatriculeForSQLite().then(() => process.exit(0));
}

module.exports = {
  setupMatriculeForSQLite,
  checkMatriculeSystem
};