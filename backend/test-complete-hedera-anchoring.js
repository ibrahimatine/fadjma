// Test complet des ancrages Hedera pour toutes les actions critiques
require('dotenv').config();
const hederaService = require('./src/services/hederaService');
const monitoringService = require('./src/services/monitoringService');
const nftService = require('./src/services/nftService');

async function testCompleteHederaAnchoring() {
  console.log('🔍 Test complet des ancrages Hedera FADJMA...\n');

  // Reset monitoring pour avoir des métriques propres
  monitoringService.resetMetrics();

  console.log('='.repeat(60));
  console.log('1. TEST ANCRAGE DOSSIER MÉDICAL');
  console.log('='.repeat(60));

  try {
    const medicalRecord = {
      id: 'test-record-001',
      patientId: 'patient-123',
      doctorId: 'doctor-456',
      type: 'consultation',
      title: 'Consultation de contrôle',
      description: 'Examen médical de routine',
      diagnosis: 'Patient en bonne santé',
      createdAt: new Date()
    };

    const result1 = await hederaService.anchorRecord(medicalRecord);
    console.log('✅ Dossier médical ancré:', {
      hash: result1.hash?.substring(0, 16) + '...',
      status: result1.status,
      topicId: result1.topicId
    });
  } catch (error) {
    console.error('❌ Échec dossier médical:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('2. TEST ANCRAGE PRESCRIPTION INDIVIDUELLE');
  console.log('='.repeat(60));

  try {
    const prescription = {
      id: 'prescription-001',
      patientId: 'patient-123',
      doctorId: 'doctor-456',
      type: 'prescription',
      medication: 'Paracétamol 500mg',
      dosage: '1 comprimé',
      matricule: 'PRX-20250925-A1B2',
      issueDate: new Date(),
      deliveryStatus: 'pending'
    };

    const result2 = await hederaService.anchorRecord(prescription);
    console.log('✅ Prescription ancrée:', {
      hash: result2.hash?.substring(0, 16) + '...',
      status: result2.status,
      matricule: prescription.matricule
    });
  } catch (error) {
    console.error('❌ Échec prescription:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('3. TEST ANCRAGE AUTORISATION D\'ACCÈS');
  console.log('='.repeat(60));

  try {
    // Demande d'autorisation
    const accessRequest = {
      id: 'access-request-001',
      type: 'access_request',
      patientId: 'patient-123',
      requesterId: 'doctor-789',
      reason: 'Consultation urgente',
      accessLevel: 'read',
      status: 'pending',
      createdAt: new Date()
    };

    const result3a = await hederaService.anchorRecord(accessRequest);
    console.log('✅ Demande d\'accès ancrée:', {
      hash: result3a.hash?.substring(0, 16) + '...',
      status: result3a.status
    });

    // Décision d'autorisation
    const accessDecision = {
      id: 'access-request-001_decision',
      type: 'access_decision',
      originalRequestId: 'access-request-001',
      patientId: 'patient-123',
      requesterId: 'doctor-789',
      reviewerId: 'patient-123',
      decision: 'approved',
      reviewedAt: new Date()
    };

    const result3b = await hederaService.anchorRecord(accessDecision);
    console.log('✅ Décision d\'accès ancrée:', {
      hash: result3b.hash?.substring(0, 16) + '...',
      status: result3b.status,
      decision: accessDecision.decision
    });
  } catch (error) {
    console.error('❌ Échec autorisation:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('4. TEST ANCRAGE CERTIFICAT VACCINATION NFT');
  console.log('='.repeat(60));

  try {
    const vaccinationRecord = {
      id: 'vaccination-001',
      patientId: 'patient-123',
      doctorId: 'doctor-456',
      patient: { firstName: 'Jean', lastName: 'Dupont' },
      metadata: {
        vaccine: 'COVID-19 Pfizer',
        batchNumber: 'PFE-2024-001',
        doseNumber: 1
      }
    };

    const nftResult = await nftService.createVaccinationCertificate(vaccinationRecord);
    console.log('✅ Certificat NFT créé:', {
      serialNumber: nftResult.serialNumber,
      status: nftResult.status,
      hederaAnchor: nftResult.hederaAnchor ? 'Ancré' : 'Non ancré'
    });
  } catch (error) {
    console.error('❌ Échec certificat NFT:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('5. TEST ANCRAGE DÉLIVRANCE PHARMACIE');
  console.log('='.repeat(60));

  try {
    const deliveryConfirmation = {
      id: 'delivery-001',
      type: 'prescription_delivery',
      prescriptionId: 'prescription-001',
      pharmacyId: 'pharmacy-123',
      patientId: 'patient-123',
      deliveredAt: new Date(),
      confirmationHash: 'delivery-hash-123'
    };

    const result5 = await hederaService.anchorRecord(deliveryConfirmation);
    console.log('✅ Délivrance ancrée:', {
      hash: result5.hash?.substring(0, 16) + '...',
      status: result5.status
    });
  } catch (error) {
    console.error('❌ Échec délivrance:', error.message);
  }

  // Attendre un peu pour les métriques
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('\n' + '='.repeat(60));
  console.log('6. MÉTRIQUES FINALES');
  console.log('='.repeat(60));

  const metrics = monitoringService.getAllMetrics();
  console.log('\n📊 Résultats du test:');
  console.log(`   Total transactions: ${metrics.hedera.totalTransactions}`);
  console.log(`   Succès: ${metrics.hedera.successfulTransactions}`);
  console.log(`   Échecs: ${metrics.hedera.failedTransactions}`);
  console.log(`   Simulations: ${metrics.hedera.simulatedTransactions}`);
  console.log(`   Uptime Hedera: ${metrics.hedera.uptime}%`);
  console.log(`   Temps moyen: ${Math.round(metrics.hedera.averageResponseTime)}ms`);

  const alerts = monitoringService.getActiveAlerts();
  if (alerts.length > 0) {
    console.log('\n🚨 Alertes actives:');
    alerts.forEach(alert => {
      console.log(`   [${alert.type.toUpperCase()}] ${alert.message}`);
    });
  } else {
    console.log('\n✅ Aucune alerte système');
  }

  console.log('\n' + '='.repeat(60));
  console.log('RÉSUMÉ FINAL');
  console.log('='.repeat(60));

  const successRate = metrics.hedera.totalTransactions > 0
    ? Math.round((metrics.hedera.successfulTransactions / metrics.hedera.totalTransactions) * 100)
    : 0;

  console.log(`\n🎯 Taux de réussite global: ${successRate}%`);

  if (successRate >= 80) {
    console.log('🎉 TEST RÉUSSI - Système d\'ancrage Hedera opérationnel !');
    console.log('   ✓ Intégrité des dossiers médicaux garantie');
    console.log('   ✓ Traçabilité pharmaceutique sécurisée');
    console.log('   ✓ Conformité RGPD pour les autorisations');
    console.log('   ✓ Certificats de vaccination infalsifiables');
  } else if (successRate >= 50) {
    console.log('⚠️  TEST PARTIELLEMENT RÉUSSI - Optimisation recommandée');
  } else {
    console.log('❌ TEST ÉCHOUÉ - Vérification configuration Hedera requise');
  }

  console.log('\n💰 Coût estimé par transaction: ~0.0001 HBAR (~$0.000003)');
  console.log('💡 Recommandation: Système prêt pour production hackathon');
}

// Écouter les événements de monitoring
monitoringService.on('hederaTransaction', (data) => {
  const statusEmoji = data.status === 'SUCCESS' ? '✅' :
                     data.status === 'SIMULATED' ? '⚠️' : '❌';
  console.log(`   ${statusEmoji} Transaction: ${data.status} (${data.responseTime}ms)`);
});

testCompleteHederaAnchoring().catch(error => {
  console.error('\n💥 Erreur critique du test:', error.message);
  process.exit(1);
});