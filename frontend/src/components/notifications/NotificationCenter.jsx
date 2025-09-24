// src/components/notifications/NotificationCenter.jsx
import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  Check,
  XIcon,
  Clock,
  User,
  FileText,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { accessService } from '../../services/accessService';
import toast from 'react-hot-toast';

const NotificationCenter = ({ isOpen, onClose, userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingIds, setProcessingIds] = useState(new Set());

  // Fetch notifications (access requests for this patient)
  const fetchNotifications = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await accessService.getRequestsForPatient(userId, {
        status: 'pending'
      });

      if (response.success) {
        setNotifications(response.data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Erreur lors du chargement des notifications');
    } finally {
      setLoading(false);
    }
  };

  // Handle approve request
  const handleApprove = async (requestId) => {
    console.log('Approving request:', requestId);
    setProcessingIds(prev => new Set([...prev, requestId]));

    try {
      const response = await accessService.approveRequest(requestId, 'Accès approuvé par le patient');
      console.log('Approve response:', response);

      if (response.success) {
        toast.success('Demande d\'accès approuvée');
        setNotifications(prev => prev.filter(n => n.id !== requestId));
      } else {
        toast.error(response.message || 'Erreur lors de l\'approbation');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error(error.message || 'Erreur lors de l\'approbation');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  // Handle reject request
  const handleReject = async (requestId, reason = '') => {
    console.log('Rejecting request:', requestId);
    const rejectReason = reason || prompt(
      'Veuillez indiquer la raison du refus (optionnel) :',
      'Accès refusé par le patient'
    );

    if (rejectReason === null) return; // User cancelled prompt

    setProcessingIds(prev => new Set([...prev, requestId]));

    try {
      const response = await accessService.rejectRequest(requestId, rejectReason || 'Accès refusé');
      console.log('Reject response:', response);

      if (response.success) {
        toast.success('Demande d\'accès rejetée');
        setNotifications(prev => prev.filter(n => n.id !== requestId));
      } else {
        toast.error(response.message || 'Erreur lors du rejet');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error(error.message || 'Erreur lors du rejet');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  // Load notifications when opened
  useEffect(() => {
    if (isOpen && userId) {
      fetchNotifications();
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Bell className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Centre de notifications
              </h3>
              <p className="text-sm text-gray-600">
                Demandes d'accès à vos dossiers médicaux
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-auto max-h-[60vh]">
          {loading ? (
            // Loading state
            <div className="p-8 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            // Empty state
            <div className="p-8 text-center">
              <div className="bg-gray-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Aucune notification
              </h4>
              <p className="text-gray-600">
                Vous n'avez aucune demande d'accès en attente
              </p>
            </div>
          ) : (
            // Notifications list
            <div className="p-4 space-y-4">
              {notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onApprove={() => handleApprove(notification.id)}
                  onReject={() => handleReject(notification.id)}
                  processing={processingIds.has(notification.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{notifications.length} demande(s) en attente</span>
              <button
                onClick={fetchNotifications}
                className="text-blue-600 hover:text-blue-700 font-medium"
                disabled={loading}
              >
                Actualiser
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Individual notification card
const NotificationCard = ({ notification, onApprove, onReject, processing }) => {
  const requester = notification.requester;
  const timeAgo = getTimeAgo(notification.createdAt);

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <User className="h-5 w-5 text-yellow-600" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium text-gray-900">
                Demande d'accès médical
              </h4>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                En attente
              </span>
            </div>

            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <span className="font-medium">Demandeur:</span> Dr. {requester?.firstName} {requester?.lastName}
              </p>

              {requester?.licenseNumber && (
                <p>
                  <span className="font-medium">Licence:</span> {requester.licenseNumber}
                </p>
              )}

              <p>
                <span className="font-medium">Niveau d'accès:</span>{' '}
                <span className={`px-2 py-1 rounded text-xs ${
                  notification.accessLevel === 'read' ? 'bg-blue-100 text-blue-800' :
                  notification.accessLevel === 'write' ? 'bg-orange-100 text-orange-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {notification.accessLevel === 'read' ? 'Lecture seule' :
                   notification.accessLevel === 'write' ? 'Lecture et écriture' :
                   notification.accessLevel}
                </span>
              </p>

              {notification.reason && (
                <p>
                  <span className="font-medium">Raison:</span> {notification.reason}
                </p>
              )}

              {notification.expiresAt && (
                <p>
                  <span className="font-medium">Expire le:</span>{' '}
                  {new Date(notification.expiresAt).toLocaleDateString('fr-FR')}
                </p>
              )}

              <p className="text-gray-500">
                <Clock className="h-4 w-4 inline mr-1" />
                Demandé {timeAgo}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={onReject}
            disabled={processing}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Rejeter"
          >
            <XIcon className="h-5 w-5" />
          </button>
          <button
            onClick={onApprove}
            disabled={processing}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
            title="Approuver"
          >
            <Check className="h-5 w-5" />
          </button>
        </div>
      </div>

      {processing && (
        <div className="mt-3 pt-3 border-t border-yellow-200">
          <div className="flex items-center gap-2 text-sm text-yellow-700">
            <div className="animate-spin h-4 w-4 border-2 border-yellow-600 border-t-transparent rounded-full"></div>
            Traitement en cours...
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get time ago
const getTimeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));

  if (diffInMinutes < 1) return 'à l\'instant';
  if (diffInMinutes < 60) return `il y a ${diffInMinutes} min`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `il y a ${diffInHours}h`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `il y a ${diffInDays} jour(s)`;

  return date.toLocaleDateString('fr-FR');
};

export default NotificationCenter;