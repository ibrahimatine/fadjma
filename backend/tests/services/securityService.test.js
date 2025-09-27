const SecurityService = require('../../src/services/securityService');
const { BaseUser } = require('../../src/models');
const TestHelpers = require('../helpers/testHelpers');

describe('SecurityService', () => {
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

  describe('canDoctorCreateUnclaimedPatients', () => {
    it('should return true for active doctor', async () => {
      const canCreate = await SecurityService.canDoctorCreateUnclaimedPatients(doctor.id);
      expect(canCreate).toBe(true);
    });

    it('should return false for inactive doctor', async () => {
      await doctor.update({ isActive: false });

      const canCreate = await SecurityService.canDoctorCreateUnclaimedPatients(doctor.id);
      expect(canCreate).toBe(false);
    });

    it('should return false for non-doctor user', async () => {
      const canCreate = await SecurityService.canDoctorCreateUnclaimedPatients(patient.id);
      expect(canCreate).toBe(false);
    });

    it('should return false for non-existent user', async () => {
      const fakeId = 'non-existent-id';
      const canCreate = await SecurityService.canDoctorCreateUnclaimedPatients(fakeId);
      expect(canCreate).toBe(false);
    });

    it('should return false for unclaimed doctor', async () => {
      const unclaimedDoctor = await TestHelpers.createTestDoctor({
        email: null,
        password: null,
        isUnclaimed: true
      });

      const canCreate = await SecurityService.canDoctorCreateUnclaimedPatients(unclaimedDoctor.id);
      expect(canCreate).toBe(false);
    });
  });

  describe('validatePatientIdentifier', () => {
    it('should validate correct patient identifier format', () => {
      const validIdentifier = 'PAT-20241127-A1B2';
      const result = SecurityService.validatePatientIdentifier(validIdentifier);

      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should reject invalid format', () => {
      const invalidIdentifier = 'INVALID-FORMAT';
      const result = SecurityService.validatePatientIdentifier(invalidIdentifier);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid patient identifier format');
    });

    it('should reject empty identifier', () => {
      const result = SecurityService.validatePatientIdentifier('');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Patient identifier is required');
    });

    it('should reject null identifier', () => {
      const result = SecurityService.validatePatientIdentifier(null);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Patient identifier is required');
    });

    it('should validate date in identifier', () => {
      const invalidDate = 'PAT-20241301-A1B2'; // Invalid month
      const result = SecurityService.validatePatientIdentifier(invalidDate);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid patient identifier format');
    });

    it('should validate hex suffix', () => {
      const invalidHex = 'PAT-20241127-Z9X8'; // Invalid hex characters
      const result = SecurityService.validatePatientIdentifier(invalidHex);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid patient identifier format');
    });
  });

  describe('validateDoctorAccessToUnclaimedPatient', () => {
    let unclaimedPatient;

    beforeEach(async () => {
      unclaimedPatient = await TestHelpers.createUnclaimedPatient(doctor.id);
    });

    it('should allow doctor access to own created patient', async () => {
      const hasAccess = await SecurityService.validateDoctorAccessToUnclaimedPatient(
        doctor.id,
        unclaimedPatient.id
      );

      expect(hasAccess).toBe(true);
    });

    it('should deny access to patient created by another doctor', async () => {
      const otherDoctor = await TestHelpers.createTestDoctor({
        email: TestHelpers.generateTestEmail('other-doctor')
      });

      const hasAccess = await SecurityService.validateDoctorAccessToUnclaimedPatient(
        otherDoctor.id,
        unclaimedPatient.id
      );

      expect(hasAccess).toBe(false);
    });

    it('should deny access to claimed patient', async () => {
      await unclaimedPatient.update({ isUnclaimed: false });

      const hasAccess = await SecurityService.validateDoctorAccessToUnclaimedPatient(
        doctor.id,
        unclaimedPatient.id
      );

      expect(hasAccess).toBe(false);
    });

    it('should deny access to non-existent patient', async () => {
      const hasAccess = await SecurityService.validateDoctorAccessToUnclaimedPatient(
        doctor.id,
        'non-existent-id'
      );

      expect(hasAccess).toBe(false);
    });
  });

  describe('sanitizePatientData', () => {
    const sensitivePatient = {
      id: 'patient-id',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'hashed-password',
      socialSecurityNumber: '123-45-6789',
      emergencyContactName: 'Jane Doe',
      emergencyContactPhone: '+1234567890',
      createdByDoctorId: 'doctor-id',
      patientIdentifier: 'PAT-20241127-A1B2'
    };

    it('should include all fields for doctor viewer', () => {
      const sanitized = SecurityService.sanitizePatientData(sensitivePatient, 'doctor');

      expect(sanitized).toHaveProperty('firstName');
      expect(sanitized).toHaveProperty('lastName');
      expect(sanitized).toHaveProperty('email');
      expect(sanitized).toHaveProperty('emergencyContactName');
      expect(sanitized).toHaveProperty('createdByDoctorId');
      expect(sanitized).not.toHaveProperty('password');
    });

    it('should exclude sensitive fields for patient viewer', () => {
      const sanitized = SecurityService.sanitizePatientData(sensitivePatient, 'patient');

      expect(sanitized).toHaveProperty('firstName');
      expect(sanitized).toHaveProperty('lastName');
      expect(sanitized).not.toHaveProperty('socialSecurityNumber');
      expect(sanitized).not.toHaveProperty('createdByDoctorId');
      expect(sanitized).not.toHaveProperty('password');
    });

    it('should exclude most fields for pharmacy viewer', () => {
      const sanitized = SecurityService.sanitizePatientData(sensitivePatient, 'pharmacy');

      expect(sanitized).toHaveProperty('firstName');
      expect(sanitized).toHaveProperty('lastName');
      expect(sanitized).not.toHaveProperty('email');
      expect(sanitized).not.toHaveProperty('socialSecurityNumber');
      expect(sanitized).not.toHaveProperty('emergencyContactName');
      expect(sanitized).not.toHaveProperty('password');
    });

    it('should handle unknown viewer role', () => {
      const sanitized = SecurityService.sanitizePatientData(sensitivePatient, 'unknown');

      expect(sanitized).toHaveProperty('firstName');
      expect(sanitized).toHaveProperty('lastName');
      expect(Object.keys(sanitized)).toHaveLength(3); // id, firstName, lastName
    });

    it('should always exclude password field', () => {
      const doctorView = SecurityService.sanitizePatientData(sensitivePatient, 'doctor');
      const patientView = SecurityService.sanitizePatientData(sensitivePatient, 'patient');
      const pharmacyView = SecurityService.sanitizePatientData(sensitivePatient, 'pharmacy');

      expect(doctorView).not.toHaveProperty('password');
      expect(patientView).not.toHaveProperty('password');
      expect(pharmacyView).not.toHaveProperty('password');
    });
  });

  describe('auditPatientIdentifierAccess', () => {
    it('should log patient identifier access', () => {
      const logSpy = jest.spyOn(console, 'info').mockImplementation();

      SecurityService.auditPatientIdentifierAccess(
        'PAT-20241127-A1B2',
        doctor.id,
        'verification'
      );

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Patient identifier access'),
        expect.objectContaining({
          identifier: 'PAT-20241127-A1B2',
          userId: doctor.id,
          action: 'verification'
        })
      );

      logSpy.mockRestore();
    });

    it('should handle missing parameters gracefully', () => {
      const logSpy = jest.spyOn(console, 'info').mockImplementation();

      SecurityService.auditPatientIdentifierAccess(null, null, null);

      expect(logSpy).toHaveBeenCalled();
      logSpy.mockRestore();
    });
  });

  describe('cleanupExpiredUnclaimedPatients', () => {
    it('should delete patients older than specified days', async () => {
      // Créer un patient ancien
      const oldPatient = await TestHelpers.createUnclaimedPatient(doctor.id);

      // Simuler une date ancienne en modifiant createdAt
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 400); // 400 jours

      await oldPatient.update({ createdAt: oldDate });

      // Créer un patient récent
      const recentPatient = await TestHelpers.createUnclaimedPatient(doctor.id);

      const result = await SecurityService.cleanupExpiredUnclaimedPatients(365);

      expect(result.deletedCount).toBe(1);

      // Vérifier que seul le patient récent existe encore
      const remainingPatients = await BaseUser.findAll({
        where: { isUnclaimed: true }
      });

      expect(remainingPatients).toHaveLength(1);
      expect(remainingPatients[0].id).toBe(recentPatient.id);
    });

    it('should not delete recent unclaimed patients', async () => {
      await TestHelpers.createUnclaimedPatient(doctor.id);

      const result = await SecurityService.cleanupExpiredUnclaimedPatients(365);

      expect(result.deletedCount).toBe(0);
    });

    it('should not delete claimed patients regardless of age', async () => {
      const claimedPatient = await TestHelpers.createTestPatient({
        patientIdentifier: TestHelpers.generateValidPatientIdentifier(),
        isUnclaimed: false
      });

      // Simuler une date très ancienne
      const veryOldDate = new Date();
      veryOldDate.setDate(veryOldDate.getDate() - 1000);

      await claimedPatient.update({ createdAt: veryOldDate });

      const result = await SecurityService.cleanupExpiredUnclaimedPatients(365);

      expect(result.deletedCount).toBe(0);

      // Vérifier que le patient existe encore
      const stillExists = await BaseUser.findByPk(claimedPatient.id);
      expect(stillExists).toBeDefined();
    });
  });

  describe('rateLimitExceeded', () => {
    it('should track and enforce rate limits', () => {
      const identifier = 'test-identifier';
      const limit = 3;
      const windowMs = 60000; // 1 minute

      // First 3 attempts should be allowed
      expect(SecurityService.rateLimitExceeded(identifier, limit, windowMs)).toBe(false);
      expect(SecurityService.rateLimitExceeded(identifier, limit, windowMs)).toBe(false);
      expect(SecurityService.rateLimitExceeded(identifier, limit, windowMs)).toBe(false);

      // 4th attempt should be blocked
      expect(SecurityService.rateLimitExceeded(identifier, limit, windowMs)).toBe(true);
    });

    it('should reset limit after time window', async () => {
      const identifier = 'test-identifier-2';
      const limit = 2;
      const windowMs = 100; // 100ms for fast test

      // Exceed the limit
      SecurityService.rateLimitExceeded(identifier, limit, windowMs);
      SecurityService.rateLimitExceeded(identifier, limit, windowMs);
      expect(SecurityService.rateLimitExceeded(identifier, limit, windowMs)).toBe(true);

      // Wait for window to expire
      await TestHelpers.wait(150);

      // Should be allowed again
      expect(SecurityService.rateLimitExceeded(identifier, limit, windowMs)).toBe(false);
    });

    it('should handle different identifiers separately', () => {
      const limit = 2;
      const windowMs = 60000;

      // Exhaust limit for first identifier
      SecurityService.rateLimitExceeded('id1', limit, windowMs);
      SecurityService.rateLimitExceeded('id1', limit, windowMs);
      expect(SecurityService.rateLimitExceeded('id1', limit, windowMs)).toBe(true);

      // Second identifier should still be allowed
      expect(SecurityService.rateLimitExceeded('id2', limit, windowMs)).toBe(false);
    });
  });
});