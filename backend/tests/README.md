# Tests Documentation - FADJMA Backend

## Vue d'ensemble

Cette suite de tests couvre l'ensemble du backend FADJMA avec des tests unitaires, d'intégration et de bout en bout pour garantir la qualité et la fiabilité du code.

## Structure des Tests

```
tests/
├── setup.js                     # Configuration globale des tests
├── env.js                       # Variables d'environnement pour les tests
├── helpers/
│   └── testHelpers.js           # Utilitaires pour les tests
├── services/                    # Tests unitaires des services
│   ├── accessControlService.test.js
│   ├── patientIdentifierService.test.js
│   └── securityService.test.js
├── controllers/                 # Tests des contrôleurs
│   └── patientController.test.js
├── middleware/                  # Tests des middlewares
│   ├── auth.test.js
│   └── authorize.test.js
└── integration/                 # Tests d'intégration
    ├── auth.integration.test.js
    └── patients.integration.test.js
```

## Configuration

### Variables d'environnement

Les tests utilisent des variables d'environnement spécifiques définies dans `tests/env.js` :

```javascript
NODE_ENV=test
JWT_SECRET=test-jwt-secret-key-...
ENCRYPTION_KEY=0123456789abcdef...
DB_NAME=fadjma_test
```

### Base de données de test

Les tests utilisent une base de données séparée (`fadjma_test`) qui est :
- Synchronisée avant chaque suite de tests
- Nettoyée entre chaque test
- Fermée après tous les tests

## Types de Tests

### 1. Tests Unitaires

#### Services (`tests/services/`)

**AccessControlService**
- ✅ Vérification des autorisations médecin-patient
- ✅ Récupération des patients accessibles
- ✅ Validation des permissions par ressource
- ✅ Construction des conditions d'accès

**PatientIdentifierService**
- ✅ Génération d'identifiants uniques
- ✅ Validation du format des identifiants
- ✅ Création de patients non réclamés
- ✅ Liaison des identifiants aux comptes

**SecurityService**
- ✅ Validation des autorisations docteur
- ✅ Vérification des identifiants patients
- ✅ Sanitisation des données patients
- ✅ Nettoyage automatique des comptes expirés

#### Utilitaires (`tests/utils/`)
- ✅ ResponseHelper (réponses HTTP standardisées)
- ✅ SecurityValidators (validations de sécurité)

### 2. Tests de Contrôleurs (`tests/controllers/`)

**PatientController**
- ✅ getAllPatients - Pagination, recherche, autorisations
- ✅ getAccessiblePatients - Patients accessibles par médecin
- ✅ getPatientById - Accès sécurisé aux détails patient
- ✅ createUnclaimedPatient - Création de profils patients
- ✅ linkPatientIdentifier - Liaison d'identifiants
- ✅ verifyPatientIdentifier - Vérification d'identifiants

### 3. Tests de Middleware (`tests/middleware/`)

**Auth Middleware**
- ✅ Validation des tokens JWT
- ✅ Vérification des utilisateurs actifs
- ✅ Blocage des comptes non réclamés
- ✅ Chargement des profils utilisateur

**Authorize Middleware**
- ✅ Contrôle d'accès basé sur les rôles
- ✅ Validation des permissions
- ✅ Gestion des cas d'erreur

### 4. Tests d'Intégration (`tests/integration/`)

**Authentication API**
- ✅ Inscription complète (patients, docteurs, pharmacies)
- ✅ Connexion avec validation
- ✅ Récupération du profil utilisateur
- ✅ Flux complet des identifiants patients
- ✅ Rate limiting

**Patients API**
- ✅ CRUD complet des patients
- ✅ Système d'autorisations
- ✅ Workflow identifiants patients
- ✅ Pagination et recherche

## Commandes de Test

### Tests Complets
```bash
# Tous les tests
npm test

# Tests avec couverture
npm run test:coverage

# Tests en mode watch
npm run test:watch

# Tests pour CI/CD
npm run test:ci
```

### Tests Spécifiques
```bash
# Tests unitaires seulement
npm run test:unit

# Tests d'intégration seulement
npm run test:integration

# Tests des contrôleurs
npm run test:controllers

# Tests des middlewares
npm run test:middleware

# Tests verbeux
npm run test:verbose
```

### Tests Individuels
```bash
# Un fichier spécifique
npx jest tests/services/accessControlService.test.js

# Un test spécifique
npx jest -t "should return accessible patients for doctor"

# Tests avec pattern
npx jest --testNamePattern="patient"
```

## Helpers et Utilitaires

### TestHelpers

La classe `TestHelpers` fournit des utilitaires pour :

```javascript
// Création d'utilisateurs de test
const doctor = await TestHelpers.createTestDoctor();
const patient = await TestHelpers.createTestPatient();
const unclaimedPatient = await TestHelpers.createUnclaimedPatient(doctorId);

// Génération de tokens
const token = TestHelpers.generateTestToken(userId, role);

// Mocks de requêtes/réponses
const req = TestHelpers.createAuthenticatedRequest(user);
const res = TestHelpers.createMockResponse();

// Assertions spécialisées
TestHelpers.expectApiResponse(res, 200, true);
TestHelpers.expectApiError(res, 404, 'Not found');

// Nettoyage
await TestHelpers.cleanupTestData();
```

### Mocking

```javascript
// Mock des modèles Sequelize
TestHelpers.mockSequelizeFindByPk(Model, returnValue);
TestHelpers.mockSequelizeFindOne(Model, returnValue);

// Mock des services
jest.mock('../../src/services/accessControlService');
AccessControlService.canAccessResource.mockResolvedValue(true);
```

## Couverture de Code

### Objectifs de Couverture

- **Statements:** > 90%
- **Branches:** > 85%
- **Functions:** > 90%
- **Lines:** > 90%

### Rapport de Couverture

```bash
npm run test:coverage
```

Génère un rapport dans `coverage/` avec :
- Rapport HTML détaillé
- Rapport LCOV pour intégration CI/CD
- Métriques par fichier et globales

### Exclusions

Fichiers exclus de la couverture :
- `src/app.js` - Point d'entrée
- `src/server.js` - Serveur
- `src/config/**` - Configuration
- `src/models/index.js` - Index des modèles

## Meilleures Pratiques

### 1. Structure des Tests

```javascript
describe('ServiceName', () => {
  beforeEach(async () => {
    // Configuration commune
    await TestHelpers.cleanupTestData();
  });

  describe('methodName', () => {
    it('should do something specific', async () => {
      // Arrange
      const input = 'test-data';

      // Act
      const result = await service.method(input);

      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

### 2. Tests d'Intégration

```javascript
describe('API Endpoint', () => {
  let user, token;

  beforeEach(async () => {
    user = await TestHelpers.createTestUser();
    token = TestHelpers.generateTestToken(user.id, user.role);
  });

  it('should handle complete workflow', async () => {
    const response = await request(app)
      .post('/api/endpoint')
      .set('Authorization', `Bearer ${token}`)
      .send(data)
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});
```

### 3. Gestion des Erreurs

```javascript
it('should handle database errors gracefully', async () => {
  // Mock une erreur
  Model.findOne = jest.fn().mockRejectedValue(new Error('DB Error'));

  const result = await service.method();

  expect(result).toBeNull(); // ou comportement attendu
});
```

### 4. Tests Asynchrones

```javascript
// Avec async/await
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});

// Avec Promise
it('should handle promises', () => {
  return asyncFunction().then(result => {
    expect(result).toBeDefined();
  });
});

// Avec resolves/rejects
it('should resolve correctly', async () => {
  await expect(asyncFunction()).resolves.toBeDefined();
});
```

## Débogage des Tests

### Logs de Débogage

```javascript
// Dans les tests
console.log('Debug info:', data);

// Ou utiliser les helpers de Jest
expect(data).toMatchSnapshot(); // Pour comparer des objets complexes
```

### Tests en Isolation

```javascript
// Exécuter un seul test
npx jest -t "specific test name"

// Exécuter avec plus de détails
npx jest --verbose --no-cache
```

### Mock Debugging

```javascript
// Vérifier les appels de mocks
expect(mockFunction).toHaveBeenCalledWith(expectedArgs);
expect(mockFunction).toHaveBeenCalledTimes(1);

// Réinitialiser les mocks
jest.clearAllMocks();
mockFunction.mockReset();
```

## CI/CD Integration

### Configuration GitHub Actions

```yaml
- name: Run Tests
  run: npm run test:ci

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

### Variables d'Environnement CI

```bash
NODE_ENV=test
JWT_SECRET=${{ secrets.TEST_JWT_SECRET }}
DB_HOST=localhost
DB_NAME=fadjma_test_ci
```

## Maintenance des Tests

### Mise à Jour Régulière

1. **Ajouter des tests** pour chaque nouvelle fonctionnalité
2. **Mettre à jour les tests** lors de modifications d'API
3. **Vérifier la couverture** régulièrement
4. **Refactoriser les tests** quand nécessaire

### Performance des Tests

- **Parallélisation :** Jest exécute les tests en parallèle par défaut
- **Timeout :** Configuré à 10s pour les tests d'intégration
- **Mocks :** Utiliser des mocks pour isoler les tests unitaires

### Surveillance

- Temps d'exécution des tests
- Taux de réussite en CI/CD
- Couverture de code
- Flaky tests (tests instables)

---

## Ressources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/ladjs/supertest)
- [Sequelize Testing](https://sequelize.org/docs/v6/other-topics/testing/)

## Support

Pour les questions sur les tests :
1. Consulter cette documentation
2. Vérifier les exemples dans les fichiers de test existants
3. Utiliser les utilitaires de `TestHelpers`