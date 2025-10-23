# 🐳 Guide Docker Menu - dev-menu.sh

## 🎯 Nouvelle Fonctionnalité Ajoutée

Une **option Docker complète** a été ajoutée au menu de développement (`dev-menu.sh`) pour gérer toute la logique de configuration et de lancement Docker.

---

## 📋 Accès au Menu Docker

### Lancement du Menu Principal
```bash
./dev-menu.sh
```

### Accès au Menu Docker
- **Option 12** : 🐳 Docker Management

---

## 🎨 Fonctionnalités du Menu Docker

### 1. Gestion des Services

#### 🚀 Option 1: Démarrer Docker
- Vérifie que Docker et Docker Compose sont installés
- Vérifie que le daemon Docker est démarré
- Configure automatiquement `.env` s'il n'existe pas
- Lance `docker-compose up -d`
- Affiche les URLs disponibles

**Ce qui se passe:**
```bash
✓ Vérification Docker installé
✓ Vérification daemon actif
✓ Configuration .env (copie depuis .env.example)
✓ Lancement sudo docker-compose up -d
✓ Affichage du statut et des URLs
```

#### 🛑 Option 2: Arrêter Docker
- Exécute `sudo docker-compose down`
- Arrête tous les services FADJMA
- Préserve les volumes (données DB intactes)

#### 🔄 Option 3: Redémarrer Docker
- Exécute `sudo docker-compose restart`
- Redémarre tous les services sans rebuild

---

### 2. Base de Données

#### 🗄️ Option 4: Initialiser la base SQLite + Seed
Workflow complet en 2 étapes:

**Étape 1: Initialisation SQLite**
```bash
sudo docker-compose exec backend npm run init:sqlite
```
- Crée la base `database.sqlite`
- Crée toutes les tables Sequelize
- Configure le système de matricules

**Étape 2: Seed des données**
Deux options disponibles:
1. **Seed complet** (`npm run seed:full`)
   - 12 utilisateurs (médecins, patients, pharmaciens, admin)
   - 11 dossiers médicaux
   - 9 prescriptions
   - Données de démonstration complètes

2. **Seed minimal** (`npm run seed:clean`)
   - 8 utilisateurs de base
   - Pas de dossiers médicaux
   - Environnement propre pour tests personnalisés

**Comptes créés (seed:full):**
```
Médecin:    dr.martin@fadjma.com              / Demo2024!
Patient:    jean.dupont@demo.com              / Demo2024!
Pharmacien: pharmacie.centrale@fadjma.com     / Demo2024!
Admin:      admin@fadjma.com                  / Admin2024!
```

#### 🐚 Option 5: Accès Shell / SQLite CLI
Trois options d'accès:
1. **Backend shell (sh)** - Accès terminal backend
2. **Frontend shell (sh)** - Accès terminal frontend
3. **SQLite CLI** - Accès direct à la base de données

**Exemple SQLite CLI:**
```sql
sqlite> .tables
sqlite> SELECT COUNT(*) FROM BaseUsers;
sqlite> SELECT email, role FROM BaseUsers;
sqlite> .quit
```

---

### 3. Maintenance

#### 📋 Option 6: Voir les logs
Quatre modes de visualisation:
1. **Logs Backend** - `sudo docker-compose logs -f backend`
2. **Logs Frontend** - `sudo docker-compose logs -f frontend`
3. **Logs Temps Réel** - `sudo docker-compose logs -f` (les deux)
4. **Retour** - Retour au menu

**Utilisation:**
- Les logs s'affichent en temps réel
- `Ctrl+C` pour quitter

#### 🔨 Option 7: Rebuild images
Workflow complet:
1. Confirmation utilisateur requise
2. Arrêt des services (`sudo docker-compose down`)
3. Rebuild sans cache (`sudo docker-compose build --no-cache`)
4. Redémarrage des services (`sudo docker-compose up -d`)

**Quand utiliser:**
- Après modifications du Dockerfile
- Après modifications des dépendances npm
- Pour forcer un rebuild propre

#### 🧹 Option 8: Nettoyer Docker
Cinq niveaux de nettoyage:

**Niveau 1: Arrêter les services**
```bash
sudo docker-compose down
```
- Services arrêtés
- Volumes préservés (DB intacte)

**Niveau 2: Supprimer volumes** ⚠️
```bash
sudo docker-compose down -v
```
- Services + volumes supprimés
- **PERTE DE DONNÉES DB**
- Confirmation "yes" requise

**Niveau 3: Supprimer volumes + images** ⚠️
```bash
sudo docker-compose down -v --rmi all
```
- Services + volumes + images supprimés
- Rebuild complet nécessaire
- Confirmation "yes" requise

**Niveau 4: Nettoyage système complet**
```bash
sudo docker system prune -a --volumes
```
- Nettoie TOUT Docker (pas seulement FADJMA)
- Containers, images, volumes inutilisés
- Confirmation interactive Docker

**Niveau 5: Annuler**

---

### 4. Informations

#### 📊 Option 9: Statut détaillé
Affiche des informations complètes:
- **Services**: `sudo docker-compose ps`
- **Images**: `sudo docker images | grep fadjma`
- **Volumes**: `sudo docker volume ls | grep fadjma`
- **Réseau**: `sudo docker network ls | grep fadjma`

**Exemple de sortie:**
```
Services:
NAME              STATUS           PORTS
fadjma-backend    Up (healthy)     0.0.0.0:5000->5000/tcp
fadjma-frontend   Up               0.0.0.0:3000->3000/tcp

Images:
fadjma-backend    latest    123MB
fadjma-frontend   latest    456MB

Volumes:
fadjma-backend-data
fadjma-backend-logs
fadjma-backend-uploads
```

#### 📚 Option 10: Guide Docker
Affiche:
- Démarrage rapide (5 minutes)
- Commandes Docker utiles
- Liens vers documentation complète

---

## 🚀 Workflow Complet de Démarrage

### Première Utilisation (5 minutes)

**1. Lancer le menu:**
```bash
./dev-menu.sh
```

**2. Sélectionner l'option 12 (Docker Management)**

**3. Dans le menu Docker, option 1 (Démarrer Docker):**
- Le script vérifie Docker
- Copie `.env.example` vers `.env`
- Propose d'éditer `.env` (ajouter credentials Hedera)
- Lance `sudo docker-compose up -d`

**4. Attendre ~40 secondes (health check backend)**

**5. Option 4 (Initialiser la base):**
- Étape 1: `init:sqlite` automatique
- Étape 2: Choisir seed (1 = complet)

**6. Tester l'application:**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000/api/health
- Se connecter avec les comptes de test

---

## 🔍 Cas d'Usage Fréquents

### Démarrage Quotidien (Services Arrêtés)
```
Menu Principal → 12 (Docker)
Menu Docker → 1 (Démarrer)
```

### Voir les Logs Backend
```
Menu Docker → 6 (Logs) → 1 (Backend)
Ctrl+C pour quitter
```

### Réinitialiser la Base de Données
```
Menu Docker → 8 (Nettoyer) → 2 (Supprimer volumes)
Confirmer: yes
Menu Docker → 1 (Démarrer)
Menu Docker → 4 (Initialiser DB)
```

### Accéder à SQLite
```
Menu Docker → 5 (Shell) → 3 (SQLite CLI)
Commandes SQL...
.quit
```

### Rebuild Après Modification Code
```
Menu Docker → 7 (Rebuild)
Confirmer: o
Attendre le rebuild...
```

---

## ⚠️ Points d'Attention

### Prérequis
✅ Docker installé (20.10+)
✅ Docker Compose installé (1.29+)
✅ Docker daemon démarré
✅ Fichier `.env` configuré (credentials Hedera)

### Ports Utilisés
- **3000**: Frontend React
- **5000**: Backend Node.js

**Si ports occupés:**
Modifier dans `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Frontend sur 3001
  - "5001:5000"  # Backend sur 5001
```

### Volumes Persistants
Les données sont stockées dans 3 volumes Docker:
1. `fadjma-backend-data` - Base SQLite
2. `fadjma-backend-logs` - Logs application
3. `fadjma-backend-uploads` - Fichiers uploadés

**Important:** Option "Supprimer volumes" = PERTE DONNÉES!

### Health Checks
Le backend a un health check de 40 secondes:
- Interval: 30s
- Timeout: 10s
- Retries: 3
- Start period: 40s

**Attendez ~40s** après démarrage avant d'utiliser l'API.

---

## 🛠️ Dépannage

### Docker n'est pas installé
```
❌ Docker n'est pas installé
Installation requise: https://docs.docker.com/get-docker/
```
**Solution:** Installer Docker Desktop ou Docker Engine

### Docker daemon non démarré
```
❌ Docker daemon n'est pas démarré
```
**Solution:**
- Linux: `sudo systemctl start docker`
- Windows/Mac: Démarrer Docker Desktop

### Port déjà utilisé
```
Error: bind: address already in use
```
**Solution:**
1. Identifier le processus: `lsof -i :5000`
2. Tuer le processus: `kill -9 <PID>`
3. Ou modifier le port dans `docker-compose.yml`

### Services "unhealthy"
```
fadjma-backend    Up (unhealthy)
```
**Solutions:**
1. Voir les logs: `sudo docker-compose logs backend`
2. Vérifier `.env` correctement configuré
3. Vérifier base SQLite initialisée
4. Redémarrer: `sudo docker-compose restart backend`

### Base de données vide
**Solution:**
```
Menu Docker → 4 (Initialiser DB)
Choisir seed:full
```

---

## 📚 Documentation Complète

### Fichiers de Référence
- `DOCKER_QUICK_TEST.md` - Test rapide (5 min)
- `docs/DOCKER_SETUP.md` - Configuration complète
- `docs/DOCKER_SQLITE_MIGRATION_SUMMARY.md` - Migration PostgreSQL→SQLite
- `docker-compose.yml` - Configuration services
- `.env.example` - Variables d'environnement

### Commandes Docker Directes
Si vous préférez la ligne de commande:

```bash
# Démarrer
sudo docker-compose up -d

# Initialiser DB
sudo docker-compose exec backend npm run init:sqlite
sudo docker-compose exec backend npm run seed:full

# Voir logs
sudo docker-compose logs -f

# Arrêter
sudo docker-compose down

# Tout supprimer (DB incluse)
sudo docker-compose down -v
```

---

## 🎯 Avantages du Menu vs Ligne de Commande

### Menu Docker (dev-menu.sh)
✅ Interface guidée interactive
✅ Vérifications automatiques (Docker installé, daemon actif)
✅ Configuration `.env` assistée
✅ Options de nettoyage sécurisées (confirmations)
✅ Affichage statut en temps réel
✅ Documentation intégrée
✅ Pas besoin de mémoriser commandes

### Ligne de Commande
✅ Plus rapide pour utilisateurs avancés
✅ Scriptable/automatisable
✅ Accès direct sans menu

**Recommandation:** Utilisez le menu pour débuter, puis ligne de commande si vous maîtrisez.

---

## ✅ Checklist Post-Configuration

Après avoir utilisé le menu Docker, vérifiez:

- [ ] Services Docker démarrés: `sudo docker-compose ps`
- [ ] Backend healthy (après 40s)
- [ ] Frontend accessible: http://localhost:3000
- [ ] Backend API répond: http://localhost:5000/api/health
- [ ] Base SQLite initialisée
- [ ] Données seed chargées
- [ ] Connexion médecin fonctionne (dr.martin@fadjma.com)
- [ ] Dashboard s'affiche correctement

---

**Version:** 2.0
**Dernière mise à jour:** 23 octobre 2025
**Compatible avec:** Docker 20.10+, Docker Compose 1.29+

🐳 **Docker Management dans dev-menu.sh - Configuration et lancement en 1 clic!** 🚀
