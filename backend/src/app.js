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
const websocketMiddleware = require('./middleware/websocket');

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

// Logging
app.use(morgan('dev'));

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
// Error handling
app.use(errorHandler);

module.exports = app;
