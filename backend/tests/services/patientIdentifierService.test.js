const PatientIdentifierService = require('../../src/services/patientIdentifierService');
const { BaseUser } = require('../../src/models');
const TestHelpers = require('../helpers/testHelpers');

describe('PatientIdentifierService', () => {
  let doctor, patient;

  beforeEach(async () => {
    await TestHelpers.cleanupTestData();

    doctor = await TestHelpers.createTestDoctor({
      email: TestHelpers.generateTestEmail('doctor')
    });

    patient = await TestHelpers.createTestPatient({
      email: TestHelpers.generateTestEmail('patient')
    });
  });

  afterEach(async () => {
    await TestHelpers.cleanupTestData();
  });

  describe('generateUniqueIdentifier', () => {
    it('should generate identifier with correct format', async () => {
      const identifier = await PatientIdentifierService.generateUniqueIdentifier();

      expect(identifier).toMatch(/^PAT-\d{8}-[A-F0-9]{4}$/);
    });

    it('should generate identifier with current date', async () => {
      const identifier = await PatientIdentifierService.generateUniqueIdentifier();
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');

      expect(identifier).toContain(today);
    });

    it('should generate unique identifiers', async () => {
      const identifier1 = await PatientIdentifierService.generateUniqueIdentifier();
      const identifier2 = await PatientIdentifierService.generateUniqueIdentifier();

      expect(identifier1).not.toBe(identifier2);
    });

    it('should retry when identifier already exists', async () => {
      // Mock pour simuler un identifiant existant puis un nouveau
      const existingIdentifier = TestHelpers.generateValidPatientIdentifier();

      await BaseUser.create({
        firstName: 'Test',
        lastName: 'Patient',
        role: 'patient',
        isUnclaimed: true,
        patientIdentifier: existingIdentifier,
        createdByDoctorId: doctor.id
      });

      // Générer un nouvel identifiant - devrait être différent
      const newIdentifier = await PatientIdentifierService.generateUniqueIdentifier();

      expect(newIdentifier).not.toBe(existingIdentifier);
      expect(newIdentifier).toMatch(/^PAT-\d{8}-[A-F0-9]{4}$/);
    });
  });

  describe('validateIdentifierFormat', () => {
    it('should validate correct format', () => {
      const validIdentifier = 'PAT-20241127-A1B2';
      const isValid = PatientIdentifierService.validateIdentifierFormat(validIdentifier);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect prefix', () => {
      const invalidIdentifier = 'DOC-20241127-A1B2';
      const isValid = PatientIdentifierService.validateIdentifierFormat(invalidIdentifier);

      expect(isValid).toBe(false);
    });

    it('should reject invalid date format', () => {
      const invalidIdentifier = 'PAT-2024127-A1B2';
      const isValid = PatientIdentifierService.validateIdentifierFormat(invalidIdentifier);

      expect(isValid).toBe(false);
    });

    it('should reject invalid hex suffix', () => {
      const invalidIdentifier = 'PAT-20241127-Z9X8';
      const isValid = PatientIdentifierService.validateIdentifierFormat(invalidIdentifier);

      expect(isValid).toBe(false);
    });

    it('should reject empty or null identifier', () => {
      expect(PatientIdentifierService.validateIdentifierFormat('')).toBe(false);
      expect(PatientIdentifierService.validateIdentifierFormat(null)).toBe(false);
      expect(PatientIdentifierService.validateIdentifierFormat(undefined)).toBe(false);
    });
  });

  describe('findPatientByIdentifier', () => {
    it('should find patient by valid identifier', async () => {
      const unclaimedPatient = await TestHelpers.createUnclaimedPatient(doctor.id);

      const foundPatient = await PatientIdentifierService.findPatientByIdentifier(
        unclaimedPatient.patientIdentifier
      );

      expect(foundPatient).toBeDefined();
      expect(foundPatient.id).toBe(unclaimedPatient.id);
      expect(foundPatient.patientIdentifier).toBe(unclaimedPatient.patientIdentifier);
    });

    it('should return null for non-existent identifier', async () => {
      const nonExistentIdentifier = 'PAT-20241127-FFFF';

      const foundPatient = await PatientIdentifierService.findPatientByIdentifier(
        nonExistentIdentifier
      );

      expect(foundPatient).toBeNull();
    });

    it('should not return claimed patients', async () => {
      const claimedPatient = await TestHelpers.createTestPatient({
        patientIdentifier: TestHelpers.generateValidPatientIdentifier(),
        isUnclaimed: false
      });

      const foundPatient = await PatientIdentifierService.findPatientByIdentifier(
        claimedPatient.patientIdentifier
      );

      expect(foundPatient).toBeNull();
    });

    it('should only return specific fields', async () => {
      const unclaimedPatient = await TestHelpers.createUnclaimedPatient(doctor.id);

      const foundPatient = await PatientIdentifierService.findPatientByIdentifier(
        unclaimedPatient.patientIdentifier
      );

      expect(foundPatient).toHaveProperty('firstName');
      expect(foundPatient).toHaveProperty('lastName');
      expect(foundPatient).toHaveProperty('patientIdentifier');
      expect(foundPatient).not.toHaveProperty('password');
      expect(foundPatient).not.toHaveProperty('email');
    });
  });

  describe('createUnclaimedPatient', () => {
    it('should create unclaimed patient with valid data', async () => {
      const patientData = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        gender: 'male'
      };

      const createdPatient = await PatientIdentifierService.createUnclaimedPatient(
        patientData,
        doctor.id
      );

      expect(createdPatient).toBeDefined();
      expect(createdPatient.firstName).toBe('John');
      expect(createdPatient.lastName).toBe('Doe');
      expect(createdPatient.isUnclaimed).toBe(true);
      expect(createdPatient.createdByDoctorId).toBe(doctor.id);
      expect(createdPatient.patientIdentifier).toMatch(/^PAT-\d{8}-[A-F0-9]{4}$/);
    });

    it('should set email and password to null for unclaimed patients', async () => {
      const patientData = {
        firstName: 'Jane',
        lastName: 'Smith'
      };

      const createdPatient = await PatientIdentifierService.createUnclaimedPatient(
        patientData,
        doctor.id
      );

      expect(createdPatient.email).toBeNull();
      expect(createdPatient.password).toBeNull();
    });

    it('should throw error with invalid patient data', async () => {
      const invalidData = {}; // Missing required fields

      await expect(
        PatientIdentifierService.createUnclaimedPatient(invalidData, doctor.id)
      ).rejects.toThrow();
    });
  });

  describe('linkIdentifierToAccount', () => {
    let unclaimedPatient;

    beforeEach(async () => {
      unclaimedPatient = await TestHelpers.createUnclaimedPatient(doctor.id);
    });

    it('should successfully link identifier to account', async () => {
      const accountData = {
        email: 'patient@example.com',
        password: 'SecurePassword123!',
        phoneNumber: '+1234567890'
      };

      const linkedPatient = await PatientIdentifierService.linkIdentifierToAccount(
        unclaimedPatient.patientIdentifier,
        accountData
      );

      expect(linkedPatient).toBeDefined();
      expect(linkedPatient.email).toBe(accountData.email);
      expect(linkedPatient.phoneNumber).toBe(accountData.phoneNumber);
      expect(linkedPatient.isUnclaimed).toBe(false);
      expect(linkedPatient.password).not.toBeNull(); // Should be hashed
    });

    it('should throw error for non-existent identifier', async () => {
      const accountData = {
        email: 'patient@example.com',
        password: 'SecurePassword123!'
      };

      await expect(
        PatientIdentifierService.linkIdentifierToAccount(
          'PAT-20241127-FFFF',
          accountData
        )
      ).rejects.toThrow('Patient identifier not found or already claimed');
    });

    it('should throw error for already claimed patient', async () => {
      // Claim the patient first
      await unclaimedPatient.update({
        isUnclaimed: false,
        email: 'already@claimed.com'
      });

      const accountData = {
        email: 'patient@example.com',
        password: 'SecurePassword123!'
      };

      await expect(
        PatientIdentifierService.linkIdentifierToAccount(
          unclaimedPatient.patientIdentifier,
          accountData
        )
      ).rejects.toThrow('Patient identifier not found or already claimed');
    });

    it('should hash password when linking account', async () => {
      const accountData = {
        email: 'patient@example.com',
        password: 'PlainTextPassword123!'
      };

      const linkedPatient = await PatientIdentifierService.linkIdentifierToAccount(
        unclaimedPatient.patientIdentifier,
        accountData
      );

      expect(linkedPatient.password).not.toBe(accountData.password);
      expect(linkedPatient.password).toMatch(/^\$2[aby]\$/); // bcrypt hash pattern
    });
  });

  describe('getUnclaimedPatientsByDoctor', () => {
    it('should return unclaimed patients created by doctor', async () => {
      const patient1 = await TestHelpers.createUnclaimedPatient(doctor.id, {
        firstName: 'Patient1'
      });

      const patient2 = await TestHelpers.createUnclaimedPatient(doctor.id, {
        firstName: 'Patient2'
      });

      // Create a patient by another doctor
      const otherDoctor = await TestHelpers.createTestDoctor({
        email: TestHelpers.generateTestEmail('other-doctor')
      });
      await TestHelpers.createUnclaimedPatient(otherDoctor.id);

      const result = await PatientIdentifierService.getUnclaimedPatientsByDoctor(doctor.id);

      expect(result.patients).toHaveLength(2);
      expect(result.total).toBe(2);

      const patientNames = result.patients.map(p => p.firstName);
      expect(patientNames).toContain('Patient1');
      expect(patientNames).toContain('Patient2');
    });

    it('should support pagination', async () => {
      // Create 5 patients
      for (let i = 1; i <= 5; i++) {
        await TestHelpers.createUnclaimedPatient(doctor.id, {
          firstName: `Patient${i}`
        });
      }

      const result = await PatientIdentifierService.getUnclaimedPatientsByDoctor(
        doctor.id,
        { page: 1, limit: 2 }
      );

      expect(result.patients).toHaveLength(2);
      expect(result.total).toBe(5);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(3);
    });

    it('should return empty result when doctor has no unclaimed patients', async () => {
      const result = await PatientIdentifierService.getUnclaimedPatientsByDoctor(doctor.id);

      expect(result.patients).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('formatPatientForDoctor', () => {
    it('should format patient data for doctor view', async () => {
      const unclaimedPatient = await TestHelpers.createUnclaimedPatient(doctor.id);

      const formatted = PatientIdentifierService.formatPatientForDoctor(unclaimedPatient);

      expect(formatted).toHaveProperty('id');
      expect(formatted).toHaveProperty('firstName');
      expect(formatted).toHaveProperty('lastName');
      expect(formatted).toHaveProperty('patientIdentifier');
      expect(formatted).toHaveProperty('status', 'unclaimed');
      expect(formatted).toHaveProperty('createdAt');
      expect(formatted).not.toHaveProperty('password');
      expect(formatted).not.toHaveProperty('email');
    });

    it('should handle null patient gracefully', () => {
      const formatted = PatientIdentifierService.formatPatientForDoctor(null);
      expect(formatted).toBeNull();
    });
  });
});