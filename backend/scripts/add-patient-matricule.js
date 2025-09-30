const { sequelize } = require('../src/config/database');
const { BaseUser } = require('../src/models');
const crypto = require('crypto');

async function addMatriculeColumn() {
  try {
    console.log('🔄 Ajout de la colonne matricule à BaseUsers...');

    // Ajouter la colonne (sans contrainte UNIQUE car SQLite ne le supporte pas dans ALTER TABLE)
    await sequelize.query(`
      ALTER TABLE BaseUsers ADD COLUMN matricule VARCHAR(255);
    `);

    console.log('✅ Colonne matricule ajoutée');

    // Créer un index unique
    await sequelize.query(`
      CREATE UNIQUE INDEX idx_baseuser_matricule ON BaseUsers(matricule);
    `);

    console.log('✅ Index unique créé');

  } catch (error) {
    if (error.message.includes('duplicate column') || error.message.includes('already exists')) {
      console.log('⚠️  La colonne matricule existe déjà');
    } else {
      throw error;
    }
  }
}

async function generateMatriculesForExistingPatients() {
  try {
    console.log('\n🔄 Génération de matricules pour les patients existants...');

    // Récupérer tous les patients sans matricule
    const patientsWithoutMatricule = await BaseUser.findAll({
      where: {
        role: 'patient',
        matricule: null
      }
    });

    console.log(`📋 ${patientsWithoutMatricule.length} patient(s) sans matricule trouvé(s)`);

    let successCount = 0;
    let errorCount = 0;

    for (const patient of patientsWithoutMatricule) {
      try {
        let newMatricule;
        let exists = true;
        let attempts = 0;
        const maxAttempts = 10;

        while (exists && attempts < maxAttempts) {
          const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
          const random = crypto.randomBytes(2).toString('hex').toUpperCase();
          newMatricule = `PAT-${date}-${random}`;

          const existing = await BaseUser.findOne({ where: { matricule: newMatricule } });
          exists = !!existing;
          attempts++;
        }

        if (!exists) {
          await patient.update({ matricule: newMatricule });
          console.log(`  ✅ ${patient.firstName} ${patient.lastName} → ${newMatricule}`);
          successCount++;
        } else {
          console.log(`  ❌ Impossible de générer un matricule pour ${patient.firstName} ${patient.lastName}`);
          errorCount++;
        }
      } catch (error) {
        console.error(`  ❌ Erreur pour ${patient.firstName} ${patient.lastName}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n✨ Résumé: ${successCount} succès, ${errorCount} échec(s)`);

  } catch (error) {
    console.error('❌ Erreur lors de la génération des matricules:', error.message);
    throw error;
  }
}

async function runMigration() {
  try {
    console.log('🚀 Démarrage de la migration matricule patient\n');

    // Étape 1: Ajouter la colonne
    await addMatriculeColumn();

    // Étape 2: Générer les matricules pour les patients existants
    await generateMatriculesForExistingPatients();

    console.log('\n✅ Migration terminée avec succès !');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erreur lors de la migration:', error.message);
    process.exit(1);
  }
}

runMigration();