import api from './api';

export const recordService = {
  async getAll(filters = {}) {
    const response = await api.get('/records', { params: filters });
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/records/${id}`);
    return response.data;
  },

  async create(data) {
    const response = await api.post('/records', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/records/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/records/${id}`);
    return response.data;
  },

  async verify(id) {
    const response = await api.post(`/verify/record/${id}`);
    return response.data;
  },

  async getVerificationHistory(id) {
    const response = await api.get(`/verify/history/${id}`);
    return response.data;
  },

  async getPrescriptionsByRecordId(recordId) {
    const response = await api.get(`/records/${recordId}/prescriptions`);
    return response.data;
  }
};