# Scraper DoraHacks - Hedera Hack Africa

Outil de scraping et d'analyse comparative des projets de la catégorie **"DLT for Operations"** du hackathon Hedera Hack Africa sur DoraHacks.

**Important**: Ce scraper se concentre uniquement sur les builds de la catégorie "DLT for Operations" et exclut automatiquement votre propre build (#33512).

## Installation

```bash
npm install
```

## Configuration

1. Copiez le fichier `.env.example` vers `.env`:
```bash
cp .env.example .env
```

2. Choisissez votre mode de connexion dans `.env`:

**Mode Manual (par défaut)**
```env
LOGIN_MODE=manual
```
Vous devez tout faire manuellement: entrer l'email, cliquer sur "Get Code", consulter votre email, et entrer le code.

**Mode Auto (semi-automatique)**
```env
LOGIN_MODE=auto
DORAHACKS_EMAIL=votre@email.com
```
Le script remplit automatiquement votre email et clique sur "Get Code". Vous devez juste consulter votre email et entrer le code reçu.

## Utilisation

### Étape 1: Scraper les projets

```bash
npm run scrape
```

Cette commande va:
- Ouvrir un navigateur Chrome
- Vous permettre de vous connecter manuellement à DoraHacks (si LOGIN_MODE=manual)
- Chercher et activer le filtre "DLT for Operations" sur la page
- Récupérer la liste des builds de cette catégorie
- Scraper chaque build individuellement pour avoir toutes les informations détaillées
- Vérifier que chaque build appartient bien à "DLT for Operations"
- Exclure automatiquement votre build (#33512)
- Sauvegarder les données dans le dossier `data/`

**Important**:
- Le navigateur s'ouvrira en mode visible
- DoraHacks utilise une authentification par code email:
  1. Entrez votre email
  2. Cliquez sur "Get Code"
  3. Consultez votre email pour récupérer le code
  4. Entrez le code dans le champ
  5. Validez
- Le script attendra jusqu'à 10 minutes que vous vous connectiez
- Vos cookies seront sauvegardés pour les prochaines fois (pas besoin de se reconnecter)

### Étape 2: Analyser les données

```bash
npm run analyze
```

Cette commande va:
- Charger les données scrapées
- Filtrer les projets qui utilisent des DLTs (Distributed Ledger Technologies)
- Comparer avec votre projet
- Générer un rapport d'analyse comparative
- Afficher un résumé dans la console

### Exécuter tout en une fois

```bash
npm run full-analysis
```

## Structure des données

### Liste des IDs (`data/build-ids-*.json`)

```json
{
  "total": 45,
  "excluded": ["33512"],
  "ids": ["34631", "34632", ...],
  "timestamp": "2025-10-15T..."
}
```

### Données brutes des builds (`data/builds-raw-*.json`)

```json
[
  {
    "id": "34631",
    "url": "https://dorahacks.io/buidl/34631",
    "title": "Nom du build",
    "tagline": "Courte description",
    "description": "Description complète du projet...",
    "team": "Nom de l'équipe",
    "tags": ["DeFi", "NFT"],
    "technologies": ["hedera", "hashgraph", "smart contract"],
    "links": {
      "github": "https://github.com/...",
      "demo": "https://...",
      "website": "https://..."
    },
    "votes": "42",
    "date": "2025-01-15",
    "success": true,
    "extractedAt": "2025-10-15T..."
  }
]
```

### Builds DLT filtrés (`data/dlts-builds-*.json`)

Contient uniquement les builds qui mentionnent:
- DLT / Distributed Ledger
- Blockchain
- Hedera / Hashgraph
- Smart contracts (HCS, HTS)
- Consensus mechanisms
- Etc.

### Rapport d'analyse (`data/competitive-analysis-*.json`)

```json
{
  "metadata": {
    "totalBuilds": 45,
    "dltsBuilds": 18,
    "dltsPercentage": "40.00",
    "excludedBuild": "33512"
  },
  "analysis": {
    "technologies": { "hedera": 15, "smart contract": 12 },
    "categories": { "DeFi": 6, "NFT": 4 },
    "withGithub": 12,
    "withDemo": 8
  },
  "comparison": {
    "yourProject": {
      "name": "Votre Projet DLT (Build #33512)",
      "features": ["Hedera Hashgraph", "Smart Contracts", ...]
    },
    "topCompetitors": [
      {
        "id": "34631",
        "project": "Concurrent Project",
        "similarityScore": "77.78",
        "matchingFeatures": ["Hedera Hashgraph", "Smart Contracts"],
        "url": "https://dorahacks.io/buidl/34631",
        "technologies": ["hedera", "blockchain"],
        "links": { "github": "...", "demo": "..." }
      }
    ],
    "totalSimilarProjects": 12
  },
  "recommendations": [...]
}
```

## Fonctionnalités

### Scraper (`scraper.js`)
- ✅ **Filtrage par catégorie "DLT for Operations"** dès le départ
- ✅ Activation automatique du filtre de catégorie sur la page
- ✅ Vérification de la catégorie sur chaque page de build
- ✅ Récupération de la liste des builds depuis la page du hackathon
- ✅ Scraping individuel de chaque build pour avoir tous les détails
- ✅ Double filtrage (page liste + page détail) pour garantir la précision
- ✅ Exclusion automatique de votre build (#33512)
- ✅ Simulation de navigation réelle avec Puppeteer
- ✅ Connexion manuelle ou semi-automatique (code email)
- ✅ Sauvegarde des cookies pour réutilisation
- ✅ Auto-scroll pour lazy loading
- ✅ Extraction complète: titre, description, catégorie, technologies, liens, votes, etc.
- ✅ Gestion d'erreurs robuste (continue même si un build échoue)

### Analyseur (`analyzer.js`)
- ✅ **Analyse ciblée sur la catégorie "DLT for Operations"**
- ✅ Vérification de la catégorie des builds
- ✅ Analyse des technologies utilisées (Hedera, HCS, HTS, etc.)
- ✅ Comparaison détaillée avec votre projet (#33512)
- ✅ Score de similarité basé sur les features communes
- ✅ Identification des compétiteurs directs dans la même catégorie
- ✅ Statistiques sur GitHub, démos, websites
- ✅ Recommandations stratégiques
- ✅ Rapport détaillé JSON avec toutes les métriques

## Dépannage

### Le navigateur ne s'ouvre pas
Vérifiez que vous avez bien installé les dépendances:
```bash
npm install
```

### Erreur de connexion
- Vérifiez que vous avez bien reçu le code par email
- Vérifiez vos spams si le code n'arrive pas
- Utilisez `LOGIN_MODE=manual` si le mode auto ne fonctionne pas
- Le timeout est de 10 minutes, vous avez le temps de consulter votre email

### Aucun projet trouvé
- Vérifiez que vous êtes bien connecté
- Le site peut avoir changé sa structure DOM
- Consultez les données dans `data/api-data-*.json` pour voir ce qui a été intercepté

### Modifier les sélecteurs
Si la structure du site change, éditez les sélecteurs dans `scraper.js`:
```javascript
const projectElements = document.querySelectorAll('[class*="project"]');
```

## Sécurité

- ❌ Ne commitez JAMAIS vos identifiants
- ✅ `.env` est dans `.gitignore`
- ✅ Les cookies sont stockés localement uniquement
- ✅ Aucune donnée sensible n'est partagée

## Améliorations futures

- [ ] Support pour d'autres hackathons
- [ ] Export Excel/CSV
- [ ] Visualisations graphiques
- [ ] Monitoring en temps réel
- [ ] Notifications de nouveaux projets

## License

MIT
