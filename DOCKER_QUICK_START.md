# 🐳 FADJMA - Docker Quick Start Guide

## 🎯 Pour les Juges du Hackathon

**Temps de démarrage estimé:** 5-10 minutes

---

## 📋 Prérequis

### Installer Docker & Docker Compose

**Ubuntu/Debian:**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose (si pas inclus)
sudo apt-get install docker-compose-plugin

# Vérifier l'installation
docker --version
docker compose version
```

**macOS:**
```bash
# Télécharger Docker Desktop depuis:
# https://www.docker.com/products/docker-desktop

# Ou via Homebrew:
brew install --cask docker

# Vérifier
docker --version
docker compose version
```

**Windows:**
```bash
# Télécharger Docker Desktop depuis:
# https://www.docker.com/products/docker-desktop

# Après installation, vérifier dans PowerShell:
docker --version
docker compose version
```

---

## 🚀 Démarrage Rapide (3 étapes)

### Étape 1: Configuration

```bash
# Cloner le repository (si pas déjà fait)
git clone https://github.com/[your-org]/fadjma.git
cd fadjma

# Copier le fichier d'environnement
cp .env.docker .env

# Éditer le fichier .env et ajouter vos credentials Hedera
nano .env
# Ou
code .env
```

**Variables à modifier dans `.env`:**
```bash
HEDERA_ECDSA_ACCOUNT_ID=0.0.XXXXXXX     # Fourni dans DoraHacks submission
HEDERA_ECDSA_PRIVATE_KEY=302e020100...  # Fourni dans DoraHacks submission
HEDERA_TOPIC_ID=0.0.6854064       # Déjà configuré
```

---

### Étape 2: Build & Démarrage

```bash
# Build et démarrer tous les services (backend + frontend)
docker compose up -d

# Vérifier que tout fonctionne
docker compose ps
```

**Sortie attendue:**
```
NAME                IMAGE                    STATUS              PORTS
fadjma-backend      fadjma-backend:latest    Up (healthy)        0.0.0.0:5000->5000/tcp
fadjma-frontend     fadjma-frontend:latest   Up (healthy)        0.0.0.0:3000->3000/tcp
```

---

### Étape 3: Accéder à l'Application

**Ouvrir votre navigateur:**
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/api/health

---

## 👤 Comptes de Test

Utilisez ces comptes pour tester l'application:

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| **Docteur** | doctor@fadjma.sn | password |
| **Patient** | patient@fadjma.sn | password |
| **Pharmacie** | pharmacy@fadjma.sn | password |
| **Admin** | admin@fadjma.sn | password |

---

## 🔍 Commandes Utiles

### Voir les Logs

```bash
# Tous les services
docker compose logs -f

# Backend uniquement
docker compose logs -f backend

# Frontend uniquement
docker compose logs -f frontend

# Les 50 dernières lignes
docker compose logs --tail=50 backend
```

### Redémarrer les Services

```bash
# Redémarrer tous les services
docker compose restart

# Redémarrer uniquement le backend
docker compose restart backend

# Redémarrer uniquement le frontend
docker compose restart frontend
```

### Arrêter les Services

```bash
# Arrêter sans supprimer les conteneurs
docker compose stop

# Arrêter et supprimer les conteneurs (données persistent)
docker compose down

# Arrêter et supprimer conteneurs + volumes (⚠️ supprime la base de données)
docker compose down -v
```

### Rebuilder après Modifications

```bash
# Rebuild et redémarrer
docker compose up -d --build

# Rebuild uniquement le backend
docker compose up -d --build backend

# Rebuild uniquement le frontend
docker compose up -d --build frontend
```

### Vérifier l'État de Santé

```bash
# Voir l'état des services
docker compose ps

# Détails complets
docker inspect fadjma-backend
docker inspect fadjma-frontend
```

### Accéder à un Conteneur

```bash
# Shell dans le backend
docker exec -it fadjma-backend sh

# Shell dans le frontend
docker exec -it fadjma-frontend sh

# Exécuter une commande dans le backend
docker exec fadjma-backend npm test
```

---

## 📊 Vérification de l'Intégration Hedera

### Test 1: Health Check API

```bash
curl http://localhost:5000/api/health
```

**Sortie attendue:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-22T10:30:00.000Z",
  "hedera": {
    "network": "testnet",
    "accountId": "0.0.6089195",
    "topicId": "0.0.6854064"
  }
}
```

### Test 2: Vérifier les Logs Hedera

```bash
docker compose logs backend | grep -i hedera
```

**Sortie attendue:**
```
✅ Hedera connected to testnet
✅ Account ID: 0.0.6089195
✅ Topic ID: 0.0.6854064
```

### Test 3: Créer un Dossier Médical

1. Connectez-vous en tant que docteur (doctor@fadjma.sn / password)
2. Créez un nouveau dossier médical
3. Vérifiez l'ancrage Hedera dans les logs:

```bash
docker compose logs -f backend | grep "Hedera"
```

**Sortie attendue:**
```
✅ Hedera transaction submitted: 0.0.6089195@1729600000.123456789
✅ Consensus timestamp: 2025-10-22T10:30:00.123Z
```

### Test 4: Vérifier sur HashScan

Ouvrir: https://hashscan.io/testnet/topic/0.0.6854064

Vous devriez voir les transactions en temps réel.

---

## 🐛 Dépannage

### Problème: Les conteneurs ne démarrent pas

**Solution 1: Vérifier les logs**
```bash
docker compose logs
```

**Solution 2: Vérifier les ports**
```bash
# Vérifier si les ports 3000 et 5000 sont disponibles
sudo lsof -i :3000
sudo lsof -i :5000

# Tuer les processus si nécessaire
sudo kill -9 [PID]
```

**Solution 3: Nettoyer Docker**
```bash
# Supprimer tous les conteneurs arrêtés
docker container prune

# Supprimer toutes les images non utilisées
docker image prune -a

# Rebuild complet
docker compose up -d --build --force-recreate
```

---

### Problème: "HEDERA_ECDSA_PRIVATE_KEY" not found

**Solution:**
```bash
# Vérifier le fichier .env
cat .env | grep HEDERA

# Si vide, copier depuis .env.docker
cp .env.docker .env

# Éditer et ajouter votre private key
nano .env
```

---

### Problème: Frontend ne charge pas

**Solution 1: Vérifier que le backend est sain**
```bash
docker compose ps
# backend doit afficher "Up (healthy)"

# Si unhealthy, voir les logs
docker compose logs backend
```

**Solution 2: Vérifier le proxy nginx**
```bash
# Accéder au frontend container
docker exec -it fadjma-frontend sh

# Tester la connexion au backend
wget -O- http://backend:5000/api/health
```

**Solution 3: Rebuild le frontend**
```bash
docker compose up -d --build frontend
```

---

### Problème: Base de données vide

**Solution: Initialiser la base de données**
```bash
# Accéder au backend container
docker exec -it fadjma-backend sh

# Exécuter les migrations (si configurées)
npm run migrate

# Ou seed avec données de test
npm run seed
```

---

### Problème: Erreur "Cannot connect to Docker daemon"

**Solution:**
```bash
# Démarrer Docker service
sudo systemctl start docker

# Ajouter votre user au groupe docker
sudo usermod -aG docker $USER

# Se déconnecter et reconnecter
# Ou
newgrp docker
```

---

## 📦 Architecture Docker

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Compose                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐      ┌─────────────────────┐      │
│  │  FRONTEND           │      │  BACKEND            │      │
│  │  (nginx:alpine)     │◄─────┤  (node:18-alpine)   │      │
│  │                     │      │                     │      │
│  │  Port: 3000         │      │  Port: 5000         │      │
│  │  React App          │      │  Express API        │      │
│  │                     │      │                     │      │
│  │  Health: ✓          │      │  Health: ✓          │      │
│  └─────────────────────┘      └──────────┬──────────┘      │
│                                           │                 │
│                               ┌───────────▼──────────┐      │
│                               │  Volumes:            │      │
│                               │  - backend-data      │      │
│                               │  - backend-logs      │      │
│                               │  - backend-uploads   │      │
│                               └──────────────────────┘      │
│                                                             │
│  Network: fadjma-network (bridge)                          │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  Hedera Testnet      │
              │  Topic: 0.0.6854064  │
              │  Account: 0.0.6089195│
              └──────────────────────┘
```

---

## 🔧 Configuration Avancée

### Personnaliser les Ports

Éditer `docker-compose.yml`:

```yaml
services:
  backend:
    ports:
      - "8080:5000"  # Changer 5000 → 8080 sur l'hôte

  frontend:
    ports:
      - "8000:3000"  # Changer 3000 → 8000 sur l'hôte
```

Redémarrer:
```bash
docker compose up -d
```

---

### Activer le Mode Debug

Éditer `.env`:
```bash
NODE_ENV=development
LOG_LEVEL=debug
DEBUG=fadjma:*
```

Redémarrer:
```bash
docker compose up -d --build backend
```

---

### Utiliser PostgreSQL au lieu de SQLite

Éditer `docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: fadjma-postgres
    environment:
      POSTGRES_DB: fadjma
      POSTGRES_USER: fadjma
      POSTGRES_PASSWORD: fadjma_password
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - fadjma-network

  backend:
    environment:
      USE_SQLITE: false
      DATABASE_URL: postgresql://fadjma:fadjma_password@postgres:5432/fadjma
    depends_on:
      - postgres

volumes:
  postgres-data:
```

---

## 📊 Performances & Monitoring

### Vérifier l'Utilisation des Ressources

```bash
# Stats en temps réel
docker stats fadjma-backend fadjma-frontend

# Utilisation disque
docker system df
```

### Optimisation

```bash
# Nettoyer les images inutilisées
docker image prune -a

# Nettoyer les volumes inutilisés
docker volume prune

# Nettoyer tout (⚠️ attention)
docker system prune -a --volumes
```

---

## ✅ Checklist de Vérification pour Juges

Avant de valider le fonctionnement complet:

- [ ] **Docker installé** (`docker --version`)
- [ ] **Docker Compose installé** (`docker compose version`)
- [ ] **Fichier .env configuré** (credentials Hedera)
- [ ] **Services démarrés** (`docker compose ps` → tous "Up")
- [ ] **Backend healthy** (http://localhost:5000/api/health)
- [ ] **Frontend accessible** (http://localhost:3000)
- [ ] **Login fonctionne** (doctor@fadjma.sn / password)
- [ ] **Créer un dossier médical** (test workflow)
- [ ] **Vérifier ancrage Hedera** (logs backend + HashScan)
- [ ] **Données persistantes** (arrêter/redémarrer → données toujours là)

---

## 🎯 Scénario de Test Complet

### Test E2E (End-to-End)

```bash
# 1. Démarrer
docker compose up -d

# 2. Attendre que les services soient healthy (30-60 secondes)
sleep 60

# 3. Vérifier backend
curl http://localhost:5000/api/health

# 4. Vérifier frontend
curl http://localhost:3000

# 5. Voir les logs
docker compose logs -f
```

**Dans le navigateur:**

1. Ouvrir http://localhost:3000
2. Login: doctor@fadjma.sn / password
3. Créer un dossier médical:
   - Titre: "Test Hedera Integration"
   - Diagnostic: "System functional"
   - Type: "General"
4. Vérifier le badge "✅ Ancré sur Hedera"
5. Cliquer "Proof of Integrity" → Voir HashScan
6. Vérifier sur https://hashscan.io/testnet/topic/0.0.6854064

**Résultat attendu:**
- ✅ Transaction visible sur HashScan
- ✅ Timestamp confirmé
- ✅ Données intègres

---

## 📞 Support

### En cas de problème:

1. **Vérifier les logs:**
   ```bash
   docker compose logs -f
   ```

2. **Vérifier la documentation:**
   - README.md
   - DEVELOPMENT.md
   - docs/

3. **GitHub Issues:**
   - https://github.com/[your-org]/fadjma/issues

4. **Contact:**
   - Email: contact@fadjma.sn
   - Discord: [discord-handle]

---

## 🎉 Conclusion

**Vous devriez maintenant avoir:**
- ✅ Backend fonctionnel sur http://localhost:5000
- ✅ Frontend fonctionnel sur http://localhost:3000
- ✅ Intégration Hedera opérationnelle
- ✅ Données persistantes (volumes Docker)
- ✅ System prêt pour démo

**Temps total:** 5-10 minutes ⏱️

**Prochaines étapes:**
- Tester tous les rôles (doctor, patient, pharmacy, admin)
- Créer plusieurs dossiers médicaux
- Vérifier les transactions sur HashScan
- Explorer le dashboard admin

**Bonne évaluation! 🏆🚀**

---

*Guide créé le 22 Octobre 2025*
*Hedera Africa Hackathon 2025 - Healthcare Operations Track*
*FADJMA Innovation Team*
