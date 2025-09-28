# Installation du Système de Matricules - SQLite

## 🚀 Guide d'installation rapide pour SQLite

### Prérequis
- Node.js installé
- Application backend existante avec SQLite
- Accès en écriture au fichier de base SQLite

### 1. Installation des dépendances

```bash
cd backend
npm install express-rate-limit
```

### 2. Migration automatique (Recommandé)

```bash
# Exécuter le script de setup complet
node scripts/setup-matricule-sqlite.js

# Vérifier que tout est OK
node scripts/setup-matricule-sqlite.js --check
```

**Sortie attendue :**
```
🚀 Configuration du système de matricules pour SQLite...
✅ Connexion à la base SQLite établie.
📝 Ajout de la colonne matricule...
✅ Colonne matricule ajoutée.
📊 X prescriptions trouvées sans matricule.
🔧 Génération des matricules pour les prescriptions existantes...
✅ X matricules générés avec succès.
🔧 Création de l'index unique...
✅ Index unique créé.
🎉 Configuration du système de matricules terminée avec succès !
```

### 3. Migration manuelle (Alternative)

Si le script automatique échoue :

```bash
# 1. Ajouter la colonne
sqlite3 path/to/your/database.db "ALTER TABLE Prescriptions ADD COLUMN matricule TEXT;"

# 2. Générer les matricules existants
node scripts/generate-existing-matricules.js

# 3. Créer l'index unique
sqlite3 path/to/your/database.db "CREATE UNIQUE INDEX prescriptions_matricule_unique ON Prescriptions(matricule);"
```

### 4. Vérifications post-installation

```bash
# Vérifier l'état du système
node scripts/setup-matricule-sqlite.js --check
```

**Sortie attendue :**
```
📊 État actuel:
   Total prescriptions: X
   Avec matricule: X
   Index unique: ✅ Existe
   Couverture: 100%
```

### 5. Test de l'API

```bash
# Démarrer le serveur backend
npm start

# Tester la recherche par matricule (remplacez par un vrai token)
curl -H "Authorization: Bearer YOUR_PHARMACY_TOKEN" \
     http://localhost:3000/api/pharmacy/by-matricule/PRX-20240125-A1B2
```

## 🔧 Spécificités SQLite

### Limitations SQLite gérées

1. **Pas de contrainte NOT NULL sur colonne existante**
   - Solution : Le champ reste nullable pour les anciennes prescriptions
   - Les nouvelles prescriptions ont automatiquement un matricule

2. **Pas d'ALTER COLUMN**
   - Solution : Génération à la volée si matricule manquant
   - Backup automatique via hook beforeCreate

### Fonctionnalités adaptées

- **Génération à la volée** : Si une prescription sans matricule est trouvée, un matricule est généré automatiquement
- **Index unique robuste** : Gestion des conflits avec retry logic
- **Migration par lots** : Traitement par chunks pour éviter les timeouts

## 🛠️ Dépannage

### Erreur : "SQLITE_LOCKED"
```bash
# Vérifier les processus utilisant la base
lsof path/to/database.db

# Redémarrer l'application
```

### Erreur : "column matricule already exists"
```bash
# Normal si vous relancez le script - vérifier l'état
node scripts/setup-matricule-sqlite.js --check
```

### Matricules manquants après migration
```bash
# Relancer la génération
node scripts/generate-existing-matricules.js

# Ou forcer la régénération
sqlite3 database.db "UPDATE Prescriptions SET matricule = NULL WHERE matricule IS NULL;"
node scripts/setup-matricule-sqlite.js
```

### Performance lente sur SQLite
```bash
# Analyser la base
sqlite3 database.db "ANALYZE;"

# Vérifier l'index
sqlite3 database.db "EXPLAIN QUERY PLAN SELECT * FROM Prescriptions WHERE matricule = 'PRX-20240125-A1B2';"
```

## 📊 Monitoring SQLite

### Vérifications régulières

```bash
# Statistiques rapides
sqlite3 database.db "
SELECT
    COUNT(*) as total_prescriptions,
    COUNT(matricule) as with_matricule,
    COUNT(CASE WHEN matricule IS NULL THEN 1 END) as without_matricule
FROM Prescriptions;
"

# Vérifier l'unicité
sqlite3 database.db "
SELECT matricule, COUNT(*)
FROM Prescriptions
WHERE matricule IS NOT NULL
GROUP BY matricule
HAVING COUNT(*) > 1;
"
```

### Maintenance

```bash
# Nettoyer les index fragmentés
sqlite3 database.db "REINDEX;"

# Compacter la base
sqlite3 database.db "VACUUM;"

# Analyser pour optimiser les requêtes
sqlite3 database.db "ANALYZE;"
```

## ✅ Checklist de validation

- [ ] Script de setup exécuté sans erreur
- [ ] Colonne `matricule` présente dans la table Prescriptions
- [ ] Index unique `prescriptions_matricule_unique` créé
- [ ] Toutes les prescriptions existantes ont un matricule
- [ ] API `/api/pharmacy/by-matricule/:matricule` fonctionnelle
- [ ] Dashboard pharmacien affiche l'onglet recherche
- [ ] Validation du format matricule côté frontend
- [ ] Rate limiting actif (max 50 req/15min)
- [ ] Logs d'audit fonctionnels

## 🔄 Rollback (en cas de problème)

```bash
# Sauvegarder d'abord
cp database.db database.db.backup

# Supprimer la colonne (attention: perte de données)
sqlite3 database.db "
CREATE TABLE Prescriptions_backup AS SELECT * FROM Prescriptions;
DROP TABLE Prescriptions;
ALTER TABLE Prescriptions_backup RENAME TO Prescriptions;
"

# Ou simplement supprimer l'index
sqlite3 database.db "DROP INDEX prescriptions_matricule_unique;"
```

**⚠️ Important :** Toujours faire une sauvegarde de la base SQLite avant la migration !