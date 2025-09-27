const request = require('supertest');
const app = require('../../src/app');
const { sequelize, BaseUser } = require('../../src/models');
const TestHelpers = require('../helpers/testHelpers');

describe('Authentication Integration Tests', () => {
  beforeAll(async () => {
    // Synchroniser la base de données pour les tests
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    // Nettoyer les données de test
    await TestHelpers.cleanupTestData();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/auth/register', () => {
    const validPatientData = {
      email: 'patient@test.com',
      password: 'SecurePassword123!',
      firstName: 'John',
      lastName: 'Doe',
      role: 'patient',
      dateOfBirth: '1990-01-01',
      gender: 'male'
    };

    const validDoctorData = {
      email: 'doctor@test.com',
      password: 'SecurePassword123!',
      firstName: 'Dr. Jane',
      lastName: 'Smith',
      role: 'doctor',
      licenseNumber: 'DOC123456',
      specialty: 'Cardiology',
      hospital: 'Test Hospital',
      phoneNumber: '+1234567890'
    };

    it('should register a patient successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validPatientData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(validPatientData.email);
      expect(response.body.data.user.role).toBe('patient');
      expect(response.body.data.user).not.toHaveProperty('password');
      expect(response.body.data.token).toBeDefined();

      // Vérifier que l'utilisateur a été créé en base
      const user = await BaseUser.findOne({
        where: { email: validPatientData.email }
      });
      expect(user).toBeDefined();
      expect(user.isUnclaimed).toBe(false);
    });

    it('should register a doctor successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validDoctorData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('doctor');
      expect(response.body.data.user.licenseNumber).toBe(validDoctorData.licenseNumber);
    });

    it('should reject registration with existing email', async () => {
      // Créer un utilisateur d'abord
      await TestHelpers.createTestUser({
        email: validPatientData.email
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(validPatientData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email');
    });

    it('should reject registration with invalid email', async () => {
      const invalidData = {
        ...validPatientData,
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject registration with weak password', async () => {
      const invalidData = {
        ...validPatientData,
        password: '123' // Too weak
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject doctor registration without license number', async () => {
      const invalidData = {
        ...validDoctorData,
        licenseNumber: undefined
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await TestHelpers.createTestUser({
        email: 'test@login.com',
        password: 'TestPassword123!' // Will be hashed by helper
      });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@login.com',
          password: 'TestPassword123!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@login.com');
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should reject login with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'TestPassword123!'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@login.com',
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject login for inactive user', async () => {
      await testUser.update({ isActive: false });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@login.com',
          password: 'TestPassword123!'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject login for unclaimed user', async () => {
      await testUser.update({
        isUnclaimed: true,
        email: null,
        password: null
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@login.com',
          password: 'TestPassword123!'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    let testUser, authToken;

    beforeEach(async () => {
      testUser = await TestHelpers.createTestUser({
        email: 'me@test.com'
      });
      authToken = TestHelpers.generateTestToken(testUser.id, testUser.role);
    });

    it('should return current user info with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(testUser.id);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.message).toBe('No token provided');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.message).toBe('Invalid token');
    });
  });

  describe('Patient Identifier Flow', () => {
    let doctor, authToken;

    beforeEach(async () => {
      doctor = await TestHelpers.createTestDoctor({
        email: 'doctor@identifier.com'
      });
      authToken = TestHelpers.generateTestToken(doctor.id, doctor.role);
    });

    it('should complete full patient identifier flow', async () => {
      // 1. Doctor creates unclaimed patient
      const createResponse = await request(app)
        .post('/api/patients/unclaimed')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: '1990-01-01',
          gender: 'male'
        })
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      const patientIdentifier = createResponse.body.data.patient.patientIdentifier;
      expect(patientIdentifier).toMatch(/^PAT-\d{8}-[A-F0-9]{4}$/);

      // 2. Verify patient identifier (public endpoint)
      const verifyResponse = await request(app)
        .get(`/api/auth/verify-patient-identifier/${patientIdentifier}`)
        .expect(200);

      expect(verifyResponse.body.success).toBe(true);
      expect(verifyResponse.body.data.firstName).toBe('John');
      expect(verifyResponse.body.data.lastName).toBe('Doe');

      // 3. Link identifier to account (public endpoint)
      const linkResponse = await request(app)
        .post('/api/auth/link-patient-identifier')
        .send({
          patientIdentifier,
          email: 'patient@linked.com',
          password: 'SecurePassword123!',
          phoneNumber: '+1234567890'
        })
        .expect(200);

      expect(linkResponse.body.success).toBe(true);

      // 4. Patient can now login with linked credentials
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'patient@linked.com',
          password: 'SecurePassword123!'
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.user.email).toBe('patient@linked.com');
      expect(loginResponse.body.data.user.isUnclaimed).toBe(false);
    });

    it('should reject linking with invalid identifier', async () => {
      const response = await request(app)
        .post('/api/auth/link-patient-identifier')
        .send({
          patientIdentifier: 'INVALID-FORMAT',
          email: 'patient@test.com',
          password: 'SecurePassword123!'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject linking with non-existent identifier', async () => {
      const response = await request(app)
        .post('/api/auth/link-patient-identifier')
        .send({
          patientIdentifier: 'PAT-20241127-FFFF',
          email: 'patient@test.com',
          password: 'SecurePassword123!'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting on login attempts', async () => {
      const loginData = {
        email: 'nonexistent@test.com',
        password: 'WrongPassword123!'
      };

      // Faire plusieurs tentatives de connexion échouées
      for (let i = 0; i < 6; i++) {
        const response = await request(app)
          .post('/api/auth/login')
          .send(loginData);

        if (i < 5) {
          expect(response.status).toBe(401);
        } else {
          // La 6ème tentative devrait être bloquée par rate limiting
          expect(response.status).toBe(429);
        }
      }
    }, 10000); // Timeout plus long pour ce test

    it('should enforce rate limiting on registration', async () => {
      const baseData = {
        firstName: 'Test',
        lastName: 'User',
        role: 'patient',
        password: 'SecurePassword123!'
      };

      // Faire plusieurs tentatives d'inscription
      for (let i = 0; i < 4; i++) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            ...baseData,
            email: `test${i}@test.com`
          });

        if (i < 3) {
          expect(response.status).toBe(201);
        } else {
          // La 4ème tentative devrait être bloquée
          expect(response.status).toBe(429);
        }
      }
    }, 15000);
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      // Vérifier les headers de sécurité (ajoutés par helmet)
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('0');
    });
  });
});