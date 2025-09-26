// Test du système de monitoring
require('dotenv').config();
const monitoringService = require('./src/services/monitoringService');

async function testMonitoring() {
  console.log('🔍 Test du système de monitoring...\n');

  // Reset des métriques pour commencer proprement
  monitoringService.resetMetrics();

  console.log('1. Test d\'enregistrement de transactions Hedera...');

  // Simuler quelques transactions
  monitoringService.recordHederaTransaction('SUCCESS', 1200, {
    recordId: 'test-1',
    recordType: 'prescription'
  });

  monitoringService.recordHederaTransaction('SIMULATED', 800, {
    recordId: 'test-2',
    recordType: 'consultation'
  });

  monitoringService.recordHederaTransaction('FAILED_FALLBACK', 5000, {
    recordId: 'test-3',
    recordType: 'prescription',
    error: 'Network timeout'
  });

  monitoringService.recordHederaTransaction('SUCCESS', 950, {
    recordId: 'test-4',
    recordType: 'vaccination'
  });

  console.log('2. Test d\'enregistrement de requêtes système...');

  // Simuler quelques requêtes système
  monitoringService.recordSystemRequest('/api/records', 'POST', 201, 150);
  monitoringService.recordSystemRequest('/api/pharmacy', 'GET', 200, 80);
  monitoringService.recordSystemRequest('/api/records', 'GET', 404, 50);
  monitoringService.recordSystemRequest('/api/auth/login', 'POST', 500, 2000);

  console.log('3. Test d\'enregistrement d\'opérations DB...');

  // Simuler quelques opérations DB
  monitoringService.recordDatabaseOperation('record', 120);
  monitoringService.recordDatabaseOperation('prescription', 85);
  monitoringService.recordDatabaseOperation('verification', 200);

  // Attendre un peu pour que les calculs se fassent
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('4. Résultats des métriques...');
  const metrics = monitoringService.getAllMetrics();

  console.log('\n📊 Métriques Hedera:');
  console.log(`   Total: ${metrics.hedera.totalTransactions}`);
  console.log(`   Succès: ${metrics.hedera.successfulTransactions}`);
  console.log(`   Échecs: ${metrics.hedera.failedTransactions}`);
  console.log(`   Simulation: ${metrics.hedera.simulatedTransactions}`);
  console.log(`   Uptime: ${metrics.hedera.uptime}%`);
  console.log(`   Temps moyen: ${Math.round(metrics.hedera.averageResponseTime)}ms`);

  console.log('\n📊 Métriques Système:');
  console.log(`   Mémoire: ${metrics.system.memoryUsage} MB`);
  console.log(`   CPU: ${metrics.system.cpuUsage}%`);
  console.log(`   Req/min: ${metrics.system.requestsPerMinute}`);
  console.log(`   Taux erreur: ${metrics.system.errorRate}%`);

  console.log('\n📊 Métriques DB:');
  console.log(`   Records: ${metrics.database.totalRecords}`);
  console.log(`   Prescriptions: ${metrics.database.prescriptions}`);
  console.log(`   Vérifications: ${metrics.database.verificationRequests}`);
  console.log(`   Temps moyen: ${Math.round(metrics.database.averageQueryTime)}ms`);

  console.log('5. Test des alertes...');
  const alerts = monitoringService.getActiveAlerts();
  console.log(`\n🚨 Alertes actives: ${alerts.length}`);
  alerts.forEach(alert => {
    console.log(`   [${alert.type.toUpperCase()}] ${alert.message}`);
  });

  console.log('\n✅ Test de monitoring terminé !');
}

// Écouter les événements de monitoring
monitoringService.on('hederaTransaction', (data) => {
  console.log(`📡 Événement Hedera: ${data.status} (${data.responseTime}ms)`);
});

monitoringService.on('systemHealth', (data) => {
  console.log(`💚 Santé système - Hedera: ${data.hedera.uptime}% | Erreurs: ${data.system.errorRate}%`);
});

testMonitoring().catch(console.error);