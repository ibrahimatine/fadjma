const jwt = require('jsonwebtoken');
const authMiddleware = require('../../src/middleware/auth');
const { BaseUser, Patient, Doctor, Pharmacy } = require('../../src/models');
const TestHelpers = require('../helpers/testHelpers');

// Mock des modèles
jest.mock('../../src/models');

describe('Auth Middleware', () => {
  let req, res, next;
  let mockUser;

  beforeEach(() => {
    req = {
      headers: {}
    };

    res = TestHelpers.createMockResponse();
    next = TestHelpers.createMockNext();

    mockUser = {
      id: 'user-id',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'patient',
      isActive: true,
      isUnclaimed: false,
      toJSON: jest.fn().mockReturnValue({
        id: 'user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'patient'
      })
    };

    // Reset mocks
    jest.clearAllMocks();
    BaseUser.findByPk = jest.fn();
    Patient.findOne = jest.fn();
    Doctor.findOne = jest.fn();
    Pharmacy.findOne = jest.fn();
  });

  describe('Token Validation', () => {
    it('should reject request without token', async () => {
      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No token provided'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token format', async () => {
      req.headers.authorization = 'InvalidToken';

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No token provided'
      });
    });

    it('should reject request with invalid JWT', async () => {
      req.headers.authorization = 'Bearer invalid.jwt.token';

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid token'
      });
    });

    it('should reject request with expired token', async () => {
      const expiredToken = jwt.sign(
        { id: 'user-id' },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      req.headers.authorization = `Bearer ${expiredToken}`;

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Token expired'
      });
    });

    it('should accept valid token', async () => {
      const validToken = jwt.sign(
        { id: 'user-id' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      req.headers.authorization = `Bearer ${validToken}`;

      BaseUser.findByPk.mockResolvedValue(mockUser);

      await authMiddleware(req, res, next);

      expect(BaseUser.findByPk).toHaveBeenCalledWith('user-id');
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
    });
  });

  describe('User Validation', () => {
    let validToken;

    beforeEach(() => {
      validToken = jwt.sign(
        { id: 'user-id' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      req.headers.authorization = `Bearer ${validToken}`;
    });

    it('should reject request when user not found', async () => {
      BaseUser.findByPk.mockResolvedValue(null);

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User not found or inactive'
      });
    });

    it('should reject request when user is inactive', async () => {
      mockUser.isActive = false;
      BaseUser.findByPk.mockResolvedValue(mockUser);

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User not found or inactive'
      });
    });

    it('should reject request when user is unclaimed', async () => {
      mockUser.isUnclaimed = true;
      BaseUser.findByPk.mockResolvedValue(mockUser);

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Account not activated. Please complete registration using your patient identifier.',
        code: 'UNCLAIMED_PATIENT'
      });
    });

    it('should accept active, claimed user', async () => {
      BaseUser.findByPk.mockResolvedValue(mockUser);

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.baseUser).toBe(mockUser);
    });
  });

  describe('Profile Loading', () => {
    let validToken;

    beforeEach(() => {
      validToken = jwt.sign(
        { id: 'user-id' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      req.headers.authorization = `Bearer ${validToken}`;
      BaseUser.findByPk.mockResolvedValue(mockUser);
    });

    it('should load patient profile for patient role', async () => {
      mockUser.role = 'patient';
      const mockPatientProfile = {
        id: 'patient-profile-id',
        dateOfBirth: '1990-01-01',
        toJSON: jest.fn().mockReturnValue({
          id: 'patient-profile-id',
          dateOfBirth: '1990-01-01'
        })
      };

      Patient.findOne.mockResolvedValue(mockPatientProfile);

      await authMiddleware(req, res, next);

      expect(Patient.findOne).toHaveBeenCalledWith({
        where: { baseUserId: 'user-id' }
      });
      expect(req.user.profile).toEqual(mockPatientProfile.toJSON());
    });

    it('should load doctor profile for doctor role', async () => {
      mockUser.role = 'doctor';
      const mockDoctorProfile = {
        id: 'doctor-profile-id',
        specialty: 'Cardiology',
        toJSON: jest.fn().mockReturnValue({
          id: 'doctor-profile-id',
          specialty: 'Cardiology'
        })
      };

      Doctor.findOne.mockResolvedValue(mockDoctorProfile);

      await authMiddleware(req, res, next);

      expect(Doctor.findOne).toHaveBeenCalledWith({
        where: { baseUserId: 'user-id' }
      });
      expect(req.user.profile).toEqual(mockDoctorProfile.toJSON());
    });

    it('should load pharmacy profile for pharmacy role', async () => {
      mockUser.role = 'pharmacy';
      const mockPharmacyProfile = {
        id: 'pharmacy-profile-id',
        pharmacyName: 'Test Pharmacy',
        toJSON: jest.fn().mockReturnValue({
          id: 'pharmacy-profile-id',
          pharmacyName: 'Test Pharmacy'
        })
      };

      Pharmacy.findOne.mockResolvedValue(mockPharmacyProfile);

      await authMiddleware(req, res, next);

      expect(Pharmacy.findOne).toHaveBeenCalledWith({
        where: { baseUserId: 'user-id' }
      });
      expect(req.user.profile).toEqual(mockPharmacyProfile.toJSON());
    });

    it('should work without profile for admin role', async () => {
      mockUser.role = 'admin';

      await authMiddleware(req, res, next);

      expect(Patient.findOne).not.toHaveBeenCalled();
      expect(Doctor.findOne).not.toHaveBeenCalled();
      expect(Pharmacy.findOne).not.toHaveBeenCalled();
      expect(req.user.profile).toBeUndefined();
    });

    it('should work when profile is not found', async () => {
      mockUser.role = 'patient';
      Patient.findOne.mockResolvedValue(null);

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user.profile).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    let validToken;

    beforeEach(() => {
      validToken = jwt.sign(
        { id: 'user-id' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      req.headers.authorization = `Bearer ${validToken}`;
    });

    it('should handle database errors gracefully', async () => {
      BaseUser.findByPk.mockRejectedValue(new Error('Database connection failed'));

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error'
      });
    });

    it('should handle profile loading errors gracefully', async () => {
      mockUser.role = 'patient';
      BaseUser.findByPk.mockResolvedValue(mockUser);
      Patient.findOne.mockRejectedValue(new Error('Profile loading failed'));

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error'
      });
    });

    it('should handle JWT verification errors', async () => {
      // Mock jwt.verify to throw a specific error
      const originalVerify = jwt.verify;
      jwt.verify = jest.fn().mockImplementation(() => {
        const error = new Error('Invalid signature');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid token'
      });

      // Restore original function
      jwt.verify = originalVerify;
    });
  });

  describe('Different Token Formats', () => {
    beforeEach(() => {
      BaseUser.findByPk.mockResolvedValue(mockUser);
    });

    it('should handle Bearer token with proper spacing', async () => {
      const validToken = jwt.sign(
        { id: 'user-id' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      req.headers.authorization = `Bearer ${validToken}`;

      await authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle authorization header case insensitivity', async () => {
      const validToken = jwt.sign(
        { id: 'user-id' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      req.headers.Authorization = `Bearer ${validToken}`;

      await authMiddleware(req, res, next);

      // Should fail because we're checking for lowercase 'authorization'
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should reject token without Bearer prefix', async () => {
      const validToken = jwt.sign(
        { id: 'user-id' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      req.headers.authorization = validToken;

      await authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});