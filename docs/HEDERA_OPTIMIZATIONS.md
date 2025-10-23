# Optimisations Hedera - Guide Complet

Ce document explique toutes les optimisations appliquées au système d'anchoring Hedera pour **réduire les coûts de 85-95%** tout en améliorant la scalabilité.

## 🎯 Vue d'ensemble

### Avant les optimisations
- ❌ Données complètes envoyées sur Hedera (~500-2000 bytes/message)
- ❌ 1 message = 1 transaction = 0.0001 HBAR
- ❌ Pas de rate limiting (risque de dépassement 10 TPS)
- ❌ Aucune compression
- ❌ Un seul topic pour tout

### Après les optimisations
- ✅ Hash uniquement (~200-300 bytes/message) - **70% d'économie**
- ✅ Compression gzip - **60-70% d'économie supplémentaire**
- ✅ Batch Merkle Tree - **90% d'économie de messages**
- ✅ Rate limiter (8 TPS) - **Respect des limites**
- ✅ Multi-topics - **Meilleure organisation**

### Économie totale estimée: **85-95%**

---

## 📦 1. Compression Service

### Description
Compresse les messages JSON avec gzip avant de les envoyer sur Hedera.

### Configuration (.env)
```bash
HEDERA_COMPRESSION_ENABLED=true          # Activer/désactiver
HEDERA_MIN_COMPRESSION_SIZE=100          # Taille minimum (bytes)
```

### Utilisation

```javascript
const compressionService = require('./src/services/compressionService');

// Compresser
const result = await compressionService.compress(data);
console.log('Ratio:', result.ratio);
console.log('Économie:', ((1 - 1/result.ratio) * 100).toFixed(1) + '%');

// Décompresser
const original = await compressionService.decompress(result.data);
```

### Statistiques
```javascript
const stats = compressionService.getStats();
// { enabled: true, minSizeForCompression: 100 }

// Estimer les économies
const savings = await compressionService.estimateSavings(sampleData, 1000);
console.log('Économie pour 1000 messages:', savings.savingsPercent);
```

---

## 🌳 2. Merkle Tree & Batch Anchoring

### Description
Groupe plusieurs anchorings en un seul message via un arbre de Merkle. Permet de prouver l'appartenance d'un item au batch sans révéler les autres.

### Configuration (.env)
```bash
HEDERA_USE_BATCHING=true                 # Activer/désactiver
HEDERA_MAX_BATCH_SIZE=50                 # Taille max du batch
HEDERA_MIN_BATCH_SIZE=10                 # Taille min du batch
HEDERA_BATCH_TIMEOUT_MS=300000           # Timeout (5 min)
```

### Fonctionnement

```
┌─────────────────────────────────────────────┐
│ 50 prescriptions individuelles              │
│ Sans batching: 50 messages = 0.005 HBAR    │
└─────────────────┬───────────────────────────┘
                  ↓
┌─────────────────────────────────────────────┐
│ Batch Aggregator collecte les items        │
│ - Attend 50 items OU 5 minutes             │
└─────────────────┬───────────────────────────┘
                  ↓
┌─────────────────────────────────────────────┐
│ Merkle Tree créé                            │
│ - Root hash représente tout le batch       │
│ - Chaque item a une preuve Merkle          │
└─────────────────┬───────────────────────────┘
                  ↓
┌─────────────────────────────────────────────┐
│ 1 seul message sur Hedera = 0.0001 HBAR    │
│ Économie: 98% (0.0049 HBAR)                │
└─────────────────────────────────────────────┘
```

### Utilisation

#### Automatique (recommandé)
```javascript
const hederaService = require('./src/services/hederaService');

// Ancrer une prescription - sera automatiquement batché
await hederaService.anchorPrescription(prescription, 'CREATED');
// → Retourne { success: true, batched: true, batchSize: 15 }
```

#### Manuel
```javascript
const batchAggregatorService = require('./src/services/batchAggregatorService');

// Ajouter au batch
await batchAggregatorService.addToBatch('PRESCRIPTION', prescriptionData);

// Forcer le traitement d'un batch
await batchAggregatorService.flush('PRESCRIPTION');

// Forcer tous les batches
await batchAggregatorService.flushAll();
```

### Vérification d'un item batché

```javascript
const merkleTreeService = require('./src/services/merkleTreeService');

// Vérifier qu'un item fait partie du batch
const isValid = merkleTreeService.verifyItemInBatch(
  itemHash,
  merkleProof,
  merkleRoot
);

console.log('Item dans le batch:', isValid);
```

### Événements

```javascript
batchAggregatorService.on('batch-ready', async (batchData) => {
  console.log('Batch prêt:', batchData.batch.metadata.batchId);
  console.log('Items:', batchData.batch.metadata.itemCount);
  // Le batch est automatiquement ancré par hederaService
});
```

---

## ⏱️ 3. Rate Limiter

### Description
Respecte la limite de 10 TPS de Hedera en utilisant 8 TPS par sécurité. Queue automatique si limite atteinte.

### Configuration (.env)
```bash
HEDERA_MAX_TPS=8                         # Max transactions/seconde
HEDERA_RATE_LIMITER_ENABLED=true         # Activer/désactiver
```

### Utilisation

#### Automatique (recommandé)
Tous les appels Hedera passent automatiquement par le rate limiter.

#### Manuel
```javascript
const rateLimiterService = require('./src/services/rateLimiterService');

// Exécuter une fonction avec rate limiting
const result = await rateLimiterService.execute(async () => {
  return await hederaClient.submitMessage(message);
});

console.log('Wait time:', result.waitTime, 'ms');
```

### Monitoring

```javascript
const stats = rateLimiterService.getStats();

console.log('Total requêtes:', stats.totalRequests);
console.log('Requêtes throttled:', stats.throttledRequests);
console.log('Taux de throttling:', stats.throttleRate);
console.log('Temps d\'attente moyen:', stats.avgWaitTime, 'ms');
console.log('TPS actuel:', stats.currentTPS);
console.log('Queue:', stats.queueSize);
```

---

## 🎯 4. Multi-Topics

### Description
Sépare les données par domaine métier pour une meilleure organisation et des requêtes Mirror Node plus rapides.

### Configuration (.env)
```bash
HEDERA_TOPIC_PRESCRIPTIONS=0.0.7070750   # Topic prescriptions
HEDERA_TOPIC_RECORDS=0.0.7070750         # Topic dossiers médicaux
HEDERA_TOPIC_DELIVERIES=0.0.7070750      # Topic délivrances
HEDERA_TOPIC_ACCESS=0.0.7070750          # Topic logs d'accès
HEDERA_TOPIC_BATCH=0.0.7070750           # Topic batches Merkle
```

### Utilisation

```javascript
const hederaClient = require('./src/config/hedera');

// Envoyer à un topic spécifique
await hederaClient.submitMessage(message, 'PRESCRIPTION');
await hederaClient.submitMessage(message, 'MEDICAL_RECORD');
await hederaClient.submitMessage(message, 'BATCH');

// Obtenir un topic ID
const topicId = hederaClient.getTopicId('PRESCRIPTION');

// Lister tous les topics
const topics = hederaClient.getTopics();
```

---

## 🔐 5. Hash-Only Anchoring

### Description
**CHANGEMENT MAJEUR**: Au lieu d'envoyer toutes les données médicales sur Hedera, on envoie uniquement le hash. Les données complètes restent en base de données PostgreSQL.

### Avantages
- ✅ **Confidentialité**: Aucune donnée médicale sur la blockchain publique
- ✅ **Économie**: Messages 70% plus petits
- ✅ **Sécurité**: Les données sensibles restent en DB protégée
- ✅ **Intégrité**: Le hash prouve que les données n'ont pas été modifiées

### Fonctionnement

```
┌─────────────────────────────────────────────┐
│ Données complètes (en DB PostgreSQL)        │
│ {                                           │
│   matricule: "RX-2025-0001",               │
│   medication: "Paracétamol",               │
│   dosage: "500mg",                         │
│   quantity: 30,                            │
│   patientId: 12345,                        │
│   doctorId: 67890,                         │
│   instructions: "Prendre après repas"      │
│ }                                           │
└─────────────────┬───────────────────────────┘
                  ↓
        hashService.generateDataHash()
                  ↓
┌─────────────────────────────────────────────┐
│ Hash SHA-256                                │
│ 6b86b273ff34fce19d6b804eff5a3f5747ada4eaa │
│ 22f1d49c01e52ddb7875b4b                    │
└─────────────────┬───────────────────────────┘
                  ↓
┌─────────────────────────────────────────────┐
│ Message Hedera (minimal)                    │
│ {                                           │
│   hash: "6b86b273ff34fce...",              │
│   prescriptionId: "123",                   │
│   matricule: "RX-2025-0001",               │
│   type: "PRESCRIPTION",                    │
│   timestamp: "2025-01-17...",              │
│   version: "3.0"                           │
│ }                                           │
└─────────────────┬───────────────────────────┘
                  ↓
        Compression gzip (optionnel)
                  ↓
┌─────────────────────────────────────────────┐
│ Hedera Consensus Service                    │
│ Topic: 0.0.7070750                         │
└─────────────────────────────────────────────┘
```

### Vérification

```javascript
// Lire les données de la DB
const prescription = await Prescription.findByPk(123);

// Régénérer le hash à partir des données actuelles
const currentHash = hashService.generateDataHash({
  matricule: prescription.matricule,
  medication: prescription.medication,
  dosage: prescription.dosage,
  // ... toutes les données
});

// Comparer avec le hash ancré
const isValid = currentHash === prescription.hash;

// Vérifier sur Hedera
const hcsVerification = await mirrorNodeService.verifyTopicMessage(
  prescription.hederaTopicId,
  prescription.hederaSequenceNumber
);

console.log('Hash local valide:', isValid);
console.log('Hash sur Hedera valide:', hcsVerification.isVerified);
```

---

## 📊 6. Modèle HederaTransaction

### Description
Nouveau modèle de base de données pour historiser toutes les transactions Hedera.

### Schéma

```javascript
{
  // Identification
  id: INTEGER,
  type: ENUM('PRESCRIPTION', 'MEDICAL_RECORD', 'PRESCRIPTION_DELIVERY', 'ACCESS_LOG', 'BATCH'),
  entityType: STRING,     // 'Prescription', 'MedicalRecord', etc.
  entityId: INTEGER,      // ID dans la table respective

  // Hash
  hash: STRING(64),       // Hash SHA-256

  // Hedera
  hederaTransactionId: STRING,
  hederaTopicId: STRING,
  hederaSequenceNumber: STRING,
  hederaConsensusTimestamp: STRING,

  // Batch (si applicable)
  isBatch: BOOLEAN,
  batchId: STRING,
  merkleRoot: STRING(64),
  merkleProof: JSON,
  merkleIndex: INTEGER,

  // Performance
  compressed: BOOLEAN,
  messageSize: INTEGER,
  compressionRatio: FLOAT,
  responseTime: INTEGER,
  attempts: INTEGER,
  rateLimitWaitTime: INTEGER,

  // Statut
  status: ENUM('SUCCESS', 'FAILED', 'PENDING'),
  error: TEXT,
  estimatedCost: DECIMAL,

  // Vérification
  verified: BOOLEAN,
  verifiedAt: DATE,

  // Métadonnées
  metadata: JSON
}
```

### Utilisation

```javascript
const HederaTransaction = require('./src/models/HederaTransaction');

// Créer pour un anchoring direct
await HederaTransaction.createForAnchor({
  type: 'PRESCRIPTION',
  entityType: 'Prescription',
  entityId: prescription.id,
  hash: hash,
  transactionId: result.transactionId,
  topicId: result.topicId,
  sequenceNumber: result.sequenceNumber,
  consensusTimestamp: result.consensusTimestamp,
  compressed: true,
  messageSize: 250,
  compressionRatio: 2.5
});

// Créer pour un batch
await HederaTransaction.createForBatch(batchData, items);

// Rechercher par hash
const tx = await HederaTransaction.findByHash(hash);

// Rechercher par entité
const txs = await HederaTransaction.findByEntity('Prescription', 123);

// Statistiques
const stats = await HederaTransaction.getStats(startDate, endDate);
console.log('Total transactions:', stats.totalTransactions);
console.log('Coût total:', stats.totalCost, 'HBAR');
console.log('Temps de réponse moyen:', stats.avgResponseTime, 'ms');
```

---

## 🧪 Tests

### Lancer tous les tests
```bash
cd backend
node test-hedera-optimizations.js
```

### Tests disponibles

1. **Compression Service**
   - Compression/décompression
   - Intégrité des données
   - Calcul des économies

2. **Merkle Tree Service**
   - Création d'arbre
   - Génération de preuves
   - Vérification de preuves
   - Calcul des économies

3. **Rate Limiter Service**
   - Respect des limites TPS
   - Queue automatique
   - Statistiques

4. **Batch Aggregator Service**
   - Agrégation d'items
   - Déclenchement automatique
   - Flush manuel

5. **Multi-Topics**
   - Configuration
   - Sélection du bon topic

6. **Hash-Only Anchoring**
   - Génération de hash
   - Réduction de taille
   - Vérification

---

## 📈 Monitoring & Statistiques

### Dashboard de monitoring

```javascript
// Compression
const compressionStats = compressionService.getStats();

// Batching
const batchStats = batchAggregatorService.getStats();
console.log('Batches créés:', batchStats.batchesCreated);
console.log('Économies totales:', batchStats.totalSavings, 'HBAR');

// Rate Limiter
const rateLimitStats = rateLimiterService.getStats();
console.log('TPS actuel:', rateLimitStats.currentTPS);
console.log('Taux de throttling:', rateLimitStats.throttleRate);

// Hedera Transactions
const hederaStats = await HederaTransaction.getStats();
console.log('Total transactions:', hederaStats.totalTransactions);
console.log('Coût total:', hederaStats.totalCost, 'HBAR');
console.log('Taux de succès:',
  (hederaStats.successCount / hederaStats.totalTransactions * 100).toFixed(1) + '%'
);
```

---

## 🚀 Migration

### Étapes pour activer les optimisations

1. **Ajouter les variables d'environnement**
   ```bash
   # .env
   HEDERA_USE_BATCHING=true
   HEDERA_USE_COMPRESSION=true
   HEDERA_MAX_BATCH_SIZE=50
   HEDERA_MAX_TPS=8
   ```

2. **Créer la table HederaTransaction**
   ```bash
   npm run migrate
   ```

3. **Tester les optimisations**
   ```bash
   node test-hedera-optimizations.js
   ```

4. **Déployer progressivement**
   - Activer d'abord la compression
   - Puis le rate limiter
   - Enfin le batching

---

## 💰 Calcul des économies

### Exemple concret

#### Sans optimisations
- 1000 prescriptions/jour
- 1 message par prescription
- Taille moyenne: 1500 bytes/message
- Coût: 1000 × 0.0001 HBAR = **0.1 HBAR/jour**
- **~3 HBAR/mois** (~$0.15 @ $0.05/HBAR)

#### Avec toutes les optimisations
- 1000 prescriptions/jour
- Hash-only: 1500 → 300 bytes (-80%)
- Compression: 300 → 100 bytes (-67%)
- Batching: 1000 messages → 20 batches (-98%)
- Coût: 20 × 0.0001 HBAR = **0.002 HBAR/jour**
- **~0.06 HBAR/mois** (~$0.003 @ $0.05/HBAR)

#### Économie totale: **98%** (2.94 HBAR/mois)

---

## ⚠️ Considérations importantes

### Batching
- **Latence**: Les items peuvent attendre jusqu'à 5 minutes avant d'être ancrés
- **Solution**: Désactiver le batching pour les cas urgents
  ```javascript
  // .env
  HEDERA_USE_BATCHING=false  // Pour cas urgents uniquement
  ```

### Compression
- **Overhead**: Compression/décompression prend ~1-5ms
- **Désactivation**: Pour messages < 100 bytes, pas de compression

### Rate Limiter
- **Queue**: En cas de pic de trafic, requêtes mises en queue
- **Monitoring**: Surveiller `rateLimitWaitTime` dans HederaTransaction

---

## 📚 Références

- [Hedera Documentation](https://docs.hedera.com/)
- [HCS (Consensus Service)](https://docs.hedera.com/guides/core-concepts/consensus-service)
- [Mirror Node API](https://docs.hedera.com/guides/testnet/mirror-nodes)
- [Merkle Trees](https://en.wikipedia.org/wiki/Merkle_tree)

---

## 🆘 Support

Pour toute question ou problème :
1. Consulter les logs: `backend/logs/`
2. Vérifier les statistiques: `HederaTransaction.getStats()`
3. Tester: `node test-hedera-optimizations.js`
