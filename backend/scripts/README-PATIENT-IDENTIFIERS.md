# Scripts de Base de Données - Système d'Identifiants Patients

Ce document explique comment utiliser les scripts adaptés pour initialiser et tester le système d'identifiants patients.

## Scripts Disponibles

### 1. `init-sqlite.js` - Initialisation de la Base de Données

**Description:** Configure la base de données SQLite avec le support complet pour les identifiants patients.

**Fonctionnalités ajoutées:**
- ✅ Tables et colonnes pour profils patients non réclamés
- ✅ Index unique pour identifiants patients (`PAT-YYYYMMDD-XXXX`)
- ✅ Support des contraintes NULL pour email/password des profils non réclamés
- ✅ Validation du système de génération d'identifiants
- ✅ Tests d'unicité et de format

**Usage:**
```bash
cd backend
node scripts/init-sqlite.js
```

**Sortie attendue:**
```
🚀 Initialisation SQLite avec système de matricules...
✅ Base SQLite créée avec succès !
🔧 Configuration du système de matricules...
✅ Système de matricules configuré !
🔧 Configuration du système d'identifiants patients...
✅ Systèmes configurés !

📋 Fonctionnalités activées:
   ✅ Génération automatique de matricules pour nouvelles prescriptions
   ✅ API de recherche par matricule pour pharmaciens
   ✅ Dashboard pharmacien avec onglets de recherche
   ✅ Sécurité et audit des accès
   ✅ Système d'identifiants patients pour profils non réclamés
   ✅ Liaison d'identifiants pour création de comptes patients
```

### 2. `seed.js` - Données de Test Enrichies

**Description:** Remplit la base avec des données de test incluant des profils patients non réclamés.

**Données ajoutées:**
- 📋 3 profils patients non réclamés avec identifiants générés
- 🏥 Dossiers médicaux associés aux profils non réclamés
- 🔑 Demandes d'accès auto-approuvées pour les médecins créateurs
- 📊 Statistiques complètes incluant les profils non réclamés

**Usage:**
```bash
cd backend
node scripts/seed.js
```

**Profils de test créés:**
- `Sophie Diallo` (Dr. Martin) - Consultation gastro-entérologie
- `Aliou Ndoye` (Dr. Diop) - Consultation cardiologie
- `Aminata Sarr` (Dr. Fall) - Vaccination pédiatrique

### 3. `test-patient-system.js` - Tests Complets du Système

**Description:** Script de validation complète du système d'identifiants patients.

**Tests effectués:**
1. 🔍 **Structure de base** - Vérification tables et colonnes
2. 🎯 **Génération d'identifiants** - Unicité et format
3. 🛡️ **Validation et sécurité** - Rate limiting et contrôles
4. 🔄 **Flux complet** - Création → Vérification → Liaison
5. 📊 **Données de seed** - Validation des données de test

**Usage:**
```bash
cd backend
node scripts/test-patient-system.js
```

## Flux de Déploiement Complet

### 1. Initialisation Complète (Base Vide)

```bash
# 1. Nettoyer et initialiser la base
cd backend
node scripts/init-sqlite.js

# 2. Peupler avec les données de test
node scripts/seed.js

# 3. Valider le système
node scripts/test-patient-system.js

# 4. Démarrer le serveur
npm start
```

### 2. Test Rapide (Base Existante)

```bash
# Reset et re-seed rapidement
node scripts/seed.js --reset

# Ou juste tester le système
node scripts/test-patient-system.js
```

## Données de Test Générées

### Comptes Médecins (Créateurs de Profils)
```
dr.martin@fadjma.com  (Demo2024!) - Médecine générale
dr.diop@fadjma.com    (Demo2024!) - Cardiologie
dr.fall@fadjma.com    (Demo2024!) - Pédiatrie
dr.kane@fadjma.com    (Demo2024!) - Gynécologie
```

### Profils Patients Non Réclamés (Exemples)
```
PAT-20241201-A7B9 → Sophie Diallo (créé par Dr. Martin)
PAT-20241201-C3F2 → Aliou Ndoye (créé par Dr. Diop)
PAT-20241201-E8D1 → Aminata Sarr (créé par Dr. Fall)
```

## Tests Manuels Recommandés

### 1. Test Création de Profil (Interface Doctor)
1. Connectez-vous comme `dr.martin@fadjma.com`
2. Cliquez "Nouveau dossier" → "Créer un profil patient"
3. Remplissez le formulaire patient
4. Vérifiez la génération de l'identifiant
5. Confirmez l'accès automatique au dossier

### 2. Test Liaison Identifiant (Interface Patient)
1. Allez sur `/link-patient`
2. Saisissez un identifiant généré (ex: PAT-20241201-A7B9)
3. Vérifiez l'affichage des infos patient
4. Créez un compte avec email/password
5. Confirmez la liaison et l'accès au dossier

### 3. Test Sécurité
1. Tentez plusieurs vérifications d'identifiant rapidement
2. Vérifiez le rate limiting (5 tentatives/15min)
3. Testez des formats d'identifiants invalides
4. Vérifiez l'audit des événements dans les logs

## API Endpoints Ajoutés

### Pour Médecins (Authentifiés)
```
POST /api/patients/create-unclaimed     # Créer profil non réclamé
GET  /api/patients/unclaimed/my         # Mes profils non réclamés
```

### Pour Patients (Public)
```
GET  /api/auth/verify-patient-identifier/:id    # Vérifier identifiant
POST /api/auth/link-patient-identifier          # Lier identifiant
```

## Structure de Base Étendue

### Colonnes Ajoutées à `BaseUsers`
```sql
patientIdentifier       VARCHAR UNIQUE  -- Identifiant patient (PAT-YYYYMMDD-XXXX)
isUnclaimed            BOOLEAN DEFAULT FALSE -- Profil non réclamé
createdByDoctorId      UUID            -- Médecin créateur
dateOfBirth           DATE            -- Date de naissance
gender                VARCHAR         -- Genre (male/female/other)
emergencyContactName   VARCHAR         -- Contact d'urgence
emergencyContactPhone  VARCHAR         -- Téléphone d'urgence
socialSecurityNumber   VARCHAR         -- Numéro sécurité sociale
```

### Index Ajoutés
```sql
CREATE UNIQUE INDEX base_users_patient_identifier_unique ON BaseUsers(patientIdentifier);
```

## Dépannage

### Erreur: "Table BaseUsers non trouvée"
```bash
# Réinitialiser complètement
rm database.sqlite
node scripts/init-sqlite.js
```

### Erreur: "Colonne patientIdentifier manquante"
```bash
# Forcer la migration
node scripts/init-sqlite.js  # Ajoute automatiquement les colonnes
```

### Erreur: "PatientIdentifierService non trouvé"
```bash
# Vérifier que le fichier service existe
ls src/services/patientIdentifierService.js
```

### Tests échouent
```bash
# Vérifier les données de base
node scripts/test-patient-system.js
```

## Monitoring et Logs

Les événements suivants sont automatiquement loggés:
- ✅ Génération d'identifiants patients
- ✅ Vérification d'identifiants (avec rate limiting)
- ✅ Liaison de comptes patients
- ✅ Tentatives d'accès bloquées
- ✅ Violations de rate limiting

## Production

Pour un déploiement en production:

1. **Migration de Base:** Utilisez des migrations Sequelize appropriées au lieu de `sync({ force: true })`
2. **Sécurité:** Configurez des secrets JWT forts et des rate limits Redis
3. **Monitoring:** Intégrez les logs avec votre système de monitoring
4. **Backup:** Sauvegardez régulièrement les identifiants générés

## Support

En cas de problème:
1. Vérifiez les logs du serveur
2. Exécutez `test-patient-system.js` pour diagnostiquer
3. Consultez la documentation complète dans `PATIENT-IDENTIFIER-IMPLEMENTATION.md`