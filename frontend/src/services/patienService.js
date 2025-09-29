import api from './api';

export const patientService = {
  async getAll(filters = {}) {
    // Augmenter la limite pour récupérer tous les patients
    const response = await api.get('/patients?limit=100');
    return response.data;
  },

  async getById(id) {
    const response = await api.get(`/patients/${id}`);
    return response.data;
  },
};