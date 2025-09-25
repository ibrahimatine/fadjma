import React, { useState } from 'react';
import { Activity, Zap, Clock } from 'lucide-react';
import websocketService from '../../services/websocketService';

const WebSocketTester = () => {
  const [pingResult, setPingResult] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  const testPing = () => {
    if (!websocketService.socket?.connected) {
      setPingResult({ error: 'WebSocket not connected' });
      return;
    }

    const startTime = Date.now();

    const testEvent = 'ping_test';
    const testData = { timestamp: startTime, testId: Math.random().toString(36) };

    // Listen for response
    const handlePong = (data) => {
      if (data.testId === testData.testId) {
        const endTime = Date.now();
        const latency = endTime - startTime;

        setPingResult({
          latency: latency,
          timestamp: new Date().toLocaleTimeString()
        });

        setTestResults(prev => [{
          latency,
          timestamp: new Date().toLocaleTimeString()
        }, ...prev.slice(0, 9)]); // Keep last 10 results

        websocketService.socket.off('pong_test', handlePong);
      }
    };

    websocketService.socket.on('pong_test', handlePong);
    websocketService.socket.emit(testEvent, testData);
  };

  const getLatencyColor = (latency) => {
    if (latency < 100) return 'text-green-600';
    if (latency < 300) return 'text-yellow-600';
    return 'text-red-600';
  };

  const connectionInfo = websocketService.getConnectionInfo();

  // Show only in development or when explicitly enabled
  if (!isVisible && process.env.NODE_ENV === 'production') {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700"
        title="WebSocket Diagnostics"
      >
        <Activity className="h-4 w-4" />
      </button>
    );
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700"
        title="WebSocket Diagnostics"
      >
        <Activity className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">WebSocket Diagnostics</h3>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Status:</span>
          <div className={`flex items-center gap-2 ${
            connectionInfo.connected ? 'text-green-600' : 'text-red-600'
          }`}>
            <div className={`h-2 w-2 rounded-full ${
              connectionInfo.connected ? 'bg-green-400' : 'bg-red-400'
            }`} />
            {connectionInfo.connected ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        {/* Reconnect Attempts */}
        {connectionInfo.reconnectAttempts > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Reconnects:</span>
            <span className="text-sm text-orange-600">{connectionInfo.reconnectAttempts}</span>
          </div>
        )}

        {/* Ping Test */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Latency Test:</span>
            <button
              onClick={testPing}
              disabled={!connectionInfo.connected}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="h-3 w-3 inline mr-1" />
              Ping
            </button>
          </div>

          {pingResult && (
            <div className={`text-sm ${pingResult.error ? 'text-red-600' : getLatencyColor(pingResult.latency)}`}>
              {pingResult.error || `${pingResult.latency}ms (${pingResult.timestamp})`}
            </div>
          )}
        </div>

        {/* Test Results History */}
        {testResults.length > 0 && (
          <div>
            <div className="text-sm text-gray-600 mb-2 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Recent Tests:
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className={`text-xs flex justify-between ${getLatencyColor(result.latency)}`}>
                  <span>{result.latency}ms</span>
                  <span className="text-gray-400">{result.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Average Latency */}
        {testResults.length > 0 && (
          <div className="border-t border-gray-200 pt-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Average:</span>
              <span className={getLatencyColor(testResults.reduce((sum, r) => sum + r.latency, 0) / testResults.length)}>
                {Math.round(testResults.reduce((sum, r) => sum + r.latency, 0) / testResults.length)}ms
              </span>
            </div>
          </div>
        )}

        {/* Listeners */}
        <div className="text-xs text-gray-500">
          Active listeners: {connectionInfo.listeners.length}
        </div>
      </div>
    </div>
  );
};

export default WebSocketTester;