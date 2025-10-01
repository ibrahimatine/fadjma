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
    console.log(`👤 User ${socket.userId} (${socket.userRole}) connected via WebSocket`);

    // Store connected user
    connectedUsers.set(socket.userId, {
      socketId: socket.id,
      userId: socket.userId,
      role: socket.userRole,
      connectedAt: new Date()
    });

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // Join role-based rooms
    if (socket.userRole === 'doctor') {
      socket.join('doctors');
    } else if (socket.userRole === 'pharmacist') {
      socket.join('pharmacists');
    } else if (socket.userRole === 'patient') {
      socket.join('patients');
    } else if (socket.userRole === 'assistant') {
      socket.join('assistants');
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
    console.log(`🔔 Sending notification to user ${userId}:`, notification.type);
    io.to(`user_${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date(),
      id: generateNotificationId()
    });
  };

  io.notifyDoctors = (notification) => {
    console.log(`🏥 Broadcasting to all doctors:`, notification.type);
    io.to('doctors').emit('notification', {
      ...notification,
      timestamp: new Date(),
      id: generateNotificationId()
    });
  };

  io.notifyPharmacists = (notification) => {
    console.log(`💊 Broadcasting to all pharmacists:`, notification.type);
    io.to('pharmacists').emit('notification', {
      ...notification,
      timestamp: new Date(),
      id: generateNotificationId()
    });
  };

  io.notifyPatients = (notification) => {
    console.log(`🤒 Broadcasting to all patients:`, notification.type);
    io.to('patients').emit('notification', {
      ...notification,
      timestamp: new Date(),
      id: generateNotificationId()
    });
  };

  io.notifyAssistants = (notification) => {
    console.log(`👔 Broadcasting to all assistants:`, notification.type);
    io.to('assistants').emit('notification', {
      ...notification,
      timestamp: new Date(),
      id: generateNotificationId()
    });
  };

  // Notify about access request status changes
  io.notifyAccessRequestUpdate = (requestId, status, patientId, doctorId) => {
    const notification = {
      type: 'access_request_updated',
      requestId,
      status,
      patientId,
      doctorId,
      message: status === 'approved'
        ? 'Votre demande d\'accès a été approuvée'
        : status === 'rejected'
          ? 'Votre demande d\'accès a été rejetée'
          : 'Statut de la demande d\'accès mis à jour',
      timestamp: new Date(),
      id: generateNotificationId()
    };

    // Notify the doctor about the status change
    io.to(`user_${doctorId}`).emit('access_request_status_changed', notification);

    // Notify the patient about the action taken
    io.to(`user_${patientId}`).emit('notification', {
      ...notification,
      message: status === 'approved'
        ? 'Vous avez approuvé une demande d\'accès'
        : 'Vous avez rejeté une demande d\'accès'
    });

    console.log(`🔐 Access request ${requestId} ${status} - notified doctor ${doctorId} and patient ${patientId}`);
  };

  // Notify about new access requests
  io.notifyNewAccessRequest = (requestData) => {
    const notification = {
      type: 'new_access_request',
      requestId: requestData.id,
      doctorId: requestData.doctorId,
      patientId: requestData.patientId,
      accessLevel: requestData.accessLevel,
      reason: requestData.reason,
      message: `Nouvelle demande d'accès de Dr. ${requestData.doctorName}`,
      timestamp: new Date(),
      id: generateNotificationId()
    };

    // Notify the patient about the new request
    io.to(`user_${requestData.patientId}`).emit('new_access_request', notification);

    console.log(`📋 New access request from doctor ${requestData.doctorId} to patient ${requestData.patientId}`);
  };

  // Notify about prescription status changes
  io.notifyPrescriptionUpdate = (prescriptionId, status, patientId, pharmacistId) => {
    const statusMessages = {
      'validated': 'Votre prescription a été validée',
      'in_preparation': 'Votre prescription est en préparation',
      'ready': 'Votre prescription est prête',
      'delivered': 'Votre prescription a été livrée'
    };

    const notification = {
      type: 'prescription_updated',
      prescriptionId,
      status,
      patientId,
      pharmacistId,
      message: statusMessages[status] || 'Statut de prescription mis à jour',
      timestamp: new Date(),
      id: generateNotificationId()
    };

    // Notify the patient about prescription status change
    io.to(`user_${patientId}`).emit('prescription_status_changed', notification);

    console.log(`💊 Prescription ${prescriptionId} ${status} - notified patient ${patientId}`);
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