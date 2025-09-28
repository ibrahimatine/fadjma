# 🚀 Système de Matricules - Démarrage Rapide

## Installation Complète (SQLite + Matricules)

### 1. Initialisation de la base
```bash
cd backend

# Installation complète avec matricules intégrés
node scripts/init-sqlite.js
```

**Sortie attendue :**
```
🚀 Initialisation SQLite avec système de matricules...

🔄 Suppression de l'ancienne base...
🔄 Création de la nouvelle base SQLite...
✅ Base SQLite créée avec succès !
🔧 Configuration du système de matricules...
   📊 X tables créées
   ✅ Colonne matricule présente
   ✅ Index unique créé pour les matricules
   ✅ Hook beforeCreate configuré pour génération automatique des matricules
   🧪 Test de génération de matricule...
   ✅ Format de matricule valide: PRX-20240125-A1B2
   ✅ Système d'unicité fonctionnel
✅ Système de matricules configuré !

📋 Fonctionnalités activées:
   ✅ Génération automatique de matricules pour nouvelles prescriptions
   ✅ API de recherche par matricule pour pharmaciens
   ✅ Dashboard pharmacien avec onglets de recherche
   ✅ Sécurité et audit des accès

🔍 Informations système:
   📁 Base de données: /path/to/database.sqlite
   🗄️  Dialecte Sequelize: sqlite
   📊 Tables: X
   💾 Taille base: X KB

🎯 Configuration matricules:
   📋 Format: PRX-YYYYMMDD-XXXX
   🔒 Champ unique avec index
   🤖 Génération automatique via hook beforeCreate
   🔍 API recherche: /api/pharmacy/by-matricule/:matricule
   🛡️  Rate limiting: 50 requêtes/15min
```

### 2. Ajout des données de test
```bash
# Créer des utilisateurs et prescriptions de test avec matricules
npm run seed
```

**Sortie attendue avec matricules :**
```
🔄 Création des prescriptions avec matricules...
✅ Prescriptions créées avec matricules:
   📋 PRX-20240125-A1B2 - Cholécalciférol (Jean Dupont) - Dr. Marie Martin - pending
   📋 PRX-20240124-C3D4 - Ibuprofène (Ibrahim Diallo) - Dr. Marie Martin - pending
   📋 PRX-20240123-E5F6 - Metformine (Mamadou Ba) - Dr. Marie Martin - pending
   ...

💊 Statistiques prescriptions:
   📊 Total: 9
   ⏳ En attente: 7
   ✅ Délivrées: 1
   ❌ Annulées: 1

🧪 Matricules de test (pour pharmaciens):
   🔍 PRX-20240125-A1B2 → Cholécalciférol (Jean Dupont)
   🔍 PRX-20240124-C3D4 → Ibuprofène (Ibrahim Diallo)
   🔍 PRX-20240123-E5F6 → Metformine (Mamadou Ba)

📊 STATISTIQUES:
  👥 Total utilisateurs: 12
  📋 Total dossiers médicaux: 11
  💊 Total prescriptions: 9
  🎯 Prescriptions avec matricules: 9
```

### 3. Démarrage du serveur
```bash
npm start
```

## 🧪 Tests du Système

### Test 1: Dashboard Pharmacien
1. **Connexion** : `pharmacie.centrale@fadjma.com` / `Demo2024!`
2. **Navigation** : Aller au Dashboard
3. **Interface** : Vérifier les 2 onglets :
   - ✅ "Recherche par matricule"
   - ✅ "Toutes les prescriptions"

### Test 2: Recherche par Matricule
1. **Onglet "Recherche"** : Cliquer sur "Recherche par matricule"
2. **Saisie** : Entrer un matricule de test (ex: `PRX-20240125-A1B2`)
3. **Validation** :
   - ✅ Format validé en temps réel
   - ✅ Auto-formatage de la saisie
   - ✅ Messages d'aide contextuelle
4. **Résultat** : Vérifier l'affichage de la prescription

### Test 2.5: Affichage Matricule dans Dossier Médical
1. **Connexion Patient/Médecin** : Se connecter avec un compte patient ou médecin
2. **Navigation** : Aller au dashboard → Cliquer sur un dossier médical avec prescription
3. **Route** : Vérifier l'URL `/records/:id`
4. **Affichage Matricule** :
   - ✅ Section "Ordonnances délivrables" visible
   - ✅ Matricule affiché avec le composant MatriculeDisplay
   - ✅ Boutons copier/partager fonctionnels
   - ✅ Instructions contextuelles selon le rôle
   - ✅ QR Code optionnel disponible

### Test 3: API de Recherche
```bash
# Récupérer un token pharmacie (ajustez selon votre système auth)
TOKEN="your_pharmacy_jwt_token"

# Test de recherche par matricule
curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3000/api/pharmacy/by-matricule/PRX-20240125-A1B2

# Réponse attendue:
# {
#   "message": "Prescription trouvée avec succès",
#   "prescription": {
#     "id": "uuid",
#     "matricule": "PRX-20240125-A1B2",
#     "medication": "Cholécalciférol",
#     ...
#   }
# }
```

### Test 4: Rate Limiting
```bash
# Test de rate limiting (max 50 req/15min)
for i in {1..60}; do
  curl -H "Authorization: Bearer $TOKEN" \
       http://localhost:3000/api/pharmacy/by-matricule/PRX-INVALID-TEST
  echo "Request $i"
done

# Vérifier qu'après 50 requêtes on obtient:
# HTTP 429 - Rate Limit Exceeded
```

## 🔍 Comptes de Test

### Pharmaciens (pour tester la recherche)
- **Email**: `pharmacie.centrale@fadjma.com`
- **Mot de passe**: `Demo2024!`
- **Accès**: Dashboard → Recherche par matricule

- **Email**: `pharmacie.plateau@fadjma.com`
- **Mot de passe**: `Demo2024!`
- **Accès**: Dashboard → Recherche par matricule

### Médecins (pour voir les matricules)
- **Email**: `dr.martin@fadjma.com`
- **Mot de passe**: `Demo2024!`
- **Fonction**: Peut voir les matricules de ses prescriptions

### Patients (pour recevoir les matricules)
- **Email**: `jean.dupont@demo.com`
- **Mot de passe**: `Demo2024!`
- **Fonction**: Peut voir les matricules de ses prescriptions

## 📋 Matricules de Test Disponibles

Après le seed, utilisez ces matricules pour tester la recherche :

| Matricule | Médicament | Patient | Médecin | Statut |
|-----------|------------|---------|---------|--------|
| `PRX-YYYYMMDD-XXXX` | Cholécalciférol | Jean Dupont | Dr. Martin | pending |
| `PRX-YYYYMMDD-XXXX` | Ibuprofène | Ibrahim Diallo | Dr. Martin | pending |
| `PRX-YYYYMMDD-XXXX` | Metformine | Mamadou Ba | Dr. Martin | pending |
| `PRX-YYYYMMDD-XXXX` | Amlodipine | Fatou Sall | Dr. Diop | pending |
| `PRX-YYYYMMDD-XXXX` | EpiPen | Jean Dupont | Dr. Martin | pending |

*Note: Les matricules réels sont générés automatiquement lors du seed*

## ✅ Checklist de Validation

### Backend
- [ ] Base SQLite créée avec colonne `matricule`
- [ ] Index unique `prescriptions_matricule_unique` présent
- [ ] Hook `beforeCreate` génère automatiquement les matricules
- [ ] API `/api/pharmacy/by-matricule/:matricule` fonctionnelle
- [ ] Rate limiting actif (50 req/15min)
- [ ] Validation format `PRX-YYYYMMDD-XXXX`
- [ ] Logs d'audit des accès

### Frontend
- [ ] Dashboard pharmacien avec onglets
- [ ] Composant `MatriculeSearch` avec validation temps réel
- [ ] Auto-formatage des matricules saisis
- [ ] Messages d'erreur contextuels
- [ ] Affichage sécurisé des prescriptions trouvées
- [ ] Bouton "Nouvelle recherche" fonctionnel
- [ ] Page `RecordDetails` affiche matricules des prescriptions liées
- [ ] Composant `MatriculeDisplay` pour patients/médecins
- [ ] API `/records/:id/prescriptions` fonctionnelle

### Sécurité
- [ ] Accès limité aux pharmacies authentifiées
- [ ] Assignation automatique pharmacie → prescription
- [ ] Pas d'accès aux prescriptions déjà délivrées
- [ ] Sanitisation des réponses d'erreur
- [ ] Journalisation des tentatives d'accès

### Workflow Complet
- [ ] Médecin crée prescription → matricule généré
- [ ] Patient/Médecin peut voir matricule dans `/records/:id`
- [ ] Patient reçoit matricule (via dossier médical ou partage)
- [ ] Pharmacien recherche par matricule → trouve prescription
- [ ] Pharmacien valide et délivre → mise à jour statut
- [ ] Prescription marquée comme délivrée

## 🆘 Dépannage Rapide

### Problème: "Matricule format invalide"
```bash
# Vérifier le format exact
echo "PRX-20240125-A1B2" | grep -E "^PRX-[0-9]{8}-[A-F0-9]{4}$"
```

### Problème: "Prescription non trouvée"
```bash
# Vérifier la base de données
sqlite3 database.sqlite "SELECT matricule, medication FROM Prescriptions WHERE deliveryStatus='pending';"
```

### Problème: "Rate limit exceeded"
```bash
# Attendre 15 minutes ou redémarrer le serveur en mode dev
```

### Problème: Matricules non générés
```bash
# Vérifier le hook beforeCreate
node -e "console.log(require('./src/models/Prescription').beforeCreate)"

# Régénérer les matricules
node scripts/setup-matricule-sqlite.js
```

## 📞 Support

- **Documentation complète**: `MATRICULE_SYSTEM.md`
- **Installation SQLite**: `INSTALLATION_SQLITE.md`
- **Tests**: `backend/test/matricule-workflow.test.js`
- **Scripts utiles**: `backend/scripts/`

🎉 **Le système de matricules est maintenant opérationnel !**