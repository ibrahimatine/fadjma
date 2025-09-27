const AccessControlService = require('../../src/services/accessControlService');
const { BaseUser, MedicalRecordAccessRequest } = require('../../src/models');
const TestHelpers = require('../helpers/testHelpers');

describe('AccessControlService', () => {
  let doctor, patient1, patient2;

  beforeEach(async () => {
    // Nettoyer les données de test
    await TestHelpers.cleanupTestData();

    // Créer des utilisateurs de test
    doctor = await TestHelpers.createTestDoctor({
      email: TestHelpers.generateTestEmail('doctor')
    });

    patient1 = await TestHelpers.createTestPatient({
      email: TestHelpers.generateTestEmail('patient1')
    });

    patient2 = await TestHelpers.createTestPatient({
      email: TestHelpers.generateTestEmail('patient2')
    });
  });

  afterEach(async () => {
    await TestHelpers.cleanupTestData();
  });

  describe('doctorHasAccessToPatient', () => {
    it('should return true when doctor has access via approved request', async () => {
      // Créer une demande d'accès approuvée
      await MedicalRecordAccessRequest.create({
        patientId: patient1.id,
        requesterId: doctor.id,
        status: 'approved',
        accessLevel: 'read',
        expiresAt: null
      });

      const hasAccess = await AccessControlService.doctorHasAccessToPatient(
        doctor.id,
        patient1.id
      );

      expect(hasAccess).toBe(true);
    });

    it('should return true when doctor created the patient', async () => {
      // Créer un patient créé par le médecin
      const createdPatient = await TestHelpers.createUnclaimedPatient(doctor.id);

      const hasAccess = await AccessControlService.doctorHasAccessToPatient(
        doctor.id,
        createdPatient.id
      );

      expect(hasAccess).toBe(true);
    });

    it('should return false when doctor has no access', async () => {
      const hasAccess = await AccessControlService.doctorHasAccessToPatient(
        doctor.id,
        patient1.id
      );

      expect(hasAccess).toBe(false);
    });

    it('should return false when access request is expired', async () => {
      // Créer une demande d'accès expirée
      await MedicalRecordAccessRequest.create({
        patientId: patient1.id,
        requesterId: doctor.id,
        status: 'approved',
        accessLevel: 'read',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Expiré hier
      });

      const hasAccess = await AccessControlService.doctorHasAccessToPatient(
        doctor.id,
        patient1.id
      );

      expect(hasAccess).toBe(false);
    });

    it('should return false when access request is pending', async () => {
      await MedicalRecordAccessRequest.create({
        patientId: patient1.id,
        requesterId: doctor.id,
        status: 'pending',
        accessLevel: 'read'
      });

      const hasAccess = await AccessControlService.doctorHasAccessToPatient(
        doctor.id,
        patient1.id
      );

      expect(hasAccess).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      // Mock une erreur de base de données
      jest.spyOn(MedicalRecordAccessRequest, 'findOne').mockRejectedValue(
        new Error('Database error')
      );

      const hasAccess = await AccessControlService.doctorHasAccessToPatient(
        doctor.id,
        patient1.id
      );

      expect(hasAccess).toBe(false);
    });
  });

  describe('getAccessiblePatientsForDoctor', () => {
    it('should return patients created by doctor', async () => {
      const createdPatient = await TestHelpers.createUnclaimedPatient(doctor.id);

      const accessiblePatients = await AccessControlService.getAccessiblePatientsForDoctor(
        doctor.id
      );

      expect(accessiblePatients).toHaveLength(1);
      expect(accessiblePatients[0].id).toBe(createdPatient.id);
    });

    it('should return patients with approved access requests', async () => {
      await MedicalRecordAccessRequest.create({
        patientId: patient1.id,
        requesterId: doctor.id,
        status: 'approved',
        accessLevel: 'read'
      });

      const accessiblePatients = await AccessControlService.getAccessiblePatientsForDoctor(
        doctor.id
      );

      expect(accessiblePatients).toHaveLength(1);
      expect(accessiblePatients[0].id).toBe(patient1.id);
    });

    it('should combine both types of access without duplicates', async () => {
      // Patient créé par le médecin
      const createdPatient = await TestHelpers.createUnclaimedPatient(doctor.id);

      // Patient avec demande d'accès approuvée
      await MedicalRecordAccessRequest.create({
        patientId: patient1.id,
        requesterId: doctor.id,
        status: 'approved',
        accessLevel: 'read'
      });

      // Ajouter une demande d'accès pour le patient créé (ne devrait pas créer de doublon)
      await MedicalRecordAccessRequest.create({
        patientId: createdPatient.id,
        requesterId: doctor.id,
        status: 'approved',
        accessLevel: 'write'
      });

      const accessiblePatients = await AccessControlService.getAccessiblePatientsForDoctor(
        doctor.id
      );

      expect(accessiblePatients).toHaveLength(2);
      const patientIds = accessiblePatients.map(p => p.id);
      expect(patientIds).toContain(createdPatient.id);
      expect(patientIds).toContain(patient1.id);
    });

    it('should return empty array when doctor has no accessible patients', async () => {
      const accessiblePatients = await AccessControlService.getAccessiblePatientsForDoctor(
        doctor.id
      );

      expect(accessiblePatients).toHaveLength(0);
    });

    it('should sort patients by lastName', async () => {
      const patientA = await TestHelpers.createUnclaimedPatient(doctor.id, {
        lastName: 'Adams'
      });

      const patientZ = await TestHelpers.createUnclaimedPatient(doctor.id, {
        lastName: 'Zulu'
      });

      const accessiblePatients = await AccessControlService.getAccessiblePatientsForDoctor(
        doctor.id
      );

      expect(accessiblePatients).toHaveLength(2);
      expect(accessiblePatients[0].lastName).toBe('Adams');
      expect(accessiblePatients[1].lastName).toBe('Zulu');
    });
  });

  describe('canAccessResource', () => {
    it('should allow patient to access their own data', async () => {
      const canAccess = await AccessControlService.canAccessResource(
        patient1,
        'patient',
        patient1.id
      );

      expect(canAccess).toBe(true);
    });

    it('should deny patient access to other patient data', async () => {
      const canAccess = await AccessControlService.canAccessResource(
        patient1,
        'patient',
        patient2.id
      );

      expect(canAccess).toBe(false);
    });

    it('should allow doctor access to accessible patients', async () => {
      await MedicalRecordAccessRequest.create({
        patientId: patient1.id,
        requesterId: doctor.id,
        status: 'approved',
        accessLevel: 'read'
      });

      const canAccess = await AccessControlService.canAccessResource(
        doctor,
        'patient',
        patient1.id
      );

      expect(canAccess).toBe(true);
    });

    it('should deny doctor access to non-accessible patients', async () => {
      const canAccess = await AccessControlService.canAccessResource(
        doctor,
        'patient',
        patient1.id
      );

      expect(canAccess).toBe(false);
    });

    it('should allow admin access to all resources', async () => {
      const admin = await TestHelpers.createTestUser({
        role: 'admin',
        email: TestHelpers.generateTestEmail('admin')
      });

      const canAccess = await AccessControlService.canAccessResource(
        admin,
        'patient',
        patient1.id
      );

      expect(canAccess).toBe(true);
    });

    it('should return false for unknown resource types', async () => {
      const canAccess = await AccessControlService.canAccessResource(
        patient1,
        'unknown_resource',
        'some-id'
      );

      expect(canAccess).toBe(false);
    });
  });

  describe('buildRecordAccessConditions', () => {
    it('should build conditions for patient access', async () => {
      const conditions = await AccessControlService.buildRecordAccessConditions(
        patient1
      );

      expect(conditions).toEqual({ patientId: patient1.id });
    });

    it('should build conditions for admin access without patient filter', async () => {
      const admin = await TestHelpers.createTestUser({
        role: 'admin',
        email: TestHelpers.generateTestEmail('admin')
      });

      const conditions = await AccessControlService.buildRecordAccessConditions(
        admin
      );

      expect(conditions).toEqual({});
    });

    it('should build conditions for admin access with specific patient', async () => {
      const admin = await TestHelpers.createTestUser({
        role: 'admin',
        email: TestHelpers.generateTestEmail('admin')
      });

      const conditions = await AccessControlService.buildRecordAccessConditions(
        admin,
        patient1.id
      );

      expect(conditions).toEqual({ patientId: patient1.id });
    });

    it('should handle unauthorized roles', async () => {
      const unauthorizedUser = await TestHelpers.createTestUser({
        role: 'unknown',
        email: TestHelpers.generateTestEmail('unknown')
      });

      const conditions = await AccessControlService.buildRecordAccessConditions(
        unauthorizedUser
      );

      expect(conditions).toEqual({ id: null });
    });
  });
});