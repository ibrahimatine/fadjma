const { sequelize } = require('../src/config/database');

// Configuration globale des tests
beforeAll(async () => {
  // Attendre que la base de données soit prête
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established for tests');
  } catch (error) {
    console.error('❌ Unable to connect to database for tests:', error);
    process.exit(1);
  }
});

afterAll(async () => {
  // Fermer la connexion à la base de données
  await sequelize.close();
  console.log('🔌 Database connection closed after tests');
});

// Nettoyer la base de données avant chaque test
beforeEach(async () => {
  // Optionnel: Nettoyer les données de test
  // await sequelize.sync({ force: true });
});

// Configuration globale pour les mocks
global.console = {
  ...console,
  // Supprimer les logs pendant les tests (optionnel)
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};