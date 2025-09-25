const io = require('socket.io-client');

// Configuration de test
const SERVER_URL = 'http://localhost:5000';
const TEST_USERS = [
  { id: 'test-patient-1', role: 'patient', name: 'Patient Test' },
  { id: 'test-doctor-1', role: 'doctor', name: 'Dr. Test' },
  { id: 'test-pharmacist-1', role: 'pharmacist', name: 'Pharmacien Test' }
];

console.log('🧪 Script de test WebSocket FadjMa');
console.log('==================================\n');

// Générer un token JWT réel
function generateMockToken(userId, role) {
  const jwt = require('jsonwebtoken');

  // Utiliser la même clé secrète que le backend (par défaut dans le code)
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here-change-in-production';

  const payload = {
    id: userId,
    role: role,
    exp: Math.floor(Date.now() / 1000) + 3600
  };

  return jwt.sign(payload, JWT_SECRET);
}

// Créer des connexions de test
async function testWebSocketConnections() {
  console.log('📡 Test 1: Connexion des utilisateurs...');

  const connections = [];

  for (const user of TEST_USERS) {
    try {
      const token = generateMockToken(user.id, user.role);

      const socket = io(SERVER_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 5000
      });

      connections.push({ socket, user, token });

      // Écouter les événements de connexion
      socket.on('connect', () => {
        console.log(`✅ ${user.name} (${user.role}) connecté - Socket ID: ${socket.id}`);
      });

      socket.on('connect_error', (error) => {
        console.log(`❌ Erreur de connexion pour ${user.name}: ${error.message}`);
      });

      socket.on('connected', (data) => {
        console.log(`🎉 Confirmation serveur pour ${user.name}:`, data.message);
      });

      // Écouter les notifications
      socket.on('notification', (notification) => {
        console.log(`🔔 ${user.name} a reçu une notification:`, notification.type, '-', notification.message);
      });

      socket.on('new_access_request', (data) => {
        console.log(`📋 ${user.name} a reçu une demande d'accès:`, data.message);
      });

      socket.on('access_request_status_changed', (data) => {
        console.log(`🔐 ${user.name} - Statut de demande changé:`, data.status);
      });

      socket.on('prescription_status_changed', (data) => {
        console.log(`💊 ${user.name} - Prescription mise à jour:`, data.status);
      });

    } catch (error) {
      console.error(`❌ Erreur lors de la création de la connexion pour ${user.name}:`, error);
    }
  }

  return connections;
}

// Test de notification
async function testNotifications(connections) {
  console.log('\n📡 Test 2: Envoi de notifications simulées...');

  if (connections.length === 0) {
    console.log('❌ Aucune connexion disponible pour les tests');
    return;
  }

  const patientSocket = connections.find(c => c.user.role === 'patient')?.socket;
  const doctorSocket = connections.find(c => c.user.role === 'doctor')?.socket;

  if (patientSocket && doctorSocket) {
    // Simuler une demande d'accès
    setTimeout(() => {
      console.log('📤 Simulation: Médecin demande accès au patient...');
      patientSocket.emit('test_notification', {
        type: 'new_access_request',
        message: 'Le Dr. Test demande accès à vos dossiers médicaux',
        from: 'doctor'
      });
    }, 2000);

    // Simuler une approbation
    setTimeout(() => {
      console.log('📤 Simulation: Patient approuve la demande...');
      doctorSocket.emit('test_notification', {
        type: 'access_request_approved',
        message: 'Votre demande d\'accès a été approuvée',
        from: 'patient'
      });
    }, 4000);
  }
}

// Test de latence
async function testLatency(connections) {
  console.log('\n📡 Test 3: Mesure de latence...');

  for (const connection of connections) {
    const { socket, user } = connection;

    if (socket.connected) {
      const startTime = Date.now();

      socket.emit('ping_test', {
        clientTimestamp: startTime,
        message: 'latency_test'
      });

      socket.once('pong_test', (data) => {
        const latency = Date.now() - startTime;
        console.log(`🏓 Latence pour ${user.name}: ${latency}ms`);
      });
    }
  }
}

// Fonction principale de test
async function runTests() {
  try {
    const connections = await testWebSocketConnections();

    // Attendre que toutes les connexions soient établies
    await new Promise(resolve => setTimeout(resolve, 3000));

    await testNotifications(connections);

    await new Promise(resolve => setTimeout(resolve, 2000));

    await testLatency(connections);

    // Nettoyage
    setTimeout(() => {
      console.log('\n🧹 Nettoyage des connexions...');
      connections.forEach(({ socket, user }) => {
        socket.disconnect();
        console.log(`🔌 ${user.name} déconnecté`);
      });

      console.log('\n✅ Tests WebSocket terminés!');
      process.exit(0);
    }, 8000);

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
    process.exit(1);
  }
}

// Démarrer les tests
runTests();