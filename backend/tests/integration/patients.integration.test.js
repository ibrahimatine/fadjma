const request = require('supertest');
const app = require('../../src/app');
const { sequelize, BaseUser, MedicalRecordAccessRequest } = require('../../src/models');
const TestHelpers = require('../helpers/testHelpers');

describe('Patients API Integration Tests', () => {
  let doctor, patient, admin, doctorToken, patientToken, adminToken;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await TestHelpers.cleanupTestData();

    // Créer les utilisateurs de test
    doctor = await TestHelpers.createTestDoctor({
      email: 'doctor@integration.com'
    });

    patient = await TestHelpers.createTestPatient({
      email: 'patient@integration.com'
    });

    admin = await TestHelpers.createTestUser({
      email: 'admin@integration.com',
      role: 'admin'
    });

    // Générer les tokens
    doctorToken = TestHelpers.generateTestToken(doctor.id, doctor.role);
    patientToken = TestHelpers.generateTestToken(patient.id, patient.role);
    adminToken = TestHelpers.generateTestToken(admin.id, admin.role);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/patients', () => {
    beforeEach(async () => {
      // Créer quelques patients supplémentaires
      await TestHelpers.createTestPatient({
        email: 'patient1@test.com',
        firstName: 'Alice',
        lastName: 'Smith'
      });

      await TestHelpers.createTestPatient({
        email: 'patient2@test.com',
        firstName: 'Bob',
        lastName: 'Johnson'
      });
    });

    it('should return patients for doctor', async () => {
      const response = await request(app)
        .get('/api/patients')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3); // patient + 2 additional
      expect(response.body.pagination.total).toBe(3);
    });

    it('should return patients for admin', async () => {
      const response = await request(app)
        .get('/api/patients')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should deny access for patient', async () => {
      const response = await request(app)
        .get('/api/patients')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/patients?page=1&limit=2')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.totalPages).toBe(2);
    });

    it('should support search', async () => {
      const response = await request(app)
        .get('/api/patients?search=Alice')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].firstName).toBe('Alice');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/patients')
        .expect(401);

      expect(response.body.message).toBe('No token provided');
    });
  });

  describe('GET /api/patients/accessible-patients', () => {
    let createdPatient, accessiblePatient;

    beforeEach(async () => {
      // Créer un patient par le médecin
      createdPatient = await TestHelpers.createUnclaimedPatient(doctor.id, {
        firstName: 'Created',
        lastName: 'Patient'
      });

      // Créer un patient avec accès via demande
      accessiblePatient = await TestHelpers.createTestPatient({
        email: 'accessible@test.com',
        firstName: 'Accessible',
        lastName: 'Patient'
      });

      // Créer une demande d'accès approuvée
      await MedicalRecordAccessRequest.create({
        patientId: accessiblePatient.id,
        requesterId: doctor.id,
        status: 'approved',
        accessLevel: 'read'
      });
    });

    it('should return accessible patients for doctor', async () => {
      const response = await request(app)
        .get('/api/patients/accessible-patients')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.patients).toHaveLength(2);

      const patientNames = response.body.data.patients.map(p => p.firstName);
      expect(patientNames).toContain('Created');
      expect(patientNames).toContain('Accessible');
    });

    it('should support search in accessible patients', async () => {
      const response = await request(app)
        .get('/api/patients/accessible-patients?search=Created')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(response.body.data.patients).toHaveLength(1);
      expect(response.body.data.patients[0].firstName).toBe('Created');
    });

    it('should deny access for non-doctor', async () => {
      const response = await request(app)
        .get('/api/patients/accessible-patients')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/patients/:id', () => {
    let accessiblePatient;

    beforeEach(async () => {
      accessiblePatient = await TestHelpers.createTestPatient({
        email: 'target@test.com',
        firstName: 'Target',
        lastName: 'Patient'
      });

      // Donner accès au médecin
      await MedicalRecordAccessRequest.create({
        patientId: accessiblePatient.id,
        requesterId: doctor.id,
        status: 'approved',
        accessLevel: 'read'
      });
    });

    it('should return patient details for doctor with access', async () => {
      const response = await request(app)
        .get(`/api/patients/${accessiblePatient.id}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(accessiblePatient.id);
      expect(response.body.data.firstName).toBe('Target');
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should deny access for doctor without permission', async () => {
      const anotherPatient = await TestHelpers.createTestPatient({
        email: 'another@test.com'
      });

      const response = await request(app)
        .get(`/api/patients/${anotherPatient.id}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should allow admin access to any patient', async () => {
      const response = await request(app)
        .get(`/api/patients/${accessiblePatient.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent patient', async () => {
      const response = await request(app)
        .get('/api/patients/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/patients/unclaimed', () => {
    const validPatientData = {
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      emergencyContactName: 'Jane Doe',
      emergencyContactPhone: '+1234567890'
    };

    it('should create unclaimed patient successfully', async () => {
      const response = await request(app)
        .post('/api/patients/unclaimed')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(validPatientData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.patient.firstName).toBe('John');
      expect(response.body.data.patient.lastName).toBe('Doe');
      expect(response.body.data.patient.patientIdentifier).toMatch(/^PAT-\d{8}-[A-F0-9]{4}$/);

      // Vérifier en base de données
      const createdPatient = await BaseUser.findOne({
        where: { patientIdentifier: response.body.data.patient.patientIdentifier }
      });

      expect(createdPatient).toBeDefined();
      expect(createdPatient.isUnclaimed).toBe(true);
      expect(createdPatient.createdByDoctorId).toBe(doctor.id);
    });

    it('should reject creation by non-doctor', async () => {
      const response = await request(app)
        .post('/api/patients/unclaimed')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(validPatientData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        lastName: 'Doe'
        // Missing firstName
      };

      const response = await request(app)
        .post('/api/patients/unclaimed')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate date format', async () => {
      const invalidData = {
        ...validPatientData,
        dateOfBirth: 'invalid-date'
      };

      const response = await request(app)
        .post('/api/patients/unclaimed')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate gender values', async () => {
      const invalidData = {
        ...validPatientData,
        gender: 'invalid-gender'
      };

      const response = await request(app)
        .post('/api/patients/unclaimed')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/patients/unclaimed/my', () => {
    beforeEach(async () => {
      // Créer quelques patients non réclamés par le médecin
      await TestHelpers.createUnclaimedPatient(doctor.id, {
        firstName: 'Unclaimed1',
        lastName: 'Patient1'
      });

      await TestHelpers.createUnclaimedPatient(doctor.id, {
        firstName: 'Unclaimed2',
        lastName: 'Patient2'
      });

      // Créer un patient par un autre médecin
      const otherDoctor = await TestHelpers.createTestDoctor({
        email: 'other@doctor.com'
      });

      await TestHelpers.createUnclaimedPatient(otherDoctor.id, {
        firstName: 'Other',
        lastName: 'Patient'
      });
    });

    it('should return only unclaimed patients created by the doctor', async () => {
      const response = await request(app)
        .get('/api/patients/unclaimed/my')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.patients).toHaveLength(2);

      const patientNames = response.body.data.patients.map(p => p.firstName);
      expect(patientNames).toContain('Unclaimed1');
      expect(patientNames).toContain('Unclaimed2');
      expect(patientNames).not.toContain('Other');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/patients/unclaimed/my?page=1&limit=1')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(response.body.data.patients).toHaveLength(1);
      expect(response.body.data.totalPages).toBe(2);
    });

    it('should deny access for non-doctor', async () => {
      const response = await request(app)
        .get('/api/patients/unclaimed/my')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Patient Identifier Workflow', () => {
    it('should complete full workflow from creation to linking', async () => {
      // 1. Doctor creates unclaimed patient
      const createResponse = await request(app)
        .post('/api/patients/unclaimed')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          firstName: 'Workflow',
          lastName: 'Test',
          dateOfBirth: '1985-05-15',
          gender: 'female'
        })
        .expect(201);

      const patientIdentifier = createResponse.body.data.patient.patientIdentifier;

      // 2. Verify identifier works
      const verifyResponse = await request(app)
        .get(`/api/auth/verify-patient-identifier/${patientIdentifier}`)
        .expect(200);

      expect(verifyResponse.body.data.firstName).toBe('Workflow');

      // 3. Link identifier to account
      const linkResponse = await request(app)
        .post('/api/auth/link-patient-identifier')
        .send({
          patientIdentifier,
          email: 'workflow@test.com',
          password: 'WorkflowPassword123!',
          phoneNumber: '+9876543210'
        })
        .expect(200);

      expect(linkResponse.body.success).toBe(true);

      // 4. Login with new credentials
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'workflow@test.com',
          password: 'WorkflowPassword123!'
        })
        .expect(200);

      expect(loginResponse.body.data.user.isUnclaimed).toBe(false);
      expect(loginResponse.body.data.user.phoneNumber).toBe('+9876543210');

      // 5. Doctor should still have access to this patient
      const linkedPatientId = loginResponse.body.data.user.id;
      const accessResponse = await request(app)
        .get(`/api/patients/${linkedPatientId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(accessResponse.body.data.firstName).toBe('Workflow');
    });

    it('should prevent double linking of same identifier', async () => {
      // Create and link a patient
      const createResponse = await request(app)
        .post('/api/patients/unclaimed')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          firstName: 'Double',
          lastName: 'Link',
          dateOfBirth: '1990-01-01',
          gender: 'male'
        })
        .expect(201);

      const patientIdentifier = createResponse.body.data.patient.patientIdentifier;

      // First linking
      await request(app)
        .post('/api/auth/link-patient-identifier')
        .send({
          patientIdentifier,
          email: 'first@test.com',
          password: 'Password123!'
        })
        .expect(200);

      // Second linking attempt should fail
      const secondResponse = await request(app)
        .post('/api/auth/link-patient-identifier')
        .send({
          patientIdentifier,
          email: 'second@test.com',
          password: 'Password123!'
        })
        .expect(404);

      expect(secondResponse.body.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Cette partie dépendrait de la façon dont on mock les erreurs de DB
      // Pour un test d'intégration réel, on pourrait temporairement fermer la connexion

      // Note: Ce type de test nécessiterait une configuration plus avancée
      // pour simuler les pannes de base de données
    });

    it('should validate UUID format for patient ID', async () => {
      const response = await request(app)
        .get('/api/patients/invalid-uuid')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});