const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const authRoutes = require('./routes/newAuthRoutes'); // Utiliser directement la nouvelle architecture
const recordRoutes = require('./routes/recordRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const patientRoutes = require('./routes/patientRoutes');
const accessRoutes = require('./routes/accessRoutes');
const errorHandler = require('./middleware/errorHandler');
const pharmacyRoutes = require('./routes/pharmacyRoutes');
const monitoringRoutes = require('./routes/monitoringRoutes');
const websocketMiddleware = require('./middleware/websocket');
const requestLogger = require('./middleware/requestLogger');
const logger = require('./utils/logger');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(requestLogger); // Notre système de logging personnalisé
app.use(morgan('dev')); // Garder morgan pour la console en développement

// WebSocket middleware
app.use(websocketMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/verify', verificationRoutes);
app.use('/api/nft', require('./routes/nftRoutes'));
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/access-requests', accessRoutes);
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/history', require('./routes/historyRoutes'));
app.use('/api/medication', require('./routes/medicationTraceabilityRoutes'));
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/logs', require('./routes/logRoutes'));

// Nouvelles routes
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/prescription-groups', require('./routes/prescriptionGroupRoutes'));

// Error handling
app.use(errorHandler);

module.exports = app;
