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
- [**GETTING_STARTED.md**](./GETTING_STARTED.md) - Guide de démarrage rapide
- [**ARCHITECTURE.md**](./ARCHITECTURE.md) - Architecture technique globale
- [**DEPLOYMENT.md**](./DEPLOYMENT.md) - Guide de déploiement
- [**SECURITY.md**](./SECURITY.md) - Sécurité et bonnes pratiques

### 🔧 Documentation Backend
- [**backend/API_REFERENCE.md**](./backend/API_REFERENCE.md) - Référence complète de l'API
- [**backend/DATABASE.md**](./backend/DATABASE.md) - Schéma et modèles de données
- [**backend/SERVICES.md**](./backend/SERVICES.md) - Services et logique métier
- [**backend/AUTHENTICATION.md**](./backend/AUTHENTICATION.md) - Système d'authentification
- [**backend/PATIENT_IDENTIFIERS.md**](./backend/PATIENT_IDENTIFIERS.md) - Système d'identifiants patients
- [**backend/TESTING.md**](./backend/TESTING.md) - Guide des tests
- [**backend/CONFIGURATION.md**](./backend/CONFIGURATION.md) - Configuration et variables

### 🎨 Documentation Frontend
- [**frontend/COMPONENTS.md**](./frontend/COMPONENTS.md) - Catalogue des composants
- [**frontend/PAGES.md**](./frontend/PAGES.md) - Structure des pages
- [**frontend/STATE_MANAGEMENT.md**](./frontend/STATE_MANAGEMENT.md) - Gestion d'état
- [**frontend/ROUTING.md**](./frontend/ROUTING.md) - Système de navigation
- [**frontend/STYLING.md**](./frontend/STYLING.md) - Guide de style et UI/UX
- [**frontend/FORMS.md**](./frontend/FORMS.md) - Gestion des formulaires
- [**frontend/WEBSOCKETS.md**](./frontend/WEBSOCKETS.md) - Communication temps réel

### 🔗 Documentation Intégration
- [**integration/HEDERA.md**](./integration/HEDERA.md) - Intégration blockchain Hedera
- [**integration/WEBSOCKETS.md**](./integration/WEBSOCKETS.md) - Communication temps réel
- [**integration/API_INTEGRATION.md**](./integration/API_INTEGRATION.md) - Intégration Frontend-Backend

### 🔒 Documentation Sécurité
- [**security/AUTHENTICATION.md**](./security/AUTHENTICATION.md) - Authentification et autorisation
- [**security/DATA_PROTECTION.md**](./security/DATA_PROTECTION.md) - Protection des données
- [**security/AUDIT.md**](./security/AUDIT.md) - Audit et monitoring

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
- **Base de données** : PostgreSQL + Sequelize ORM
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
| Dossiers Médicaux | ✅ | ✅ | ⚠️ | Fonctionnel |
| WebSockets | ✅ | ✅ | ⚠️ | Fonctionnel |
| Intégration Hedera | ✅ | ⚠️ | ⚠️ | En cours |
| Ordonnances | ✅ | ⚠️ | ⚠️ | En cours |
| Dashboard Admin | ✅ | ⚠️ | ❌ | Partiel |

**Légende :** ✅ Complet | ⚠️ Partiel | ❌ À faire

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
1. Lire [GETTING_STARTED.md](./GETTING_STARTED.md)
2. Consulter [ARCHITECTURE.md](./ARCHITECTURE.md)
3. Suivre les guides spécifiques backend/frontend
4. Respecter les conventions de code

### Pour les Testeurs
1. Consulter [backend/TESTING.md](./backend/TESTING.md)
2. Utiliser les comptes de démonstration
3. Tester les workflows complets
4. Rapporter les bugs avec détails

### Pour les Déployeurs
1. Lire [DEPLOYMENT.md](./DEPLOYMENT.md)
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

### Version Actuelle (v1.0)
- ✅ Authentification et autorisation
- ✅ Gestion des patients et identifiants
- ✅ Dossiers médicaux de base
- ✅ Interface utilisateur complète

### Version 1.1 (Q1 2025)
- 🔄 Intégration Hedera complète
- 🔄 Ordonnances et traçabilité
- 🔄 Dashboard administrateur avancé
- 🔄 Tests automatisés complets

### Version 1.2 (Q2 2025)
- 📋 Rapports et analytics
- 📋 API publique documentée
- 📋 Mobile app companion
- 📋 Intégrations tiers

### Version 2.0 (Q3 2025)
- 📋 Architecture microservices
- 📋 Multi-tenancy
- 📋 Intelligence artificielle
- 📋 Conformité internationale

---

## Licence et Légal

Ce projet est développé pour la digitalisation du système de santé sénégalais.

**Dernière mise à jour :** $(date)
**Version de la documentation :** 1.0
**Statut :** ✅ Production Ready