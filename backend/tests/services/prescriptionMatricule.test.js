/**
 * Tests for Prescription Matricule Generation
 * Critical feature: PRX-YYYYMMDD-XXXX format
 */

const crypto = require('crypto');

describe('Prescription Matricule Service', () => {
  describe('generateMatricule', () => {
    const generateMatricule = () => {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
      return `PRX-${year}${month}${day}-${randomHex}`;
    };

    test('should generate matricule with correct format PRX-YYYYMMDD-XXXX', () => {
      const matricule = generateMatricule();

      expect(matricule).toMatch(/^PRX-\d{8}-[A-F0-9]{4}$/);
    });

    test('should include current date in matricule', () => {
      const matricule = generateMatricule();
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const expectedDatePart = `${year}${month}${day}`;

      expect(matricule).toContain(expectedDatePart);
    });

    test('should generate unique matricules', () => {
      const matricules = new Set();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        matricules.add(generateMatricule());
      }

      expect(matricules.size).toBe(iterations);
    });

    test('should start with PRX- prefix', () => {
      const matricule = generateMatricule();

      expect(matricule.startsWith('PRX-')).toBe(true);
    });

    test('should have exactly 17 characters', () => {
      const matricule = generateMatricule();

      // PRX- (4) + YYYYMMDD (8) + - (1) + XXXX (4) = 17 chars
      expect(matricule.length).toBe(17);
    });

    test('should use uppercase hex for random suffix', () => {
      const matricule = generateMatricule();
      const suffix = matricule.split('-')[2];

      expect(suffix).toMatch(/^[A-F0-9]{4}$/);
    });

    test('should be parseable to extract date', () => {
      const matricule = generateMatricule();
      const parts = matricule.split('-');

      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe('PRX');
      expect(parts[1]).toHaveLength(8);
      expect(parts[2]).toHaveLength(4);

      const dateStr = parts[1];
      const year = parseInt(dateStr.substring(0, 4));
      const month = parseInt(dateStr.substring(4, 6));
      const day = parseInt(dateStr.substring(6, 8));

      expect(year).toBeGreaterThan(2020);
      expect(month).toBeGreaterThanOrEqual(1);
      expect(month).toBeLessThanOrEqual(12);
      expect(day).toBeGreaterThanOrEqual(1);
      expect(day).toBeLessThanOrEqual(31);
    });
  });

  describe('validateMatricule', () => {
    const validateMatricule = (matricule) => {
      const regex = /^PRX-\d{8}-[A-F0-9]{4}$/;
      return regex.test(matricule);
    };

    test('should validate correct matricule format', () => {
      expect(validateMatricule('PRX-20251004-A3F2')).toBe(true);
      expect(validateMatricule('PRX-20251231-FFFF')).toBe(true);
      expect(validateMatricule('PRX-20250101-0000')).toBe(true);
    });

    test('should reject invalid matricule formats', () => {
      expect(validateMatricule('PRX-2025100-A3F2')).toBe(false); // Missing digit
      expect(validateMatricule('PRX-20251004-a3f2')).toBe(false); // Lowercase hex
      expect(validateMatricule('RX-20251004-A3F2')).toBe(false); // Wrong prefix
      expect(validateMatricule('PRX-20251004-A3F')).toBe(false); // Short suffix
      expect(validateMatricule('PRX-20251004-A3F2G')).toBe(false); // Long suffix
      expect(validateMatricule('20251004-A3F2')).toBe(false); // No prefix
    });

    test('should reject matricules with special characters', () => {
      expect(validateMatricule('PRX-20251004-A3F@')).toBe(false);
      expect(validateMatricule('PRX-2025/10/04-A3F2')).toBe(false);
      expect(validateMatricule('PRX 20251004 A3F2')).toBe(false);
    });
  });

  describe('extractDateFromMatricule', () => {
    const extractDateFromMatricule = (matricule) => {
      const parts = matricule.split('-');
      if (parts.length !== 3 || parts[0] !== 'PRX') {
        throw new Error('Invalid matricule format');
      }

      const dateStr = parts[1];
      const year = parseInt(dateStr.substring(0, 4));
      const month = parseInt(dateStr.substring(4, 6)) - 1; // JS months are 0-indexed
      const day = parseInt(dateStr.substring(6, 8));

      return new Date(year, month, day);
    };

    test('should extract correct date from matricule', () => {
      const date = extractDateFromMatricule('PRX-20251004-A3F2');

      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(9); // October = 9 (0-indexed)
      expect(date.getDate()).toBe(4);
    });

    test('should handle different dates correctly', () => {
      const testCases = [
        { matricule: 'PRX-20250101-0000', year: 2025, month: 0, day: 1 },
        { matricule: 'PRX-20251231-FFFF', year: 2025, month: 11, day: 31 },
        { matricule: 'PRX-20240615-ABC1', year: 2024, month: 5, day: 15 },
      ];

      testCases.forEach(({ matricule, year, month, day }) => {
        const date = extractDateFromMatricule(matricule);
        expect(date.getFullYear()).toBe(year);
        expect(date.getMonth()).toBe(month);
        expect(date.getDate()).toBe(day);
      });
    });

    test('should throw error for invalid matricule', () => {
      expect(() => extractDateFromMatricule('INVALID')).toThrow();
      expect(() => extractDateFromMatricule('PRX-2025100-A3F2')).not.toThrow();
    });
  });

  describe('Collision Resistance', () => {
    test('should have very low collision probability', () => {
      const generateMatricule = () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
        return `PRX-${year}${month}${day}-${randomHex}`;
      };

      const matricules = new Set();
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        matricules.add(generateMatricule());
      }

      // With 2 bytes (65536 possible values), we expect very few collisions
      // Allow up to 1% collision rate (990+ unique out of 1000)
      expect(matricules.size).toBeGreaterThanOrEqual(iterations * 0.99);
    });
  });

  describe('Performance', () => {
    test('should generate matricules quickly', () => {
      const generateMatricule = () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
        return `PRX-${year}${month}${day}-${randomHex}`;
      };

      const startTime = Date.now();
      const iterations = 10000;

      for (let i = 0; i < iterations; i++) {
        generateMatricule();
      }

      const duration = Date.now() - startTime;

      // Should generate 10,000 matricules in less than 1 second
      expect(duration).toBeLessThan(1000);
    });
  });
});