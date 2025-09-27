// Configuration des variables d'environnement pour les tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-very-long-and-secure-12345678901234567890';
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.SESSION_SECRET = 'test-session-secret-key-for-testing-purposes-12345678901234567890';
process.env.DB_HOST = 'localhost';
process.env.DB_NAME = 'fadjma_test';
process.env.DB_USER = 'test_user';
process.env.DB_PASS = 'test_pass';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000,http://localhost:3001';