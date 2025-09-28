const logger = require('./src/utils/logger');

console.log('🧪 Test du système de logging FADJMA\n');

// Test 1: Actions client
console.log('1. Test des actions client...');
logger.logAuthentication('login', {
  userId: 'user-123',
  userRole: 'doctor',
  ip: '192.168.1.100',
  userAgent: 'Mozilla/5.0 Test Browser',
  method: 'POST',
  url: '/api/auth/login',
  statusCode: 200,
  responseTime: 450
});

logger.logResourceAccess('medical_record', 'record-456', 'view', {
  userId: 'user-123',
  userRole: 'doctor',
  ip: '192.168.1.100',
  method: 'GET',
  url: '/api/records/456',
  statusCode: 200,
  responseTime: 120
});

// Test 2: Actions serveur
console.log('2. Test des actions serveur...');
logger.logHederaTransaction('anchor', {
  recordId: 'record-456',
  transactionId: '0.0.6854064@1634567890.123456789',
  topicId: '0.0.6854064',
  sequenceNumber: '1001',
  duration: 3200,
  success: true
});

logger.logDatabaseOperation('create', 'medical_records', {
  recordId: 'record-789',
  patientId: 'patient-321',
  doctorId: 'doctor-654',
  duration: 45,
  success: true
});

logger.logIntegrityCheck('hash', { isValid: true, hashMatches: true }, {
  recordId: 'record-456',
  expectedHash: 'abc123',
  actualHash: 'abc123'
});

// Test 3: Erreurs
console.log('3. Test de la gestion des erreurs...');
const testError = new Error('Test error for logging system');
testError.code = 'TEST_ERROR';
testError.statusCode = 500;

logger.logError(testError, {
  service: 'TEST',
  action: 'LOGGING_TEST',
  userId: 'user-123',
  ip: '192.168.1.100',
  url: '/api/test',
  method: 'POST'
});

logger.logHederaError(new Error('Hedera connection timeout'), {
  action: 'SUBMIT_MESSAGE',
  recordId: 'record-999'
});

logger.logDatabaseError(new Error('Connection pool exhausted'), {
  action: 'CREATE_RECORD',
  table: 'medical_records'
});

// Test 4: Logs généraux
console.log('4. Test des logs généraux...');
logger.info('Système de logging initialisé avec succès', {
  version: '1.0.0',
  logFiles: ['client-actions.log', 'server-internal.log', 'errors.log']
});

logger.warn('Utilisation mémoire élevée détectée', {
  memoryUsage: '512MB',
  threshold: '500MB'
});

// Test 5: Statistiques
setTimeout(async () => {
  console.log('5. Test des statistiques des logs...');
  try {
    const stats = await logger.getLogStats();
    console.log('Statistiques des fichiers de logs:');
    Object.entries(stats).forEach(([file, data]) => {
      if (data.exists) {
        console.log(`  ${file}: ${data.size} bytes, modifié le ${new Date(data.modified).toLocaleString()}`);
      } else {
        console.log(`  ${file}: fichier non trouvé`);
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des stats:', error.message);
  }

  // Test 6: Lecture des logs
  console.log('\n6. Test de lecture des logs...');
  try {
    const clientLogs = await logger.readLogFile('client', 5);
    console.log(`Dernières actions client (${clientLogs.length} entrées):`);
    clientLogs.forEach((log, index) => {
      console.log(`  ${index + 1}. ${log.timestamp} - ${log.message}`);
    });

    const serverLogs = await logger.readLogFile('server', 3);
    console.log(`\nDernières actions serveur (${serverLogs.length} entrées):`);
    serverLogs.forEach((log, index) => {
      console.log(`  ${index + 1}. ${log.timestamp} - ${log.message}`);
    });

    const errorLogs = await logger.readLogFile('errors', 3);
    console.log(`\nDernières erreurs (${errorLogs.length} entrées):`);
    errorLogs.forEach((log, index) => {
      console.log(`  ${index + 1}. ${log.timestamp} - ${log.message}`);
    });

  } catch (error) {
    console.error('Erreur lors de la lecture des logs:', error.message);
  }

  console.log('\n✅ Test du système de logging terminé!');
  console.log('📁 Fichiers de logs créés dans: backend/logs/');
  console.log('   - client-actions.log : Actions des utilisateurs');
  console.log('   - server-internal.log : Opérations internes du serveur');
  console.log('   - errors.log : Erreurs et exceptions');
  console.log('   - combined.log : Tous les logs combinés');

}, 1000);