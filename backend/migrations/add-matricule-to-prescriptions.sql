-- Migration SQLite: Ajout du champ matricule à la table Prescriptions
-- Date: $(date)
-- Description: Ajoute un champ matricule unique pour chaque prescription

-- Étape 1: Ajouter la colonne matricule (SQLite)
ALTER TABLE Prescriptions ADD COLUMN matricule TEXT;

-- Étape 2: Générer des matricules pour les prescriptions existantes
-- Cette étape doit être faite avec un script Node.js pour utiliser la même logique
-- que le hook beforeCreate du modèle

-- Étape 3: Créer l'index unique après avoir généré les matricules
-- Note: SQLite ne supporte pas ALTER COLUMN pour NOT NULL sur une colonne existante
-- L'index unique sera créé par le script Node.js

-- CREATE UNIQUE INDEX IF NOT EXISTS prescriptions_matricule_unique ON Prescriptions(matricule);

-- Note: Exécuter les étapes 2 et 3 avec le script Node.js