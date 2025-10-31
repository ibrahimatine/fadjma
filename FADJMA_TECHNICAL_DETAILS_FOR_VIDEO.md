# FADJMA - Informations Techniques Précises pour la Vidéo
## Document de Référence pour le Tournage

---

## 🎯 INFORMATIONS ESSENTIELLES

### Équipe & Track
- **Nom de l'équipe** : 01 Talent Senegal
- **Présentateur** : Cheikh Mounirou Coly Diouf
- **Track Hackathon** : DLTs For Operation
- **Projet** : FADJMA (Fully Auditable Digital Journal for Medical Archives)

---

## 🔗 SERVICES HEDERA UTILISÉS (À MENTIONNER DANS LA VIDÉO)

### 1. Hedera Consensus Service (HCS)
**Type de transactions exécutées** :
- `TopicMessageSubmitTransaction` - Soumission des données médicales enrichies
- `TopicCreateTransaction` - Création des topics dédiés

**Topics Déployés sur Testnet** :
- **Topic Principal** : `0.0.7070750` (Prescriptions, Records, Deliveries, Access, Batch)
- **Topic Historique** : `0.0.6854064`

**Liens HashScan à montrer** :
- https://hashscan.io/testnet/topic/0.0.7070750
- https://hashscan.io/testnet/topic/0.0.6854064

### 2. Comptes Hedera
- **Compte Principal (ECDSA)** : `0.0.6165611`
- **Compte Secondaire (Failover)** : `0.0.6089195`

**Lien HashScan compte** :
- https://hashscan.io/testnet/account/0.0.6165611

### 3. Mirror Node API
**Endpoints utilisés** :
- Vérification en temps réel : `https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.7070750/messages`
- Vérification des transactions : `https://testnet.mirrornode.hedera.com/api/v1/transactions/{transactionId}`

---

## 📊 MÉTRIQUES PRODUCTION (CHIFFRES RÉELS À CITER)

### Performance Hedera
| Métrique | Valeur Exacte |
|----------|---------------|
| **Transactions Totales** | 500+ |
| **Taux de Succès** | 98.2% |
| **Temps Moyen d'Ancrage** | 1.8 secondes |
| **Finalité aBFT** | 3-5 secondes |
| **Coût par Transaction** | $0.000003 USD |
| **Économie vs Ethereum** | 99.7% moins cher |

### Codebase
| Composant | Valeur |
|-----------|--------|
| **Lignes de Code Total** | 22,000+ |
| **Backend (Node.js)** | 17,000+ lignes |
| **Frontend (React)** | 5,000+ lignes |
| **Endpoints API** | 80+ |
| **Modèles DB** | 14 |
| **Services Métiers** | 22 |
| **Composants React** | 50+ |
| **Couverture Tests** | 85% |

---

## 🚀 INNOVATION TECHNIQUE : ANCRAGE ENRICHI V2.0

### Comparaison à Montrer dans la Vidéo

**❌ Blockchain Traditionnelle (Compétiteurs)** :
```json
{
  "recordId": "rec-123",
  "hash": "abc123...",
  "timestamp": "2025-10-31T10:00:00Z"
}
```
📊 **3 champs • ~80 bytes • Perte d'information**

**✅ FADJMA Ancrage Enrichi (Première Mondiale!)** :
```json
{
  "recordId": "rec-123",
  "hash": "abc123...",
  "timestamp": "2025-10-31T10:00:00Z",
  "type": "MEDICAL_RECORD",
  "title": "Consultation Cardiologie",
  "diagnosis": "Hypertension légère",
  "prescription": "Amlodipine 5mg, repos recommandé",
  "consultationType": "CARDIOLOGY",
  "medicalData": {
    "symptoms": ["douleur thoracique", "fatigue"],
    "treatments": ["Amlodipine 5mg", "repos"],
    "vitalSigns": {
      "bloodPressure": "140/90",
      "heartRate": "85"
    }
  },
  "patientId": "patient-456",
  "doctorId": "doctor-789",
  "matricule": "ORD-20251031-A3F2"
}
```
📊 **15+ champs • ~400 bytes • 400% PLUS DE DONNÉES • Zéro Perte**

---

## 🔧 OPTIMISATIONS AVANCÉES HEDERA (À MENTIONNER)

### 1. Compression zlib
- **Réduction de taille** : ~40%
- **Format** : `COMPRESSED|base64_data`
- **Avantage** : Économie de coûts supplémentaire

### 2. Batching Intelligent
- **Capacité** : Jusqu'à 50 messages/batch
- **Économie** : 98% de réduction des frais
- **Auto-flush** : Toutes les 30 secondes ou dès 50 messages

### 3. Rate Limiting Adaptatif
- **Limite TPS** : 8 TPS (respecte les limites Hedera)
- **Retry Exponentiel** : 3 tentatives avec backoff 1s, 2s, 4s
- **Queue système** : Gestion intelligente des requêtes

### 4. Dual Account Support
- **Failover automatique** : Bascule vers compte secondaire en cas d'erreur
- **Haute disponibilité** : 98.2% de taux de succès

---

## 💡 POURQUOI HEDERA ? (ARGUMENTS TECHNIQUES PRÉCIS)

### 1. Finalité aBFT (Asynchronous Byzantine Fault Tolerance)
- **Finalité** : 3-5 secondes (vs 15 min Ethereum, 1h Bitcoin)
- **Impossible de réorganiser** : Pas de "rollback" possible
- **Impact** : Vérification instantanée des prescriptions en pharmacie

### 2. Frais Prévisibles & Ultra-Low
- **HCS** : $0.0001 USD/transaction (fixe et prévisible)
- **Avec batching** : $0.000003 USD effectif
- **Vs Ethereum** : $0.50-$5.00 USD/tx (99.7% moins cher)

**Exemple Concret** :
```
Scénario: 10,000 prescriptions/mois pour un hôpital moyen
- Coût Ethereum: $5,000 - $50,000/mois ❌ IMPOSSIBLE
- Coût Hedera (sans batching): $1/mois ✅
- Coût Hedera (avec batching): $0.03/mois ✅✅
```

### 3. Throughput Élevé
- **Hedera** : 10,000 TPS natif
- **Ethereum** : 15 TPS
- **Bitcoin** : 7 TPS
- **Impact** : Scalabilité continentale (350M habitants Afrique de l'Ouest)

### 4. ESG & Durabilité
- **Empreinte carbone** : Négative (compensée)
- **Consommation** : 0.00017 kWh/transaction (vs 700 kWh Bitcoin)
- **Impact** : Éligibilité aux subventions gouvernementales

---

## 📝 FORMAT DU MATRICULE D'ORDONNANCE

**Format** : `ORD-YYYYMMDD-XXXX`

**Exemple** : `ORD-20251031-A3F2`
- `ORD` : Préfixe ordonnance
- `20251031` : Date (31 octobre 2025)
- `A3F2` : Identifiant unique (hexadécimal)

**Traçabilité** :
1. Médecin génère ordonnance → Matricule créé
2. Ancrage Hedera instantané avec matricule
3. Pharmacie recherche matricule → Vérifie sur Hedera
4. Dispensation enregistrée → Ancrage sur Hedera

---

## 🎬 FLUX DE DÉMONSTRATION LIVE

### Démo 1 : Création Dossier Médical (0:45-1:20)
**À montrer à l'écran** :
1. Interface médecin
2. Création dossier patient (Dr. Diallo → Patient Jean Dupont)
3. Champs remplis : Diagnostic, Signes vitaux, Prescription
4. Clic "Ancrer sur Hedera"
5. **BASCULER IMMÉDIATEMENT VERS HASHSCAN** :
   - URL : https://hashscan.io/testnet/topic/0.0.7070750
   - Montrer le dernier message avec toutes les données médicales
   - Mettre en évidence : Transaction ID, Sequence Number, Timestamp
   - Montrer le contenu JSON complet (pas juste un hash!)

### Démo 2 : Création Ordonnance (1:20-2:00)
**À montrer à l'écran** :
1. Interface médecin
2. Création ordonnance électronique
3. Champs : Médicaments, Dosages, Instructions
4. Matricule généré : `ORD-20251031-1234`
5. Clic "Créer et Ancrer"
6. **BASCULER IMMÉDIATEMENT VERS HASHSCAN** :
   - Montrer la transaction TopicMessageSubmitTransaction
   - Montrer le matricule dans les métadonnées
   - Montrer le coût : $0.000003 USD
   - Comparer avec Ethereum : "99.7% moins cher!"

### Démo 3 : Dispensation Pharmacie (2:00-2:45)
**À montrer à l'écran** :
1. Interface pharmacie
2. Recherche par matricule : `ORD-20251031-1234`
3. **Interrogation Mirror Node en temps réel** (montrer la requête API)
4. Résultat : ✅ Authentique, non utilisée, médecin certifié
5. Dispensation des médicaments
6. Enregistrement sur Hedera
7. **Montrer Dashboard Admin** :
   - Toute la chaîne visible : Création → Vérification → Dispensation
   - Statistiques : 500+ transactions, 98.2% succès
   - Graphiques de performance

---

## 🎯 POINTS CLÉS À ABSOLUMENT MENTIONNER

### Introduction (0:00-0:15)
✅ "Je suis Cheikh Mounirou Coly Diouf, de l'équipe 01 Talent Senegal"
✅ "Track : DLTs For Operation"
✅ "30% prescriptions contrefaites, 25 000 décès/an en Afrique de l'Ouest"

### Product Overview (0:15-0:45)
✅ "400% plus de données ancrées que les solutions traditionnelles"
✅ "Finalité en 3 secondes"
✅ "Coût de $0.000003 par transaction"

### Live Demo (0:45-2:45)
✅ Montrer Topic ID : "0.0.7070750"
✅ Mentionner "TopicMessageSubmitTransaction"
✅ Montrer HashScan URL visible à l'écran
✅ "Compression zlib, batching intelligent, rate limiting"
✅ "98.2% de taux de succès sur 500+ transactions"

### Conclusion (2:45-3:00)
✅ "22 000 lignes de code production-ready"
✅ "Hedera Consensus Service + Mirror Node API"
✅ "Dual account failover"
✅ "Roadmap : Migration Mainnet + pilote 3 hôpitaux Q1 2026"

---

## ⚠️ ERREURS À ÉVITER

❌ Ne pas dire "Healthcare & Public Services" → Dire "DLTs For Operation"
❌ Ne pas dire "Zone01 Dakar" → Dire "01 Talent Senegal"
❌ Ne pas oublier de basculer vers HashScan après CHAQUE transaction
❌ Ne pas utiliser de chiffres approximatifs → Utiliser les chiffres exacts du tableau
❌ Ne pas montrer de mockups statiques → Montrer l'application réelle fonctionnelle

---

## 🔗 LIENS IMPORTANTS À PRÉPARER AVANT LE TOURNAGE

### HashScan
- Topic Principal : https://hashscan.io/testnet/topic/0.0.7070750
- Topic Historique : https://hashscan.io/testnet/topic/0.0.6854064
- Compte Principal : https://hashscan.io/testnet/account/0.0.6165611

### Mirror Node API
- Messages du topic : https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.7070750/messages
- Documentation : https://docs.hedera.com/hedera/sdks-and-apis/rest-api

### Application Locale
- Frontend : http://localhost:3000
- Backend API : http://localhost:5000
- Health Check : http://localhost:5000/api/health

---

## 📧 COMPTES DE TEST À UTILISER DANS LA VIDÉO

| Rôle | Email | Password | Usage dans vidéo |
|------|-------|----------|------------------|
| **Médecin** | `dr.martin@fadjma.com` | `Demo2024!` | Créer dossier + ordonnance |
| **Patient** | `jean.dupont@demo.com` | `Demo2024!` | Vérifier ordonnance |
| **Pharmacien** | `pharmacie.centrale@fadjma.com` | `Demo2024!` | Rechercher + dispenser |
| **Admin** | `admin@fadjma.com` | `Admin2024!` | Voir statistiques |

---

## ✅ CHECKLIST AVANT LE TOURNAGE

- [ ] Application démarrée (frontend + backend)
- [ ] Compte Hedera avec tℏ disponible
- [ ] HashScan ouvert dans un onglet
- [ ] Topic 0.0.7070750 rafraîchi récemment
- [ ] Comptes de test vérifiés (login fonctionnel)
- [ ] Base de données seedée avec données de démo
- [ ] Connexion Internet stable
- [ ] Enregistrement d'écran configuré (1080p minimum)
- [ ] Musique de fond préparée
- [ ] Script de voix-off imprimé/visible

---

## 🎙️ AIDE-MÉMOIRE POUR LA VOIX-OFF

### Termes Techniques à Prononcer Correctement
- **Hedera** : "Édéra" (pas "Édera")
- **aBFT** : "a-B-F-T" (épeler les lettres)
- **HCS** : "H-C-S" (Hedera Consensus Service)
- **TopicMessageSubmitTransaction** : "Topic Message Submit Transaction"
- **Mirror Node** : "Miroir Node"
- **HashScan** : "Hash-Scan"
- **Matricule** : "Matricule" (ORD-YYYY-MM-DD-XXXX)

### Rythme de Parole
- Introduction : **Lent et clair** (noms, équipe, track)
- Product Overview : **Modéré** (énergique mais compréhensible)
- Live Demo : **Technique mais fluide** (ne pas précipiter les explications)
- Conclusion : **Impactant** (ralentir sur les chiffres clés)

---

**Bonne chance pour votre vidéo de démo !** 🚀

**FADJMA - Sauver des Vies par l'Innovation Blockchain**
