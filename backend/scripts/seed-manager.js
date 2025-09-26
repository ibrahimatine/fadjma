#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

const SEEDS = {
  'full': {
    file: 'seed.js',
    description: '🏥 Base complète avec données de démonstration (dossiers médicaux, prescriptions, etc.)'
  },
  'clean': {
    file: 'seed-clean.js',
    description: '🧹 Base propre avec uniquement les utilisateurs de base'
  }
};

function showUsage() {
  console.log('\n📊 GESTIONNAIRE DE SEEDS FADJMA');
  console.log('='.repeat(50));
  console.log('\nUsage: npm run seed [type]');
  console.log('\nTypes disponibles:');

  Object.entries(SEEDS).forEach(([key, config]) => {
    console.log(`  ${key.padEnd(8)} - ${config.description}`);
  });

  console.log('\nExemples:');
  console.log('  npm run seed full    # Charge la base complète');
  console.log('  npm run seed clean   # Charge la base propre');
  console.log('  npm run seed         # Affiche cette aide');
  console.log('\n' + '='.repeat(50));
}

function runSeed(seedType) {
  const config = SEEDS[seedType];

  if (!config) {
    console.error(`❌ Type de seed invalide: ${seedType}`);
    console.log('\n📋 Types disponibles:', Object.keys(SEEDS).join(', '));
    process.exit(1);
  }

  const scriptPath = path.join(__dirname, config.file);

  console.log(`\n🚀 Exécution du seed: ${seedType}`);
  console.log(`📁 Script: ${config.file}`);
  console.log(`📝 ${config.description}`);
  console.log('\n' + '='.repeat(50));

  try {
    execSync(`node "${scriptPath}"`, {
      stdio: 'inherit',
      cwd: path.dirname(scriptPath)
    });
  } catch (error) {
    console.error(`❌ Erreur lors de l'exécution du seed ${seedType}:`, error.message);
    process.exit(1);
  }
}

// Arguments de ligne de commande
const seedType = process.argv[2];

if (!seedType) {
  showUsage();
  process.exit(0);
}

runSeed(seedType);