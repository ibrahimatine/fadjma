const { Prescription } = require('../src/models');
const crypto = require('crypto');

async function generateMatriculesForExisting() {
  console.log('Démarrage de la génération des matricules pour les prescriptions existantes...');

  try {
    // Récupérer toutes les prescriptions qui n'ont pas encore de matricule
    const prescriptions = await Prescription.findAll({
      where: {
        matricule: null
      }
    });

    console.log(`${prescriptions.length} prescriptions trouvées sans matricule.`);

    let generated = 0;
    for (const prescription of prescriptions) {
      let matricule;
      let exists = true;

      // Générer un matricule unique
      while (exists) {
        // Utiliser la date de création de la prescription ou la date actuelle
        const date = prescription.issueDate
          ? new Date(prescription.issueDate).toISOString().slice(0, 10).replace(/-/g, '')
          : new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const random = crypto.randomBytes(2).toString('hex').toUpperCase();
        matricule = `PRX-${date}-${random}`;

        // Vérifier l'unicité
        const existing = await Prescription.findOne({ where: { matricule } });
        exists = !!existing;
      }

      // Mettre à jour la prescription
      prescription.matricule = matricule;
      await prescription.save();
      generated++;

      console.log(`Prescription ${prescription.id} -> ${matricule}`);
    }

    console.log(`✅ ${generated} matricules générés avec succès.`);

    // Ajouter l'index unique après génération des matricules (SQLite)
    const { sequelize } = require('../src/config/database');

    console.log('Ajout de l\'index UNIQUE...');

    // SQLite ne supporte pas ALTER COLUMN pour NOT NULL sur colonne existante
    // On crée seulement l'index unique
    await sequelize.query('CREATE UNIQUE INDEX IF NOT EXISTS prescriptions_matricule_unique ON Prescriptions(matricule);');

    console.log('✅ Index unique ajouté avec succès.');
    console.log('⚠️  Note: La contrainte NOT NULL ne peut pas être ajoutée sur SQLite pour une colonne existante.');
    console.log('   Les nouvelles prescriptions auront automatiquement un matricule grâce au hook beforeCreate.');

  } catch (error) {
    console.error('❌ Erreur lors de la génération des matricules:', error);
    process.exit(1);
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  generateMatriculesForExisting()
    .then(() => {
      console.log('Migration terminée avec succès.');
      process.exit(0);
    })
    .catch(error => {
      console.error('Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = generateMatriculesForExisting;