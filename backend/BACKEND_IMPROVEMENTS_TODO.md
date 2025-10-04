# 📋 BACKEND IMPROVEMENTS TODO

Liste des améliorations à apporter au backend FadjMa. Les problèmes critiques ont été résolus, voici les actions restantes par ordre de priorité.

---

## 🔴 URGENT (Avant production - 1 mois)

### 5. ✅ Race Condition - Génération Matricules - **RÉSOLU**
**Statut:** ✅ CORRIGÉ
**Fichiers:**
- ✨ Créé: `utils/matriculeGenerator.js`
- ✏️ Modifié: `models/Prescription.js`
- ✏️ Modifié: `models/BaseUser.js`

**Solution implémentée:**
- ✅ Service centralisé avec `crypto.randomUUID()`
- ✅ Format: `PRX-YYYYMMDD-XXXXXXXX` (8 caractères UUID)
- ✅ Plus de race condition possible
- ✅ Méthodes pour PAT, PRX, ORD

**Code:**
```javascript
// utils/matriculeGenerator.js
const matriculeGenerator = require('../utils/matriculeGenerator');
prescription.matricule = matriculeGenerator.generatePrescription(issueDate);
```

---

### 6. ✅ N+1 Queries - DÉJÀ OPTIMISÉ
**Statut:** ✅ PAS DE MODIFICATION NÉCESSAIRE
**Localisation:** `controllers/accessController.js`

Le code utilise déjà l'eager loading avec `include`:
```javascript
const result = await MedicalRecordAccessRequest.findAndCountAll({
  where,
  include: [
    { model: BaseUser, as: 'requester', attributes: ['id', 'firstName', 'lastName'] },
    { model: BaseUser, as: 'patient', attributes: ['id', 'firstName', 'lastName'] },
    { model: BaseUser, as: 'reviewer', required: false }
  ]
});
```

---

### 7. ✅ Memory Leak - WebSocket - **RÉSOLU**
**Statut:** ✅ CORRIGÉ
**Fichier:** `websocket/socketHandlers.js`

**Améliorations implémentées:**
- ✅ Handlers nommés (pas de fonctions anonymes)
- ✅ `socket.removeListener()` pour chaque handler
- ✅ `socket.leaveAll()` on disconnect
- ✅ Cleanup explicite de `connectedUsers`

**Code:**
```javascript
const disconnectHandler = (reason) => {
  socket.removeListener('notification_read', notificationReadHandler);
  socket.removeListener('medical_record_viewed', medicalRecordViewedHandler);
  socket.removeListener('ping_test', pingTestHandler);
  connectedUsers.delete(socket.userId);
  socket.leaveAll();
};
```

---

### 8. ✅ Rate Limiting Amélioré - **RÉSOLU**
**Statut:** ✅ CORRIGÉ
**Fichier:** `middleware/prescriptionSecurity.js`

**Améliorations implémentées:**
- ✅ Clé combinée: `userId:IP` (évite contournement)
- ✅ Limites variables par rôle (Admin 200, Pharmacy 100, Autres 50)
- ✅ Plus de skip en développement
- ✅ Logging automatique des dépassements
- ✅ Header `retryAfter` dans réponse 429

**Code:**
```javascript
const matriculeSearchLimit = rateLimit({
  max: (req) => req.user?.role === 'pharmacy' ? 100 : 50,
  keyGenerator: (req) => `${req.user?.id || 'anonymous'}:${req.ip}`,
  skip: () => false, // Plus de bypass
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for user ${req.user?.id}`);
    res.status(429).json({ code: 'RATE_LIMIT_EXCEEDED', retryAfter: 900 });
  }
});
```

---

### 9. ✅ Validation Inputs Renforcée - **RÉSOLU**
**Statut:** ✅ CORRIGÉ
**Fichier créé:** `middleware/inputValidation.js`

**Fonctionnalités implémentées:**
- ✅ Validation avec `express-validator`
- ✅ Sanitization HTML avec `DOMPurify`
- ✅ Limites strictes (titre 200, description 5000, metadata 10KB)
- ✅ Max 20 médicaments par prescription
- ✅ Protection XSS automatique
- ✅ Validation UUID, matricules, pagination

**Utilisation:**
```javascript
const { validateCreateMedicalRecord } = require('../middleware/inputValidation');
router.post('/records', auth, validateCreateMedicalRecord, controller.create);
```

**À installer:**
```bash
npm install express-validator isomorphic-dompurify
```

**Exemple:**
```javascript
const { body, validationResult } = require('express-validator');
const createSanitize = require('dompurify');

// Validation middleware
[
  body('description').trim().escape().isLength({ max: 5000 }),
  body('metadata').isJSON().custom((value) => {
    if (JSON.stringify(value).length > 10000) {
      throw new Error('Metadata too large');
    }
    return true;
  })
]
```

---

### 10. ✅ Logs RGPD/HIPAA Compliant
**Problème:** Logs contiennent données médicales
**Localisation:** `utils/logger.js`, divers controllers
**Solution:**
- [ ] Hasher/pseudonymiser données sensibles dans logs
- [ ] Créer fonction `sanitizeLogData()`
- [ ] Séparer logs techniques vs logs audit
- [ ] Rotation et chiffrement logs sensibles

**Exemple:**
```javascript
const crypto = require('crypto');

function sanitizeLogData(data) {
  const sensitiveFields = ['medication', 'diagnosis', 'description'];
  const sanitized = { ...data };

  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      const hash = crypto.createHash('sha256')
        .update(sanitized[field])
        .digest('hex')
        .substring(0, 8);
      sanitized[field] = `***${hash}`;
    }
  });

  return sanitized;
}
```

---

## 🟠 IMPORTANT (Dans 1-2 mois)

### 11. ✅ Cache Redis
**Problème:** Surcharge DB pour données statiques
**Solution:**
- [ ] Installer Redis
- [ ] Cacher spécialités médicales (24h TTL)
- [ ] Cacher configurations système (1h TTL)
- [ ] Cacher résultats recherches fréquentes (5min TTL)

**Exemple:**
```javascript
const redis = require('redis');
const client = redis.createClient();

async function getSpecialties() {
  const cached = await client.get('specialties');
  if (cached) return JSON.parse(cached);

  const specialties = await Specialty.findAll();
  await client.setEx('specialties', 86400, JSON.stringify(specialties)); // 24h
  return specialties;
}
```

---

### 12. ✅ Pagination Optimisée
**Problème:** COUNT(*) lent sur grandes tables
**Localisation:** `controllers/recordController.js:100-109`
**Solution:**
- [ ] Cursor-based pagination au lieu d'offset
- [ ] Cacher count approximatif
- [ ] Utiliser EXPLAIN ANALYZE pour optimiser queries

**Exemple:**
```javascript
// Cursor-based pagination
const records = await MedicalRecord.findAll({
  where: {
    id: { [Op.gt]: cursor },
    ...otherFilters
  },
  limit: 20,
  order: [['id', 'ASC']]
});
```

---

### 13. ✅ Ancrage Hedera Parallèle
**Problème:** Ancrages séquentiels lents
**Localisation:** `controllers/recordController.js:388-414`
**Solution:**
- [x] Utiliser `Promise.all()` pour ancrage parallèle ✅ (Déjà implémenté)
- [ ] Limiter concurrence à 5 ancrages max simultanés
- [ ] Ajouter timeout global

**Note:** Déjà implémenté avec `Promise.allSettled()` dans la dernière version

---

### 14. ✅ Abstraction Blockchain
**Problème:** Couplage fort avec Hedera
**Localisation:** Tous les controllers utilisant hederaService
**Solution:**
- [ ] Créer interface `BlockchainProvider`
- [ ] Implémenter adaptateur Hedera
- [ ] Permettre switch vers autre blockchain sans refactoring

**Exemple:**
```javascript
// interfaces/BlockchainProvider.js
class BlockchainProvider {
  async anchor(data) { throw new Error('Not implemented'); }
  async verify(hash) { throw new Error('Not implemented'); }
}

// providers/HederaProvider.js
class HederaProvider extends BlockchainProvider {
  async anchor(data) { /* implémentation Hedera */ }
}

// Usage
const blockchain = new HederaProvider();
await blockchain.anchor(record);
```

---

### 15. ✅ Configuration Centralisée
**Problème:** Variables env dispersées
**Solution:**
- [ ] Créer `config/index.js` centralisé
- [ ] Valider config au démarrage avec Joi/Yup
- [ ] Typer avec TypeScript ou JSDoc

**Exemple:**
```javascript
const Joi = require('joi');

const configSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production').required(),
  PORT: Joi.number().default(5000),
  DATABASE_URL: Joi.string().required(),
  HEDERA_ACCOUNT_ID: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required()
});

const { error, value } = configSchema.validate(process.env);
if (error) throw new Error(`Config validation error: ${error.message}`);

module.exports = value;
```

---

### 16. ✅ Monitoring & Alertes
**Problème:** Métriques collectées mais non exploitées
**Localisation:** `services/monitoringService.js`
**Solution:**
- [ ] Intégrer Prometheus pour export métriques
- [ ] Créer dashboard Grafana
- [ ] Configurer alertes (ex: taux erreur Hedera > 10%)
- [ ] Ajouter healthcheck endpoint détaillé

**Exemple:**
```javascript
const promClient = require('prom-client');

const hederaErrorCounter = new promClient.Counter({
  name: 'hedera_errors_total',
  help: 'Total Hedera anchoring errors'
});

// Dans hederaService
hederaErrorCounter.inc();
```

---

## 🟡 AMÉLIORATION (Dans 3-6 mois)

### 17. ✅ Refactoring Duplication Code
**Problème:** Génération matricule dupliquée 5+ fois
**Solution:**
- [ ] Créer service `matriculeGenerator.js`
- [ ] Méthode unique `generate(prefix, date?)`
- [ ] Tests unitaires complets

---

### 18. ✅ Tests Unitaires & Intégration
**Problème:** 13k lignes non testées
**Solution:**
- [ ] Tests unitaires pour services (hederaService, hashService)
- [ ] Tests intégration pour controllers
- [ ] Tests E2E pour flux critiques (prescription → ancrage → délivrance)
- [ ] Viser >70% coverage

**Exemple structure:**
```
tests/
├── unit/
│   ├── services/
│   │   ├── hederaService.test.js
│   │   └── hashService.test.js
│   └── utils/
│       └── logger.test.js
├── integration/
│   ├── controllers/
│   │   ├── recordController.test.js
│   │   └── pharmacyController.test.js
└── e2e/
    └── prescription-flow.test.js
```

---

### 19. ✅ Remplacer console.log par Logger
**Problème:** console.log en production
**Localisation:** Tous les fichiers
**Solution:**
- [ ] Rechercher tous les `console.log`
- [ ] Remplacer par `logger.info()` / `logger.error()`
- [ ] Ajouter ESLint rule: `no-console`

---

### 20. ✅ Documentation API (OpenAPI)
**Solution:**
- [ ] Générer spec OpenAPI/Swagger
- [ ] Documenter tous les endpoints
- [ ] Ajouter exemples requêtes/réponses
- [ ] Swagger UI pour tests interactifs

---

### 21. ✅ Migration TypeScript (optionnel)
**Avantages:**
- Typage fort
- Meilleure IDE support
- Moins d'erreurs runtime

**Effort:** Élevé (2-3 mois)

---

## 📊 MÉTRIQUES DE SUCCÈS

**Objectifs post-améliorations:**

| Métrique | Actuel | Cible |
|----------|--------|-------|
| Temps réponse API (p95) | ~500ms | <200ms |
| Taux erreur Hedera | ~5% | <1% |
| Test coverage | 0% | >70% |
| Vulnérabilités sécurité | ? | 0 critique |
| Disponibilité | ~95% | >99.5% |

---

## 🔧 OUTILS RECOMMANDÉS

**À installer:**
- [x] PostgreSQL (production DB) ✅
- [ ] Redis (cache)
- [ ] Prometheus + Grafana (monitoring)
- [ ] Jest + Supertest (tests)
- [ ] ESLint + Prettier (qualité code)
- [ ] Husky (git hooks)
- [ ] Sentry (error tracking)

---

## 📅 PLANNING SUGGÉRÉ

**Mois 1 (Urgent):**
- Semaine 1-2: Points 5-7 (race condition, N+1, memory leak)
- Semaine 3: Point 8 (rate limiting)
- Semaine 4: Points 9-10 (validation, logs RGPD)

**Mois 2 (Important):**
- Semaine 1-2: Point 11 (Redis cache)
- Semaine 3: Points 12-13 (pagination, ancrage parallèle)
- Semaine 4: Points 14-16 (abstraction blockchain, config, monitoring)

**Mois 3-6 (Améliorations):**
- Points 17-21 selon priorités métier
- Documentation complète
- Formation équipe

---

## ✅ PROBLÈMES CRITIQUES RÉSOLUS

### 1. ✅ Migration PostgreSQL
**Statut:** RÉSOLU
**Fichier:** `src/config/database.js`
- Support PostgreSQL + SQLite
- Configuration via `DATABASE_URL` ou variables individuelles
- Warning si SQLite en production

### 2. ✅ Gestion Erreurs Hedera avec Queue
**Statut:** RÉSOLU
**Fichiers:**
- `src/services/hederaQueueService.js` (nouveau)
- `src/controllers/recordController.js` (modifié)
- Retry automatique avec backoff exponentiel
- Queue persistante en mémoire (TODO: Redis pour production)
- Alertes admin en cas d'échec définitif

### 3. ✅ Sécurisation Clés Hedera via KMS
**Statut:** RÉSOLU
**Fichiers:**
- `src/config/kmsConfig.js` (nouveau)
- `src/config/hedera.js` (modifié)
- `server.js` (modifié)
- Support AWS KMS, GCP KMS, HashiCorp Vault
- Fallback env vars pour développement
- Audit logging utilisation clés

### 4. ✅ Transactions Distribuées Prescriptions
**Statut:** RÉSOLU
**Fichier:** `src/controllers/recordController.js`
- Transaction Sequelize pour atomicité DB
- Ancrage Hedera parallèle avec `Promise.allSettled()`
- Rollback automatique en cas d'erreur
- Queue fallback pour échecs ancrage

---

## 📝 NOTES IMPORTANTES

- **PostgreSQL:** Ajouter `pg` au package.json: `npm install pg`
- **Redis:** Pour production, migrer queue en mémoire vers Redis
- **KMS:** Configurer selon cloud provider (AWS/GCP/Vault)
- **Tests:** Prioritaire avant déploiement production
- **Monitoring:** Dashboard Grafana disponible sur demande

---

**Dernière mise à jour:** 2025-01-04
**Mainteneur:** Équipe Backend FadjMa
