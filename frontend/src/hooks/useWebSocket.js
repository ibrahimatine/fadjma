import { useEffect, useRef } from 'react';
import websocketService from '../services/websocketService';

export const useWebSocket = (events = [], dependencies = []) => {
  const listenersRef = useRef(new Map());

  useEffect(() => {
    // Setup event listeners
    events.forEach(({ event, handler }) => {
      websocketService.addEventListener(event, handler);

      // Store for cleanup
      if (!listenersRef.current.has(event)) {
        listenersRef.current.set(event, new Set());
      }
      listenersRef.current.get(event).add(handler);
    });

    // Cleanup function
    return () => {
      listenersRef.current.forEach((handlers, event) => {
        handlers.forEach(handler => {
          websocketService.removeEventListener(event, handler);
        });
      });
      listenersRef.current.clear();
    };
  }, dependencies);

  return {
    isConnected: websocketService.isConnected(),
    emitMedicalRecordViewed: websocketService.emitMedicalRecordViewed.bind(websocketService),
    markNotificationAsRead: websocketService.markNotificationAsRead.bind(websocketService),
    getConnectionInfo: websocketService.getConnectionInfo.bind(websocketService)
  };
};