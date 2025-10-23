# Installer les dépendances
npm install

# Créer le fichier de configuration
cp .env.example .env

# Éditer le fichier .env avec vos paramètres
nano .env  # ou votre éditeur préféré

# Initialiser SQLite avec données de test
npm run init:sqlite

# Démarrage en mode développement
 npm run seed clean   # Charge la base propre

npm start
