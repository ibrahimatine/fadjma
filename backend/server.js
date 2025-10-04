require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const { sequelize } = require('./src/models');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Initialize Hedera client with KMS
    const hederaClient = require('./src/config/hedera');
    await hederaClient.init();
    console.log('✅ Hedera client initialized');

    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Sync database models - SANS alter pour éviter les conflits
    await sequelize.sync({ force: false }); // ⚠️ IMPORTANT: force: false
    console.log('✅ Database synchronized');

    // Create HTTP server
    const server = http.createServer(app);

    // Setup Socket.IO
    const io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    // Make io available to the app
    app.set('io', io);

    // Setup WebSocket connection handling
    require('./src/websocket/socketHandlers')(io);

    // Start status update service
    const statusUpdateService = require('./src/services/statusUpdateService');
    statusUpdateService.startStatusChecker();

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔌 WebSocket server ready`);
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

startServer();