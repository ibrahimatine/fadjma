import api from './api';

export const historyService = {
  // Obtenir l'historique entre un docteur et un patient
  async getDoctorPatientHistory(doctorId, patientId, filters = {}) {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });

    const response = await api.get(`/history/doctor-patient/${doctorId}/${patientId}?${params.toString()}`);
    return response.data;
  },

  // Obtenir les messages d'un topic Hedera
  async getTopicMessages(topicId, filters = {}) {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });

    const response = await api.get(`/history/topic-messages/${encodeURIComponent(topicId)}?${params.toString()}`);
    return response.data;
  },

  // Obtenir l'historique complet d'un patient
  async getPatientHistory(patientId, filters = {}) {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });

    const response = await api.get(`/history/patient/${patientId}?${params.toString()}`);
    return response.data;
  },

  // Rechercher dans l'historique par critères
  async searchHistory(searchCriteria) {
    const {
      patientName,
      doctorName,
      dateFrom,
      dateTo,
      type,
      medication,
      diagnosis
    } = searchCriteria;

    const response = await api.post('/history/search', {
      patientName,
      doctorName,
      dateFrom,
      dateTo,
      type,
      medication,
      diagnosis
    });

    return response.data;
  },

  // Obtenir les statistiques d'interaction
  async getInteractionStats(doctorId, patientId, period = '30days') {
    const response = await api.get(`/history/stats/${doctorId}/${patientId}`, {
      params: { period }
    });
    return response.data;
  },

  // Exporter l'historique
  async exportHistory(doctorId, patientId, format = 'json', filters = {}) {
    const params = new URLSearchParams({ format });

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });

    const response = await api.get(`/history/export/${doctorId}/${patientId}?${params.toString()}`, {
      responseType: format === 'csv' ? 'blob' : 'json'
    });

    if (format === 'csv') {
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `history-${doctorId}-${patientId}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return { success: true, message: 'Export CSV terminé' };
    }

    return response.data;
  },

  // Rechercher des utilisateurs par nom
  async searchUsers(name, role = null) {
    const params = new URLSearchParams({ name });
    if (role) {
      params.append('role', role);
    }

    const response = await api.get(`/history/search-users?${params.toString()}`);
    return response.data;
  }
};