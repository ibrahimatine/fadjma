import api from './api';

export const appointmentService = {
  // Obtenir toutes les spécialités
  async getSpecialties() {
    const response = await api.get('/appointments/specialties');
    return response.data;
  },

  // Obtenir les médecins par spécialité
  async getDoctorsBySpecialty(specialtyId) {
    const response = await api.get(`/appointments/specialties/${specialtyId}/doctors`);
    return response.data;
  },

  // Obtenir les disponibilités d'un médecin
  async getDoctorAvailability(doctorId) {
    const response = await api.get(`/appointments/doctors/${doctorId}/availability`);
    return response.data;
  },

  // Obtenir les créneaux disponibles pour une date
  async getAvailableSlots(doctorId, date) {
    const response = await api.get(`/appointments/doctors/${doctorId}/slots`, {
      params: { date }
    });
    return response.data;
  },

  // Créer un rendez-vous (patient)
  async createAppointment(appointmentData) {
    const response = await api.post('/appointments', appointmentData);
    return response.data;
  },

  // Obtenir mes rendez-vous (patient)
  async getMyAppointments(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.upcoming) params.append('upcoming', filters.upcoming);

    const response = await api.get(`/appointments/my-appointments?${params.toString()}`);
    return response.data;
  },

  // Obtenir les rendez-vous du médecin
  async getDoctorAppointments(filters = {}) {
    const params = new URLSearchParams();
    if (filters.date) params.append('date', filters.date);
    if (filters.status) params.append('status', filters.status);

    const response = await api.get(`/appointments/doctor/appointments?${params.toString()}`);
    return response.data;
  },

  // Confirmer un rendez-vous
  async confirmAppointment(appointmentId) {
    const response = await api.put(`/appointments/${appointmentId}/confirm`);
    return response.data;
  },

  // Annuler un rendez-vous
  async cancelAppointment(appointmentId, cancellationReason) {
    const response = await api.put(`/appointments/${appointmentId}/cancel`, {
      cancellationReason
    });
    return response.data;
  },

  // Compléter un rendez-vous
  async completeAppointment(appointmentId, notes) {
    const response = await api.put(`/appointments/${appointmentId}/complete`, {
      notes
    });
    return response.data;
  },

  // Assistant - Obtenir tous les rendez-vous
  async getAssistantAppointments(filters = {}) {
    const params = new URLSearchParams();
    if (filters.date) params.append('date', filters.date);
    if (filters.status) params.append('status', filters.status);

    const response = await api.get(`/appointments/assistant/appointments?${params.toString()}`);
    return response.data;
  },

  // Assistant - Créer un rendez-vous pour un patient
  async createAppointmentOnBehalf(appointmentData) {
    const response = await api.post('/appointments/assistant/create-on-behalf', appointmentData);
    return response.data;
  },

  // Formater la date pour l'affichage
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  // Formater l'heure
  formatTime(timeString) {
    if (!timeString) return '';
    return timeString.slice(0, 5); // HH:MM
  },

  // Obtenir le badge de couleur pour un statut
  getStatusBadge(status) {
    const badges = {
      pending: { color: 'yellow', text: 'En attente' },
      confirmed: { color: 'blue', text: 'Confirmé' },
      completed: { color: 'green', text: 'Terminé' },
      cancelled: { color: 'red', text: 'Annulé' },
      no_show: { color: 'gray', text: 'Absent' },
      emergency: { color: 'orange', text: 'Urgence' }
    };

    return badges[status] || { color: 'gray', text: status };
  }
};