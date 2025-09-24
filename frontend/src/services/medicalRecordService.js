// src/services/medicalRecordService.js
import api from './api';

class MedicalRecordService {

  // Get all medical records for a specific patient
  async getPatientRecords(patientId) {
    try {
      const response = await api.get(`/records?patientId=${patientId}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get a specific medical record by ID
  async getRecordById(recordId) {
    try {
      const response = await api.get(`/records/${recordId}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Create a new medical record
  async createRecord(recordData) {
    try {
      const response = await api.post('/records', recordData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update an existing medical record
  async updateRecord(recordId, recordData) {
    try {
      const response = await api.put(`/records/${recordId}`, recordData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Delete a medical record
  async deleteRecord(recordId) {
    try {
      const response = await api.delete(`/records/${recordId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get medical records with filters
  async getRecords(filters = {}) {
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });

      const response = await api.get(`/records?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get patient basic information
  async getPatientInfo(patientId) {
    try {
      const response = await api.get(`/patients/${patientId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get patient statistics
  async getPatientStats(patientId) {
    try {
      const response = await api.get(`/patients/${patientId}/stats`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get records grouped by patient (for doctors)
  async getGroupedByPatient(page = 1, limit = 10) {
    try {
      const response = await api.get(`/records/grouped-by-patient?page=${page}&limit=${limit}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Handle API errors
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      return {
        message: data?.message || `Erreur ${status}`,
        status,
        errors: data?.errors || []
      };
    } else if (error.request) {
      // Network error
      return {
        message: 'Erreur de connexion au serveur',
        status: 0
      };
    } else {
      // Other error
      return {
        message: error.message || 'Une erreur inattendue s\'est produite',
        status: 500
      };
    }
  }
}

export const medicalRecordService = new MedicalRecordService();
export default medicalRecordService;