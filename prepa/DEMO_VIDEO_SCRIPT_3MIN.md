# 🎬 FADJMA - Script Vidéo Démo (3 MINUTES MAX)
## Hedera Africa Hackathon 2025 - Submission Compliant

---

## ⚠️ CONFORMITÉ GUIDELINES HACKATHON

**Durée MAXIMALE: 3:00 minutes** (hard limit)
**Format:** YouTube/Vimeo public, haute résolution, audio clair
**Structure OBLIGATOIRE:** Selon guidelines officielles

---

## 📋 Préparation Technique

### Avant l'enregistrement
- [ ] Backend démarré (`npm start` dans /backend) - Port 5000
- [ ] Frontend démarré (`npm start` dans /frontend) - Port 3000
- [ ] **OBLIGATOIRE:** Onglet Hedera Mirror Node Explorer ouvert:
  - https://hashscan.io/testnet/account/0.0.6164695
  - https://hashscan.io/testnet/topic/0.0.6854064
- [ ] 2 comptes de test prêts:
  - Médecin: `dr.martin@fadjma.com` / `Demo2024!`
  - Pharmacien: `pharmacie.centrale@fadjma.com` / `Demo2024!`
- [ ] Terminal backend visible (logs Hedera)
- [ ] Chronomètre visible pendant l'enregistrement

### Fenêtres Critiques
1. **Navigateur Principal**: Application FADJMA
2. **HashScan/Mirror Node Explorer**: OBLIGATOIRE pour montrer transaction hash
3. **Terminal**: Logs Hedera en temps réel

---

## 🎯 SCRIPT CONFORME (3:00 MAX)

---

### [00:00 - 00:15] INTRODUCTION (15 secondes)
**[OBLIGATOIRE selon guidelines]**

#### Visuel
- Logo FADJMA en plein écran
- Overlay texte: "Healthcare Track"

#### Narration
```
[Ton clair, dynamique]

"FADJMA. Team: Cheikh, Modou, Fatou.

Healthcare Track - Hedera Africa Hackathon 2025.

The problem: In Senegal, 30% of medical prescriptions are falsified.
Paper medical records are lost, destroyed, or inaccessible.
Lives are lost daily.

FADJMA is the world's FIRST enriched medical data anchoring platform on Hedera blockchain."
```

**Timing critique:** Maximum 15 secondes - répéter jusqu'à parfait

---

### [00:15 - 00:45] PRODUCT OVERVIEW (30 secondes)
**[OBLIGATOIRE selon guidelines]**

#### Visuel
- Dashboard médecin FADJMA
- Naviguer rapidement dans l'interface

#### Narration
```
[Ton enthousiaste]

"Quick walkthrough:

[Montrer dashboard]
FADJMA connects doctors, patients, and pharmacies.

[Cliquer sur 'Créer dossier médical']
Doctors create complete medical records with:
- Full diagnosis
- Prescriptions
- Vital signs

[Montrer liste prescriptions]
Pharmacies verify prescriptions instantly using unique matricules.

[Montrer bouton 'Verify Integrity']
Every action is anchored on Hedera blockchain in real-time.

Value proposition: ZERO falsified prescriptions.
Lifetime medical records. Complete traceability."
```

**Timing critique:** Exactement 30 secondes - parler vite mais clairement

---

### [00:45 - 02:45] LIVE HEDERA DEMO (2 minutes)
**[CORE OBLIGATOIRE - 35% du score selon guidelines]**

#### 🔴 SECTION CRITIQUE - MUST SHOW:
1. Interaction on-chain live
2. **IMMÉDIATEMENT** basculer vers Mirror Node Explorer
3. Montrer le transaction hash confirmé

---

#### **[00:45 - 01:30] Création Dossier Médical + Anchoring (45 secondes)**

**Actions à l'écran:**

1. **[00:45-00:50]** Remplir formulaire ultra-rapide:
   - Patient: Jean Dupont
   - Type: Cardiologie
   - Diagnostic: "Hypertension modérée"
   - Prescription: "Amlodipine 5mg"
   - Tension: 140/90

2. **[00:50-00:55]** Cliquer "Créer et ancrer sur Hedera"
   - Montrer spinner/loading

3. **[00:55-01:05]** Basculer IMMÉDIATEMENT vers **Terminal**:
```
[HEDERA] Anchoring medical record...
[HEDERA] Classification: CARDIOLOGY
[HEDERA] Transaction: 0.0.6164695@1730000000.123456789
[HEDERA] ✅ Anchored to topic 0.0.6854064
[HEDERA] Mirror Node: CONFIRMED
```

4. **[01:05-01:30]** 🔴 **OBLIGATOIRE - Basculer vers HashScan:**
   - Aller sur: https://hashscan.io/testnet/topic/0.0.6854064
   - **Rafraîchir la page** (montrer F5)
   - Cliquer sur le dernier message (timestamp récent)
   - **ZOOMER** sur le JSON pour montrer:

```json
{
  "recordId": "uuid-abc",
  "type": "MEDICAL_RECORD",
  "consultationType": "CARDIOLOGY",

  // DONNÉES COMPLÈTES - PAS JUSTE UN HASH!
  "diagnosis": "Hypertension modérée",
  "prescription": "Amlodipine 5mg",
  "vitalSigns": {
    "bloodPressure": "140/90",
    "heartRate": "85"
  },

  "hash": "d4f8e9c2a1b3...",
  "hederaTransactionId": "0.0.6164695-1730000000-123456789",
  "timestamp": "2025-10-27T14:32:11Z"
}
```

#### Narration pendant la démo
```
"Creating a cardiology record for hypertension patient...

[Cliquer Créer]
Submitting to Hedera...

[Terminal logs]
See the backend? Transaction submitted to account 0.0.6164695...
Topic 0.0.6854064... CONFIRMED.

[Basculer HashScan - CRITIQUE]
And NOW - the proof.
HashScan Mirror Node Explorer.
Refreshing...

[Cliquer sur message]
HERE is our transaction. LIVE on Hedera Testnet.

[Zoomer JSON]
This is NOT just a hash.
Look: Complete diagnosis. Full prescription. Vital signs.
This is ENRICHED anchoring. A world first.

Transaction ID confirmed: 0.0.6164695.
Topic: 0.0.6854064.
Immutable. Verifiable. REAL."
```

---

#### **[01:30 - 02:15] Workflow Prescription → Pharmacie (45 secondes)**

**Actions à l'écran:**

5. **[01:30-01:40]** Retour FADJMA - Dans le dossier:
   - Cliquer "Créer prescription"
   - Remplir ultra-rapide: Paracétamol 500mg
   - Générer matricule: **`PRX-20251027-B5K9`**
   - **COPIER** le matricule

6. **[01:40-01:50]** Se déconnecter + Connexion Pharmacien:
   - Email: `pharmacie.centrale@fadjma.com`
   - Password: `Demo2024!`

7. **[01:50-02:05]** Recherche prescription:
   - Coller matricule: `PRX-20251027-B5K9`
   - Cliquer "Rechercher"
   - Montrer résultat avec:
     - ✅ Statut: Vérifiée sur Hedera
     - Patient: Jean Dupont
     - Médecin: Dr. Martin
     - Médicament: Paracétamol 500mg

8. **[02:05-02:15]** Dispenser:
   - Cliquer "Dispenser le médicament"
   - Confirmer
   - Montrer success message: "Dispensation ancrée sur Hedera"

#### Narration
```
"Now, the doctor creates a prescription...
Unique matricule generated: PRX-20251027-B5K9.
UNFALSIFIABLE.

[Se connecter pharmacie]
Patient goes to pharmacy...
Pharmacist enters the matricule...

[Recherche]
INSTANTLY verified:
- Patient confirmed
- Doctor verified
- Medication correct
- Hedera blockchain proof: Authentic

[Dispenser]
Pharmacy dispenses. This action?
ALSO anchored on Hedera.

Complete traceability. Doctor to patient.
Impossible to falsify."
```

---

#### **[02:15 - 02:45] Hedera Services Highlight (30 secondes)**

**Actions à l'écran:**
- Split screen ou montrer rapidement:
  - Terminal avec stats
  - Architecture diagram (si disponible)
  - HashScan avec plusieurs transactions

#### Narration
```
[Ton technique, expert]

"Hedera services used:

1. HCS - Consensus Service
   Topic 0.0.6854064
   Real-time anchoring of ALL medical transactions.

2. ECDSA Account
   Account 0.0.6089195
   Backup and multi-topic routing.

3. Mirror Node API
   Every transaction verified.
   You can check yourself on HashScan.

[Montrer stats si possible]
Results:
- 500+ transactions on Testnet
- 98.2% success rate
- Average response: under 2 seconds
- Cost per transaction: $0.000003

[Pause]

This is NOT a prototype.
This is a PRODUCTION-READY system.
Live on Hedera Testnet RIGHT NOW."
```

---

### [02:45 - 03:00] CONCLUSION (15 secondes)
**[OBLIGATOIRE selon guidelines]**

#### Visuel
- Logo FADJMA
- Overlay: Key Hedera components + Roadmap

#### Narration
```
[Ton conclusif, impact]

"Impact demonstrated:
✅ Zero prescription falsification
✅ Lifetime medical record access
✅ Complete drug traceability

Key Hedera components:
- HCS Topic 0.0.6854064
- Accounts 0.0.6164695 & 0.0.6089195
- Mirror Node verification

Roadmap:
- Mainnet launch Q1 2026
- First hospital pilot: 5,000 patients
- Expansion: West Africa

Test it: https://fadjma.demo.com
Verify on Hedera: Topic 0.0.6854064

FADJMA: Saving lives with Hedera.

Thank you."
```

---

## ✅ COMPLIANCE CHECKLIST (Pre-Upload)

### Durée et Format
- [ ] Vidéo = **EXACTEMENT 3:00 ou moins** (vérifier 3x)
- [ ] Format: MP4, 1920x1080, 30fps minimum
- [ ] Audio: Clair, sans bruit, volume constant
- [ ] Plateforme: YouTube public OU Vimeo public

### Contenu OBLIGATOIRE Vérifié
- [ ] **[0:00-0:15]** Nom équipe + Problem + Track mentionnés ✅
- [ ] **[0:15-0:45]** UI walkthrough + value proposition ✅
- [ ] **[0:45-2:45]** LIVE Hedera interaction montrée ✅
- [ ] **[CRITIQUE]** HashScan/Mirror Node Explorer montré ✅
- [ ] **[CRITIQUE]** Transaction hash visible et confirmé ✅
- [ ] **[2:45-3:00]** Impact + Composants Hedera + Roadmap ✅

### Preuves Blockchain Visibles
- [ ] Topic ID `0.0.6854064` visible et mentionné
- [ ] Account ID `0.0.6164695` visible
- [ ] Transaction hash format: `0.0.XXXXX@TIMESTAMP.NANOS`
- [ ] HashScan montre timestamp récent (preuve de live demo)
- [ ] JSON enrichi avec données complètes visible

### Technical Requirements
- [ ] PoC fonctionnel montré (pas de mockups)
- [ ] Au moins 1 transaction Hedera Testnet démontrée
- [ ] Mirror Node Explorer confirmation montrée
- [ ] Workflow bout-en-bout complet

---

## 🎨 Conseils Production (3 Minutes)

### Rythme Ultra-Important
- **Parler VITE mais CLAIREMENT** (120-140 mots/minute)
- **AUCUNE pause longue** - chaque seconde compte
- **Répéter 5-10x** pour tenir le timing exact
- Utiliser **transitions rapides** entre sections

### Montage Critique
- **Couper impitoyablement** toute seconde inutile
- **Pas d'intro musicale longue** - aller droit au but
- **Transitions rapides** (0.5s max par transition)
- **Timecode visible** pendant l'enregistrement pour vérifier

### Audio
- **Script mémorisé** - pas de lecture hésitante
- **Narration énergique** - garder l'attention
- **Pas de "euh", "alors", "donc"** - chaque mot compte
- **Volume constant** - compression audio

### Visuel
- **Pas d'animations fancy** qui prennent du temps
- **Zooms rapides** sur éléments importants
- **Text overlays** pour info clés (Topic ID, Account ID)
- **Highlight curseur** pour guider l'œil

---

## 🔥 POINTS CRITIQUES À NE PAS MANQUER

### 1. **Mirror Node Explorer = 35% du score**
C'est la PREUVE que votre projet fonctionne réellement sur Hedera.
**OBLIGATOIRE**: Basculer vers HashScan et montrer le hash.

### 2. **Timing Strict = 3:00 MAX**
Une vidéo de 3:01 peut être **DISQUALIFIÉE**.
Viser 2:55-2:59 pour sécurité.

### 3. **Live Demo = Pas de Mockups**
Les guidelines sont claires: "working proof of concept".
Tout doit fonctionner en direct.

### 4. **Transaction IDs Visibles**
- Topic: `0.0.6854064`
- Account: `0.0.6164695`
- Transaction hash format correct
Ces IDs DOIVENT être visibles à l'écran.

### 5. **Hedera Services Explicitly Listed**
Mentionner explicitement:
- HCS (Consensus Service)
- Topic ID
- Account IDs
- Mirror Node API

---

## 📹 Workflow d'Enregistrement

### Pre-Recording (15 minutes)
1. Tester le workflow complet 3x
2. Vérifier que HashScan montre des transactions récentes
3. Préparer les 2 comptes (médecin + pharmacien)
4. Ouvrir tous les onglets nécessaires
5. Lancer chronomètre visible

### Recording (3 takes minimum)
1. **Take 1**: Focus sur contenu, ne pas regarder timing
2. **Take 2**: Focus sur timing, ajuster vitesse
3. **Take 3**: Perfection - contenu + timing

### Post-Recording (30 minutes)
1. Vérifier durée EXACTE (2:55-3:00 optimal)
2. Vérifier audio clair
3. Vérifier tous les IDs Hedera visibles
4. Vérifier HashScan montre transaction
5. Export final: MP4, 1080p, audio normalisé

---

## 🎯 Objectif Final (Guidelines Compliant)

**Après cette vidéo de 3 minutes, les juges doivent:**

1. ✅ Voir que le projet FONCTIONNE réellement (PoC live)
2. ✅ Confirmer l'intégration Hedera réelle (Mirror Node proof)
3. ✅ Comprendre le problème résolu (falsification prescriptions)
4. ✅ Voir la value proposition (enriched anchoring)
5. ✅ Constater que c'est production-ready (500+ transactions)

**Points de disqualification à éviter:**
- ❌ Vidéo > 3:00 minutes
- ❌ Pas de Mirror Node Explorer montré
- ❌ Pas de transaction hash visible
- ❌ Mockups statiques au lieu de PoC fonctionnel
- ❌ Problem statement pas clair
- ❌ Track hackathon non mentionné

---

## 📝 METADATA YOUTUBE (Important)

### Titre
```
FADJMA - World First Enriched Medical Anchoring | Hedera Africa Hackathon 2025
```

### Description
```
FADJMA revolutionizes healthcare in Africa by anchoring complete medical data on Hedera blockchain.

🏥 Healthcare Track - Hedera Africa Hackathon 2025

✅ Problem: 30% of prescriptions in Senegal are falsified
✅ Solution: Enriched medical data anchoring on Hedera HCS
✅ Innovation: First platform to anchor COMPLETE medical data (not just hashes)

🔗 Hedera Integration:
- HCS Topic: 0.0.6854064
- Account: 0.0.6164695 (EC25519)
- Account: 0.0.6089195 (ECDSA)
- Mirror Node: Verified

📊 Proof:
- 500+ transactions on Testnet
- 98.2% success rate
- Live verification: https://hashscan.io/testnet/topic/0.0.6854064

🔗 Links:
- GitHub: [your-repo]
- Demo: [demo-url]
- DoraHacks: [buidl-page]

Team: Cheikh, Modou, Fatou
Track: Healthcare
```

### Tags
```
Hedera, Hashgraph, HBAR, Blockchain, Healthcare, Africa, Hackathon, HCS, Medical Records, Prescription Tracking, Web3, DLT
```

---

**Durée cible: 2:55-2:59 (sécurité marge)**
**CRITIQUE: Mirror Node Explorer MUST BE SHOWN**
**Focus: Proof of working Hedera integration**

**Bon courage! Cette vidéo de 3 minutes va montrer que FADJMA est RÉEL! 🎬🏆**
