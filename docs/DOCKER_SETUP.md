# 🐳 Guide de Déploiement Docker - FADJMA

## Vue d'ensemble

FADJMA supporte le déploiement via Docker Compose avec les services suivants :
- **Backend** : API Node.js + Express + Hedera + SQLite
- **Frontend** : React SPA

**Base de données** : SQLite (fichier persistant dans un volume Docker)

## Prérequis

```bash
# Docker & Docker Compose
docker --version  # >= 20.10
docker-compose --version  # >= 1.29

# Git
git --version
```

## Installation Rapide (5 minutes)

### 1. Cloner le projet

```bash
git clone [URL_DU_REPOSITORY]
cd fadjma
```

### 2. Configurer les variables d'environnement

Créez un fichier `.env` à la racine du projet :

```env
# Node Environment
NODE_ENV=production

# Server Configuration
PORT=5000

# Verification Mode
USE_MIRROR_NODE=false

# Database - SQLite (No configuration needed!)
# Database file will be created automatically in /app/data/database.sqlite
# and persisted in the 'fadjma-backend-data' Docker volume

# JWT Configuration
JWT_SECRET=votre-secret-jwt-super-securise-changez-moi
JWT_EXPIRE=7d

# Hedera EC25519 (Primary Account)
HEDERA_ECDSA_ACCOUNT_ID=0.0.XXXXXXX
HEDERA_ECDSA_PRIVATE_KEY=302e020100300506032b657004220420XXXXXX
HEDERA_TOPIC_ID=0.0.XXXXXXX
HEDERA_NETWORK=testnet

# Hedera ECDSA (Secondary Account)
HEDERA_ECDSA_ACCOUNT_ID=0.0.XXXXXXX
HEDERA_ECDSA_PRIVATE_KEY=3030020100300706052b8104000a0422042XXXXXX
HEDERA_ECDSA_TOPIC_ID=0.0.XXXXXXX

# CORS
FRONTEND_URL=http://localhost:3000

# KMS Configuration
KMS_PROVIDER=env

# Hedera Batching
HEDERA_USE_BATCHING=false
HEDERA_MAX_BATCH_SIZE=50
HEDERA_MIN_BATCH_SIZE=10
HEDERA_BATCH_TIMEOUT_MS=300000

# Hedera Compression
HEDERA_USE_COMPRESSION=true
HEDERA_COMPRESSION_ENABLED=true
HEDERA_MIN_COMPRESSION_SIZE=100

# Rate Limiter
HEDERA_MAX_TPS=8
HEDERA_RATE_LIMITER_ENABLED=true

# Multi-Topics Configuration
HEDERA_TOPIC_PRESCRIPTIONS=0.0.XXXXXXX
HEDERA_TOPIC_RECORDS=0.0.XXXXXXX
HEDERA_TOPIC_DELIVERIES=0.0.XXXXXXX
HEDERA_TOPIC_ACCESS=0.0.XXXXXXX
HEDERA_TOPIC_BATCH=0.0.XXXXXXX
```

### 3. Démarrer les services

```bash
# Build et démarrage de tous les services
docker-compose up -d

# Vérifier que tout fonctionne
docker-compose ps
```

**Résultat attendu :**
```
NAME                SERVICE    STATUS
fadjma-backend      backend    running (healthy)
fadjma-frontend     frontend   running (healthy)
```

### 4. Initialiser la base de données

```bash
# Accéder au conteneur backend
docker-compose exec backend sh

# Initialiser la base SQLite
npm run init:sqlite

# Charger les données de test
npm run seed:full

# Sortir du conteneur
exit
```

### 5. Accéder à l'application

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:5000
- **SQLite Database** : Fichier persistant dans le volume `fadjma-backend-data`

## Architecture Docker

### Services

#### Backend (Node.js)
```yaml
Ports: 5000:5000
Image: node:18-alpine
Dépendances: postgresql-client, sqlite
Volumes:
  - backend-data:/app/data (SQLite)
  - backend-logs:/app/logs
  - backend-uploads:/app/uploads
Health Check: GET /api/health
```

#### Frontend (React)
```yaml
Ports: 3000:3000
Image: node:18-alpine
Dépend de: backend (service_healthy)
Health Check: wget http://localhost:3000
```

#### PostgreSQL
```yaml
Ports: 5432:5432
Image: postgres:15-alpine
Volumes: postgres-data:/var/lib/postgresql/data
Environment:
  - POSTGRES_DB=${DB_NAME}
  - POSTGRES_USER=${DB_USER}
  - POSTGRES_PASSWORD=${DB_PASSWORD}
Health Check: pg_isready
```

### Réseau

Tous les services communiquent via le réseau `fadjma-network` (bridge).

## Commandes Docker Utiles

### Gestion des conteneurs

```bash
# Démarrer les services
docker-compose up -d

# Arrêter les services
docker-compose down

# Redémarrer un service
docker-compose restart backend

# Voir les logs
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f frontend

# Voir l'état des services
docker-compose ps

# Reconstruire les images
docker-compose build
docker-compose up -d --build
```

### Accès aux conteneurs

```bash
# Shell dans le backend
docker-compose exec backend sh

# Accéder à SQLite dans le conteneur
docker-compose exec backend sqlite3 /app/data/database.sqlite

# Exécuter une commande dans le backend
docker-compose exec backend npm run seed

# Inspecter la base de données SQLite
docker-compose exec backend sqlite3 /app/data/database.sqlite ".tables"
docker-compose exec backend sqlite3 /app/data/database.sqlite "SELECT * FROM BaseUsers LIMIT 5;"
```

### Gestion des volumes

```bash
# Lister les volumes
docker volume ls | grep fadjma

# Inspecter un volume
docker volume inspect fadjma-postgres-data

# Supprimer tous les volumes (ATTENTION: perte de données)
docker-compose down -v
```

### Nettoyage

```bash
# Arrêter et supprimer les conteneurs
docker-compose down

# Supprimer aussi les volumes
docker-compose down -v

# Supprimer les images
docker-compose down --rmi all

# Nettoyage complet du système Docker
docker system prune -a --volumes
```

## Environnements de Déploiement

### Développement (Local)

```bash
# .env
NODE_ENV=development
DB_HOST=localhost  # Si vous n'utilisez pas Docker
# OU
DB_HOST=postgres   # Si vous utilisez Docker

# Lancer avec SQLite
npm run init:sqlite
npm run dev
```

### Staging/Production (Docker)

```env
# .env
NODE_ENV=production
DB_HOST=postgres
DB_PASSWORD=MotDePasseSecuriseComplexe!
HEDERA_NETWORK=mainnet  # Passer en mainnet pour la production
USE_MIRROR_NODE=true    # Activer la vérification Mirror Node
```

```bash
# Build de production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Vérifier les logs
docker-compose logs -f --tail=100
```

## Résolution des Problèmes

### Le backend ne démarre pas

```bash
# Vérifier les logs
docker-compose logs backend

# Vérifier les variables d'environnement
docker-compose exec backend env | grep HEDERA

# Redémarrer avec rebuild
docker-compose up -d --build backend
```

### Erreur de base de données SQLite

```bash
# Vérifier le fichier SQLite
docker-compose exec backend ls -lah /app/data/

# Réinitialiser la base
docker-compose exec backend rm -f /app/data/database.sqlite
docker-compose exec backend npm run init:sqlite

# Vérifier l'intégrité de la base
docker-compose exec backend sqlite3 /app/data/database.sqlite "PRAGMA integrity_check;"
```

### Le frontend ne se connecte pas au backend

```bash
# Vérifier que le backend est healthy
docker-compose ps

# Vérifier l'URL de l'API dans le frontend
docker-compose exec frontend cat /app/.env

# Vérifier CORS dans le backend
docker-compose exec backend grep FRONTEND_URL /app/.env
```

### Health check failures

```bash
# Vérifier le health check
docker-compose ps

# Tester manuellement
curl http://localhost:5000/api/health

# Augmenter le délai de démarrage dans docker-compose.yml
healthcheck:
  start_period: 60s  # Augmenter si nécessaire
```

### Erreurs de permissions

```bash
# Corriger les permissions des volumes
docker-compose down
sudo chown -R 1000:1000 backend/data backend/logs backend/uploads
docker-compose up -d
```

## Migration vers Docker (depuis installation locale)

### 1. Sauvegarder les données existantes

```bash
# SQLite local
cp backend/data/database.sqlite backup_database.sqlite
```

### 2. Adapter la configuration

```bash
# Copier le .env (aucune modification nécessaire pour SQLite)
cp backend/.env .env
```

### 3. Démarrer Docker et migrer

```bash
# Démarrer les services
docker-compose up -d

# Copier la base SQLite existante dans le volume Docker
docker cp backup_database.sqlite fadjma-backend:/app/data/database.sqlite

# Redémarrer le backend
docker-compose restart backend
```

## Optimisations de Production

### 1. Ressources

```yaml
# docker-compose.prod.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          memory: 256M
```

### 2. Logging

```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 3. Sécurité

```dockerfile
# Backend Dockerfile - Utiliser un utilisateur non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs
```

### 4. Monitoring

```bash
# Ajouter Prometheus et Grafana
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

## Checklist de Déploiement

- [ ] Variables d'environnement configurées (.env)
- [ ] Credentials Hedera valides (HEDERA_ECDSA_ACCOUNT_ID, HEDERA_ECDSA_PRIVATE_KEY)
- [ ] JWT_SECRET généré (64 caractères min)
- [ ] Docker et Docker Compose installés
- [ ] Services démarrés et healthy (docker-compose ps)
- [ ] Base de données SQLite initialisée (npm run init:sqlite)
- [ ] Données de test chargées (npm run seed:full)
- [ ] Health checks passent (backend & frontend)
- [ ] Logs vérifiés sans erreur (docker-compose logs)
- [ ] Frontend accessible sur http://localhost:3000
- [ ] Backend API répond sur http://localhost:5000/api/health
- [ ] Volume SQLite persistant (docker volume ls)
- [ ] Backup configuré (script de sauvegarde du volume)

## Support

Pour les problèmes Docker spécifiques :

1. Vérifier les logs : `docker-compose logs -f`
2. Vérifier l'état : `docker-compose ps`
3. Consulter la documentation Docker officielle
4. Vérifier les fichiers de configuration

---

**Votre application FADJMA est maintenant conteneurisée et prête pour le déploiement ! 🚀**
