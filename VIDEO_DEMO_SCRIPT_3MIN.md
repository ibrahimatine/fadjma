# Script Vidéo Démonstration FADJMA
## Hedera Africa Hackathon 2025 - 3 Minutes

---

## STRUCTURE TEMPORELLE

**Durée totale:** 3:00 minutes (180 secondes)
- Introduction: 0:00 - 0:15 (15s)
- Présentation du problème: 0:15 - 0:45 (30s)
- Démonstration LIVE Hedera: 0:45 - 2:45 (120s)
- Conclusion: 2:45 - 3:00 (15s)

---

## SEGMENT 1: INTRODUCTION (0:00 - 0:15)

### [Écran: Logo FADJMA + Titre du projet]

**TEXTE À DIRE:**

> "Bonjour! Je suis Ibrahima Tine. Mon co-equipe et moi  sommes développeurs full-stack certifiés chez Zone01 Dakar, au Sénégal."

> "Aujourd'hui, nous vous présentons **FADJMA** - notre solution pour sécuriser les donnees médicales en Afrique avec Hedera Consensus Service."

**ACTIONS ÉCRAN:**
- 0:00-0:05: Afficher logo FADJMA + noms de l'équipe
- 0:05-0:10: Transition vers slide "Le Problème"
- 0:10-0:15: Afficher statistiques (30% contrefaites, 80% sans digital)

**TIMING:** ⏱️ 15 secondes exactement

---

## SEGMENT 2: LE PROBLÈME (0:15 - 0:45)

### [Écran: Statistiques + Carte de l'Afrique]

**TEXTE À DIRE:**

> "En Afrique, **30% des prescriptions médicales sont contrefaites**. 80% des établissements n'ont aucun système numérique. Résultat: 200,000 décès par an à cause de médicaments falsifiés."

> "Les solutions blockchain existantes sont trop chères - Ethereum coûte jusqu'à 50 dollars par transaction. C'est pourquoi nous avons choisi **Hedera**: seulement **0.0001 dollar** par transaction, avec une finalité en **3 à 5 secondes**."

> "Notre innovation? L'**Enriched Anchoring** - au lieu de stocker juste un hash, nous ancrons les **données médicales complètes** directement sur HCS."

**ACTIONS ÉCRAN:**
- 0:15-0:25: Montrer carte Afrique + statistiques alarmantes
- 0:25-0:35: Tableau comparatif (Hedera vs Ethereum vs Hyperledger)
- 0:35-0:45: Schéma "Hash Only" vs "Enriched Anchoring"

**TIMING:** ⏱️ 30 secondes

---

## SEGMENT 3: DÉMONSTRATION LIVE HEDERA (0:45 - 2:45)

### PARTIE A: Création de Prescription (0:45 - 1:30)

### [Écran: Interface médecin - Login]

**TEXTE À DIRE:**

> "Passons à la démonstration en direct. Je vais me connecter en tant que Dr. Diop."

**ACTIONS ÉCRAN:**
- 0:45: Ouvrir http://localhost:3000
- 0:47: Cliquer sur "Se connecter"
- 0:49: Entrer identifiants (docteur1@fadjma.sn / password123)
- 0:52: Cliquer "Connexion"

**TIMING:** ⏱️ 7 secondes (0:45 - 0:52)

---

### [Écran: Dashboard médecin]

**TEXTE À DIRE:**

> "Voici le tableau de bord médecin. Je vais créer une nouvelle prescription pour un patient."

**ACTIONS ÉCRAN:**
- 0:52: Dashboard s'affiche
- 0:54: Cliquer sur "Nouvelle Prescription" (bouton vert)
- 0:56: Formulaire de prescription s'ouvre

**TIMING:** ⏱️ 4 secondes (0:52 - 0:56)

---

### [Écran: Formulaire prescription]

**TEXTE À DIRE:**

> "Je sélectionne la patiente Fatou Sall, diagnostique une hypertension légère, et prescris Amlodipine 5 milligrammes, une fois par jour pendant 30 jours."

**ACTIONS ÉCRAN:**
- 0:56: Sélectionner patient "Fatou Sall" dans dropdown
- 1:00: Taper diagnostic: "Hypertension légère"
- 1:05: Taper médicament: "Amlodipine 5mg"
- 1:08: Taper posologie: "1 comprimé le matin"
- 1:11: Taper durée: "30 jours"
- 1:13: Instructions spéciales: "Contrôle tension dans 15 jours"

**TIMING:** ⏱️ 17 secondes (0:56 - 1:13)

---

### [Écran: Bouton "Créer Prescription"]

**TEXTE À DIRE:**

> "Quand je clique sur 'Créer', notre backend génère automatiquement un matricule unique, puis soumet les données complètes sur le **Topic Hedera 0.0.7070750** via une **TopicMessageSubmitTransaction**."

**ACTIONS ÉCRAN:**
- 1:13: Cliquer sur "Créer Prescription"
- 1:15: Loader apparaît avec texte "Ancrage sur Hedera HCS..."
- 1:18: Success message: "Prescription créée! Matricule: PRESC-20251028-A7F3"

**TIMING:** ⏱️ 5 secondes (1:13 - 1:18)

---

### [Écran: Détails prescription avec QR code]

**TEXTE À DIRE:**

> "Voilà! La prescription est créée avec le matricule **PRESC-20251028-A7F3**. Un QR code est généré pour la patiente. Notez la **Transaction ID Hedera** affichée ici."

**ACTIONS ÉCRAN:**
- 1:18: Modal ou page détails prescription s'affiche
- 1:20: Pointer le matricule (PRESC-20251028-A7F3)
- 1:23: Pointer le QR code
- 1:25: Pointer la Transaction ID (ex: 0.0.6165611@1698505800.123456789)
- 1:28: **COPIER la Transaction ID** (important pour la suite)

**TIMING:** ⏱️ 10 secondes (1:18 - 1:28)

---

### PARTIE B: Vérification HashScan (1:28 - 2:15)

### [Écran: Navigateur → HashScan]

**TEXTE À DIRE:**

> "Maintenant, vérifions cette transaction publiquement sur **HashScan**, l'explorateur blockchain de Hedera."

**ACTIONS ÉCRAN:**
- 1:28: Ouvrir nouvel onglet
- 1:30: Aller sur https://hashscan.io/testnet
- 1:32: Coller la Transaction ID dans la barre de recherche
- 1:34: Appuyer sur Entrée

**TIMING:** ⏱️ 6 secondes (1:28 - 1:34)

---

### [Écran: HashScan - Page Transaction]

**TEXTE À DIRE:**

> "Et voilà! En moins de 5 secondes, notre transaction est **finalisée** sur le réseau Hedera Testnet. Vous voyez ici:"

> "Le **statut SUCCESS**, le **timestamp exact**, le **Topic ID 0.0.7070750**, et surtout, le **message complet** contenant toutes les données médicales - pas juste un hash!"

**ACTIONS ÉCRAN:**
- 1:34: Page transaction HashScan chargée
- 1:37: Scroller pour montrer:
  - Status: ✅ SUCCESS
  - Consensus Timestamp: 2025-10-28 14:30:00.123456789 UTC
  - Topic ID: 0.0.7070750
  - Account ID: 0.0.6165611
- 1:42: Cliquer sur "Show Message" ou scroller vers le message
- 1:45: Montrer le JSON complet:
  ```json
  {
    "type": "PRESCRIPTION",
    "matricule": "PRESC-20251028-A7F3",
    "patientId": "PAT-456",
    "doctorId": "DOC-789",
    "diagnosis": "Hypertension légère",
    "medications": ["Amlodipine 5mg"],
    "posology": "1 comprimé le matin",
    "duration": "30 jours",
    "timestamp": "2025-10-28T14:30:00Z"
  }
  ```
- 1:55: Souligner avec curseur les champs importants

**TIMING:** ⏱️ 21 secondes (1:34 - 1:55)

---

### PARTIE C: Vérification Pharmacie (1:55 - 2:30)

### [Écran: Retour FADJMA - Interface Pharmacie]

**TEXTE À DIRE:**

> "Maintenant, simulons la pharmacie. Je me déconnecte et me connecte en tant que pharmacien."

**ACTIONS ÉCRAN:**
- 1:55: Retour onglet FADJMA
- 1:57: Cliquer menu utilisateur → Déconnexion
- 2:00: Cliquer "Se connecter"
- 2:02: Entrer (pharmacie1@fadjma.sn / password123)
- 2:05: Cliquer "Connexion"

**TIMING:** ⏱️ 10 secondes (1:55 - 2:05)

---

### [Écran: Dashboard Pharmacie - Vérification]

**TEXTE À DIRE:**

> "En tant que pharmacien, je vais vérifier cette prescription. Je saisis le matricule **PRESC-20251028-A7F3**."

**ACTIONS ÉCRAN:**
- 2:05: Dashboard pharmacie s'affiche
- 2:07: Cliquer "Vérifier Prescription"
- 2:09: Formulaire de vérification apparaît
- 2:11: Taper le matricule: PRESC-20251028-A7F3
- 2:14: Cliquer "Vérifier"

**TIMING:** ⏱️ 9 secondes (2:05 - 2:14)

---

### [Écran: Résultat Vérification]

**TEXTE À DIRE:**

> "Et voilà! En interrogeant le **Mirror Node Hedera**, FADJMA récupère instantanément toutes les informations: patient, médecin, diagnostic, médicaments. La prescription est **authentique et vérifiée**!"

**ACTIONS ÉCRAN:**
- 2:14: Loader "Vérification via Hedera Mirror Node..."
- 2:16: Résultat s'affiche avec badge ✅ AUTHENTIQUE
- 2:18: Montrer les détails:
  - Patient: Fatou Sall
  - Médecin: Dr. Diop
  - Diagnostic: Hypertension légère
  - Médicaments: Amlodipine 5mg
  - Posologie: 1 comprimé le matin
  - Transaction Hedera: [ID]
  - Lien HashScan cliquable
- 2:25: Scroller pour montrer toutes les infos

**TIMING:** ⏱️ 11 secondes (2:14 - 2:25)

---

### [Écran: Tableau de bord avec statistiques]

**TEXTE À DIRE:**

> "Nous avons déjà réalisé plus de **500 transactions** sur le réseau Hedera Testnet, avec un taux de succès de **98.2%**."

**ACTIONS ÉCRAN:**
- 2:25: Montrer section "Statistiques" ou dashboard admin
- 2:28: Pointer les chiffres: 500+ transactions, 98.2% success
- 2:30: Montrer graphique ou liste des dernières transactions

**TIMING:** ⏱️ 5 secondes (2:25 - 2:30)

---

### PARTIE D: Code Source (2:30 - 2:45)

### [Écran: VS Code ou GitHub]

**TEXTE À DIRE:**

> "Tout notre code est **open-source** sur GitHub. Voici l'implémentation réelle de la TopicMessageSubmitTransaction - moins de 30 lignes de code pour ancrer des données médicales sur Hedera!"

**ACTIONS ÉCRAN:**
- 2:30: Ouvrir VS Code ou navigateur GitHub
- 2:32: Montrer fichier: backend/src/services/hederaService.js
- 2:34: Scroller vers la fonction `submitToHCS()`:
  ```javascript
  async submitToHCS(message) {
    const tx = await new TopicMessageSubmitTransaction()
      .setTopicId(this.topicId)
      .setMessage(JSON.stringify(message))
      .execute(this.client);

    const receipt = await tx.getReceipt(this.client);
    return {
      transactionId: tx.transactionId.toString(),
      status: receipt.status.toString()
    };
  }
  ```
- 2:38: Montrer aussi le README.md (scroller rapidement)
- 2:42: Montrer l'arborescence du projet (tree ou file explorer)

**TIMING:** ⏱️ 15 secondes (2:30 - 2:45)

---

## SEGMENT 4: CONCLUSION (2:45 - 3:00)

### [Écran: Retour slide finale avec logo + contact]

**TEXTE À DIRE:**

> "FADJMA, c'est l'**Enriched Anchoring** - 400% plus de données que nos concurrents, pour seulement **0.0001 dollar** par transaction grâce à Hedera."

> "Notre objectif: déployer dans **10 pays d'Afrique de l'Ouest** d'ici 2027, et sauver des milliers de vies."

> "Merci! Tout notre code est disponible sur GitHub, et nos transactions sont vérifiables publiquement sur HashScan."

**ACTIONS ÉCRAN:**
- 2:45: Afficher slide récapitulatif avec:
  - Logo FADJMA
  - Chiffres clés: $0.0001/tx, 500+ transactions, 98.2% success
  - Hedera Account: 0.0.6165611
  - Topic: 0.0.7070750
  - GitHub URL
  - HashScan URL
- 2:50: Transition vers slide contact:
  - Ibrahima Tine - ibrahima.tine@fadjma.com
  - Cheikh Mounirou Diouf - cheikh.diouf@fadjma.com
  - Zone01 Dakar, Sénégal
- 2:55: Fade to black avec texte "Merci! Questions?"

**TIMING:** ⏱️ 15 secondes exactement (2:45 - 3:00)

---

## CHECKLIST TECHNIQUE PRÉ-ENREGISTREMENT

### Backend (MUST BE RUNNING)
```bash
cd /home/tine29i/fadjma/backend
env -i HOME="$HOME" PATH="$PATH" NODE_ENV=development npm run dev
```
- ✅ Port 5000 actif
- ✅ Base de données seeded (npm run seed:clean si besoin)
- ✅ Hedera client initialisé (vérifier logs)
- ✅ Topic ID: 0.0.7070750 actif

### Frontend (MUST BE RUNNING)
```bash
cd /home/tine29i/fadjma/frontend
PORT=3000 npm start
```
- ✅ Port 3000 actif
- ✅ http://localhost:3000 accessible
- ✅ Pas d'erreurs console (F12)

### Comptes de Test (MUST EXIST)
```bash
# Vérifier dans la DB ou via API
curl http://localhost:5000/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"docteur1@fadjma.sn","password":"password123"}'

curl http://localhost:5000/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"pharmacie1@fadjma.sn","password":"password123"}'
```
- ✅ docteur1@fadjma.sn (Dr. Diop)
- ✅ pharmacie1@fadjma.sn
- ✅ Patient "Fatou Sall" existe dans la DB

### Navigation (MUST PRACTICE)
- ✅ Onglet 1: http://localhost:3000 (FADJMA)
- ✅ Onglet 2: https://hashscan.io/testnet (HashScan)
- ✅ Onglet 3: VS Code ou GitHub (code source)
- ✅ Onglet 4: Slides présentation (PDF ou Google Slides)

### Timing (MUST REHEARSE)
- ⏱️ Pratiquer 5 fois pour respecter 3:00 exactement
- ⏱️ Avoir un chronomètre visible pendant l'enregistrement
- ⏱️ Backup plan si dépassement: couper la partie code source (2:30-2:45)

---

## NOTES IMPORTANTES

### Qualité Vidéo
- Résolution: **1920x1080 minimum** (Full HD)
- Format: **MP4 (H.264)**
- Audio: Micro de qualité (pas le micro laptop si possible)
- Lumière: Bien éclairé, pas de contre-jour
- Enregistreur: OBS Studio, Loom, ou Zoom (record)

### Conseils Présentation
- Parler **clairement et lentement** (accent français OK!)
- **Sourire** et montrer l'enthousiasme
- **Pointer** avec le curseur les éléments importants
- **Zoomer** si texte petit (Ctrl + molette)
- **Tester le son** avant (pas d'écho, pas de bruit de fond)

### Backup Plans
- Si transaction Hedera échoue → Montrer une transaction existante sur HashScan
- Si frontend crash → Avoir des screenshots prêts
- Si dépassement temps → Couper la partie code source (gagner 15s)

### Après Enregistrement
- Upload sur **YouTube** (Unlisted) ou **Vimeo**
- Vérifier qualité vidéo et son
- Ajouter sous-titres si possible (améliore accessibilité)
- Copier le lien pour DoraHacks submission

---

## SCRIPT ALTERNATIF (Si problème technique)

### Version "Plan B" avec Screenshots

Si le système plante pendant l'enregistrement:

1. **Montrer des screenshots** préparés à l'avance de:
   - Interface médecin (formulaire rempli)
   - Success message avec matricule
   - HashScan transaction page
   - Interface pharmacie avec vérification réussie

2. **Utiliser HashScan directement**:
   - Aller sur https://hashscan.io/testnet/topic/0.0.7070750
   - Montrer les 500+ messages déjà soumis
   - Cliquer sur un message récent
   - Montrer le JSON complet

3. **Expliquer verbalement** les étapes même si on montre des screenshots

**Durée identique:** 3:00 minutes

---

## VALIDATION FINALE

### Avant de soumettre la vidéo:
- [ ] Durée: exactement 2:55 - 3:05 (marge 5s acceptable)
- [ ] Audio clair et sans bruit
- [ ] Vidéo 1080p minimum
- [ ] Démonstration Hedera **LIVE** visible (HashScan requis!)
- [ ] Transaction ID visible et vérifiable
- [ ] Lien GitHub mentionné
- [ ] Noms de l'équipe prononcés clairement
- [ ] Format MP4 compatible YouTube/Vimeo
- [ ] Taille < 500MB (compression si besoin)

---

**Bonne chance! 🚀**

*FADJMA - Sauver des vies avec Hedera*
