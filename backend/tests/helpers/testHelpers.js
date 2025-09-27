const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { BaseUser } = require('../../src/models');

/**
 * Utilitaires pour les tests
 */
class TestHelpers {
  /**
   * Crée un utilisateur de test
   */
  static async createTestUser(userData = {}) {
    const defaultUser = {
      email: 'test@example.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'patient',
      isActive: true,
      ...userData
    };

    // Hasher le mot de passe
    if (defaultUser.password) {
      defaultUser.password = await bcrypt.hash(defaultUser.password, 10);
    }

    return await BaseUser.create(defaultUser);
  }

  /**
   * Crée un médecin de test
   */
  static async createTestDoctor(userData = {}) {
    return await this.createTestUser({
      email: 'doctor@example.com',
      role: 'doctor',
      licenseNumber: 'DOC123456',
      specialty: 'General Medicine',
      hospital: 'Test Hospital',
      ...userData
    });
  }

  /**
   * Crée un patient de test
   */
  static async createTestPatient(userData = {}) {
    return await this.createTestUser({
      email: 'patient@example.com',
      role: 'patient',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      ...userData
    });
  }

  /**
   * Crée une pharmacie de test
   */
  static async createTestPharmacy(userData = {}) {
    return await this.createTestUser({
      email: 'pharmacy@example.com',
      role: 'pharmacy',
      licenseNumber: 'PHARM123456',
      pharmacyName: 'Test Pharmacy',
      pharmacyAddress: '123 Test Street',
      ...userData
    });
  }

  /**
   * Génère un token JWT de test
   */
  static generateTestToken(userId, role = 'patient') {
    return jwt.sign(
      { id: userId, role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  }

  /**
   * Crée une requête mockée avec authentification
   */
  static createAuthenticatedRequest(user, body = {}, params = {}, query = {}) {
    return {
      user,
      body,
      params,
      query,
      headers: {
        authorization: `Bearer ${this.generateTestToken(user.id, user.role)}`
      }
    };
  }

  /**
   * Crée une réponse mockée
   */
  static createMockResponse() {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    };
    return res;
  }

  /**
   * Crée un next mockée
   */
  static createMockNext() {
    return jest.fn();
  }

  /**
   * Génère un identifiant patient valide
   */
  static generateValidPatientIdentifier() {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(16).substr(2, 4).toUpperCase();
    return `PAT-${dateStr}-${random}`;
  }

  /**
   * Crée un patient non réclamé de test
   */
  static async createUnclaimedPatient(doctorId, patientData = {}) {
    const identifier = this.generateValidPatientIdentifier();

    return await BaseUser.create({
      firstName: 'Unclaimed',
      lastName: 'Patient',
      email: null,
      password: null,
      role: 'patient',
      isUnclaimed: true,
      patientIdentifier: identifier,
      createdByDoctorId: doctorId,
      dateOfBirth: '1990-01-01',
      gender: 'male',
      ...patientData
    });
  }

  /**
   * Nettoie les données de test
   */
  static async cleanupTestData() {
    // Supprimer tous les utilisateurs de test
    await BaseUser.destroy({
      where: {
        email: {
          [require('sequelize').Op.like]: '%test%'
        }
      },
      force: true
    });
  }

  /**
   * Assertion personnalisée pour les réponses API
   */
  static expectApiResponse(response, statusCode, hasData = false) {
    expect(response.status).toHaveBeenCalledWith(statusCode);

    const jsonCall = response.json.mock.calls[0];
    expect(jsonCall).toBeDefined();

    const responseData = jsonCall[0];
    expect(responseData).toHaveProperty('success');

    if (hasData) {
      expect(responseData).toHaveProperty('data');
    }

    return responseData;
  }

  /**
   * Assertion pour les erreurs API
   */
  static expectApiError(response, statusCode, message = null) {
    expect(response.status).toHaveBeenCalledWith(statusCode);

    const jsonCall = response.json.mock.calls[0];
    expect(jsonCall).toBeDefined();

    const responseData = jsonCall[0];
    expect(responseData).toHaveProperty('success', false);
    expect(responseData).toHaveProperty('error', true);

    if (message) {
      expect(responseData.message).toContain(message);
    }

    return responseData;
  }

  /**
   * Mock pour Sequelize findByPk
   */
  static mockSequelizeFindByPk(model, returnValue) {
    return jest.spyOn(model, 'findByPk').mockResolvedValue(returnValue);
  }

  /**
   * Mock pour Sequelize findOne
   */
  static mockSequelizeFindOne(model, returnValue) {
    return jest.spyOn(model, 'findOne').mockResolvedValue(returnValue);
  }

  /**
   * Mock pour Sequelize findAll
   */
  static mockSequelizeFindAll(model, returnValue) {
    return jest.spyOn(model, 'findAll').mockResolvedValue(returnValue);
  }

  /**
   * Mock pour Sequelize create
   */
  static mockSequelizeCreate(model, returnValue) {
    return jest.spyOn(model, 'create').mockResolvedValue(returnValue);
  }

  /**
   * Attend un délai (pour les tests d'intégration)
   */
  static async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Génère des données de test aléatoires
   */
  static generateRandomString(length = 10) {
    return Math.random().toString(36).substring(2, length + 2);
  }

  /**
   * Génère un email de test unique
   */
  static generateTestEmail(prefix = 'test') {
    return `${prefix}-${this.generateRandomString()}@example.com`;
  }
}

module.exports = TestHelpers;