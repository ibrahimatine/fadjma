const authorize = require('../../src/middleware/authorize');
const TestHelpers = require('../helpers/testHelpers');

describe('Authorize Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: {
        id: 'user-id',
        role: 'patient'
      }
    };

    res = TestHelpers.createMockResponse();
    next = TestHelpers.createMockNext();
  });

  describe('Role Authorization', () => {
    it('should allow access when user has required role', () => {
      const middleware = authorize(['patient', 'doctor']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow access when user role matches single role', () => {
      const middleware = authorize('patient');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny access when user role not in allowed roles', () => {
      const middleware = authorize(['doctor', 'admin']);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Forbidden: You do not have access to this resource'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow access when no roles specified (open access)', () => {
      const middleware = authorize([]);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should allow access when roles is empty array', () => {
      const middleware = authorize();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('User Validation', () => {
    it('should deny access when user is not present', () => {
      req.user = null;
      const middleware = authorize(['patient']);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Unauthorized: User role not found'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny access when user role is not present', () => {
      req.user = { id: 'user-id' }; // No role
      const middleware = authorize(['patient']);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Unauthorized: User role not found'
      });
    });

    it('should deny access when user role is empty string', () => {
      req.user = { id: 'user-id', role: '' };
      const middleware = authorize(['patient']);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Forbidden: You do not have access to this resource'
      });
    });
  });

  describe('Multiple Role Scenarios', () => {
    it('should allow doctor access to doctor-only resource', () => {
      req.user.role = 'doctor';
      const middleware = authorize(['doctor']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should allow admin access to multi-role resource', () => {
      req.user.role = 'admin';
      const middleware = authorize(['patient', 'doctor', 'admin']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny pharmacy access to patient-doctor resource', () => {
      req.user.role = 'pharmacy';
      const middleware = authorize(['patient', 'doctor']);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('Input Parameter Handling', () => {
    it('should handle single role as string', () => {
      const middleware = authorize('doctor');
      req.user.role = 'doctor';

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle single role as array', () => {
      const middleware = authorize(['doctor']);
      req.user.role = 'doctor';

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle undefined roles parameter', () => {
      const middleware = authorize(undefined);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle null roles parameter', () => {
      const middleware = authorize(null);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('Case Sensitivity', () => {
    it('should be case sensitive for role matching', () => {
      req.user.role = 'Doctor'; // Capitalized
      const middleware = authorize(['doctor']);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should match exact case', () => {
      req.user.role = 'patient';
      const middleware = authorize(['patient']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('Role Combinations', () => {
    const testCases = [
      {
        userRole: 'patient',
        allowedRoles: ['patient'],
        shouldAllow: true,
        description: 'patient accessing patient resource'
      },
      {
        userRole: 'doctor',
        allowedRoles: ['doctor'],
        shouldAllow: true,
        description: 'doctor accessing doctor resource'
      },
      {
        userRole: 'admin',
        allowedRoles: ['admin'],
        shouldAllow: true,
        description: 'admin accessing admin resource'
      },
      {
        userRole: 'pharmacy',
        allowedRoles: ['pharmacy'],
        shouldAllow: true,
        description: 'pharmacy accessing pharmacy resource'
      },
      {
        userRole: 'patient',
        allowedRoles: ['doctor'],
        shouldAllow: false,
        description: 'patient accessing doctor-only resource'
      },
      {
        userRole: 'doctor',
        allowedRoles: ['patient', 'admin'],
        shouldAllow: false,
        description: 'doctor accessing patient/admin resource'
      },
      {
        userRole: 'admin',
        allowedRoles: ['patient', 'doctor', 'pharmacy', 'admin'],
        shouldAllow: true,
        description: 'admin accessing multi-role resource'
      }
    ];

    testCases.forEach(({ userRole, allowedRoles, shouldAllow, description }) => {
      it(`should ${shouldAllow ? 'allow' : 'deny'} ${description}`, () => {
        req.user.role = userRole;
        const middleware = authorize(allowedRoles);

        middleware(req, res, next);

        if (shouldAllow) {
          expect(next).toHaveBeenCalled();
          expect(res.status).not.toHaveBeenCalled();
        } else {
          expect(res.status).toHaveBeenCalledWith(403);
          expect(next).not.toHaveBeenCalled();
        }
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty array of roles', () => {
      const middleware = authorize([]);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle whitespace in role', () => {
      req.user.role = ' patient ';
      const middleware = authorize(['patient']);

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403); // Should not trim
    });

    it('should handle special characters in role', () => {
      req.user.role = 'patient@test';
      const middleware = authorize(['patient@test']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle numeric roles', () => {
      req.user.role = '123';
      const middleware = authorize(['123']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});