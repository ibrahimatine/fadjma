// src/services/accessService.js
import api from './api';

class AccessService {

  // Create new access request
  async createAccessRequest(requestData) {
    try {
      console.log('AccessService: createAccessRequest appelé avec:', requestData);
      const response = await api.post('/access-requests', requestData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get access requests with filters
  async getAccessRequests(filters = {}) {
    try {
      const params = new URLSearchParams();

      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });

      const response = await api.get(`/access-requests?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get specific access request by ID
  async getAccessRequestById(id) {
    try {
      const response = await api.get(`/access-requests/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update access request (approve/reject)
  async updateAccessRequest(id, updateData) {
    try {
      const response = await api.put(`/access-requests/${id}`, updateData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Cancel access request
  async cancelAccessRequest(id) {
    try {
      const response = await api.delete(`/access-requests/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get requests for specific patient
  async getRequestsForPatient(patientId, filters = {}) {
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });

      const response = await api.get(`/access-requests/patient/${patientId}?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get requests by specific requester
  async getRequestsByRequester(requesterId, filters = {}) {
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });

      const response = await api.get(`/access-requests/requester/${requesterId}?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Check if a requester has active access to a patient's records
  async checkMedicalRecordAccess(patientId) {
    try {
      const response = await api.get(`/access-requests/check/${patientId}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get access status for multiple patients
  async getAccessStatusForPatients(patientIds, requesterId = null) {
    try {
      // Get all requests for this requester
      const response = await this.getAccessRequests({
        requesterId: requesterId,
        limit: 1000 // Get all requests
      });

      if (!response.success) {
        return { success: false, data: {} };
      }

      const requests = response.data?.requests || [];
      const statusMap = {};

      // Initialize all patients with 'none' status
      patientIds.forEach(patientId => {
        statusMap[patientId] = { status: 'none', request: null };
      });

      // Update status based on existing requests
      requests.forEach(request => {
        const patientId = request.patientId;
        if (patientIds.includes(patientId)) {
          // Get the most recent request status for each patient
          if (!statusMap[patientId].request ||
              new Date(request.createdAt) > new Date(statusMap[patientId].request.createdAt)) {
            statusMap[patientId] = {
              status: request.status,
              request: request
            };
          }
        }
      });

      return { success: true, data: statusMap };
    } catch (error) {
      console.error('Error getting access status for patients:', error);
      return { success: false, data: {} };
    }
  }

  // Approve access request
  async approveRequest(id, reviewNotes = '') {
    return this.updateAccessRequest(id, {
      status: 'approved',
      reviewNotes
    });
  }

  // Reject access request
  async rejectRequest(id, reviewNotes = '') {
    return this.updateAccessRequest(id, {
      status: 'rejected',
      reviewNotes
    });
  }

  // Quick request for read access
  async requestReadAccess(patientId, reason = '', accessLevel = 'read') {
    try {
      const response = await this.createAccessRequest({
        patientId,
        reason: reason || 'Demande d\'accès pour consultation et modification',
        accessLevel,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Quick request for write access
  async requestWriteAccess(patientId, reason = '') {
    return this.createAccessRequest({
      patientId,
      reason: reason || 'Demande d\'accès en écriture pour modification des dossiers',
      accessLevel: 'write',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    });
  }

  // Get access request statistics
  async getAccessRequestStats() {
    try {
      const response = await this.getAccessRequests({ limit: 1000 }); // Get all requests
      const requests = response.data?.requests || [];

      const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        approved: requests.filter(r => r.status === 'approved').length,
        rejected: requests.filter(r => r.status === 'rejected').length,
        expired: requests.filter(r => r.status === 'expired').length
      };

      return { success: true, data: stats };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Check if user has active access to patient
  async hasActiveAccess(patientId) {
    try {
      const response = await this.getAccessRequests({
        patientId,
        status: 'approved'
      });

      const activeRequests = response.data?.requests?.filter(request => {
        if (!request.expiresAt) return true; // No expiration = active
        return new Date(request.expiresAt) > new Date(); // Not expired
      }) || [];

      return {
        success: true,
        data: {
          hasAccess: activeRequests.length > 0,
          requests: activeRequests
        }
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get patients that the doctor has access to
  async getAccessiblePatients(search = '') {
    try {
      console.log('AccessService: getAccessiblePatients appelé avec recherche:', search);

      const params = new URLSearchParams();
      if (search) {
        params.append('search', search);
      }

      const response = await api.get(`/patients/accessible-patients?${params.toString()}`);
      console.log('AccessService: réponse accessible-patients:', response.data);

      return response.data;
    } catch (error) {
      console.error('AccessService: erreur dans getAccessiblePatients:', error);
      throw this.handleError(error);
    }
  }

  // Get access status for multiple patients for a specific requester
  async getAccessStatusForPatients(patientIds, requesterId) {
    try {
      // Get all patients to check createdByDoctorId
      const allPatientsResponse = await api.get('/patients?limit=100');
      const allPatients = allPatientsResponse.data?.data || [];

      const response = await this.getRequestsByRequester(requesterId);

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch access status');
      }

      const requests = response.data?.requests || [];
      const statusMap = {};

      patientIds.forEach(patientId => {
        // Check if patient was created by this doctor
        const patient = allPatients.find(p => p.id === patientId);
        if (patient && patient.createdByDoctorId === requesterId) {
          statusMap[patientId] = { status: 'approved', request: { type: 'creator' } };
          return;
        }

        const patientRequests = requests.filter(req => req.patientId === patientId);

        // Check for pending requests
        const pendingRequest = patientRequests.find(req => req.status === 'pending');
        if (pendingRequest) {
          statusMap[patientId] = { status: 'pending', request: pendingRequest };
          return;
        }

        // Check for active approved requests
        const approvedRequests = patientRequests.filter(req => {
          if (req.status !== 'approved') return false;
          if (!req.expiresAt) return true; // No expiration = active
          return new Date(req.expiresAt) > new Date(); // Not expired
        });

        if (approvedRequests.length > 0) {
          // Get the most recent approved request
          const activeRequest = approvedRequests.sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
          )[0];
          statusMap[patientId] = { status: 'approved', request: activeRequest };
          return;
        }

        // No active access
        statusMap[patientId] = { status: 'none', request: null };
      });

      return {
        success: true,
        data: statusMap
      };
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

export const accessService = new AccessService();