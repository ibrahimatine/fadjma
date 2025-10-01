import io from 'socket.io-client';
import toast from 'react-hot-toast';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(token) {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    const serverUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    console.log('Connecting to WebSocket server...');

    this.socket = io(serverUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      timeout: 5000, // 5 second connection timeout
      forceNew: true // Force a new connection
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;

      // Notify all listeners about connection
      this.notifyListeners('connection_status', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.notifyListeners('connection_status', { connected: false, reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 WebSocket connection error:', error);
      this.handleReconnection();
    });

    // Server confirmation
    this.socket.on('connected', (data) => {
      console.log('🎉 WebSocket server confirmation:', data);
      toast('Connexion temps réel établie', {
        duration: 2000,
        position: 'bottom-right',
        type: 'success'
      });
    });

    // Notification handling
    this.socket.on('notification', (notification) => {
      const receivedTime = new Date();
      console.log(`🔔 Notification received at ${receivedTime.toISOString()}:`, notification);

      // Calculate delay if timestamp is available
      if (notification.timestamp) {
        const sentTime = new Date(notification.timestamp);
        const delay = receivedTime - sentTime;
        console.log(`⏱️ Notification delay: ${delay}ms`);
      }

      this.handleNotification(notification);
    });

    // New access request handling (for patients)
    this.socket.on('new_access_request', (requestData) => {
      console.log('📋 New access request received:', requestData);

      toast((t) => (
        <div className="p-2">
          <div className="font-semibold text-gray-800 mb-2">
            🏥 Nouvelle demande d'accès
          </div>
          <p className="text-sm text-gray-600 mb-3">
            {requestData.message}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                // Trigger notification center refresh
                window.dispatchEvent(new CustomEvent('refreshNotifications'));
                toast.dismiss(t.id);
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              Voir les demandes
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-1 rounded text-sm transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      ), {
        duration: 10000,
        style: {
          maxWidth: '400px',
          padding: 0
        }
      });

      // Notify listeners
      this.notifyListeners('new_access_request', requestData);
    });

    // Access request status changes (for doctors)
    this.socket.on('access_request_status_changed', (notification) => {
      console.log('🔐 Access request status changed:', notification);

      const isApproved = notification.status === 'approved';

      toast.success(notification.message, {
        duration: 6000,
        icon: isApproved ? '✅' : '❌'
      });

      // Refresh dashboards and access status
      window.dispatchEvent(new CustomEvent('refreshDashboard'));
      window.dispatchEvent(new CustomEvent('accessRequestStatusChanged', {
        detail: notification
      }));

      this.notifyListeners('access_request_status_changed', notification);
    });

    // Prescription status changes (for patients and doctors)
    this.socket.on('prescription_status_changed', (notification) => {
      console.log('💊 Prescription status changed:', notification);

      const statusIcons = {
        'validated': '✅',
        'in_preparation': '⚗️',
        'ready': '🎯',
        'delivered': '📦'
      };

      toast.success(notification.message, {
        duration: 5000,
        icon: statusIcons[notification.status] || '💊'
      });

      // Trigger prescription refresh
      window.dispatchEvent(new CustomEvent('refreshPrescriptions', {
        detail: {
          prescriptionId: notification.prescriptionId,
          status: notification.status
        }
      }));

      this.notifyListeners('prescription_status_changed', notification);
    });

    // Medical record events
    this.socket.on('new_medical_record', (data) => {
      console.log('📄 New medical record event:', data);

      // Show notification to user
      toast(`Nouveau dossier médical ajouté pour ${data.patientName}`, {
        duration: 4000,
        position: 'top-right',
        type: 'success'
      });

      // Notify listeners
      this.notifyListeners('new_medical_record', data);
    });

    this.socket.on('medical_record_updated', (data) => {
      console.log('📝 Medical record updated:', data);

      toast('Dossier médical mis à jour', {
        duration: 3000,
        position: 'top-right',
        type: 'info'
      });

      this.notifyListeners('medical_record_updated', data);
    });

    this.socket.on('medical_record_activity', (data) => {
      console.log('👁️ Medical record activity:', data);
      this.notifyListeners('medical_record_activity', data);
    });

    // Appointment notifications
    this.socket.on('new_appointment', (notification) => {
      console.log('📅 New appointment notification:', notification);

      toast((t) => (
        <div className="p-3">
          <div className="font-bold text-gray-900 mb-2 flex items-center gap-2">
            <span className="text-2xl">📅</span>
            Nouveau rendez-vous
          </div>
          <p className="text-sm text-gray-700 mb-2">
            {notification.message}
          </p>
          <div className="text-xs text-gray-600 mb-3 space-y-1">
            {notification.patientName && (
              <div>Patient: <span className="font-medium">{notification.patientName}</span></div>
            )}
            {notification.appointmentDate && notification.appointmentTime && (
              <div>Date: <span className="font-medium">
                {new Date(notification.appointmentDate).toLocaleDateString('fr-FR')} à {notification.appointmentTime.slice(0, 5)}
              </span></div>
            )}
            {notification.specialty && (
              <div>Spécialité: <span className="font-medium">{notification.specialty}</span></div>
            )}
          </div>
          <div className="flex gap-2">
            {notification.appointmentId && (
              <>
                <button
                  onClick={async () => {
                    try {
                      const api = (await import('./api')).default;
                      await api.put(`/appointments/${notification.appointmentId}/confirm`);
                      toast.success('✅ Rendez-vous confirmé', { id: t.id });
                      window.dispatchEvent(new CustomEvent('refreshAppointments'));
                    } catch (error) {
                      toast.error('Erreur lors de la confirmation', { id: t.id });
                    }
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  ✓ Confirmer
                </button>
                <button
                  onClick={async () => {
                    const reason = prompt('Raison du rejet (optionnel):');
                    if (reason === null) return; // User cancelled
                    try {
                      const api = (await import('./api')).default;
                      await api.put(`/appointments/${notification.appointmentId}/cancel`, {
                        cancellationReason: reason || 'Rejeté par le secrétariat'
                      });
                      toast.success('Rendez-vous annulé', { id: t.id });
                      window.dispatchEvent(new CustomEvent('refreshAppointments'));
                    } catch (error) {
                      toast.error('Erreur lors de l\'annulation', { id: t.id });
                    }
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  ✗ Rejeter
                </button>
              </>
            )}
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full mt-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          >
            Fermer
          </button>
        </div>
      ), {
        duration: 20000, // 20 seconds pour laisser le temps de répondre
        style: {
          maxWidth: '450px',
          padding: 0
        }
      });

      this.notifyListeners('new_appointment', notification);
    });

    this.socket.on('appointment_confirmed', (notification) => {
      console.log('✅ Appointment confirmed:', notification);

      toast.success(notification.message, {
        duration: 5000,
        icon: '✅'
      });

      window.dispatchEvent(new CustomEvent('refreshAppointments'));
      this.notifyListeners('appointment_confirmed', notification);
    });

    this.socket.on('appointment_cancelled', (notification) => {
      console.log('❌ Appointment cancelled:', notification);

      toast.error(notification.message, {
        duration: 5000,
        icon: '❌'
      });

      window.dispatchEvent(new CustomEvent('refreshAppointments'));
      this.notifyListeners('appointment_cancelled', notification);
    });
  }

  handleNotification(notification) {
    // Show toast notification based on type
    switch (notification.type) {
      case 'new_appointment':
        toast(notification.message, {
          duration: 6000,
          position: 'top-right',
          icon: '📅'
        });
        window.dispatchEvent(new CustomEvent('refreshAppointments'));
        break;

      case 'appointment_confirmed':
        toast.success(notification.message, {
          duration: 5000,
          position: 'top-right',
          icon: '✅'
        });
        window.dispatchEvent(new CustomEvent('refreshAppointments'));
        break;

      case 'appointment_cancelled':
        toast.error(notification.message, {
          duration: 5000,
          position: 'top-right',
          icon: '❌'
        });
        window.dispatchEvent(new CustomEvent('refreshAppointments'));
        break;

      case 'new_medical_record':
        toast(notification.message, {
          duration: 5000,
          position: 'top-right',
          icon: '📄'
        });
        break;

      case 'access_request':
      case 'new_access_request':
        toast(notification.message, {
          duration: 6000,
          position: 'top-right',
          icon: '🔐'
        });
        break;

      case 'access_request_approved':
        toast.success(notification.message, {
          duration: 5000,
          position: 'top-right',
          icon: '✅'
        });
        // Refresh dashboard to show new access
        window.dispatchEvent(new CustomEvent('refreshDashboard'));
        break;

      case 'access_request_rejected':
        toast.error(notification.message, {
          duration: 5000,
          position: 'top-right',
          icon: '❌'
        });
        break;

      case 'access_revoked':
        toast.error(notification.message, {
          duration: 4000,
          position: 'top-right',
          icon: '❌'
        });
        break;

      case 'prescription_updated':
        toast.info(notification.message, {
          duration: 4000,
          position: 'top-right',
          icon: '💊'
        });
        break;

      case 'medical_record_created':
        toast.success(notification.message, {
          duration: 4000,
          position: 'top-right',
          icon: '📝'
        });
        break;

      default:
        toast(notification.message, {
          duration: 3000,
          position: 'top-right'
        });
    }

    // Notify listeners
    this.notifyListeners('notification', notification);

    // Mark notification as read after showing
    if (notification.id) {
      this.markNotificationAsRead(notification.id);
    }
  }

  handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

      console.log(`🔄 Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

      setTimeout(() => {
        if (this.socket && !this.socket.connected) {
          this.socket.connect();
        }
      }, delay);
    } else {
      console.error('❌ Max reconnection attempts reached');
      toast('Connexion temps réel perdue. Rechargez la page.', {
        duration: 0, // Persistent
        position: 'bottom-center',
        type: 'error'
      });
    }
  }

  // Event listener management
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  removeEventListener(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in WebSocket listener:', error);
        }
      });
    }
  }

  // Utility methods
  markNotificationAsRead(notificationId) {
    if (this.socket?.connected) {
      this.socket.emit('notification_read', notificationId);
    }
  }

  emitMedicalRecordViewed(recordId, patientId) {
    if (this.socket?.connected) {
      this.socket.emit('medical_record_viewed', {
        recordId,
        patientId
      });
    }
  }

  // Connection status
  isConnected() {
    return this.socket?.connected || false;
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting WebSocket...');
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      this.reconnectAttempts = 0;
    }
  }

  // Get connection info
  getConnectionInfo() {
    return {
      connected: this.isConnected(),
      socket: this.socket,
      listeners: Array.from(this.listeners.keys()),
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;