import { useEffect } from 'react';

export const useAccessRequestNotifications = (refreshCallback) => {
  useEffect(() => {
    const handleAccessRequest = (event) => {
      console.log('🔔 Access request notification received:', event.detail);

      // Call the refresh callback if provided
      if (refreshCallback && typeof refreshCallback === 'function') {
        setTimeout(() => {
          refreshCallback();
        }, 100); // Small delay to ensure the request is processed
      }
    };

    // Listen for access request events
    window.addEventListener('accessRequestReceived', handleAccessRequest);
    window.addEventListener('accessRequestStatusChanged', handleAccessRequest);

    // Cleanup
    return () => {
      window.removeEventListener('accessRequestReceived', handleAccessRequest);
      window.removeEventListener('accessRequestStatusChanged', handleAccessRequest);
    };
  }, [refreshCallback]);
};