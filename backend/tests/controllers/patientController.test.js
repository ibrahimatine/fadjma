const patientController = require('../../src/controllers/patientContoller');
const { BaseUser, MedicalRecordAccessRequest } = require('../../src/models');
const AccessControlService = require('../../src/services/accessControlService');
const PatientIdentifierService = require('../../src/services/patientIdentifierService');
const TestHelpers = require('../helpers/testHelpers');

// Mock des services
jest.mock('../../src/services/accessControlService');
jest.mock('../../src/services/patientIdentifierService');

describe('Patient Controller', () => {
  let doctor, patient, req, res, next;

  beforeEach(() => {
    doctor = {
      id: 'doctor-id',
      role: 'doctor',
      email: 'doctor@test.com'
    };

    patient = {
      id: 'patient-id',
      role: 'patient',
      email: 'patient@test.com',
      firstName: 'John',
      lastName: 'Doe'
    };

    req = {
      user: doctor,
      body: {},
      params: {},
      query: {}
    };

    res = TestHelpers.createMockResponse();
    next = TestHelpers.createMockNext();

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('getAllPatients', () => {
    beforeEach(() => {
      req.query = { page: '1', limit: '10' };
    });

    it('should return patients for doctor', async () => {
      const mockPatients = {
        rows: [patient],
        count: 1
      };

      TestHelpers.mockSequelizeFindAndCountAll = jest.fn().mockResolvedValue(mockPatients);
      BaseUser.findAndCountAll = TestHelpers.mockSequelizeFindAndCountAll;

      await patientController.getAllPatients(req, res);

      const responseData = TestHelpers.expectApiResponse(res, 200, true);
      expect(responseData.data).toHaveLength(1);
      expect(responseData.pagination.total).toBe(1);
    });

    it('should return patients for admin', async () => {
      req.user = { role: 'admin' };

      const mockPatients = {
        rows: [patient],
        count: 1
      };

      BaseUser.findAndCountAll = jest.fn().mockResolvedValue(mockPatients);

      await patientController.getAllPatients(req, res);

      TestHelpers.expectApiResponse(res, 200, true);
    });

    it('should deny access for non-doctor/admin', async () => {
      req.user = { role: 'patient' };

      await patientController.getAllPatients(req, res);

      TestHelpers.expectApiError(res, 403, 'Access denied');
    });

    it('should apply search filter', async () => {
      req.query.search = 'John';

      const mockPatients = {
        rows: [patient],
        count: 1
      };

      BaseUser.findAndCountAll = jest.fn().mockResolvedValue(mockPatients);

      await patientController.getAllPatients(req, res);

      expect(BaseUser.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: 'patient',
            [require('sequelize').Op.or]: expect.any(Array)
          })
        })
      );
    });

    it('should handle pagination correctly', async () => {
      req.query = { page: '2', limit: '5' };

      const mockPatients = {
        rows: [],
        count: 10
      };

      BaseUser.findAndCountAll = jest.fn().mockResolvedValue(mockPatients);

      await patientController.getAllPatients(req, res);

      expect(BaseUser.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          offset: 5, // (page-1) * limit = (2-1) * 5
          limit: 5
        })
      );
    });

    it('should handle database errors', async () => {
      BaseUser.findAndCountAll = jest.fn().mockRejectedValue(new Error('Database error'));

      await patientController.getAllPatients(req, res);

      TestHelpers.expectApiError(res, 500);
    });
  });

  describe('getAccessiblePatients', () => {
    it('should return accessible patients for doctor', async () => {
      const mockPatients = [patient];
      AccessControlService.getAccessiblePatientsForDoctor.mockResolvedValue(mockPatients);

      await patientController.getAccessiblePatients(req, res);

      expect(AccessControlService.getAccessiblePatientsForDoctor).toHaveBeenCalledWith(doctor.id);

      const responseData = TestHelpers.expectApiResponse(res, 200, true);
      expect(responseData.data.patients).toEqual(mockPatients);
      expect(responseData.data.total).toBe(1);
    });

    it('should deny access for non-doctor', async () => {
      req.user = { role: 'patient' };

      await patientController.getAccessiblePatients(req, res);

      TestHelpers.expectApiError(res, 403);
    });

    it('should apply search filter', async () => {
      const mockPatients = [
        { firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
        { firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com' }
      ];

      req.query.search = 'john';
      AccessControlService.getAccessiblePatientsForDoctor.mockResolvedValue(mockPatients);

      await patientController.getAccessiblePatients(req, res);

      const responseData = TestHelpers.expectApiResponse(res, 200, true);
      expect(responseData.data.patients).toHaveLength(1);
      expect(responseData.data.patients[0].firstName).toBe('John');
    });

    it('should handle service errors', async () => {
      AccessControlService.getAccessiblePatientsForDoctor.mockRejectedValue(
        new Error('Service error')
      );

      await patientController.getAccessiblePatients(req, res);

      TestHelpers.expectApiError(res, 500);
    });
  });

  describe('getPatientById', () => {
    beforeEach(() => {
      req.params.id = patient.id;
    });

    it('should return patient for doctor with access', async () => {
      AccessControlService.canAccessResource.mockResolvedValue(true);
      BaseUser.findOne = jest.fn().mockResolvedValue(patient);

      await patientController.getPatientById(req, res);

      expect(AccessControlService.canAccessResource).toHaveBeenCalledWith(
        doctor,
        'patient',
        patient.id
      );

      const responseData = TestHelpers.expectApiResponse(res, 200, true);
      expect(responseData.data).toEqual(patient);
    });

    it('should deny access when doctor has no access', async () => {
      AccessControlService.canAccessResource.mockResolvedValue(false);

      await patientController.getPatientById(req, res);

      TestHelpers.expectApiError(res, 403, 'Access denied');
    });

    it('should return 404 when patient not found', async () => {
      AccessControlService.canAccessResource.mockResolvedValue(true);
      BaseUser.findOne = jest.fn().mockResolvedValue(null);

      await patientController.getPatientById(req, res);

      TestHelpers.expectApiError(res, 404, 'Patient not found');
    });

    it('should allow admin access to any patient', async () => {
      req.user = { role: 'admin' };
      AccessControlService.canAccessResource.mockResolvedValue(true);
      BaseUser.findOne = jest.fn().mockResolvedValue(patient);

      await patientController.getPatientById(req, res);

      TestHelpers.expectApiResponse(res, 200, true);
    });

    it('should deny access for non-doctor/admin', async () => {
      req.user = { role: 'pharmacy' };

      await patientController.getPatientById(req, res);

      TestHelpers.expectApiError(res, 403, 'Access denied');
    });
  });

  describe('createUnclaimedPatient', () => {
    beforeEach(() => {
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        gender: 'male'
      };
    });

    it('should create unclaimed patient successfully', async () => {
      const mockPatient = {
        id: 'new-patient-id',
        ...req.body,
        patientIdentifier: 'PAT-20241127-A1B2'
      };

      const mockFormattedPatient = { ...mockPatient, status: 'unclaimed' };

      PatientIdentifierService.createUnclaimedPatient.mockResolvedValue(mockPatient);
      PatientIdentifierService.formatPatientForDoctor.mockReturnValue(mockFormattedPatient);

      // Mock validation
      const mockValidationResult = { isEmpty: () => true };
      require('express-validator').validationResult = jest.fn().mockReturnValue(mockValidationResult);

      await patientController.createUnclaimedPatient(req, res);

      expect(PatientIdentifierService.createUnclaimedPatient).toHaveBeenCalledWith(
        req.body,
        doctor.id
      );

      const responseData = TestHelpers.expectApiResponse(res, 201, true);
      expect(responseData.data.patient).toEqual(mockFormattedPatient);
    });

    it('should handle validation errors', async () => {
      // Mock validation errors
      const mockValidationResult = {
        isEmpty: () => false,
        array: () => [
          { field: 'firstName', msg: 'First name is required' }
        ]
      };

      require('express-validator').validationResult = jest.fn().mockReturnValue(mockValidationResult);

      await patientController.createUnclaimedPatient(req, res);

      TestHelpers.expectApiError(res, 400);
    });

    it('should handle service errors', async () => {
      // Mock validation success
      const mockValidationResult = { isEmpty: () => true };
      require('express-validator').validationResult = jest.fn().mockReturnValue(mockValidationResult);

      PatientIdentifierService.createUnclaimedPatient.mockRejectedValue(
        new Error('Service error')
      );

      await patientController.createUnclaimedPatient(req, res);

      TestHelpers.expectApiError(res, 500);
    });
  });

  describe('linkPatientIdentifier', () => {
    beforeEach(() => {
      req.body = {
        patientIdentifier: 'PAT-20241127-A1B2',
        email: 'patient@example.com',
        password: 'SecurePassword123!',
        phoneNumber: '+1234567890'
      };
    });

    it('should link patient identifier successfully', async () => {
      const mockLinkedPatient = {
        id: 'patient-id',
        email: req.body.email,
        firstName: 'John',
        lastName: 'Doe',
        isUnclaimed: false
      };

      // Mock validation
      const mockValidationResult = { isEmpty: () => true };
      require('express-validator').validationResult = jest.fn().mockReturnValue(mockValidationResult);

      // Mock SecurityService validation
      const SecurityService = require('../../src/services/securityService');
      SecurityService.validatePatientIdentifier = jest.fn().mockReturnValue({
        valid: true,
        error: null
      });

      PatientIdentifierService.linkIdentifierToAccount.mockResolvedValue(mockLinkedPatient);

      await patientController.linkPatientIdentifier(req, res);

      expect(SecurityService.validatePatientIdentifier).toHaveBeenCalledWith(
        req.body.patientIdentifier
      );

      expect(PatientIdentifierService.linkIdentifierToAccount).toHaveBeenCalledWith(
        req.body.patientIdentifier,
        expect.objectContaining({
          email: req.body.email,
          password: req.body.password,
          phoneNumber: req.body.phoneNumber
        })
      );

      TestHelpers.expectApiResponse(res, 200, true);
    });

    it('should handle invalid identifier format', async () => {
      // Mock validation success
      const mockValidationResult = { isEmpty: () => true };
      require('express-validator').validationResult = jest.fn().mockReturnValue(mockValidationResult);

      // Mock SecurityService validation failure
      const SecurityService = require('../../src/services/securityService');
      SecurityService.validatePatientIdentifier = jest.fn().mockReturnValue({
        valid: false,
        error: 'Invalid format'
      });

      await patientController.linkPatientIdentifier(req, res);

      TestHelpers.expectApiError(res, 400, 'Invalid format');
    });

    it('should handle identifier not found', async () => {
      // Mock validation success
      const mockValidationResult = { isEmpty: () => true };
      require('express-validator').validationResult = jest.fn().mockReturnValue(mockValidationResult);

      const SecurityService = require('../../src/services/securityService');
      SecurityService.validatePatientIdentifier = jest.fn().mockReturnValue({
        valid: true,
        error: null
      });

      PatientIdentifierService.linkIdentifierToAccount.mockRejectedValue(
        new Error('Patient identifier not found')
      );

      await patientController.linkPatientIdentifier(req, res);

      TestHelpers.expectApiError(res, 404);
    });
  });

  describe('verifyPatientIdentifier', () => {
    beforeEach(() => {
      req.params.identifier = 'PAT-20241127-A1B2';
    });

    it('should verify valid identifier successfully', async () => {
      const mockPatient = {
        id: 'patient-id',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01'
      };

      // Mock SecurityService validation
      const SecurityService = require('../../src/services/securityService');
      SecurityService.validatePatientIdentifier = jest.fn().mockReturnValue({
        valid: true,
        error: null
      });

      PatientIdentifierService.findPatientByIdentifier.mockResolvedValue(mockPatient);

      await patientController.verifyPatientIdentifier(req, res);

      expect(SecurityService.validatePatientIdentifier).toHaveBeenCalledWith(
        req.params.identifier
      );

      expect(PatientIdentifierService.findPatientByIdentifier).toHaveBeenCalledWith(
        req.params.identifier
      );

      const responseData = TestHelpers.expectApiResponse(res, 200, true);
      expect(responseData.data).toEqual(mockPatient);
    });

    it('should handle invalid identifier format', async () => {
      const SecurityService = require('../../src/services/securityService');
      SecurityService.validatePatientIdentifier = jest.fn().mockReturnValue({
        valid: false,
        error: 'Invalid format'
      });

      await patientController.verifyPatientIdentifier(req, res);

      TestHelpers.expectApiError(res, 400, 'Invalid format');
    });

    it('should handle identifier not found', async () => {
      const SecurityService = require('../../src/services/securityService');
      SecurityService.validatePatientIdentifier = jest.fn().mockReturnValue({
        valid: true,
        error: null
      });

      PatientIdentifierService.findPatientByIdentifier.mockResolvedValue(null);

      await patientController.verifyPatientIdentifier(req, res);

      TestHelpers.expectApiError(res, 404);
    });
  });

  describe('getMyUnclaimedPatients', () => {
    it('should return unclaimed patients created by doctor', async () => {
      const mockResult = {
        patients: [
          { id: 'patient1', firstName: 'John', status: 'unclaimed' },
          { id: 'patient2', firstName: 'Jane', status: 'unclaimed' }
        ],
        total: 2,
        page: 1,
        totalPages: 1
      };

      const mockFormattedPatients = mockResult.patients.map(p => ({ ...p, formatted: true }));

      PatientIdentifierService.getUnclaimedPatientsByDoctor.mockResolvedValue(mockResult);
      PatientIdentifierService.formatPatientForDoctor
        .mockReturnValueOnce(mockFormattedPatients[0])
        .mockReturnValueOnce(mockFormattedPatients[1]);

      await patientController.getMyUnclaimedPatients(req, res);

      expect(PatientIdentifierService.getUnclaimedPatientsByDoctor).toHaveBeenCalledWith(
        doctor.id,
        expect.any(Object)
      );

      const responseData = TestHelpers.expectApiResponse(res, 200, true);
      expect(responseData.data.patients).toHaveLength(2);
      expect(responseData.data.total).toBe(2);
    });

    it('should handle pagination parameters', async () => {
      req.query = { page: '2', limit: '5' };

      const mockResult = {
        patients: [],
        total: 10,
        page: 2,
        totalPages: 2
      };

      PatientIdentifierService.getUnclaimedPatientsByDoctor.mockResolvedValue(mockResult);

      await patientController.getMyUnclaimedPatients(req, res);

      expect(PatientIdentifierService.getUnclaimedPatientsByDoctor).toHaveBeenCalledWith(
        doctor.id,
        expect.objectContaining({
          page: 2,
          limit: 5
        })
      );
    });
  });
});