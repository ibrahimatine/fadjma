import api from './api';

export const adminService = {
  // Obtenir les statistiques du registre
  async getRegistryOverview() {
    const response = await api.get('/admin/registry/overview');
    return response.data;
  },

  // Obtenir les données du registre avec filtres
  async getRegistryData(filters = {}) {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });

    const response = await api.get(`/admin/registry/data?${params.toString()}`);
    return response.data;
  },

  // Vérifier une entrée spécifique du registre
  async verifyRegistryEntry(type, id) {
    const response = await api.post(`/admin/registry/verify/${type}/${id}`);
    return response.data;
  },

  // Obtenir les détails d'un topic Hedera
  async getTopicDetails(topicId) {
    const response = await api.get(`/admin/registry/topic/${encodeURIComponent(topicId)}`);
    return response.data;
  },

  // Exporter les données du registre
  async exportRegistryData(format = 'json', filters = {}) {
    const params = new URLSearchParams({ format });

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });

    const response = await api.get(`/admin/registry/export?${params.toString()}`, {
      responseType: format === 'csv' ? 'blob' : 'json'
    });

    if (format === 'csv') {
      // Créer un blob et déclencher le téléchargement pour CSV
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `registry-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return { success: true, message: 'Export CSV terminé' };
    }

    return response.data;
  },

  // Obtenir l'audit log
  async getAuditLog(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/admin/audit-log?${params.toString()}`);
    return response.data;
  },

  // Effectuer un check d'intégrité du système
  async performIntegrityCheck() {
    const response = await api.post('/admin/system/integrity-check');
    return response.data;
  },

  // Synchroniser avec Hedera
  async syncWithHedera() {
    const response = await api.post('/admin/hedera/sync');
    return response.data;
  },

  // Rechercher dans le registre
  async searchRegistry(query, filters = {}) {
    const searchFilters = {
      ...filters,
      search: query
    };
    return this.getRegistryData(searchFilters);
  },

  // Obtenir les statistiques par période
  async getStatsByPeriod(period = '7days') {
    const response = await api.get('/admin/registry/overview', {
      params: { period }
    });
    return response.data;
  },

  // Vérifier l'accès admin
  async checkAdminAccess() {
    try {
      const response = await api.get('/admin/registry/overview');
      return { hasAccess: true, data: response.data };
    } catch (error) {
      if (error.response?.status === 403) {
        return { hasAccess: false, error: 'Accès admin requis' };
      }
      throw error;
    }
  },

  // Forcer la mise à jour des statuts
  async updateStatuses() {
    const response = await api.post('/admin/status/update');
    console.log('Status update response:', response);
    return response.data;
  },

  // Vérifier le statut HCS d'une transaction
  async verifyHCSStatus(transactionId, topicId, sequenceNumber) {
    const response = await api.get(`/verify/hcs-status/${encodeURIComponent(transactionId)}`, {
      params: { topicId, sequenceNumber }
    });
    console.log('HCS Status:', response);
    return response.data;
  },

  // Obtenir les statistiques d'un topic HCS
  async getTopicStats(topicId) {
    const response = await api.get(`/verify/topic-stats/${encodeURIComponent(topicId)}`);
    return response.data;
  },

  // Vérifier un dossier médical avec HCS
  async verifyRecordWithHCS(recordId) {
    const response = await api.get(`/verify/record/${recordId}`);
    return response.data;
  },

  // Services de monitoring
  async getMonitoringMetrics() {
    const response = await api.get('/monitoring/metrics');
    return response.data;
  },

  async getSystemHealth() {
    const response = await api.get('/monitoring/health');
    return response.data;
  },

  async getActiveAlerts() {
    const response = await api.get('/monitoring/alerts');
    return response.data;
  },

  async getSystemLogs(limit = 100, level = null, startDate = null, endDate = null) {
    const params = { limit };
    if (level) params.level = level;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await api.get('/admin/logs', { params });
    return response.data;
  },

  async resetMonitoringMetrics() {
    const response = await api.post('/monitoring/reset');
    return response.data;
  },

  // Obtenir les détails d'une transaction Hedera
  async getTransactionDetails(transactionId) {
    try {
      // Ici on pourrait faire un appel à l'API Hedera Mirror Node
      // Pour le moment, simulation
      return {
        success: true,
        transaction: {
          transactionId,
          consensusTimestamp: new Date().toISOString(),
          charged: '0.0001 HBAR',
          result: 'SUCCESS',
          topic: transactionId.split('@')[0],
          message: {
            sequenceNumber: Math.floor(Math.random() * 10000),
            runningHash: 'hash_' + Math.random().toString(36).substr(2, 32),
            message: btoa(JSON.stringify({ type: 'medical_record', timestamp: new Date().toISOString() }))
          }
        }
      };
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      throw error;
    }
  }
};