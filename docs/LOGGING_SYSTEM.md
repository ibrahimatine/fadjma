# 📋 Système de Logging FADJMA

## Vue d'ensemble

Le système de logging FADJMA fournit une traçabilité complète de toutes les activités du système avec trois fichiers de logs distincts :

- **`client-actions.log`** : Actions des utilisateurs
- **`server-internal.log`** : Opérations internes du serveur
- **`errors.log`** : Erreurs et exceptions
- **`combined.log`** : Logs généraux combinés

## 📁 Structure des fichiers

```
backend/logs/
├── client-actions.log     # Actions utilisateurs (connexions, consultations, etc.)
├── server-internal.log    # Opérations serveur (Hedera, BDD, vérifications)
├── errors.log            # Erreurs et exceptions
└── combined.log          # Logs généraux (info, warn, debug)
```

## 🔧 Configuration

### Rotation automatique des logs
- **Taille max** : 10MB par fichier
- **Fichiers conservés** : 5 versions
- **Format** : JSON structuré avec timestamps

### Variables d'environnement
```bash
LOG_LEVEL=info          # Niveau de log (debug, info, warn, error)
NODE_ENV=development    # Mode console activé en développement
```

## 📝 Types de logs

### 1. Actions Client (`client-actions.log`)

**Authentification :**
```javascript
logger.logAuthentication('login', {
  userId: 'user-123',
  userRole: 'doctor',
  ip: '192.168.1.100',
  statusCode: 200,
  responseTime: 450
});
```

**Accès aux ressources :**
```javascript
logger.logResourceAccess('medical_record', 'record-456', 'view', {
  userId: 'user-123',
  method: 'GET',
  url: '/api/records/456'
});
```

### 2. Actions Serveur (`server-internal.log`)

**Transactions Hedera :**
```javascript
logger.logHederaTransaction('anchor', {
  recordId: 'record-456',
  transactionId: '0.0.6854064@1634567890.123456789',
  duration: 3200,
  success: true
});
```

**Opérations BDD :**
```javascript
logger.logDatabaseOperation('create', 'medical_records', {
  recordId: 'record-789',
  duration: 45,
  success: true
});
```

**Vérifications d'intégrité :**
```javascript
logger.logIntegrityCheck('hash', { isValid: true }, {
  recordId: 'record-456',
  expectedHash: 'abc123'
});
```

### 3. Gestion des erreurs (`errors.log`)

**Erreurs générales :**
```javascript
logger.logError(error, {
  service: 'HEDERA',
  action: 'SUBMIT_MESSAGE',
  userId: 'user-123'
});
```

**Erreurs spécialisées :**
```javascript
logger.logHederaError(error, { action: 'ANCHOR_RECORD' });
logger.logDatabaseError(error, { action: 'CREATE_RECORD' });
logger.logAuthError(error, { action: 'LOGIN_ATTEMPT' });
```

## 🌐 API REST pour consulter les logs

### Endpoints disponibles (Admin seulement)

**Statistiques des logs :**
```http
GET /api/logs/stats
```

**Consulter par type :**
```http
GET /api/logs/client?lines=100&search=user-123
GET /api/logs/server?lines=50
GET /api/logs/errors?lines=25
```

**Actions client filtrées :**
```http
GET /api/logs/client/actions?userId=user-123&action=LOGIN&dateFrom=2025-09-01
```

**Opérations serveur filtrées :**
```http
GET /api/logs/server/operations?service=HEDERA&success=true
```

**Erreurs récentes :**
```http
GET /api/logs/errors/recent?service=HEDERA&severity=critical
```

## 🔄 Middleware automatique

Le middleware `requestLogger` capture automatiquement :

### Données de requête
- **Méthode HTTP** et URL
- **IP client** et User-Agent
- **Utilisateur** (ID, rôle)
- **Corps de requête** (sanitisé)
- **Paramètres** et query strings

### Données de réponse
- **Code de statut**
- **Temps de réponse**
- **Corps de réponse** (métadonnées seulement)

### Sécurité et confidentialité
- **Champs sensibles masqués** : passwords, tokens, clés
- **Limitation de taille** : évite les logs volumineux
- **Sanitisation automatique** des données

## 📊 Format des logs

### Structure JSON standard
```json
{
  "timestamp": "2025-09-27 07:09:21.033",
  "level": "INFO",
  "message": "User user-123 performed AUTH_LOGIN",
  "userId": "user-123",
  "userRole": "doctor",
  "ip": "192.168.1.100",
  "method": "POST",
  "url": "/api/auth/login",
  "statusCode": 200,
  "responseTime": 450,
  "action": "AUTH_LOGIN",
  "service": "AUTHENTICATION"
}
```

### Actions détectées automatiquement

**Authentification :**
- `LOGIN`, `REGISTER`, `LOGOUT`, `TOKEN_REFRESH`

**Dossiers médicaux :**
- `CREATE_MEDICAL_RECORD`, `VIEW_MEDICAL_RECORD`, `UPDATE_MEDICAL_RECORD`

**Prescriptions :**
- `CREATE_PRESCRIPTION`, `VIEW_PRESCRIPTION`, `DISPENSE_MEDICATION`

**Vérifications :**
- `VERIFY_HCS_STATUS`, `VERIFY_RECORD`, `VIEW_TOPIC_STATS`

**Administration :**
- `ADMIN_REGISTRY_ACCESS`, `ADMIN_MONITORING_ACCESS`, `ADMIN_EXPORT_DATA`

## 🛠️ Utilisation programmatique

### Import du logger
```javascript
const logger = require('./src/utils/logger');
```

### Méthodes principales
```javascript
// Actions client
logger.logClientAction(action, details);
logger.logAuthentication(type, details);
logger.logResourceAccess(resourceType, resourceId, operation, details);

// Actions serveur
logger.logServerAction(service, action, details);
logger.logHederaTransaction(type, details);
logger.logDatabaseOperation(operation, table, details);
logger.logIntegrityCheck(type, result, details);

// Gestion d'erreurs
logger.logError(error, context);
logger.logHederaError(error, context);
logger.logDatabaseError(error, context);
logger.logAuthError(error, context);

// Logs généraux
logger.info(message, meta);
logger.warn(message, meta);
logger.debug(message, meta);
```

### Utilitaires
```javascript
// Statistiques des fichiers
const stats = await logger.getLogStats();

// Lecture des logs
const logs = await logger.readLogFile('client', 100);
```

## 🚀 Intégration dans l'application

### 1. Middleware automatique
Le middleware `requestLogger` est automatiquement appliqué à toutes les routes.

### 2. Services internes
Les services Hedera, base de données, et autres sont instrumentés pour logger leurs opérations.

### 3. Gestion d'erreurs
Toutes les erreurs sont automatiquement loggées avec leur contexte.

## 📈 Monitoring et alertes

### Métriques surveillées
- **Taux d'erreur** par service
- **Temps de réponse** des opérations
- **Activité utilisateur** par rôle
- **Statut des transactions** Hedera

### Alertes automatiques
Le système de monitoring peut déclencher des alertes basées sur :
- Nombre d'erreurs par période
- Échecs de transactions Hedera
- Temps de réponse anormaux

## 🔐 Sécurité et conformité

### Protection des données
- **Masquage automatique** des données sensibles
- **Chiffrement en transit** (si HTTPS activé)
- **Accès restreint** aux logs (admin seulement)

### Rétention des données
- **Rotation automatique** après 10MB
- **Conservation** de 5 versions par fichier
- **Archivage** possible via cron jobs

### Audit trail
Chaque action est tracée avec :
- **Horodatage précis**
- **Identification utilisateur**
- **Contexte complet**
- **Résultat de l'opération**

Ce système de logging fournit une traçabilité complète et sécurisée de toutes les activités du système FADJMA, essentielle pour un système médical conforme aux exigences réglementaires.