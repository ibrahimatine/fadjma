import api from './api';

export const prescriptionGroupService = {
  // Créer un groupe de prescriptions (médecin)
  async createPrescriptionGroup(prescriptionIds, patientId) {
    const response = await api.post('/prescription-groups', {
      prescriptionIds,
      patientId
    });
    return response.data;
  },

  // Obtenir un groupe par matricule
  async getGroupByMatricule(groupMatricule) {
    const response = await api.get(`/prescription-groups/by-matricule/${groupMatricule}`);
    return response.data;
  },

  // Obtenir mes groupes (patient)
  async getMyGroups() {
    const response = await api.get('/prescription-groups/patient/my-groups');
    return response.data;
  },

  // Obtenir les groupes créés par le médecin
  async getDoctorGroups(status = null) {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/prescription-groups/doctor/my-groups${params}`);
    return response.data;
  },

  // Recherche pour pharmacie
  async searchGroupForPharmacy(groupMatricule) {
    const response = await api.get(`/prescription-groups/pharmacy/search/${groupMatricule}`);
    return response.data;
  },

  // Délivrer un groupe complet (pharmacie)
  async deliverPrescriptionGroup(groupMatricule, dispensationData) {
    const response = await api.put(`/prescription-groups/pharmacy/deliver/${groupMatricule}`, {
      dispensationData
    });
    return response.data;
  },

  // Obtenir le badge de statut
  getStatusBadge(status) {
    const badges = {
      pending: { color: 'yellow', text: 'En attente' },
      delivered: { color: 'green', text: 'Délivré' },
      cancelled: { color: 'red', text: 'Annulé' }
    };

    return badges[status] || { color: 'gray', text: status };
  },

  // Formater le matricule pour l'affichage
  formatMatricule(matricule) {
    if (!matricule) return '';
    // PGR-20250930-XXXX -> PGR-2025/09/30-XXXX
    const parts = matricule.split('-');
    if (parts.length >= 3 && parts[1].length === 8) {
      const date = parts[1];
      const formattedDate = `${date.slice(0, 4)}/${date.slice(4, 6)}/${date.slice(6, 8)}`;
      return `${parts[0]}-${formattedDate}-${parts[2]}`;
    }
    return matricule;
  }
};