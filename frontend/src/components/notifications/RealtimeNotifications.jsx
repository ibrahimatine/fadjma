import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, FileText, User } from 'lucide-react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAuth } from '../../hooks/useAuth';
import { accessService } from '../../services/accessService';
import toast from 'react-hot-toast';
import { formatTimestamp } from '../../utils/formatters';

const RealtimeNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [accessRequests, setAccessRequests] = useState([]);
  const [accessRequestsCount, setAccessRequestsCount] = useState(0);

  const { user } = useAuth();
  const isPatient = user?.role === 'patient';

  // Load access requests for patients
  const loadAccessRequests = async () => {
    if (!isPatient || !user?.id) return;

    try {
      const response = await accessService.getRequestsForPatient(user.id, {
        status: 'pending'
      });
      console.log('Access requests loaded:', response);
      if (response.success) {
        const requests = response.data.requests || [];
        setAccessRequests(requests);
        setAccessRequestsCount(requests.length);
      }
    } catch (error) {
      console.error('Error loading access requests:', error);
    }
  };

  // Load notifications from localStorage
  const loadPersistedNotifications = () => {
    try {
      const saved = localStorage.getItem('realtime_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        const recent = parsed.filter(n => {
          // Keep notifications from last 24 hours
          const notifTime = new Date(n.timestamp);
          const now = new Date();
          return (now - notifTime) < 24 * 60 * 60 * 1000;
        });

        setNotifications(recent);
        setUnreadCount(recent.filter(n => !n.read).length);
      }
    } catch (error) {
      console.error('Error loading persisted notifications:', error);
    }
  };

  // Persist notifications to localStorage
  const persistNotifications = (notifs) => {
    try {
      localStorage.setItem('realtime_notifications', JSON.stringify(notifs));
    } catch (error) {
      console.error('Error persisting notifications:', error);
    }
  };

  // WebSocket event handlers
  const handleNotification = (notification) => {
    const newNotifications = [notification, ...notifications.slice(0, 49)];
    setNotifications(newNotifications);
    setUnreadCount(prev => prev + 1);

    // Persist to localStorage
    persistNotifications(newNotifications);

    // Auto-refresh for access request notifications
    if (notification.type === 'access_request' && isPatient) {
      loadAccessRequests();
    }
  };

  const handleNewMedicalRecord = (data) => {
    const notification = {
      id: `medical_record_${Date.now()}`,
      type: 'new_medical_record',
      title: 'Nouveau dossier médical',
      message: `Nouveau dossier médical ajouté pour ${data.patientName}`,
      timestamp: new Date(),
      data: data,
      read: false
    };
    handleNotification(notification);
  };

  const handleConnectionStatus = (status) => {
    if (!status.connected && status.reason !== 'io client disconnect') {
      const notification = {
        id: `connection_${Date.now()}`,
        type: 'connection_error',
        title: 'Connexion interrompue',
        message: 'La connexion temps réel a été interrompue. Reconnexion en cours...',
        timestamp: new Date(),
        read: false
      };
      handleNotification(notification);
    }
  };

  const { isConnected, markNotificationAsRead } = useWebSocket([
    { event: 'notification', handler: handleNotification },
    { event: 'new_medical_record', handler: handleNewMedicalRecord },
    { event: 'connection_status', handler: handleConnectionStatus }
  ]);

  // Load data on mount
  useEffect(() => {
    loadPersistedNotifications();
    if (isPatient) {
      loadAccessRequests();
    }
  }, [isPatient, user?.id]);

  const markAsRead = (notificationId) => {
    const updatedNotifications = notifications.map(notif =>
      notif.id === notificationId ? { ...notif, read: true } : notif
    );
    setNotifications(updatedNotifications);
    setUnreadCount(prev => Math.max(0, prev - 1));

    // Persist updated notifications
    persistNotifications(updatedNotifications);

    markNotificationAsRead(notificationId);
  };

  const markAllAsRead = () => {
    const unreadNotifications = notifications.filter(n => !n.read);
    unreadNotifications.forEach(notif => markNotificationAsRead(notif.id));

    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  };

  const clearNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_medical_record':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'access_granted':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'access_denied':
        return <X className="h-5 w-5 text-red-500" />;
      case 'access_request':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'connection_error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };


  // Total unread count (notifications + access requests)
  const totalUnreadCount = unreadCount + (isPatient ? accessRequestsCount : 0);

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
      >
        <Bell className="h-6 w-6" />
        {totalUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
          </span>
        )}
        {/* Connection status indicator */}
        <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${
          isConnected ? 'bg-green-400' : 'bg-red-400'
        }`} />
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Tout marquer comme lu
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Connection Status */}
            <div className={`mt-2 flex items-center gap-2 text-sm ${
              isConnected ? 'text-green-600' : 'text-red-600'
            }`}>
              <div className={`h-2 w-2 rounded-full ${
                isConnected ? 'bg-green-400' : 'bg-red-400'
              }`} />
              {isConnected ? 'Temps réel connecté' : 'Hors ligne'}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {/* Access Requests Section (for patients only) */}
            {isPatient && accessRequests.length > 0 && (
              <div className="border-b border-gray-200">
                <div className="p-3 bg-yellow-50">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <User className="h-4 w-4 text-yellow-600" />
                    Demandes d'accès en attente ({accessRequests.length})
                  </h4>
                </div>
                {accessRequests.map((request) => (
                  <AccessRequestItem key={request.id} request={request} onUpdate={loadAccessRequests} />
                ))}
              </div>
            )}

            {/* Regular Notifications */}
            {notifications.length === 0 && (!isPatient || accessRequests.length === 0) ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>Aucune notification</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="h-2 w-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Marquer comme lu"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => clearNotification(notification.id)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Supprimer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800">
                Voir toutes les notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Access Request Item Component
const AccessRequestItem = ({ request, onUpdate }) => {
  const [processing, setProcessing] = useState(false);

  const handleApprove = async () => {
    setProcessing(true);
    try {
      const response = await accessService.approveRequest(request.id, 'Accès approuvé par le patient');
      if (response.success) {
        toast.success('Demande d\'accès approuvée');
        onUpdate(); // Refresh the list
        window.dispatchEvent(new CustomEvent('accessRequestStatusChanged', { detail: { requestId: request.id, status: 'approved' } }));
      } else {
        toast.error(response.message || 'Erreur lors de l\'approbation');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error(error.message || 'Erreur lors de l\'approbation');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Raison du refus (optionnel):', 'Accès refusé par le patient');
    if (reason === null) return;

    setProcessing(true);
    try {
      const response = await accessService.rejectRequest(request.id, reason);
      if (response.success) {
        toast.success('Demande d\'accès rejetée');
        onUpdate(); // Refresh the list
        window.dispatchEvent(new CustomEvent('accessRequestStatusChanged', { detail: { requestId: request.id, status: 'rejected' } }));
      } else {
        toast.error(response.message || 'Erreur lors du rejet');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error(error.message || 'Erreur lors du rejet');
    } finally {
      setProcessing(false);
    }
  };

  const timeAgo = formatTimestamp(request.createdAt);

  return (
    <div className="p-3 bg-yellow-50 border-b border-yellow-100">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900 mb-1">
            Dr. {request.requester.firstName} {request.requester.lastName}
          </div>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Accès: {request.accessLevel === 'read' ? 'Lecture seule' : 'Lecture/Écriture'}</div>
            {request.reason && <div>Raison: {request.reason}</div>}
            <div className="text-gray-400">{timeAgo}</div>
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={handleReject}
            disabled={processing}
            className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
            title="Refuser"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            onClick={handleApprove}
            disabled={processing}
            className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
            title="Approuver"
          >
            <CheckCircle className="h-4 w-4" />
          </button>
        </div>
      </div>
      {processing && (
        <div className="mt-2 text-xs text-yellow-700 flex items-center gap-1">
          <div className="animate-spin h-3 w-3 border border-yellow-600 border-t-transparent rounded-full"></div>
          Traitement en cours...
        </div>
      )}
    </div>
  );
};

export default RealtimeNotifications;