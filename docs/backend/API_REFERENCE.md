# Référence API - FADJMA Backend

## Vue d'ensemble

L'API FADJMA est une API REST qui fournit des endpoints sécurisés pour la gestion des dossiers médicaux, utilisateurs et autorisations.

**Base URL :** `http://localhost:3001/api`

## Authentification

### Headers Requis

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Obtenir un Token

```http
POST /auth/login
```

## Format des Réponses

### Succès

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Données de réponse
  },
  "pagination": {  // Optionnel pour les listes
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Erreur

```json
{
  "success": false,
  "error": true,
  "message": "Error description",
  "validationErrors": [  // Optionnel
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

## Endpoints d'Authentification

### POST /auth/register

Inscription d'un nouvel utilisateur.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "patient", // "patient" | "doctor" | "pharmacy"

  // Champs conditionnels selon le rôle

  // Pour patients (optionnel)
  "dateOfBirth": "1990-01-01",
  "gender": "male", // "male" | "female" | "other"

  // Pour médecins (requis)
  "licenseNumber": "DOC123456",
  "specialty": "Cardiology",
  "hospital": "City Hospital",
  "phoneNumber": "+221123456789",

  // Pour pharmacies (requis)
  "licenseNumber": "PHARM123456",
  "pharmacyName": "Central Pharmacy",
  "pharmacyAddress": "123 Main Street, Dakar",
  "phoneNumber": "+221123456789"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "patient",
      "isActive": true
    },
    "token": "jwt.token.here"
  }
}
```

### POST /auth/login

Connexion utilisateur.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "patient",
      "profile": {
        // Données du profil selon le rôle
      }
    },
    "token": "jwt.token.here"
  }
}
```

### GET /auth/me

Obtenir le profil de l'utilisateur connecté.

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "patient",
      "profile": {
        // Profil détaillé
      }
    }
  }
}
```

### POST /auth/logout

Déconnexion (invalidation du token).

**Response 200:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Endpoints Identifiants Patients

### GET /auth/verify-patient-identifier/:identifier

Vérifier un identifiant patient (endpoint public).

**Params:**
- `identifier`: Identifiant patient (format: PAT-YYYYMMDD-XXXX)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-01-01",
    "patientIdentifier": "PAT-20241127-A1B2"
  }
}
```

### POST /auth/link-patient-identifier

Lier un identifiant patient à un compte (endpoint public).

**Body:**
```json
{
  "patientIdentifier": "PAT-20241127-A1B2",
  "email": "patient@example.com",
  "password": "SecurePassword123!",
  "phoneNumber": "+221123456789" // Optionnel
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Account linked successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "patient@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "isUnclaimed": false
    }
  }
}
```

## Endpoints Patients

### GET /patients

Lister tous les patients (médecins et admins uniquement).

**Query Parameters:**
- `page`: Numéro de page (défaut: 1)
- `limit`: Nombre d'éléments par page (défaut: 10, max: 100)
- `search`: Terme de recherche (nom, email, téléphone)

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phoneNumber": "+221123456789"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### GET /patients/accessible-patients

Lister les patients accessibles par le médecin connecté.

**Query Parameters:**
- `search`: Terme de recherche

**Response 200:**
```json
{
  "success": true,
  "data": {
    "patients": [
      {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "isUnclaimed": false,
        "accessType": "creator", // "creator" | "request"
        "accessLevel": "write",
        "accessGrantedAt": "2024-01-01T10:00:00Z"
      }
    ],
    "total": 5
  }
}
```

### GET /patients/:id

Obtenir les détails d'un patient.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "dateOfBirth": "1990-01-01",
    "gender": "male",
    "phoneNumber": "+221123456789",
    "emergencyContactName": "Jane Doe",
    "emergencyContactPhone": "+221987654321",
    "isUnclaimed": false,
    "patientIdentifier": "PAT-20241127-A1B2"
  }
}
```

### POST /patients/unclaimed

Créer un profil patient non réclamé (médecins uniquement).

**Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-01",
  "gender": "male",
  "emergencyContactName": "Jane Doe",
  "emergencyContactPhone": "+221987654321",
  "socialSecurityNumber": "123456789" // Optionnel
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Unclaimed patient created successfully",
  "data": {
    "patient": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "patientIdentifier": "PAT-20241127-A1B2",
      "status": "unclaimed",
      "createdAt": "2024-01-01T10:00:00Z"
    }
  }
}
```

### GET /patients/unclaimed/my

Lister les patients non réclamés créés par le médecin.

**Query Parameters:**
- `page`: Numéro de page
- `limit`: Éléments par page

**Response 200:**
```json
{
  "success": true,
  "data": {
    "patients": [
      {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe",
        "patientIdentifier": "PAT-20241127-A1B2",
        "status": "unclaimed",
        "createdAt": "2024-01-01T10:00:00Z"
      }
    ],
    "total": 3,
    "page": 1,
    "totalPages": 1
  }
}
```

## Endpoints Dossiers Médicaux

### GET /records

Lister les dossiers médicaux.

**Query Parameters:**
- `page`: Numéro de page
- `limit`: Éléments par page
- `patientId`: ID du patient (pour filtrer)
- `type`: Type de dossier

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Consultation générale",
      "category": "consultation",
      "createdAt": "2024-01-01T10:00:00Z",
      "patient": {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe"
      },
      "doctor": {
        "id": "uuid",
        "firstName": "Dr. Jane",
        "lastName": "Smith"
      },
      "isPublic": false,
      "hash": "sha256hash",
      "hederaTransactionId": "0.0.123456@1234567890.123456789"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### GET /records/:id

Obtenir les détails d'un dossier médical.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Consultation générale",
    "content": "Contenu détaillé du dossier médical...",
    "category": "consultation",
    "isPublic": false,
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-01T10:00:00Z",
    "patient": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe"
    },
    "doctor": {
      "id": "uuid",
      "firstName": "Dr. Jane",
      "lastName": "Smith"
    },
    "hash": "sha256hash",
    "hederaTransactionId": "0.0.123456@1234567890.123456789",
    "hederaTimestamp": "2024-01-01T10:00:00Z"
  }
}
```

### POST /records

Créer un nouveau dossier médical.

**Body:**
```json
{
  "patientId": "uuid",
  "title": "Consultation générale",
  "content": "Contenu détaillé du dossier...",
  "category": "consultation", // "consultation" | "treatment" | "diagnosis" | "lab_result"
  "isPublic": false,
  "medications": [ // Optionnel
    {
      "name": "Paracetamol",
      "dosage": "500mg",
      "frequency": "3 fois par jour",
      "duration": "7 jours"
    }
  ]
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Medical record created successfully",
  "data": {
    "record": {
      "id": "uuid",
      "title": "Consultation générale",
      "category": "consultation",
      "createdAt": "2024-01-01T10:00:00Z",
      "hash": "sha256hash",
      "hederaTransactionId": "0.0.123456@1234567890.123456789"
    }
  }
}
```

### PUT /records/:id

Modifier un dossier médical.

**Body:**
```json
{
  "title": "Titre modifié",
  "content": "Contenu modifié...",
  "category": "treatment"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Medical record updated successfully",
  "data": {
    "record": {
      "id": "uuid",
      "title": "Titre modifié",
      "updatedAt": "2024-01-01T11:00:00Z"
    }
  }
}
```

### DELETE /records/:id

Supprimer un dossier médical.

**Response 200:**
```json
{
  "success": true,
  "message": "Medical record deleted successfully"
}
```

## Endpoints Demandes d'Accès

### GET /access-requests

Lister les demandes d'accès.

**Query Parameters:**
- `status`: Statut des demandes ("pending" | "approved" | "denied")
- `patientId`: ID du patient

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "status": "pending",
      "accessLevel": "read",
      "reason": "Consultation médicale",
      "createdAt": "2024-01-01T10:00:00Z",
      "expiresAt": "2024-12-31T23:59:59Z",
      "patient": {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe"
      },
      "requester": {
        "id": "uuid",
        "firstName": "Dr. Jane",
        "lastName": "Smith"
      }
    }
  ]
}
```

### POST /access-requests

Créer une demande d'accès.

**Body:**
```json
{
  "patientId": "uuid",
  "accessLevel": "read", // "read" | "write"
  "reason": "Consultation médicale",
  "expiresAt": "2024-12-31T23:59:59Z" // Optionnel
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Access request created successfully",
  "data": {
    "request": {
      "id": "uuid",
      "status": "pending",
      "accessLevel": "read",
      "createdAt": "2024-01-01T10:00:00Z"
    }
  }
}
```

### PUT /access-requests/:id

Modifier le statut d'une demande d'accès.

**Body:**
```json
{
  "status": "approved", // "approved" | "denied"
  "reviewComment": "Accès approuvé pour consultation"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Access request updated successfully",
  "data": {
    "request": {
      "id": "uuid",
      "status": "approved",
      "reviewedAt": "2024-01-01T11:00:00Z",
      "reviewedBy": "uuid"
    }
  }
}
```

## Endpoints Pharmacie

### GET /pharmacy/prescriptions

Lister les ordonnances pour la pharmacie.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "matricule": "PRX-20241127-A1B2",
      "status": "pending",
      "medications": [
        {
          "name": "Paracetamol",
          "dosage": "500mg",
          "quantity": "20 comprimés"
        }
      ],
      "issueDate": "2024-01-01",
      "expirationDate": "2024-01-31",
      "patient": {
        "firstName": "John",
        "lastName": "Doe"
      },
      "doctor": {
        "firstName": "Dr. Jane",
        "lastName": "Smith"
      }
    }
  ]
}
```

### POST /pharmacy/prescriptions/:id/dispense

Marquer une ordonnance comme délivrée.

**Response 200:**
```json
{
  "success": true,
  "message": "Prescription dispensed successfully",
  "data": {
    "prescription": {
      "id": "uuid",
      "status": "dispensed",
      "dispensedAt": "2024-01-01T10:00:00Z"
    }
  }
}
```

## Endpoints Administration

### GET /admin/users

Lister tous les utilisateurs (admins uniquement).

**Query Parameters:**
- `role`: Filtrer par rôle
- `status`: Filtrer par statut ("active" | "inactive")
- `search`: Recherche

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "patient",
      "isActive": true,
      "createdAt": "2024-01-01T10:00:00Z"
    }
  ]
}
```

### PUT /admin/users/:id/status

Modifier le statut d'un utilisateur.

**Body:**
```json
{
  "isActive": false,
  "reason": "Account suspended for violation"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "User status updated successfully"
}
```

## Codes d'Erreur

### Codes HTTP Standards

- **200** : Succès
- **201** : Créé avec succès
- **400** : Erreur de validation
- **401** : Non authentifié
- **403** : Non autorisé
- **404** : Ressource non trouvée
- **422** : Erreur de traitement
- **429** : Trop de requêtes (rate limiting)
- **500** : Erreur serveur

### Messages d'Erreur Communs

```json
// Token manquant
{
  "success": false,
  "message": "No token provided"
}

// Token invalide
{
  "success": false,
  "message": "Invalid token"
}

// Token expiré
{
  "success": false,
  "message": "Token expired"
}

// Accès interdit
{
  "success": false,
  "message": "Forbidden: You do not have access to this resource"
}

// Validation échouée
{
  "success": false,
  "message": "Validation failed",
  "validationErrors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}

// Rate limiting
{
  "error": "Too many requests, please try again later",
  "retryAfter": "15 minutes"
}
```

## Rate Limiting

### Limites par Endpoint

- **Login** : 5 tentatives par 15 minutes par IP
- **Registration** : 3 inscriptions par heure par IP
- **API générale** : 1000 requêtes par 15 minutes par IP
- **Patient creation** : 10 créations par heure par utilisateur

### Headers de Rate Limiting

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Webhooks et WebSockets

### Événements WebSocket

```javascript
// Côté client
socket.on('newMedicalRecord', (data) => {
  // Nouveau dossier médical
});

socket.on('accessRequestUpdate', (data) => {
  // Mise à jour demande d'accès
});

socket.on('systemNotification', (data) => {
  // Notification système
});
```

## Exemples d'Usage

### Workflow Complet d'Authentification

```javascript
// 1. Inscription
const registerResponse = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'doctor@example.com',
    password: 'SecurePassword123!',
    firstName: 'Dr. Jane',
    lastName: 'Smith',
    role: 'doctor',
    licenseNumber: 'DOC123456',
    specialty: 'Cardiology',
    hospital: 'City Hospital'
  })
});

// 2. Connexion
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'doctor@example.com',
    password: 'SecurePassword123!'
  })
});

const { token } = await loginResponse.json();

// 3. Utilisation du token
const recordsResponse = await fetch('/api/records', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### Création d'un Patient Non Réclamé

```javascript
// Créer le profil patient
const createPatientResponse = await fetch('/api/patients/unclaimed', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${doctorToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1990-01-01',
    gender: 'male'
  })
});

const { patient } = await createPatientResponse.json();
console.log('Identifiant patient:', patient.patientIdentifier);

// Le patient peut maintenant utiliser cet identifiant
// pour créer son compte via /auth/link-patient-identifier
```

---

Cette API suit les standards REST et fournit une interface complète pour toutes les fonctionnalités de la plateforme FADJMA.