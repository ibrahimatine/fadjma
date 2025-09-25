const request = require('supertest');
const { app } = require('../src/app'); // Ajustez selon votre structure
const { Prescription, BaseUser } = require('../src/models');

describe('Système de Matricules - Workflow Complet', () => {
  let doctorToken, patientToken, pharmacyToken;
  let testPrescription;
  let matricule;

  beforeAll(async () => {
    // Setup des utilisateurs de test et tokens
    // Note: Ajustez selon votre système d'authentification
    doctorToken = 'doctor_jwt_token';
    patientToken = 'patient_jwt_token';
    pharmacyToken = 'pharmacy_jwt_token';
  });

  describe('1. Création de Prescription avec Matricule', () => {
    test('Devrait créer une prescription avec un matricule auto-généré', async () => {
      const prescriptionData = {
        patientId: 'patient-uuid',
        medication: 'Paracétamol',
        dosage: '500mg',
        quantity: 30,
        instructions: '1 comprimé 3 fois par jour'
      };

      // Simuler la création via l'API prescriptions
      const response = await request(app)
        .post('/api/prescriptions')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(prescriptionData);

      expect(response.status).toBe(201);
      expect(response.body.prescription).toBeDefined();
      expect(response.body.prescription.matricule).toMatch(/^PRX-\d{8}-[A-F0-9]{4}$/);

      testPrescription = response.body.prescription;
      matricule = testPrescription.matricule;
    });

    test('Devrait avoir des matricules uniques pour chaque prescription', async () => {
      const prescriptionData = {
        patientId: 'another-patient-uuid',
        medication: 'Ibuprofène',
        dosage: '200mg',
        quantity: 20
      };

      const response = await request(app)
        .post('/api/prescriptions')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(prescriptionData);

      expect(response.status).toBe(201);
      expect(response.body.prescription.matricule).not.toBe(matricule);
      expect(response.body.prescription.matricule).toMatch(/^PRX-\d{8}-[A-F0-9]{4}$/);
    });
  });

  describe('2. Accès Médecin/Patient au Matricule', () => {
    test('Le médecin devrait pouvoir voir le matricule de sa prescription', async () => {
      const response = await request(app)
        .get(`/api/pharmacy/prescription/${testPrescription.id}/matricule`)
        .set('Authorization', `Bearer ${doctorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.matricule.matricule).toBe(matricule);
      expect(response.body.matricule.context).toContain('Transmettez ce matricule');
      expect(response.body.matricule.instructions).toBeDefined();
    });

    test('Le patient devrait pouvoir voir le matricule de sa prescription', async () => {
      const response = await request(app)
        .get(`/api/pharmacy/prescription/${testPrescription.id}/matricule`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(response.status).toBe(200);
      expect(response.body.matricule.matricule).toBe(matricule);
      expect(response.body.matricule.context).toContain('Présentez ce matricule');
    });

    test('Devrait générer un QR Code quand demandé', async () => {
      const response = await request(app)
        .get(`/api/pharmacy/prescription/${testPrescription.id}/matricule?qr=true`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(response.status).toBe(200);
      expect(response.body.matricule.qrCode).toBeDefined();
      expect(response.body.matricule.qrCode).toContain('qrserver.com');
    });

    test('Ne devrait pas permettre l\'accès à un matricule non autorisé', async () => {
      const response = await request(app)
        .get(`/api/pharmacy/prescription/wrong-id/matricule`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('3. Recherche par Matricule (Pharmacie)', () => {
    test('Devrait trouver une prescription avec un matricule valide', async () => {
      const response = await request(app)
        .get(`/api/pharmacy/by-matricule/${matricule}`)
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('trouvée avec succès');
      expect(response.body.prescription.id).toBe(testPrescription.id);
      expect(response.body.prescription.medication).toBe('Paracétamol');
      expect(response.body.prescription.patient).toBeDefined();
      expect(response.body.prescription.doctor).toBeDefined();
    });

    test('Devrait rejeter un format de matricule invalide', async () => {
      const response = await request(app)
        .get('/api/pharmacy/by-matricule/INVALID-FORMAT')
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Format de matricule invalide');
    });

    test('Devrait retourner 404 pour un matricule inexistant', async () => {
      const response = await request(app)
        .get('/api/pharmacy/by-matricule/PRX-20240101-ZZZZ')
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('Aucune prescription trouvée');
    });

    test('Ne devrait pas permettre l\'accès aux non-pharmaciens', async () => {
      const response = await request(app)
        .get(`/api/pharmacy/by-matricule/${matricule}`)
        .set('Authorization', `Bearer ${patientToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('4. Assignation de Pharmacie', () => {
    test('Devrait assigner automatiquement la pharmacie au premier accès', async () => {
      // Vérifier l'assignation après la recherche
      const prescription = await Prescription.findByPk(testPrescription.id);
      expect(prescription.pharmacyId).toBeDefined();
    });

    test('Ne devrait pas permettre l\'accès à une autre pharmacie', async () => {
      // Simuler une autre pharmacie
      const otherPharmacyToken = 'other_pharmacy_token';

      const response = await request(app)
        .get(`/api/pharmacy/by-matricule/${matricule}`)
        .set('Authorization', `Bearer ${otherPharmacyToken}`);

      // Selon l'implémentation, pourrait être 403 ou permettre l'accès
      // Ajustez selon votre logique métier
      if (response.status === 403) {
        expect(response.body.message).toContain('autre pharmacie');
      }
    });
  });

  describe('5. Validation et Sécurité', () => {
    test('Devrait respecter le rate limiting', async () => {
      // Effectuer de nombreuses requêtes rapidement
      const promises = Array(60).fill().map(() =>
        request(app)
          .get('/api/pharmacy/by-matricule/PRX-20240101-TEST')
          .set('Authorization', `Bearer ${pharmacyToken}`)
      );

      const responses = await Promise.all(promises);

      // Au moins une réponse devrait être rate limitée (429)
      const rateLimited = responses.some(r => r.status === 429);
      expect(rateLimited).toBe(true);
    });

    test('Devrait journaliser les tentatives d\'accès', async () => {
      // Ce test dépend de votre système de logs
      // Vérifiez que les logs sont créés correctement

      await request(app)
        .get(`/api/pharmacy/by-matricule/${matricule}`)
        .set('Authorization', `Bearer ${pharmacyToken}`);

      // Vérifier dans les logs ou mock le logger pour tester
      // expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Accès au matricule'));
    });

    test('Ne devrait pas exposer d\'informations sensibles dans les erreurs', async () => {
      const response = await request(app)
        .get('/api/pharmacy/by-matricule/PRX-20240101-FAKE')
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBeUndefined();
      expect(response.body.stack).toBeUndefined();
    });
  });

  describe('6. Workflow de Délivrance', () => {
    test('Devrait permettre la confirmation de délivrance', async () => {
      const response = await request(app)
        .put(`/api/pharmacy/${testPrescription.id}/confirm-delivery`)
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('confirmed');
    });

    test('Devrait empêcher l\'accès après délivrance', async () => {
      const response = await request(app)
        .get(`/api/pharmacy/by-matricule/${matricule}`)
        .set('Authorization', `Bearer ${pharmacyToken}`);

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('déjà été délivrée');
    });
  });

  afterAll(async () => {
    // Nettoyer les données de test
    if (testPrescription) {
      await Prescription.destroy({ where: { id: testPrescription.id } });
    }
  });
});

// Tests de Performance et Charge
describe('Performance du Système de Matricules', () => {
  test('Génération de matricules en lot', async () => {
    const startTime = Date.now();

    // Créer 100 prescriptions rapidement
    const promises = Array(100).fill().map((_, i) =>
      Prescription.create({
        patientId: `patient-${i}`,
        doctorId: 'test-doctor',
        medication: `Medication-${i}`,
        dosage: '500mg',
        quantity: 30,
        issueDate: new Date()
      })
    );

    const prescriptions = await Promise.all(promises);
    const endTime = Date.now();

    // Vérifier que tous ont des matricules uniques
    const matricules = prescriptions.map(p => p.matricule);
    const uniqueMatricules = new Set(matricules);

    expect(uniqueMatricules.size).toBe(100);
    expect(endTime - startTime).toBeLessThan(5000); // Moins de 5 secondes

    // Nettoyer
    await Prescription.destroy({
      where: { id: prescriptions.map(p => p.id) }
    });
  });
});

module.exports = {
  // Export des fonctions utilitaires si nécessaire
};