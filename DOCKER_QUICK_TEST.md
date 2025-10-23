# 🚀 Test Rapide Docker SQLite - 5 Minutes

## ✅ Pré-requis
```bash
docker --version  # >= 20.10
docker-compose --version  # >= 1.29
sudo docker info  # Vérifier que Docker daemon est actif
```

## 📦 Installation et Test (5 minutes)

### 1. Cloner et Configurer (30 secondes)
```bash
cd /home/cheikhmodiouf/fadjma
cp .env.example .env
```

### 2. Démarrer les Services (30 secondes)
```bash
sudo docker-compose up -d
```

**Résultat attendu** :
```
✅ Creating network "fadjma-network" ... done
✅ Creating fadjma-backend ... done
✅ Creating fadjma-frontend ... done
```

### 3. Vérifier les Services (10 secondes)
```bash
sudo docker-compose ps
```

**Résultat attendu** :
```
NAME                STATUS
fadjma-backend      Up (healthy)
fadjma-frontend     Up (healthy)
```

### 4. Initialiser la Base SQLite (1 minute)
```bash
# Entrer dans le conteneur backend
sudo docker-compose exec backend sh

# Initialiser SQLite
npm run init:sqlite

# Charger les données de test
npm run seed:full

# Sortir
exit
```

**Résultat attendu** :
```
✅ Base SQLite créée avec succès !
✅ Système de matricules configuré !
📊 Total utilisateurs: 12
💊 Total prescriptions: 9
```

### 5. Tester l'API (10 secondes)
```bash
# Health check
curl http://localhost:5000/api/health

# Doit retourner:
# {"status":"OK","database":"connected","hedera":"connected"}
```

### 6. Tester le Frontend (10 secondes)
```bash
# Ouvrir dans le navigateur
open http://localhost:3000
# OU
firefox http://localhost:3000
# OU
google-chrome http://localhost:3000
```

**Résultat attendu** :
- ✅ Page de login s'affiche
- ✅ Pas d'erreur dans la console

### 7. Se Connecter (30 secondes)
```
Email: dr.martin@fadjma.com
Mot de passe: Demo2024!
```

**Résultat attendu** :
- ✅ Connexion réussie
- ✅ Dashboard médecin affiché
- ✅ Liste des patients visible

## 🔍 Vérifications Détaillées

### Vérifier SQLite
```bash
# Voir le fichier database
sudo docker-compose exec backend ls -lh /app/data/

# Lister les tables
sudo docker-compose exec backend sqlite3 /app/data/database.sqlite ".tables"

# Compter les utilisateurs
sudo docker-compose exec backend sqlite3 /app/data/database.sqlite "SELECT COUNT(*) FROM BaseUsers;"

# Voir les utilisateurs
sudo docker-compose exec backend sqlite3 /app/data/database.sqlite "SELECT email, role FROM BaseUsers LIMIT 5;"
```

### Vérifier les Logs
```bash
# Logs backend
sudo docker-compose logs backend | tail -50

# Logs frontend
sudo docker-compose logs frontend | tail -50

# Logs en temps réel
sudo docker-compose logs -f
```

### Vérifier les Volumes
```bash
# Lister les volumes
sudo docker volume ls | grep fadjma

# Inspecter le volume data (SQLite)
sudo docker volume inspect fadjma-backend-data
```

## 🧪 Tests Fonctionnels

### Test 1 : Créer un Dossier Médical
1. Se connecter comme médecin (dr.martin@fadjma.com / Demo2024!)
2. Cliquer sur un patient
3. Créer un nouveau dossier médical
4. Vérifier que le hash Hedera est généré

### Test 2 : Rechercher une Prescription
1. Se connecter comme pharmacien (pharmacie.centrale@fadjma.com / Demo2024!)
2. Aller dans "Recherche par matricule"
3. Chercher un matricule de test
4. Vérifier que la prescription s'affiche

### Test 3 : Vérifier l'Intégrité
1. Ouvrir un dossier médical
2. Cliquer sur "Vérifier l'intégrité"
3. Voir la confirmation Hedera

## ⚠️ Résolution de Problèmes

### Problème : Services ne démarrent pas
```bash
# Voir les logs
sudo docker-compose logs

# Redémarrer
sudo docker-compose down
sudo docker-compose up -d
```

### Problème : Backend unhealthy
```bash
# Vérifier les logs backend
sudo docker-compose logs backend

# Vérifier le fichier SQLite
sudo docker-compose exec backend ls -la /app/data/

# Réinitialiser
sudo docker-compose exec backend rm -f /app/data/database.sqlite
sudo docker-compose exec backend npm run init:sqlite
sudo docker-compose restart backend
```

### Problème : Frontend ne se connecte pas
```bash
# Vérifier que le backend répond
curl http://localhost:5000/api/health

# Vérifier les logs frontend
sudo docker-compose logs frontend

# Redémarrer le frontend
sudo docker-compose restart frontend
```

## 🧹 Nettoyage

### Arrêter les Services
```bash
sudo docker-compose down
```

### Tout Supprimer (DB incluse)
```bash
# Attention : supprime les données !
sudo docker-compose down -v

# Supprimer aussi les images
sudo docker-compose down -v --rmi all
```

### Redémarrer Proprement
```bash
# Supprimer tout
sudo docker-compose down -v

# Reconstruire et démarrer
sudo docker-compose up -d --build

# Réinitialiser
sudo docker-compose exec backend npm run init:sqlite
sudo docker-compose exec backend npm run seed:full
```

## 📊 Checklist Complète

- [ ] Docker et Docker Compose installés
- [ ] .env configuré
- [ ] `sudo docker-compose up -d` réussi
- [ ] 2 services healthy (ps)
- [ ] SQLite initialisé (init:sqlite)
- [ ] Données chargées (seed:full)
- [ ] API répond (curl /api/health)
- [ ] Frontend accessible (http://localhost:3000)
- [ ] Login médecin fonctionne
- [ ] Dashboard affiché
- [ ] Dossier médical créable
- [ ] Hedera hash généré

## ✅ Résultat Attendu

Si tous les tests passent :
- ✅ Docker fonctionne correctement
- ✅ SQLite configuré et opérationnel
- ✅ Backend API fonctionnelle
- ✅ Frontend React connecté
- ✅ Hedera intégration active
- ✅ Système complet opérationnel

**Temps total** : ~5 minutes ⚡

**Prêt pour le développement ou la démonstration** ! 🚀
