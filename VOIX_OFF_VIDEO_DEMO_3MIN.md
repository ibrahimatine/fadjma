# Script Voix-Off - Vidéo Démo FADJMA (3 minutes)
## Conforme aux Submission Guidelines - Hedera Africa Hackathon 2025

---

## [0:00 - 0:15] INTRODUCTION (15 secondes)
**Objectif** : Team Name, Problem Statement, Hackathon Track

### Contenu visuel suggéré :
- Slide titre avec logo FADJMA
- Nom de l'équipe : 01 Talent Senegal
- Track : DLTs For Operation

### Script voix-off :
"Je suis Cheikh Mounirou Coly Diouf, de l'équipe 01 Talent Senegal. En Afrique de l'Ouest, 30% des prescriptions médicales sont contrefaites, causant 25 000 décès par an. 80% des citoyens n'ont aucun dossier médical numérique. FADJMA résout ce défi critique grâce à Hedera. Track : DLTs For Operation."

---

## [0:15 - 0:45] PRODUCT OVERVIEW (30 secondes)
**Objectif** : Quick walkthrough of main UI and value proposition

### Contenu visuel suggéré :
- Montrer rapidement l'interface principale (tableau de bord médecin/patient/pharmacie)
- Afficher les 3 acteurs du système

### Script voix-off :
"FADJMA est la première plateforme médicale africaine qui ancre l'intégralité des données de santé sur blockchain, pas seulement des hash. Notre système connecte trois acteurs : le médecin crée des dossiers médicaux et ordonnances sécurisées, le patient vérifie l'authenticité de ses documents en temps réel, et le pharmacien dispense les médicaments en toute traçabilité. Chaque action est instantanément ancrée sur Hedera avec une finalité en 3 secondes et un coût de 0,0003 dollar par transaction."

---

## [0:45 - 2:45] LIVE HEDERA DEMO - THE CORE (2 minutes)
**MANDATORY** : Show actual working product + Hedera transactions + Mirror Node verification

### [0:45 - 1:05] Démo 1 : Création de dossier médical (20 secondes)
**Contenu visuel** : Médecin crée fiche patient
**Script** :
"Le Dr. Diallo crée le dossier médical complet de son patient : diagnostics, antécédents, signes vitaux. En un clic, toutes ces données sont ancrées sur Hedera via le Hedera Consensus Service. Regardez la transaction se confirmer instantanément."

### [1:05 - 1:20] Vérification Mirror Node 1 (15 secondes)
**CRUCIAL - Contenu visuel** : Basculer vers HashScan/Mirror Node Explorer
**Script** :
"Voici la preuve : sur HashScan, le Topic ID 0.0.7070750 montre notre transaction HCS confirmée avec la finalité aBFT en 1,8 secondes. Contrairement aux solutions traditionnelles qui n'ancrent que des hash, FADJMA ancre 400% plus de données : diagnostic complet, signes vitaux, traitements. Tout est immuable et vérifiable publiquement."

### [1:20 - 1:45] Démo 2 : Création d'ordonnance (25 secondes)
**Contenu visuel** : Médecin génère ordonnance électronique
**Script** :
"Le médecin génère maintenant une ordonnance électronique sécurisée. Un matricule unique ORD-20251031-1234 est créé et ancré instantanément sur Hedera. Cette ordonnance contient les médicaments prescrits, les dosages, et la signature cryptographique du médecin."

### [1:45 - 2:00] Vérification Mirror Node 2 (15 secondes)
**CRUCIAL - Contenu visuel** : Basculer vers HashScan
**Script** :
"Vérification en direct : notre TopicMessageSubmitTransaction apparaît sur HashScan avec toutes les métadonnées de l'ordonnance. Matricule, médicaments, dosages, signature cryptographique du médecin. Tout est ancré pour seulement 0,0003 dollar, 99,7% moins cher qu'Ethereum. Impossible de falsifier, impossible de contrefaire."

### [2:00 - 2:25] Démo 3 : Dispensation pharmacie (25 secondes)
**Contenu visuel** : Pharmacien recherche matricule → Vérifie → Dispense
**Script** :
"À la pharmacie, Mme Thiam entre simplement le matricule de son ordonnance. Le système interroge le Mirror Node Hedera en temps réel pour vérifier l'authenticité. Ordonnance validée : authentique, non utilisée, prescrite par un médecin certifié. Le pharmacien dispense les médicaments et enregistre la dispensation sur la blockchain."

### [2:25 - 2:45] Vérification finale + Re-anchoring (20 secondes)
**Contenu visuel** : Dashboard admin + HashScan montrant toute la chaîne
**Script** :
"Chaque étape est traçable : création du dossier, prescription, dispensation. Notre système utilise la compression zlib, le batching intelligent, et le rate limiting pour optimiser les coûts. En cas d'échec réseau, le re-anchoring automatique avec retry exponentiel garantit un taux de succès de 98,2% sur plus de 500 transactions réelles. Toute la chaîne de soins est sécurisée, du médecin jusqu'au patient."

---

## [2:45 - 3:00] CONCLUSION (15 secondes)
**Objectif** : Impact, Hedera components used, future roadmap

### Contenu visuel suggéré :
- Slide récapitulatif avec métriques
- Services Hedera utilisés : HCS, Mirror Node, Topics 0.0.7070750
- Roadmap visuelle

### Script voix-off :
"FADJMA, par 01 Talent Senegal : une plateforme production-ready de 22 000 lignes de code, utilisant Hedera Consensus Service, Mirror Node API, avec dual account failover. Plus de 500 transactions testnet, 98,2% de succès, finalité en 1,8 secondes. Notre roadmap : migration Hedera Mainnet et pilote dans 3 hôpitaux sénégalais en Q1 2026. FADJMA : sauver des vies par l'innovation blockchain."

---

## PLAN DE TOURNAGE RESTRUCTURÉ

| Timing | Section Hackathon | Contenu à filmer | Élément clé |
|--------|------------------|------------------|-------------|
| 0:00-0:15 | Introduction | Slide titre + problème + track | Nom équipe, défi africain, track |
| 0:15-0:45 | Product Overview | Interface principale 3 acteurs | Value proposition claire |
| 0:45-1:05 | Live Demo 1 | Création dossier médical | Transaction en action |
| 1:05-1:20 | **Mirror Node 1** | **HashScan Topic ID** | **PREUVE BLOCKCHAIN** |
| 1:20-1:45 | Live Demo 2 | Création ordonnance | Transaction en action |
| 1:45-2:00 | **Mirror Node 2** | **HashScan Message ID** | **PREUVE BLOCKCHAIN** |
| 2:00-2:25 | Live Demo 3 | Dispensation pharmacie | Transaction finale |
| 2:25-2:45 | Admin + Chain | Dashboard + re-anchoring | Traçabilité complète |
| 2:45-3:00 | Conclusion | Impact + services + roadmap | Call to action |

---

## CHECKLIST CONFORMITÉ GUIDELINES

✅ **0:00-0:15** : Team name, Problem statement, Hackathon track
✅ **0:15-0:45** : Product overview avec UI principale
✅ **0:45-2:45** : Live working product avec transactions Hedera
✅ **MANDATORY** : Basculer vers Mirror Node Explorer (HashScan) minimum 2 fois
✅ **2:45-3:00** : Impact + Hedera components + Roadmap
✅ **Durée totale** : Exactement 3 minutes

---

## SERVICES HEDERA À MENTIONNER

### Services Hedera Utilisés :
1. **Hedera Consensus Service (HCS)** : Ancrage immuable via TopicMessageSubmitTransaction
2. **Mirror Node API** : Vérification en temps réel via testnet.mirrornode.hedera.com
3. **Topics Déployés** :
   - Topic Principal : 0.0.7070750 (Prescriptions, Records, Deliveries, Access, Batch)
   - Topic Historique : 0.0.6854064
4. **Comptes Hedera** :
   - Compte Principal ECDSA : 0.0.6165611
   - Compte Secondaire (Failover) : 0.0.6089195
5. **aBFT Consensus** : Finalité instantanée en 3-5 secondes

### Optimisations Avancées :
- **Compression zlib** : ~40% de réduction de taille des messages
- **Batching intelligent** : Jusqu'à 50 messages/batch
- **Rate Limiting adaptatif** : 8 TPS avec retry exponentiel (1s, 2s, 4s)
- **Dual Account Support** : Fallback automatique en cas d'erreur

### Métriques Production :
- **500+ transactions** déployées sur Testnet
- **98,2% taux de succès**
- **1,8 secondes** temps moyen d'ancrage
- **$0,000003 USD** coût moyen par transaction (99,7% moins cher qu'Ethereum)

---

## NOTES TECHNIQUES POUR LE MONTAGE

- **Transitions cruciales** : Quand vous montrez une transaction, IMMÉDIATEMENT basculer vers HashScan
- **Son** : Musique de fond professionnelle, voix-off claire et audible
- **Qualité** : Vidéo HD minimum (1080p)
- **Plateforme** : Upload sur YouTube avec lien public
- **Text overlays** : Ajouter les timestamps et labels "HCS Transaction", "Mirror Node Verification" à l'écran
