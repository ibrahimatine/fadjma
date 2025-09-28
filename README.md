# Documentation FADJMA - Plateforme Médicale Blockchain

## Vue d'ensemble

FADJMA est une plateforme médicale innovante utilisant la blockchain Hedera pour garantir l'intégrité et la traçabilité des dossiers médicaux au Sénégal.

## Architecture du Projet

```
fadjma/
├── backend/           # API Node.js + Express + Sequelize
├── frontend/          # Application React + TailwindCSS
├── docs/             # Documentation complète
└── scripts/          # Scripts d'automatisation
```

## Structure de la Documentation

### 📖 Documentation Générale
- [**README.md**](./README.md) - Ce fichier (vue d'ensemble)
- [**GETTING_STARTED.md**](./docs/GETTING_STARTED.md) - Guide de démarrage rapide
- [**ARCHITECTURE.md**](./docs/ARCHITECTURE.md) - Architecture technique globale
- [**DEPLOYMENT.md**](./docs/DEPLOYMENT.md) - Guide de déploiement
- [**SECURITY.md**](./docs/SECURITY.md) - Sécurité et bonnes pratiques

### 🔧 Documentation Backend
- [**API_REFERENCE.md**](./docs/backend/API_REFERENCE.md) - Référence complète de l'API
- [**LOGGING_SYSTEM.md**](./docs/LOGGING_SYSTEM.md) - Système de logging centralisé
- [**ENRICHED_ANCHORING.md**](./docs/ENRICHED_ANCHORING.md) - Innovation mondiale ancrage blockchain
- [**MATRICULE_SYSTEM.md**](./docs/MATRICULE_SYSTEM.md) - Système de traçabilité prescriptions
- [**DATABASE.md**](./docs/backend/DATABASE.md) - Schéma et modèles de données
- [**SERVICES.md**](./docs/backend/SERVICES.md) - Services et logique métier
- [**AUTHENTICATION.md**](./docs/backend/AUTHENTICATION.md) - Système d'authentification
- [**PATIENT_IDENTIFIERS.md**](./docs/GUIDE-UTILISATEUR-IDENTIFIANTS-PATIENTS.md) - Système d'identifiants patients
- [**TESTING.md**](./docs/backend/TESTING.md) - Guide des tests
- [**CONFIGURATION.md**](./docs/backend/CONFIGURATION.md) - Configuration et variables

### 🎨 Documentation Frontend
- [**COMPONENTS.md**](./docs/frontend/COMPONENTS.md) - Catalogue des composants
- [**PAGES.md**](./docs/frontend/PAGES.md) - Structure des pages
- [**STATE_MANAGEMENT.md**](./docs/frontend/STATE_MANAGEMENT.md) - Gestion d'état
- [**ROUTING.md**](./docs/frontend/ROUTING.md) - Système de navigation
- [**STYLING.md**](./docs/frontend/STYLING.md) - Guide de style et UI/UX
- [**FORMS.md**](./docs/frontend/FORMS.md) - Gestion des formulaires
- [**WEBSOCKETS.md**](./docs/frontend/WEBSOCKETS.md) - Communication temps réel

### 🔗 Documentation Intégration
- [**HEDERA.md**](./docs/HEDERA_INTEGRATION.md) - Intégration blockchain Hedera
- [**WEBSOCKETS.md**](./docs/WEBSOCKETS.md) - Communication temps réel
- [**API_INTEGRATION.md**](./docs/API_INTEGRATION.md) - Intégration Frontend-Backend

### 🔒 Documentation Sécurité
- [**AUTHENTICATION.md**](./docs/security/AUTHENTICATION.md) - Authentification et autorisation
- [**DATA_PROTECTION.md**](./docs/security/DATA_PROTECTION.md) - Protection des données
- [**AUDIT.md**](./docs/security/AUDIT.md) - Audit et monitoring

## Fonctionnalités Principales

### 👥 Gestion des Utilisateurs
- **Patients** : Accès à leurs dossiers médicaux
- **Médecins** : Création et consultation de dossiers
- **Pharmacies** : Vérification des ordonnances
- **Administrateurs** : Gestion de la plateforme

### 📋 Dossiers Médicaux
- Création et modification sécurisées
- Stockage sur blockchain Hedera
- Contrôle d'accès granulaire
- Historique complet des modifications

### 🔐 Sécurité
- Authentification JWT
- Autorisation basée sur les rôles
- Chiffrement des données sensibles
- Audit complet des actions

### 📊 Identifiants Patients
- Génération automatique d'identifiants uniques
- Système de liaison de comptes
- Workflow médecin → patient
- Validation et sécurité renforcées

## Technologies Utilisées

### Backend
- **Runtime** : Node.js 18+
- **Framework** : Express.js
- **Base de données** : SQLite + Sequelize ORM
- **Authentification** : JWT + bcrypt
- **Blockchain** : Hedera Hashgraph SDK
- **WebSockets** : Socket.io
- **Tests** : Jest + Supertest

### Frontend
- **Framework** : React 18+
- **Styling** : TailwindCSS
- **Routing** : React Router v6
- **Forms** : React Hook Form
- **State** : Context API + useState/useEffect
- **Icons** : Lucide React
- **Notifications** : React Hot Toast

### DevOps & Outils
- **Package Manager** : npm
- **Linting** : ESLint (optionnel)
- **Testing** : Jest
- **Documentation** : Markdown
- **Version Control** : Git

## Statuts des Fonctionnalités

| Fonctionnalité | Backend | Frontend | Tests | Statut |
|---------------|---------|----------|-------|--------|
| Authentification | ✅ | ✅ | ✅ | Complet |
| Gestion Patients | ✅ | ✅ | ✅ | Complet |
| Identifiants Patients | ✅ | ✅ | ✅ | Complet |
| Dossiers Médicaux | ✅ | ✅ | ✅ | Complet |
| **Ancrage Enrichi V2.0** | ✅ | ✅ | ✅ | **Innovation Mondiale** |
| WebSockets | ✅ | ✅ | ✅ | Complet |
| Intégration Hedera | ✅ | ✅ | ✅ | Complet |
| Prescriptions/Traçabilité | ✅ | ✅ | ✅ | Complet |
| Dashboard Admin | ✅ | ✅ | ✅ | Complet |
| Logging & Monitoring | ✅ | ✅ | ✅ | Complet |

**Légende :** ✅ Complet | ⚠️ Partiel | ❌ À faire

### 🆕 **Fonctionnalités Avancées Récentes**
- ✅ **Ancrage Enrichi Version 2.0** - Premier système mondial d'ancrage complet de données médicales
- ✅ **Support 12+ Types Consultations** - Classification intelligente automatique
- ✅ **Système de Logging Centralisé** - Traçabilité complète des activités
- ✅ **Monitoring Temps Réel** - Dashboard AdminMonitoring pour supervision
- ✅ **Gestion d'Erreurs Robuste** - Retry logic et timeout pour Hedera
- ✅ **Matricules Uniques Prescription** - Traçabilité pharmaceutique révolutionnaire

## Démarrage Rapide

### Prérequis
```bash
# Node.js 18+
node --version

# PostgreSQL 13+
psql --version

# Git
git --version
```

### Installation
```bash
# Cloner le projet
git clone [repository-url]
cd fadjma

# Backend
cd backend
npm install
cp .env.example .env
# Configurer .env avec vos variables
npm run init:sqlite  # ou setup PostgreSQL
npm start

# Frontend (nouveau terminal)
cd ../frontend
npm install
npm start
```

### Accès à l'Application
- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:3001
- **Documentation API** : http://localhost:3001/api-docs (si configuré)

## Guides de Contribution

### Pour les Développeurs
1. Lire [GETTING_STARTED.md](./docs/GETTING_STARTED.md)
2. Consulter [ARCHITECTURE.md](.docs/ARCHITECTURE.md)
3. Suivre les guides spécifiques backend/frontend
4. Respecter les conventions de code

### Pour les Testeurs
1. Consulter [TESTING.md](./docs/backend/TESTING.md)
2. Utiliser les comptes de démonstration
3. Tester les workflows complets
4. Rapporter les bugs avec détails

### Pour les Déployeurs
1. Lire [DEPLOYMENT.md](./docs/DEPLOYMENT.md)
2. Configurer l'environnement de production
3. Suivre les procédures de sécurité
4. Mettre en place le monitoring

## Support et Contact

### Documentation
- Consulter les fichiers de documentation appropriés
- Vérifier les exemples de code fournis
- Utiliser les utilitaires et helpers disponibles

### Développement
- Utiliser les outils de debugging intégrés
- Consulter les logs détaillés
- Tester avec les données de démonstration

### Production
- Suivre les guides de déploiement
- Configurer le monitoring et les alertes
- Appliquer les mises à jour de sécurité

## Roadmap

### Version Actuelle (v2.0) - Septembre 2025
- ✅ Authentification et autorisation complète
- ✅ Gestion des patients et identifiants
- ✅ Dossiers médicaux avec ancrage enrichi
- ✅ Interface utilisateur complète et optimisée
- ✅ **Ancrage Enrichi V2.0** - Innovation mondiale
- ✅ Intégration Hedera complète avec retry logic
- ✅ Prescriptions et traçabilité matricules uniques
- ✅ Dashboard administrateur avancé avec monitoring
- ✅ Tests automatisés et système de logging
- ✅ Support 12+ types consultations médicales

### Version 2.1 (Q1 2026)
- 🔄 Migration Hedera Mainnet (si nécessaire)
- 🔄 Smart contracts pour logique métier avancée
- 🔄 Optimisation coûts avec batch processing

### Version 2.2 (Q2 2026)
- 📋 Rapports et analytics avancés
- 📋 API publique HL7 FHIR
- 📋 Mobile app companion
- 📋 Intégrations systèmes tiers

### Version 3.0 (Q3 2026)
- 📋 Architecture microservices
- 📋 Multi-tenancy pour hôpitaux
- 📋 Intelligence artificielle médicale
- 📋 Conformité internationale (GDPR/HIPAA)

---

## Licence et Légal

Ce projet est développé pour la digitalisation du système de santé sénégalais.

**Dernière mise à jour :** $(date)
**Version de la documentation :** 1.0
**Statut :** ✅ Production Ready