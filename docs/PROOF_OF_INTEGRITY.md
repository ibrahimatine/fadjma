# 🔐 Proof of Integrity - FADJMA

Guide complet du système de preuve d'intégrité basé sur Hedera Hashgraph

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Hash-Only Anchoring](#hash-only-anchoring)
4. [Batch Anchoring avec Merkle Tree](#batch-anchoring-avec-merkle-tree)
5. [Workflow de vérification](#workflow-de-vérification)
6. [Interface utilisateur](#interface-utilisateur)
7. [Garanties cryptographiques](#garanties-cryptographiques)
8. [FAQ](#faq)

---

## 🎯 Vue d'ensemble

### Qu'est-ce que le Proof of Integrity ?

Le **Proof of Integrity** (Preuve d'Intégrité) est un système qui permet de **prouver qu'une donnée n'a pas été modifiée** depuis sa création, en utilisant la blockchain Hedera.

### Comment ça fonctionne ?

```
┌─────────────────────────────────────────────┐
│  DONNÉES MÉDICALES (dans votre DB)          │
│  - Prescription: Paracétamol 500mg          │
│  - Patient: Jean Dupont                     │
│  - Médecin: Dr. Martin                      │
└────────────────┬────────────────────────────┘
                 ↓
         [HASH SHA-256]
                 ↓
      6b86b273ff34fce19d6b...
                 ↓
    ┌────────────────────────┐
    │  HEDERA BLOCKCHAIN     │
    │  - Hash ancré          │
    │  - Timestamp immutable │
    │  - Public & Vérifiable │
    └────────────────────────┘
```

**Principe** :
- ✅ Vos données **restent privées** dans votre base de données
- ✅ Seul le **hash** (empreinte cryptographique) est public
- ✅ **Impossible de retrouver** les données à partir du hash
- ✅ **Toute modification** des données change le hash

---

## 🏗️ Architecture

### Version 3.0 - Hash Only + Optimisations

```
APPLICATION FADJMA
       ↓
[1. Création données]
       ↓
[2. Hash SHA-256] ← Transformation irréversible
       ↓
[3. Stockage DB] → Données complètes + Hash
       ↓
    ┌──────────────┬──────────────┐
    ↓              ↓              ↓
DIRECT         BATCHING      COMPRESSION
(temps réel)   (économique)  (automatique)
    ↓              ↓              ↓
    └──────────────┴──────────────┘
                   ↓
           [HEDERA TESTNET]
         Topic 0.0.7070750
                   ↓
         [CONSENSUS BFT]
         Timestamp immuable
                   ↓
        [MIRROR NODE API]
      Vérification publique
```

### Composants principaux

| Composant | Rôle | Fichier |
|-----------|------|---------|
| **hashService** | Génération SHA-256 | `backend/src/services/hashService.js` |
| **compressionService** | Compression gzip | `backend/src/services/compressionService.js` |
| **merkleTreeService** | Arbres de Merkle | `backend/src/services/merkleTreeService.js` |
| **batchAggregatorService** | Agrégation | `backend/src/services/batchAggregatorService.js` |
| **rateLimiterService** | Limite 8 TPS | `backend/src/services/rateLimiterService.js` |
| **hederaService** | Anchoring | `backend/src/services/hederaService.js` |
| **mirrorNodeService** | Vérification | `backend/src/services/mirrorNodeService.js` |

---

## 🔐 Hash-Only Anchoring

### Pourquoi Hash-Only ?

#### ❌ Avant (Version 2.0)
```json
// Message envoyé sur Hedera (PUBLIC)
{
  "prescriptionId": 123,
  "matricule": "RX-2025-0001",
  "medication": "Paracétamol",      // ← VISIBLE PAR TOUS
  "dosage": "500mg",                // ← VISIBLE PAR TOUS
  "quantity": 30,                   // ← VISIBLE PAR TOUS
  "patientId": 12345,               // ← VISIBLE PAR TOUS
  "doctorId": 67890,                // ← VISIBLE PAR TOUS
  "instructions": "Après repas"     // ← VISIBLE PAR TOUS
}
```
**Problème** : Données médicales sensibles sur blockchain publique ❌

#### ✅ Maintenant (Version 3.0)
```json
// Message envoyé sur Hedera (PUBLIC)
{
  "hash": "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa...",
  "prescriptionId": 123,
  "matricule": "RX-2025-0001",
  "type": "PRESCRIPTION",
  "timestamp": "2025-01-17T10:30:00Z",
  "version": "3.0"
}
```
**Avantage** : Aucune donnée médicale révélée ✅

### Comment le hash est généré ?

```javascript
// 1. Collecte des données critiques
const prescriptionData = {
  matricule: "RX-2025-0001",
  medication: "Paracétamol",
  dosage: "500mg",
  quantity: 30,
  instructions: "Prendre après repas",
  patientId: 12345,
  doctorId: 67890,
  actionType: "CREATED"
};

// 2. Tri alphabétique des clés (pour déterminisme)
// cleanData = {
//   actionType: "CREATED",
//   dosage: "500mg",
//   doctorId: 67890,
//   instructions: "Prendre après repas",
//   matricule: "RX-2025-0001",
//   medication: "Paracétamol",
//   patientId: 12345,
//   quantity: 30
// }

// 3. Hash SHA-256
const hash = crypto
  .createHash('sha256')
  .update(JSON.stringify(cleanData))
  .digest('hex');

// Résultat :
// "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b"
```

### Propriétés du SHA-256

| Propriété | Description | Exemple |
|-----------|-------------|---------|
| **Déterministe** | Mêmes données → même hash | `"Paracétamol"` → toujours `6b86...` |
| **Unique** | Données différentes → hash différent | `"Ibuprofène"` → `8d96...` |
| **Irréversible** | Impossible de retrouver les données | `6b86...` → ❌ `???` |
| **Rapide** | Calcul instantané | ~0.1ms |
| **Sécurisé** | Collision quasi-impossible | Probabilité: 2^-256 |

---

## 🌳 Batch Anchoring avec Merkle Tree

### Pourquoi le batching ?

**Sans batching** : 50 prescriptions = 50 messages = **0.005 HBAR** (0.25€)

**Avec batching** : 50 prescriptions = 1 message = **0.0001 HBAR** (0.005€)

**Économie** : **98%** 🎉

### Comment ça marche ?

#### Étape 1: Collecte des hashs

```
Batch en cours (max 50 items, timeout 5min):

Item 1: hash_1 = "6b86b273..."
Item 2: hash_2 = "8d969eef..."
Item 3: hash_3 = "e7f6c011..."
...
Item 50: hash_50 = "1c38c5ec..."
```

#### Étape 2: Construction du Merkle Tree

```
                    ROOT HASH
                  (ancré sur Hedera)
                  /              \
             H(1,2,3,4)        H(5,6,7,8)
             /        \        /        \
          H(1,2)    H(3,4)  H(5,6)    H(7,8)
          /  \      /  \    /  \      /  \
        H1  H2    H3  H4  H5  H6    H7  H8
        ↓   ↓     ↓   ↓   ↓   ↓     ↓   ↓
      Item1 Item2 Item3 ... ... ... Item50
```

#### Étape 3: Génération des preuves Merkle

Pour **prouver** que Item3 fait partie du batch sans révéler les autres :

```
Preuve Merkle pour Item 3:
[
  { hash: "H4", position: "right" },  // Sibling de H3
  { hash: "H(1,2)", position: "left" }, // Sibling de H(3,4)
  { hash: "H(5,6,7,8)", position: "right" } // Sibling de H(1,2,3,4)
]

Vérification:
1. H(3,4) = combine(H3, H4)
2. H(1,2,3,4) = combine(H(1,2), H(3,4))
3. ROOT = combine(H(1,2,3,4), H(5,6,7,8))
✅ Si ROOT correspond → Item3 est dans le batch
```

#### Étape 4: Anchoring du ROOT

```json
// UN SEUL message pour 50 items !
{
  "batchId": "batch-1705491000-abc123",
  "merkleRoot": "a7f5c012ff87bce32d9a...",
  "itemCount": 50,
  "type": "BATCH",
  "batchType": "PRESCRIPTION",
  "timestamp": "2025-01-17T10:35:00Z",
  "version": "3.0"
}
```

### Vérification d'un item batché

```javascript
// 1. Récupérer la preuve Merkle de la DB
const hederaTx = await HederaTransaction.findOne({
  where: { entityType: 'Prescription', entityId: 123 }
});

const merkleProof = hederaTx.merkleProof;
// [
//   { hash: "...", position: "right" },
//   { hash: "...", position: "left" },
//   ...
// ]

// 2. Vérifier avec le root hash ancré sur Hedera
const batchMessage = await mirrorNodeService.verifyTopicMessage(
  hederaTx.hederaTopicId,
  hederaTx.hederaSequenceNumber
);

const merkleRootOnHedera = batchMessage.merkleRoot;

// 3. Validation de la preuve
const isValid = merkleTreeService.verifyProof(
  prescription.hash,      // Hash de l'item
  merkleProof,           // Preuve Merkle
  merkleRootOnHedera     // Root ancré sur Hedera
);

// ✅ Si isValid === true → Item fait partie du batch
```

---

## ✅ Workflow de vérification

### Scénario A: Prescription non modifiée

```
1. Utilisateur clique "Vérifier Proof of Integrity"
                     ↓
2. Récupérer prescription de la DB
   - Data: { medication: "Paracétamol", dosage: "500mg", ... }
   - Hash stocké: "6b86b273..."
                     ↓
3. VÉRIFICATION LOCALE
   - Régénérer hash avec les données actuelles
   - Hash actuel: "6b86b273..."
   - Comparaison: "6b86b273..." === "6b86b273..."
   - ✅ VALIDE (données non modifiées localement)
                     ↓
4. VÉRIFICATION HEDERA
   - Récupérer message du Mirror Node
   - Topic: 0.0.7070750, Sequence: 12345
   - Hash sur Hedera: "6b86b273..."
   - ✅ VALIDE (transaction confirmée sur Hedera)
                     ↓
5. VÉRIFICATION BATCH (si applicable)
   - Vérifier preuve Merkle
   - ✅ VALIDE (item fait partie du batch)
                     ↓
6. RÉSULTAT FINAL
   ✅ INTÉGRITÉ CONFIRMÉE
   - Données non modifiées
   - Horodatage immutable
   - Vérifiable publiquement
```

### Scénario B: Prescription modifiée (fraude détectée)

```
1. Utilisateur clique "Vérifier Proof of Integrity"
                     ↓
2. Récupérer prescription de la DB
   - Data: { medication: "Morphine", dosage: "10mg", ... }  ← MODIFIÉ
   - Hash stocké: "6b86b273..." (original)
                     ↓
3. VÉRIFICATION LOCALE
   - Régénérer hash avec les données actuelles
   - Hash actuel: "a8f9d621..." ← DIFFÉRENT !
   - Comparaison: "a8f9d621..." !== "6b86b273..."
   - ❌ INVALIDE (données modifiées)
                     ↓
4. ALERTE
   ⚠️ INTÉGRITÉ COMPROMISE
   - Les données ont été modifiées
   - Hash attendu: 6b86b273...
   - Hash actuel: a8f9d621...
   - Modification détectée !
```

---

## 🎨 Interface utilisateur

### Composant HashScanVerification

Affiche les informations de vérification avec :

#### Badges d'optimisation
```jsx
┌──────────┐ ┌───────────┐ ┌────────┐
│ Batché   │ │ Compressé │ │ -98%   │
└──────────┘ └───────────┘ └────────┘
```

#### Section Hash-Only
```
🔐 Confidentialité maximale - Hash Only

Seul le hash cryptographique est ancré sur Hedera.
Vos données médicales restent privées et sécurisées
dans votre base de données.

Hash SHA-256:
6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b
```

#### Section Batch (si applicable)
```
📦 Optimisation par batch (Merkle Tree)

Batch ID: batch-1705491000-abc123
Items: 50 enregistrements
Position: #15 / 50
Économie: ~98%

[Voir les détails de la preuve] ←
```

#### Statistiques d'optimisation
```
💰 Optimisations appliquées:

Taille originale: 1500 bytes    |  Taille finale: 300 bytes
Compression: Activée            |  Économie totale: 98%
```

#### Liens de vérification
```
[Voir Batch Hedera] [Message Spécifique] [Transaction]
        ↓                    ↓                  ↓
   HashScan.io        HashScan.io        HashScan.io
```

#### Instructions
```
💡 Comment fonctionne la vérification :

1. Le hash SHA-256 de vos données est calculé et ancré sur Hedera
2. Votre hash est inclus dans un batch via Merkle Tree pour économiser 98%
3. Le consensus Hedera (Byzantine Fault Tolerance) garantit l'immutabilité
4. Vérification publique possible via HashScan sans révéler vos données
5. Compression gzip appliquée pour réduire les coûts de ~60%
```

#### Garanties
```
✓ Immutable    ✓ Horodaté
✓ Infalsifiable ✓ Vérifiable
```

### Composant IntegrityButton

#### État initial
```
┌──────────────────────────────────────┐
│ 🛡️  Vérifier Proof of Integrity      │
└──────────────────────────────────────┘
```

#### Pendant la vérification
```
┌──────────────────────────────────────┐
│ ⏳ Vérification en cours...          │
└──────────────────────────────────────┘
```

#### Résultat positif
```
┌──────────────────────────────────────┐
│ ✅ Intégrité Confirmée ✓              │
└──────────────────────────────────────┘

┌──────────┐ ┌───────────┐ ┌────────┐
│ Batché   │ │ Compressé │ │ 98%    │
└──────────┘ └───────────┘ └────────┘

[Voir détails] ←
```

#### Résultat négatif
```
┌──────────────────────────────────────┐
│ ❌ Données Modifiées ✗                │
└──────────────────────────────────────┘
```

### Exemple d'utilisation

```jsx
import { HashScanVerification } from './components/verification/HashScanVerification';
import IntegrityButton from './components/verification/IntegrityButton';

function PrescriptionDetails({ prescription }) {
  const [verificationResult, setVerificationResult] = useState(null);

  return (
    <div>
      {/* Bouton de vérification */}
      <IntegrityButton
        recordId={prescription.id}
        showDetails={true}
        onVerified={(result) => setVerificationResult(result)}
      />

      {/* Détails de vérification */}
      {verificationResult && (
        <HashScanVerification
          verification={prescription.verification}
          recordHash={prescription.hash}
          timestamp={prescription.hederaTimestamp}
          batched={verificationResult.batched}
          batchInfo={verificationResult.batchVerification}
          compressed={verificationResult.compressed}
          optimizationStats={{
            originalSize: 1500,
            finalSize: 30,
            savingsPercent: "98%"
          }}
        />
      )}
    </div>
  );
}
```

---

## 🔒 Garanties cryptographiques

### 1. Immutabilité

**Garantie** : Une fois ancré, le hash ne peut **jamais** être modifié.

**Mécanisme** :
- Consensus Byzantine Fault Tolerance (BFT)
- Réseau décentralisé (39 nœuds de consensus)
- Finalité immédiate (~3-5 secondes)

**Preuve** : Transaction visible sur HashScan Testnet

### 2. Horodatage (Timestamping)

**Garantie** : Le timestamp est **prouvable** et **immutable**.

**Mécanisme** :
- Consensus Timestamp (précision à la nanoseconde)
- Ordre total des transactions garanti
- Impossible de modifier rétroactivement

**Exemple** :
```
Consensus Timestamp: 1705491000.987654321
= 2025-01-17 10:30:00.987654321 UTC
```

### 3. Non-répudiation

**Garantie** : Impossible de **nier** avoir créé le hash.

**Mécanisme** :
- Transaction signée avec clé privée ECDSA
- Account ID visible: 0.0.6089195
- Signature cryptographique vérifiable

### 4. Détection de falsification

**Garantie** : **Toute modification** est détectable.

**Mécanisme** :
```
Données originales → Hash1: 6b86b273...
Données modifiées  → Hash2: a8f9d621...

Hash1 !== Hash2 → ⚠️ FALSIFICATION DÉTECTÉE
```

**Sensibilité** : Même un seul caractère modifié change complètement le hash.

### 5. Vérifiabilité publique

**Garantie** : **N'importe qui** peut vérifier l'intégrité.

**Mécanisme** :
- Mirror Node API public
- HashScan explorer public
- Pas besoin de compte Hedera

**URL de vérification** :
```
https://hashscan.io/testnet/topic/0.0.7070750/message/12345
```

### 6. Confidentialité

**Garantie** : Données médicales **jamais révélées**.

**Mécanisme** :
- Hash only (pas de données)
- Fonction à sens unique (SHA-256)
- Impossible de retrouver les données depuis le hash

**Preuve** :
```
Hash: 6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b
         ↓
       ❌ Impossible de retrouver:
       - medication: "Paracétamol"
       - dosage: "500mg"
       - etc.
```

---

## ❓ FAQ

### Q1: Qu'est-ce qui est exactement ancré sur Hedera ?

**Uniquement le hash SHA-256 de vos données** (+ quelques métadonnées non sensibles).

**PAS ancré** :
- ❌ Nom du patient
- ❌ Nom du médicament
- ❌ Dosage
- ❌ Instructions
- ❌ Aucune donnée médicale

**Ancré** :
- ✅ Hash (empreinte cryptographique)
- ✅ ID de la prescription
- ✅ Matricule (référence)
- ✅ Timestamp

### Q2: Comment puis-je prouver que mes données n'ont pas changé ?

1. Cliquez sur "Vérifier Proof of Integrity"
2. Le système régénère le hash des données actuelles
3. Compare avec le hash ancré sur Hedera
4. Si les hashs correspondent → Données intactes ✅
5. Si les hashs diffèrent → Données modifiées ❌

### Q3: Puis-je modifier mes données après anchoring ?

**Techniquement oui**, mais :
- ⚠️ La modification sera **détectable**
- ⚠️ Le hash ne correspondra plus
- ⚠️ L'intégrité sera **compromise**

**Recommandation** : Ne jamais modifier les données ancrées. Créer une nouvelle version si nécessaire.

### Q4: Combien coûte l'anchoring ?

**Sans optimisations** : ~0.0001 HBAR par prescription (~0.000005€)

**Avec toutes les optimisations** :
- Hash-only : -70%
- Compression : -60% supplémentaire
- Batching : -98% au total

**Coût final** : ~0.000002 HBAR par prescription (~0.0000001€)

### Q5: Combien de temps pour ancrer ?

- **Direct anchoring** : ~2-5 secondes
- **Batch anchoring** : jusqu'à 5 minutes (timeout)

Pour les cas urgents, désactiver le batching :
```bash
HEDERA_USE_BATCHING=false
```

### Q6: Comment vérifier publiquement ?

1. Récupérer les infos Hedera :
   - Topic ID : `0.0.7070750`
   - Sequence Number : `12345`

2. Aller sur HashScan :
   ```
   https://hashscan.io/testnet/topic/0.0.7070750/message/12345
   ```

3. Vérifier :
   - ✅ Message existe
   - ✅ Hash correspond
   - ✅ Timestamp correct

### Q7: Que se passe-t-il en cas de panne de Hedera ?

**Hedera est hautement disponible** :
- 39 nœuds de consensus
- Répartis géographiquement
- Tolérance Byzantine (jusqu'à 1/3 de nœuds malicieux)

**En cas de panne** :
- Queue service avec retry automatique
- Backoff exponentiel (2s → 60s)
- Max 5 tentatives
- Alerte admin si échec définitif

### Q8: Puis-je utiliser mon propre topic Hedera ?

**Oui !** Configurez dans `.env` :
```bash
HEDERA_TOPIC_PRESCRIPTIONS=0.0.VOTRE_TOPIC
HEDERA_TOPIC_RECORDS=0.0.VOTRE_TOPIC
```

### Q9: Comment migrer de la version 2.0 à 3.0 ?

**Pas de migration nécessaire** ! Les deux versions coexistent :
- Anciennes prescriptions : version 2.0 (données complètes)
- Nouvelles prescriptions : version 3.0 (hash only)

Le système détecte automatiquement la version.

### Q10: Comment désactiver les optimisations ?

```bash
# .env
HEDERA_USE_BATCHING=false        # Désactiver batching
HEDERA_USE_COMPRESSION=false     # Désactiver compression
HEDERA_MAX_TPS=10                # Augmenter limite TPS
```

---

## 📞 Support

- **Documentation technique** : `/docs/HEDERA_OPTIMIZATIONS.md`
- **Tests** : `node test-hedera-optimizations.js`
- **Logs** : `backend/logs/`
- **Monitoring** : `GET /api/hedera/stats`

---

**Version** : 3.0
**Dernière mise à jour** : 2025-01-17
**Auteur** : FADJMA Team
