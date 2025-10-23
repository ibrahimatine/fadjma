/**
 * Script de vérification de la configuration Hedera Optimizations
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification de la configuration Hedera Optimizations\n');
console.log('='.repeat(60));

let allGood = true;

// 1. Vérifier les variables d'environnement
console.log('\n📋 1. Variables d\'environnement');
console.log('-'.repeat(60));

const requiredEnvVars = [
  'HEDERA_USE_BATCHING',
  'HEDERA_USE_COMPRESSION',
  'HEDERA_MAX_TPS',
  'HEDERA_MAX_BATCH_SIZE'
];

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  console.log(`${status} ${varName}: ${value || 'NON DÉFINI'}`);
  if (!value) allGood = false;
});

// 2. Vérifier les services
console.log('\n📦 2. Services créés');
console.log('-'.repeat(60));

const services = [
  'compressionService.js',
  'merkleTreeService.js',
  'batchAggregatorService.js',
  'rateLimiterService.js'
];

services.forEach(service => {
  const servicePath = path.join(__dirname, 'src', 'services', service);
  const exists = fs.existsSync(servicePath);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${service}`);
  if (!exists) allGood = false;
});

// 3. Vérifier le modèle
console.log('\n📊 3. Modèle HederaTransaction');
console.log('-'.repeat(60));

const modelPath = path.join(__dirname, 'src', 'models', 'HederaTransaction.js');
const modelExists = fs.existsSync(modelPath);
console.log(`${modelExists ? '✅' : '❌'} HederaTransaction.js`);
if (!modelExists) allGood = false;

// 4. Vérifier la migration
console.log('\n🗄️  4. Migration');
console.log('-'.repeat(60));

const migrationPath = path.join(__dirname, 'migrations', '20250117000000-create-hedera-transaction.js');
const migrationExists = fs.existsSync(migrationPath);
console.log(`${migrationExists ? '✅' : '❌'} 20250117000000-create-hedera-transaction.js`);
if (!migrationExists) allGood = false;

// 5. Vérifier les modifications
console.log('\n🔧 5. Services modifiés');
console.log('-'.repeat(60));

const modifiedServices = [
  'hedera.js',
  'hederaService.js',
  'hederaQueueService.js'
];

modifiedServices.forEach(service => {
  const servicePath = path.join(__dirname, 'src', service.includes('hedera.js') ? 'config' : 'services', service);
  const exists = fs.existsSync(servicePath);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${service}`);
  if (!exists) allGood = false;
});

// 6. Vérifier les tests
console.log('\n🧪 6. Tests');
console.log('-'.repeat(60));

const testPath = path.join(__dirname, 'test-hedera-optimizations.js');
const testExists = fs.existsSync(testPath);
console.log(`${testExists ? '✅' : '❌'} test-hedera-optimizations.js`);
if (!testExists) allGood = false;

// 7. Vérifier la documentation
console.log('\n📚 7. Documentation');
console.log('-'.repeat(60));

const docPath = path.join(__dirname, '..', 'docs', 'HEDERA_OPTIMIZATIONS.md');
const docExists = fs.existsSync(docPath);
console.log(`${docExists ? '✅' : '❌'} HEDERA_OPTIMIZATIONS.md`);
if (!docExists) allGood = false;

// Résumé
console.log('\n' + '='.repeat(60));
if (allGood) {
  console.log('✅ CONFIGURATION COMPLÈTE - Tout est en place!\n');
  console.log('📌 Prochaines étapes:');
  console.log('   1. Exécuter la migration:');
  console.log('      node run-hedera-migration.js');
  console.log('   2. Tester les optimisations:');
  console.log('      node test-hedera-optimizations.js');
  console.log('   3. Démarrer le serveur:');
  console.log('      npm start\n');
} else {
  console.log('❌ CONFIGURATION INCOMPLÈTE - Vérifiez les éléments manquants ci-dessus\n');
  process.exit(1);
}
