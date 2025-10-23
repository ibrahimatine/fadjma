# 🎨 Documentation Frontend FADJMA

## 📋 **Vue d'Ensemble**

Le frontend FADJMA est une application React moderne qui révolutionne l'expérience utilisateur en blockchain médicale avec des innovations UX uniques au monde.

### **Architecture Générale**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │────│   Services      │────│   Backend API   │
│   Tailwind CSS  │    │   HTTP/WS       │    │   Node.js       │
│                 │    │                 │    │                 │
│ - Pages (8)     │    │ - authService   │    │ - REST API      │
│ - Components    │    │ - recordService │    │ - WebSocket     │
│ - Hooks         │    │ - adminService  │    │ - Hedera        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Stack Technique**
- **Framework** : React 18+ avec JSX
- **Styling** : Tailwind CSS 3.x
- **Routing** : React Router v6
- **State Management** : React Context API + hooks
- **Icons** : Lucide React (900+ icônes)
- **HTTP Client** : Axios
- **WebSocket** : Native WebSocket API
- **Notifications** : React Hot Toast
- **Build** : Create React App / Vite

---

## 📁 **Structure du Projet**

```
frontend/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── index.js              # Point d'entrée React
│   ├── App.jsx               # App principale + routing
│   ├── components/           # Composants réutilisables
│   │   ├── auth/             # Authentification
│   │   │   ├── PatientLinkForm.jsx     # 🚀 Innovation identifiants
│   │   │   ├── ProtectedRoute.jsx      # Guards de routes
│   │   │   └── PatientRecordGuard.jsx  # Protection records
│   │   ├── common/           # Composants communs
│   │   │   ├── Header.jsx              # Navigation principale
│   │   │   └── Footer.jsx              # Pied de page
│   │   ├── medical/          # Composants médicaux
│   │   │   └── IntegrityButton.jsx     # 🚀 Vérification blockchain
│   │   └── patient/          # Composants patients
│   │       └── PatientMedicalRecordsView.jsx
│   ├── pages/                # Pages principales
│   │   ├── Login.jsx                   # Connexion
│   │   ├── Register.jsx                # Inscription
│   │   ├── Dashboard.jsx               # 🚀 Dashboard multi-rôles
│   │   ├── Records.jsx                 # Liste dossiers
│   │   ├── RecordDetails.jsx           # Détail dossier
│   │   ├── CreateMedicalRecord.jsx     # Création dossier
│   │   ├── AdminRegistry.jsx           # 🚀 Registre Hedera
│   │   ├── AdminMonitoring.jsx         # 🚀 Monitoring temps réel
│   │   └── HistoryView.jsx             # Historique actions
│   ├── services/             # Services API
│   │   ├── authService.js              # Authentification
│   │   ├── recordService.js            # Dossiers médicaux
│   │   ├── adminService.js             # Administration
│   │   ├── verificationService.js      # Vérification blockchain
│   │   └── websocketService.js         # WebSocket temps réel
│   ├── hooks/                # Hooks personnalisés
│   │   └── useAuth.js                  # Hook authentification
│   └── utils/                # Utilitaires
│       └── formatters.js               # Formatage données
├── package.json
├── tailwind.config.js
└── .env.example
```

---

## 🔧 **Configuration et Démarrage**

### **Variables d'Environnement**
```env
# API Backend
REACT_APP_API_URL=http://localhost:5000/api

# WebSocket (optionnel)
REACT_APP_WS_URL=ws://localhost:5000

# Mode développement
REACT_APP_ENV=development
```

### **Installation et Lancement**
```bash
# Installation dépendances
npm install

# Démarrage développement
npm start
# → http://localhost:3000

# Build production
npm run build

# Test application
npm test
```

### **Dépendances Principales**
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "axios": "^1.3.0",
    "lucide-react": "^0.263.1",
    "react-hot-toast": "^2.4.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.2.0",
    "@tailwindcss/forms": "^0.5.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

## 🧩 **Architecture des Composants**

### **App.jsx** - Application Principale
```jsx
// Routing principal avec protection par rôles
function App() {
  const { user, token } = useAuth();

  // Gestion WebSocket automatique
  useEffect(() => {
    if (user && token) {
      websocketService.connect(token);
    }
    return () => websocketService.disconnect();
  }, [user, token]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {user && <Header />}
      <main className="flex-1">
        <Routes>
          {/* Routes publiques */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/link-patient" element={<PatientLinkForm />} />

          {/* Routes protégées par rôle */}
          <Route element={<ProtectedRoute allowedRoles={["patient"]} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/records" element={<Records />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["doctor"]} />}>
            <Route path="/create-medical-record" element={<CreateMedicalRecord />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin/registry" element={<AdminRegistry />} />
            <Route path="/admin/monitoring" element={<AdminMonitoring />} />
          </Route>
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
```

### **Hook useAuth** - Gestion Authentification
```javascript
// hooks/useAuth.js
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // Vérification token valide
      authService.getCurrentUser()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    setToken(response.token);
    setUser(response.user);
    localStorage.setItem('token', response.token);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    websocketService.disconnect();
  };

  return { user, token, loading, login, logout };
};
```

---

## 🚀 **Innovations Frontend Révolutionnaires**

### **1. PatientLinkForm** - Innovation Identifiants Patients
```jsx
// components/auth/PatientLinkForm.jsx
// PREMIER SYSTÈME AU MONDE de liaison compte patient via identifiant blockchain

const PatientLinkForm = () => {
  const [step, setStep] = useState(1); // Processus 2 étapes
  const [identifier, setIdentifier] = useState('');
  const [patientData, setPatientData] = useState(null);
  const [accountData, setAccountData] = useState({});

  // Étape 1: Vérification identifiant patient
  const verifyIdentifier = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authService.verifyPatientIdentifier(identifier);
      setPatientData(response.patient);
      setStep(2); // Passage à la création compte
      toast.success('Identifiant vérifié ! Créez maintenant votre compte.');
    } catch (error) {
      if (error.response?.status === 429) {
        toast.error('Trop de tentatives. Attendez 15 minutes.');
      } else {
        toast.error('Identifiant patient introuvable ou invalide');
      }
    } finally {
      setLoading(false);
    }
  };

  // Étape 2: Création compte lié
  const createLinkedAccount = async (e) => {
    e.preventDefault();

    try {
      const response = await authService.linkPatientAccount({
        patientIdentifier: identifier,
        ...accountData
      });

      toast.success('Compte créé et lié avec succès !');
      // Auto-connexion
      login(response);
    } catch (error) {
      toast.error('Erreur lors de la création du compte');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">

        {/* Étape 1: Vérification */}
        {step === 1 && (
          <form onSubmit={verifyIdentifier}>
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900">
                Lier votre identifiant patient
              </h2>
              <p className="mt-2 text-gray-600">
                Votre médecin vous a créé un profil ? Utilisez votre identifiant pour y accéder.
              </p>
            </div>

            <div className="mt-8">
              <label className="block text-sm font-medium text-gray-700">
                Identifiant Patient
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value.toUpperCase())}
                placeholder="PAT-20241201-A7B9"
                pattern="PAT-\d{8}-[A-Z0-9]{4}"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Format: PAT-AAAAMMJJ-XXXX
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Vérification...' : 'Vérifier l\'identifiant'}
            </button>
          </form>
        )}

        {/* Étape 2: Création compte */}
        {step === 2 && patientData && (
          <form onSubmit={createLinkedAccount}>
            {/* Affichage données patient trouvées */}
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
              <h3 className="text-lg font-medium text-green-800">
                Profil trouvé !
              </h3>
              <p className="text-green-700">
                {patientData.firstName} {patientData.lastName}
              </p>
              <p className="text-sm text-green-600">
                Né(e) le {new Date(patientData.dateOfBirth).toLocaleDateString()}
              </p>
            </div>

            {/* Formulaire création compte */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Adresse email (identifiant de connexion)
                </label>
                <input
                  type="email"
                  value={accountData.email}
                  onChange={(e) => setAccountData({...accountData, email: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={accountData.password}
                  onChange={(e) => setAccountData({...accountData, password: e.target.value})}
                  minLength="6"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Créer mon compte lié
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
```

### **2. IntegrityButton** - Vérification Blockchain en 1 Clic
```jsx
// components/medical/IntegrityButton.jsx
// INNOVATION MONDIALE: Premier bouton de vérification blockchain médical

const IntegrityButton = ({ record }) => {
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const verifyIntegrity = async () => {
    setIsVerifying(true);

    try {
      const result = await verificationService.verifyRecord(record.id);
      setVerificationResult(result);

      if (result.isValid) {
        toast.success('✅ Intégrité vérifiée sur blockchain Hedera');
      } else {
        toast.error('❌ Problème d\'intégrité détecté');
      }
    } catch (error) {
      toast.error('Erreur lors de la vérification');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Bouton principal */}
      <button
        onClick={verifyIntegrity}
        disabled={isVerifying}
        className={`
          inline-flex items-center px-4 py-2 rounded-lg font-medium transition-all
          ${verificationResult?.isValid
            ? 'bg-green-100 text-green-800 border border-green-300'
            : 'bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {isVerifying ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Vérification...
          </>
        ) : verificationResult?.isValid ? (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            Intégrité Vérifiée
          </>
        ) : (
          <>
            <Shield className="w-4 h-4 mr-2" />
            Vérifier l'Intégrité
          </>
        )}
      </button>

      {/* Détails de vérification */}
      {verificationResult && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">
              Résultat de Vérification
            </h4>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-blue-600 hover:text-blue-800"
            >
              {showDetails ? 'Masquer' : 'Détails'}
              <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Status badges */}
          <div className="flex space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              verificationResult.isValid
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {verificationResult.isValid ? '✅ Valide' : '❌ Invalide'}
            </span>

            {record.hederaTransactionId && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                🔗 Blockchain
              </span>
            )}
          </div>

          {/* Détails techniques */}
          {showDetails && (
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Hash Actuel:</span>
                <code className="ml-2 text-xs bg-gray-200 px-1 rounded">
                  {verificationResult.currentHash}
                </code>
              </div>

              <div>
                <span className="font-medium">Hash Stocké:</span>
                <code className="ml-2 text-xs bg-gray-200 px-1 rounded">
                  {verificationResult.storedHash}
                </code>
              </div>

              {record.hederaTransactionId && (
                <div>
                  <span className="font-medium">Transaction Hedera:</span>
                  <a
                    href={`https://hashscan.io/testnet/transaction/${record.hederaTransactionId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 hover:text-blue-800 underline"
                  >
                    {record.hederaTransactionId} ↗
                  </a>
                </div>
              )}

              <div className="text-xs text-gray-500">
                Vérifié le {new Date(verificationResult.verificationTime).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

### **3. AdminMonitoring** - Dashboard Temps Réel Révolutionnaire
```jsx
// pages/AdminMonitoring.jsx
// PREMIER DASHBOARD BLOCKCHAIN MÉDICAL TEMPS RÉEL AU MONDE

const AdminMonitoring = () => {
  const [metrics, setMetrics] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh toutes les 10 secondes
  useEffect(() => {
    loadMonitoringData();

    let interval;
    if (autoRefresh) {
      interval = setInterval(loadMonitoringData, 10000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadMonitoringData = async () => {
    try {
      const [metricsRes, healthRes, alertsRes, logsRes] = await Promise.allSettled([
        adminService.getMonitoringMetrics(),
        adminService.getSystemHealth(),
        adminService.getActiveAlerts(),
        adminService.getSystemLogs(100)
      ]);

      if (metricsRes.status === 'fulfilled') setMetrics(metricsRes.value);
      if (healthRes.status === 'fulfilled') setSystemHealth(healthRes.value);
      if (alertsRes.status === 'fulfilled') setAlerts(alertsRes.value.alerts);
      if (logsRes.status === 'fulfilled') setLogs(logsRes.value.logs);

    } catch (error) {
      console.error('Monitoring data error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header avec contrôles */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Activity className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Monitoring Système
                </h1>
                <p className="text-gray-600">
                  Supervision temps réel de l'infrastructure FADJMA
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Toggle auto-refresh */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  autoRefresh
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Wifi className={`h-4 w-4 ${autoRefresh ? 'animate-pulse' : ''}`} />
                {autoRefresh ? 'Temps Réel ON' : 'Temps Réel OFF'}
              </button>

              {/* Refresh manual */}
              <button
                onClick={loadMonitoringData}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4" />
                Actualiser
              </button>
            </div>
          </div>
        </div>

        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

          {/* Hedera Transactions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Transactions Hedera
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics?.hedera?.totalTransactions || 0}
                </p>
                <p className="text-sm text-green-600">
                  {metrics?.hedera?.uptime || 0}% uptime
                </p>
              </div>
            </div>
          </div>

          {/* Base de Données */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Database className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Records Médicaux
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics?.database?.totalRecords || 0}
                </p>
                <p className="text-sm text-blue-600">
                  {metrics?.database?.prescriptions || 0} prescriptions
                </p>
              </div>
            </div>
          </div>

          {/* Système */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Cpu className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Mémoire RAM
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {metrics?.system?.memoryUsage || 0} MB
                </p>
                <p className="text-sm text-purple-600">
                  {metrics?.system?.requestsPerMinute || 0} req/min
                </p>
              </div>
            </div>
          </div>

          {/* Alertes */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Alertes Actives
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {alerts.length}
                </p>
                <p className="text-sm text-gray-500">
                  {systemHealth?.status || 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Graphiques et logs en temps réel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Logs système */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Logs Système (Temps Réel)
            </h3>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg text-sm"
                >
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    log.level === 'error' ? 'bg-red-500' :
                    log.level === 'warn' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">
                        {log.message}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {log.details && (
                      <p className="text-gray-600 mt-1">{log.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Statut système */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              État du Système
            </h3>

            <div className="space-y-4">
              {/* Hedera Status */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium">Hedera Testnet</span>
                </div>
                <span className="text-sm text-gray-600">
                  Connecté • {metrics?.hedera?.averageResponseTime || 0}ms
                </span>
              </div>

              {/* Database Status */}
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium">Base de Données</span>
                </div>
                <span className="text-sm text-gray-600">
                  SQLite • {metrics?.database?.averageQueryTime || 0}ms
                </span>
              </div>

              {/* API Status */}
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium">API Backend</span>
                </div>
                <span className="text-sm text-gray-600">
                  Opérationnel • {metrics?.system?.errorRate || 0}% erreurs
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

## 🏗️ **Services Frontend**

### **authService** - Gestion Authentification
```javascript
// services/authService.js
class AuthService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL;
    this.axios = axios.create({
      baseURL: this.baseURL,
      timeout: 10000
    });

    // Intercepteur pour token automatique
    this.axios.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Connexion standard
  async login(credentials) {
    const response = await this.axios.post('/auth/login', credentials);
    return response.data;
  }

  // Inscription standard
  async register(userData) {
    const response = await this.axios.post('/auth/register', userData);
    return response.data;
  }

  // 🚀 INNOVATION: Vérification identifiant patient
  async verifyPatientIdentifier(identifier) {
    const response = await this.axios.post('/auth/verify-patient-identifier', {
      patientIdentifier: identifier
    });
    return response.data;
  }

  // 🚀 INNOVATION: Liaison compte patient
  async linkPatientAccount(linkData) {
    const response = await this.axios.post('/auth/link-patient-account', linkData);
    return response.data;
  }

  // Profil utilisateur actuel
  async getCurrentUser() {
    const response = await this.axios.get('/auth/me');
    return response.data.user;
  }

  // Mise à jour profil
  async updateProfile(profileData) {
    const response = await this.axios.put('/auth/profile', profileData);
    return response.data;
  }
}

export default new AuthService();
```

### **recordService** - Gestion Dossiers Médicaux
```javascript
// services/recordService.js
class RecordService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL;
  }

  // Liste dossiers avec filtres
  async getRecords(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${this.baseURL}/records?${queryString}`, {
      headers: this.getHeaders()
    });
    return await response.json();
  }

  // Création dossier avec ancrage automatique
  async createRecord(recordData) {
    const response = await fetch(`${this.baseURL}/records`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(recordData)
    });
    return await response.json();
  }

  // Détail dossier
  async getRecord(id) {
    const response = await fetch(`${this.baseURL}/records/${id}`, {
      headers: this.getHeaders()
    });
    return await response.json();
  }

  // Mise à jour avec re-ancrage
  async updateRecord(id, updateData) {
    const response = await fetch(`${this.baseURL}/records/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updateData)
    });
    return await response.json();
  }

  // Partage dossier
  async shareRecord(id, shareData) {
    const response = await fetch(`${this.baseURL}/records/${id}/share`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(shareData)
    });
    return await response.json();
  }

  getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }
}

export default new RecordService();
```

### **verificationService** - Vérification Blockchain
```javascript
// services/verificationService.js
class VerificationService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL;
  }

  // 🚀 INNOVATION: Vérification intégrité record
  async verifyRecord(recordId) {
    const response = await fetch(`${this.baseURL}/verify/record/${recordId}`, {
      method: 'POST',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la vérification');
    }

    return await response.json();
  }

  // Vérification prescription
  async verifyPrescription(prescriptionId) {
    const response = await fetch(`${this.baseURL}/verify/prescription/${prescriptionId}`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    return await response.json();
  }

  // Vérification transaction Hedera directe
  async verifyHederaTransaction(transactionId) {
    const response = await fetch(`${this.baseURL}/verify/hedera/${transactionId}`, {
      headers: this.getHeaders()
    });
    return await response.json();
  }

  // Vérification batch (multiple records)
  async verifyMultiple(recordIds) {
    const response = await fetch(`${this.baseURL}/verify/batch`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ recordIds })
    });
    return await response.json();
  }

  getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }
}

export default new VerificationService();
```

### **websocketService** - Temps Réel
```javascript
// services/websocketService.js
class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.isConnected = false;
    this.listeners = new Map();
  }

  // Connexion WebSocket avec token
  async connect(token) {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:5000';
        this.ws = new WebSocket(`${wsUrl}?token=${token}`);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connecté');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Erreur parsing message WebSocket:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket fermé:', event.code);
          this.isConnected = false;
          this.attemptReconnect(token);
        };

        this.ws.onerror = (error) => {
          console.error('❌ Erreur WebSocket:', error);
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  // Gestion messages temps réel
  handleMessage(data) {
    const { type, payload } = data;

    // Notifications système
    if (type === 'system_notification') {
      toast.info(payload.message);
    }

    // Métriques temps réel
    if (type === 'metrics_update') {
      this.emit('metricsUpdate', payload);
    }

    // Transaction Hedera
    if (type === 'hedera_transaction') {
      this.emit('hederaTransaction', payload);
    }

    // Record mis à jour
    if (type === 'record_updated') {
      this.emit('recordUpdate', payload);
    }

    // Émission événement personnalisé
    this.emit(type, payload);
  }

  // Écoute événements
  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);
  }

  // Arrêt écoute
  off(eventType, callback) {
    if (this.listeners.has(eventType)) {
      const callbacks = this.listeners.get(eventType);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Émission événement
  emit(eventType, data) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Erreur callback WebSocket:', error);
        }
      });
    }
  }

  // Reconnexion automatique
  attemptReconnect(token) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        console.log(`🔄 Tentative reconnexion ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts}`);
        this.reconnectAttempts++;
        this.connect(token);
      }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
    }
  }

  // Déconnexion
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
      console.log('🔌 WebSocket déconnecté manuellement');
    }
  }

  // Envoi message
  send(data) {
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify(data));
    }
  }

  // Statut connexion
  isConnected() {
    return this.isConnected;
  }
}

export default new WebSocketService();
```

---

## 🎨 **Design System Tailwind**

### **Configuration Tailwind**
```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette FADJMA
        fadjma: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        // Status colors
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'pulse-slow': 'pulse 3s infinite',
        'bounce-gentle': 'bounce 2s infinite',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

### **Composants Réutilisables**
```jsx
// Exemple: Card Component Pattern
const Card = ({ children, className = '', ...props }) => (
  <div
    className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}
    {...props}
  >
    {children}
  </div>
);

// Button Component Pattern
const Button = ({
  variant = 'primary',
  size = 'md',
  children,
  disabled = false,
  loading = false,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${
        disabled || loading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};
```

---

## 📱 **Responsive Design**

### **Breakpoints Tailwind**
```css
/* Mobile First Approach */
.container {
  @apply px-4;                    /* Mobile: 16px padding */
}

@screen sm {                      /* ≥ 640px */
  .container {
    @apply px-6;                  /* Tablet: 24px padding */
  }
}

@screen md {                      /* ≥ 768px */
  .container {
    @apply px-8;                  /* Desktop: 32px padding */
  }
}

@screen lg {                      /* ≥ 1024px */
  .container {
    @apply max-w-7xl mx-auto;     /* Large: max width + center */
  }
}
```

### **Grilles Responsives**
```jsx
// Dashboard responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Cards métriques */}
</div>

// Liste adaptative
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
  {/* Contenu principal + sidebar */}
</div>

// Navigation mobile
<div className="block md:hidden">
  {/* Menu mobile hamburger */}
</div>
<div className="hidden md:block">
  {/* Navigation desktop */}
</div>
```

---

## 🔄 **Workflows Utilisateur**

### **1. Workflow Patient**
```
1. Inscription/Connexion
   ├── Option A: Inscription classique
   └── Option B: Liaison identifiant médecin (INNOVATION)

2. Dashboard Patient
   ├── Vue dossiers médicaux
   ├── Demandes d'accès médecins
   └── Historique consultations

3. Consultation Dossier
   ├── Détails complets
   ├── Vérification intégrité blockchain (INNOVATION)
   └── Partage sécurisé avec médecins

4. Gestion Prescriptions
   ├── Liste prescriptions actives
   ├── Statut dispensation temps réel
   └── Historique complet
```

### **2. Workflow Médecin**
```
1. Authentification Professionnelle
   ├── Vérification licence médicale
   └── Accès dashboard médecin

2. Gestion Patients
   ├── Création profils patients avec identifiants (INNOVATION)
   ├── Demandes d'accès dossiers existants
   └── Liste patients autorisés

3. Création Dossiers
   ├── Formulaire spécialisé par type consultation
   ├── Ancrage enrichi automatique Hedera (INNOVATION)
   └── Classification intelligente

4. Prescriptions
   ├── Création prescriptions liées aux consultations
   ├── Génération matricules anti-falsification (INNOVATION)
   └── Suivi dispensation pharmacie
```

### **3. Workflow Pharmacie**
```
1. Interface Pharmacien
   ├── Recherche prescriptions par matricule (INNOVATION)
   ├── Vérification authenticité blockchain
   └── Gestion stock médicaments

2. Dispensation
   ├── Validation prescription médecin
   ├── Enregistrement dispensation
   └── Ancrage transaction Hedera (INNOVATION)

3. Reporting
   ├── Statistiques dispensations
   ├── Audit trail complet
   └── Export données conformité
```

### **4. Workflow Admin**
```
1. Supervision Système
   ├── Dashboard monitoring temps réel (INNOVATION)
   ├── Métriques Hedera/DB/Système
   └── Alertes automatiques

2. Registre Hedera
   ├── Vue transactions blockchain (INNOVATION)
   ├── Vérification statuts en masse
   └── Export données audit

3. Gestion Utilisateurs
   ├── Administration comptes
   ├── Gestion permissions
   └── Rapports d'activité
```

---

## 🎯 **Innovations UX Uniques**

### **1. Vérification Blockchain en 1 Clic**
- **Premier bouton** au monde de vérification médicale blockchain
- **Feedback visuel** immédiat (vert/rouge)
- **Détails techniques** expandables
- **Lien direct** vers explorateur Hedera

### **2. Système Identifiants Patients**
- **Innovation mondiale** : liaison compte via identifiant médecin
- **Processus 2 étapes** : vérification + création compte
- **UX guidée** avec validation temps réel
- **Sécurité renforcée** : rate limiting, format validation

### **3. Dashboard Temps Réel**
- **Premier dashboard blockchain médical** avec métriques live
- **Auto-refresh** configurable (ON/OFF)
- **WebSocket** pour updates instantanées
- **Visualisations** professionnelles niveau enterprise

### **4. Interface Prescription Unique**
- **Recherche matricule** en temps réel
- **Validation croisée** médecin/patient/médicament
- **Workflow dispensation** guidé étape par étape
- **Ancrage automatique** chaque action critique

---

## 🚀 **Performance et Optimisation**

### **Stratégies Actuelles**
- **Code Splitting** : Lazy loading des pages
- **Memoization** : React.memo pour composants lourds
- **Debouncing** : Recherches et auto-complete
- **Image Optimization** : WebP + lazy loading
- **Bundle Analysis** : Webpack bundle analyzer

### **Métriques Performance**
```javascript
// Exemples de lazy loading
const AdminMonitoring = lazy(() => import('./pages/AdminMonitoring'));
const AdminRegistry = lazy(() => import('./pages/AdminRegistry'));

// Memoization composants
const MemoizedIntegrityButton = React.memo(IntegrityButton);

// Debouncing recherche
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
```

### **Optimisations Futures**
- **Service Worker** : Cache intelligent et offline
- **Virtual Scrolling** : Listes longues (1000+ items)
- **CDN** : Assets statiques globaux
- **Preloading** : Pages suivantes predictives
- **Image Sprites** : Icônes communes

---

## 📊 **Analytics et Tracking**

### **Events Trackés**
```javascript
// Exemple tracking utilisateur
const trackUserAction = (action, metadata = {}) => {
  // Envoi au backend pour logs
  fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action,
      metadata,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    })
  });
};

// Usage dans composants
const handleRecordCreate = async (recordData) => {
  try {
    const result = await recordService.createRecord(recordData);
    trackUserAction('record_created', {
      recordType: recordData.type,
      hasAttachments: recordData.attachments?.length > 0
    });
  } catch (error) {
    trackUserAction('record_create_failed', { error: error.message });
  }
};
```

### **Métriques UX**
- **Time to Interactive** : <3 secondes
- **First Contentful Paint** : <1.5 secondes
- **Cumulative Layout Shift** : <0.1
- **Conversion Rates** : Inscription → Premier dossier
- **User Flows** : Abandons par étape

---

## 🔒 **Sécurité Frontend**

### **Mesures Implémentées**
- **XSS Protection** : Sanitisation inputs
- **CSRF Protection** : Tokens CSRF dans headers
- **Content Security Policy** : Scripts autorisés seulement
- **Token Security** : JWT stockage sécurisé
- **Input Validation** : Client + server side

### **Exemple Sécurisation**
```javascript
// Sanitisation input
import DOMPurify from 'dompurify';

const sanitizeInput = (input) => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};

// Validation token JWT
const isTokenValid = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

// Auto-logout sur token expiré
useEffect(() => {
  const interval = setInterval(() => {
    const token = localStorage.getItem('token');
    if (token && !isTokenValid(token)) {
      logout();
      toast.error('Session expirée, veuillez vous reconnecter');
    }
  }, 60000); // Check chaque minute

  return () => clearInterval(interval);
}, []);
```

---

## 🧪 **Tests Frontend**

### **Stratégies de Test**
```javascript
// Tests unitaires composants
import { render, screen, fireEvent } from '@testing-library/react';
import { IntegrityButton } from './IntegrityButton';

describe('IntegrityButton', () => {
  test('should show verification result after click', async () => {
    const mockRecord = {
      id: 'test-id',
      hash: 'test-hash'
    };

    render(<IntegrityButton record={mockRecord} />);

    const button = screen.getByText('Vérifier l\'Intégrité');
    fireEvent.click(button);

    expect(screen.getByText('Vérification...')).toBeInTheDocument();
  });
});

// Tests d'intégration
describe('Patient Link Flow', () => {
  test('should complete patient linking process', async () => {
    render(<PatientLinkForm />);

    // Étape 1: Saisie identifiant
    const identifierInput = screen.getByPlaceholderText('PAT-20241201-A7B9');
    fireEvent.change(identifierInput, { target: { value: 'PAT-20241201-A7B9' } });

    const verifyButton = screen.getByText('Vérifier l\'identifiant');
    fireEvent.click(verifyButton);

    // Étape 2: Création compte
    await waitFor(() => {
      expect(screen.getByText('Profil trouvé !')).toBeInTheDocument();
    });
  });
});
```

---

## 📱 **Accessibilité (A11Y)**

### **Standards Implémentés**
- **WCAG 2.1 AA** : Conformité niveau AA
- **Keyboard Navigation** : Tab order logique
- **Screen Readers** : ARIA labels complets
- **Color Contrast** : Ratio 4.5:1 minimum
- **Focus Management** : Focus visible et logique

### **Exemples Accessibilité**
```jsx
// ARIA labels et descriptions
<button
  aria-label="Vérifier l'intégrité du dossier médical sur la blockchain"
  aria-describedby="integrity-help"
  onClick={verifyIntegrity}
>
  Vérifier l'Intégrité
</button>
<div id="integrity-help" className="sr-only">
  Cette action vérifie que le dossier n'a pas été modifié depuis son ancrage sur la blockchain Hedera
</div>

// Navigation clavier
const handleKeyDown = (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handleAction();
  }
};

// Focus management
useEffect(() => {
  if (isModalOpen) {
    const firstFocusable = modalRef.current?.querySelector('button, input, select');
    firstFocusable?.focus();
  }
}, [isModalOpen]);
```

---

## 🚀 **Déploiement et Production**

### **Build Production**
```bash
# Build optimisé
npm run build

# Analyse bundle
npm install -g webpack-bundle-analyzer
npx webpack-bundle-analyzer build/static/js/*.js
```

### **Configuration Production**
```javascript
// Configuration environnement
const config = {
  development: {
    API_URL: 'http://localhost:5000/api',
    WS_URL: 'ws://localhost:5000',
    DEBUG: true
  },
  production: {
    API_URL: 'https://api.fadjma.com/api',
    WS_URL: 'wss://api.fadjma.com',
    DEBUG: false
  }
};

// Service Worker pour cache
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  navigator.serviceWorker.register('/sw.js');
}
```

---

## 📞 **Support et Maintenance**

### **Debugging**
```javascript
// Mode debug développement
if (process.env.NODE_ENV === 'development') {
  // React DevTools
  window.React = React;

  // Debug global
  window.debugFadjma = {
    authService,
    recordService,
    websocketService,
    currentUser: () => useAuth().user
  };
}

// Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Frontend Error:', error, errorInfo);
    // Envoi erreur au monitoring
    fetch('/api/monitoring/frontend-error', {
      method: 'POST',
      body: JSON.stringify({ error: error.message, stack: error.stack })
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Oups ! Une erreur est survenue
            </h1>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## 🎯 **Roadmap Frontend Futur**

### **Version 2.0 - Mobile First**
- **PWA** : Progressive Web App complète
- **Offline Mode** : Synchronisation automatique
- **Push Notifications** : Alertes temps réel
- **Biometric Auth** : Face ID / Touch ID

### **Version 3.0 - AI Integration**
- **AI Assistant** : Aide navigation intelligente
- **Smart Suggestions** : Recommandations contextuelles
- **Voice Interface** : Commandes vocales
- **Predictive UX** : Interface adaptative

### **Version 4.0 - Metaverse Ready**
- **VR/AR Support** : Consultations immersives
- **3D Visualizations** : Données médicales 3D
- **Haptic Feedback** : Retour tactile
- **Spatial Computing** : Interface gestuelle

---

**Documentation Frontend v2.0** - Mise à jour : 23 octobre 2025
**Contact** : équipe UX/UI FADJMA
**Prochaine révision** : Décembre 2025

---

*Frontend FADJMA - L'innovation UX au service de la révolution blockchain médicale* 🎨