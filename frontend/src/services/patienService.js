import api from './api';

export const patientService = {
  async getAll(filters = {}) {
    const response = await api.get('/patients');
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/patients/${id}`);
    return response.data;
  },
};