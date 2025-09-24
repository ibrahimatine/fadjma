// src/hooks/useNotifications.js
import { useState, useEffect, useCallback } from 'react';
import { accessService } from '../services/accessService';

export const useNotifications = (userId, enabled = true) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      const response = await accessService.getRequestsForPatient(userId, {
        status: 'pending'
      });

      if (response.success) {
        const requests = response.data.requests || [];
        setNotifications(requests);
        setUnreadCount(requests.length);
      } else {
        throw new Error(response.message || 'Failed to fetch notifications');
      }
    } catch (err) {
      setError(err.message || 'Error fetching notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, enabled]);

  // Mark notification as handled (remove from list)
  const markAsHandled = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Approve access request
  const approveRequest = useCallback(async (requestId, reviewNotes = '') => {
    try {
      const response = await accessService.approveRequest(requestId, reviewNotes);

      if (response.success) {
        markAsHandled(requestId);
        return { success: true, message: 'Demande approuvée avec succès' };
      } else {
        throw new Error(response.message || 'Failed to approve request');
      }
    } catch (err) {
      return { success: false, message: err.message || 'Erreur lors de l\'approbation' };
    }
  }, [markAsHandled]);

  // Reject access request
  const rejectRequest = useCallback(async (requestId, reviewNotes = '') => {
    try {
      const response = await accessService.rejectRequest(requestId, reviewNotes);

      if (response.success) {
        markAsHandled(requestId);
        return { success: true, message: 'Demande rejetée avec succès' };
      } else {
        throw new Error(response.message || 'Failed to reject request');
      }
    } catch (err) {
      return { success: false, message: err.message || 'Erreur lors du rejet' };
    }
  }, [markAsHandled]);

  // Auto-refresh notifications
  useEffect(() => {
    if (!enabled) return;

    fetchNotifications();

    // Set up polling for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications, enabled]);

  return {
    notifications,
    loading,
    error,
    unreadCount,
    fetchNotifications,
    approveRequest,
    rejectRequest,
    markAsHandled
  };
};