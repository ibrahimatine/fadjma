const jwt = require('jsonwebtoken');

// Store of connected users by doctorId
const connectedUsers = new Map();

// Authenticate socket connection using JWT token
const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
};

module.exports = (io) => {
  // Authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`👤 User ${socket.userId} connected via WebSocket`);

    // Store connected user
    connectedUsers.set(socket.userId, {
      socketId: socket.id,
      userId: socket.userId,
      role: socket.userRole,
      connectedAt: new Date()
    });

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // If the user is a doctor, join them to the doctors room
    if (socket.userRole === 'doctor') {
      socket.join('doctors');
    }

    // Handle notification acknowledgment
    socket.on('notification_read', (notificationId) => {
      console.log(`📖 Notification ${notificationId} marked as read by user ${socket.userId}`);
      // Here you could update the notification status in database if needed
    });

    // Handle medical record events
    socket.on('medical_record_viewed', (data) => {
      console.log(`👁️ Medical record ${data.recordId} viewed by user ${socket.userId}`);

      // Notify other relevant parties (like the patient or record creator)
      socket.to(`patient_${data.patientId}`).emit('medical_record_activity', {
        type: 'viewed',
        recordId: data.recordId,
        patientId: data.patientId,
        doctorId: socket.userId,
        timestamp: new Date()
      });
    });

    // Handle ping test for latency measurement
    socket.on('ping_test', (data) => {
      console.log(`🏓 Ping test from user ${socket.userId}:`, data);
      // Immediately respond with pong
      socket.emit('pong_test', {
        ...data,
        serverTimestamp: new Date().getTime()
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`👋 User ${socket.userId} disconnected from WebSocket`);
      connectedUsers.delete(socket.userId);
    });

    // Send connection confirmation
    socket.emit('connected', {
      message: 'Successfully connected to WebSocket server',
      userId: socket.userId,
      connectedUsers: connectedUsers.size
    });
  });

  // Helper functions to emit notifications
  io.notifyUser = (userId, notification) => {
    io.to(`user_${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date(),
      id: generateNotificationId()
    });
  };

  io.notifyDoctors = (notification) => {
    io.to('doctors').emit('notification', {
      ...notification,
      timestamp: new Date(),
      id: generateNotificationId()
    });
  };

  io.broadcastMedicalRecordUpdate = (patientId, recordData) => {
    io.emit('medical_record_updated', {
      patientId,
      recordData,
      timestamp: new Date()
    });
  };

  io.notifyNewMedicalRecord = (patientId, recordData, doctorId) => {
    // Notify all connected users except the creator
    io.except(`user_${doctorId}`).emit('new_medical_record', {
      patientId,
      recordData,
      createdBy: doctorId,
      timestamp: new Date()
    });

    console.log(`📄 New medical record created for patient ${patientId} by doctor ${doctorId}`);
  };

  // Get connected users info
  io.getConnectedUsers = () => {
    return Array.from(connectedUsers.values());
  };

  console.log('🔌 WebSocket handlers initialized');
};

// Generate unique notification ID
function generateNotificationId() {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}