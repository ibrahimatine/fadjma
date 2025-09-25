# Système de Matricules pour Prescriptions

## Vue d'ensemble

Le système de matricules permet aux pharmaciens d'accéder à des prescriptions spécifiques sans avoir accès à toutes les ordonnances. Chaque prescription génère automatiquement un matricule unique qui sert de clé d'accès sécurisé.

## Format des Matricules

```
PRX-YYYYMMDD-XXXX
```

- `PRX` : Préfixe fixe pour "Prescription"
- `YYYYMMDD` : Date de création de la prescription
- `XXXX` : Code aléatoire de 4 caractères hexadécimaux (A-F, 0-9)

**Exemple** : `PRX-20240125-A1B2`

## Workflow de Délivrance

### 1. Création de la Prescription (Médecin)
- Le médecin crée une prescription via le système
- Un matricule unique est généré automatiquement
- Le matricule est affiché au médecin pour transmission

### 2. Transmission du Matricule (Patient)
- Le médecin transmet le matricule au patient
- Le patient peut voir son matricule via son dashboard
- Le matricule peut être partagé par différents moyens :
  - Affichage écran
  - Impression sur l'ordonnance
  - QR Code (optionnel)

### 3. Recherche par Matricule (Pharmacien)
- Le pharmacien utilise le dashboard avec recherche par matricule
- Saisie sécurisée avec validation du format en temps réel
- Accès limité à la prescription correspondante uniquement

### 4. Validation et Délivrance
- La pharmacie est automatiquement assignée à la prescription
- Workflow habituel de validation et préparation
- Enregistrement de la délivrance sur Hedera

## Fonctionnalités de Sécurité

### Backend
- **Rate limiting** : Max 50 recherches par IP/15 minutes
- **Validation de format** : Vérification du pattern exact
- **Authentification rôle** : Seules les pharmacies peuvent rechercher
- **Audit logging** : Tous les accès sont journalisés
- **Assignation unique** : Une prescription = une pharmacie
- **Masquage de données** : Réponses sanitizées

### Frontend
- **Validation temps réel** : Format vérifié à la saisie
- **Interface intuitive** : Aide visuelle et messages clairs
- **Gestion d'erreurs** : Messages d'erreur explicites
- **Onglets séparés** : Recherche vs liste complète

## Installation et Migration

### 1. Migration de la Base de Données SQLite

```bash
# Option 1: Script automatique (recommandé)
cd backend
node scripts/setup-matricule-sqlite.js

# Option 2: Migration manuelle
sqlite3 path/to/your/database.db < migrations/add-matricule-to-prescriptions.sql
node scripts/generate-existing-matricules.js

# Vérifier l'état du système
node scripts/setup-matricule-sqlite.js --check
```

**Note SQLite**: Contrairement à PostgreSQL, SQLite ne permet pas d'ajouter des contraintes NOT NULL sur des colonnes existantes. Le champ `matricule` reste donc nullable pour les prescriptions existantes, mais toutes les nouvelles prescriptions auront automatiquement un matricule via le hook `beforeCreate`.

### 2. Dépendances

Installer le package pour le rate limiting :

```bash
cd backend
npm install express-rate-limit
```

## API Endpoints

### GET `/api/pharmacy/by-matricule/:matricule`
Recherche d'une prescription par matricule (pharmaciens uniquement)

**Headers:**
```
Authorization: Bearer <token>
```

**Réponse succès (200):**
```json
{
  "message": "Prescription trouvée avec succès",
  "prescription": {
    "id": "uuid",
    "matricule": "PRX-20240125-A1B2",
    "medication": "Paracétamol",
    "dosage": "500mg",
    "quantity": 30,
    "instructions": "1 comprimé 3x/jour",
    "issueDate": "2024-01-25",
    "deliveryStatus": "pending",
    "patient": {
      "firstName": "Jean",
      "lastName": "Dupont",
      "dateOfBirth": "1980-05-15"
    },
    "doctor": {
      "firstName": "Marie",
      "lastName": "Martin"
    }
  }
}
```

**Erreurs possibles:**
- `400` : Format matricule invalide
- `404` : Matricule non trouvé
- `409` : Prescription déjà délivrée/annulée
- `429` : Trop de tentatives

### GET `/api/pharmacy/prescription/:id/matricule`
Récupération du matricule d'une prescription (médecins et patients)

**Headers:**
```
Authorization: Bearer <token>
```

**Paramètres optionnels:**
- `?qr=true` : Inclure une URL de QR Code

**Réponse succès (200):**
```json
{
  "prescription": {
    "id": "uuid",
    "medication": "Paracétamol",
    "issueDate": "2024-01-25",
    "deliveryStatus": "pending"
  },
  "matricule": {
    "matricule": "PRX-20240125-A1B2",
    "displayText": "Matricule: PRX-20240125-A1B2",
    "instructions": {
      "fr": [
        "Communiquez ce matricule à votre pharmacien",
        "Le pharmacien utilisera ce code pour accéder à votre ordonnance"
      ]
    },
    "qrCode": "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PRX-20240125-A1B2",
    "expirationDate": "2024-02-24"
  }
}
```

## Interface Utilisateur

### Dashboard Pharmacien
1. **Onglet "Recherche par matricule"**
   - Champ de saisie avec validation temps réel
   - Aide visuelle pour le format
   - Gestion d'erreurs contextuelles

2. **Onglet "Toutes les prescriptions"**
   - Liste des prescriptions assignées à la pharmacie
   - Fonctions de recherche et filtrage habituelles

3. **Affichage des résultats**
   - Prescription trouvée mise en évidence
   - Actions disponibles selon le statut
   - Bouton retour pour nouvelle recherche

### Dashboard Médecin/Patient
- Affichage du matricule sur chaque prescription
- Instructions de partage contextuelles
- Option QR Code pour faciliter la transmission

## Logs et Audit

Tous les événements sont journalisés dans les logs applicatifs :

- Génération de matricule
- Tentatives de recherche (succès/échec)
- Accès aux prescriptions
- Assignation des pharmacies
- Erreurs et tentatives malveillantes

Format des logs :
```
[timestamp] INFO: Accès à la prescription <id> (matricule: <matricule>) par la pharmacie <pharmacyId>
```

## Sécurité et Bonnes Pratiques

### Pour les Médecins
- Transmettre le matricule de façon sécurisée
- Vérifier que le patient a bien reçu le matricule
- Ne pas afficher le matricule sur des documents non sécurisés

### Pour les Patients
- Garder le matricule confidentiel
- Le communiquer uniquement à la pharmacie choisie
- Signaler toute utilisation suspecte

### Pour les Pharmaciens
- Demander une pièce d'identité pour confirmer l'identité
- Vérifier la cohérence des informations patient
- Respecter la confidentialité des données

## Monitoring et Maintenance

- Surveiller les logs pour détecter des tentatives d'abus
- Analyser les patterns de recherche pour optimiser l'UX
- Nettoyer périodiquement les prescriptions expirées
- Maintenir les statistiques d'usage pour le reporting

## Évolutions Futures

- QR Code intégré avec lecteur mobile
- Notifications push pour le pharmacien
- Intégration avec les systèmes de pharmacie existants
- API pour les applications tierces
- Système de récupération de matricule oublié