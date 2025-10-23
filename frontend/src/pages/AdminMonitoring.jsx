import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  HardDrive,
  LineChart,
  Monitor,
  RefreshCw,
  Server,
  TrendingDown,
  TrendingUp,
  Wifi,
  WifiOff,
  Zap,
  BarChart3,
  AlertCircle,
  Info,
  Terminal,
  Eye,
  RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../services/adminService';

const AdminMonitoring = () => {
  const [metrics, setMetrics] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [failedAnchors, setFailedAnchors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedLogType, setSelectedLogType] = useState('all');
  const [expandedAlert, setExpandedAlert] = useState(null);
  const [retryingAnchor, setRetryingAnchor] = useState(null);

  useEffect(() => {
    loadMonitoringData();

    let interval;
    if (autoRefresh) {
      interval = setInterval(loadMonitoringData, 10000); // Refresh every 10 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadMonitoringData = async () => {
    if (!autoRefresh) setLoading(true);

    try {
      const [metricsRes, healthRes, alertsRes, logsRes, failedAnchorsRes] = await Promise.allSettled([
        adminService.getMonitoringMetrics(),
        adminService.getSystemHealth(),
        adminService.getActiveAlerts(),
        adminService.getSystemLogs(100, selectedLogType === 'all' ? null : selectedLogType),
        adminService.getFailedAnchors(20)
      ]);
console.log(metricsRes, healthRes, alertsRes, logsRes, failedAnchorsRes);
      if (metricsRes.status === 'fulfilled') {
        setMetrics(metricsRes.value);
      }

      if (healthRes.status === 'fulfilled') {
        setSystemHealth(healthRes.value);
      }

      if (alertsRes.status === 'fulfilled') {
        setAlerts(alertsRes.value.alerts);
      }

      if (logsRes.status === 'fulfilled') {
        setLogs(logsRes.value.logs);
      }

      if (failedAnchorsRes.status === 'fulfilled') {
        setFailedAnchors(failedAnchorsRes.value.failedAnchors || []);
      }

      if (!autoRefresh) {
        toast.success('Monitoring data updated');
      }

    } catch (error) {
      console.error('Monitoring data error:', error);
      if (!autoRefresh) {
        toast.error('Error loading monitoring data');
      }
    } finally {
      if (!autoRefresh) setLoading(false);
    }
  };

  const resetMetrics = async () => {
    try {
      await adminService.resetMonitoringMetrics();
      await loadMonitoringData();
      toast.success('Metrics reset successfully');
    } catch (error) {
      console.error('Reset metrics error:', error);
      toast.error('Error resetting metrics');
    }
  };

  const handleRetryAnchor = async (anchor) => {
    try {
      setRetryingAnchor(anchor.id);
      toast.loading(`Re-anchoring ${anchor.type}...`, { id: `retry-${anchor.id}` });

      const result = await adminService.retryAnchor(anchor.id, anchor.type);

      if (result.success) {
        toast.success(result.message, { id: `retry-${anchor.id}` });
        // Recharger les ancrages échoués
        const failedAnchorsRes = await adminService.getFailedAnchors(20);
        setFailedAnchors(failedAnchorsRes.failedAnchors || []);
      } else {
        toast.error('Re-anchor failed', { id: `retry-${anchor.id}` });
      }
    } catch (error) {
      console.error('Retry anchor error:', error);
      toast.error(error.response?.data?.message || 'Error re-anchoring', { id: `retry-${anchor.id}` });
    } finally {
      setRetryingAnchor(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getUptimeColor = (uptime) => {
    if (uptime >= 95) return 'text-green-600';
    if (uptime >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatBytes = (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('fr-FR');
  };

  const getLogTypeIcon = (type) => {
    switch (type) {
      case 'hedera': return <Server className="h-4 w-4 text-purple-600" />;
      case 'system': return <Monitor className="h-4 w-4 text-blue-600" />;
      case 'database': return <Database className="h-4 w-4 text-green-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusIcon = (status) => {
    if (status >= 200 && status < 300) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (status >= 400) return <AlertTriangle className="h-4 w-4 text-red-600" />;
    return <Info className="h-4 w-4 text-blue-600" />;
  };

  if (!metrics || !systemHealth) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Chargement des données de monitoring...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">System Monitoring</h1>
                <p className="text-gray-600">Real-time monitoring of FADJMA platform</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  Auto-refresh (10s)
                </label>
              </div>

              <button
                onClick={loadMonitoringData}
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </button>

              <button
                onClick={resetMetrics}
                className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Reset Métriques
              </button>
            </div>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {systemHealth.status === 'healthy' ? (
                  <Wifi className="h-8 w-8 text-green-600" />
                ) : (
                  <WifiOff className="h-8 w-8 text-red-600" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500">Statut Global</p>
                  <p className={`text-lg font-semibold ${getStatusColor(systemHealth.status).split(' ')[0]}`}>
                    {systemHealth.status === 'healthy' ? 'Sain' :
                     systemHealth.status === 'degraded' ? 'Dégradé' : 'Défaillant'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3">
              <Server className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-500">Uptime Hedera</p>
                <p className={`text-lg font-semibold ${getUptimeColor(metrics.hedera.uptime)}`}>
                  {metrics.hedera.uptime}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-500">Alertes Actives</p>
                <p className="text-lg font-semibold text-gray-900">{alerts.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3">
              <HardDrive className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-500">Mémoire</p>
                <p className="text-lg font-semibold text-gray-900">{metrics.system.memoryUsage} MB</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alertes */}
        {alerts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Active Alerts ({alerts.length})
            </h2>
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-800">{alert.message}</p>
                      <p className="text-sm text-red-600">{formatTimestamp(alert.timestamp)}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    alert.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {alert.type === 'error' ? 'Error' : 'Warning'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Failed Anchors */}
        {failedAnchors.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Failed Hedera Anchors ({failedAnchors.length})
            </h2>
            <div className="space-y-3">
              {failedAnchors.map((anchor) => (
                <div key={`${anchor.type}-${anchor.id}`} className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Server className="h-5 w-5 text-orange-600" />
                      <div className="flex-1">
                        <p className="font-medium text-orange-900">{anchor.title}</p>
                        <div className="flex items-center gap-3 text-sm text-orange-700 mt-1">
                          <span className="flex items-center gap-1">
                            <span className="font-medium">Type:</span> {anchor.type === 'medical_record' ? 'Medical Record' : 'Prescription'}
                          </span>
                          {anchor.medication && (
                            <span className="flex items-center gap-1">
                              <span className="font-medium">Medication:</span> {anchor.medication}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 ml-8">
                      <div>
                        <span className="font-medium">Patient:</span> {anchor.patientName}
                      </div>
                      <div>
                        <span className="font-medium">Doctor:</span> {anchor.doctorName}
                      </div>
                      <div>
                        <span className="font-medium">Created:</span> {formatTimestamp(anchor.createdAt)}
                      </div>
                      <div>
                        <span className="font-medium">Last Attempt:</span> {formatTimestamp(anchor.lastAttempt)}
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">Error:</span>{' '}
                        <span className="text-red-600">{anchor.error}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRetryAnchor(anchor)}
                    disabled={retryingAnchor === anchor.id}
                    className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-4"
                  >
                    <RotateCcw className={`h-4 w-4 ${retryingAnchor === anchor.id ? 'animate-spin' : ''}`} />
                    {retryingAnchor === anchor.id ? 'Re-anchoring...' : 'Re-anchor'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Métriques détaillées */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Métriques Hedera */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Server className="h-5 w-5 text-purple-600" />
              Hedera Consensus Service
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total Transactions</span>
                <span className="font-semibold">{metrics.hedera.totalTransactions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Succès</span>
                <span className="font-semibold text-green-600">{metrics.hedera.successfulTransactions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Échecs</span>
                <span className="font-semibold text-red-600">{metrics.hedera.failedTransactions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Simulées</span>
                <span className="font-semibold text-blue-600">{metrics.hedera.simulatedTransactions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Temps Réponse Moyen</span>
                <span className="font-semibold">{Math.round(metrics.hedera.averageResponseTime)}ms</span>
              </div>
              {metrics.hedera.lastSuccessTime && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Dernier Succès</span>
                  <span className="text-xs text-gray-700">{formatTimestamp(metrics.hedera.lastSuccessTime)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Métriques Système */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Monitor className="h-5 w-5 text-blue-600" />
              Système
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">CPU</span>
                <span className="font-semibold">{metrics.system.cpuUsage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Mémoire</span>
                <span className="font-semibold">{metrics.system.memoryUsage} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Requêtes/min</span>
                <span className="font-semibold">{metrics.system.requestsPerMinute}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Taux d'Erreur</span>
                <span className={`font-semibold ${metrics.system.errorRate > 10 ? 'text-red-600' : 'text-green-600'}`}>
                  {metrics.system.errorRate}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Connexions Actives</span>
                <span className="font-semibold">{metrics.system.activeConnections}</span>
              </div>
            </div>
          </div>

          {/* Métriques Base de Données */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Database className="h-5 w-5 text-green-600" />
              Base de Données
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total Records</span>
                <span className="font-semibold">{metrics.database.totalRecords}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Prescriptions</span>
                <span className="font-semibold">{metrics.database.prescriptions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Vérifications</span>
                <span className="font-semibold">{metrics.database.verificationRequests}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Temps Requête Moyen</span>
                <span className="font-semibold">{Math.round(metrics.database.averageQueryTime)}ms</span>
              </div>
            </div>
          </div>
        </div>

        {/* Logs Système */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Terminal className="h-5 w-5 text-gray-600" />
              Logs Système ({logs.length})
            </h3>

            <select
              value={selectedLogType}
              onChange={(e) => setSelectedLogType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">Tous les logs</option>
              <option value="hedera">Hedera</option>
              <option value="system">Système</option>
              <option value="database">Base de données</option>
            </select>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.slice(-50).reverse().map((log, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  {getLogTypeIcon(log.type)}
                  <div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(log.status)}
                      <span className="text-sm font-medium">{log.type}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        log.status >= 200 && log.status < 300 ? 'bg-green-100 text-green-800' :
                        log.status >= 400 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{formatTimestamp(log.timestamp)}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-medium">{log.responseTime}ms</span>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <p className="text-xs text-gray-500">
                      {JSON.stringify(log.details, null, 0).substring(0, 50)}...
                    </p>
                  )}
                </div>
              </div>
            ))}

            {logs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Terminal className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>Aucun log disponible</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMonitoring;