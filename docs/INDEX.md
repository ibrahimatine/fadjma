# 📚 Documentation FADJMA - Index Complet

**Dernière mise à jour** : Octobre 2025

## 🚀 Démarrage Rapide

| Document | Description | Temps | Audience |
|----------|-------------|-------|----------|
| [README.md](../README.md) | Vue d'ensemble du projet | 5 min | Tous |
| [GETTING_STARTED.md](GETTING_STARTED.md) | Guide complet d'installation | 15-20 min | Développeurs |
| [DOCKER_SETUP.md](DOCKER_SETUP.md) | Déploiement Docker | 5 min | DevOps |
| [fadjma-quickstart.md](fadjma-quickstart.md) | Démarrage ultra-rapide | 10 min | Hackathon |

## 📖 Documentation Technique

### Architecture
| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Architecture globale 3-tiers |
| [fadjma-project-structure.md](fadjma-project-structure.md) | Structure des fichiers |
| [BACKEND_SERVICES_ANALYSIS.md](BACKEND_SERVICES_ANALYSIS.md) | Services backend détaillés |
| [FRONTEND_ADAPTATIONS.md](FRONTEND_ADAPTATIONS.md) | Composants frontend |

### Backend
| Document | Description |
|----------|-------------|
| [backend/API_REFERENCE.md](backend/API_REFERENCE.md) | Référence API complète (80+ endpoints) |
| [backend/BACKEND_DOCUMENTATION.md](backend/BACKEND_DOCUMENTATION.md) | Documentation backend détaillée |

### Frontend
| Document | Description |
|----------|-------------|
| [frontend/FRONTEND_DOCUMENTATION.md](frontend/FRONTEND_DOCUMENTATION.md) | Documentation frontend complète |

## 🔗 Blockchain & Hedera

| Document | Description |
|----------|-------------|
| [HEDERA_INTEGRATION.md](HEDERA_INTEGRATION.md) | Intégration Hedera Hashgraph |
| [ENRICHED_ANCHORING.md](ENRICHED_ANCHORING.md) | Innovation mondiale - Ancrage enrichi v2.0 |
| [HEDERA_OPTIMIZATIONS.md](HEDERA_OPTIMIZATIONS.md) | Optimisations (batching, compression, rate limiting) |
| [PROOF_OF_INTEGRITY.md](PROOF_OF_INTEGRITY.md) | Système de vérification cryptographique |

## 💊 Fonctionnalités Métier

| Document | Description |
|----------|-------------|
| [MATRICULE_SYSTEM.md](MATRICULE_SYSTEM.md) | Système de matricules prescriptions (PRX-*) |
| [README_MATRICULES.md](README_MATRICULES.md) | Guide rapide matricules |
| [GUIDE-UTILISATEUR-IDENTIFIANTS-PATIENTS.md](GUIDE-UTILISATEUR-IDENTIFIANTS-PATIENTS.md) | Identifiants patients (PAT-*) |
| [NOTIFICATIONS_ASSISTANT_FEATURES.md](NOTIFICATIONS_ASSISTANT_FEATURES.md) | Notifications et assistants |

## 🛠️ Installation & Configuration

| Document | Description |
|----------|-------------|
| [GETTING_STARTED.md](GETTING_STARTED.md) | Installation locale complète |
| [DOCKER_SETUP.md](DOCKER_SETUP.md) | Déploiement Docker Compose |
| [fadjma-setup-guide.md](fadjma-setup-guide.md) | Guide de configuration détaillé |
| [INSTALLATION_SQLITE.md](INSTALLATION_SQLITE.md) | Configuration SQLite |

## 📊 Gestion de Projet

| Document | Description |
|----------|-------------|
| [CURRENT_STATUS_SUMMARY.md](CURRENT_STATUS_SUMMARY.md) | État actuel du projet |
| [PROJECT_SCOPE_CLARIFICATION.md](PROJECT_SCOPE_CLARIFICATION.md) | Périmètre et objectifs |
| [PLAN_PHASE_1_Q1_2025.md](PLAN_PHASE_1_Q1_2025.md) | Roadmap Q1 2025 |
| [CAHIER_DES_CHARGES_FADJMA.md](CAHIER_DES_CHARGES_FADJMA.md) | Cahier des charges complet |
| [EXECUTIVE_SUMMARY_CAHIER_DES_CHARGES.md](EXECUTIVE_SUMMARY_CAHIER_DES_CHARGES.md) | Résumé exécutif |

## 🎤 Présentation & Pitch

| Document | Description |
|----------|-------------|
| [fadjma-pitch-guide.md](fadjma-pitch-guide.md) | Guide pour pitcher FADJMA |
| [../FADJMA_PITCH_DECK.tex](../FADJMA_PITCH_DECK.tex) | Pitch deck LaTeX |

## 🔒 Sécurité & Logging

| Document | Description |
|----------|-------------|
| [LOGGING_SYSTEM.md](LOGGING_SYSTEM.md) | Système de logging centralisé |

## 📋 Quick Reference

### Configuration Actuelle

```yaml
Backend:
  Port: 5000
  Database: SQLite (dev) / PostgreSQL (prod)
  Node.js: 18+

Frontend:
  Port: 3000
  Framework: React 18

Hedera:
  Network: Testnet
  Account EC25519: 0.0.6164695
  Account ECDSA: 0.0.6089195
  Topic Principal: 0.0.6854064
  Topics ECDSA: 0.0.7070750
```

### Comptes de Test

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Patient | jean.dupont@demo.com | Demo2024! |
| Médecin | dr.martin@fadjma.com | Demo2024! |
| Pharmacien | pharmacie.centrale@fadjma.com | Demo2024! |
| Admin | admin@fadjma.com | Admin2024! |

### Commandes Essentielles

```bash
# Installation locale
cd backend && npm install && npm run init:sqlite && npm run seed:full && npm start
cd frontend && npm install && npm start

# Docker
docker-compose up -d
docker-compose exec backend npm run init:sqlite
docker-compose exec backend npm run seed:full

# Tests
npm test                 # Tests backend
npm run test:coverage    # Avec couverture

# Scripts utiles
npm run seed:full        # Charger données test
npm run seed:clean       # Nettoyer base
```

### URLs Importantes

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:5000
- **Health Check** : http://localhost:5000/api/health
- **HashScan Topic** : https://hashscan.io/testnet/topic/0.0.6854064
- **HashScan Account** : https://hashscan.io/testnet/account/0.0.6089195

## 🎯 Par Cas d'Usage

### Je veux installer FADJMA
1. [GETTING_STARTED.md](GETTING_STARTED.md) - Installation locale
2. [DOCKER_SETUP.md](DOCKER_SETUP.md) - Installation Docker (recommandé)

### Je veux comprendre l'architecture
1. [ARCHITECTURE.md](ARCHITECTURE.md) - Vue d'ensemble
2. [BACKEND_SERVICES_ANALYSIS.md](BACKEND_SERVICES_ANALYSIS.md) - Services
3. [backend/API_REFERENCE.md](backend/API_REFERENCE.md) - API endpoints

### Je veux développer une fonctionnalité
1. [fadjma-project-structure.md](fadjma-project-structure.md) - Structure
2. [backend/BACKEND_DOCUMENTATION.md](backend/BACKEND_DOCUMENTATION.md) - Backend
3. [frontend/FRONTEND_DOCUMENTATION.md](frontend/FRONTEND_DOCUMENTATION.md) - Frontend

### Je veux comprendre Hedera
1. [HEDERA_INTEGRATION.md](HEDERA_INTEGRATION.md) - Intégration
2. [ENRICHED_ANCHORING.md](ENRICHED_ANCHORING.md) - Innovation
3. [HEDERA_OPTIMIZATIONS.md](HEDERA_OPTIMIZATIONS.md) - Optimisations

### Je prépare une démo/pitch
1. [fadjma-quickstart.md](fadjma-quickstart.md) - Démarrage rapide
2. [fadjma-pitch-guide.md](fadjma-pitch-guide.md) - Guide pitch
3. [CURRENT_STATUS_SUMMARY.md](CURRENT_STATUS_SUMMARY.md) - État actuel

## 📞 Support

Pour toute question :
1. Consulter cette documentation
2. Vérifier les logs : `docker-compose logs -f` ou `npm run dev`
3. Tester avec les comptes de démonstration
4. Consulter le code source commenté

---

**FADJMA** - Saving lives through blockchain innovation 🌍
