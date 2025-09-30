import React, { useState, useEffect } from 'react';
import { Calendar, Phone, Users, Plus, CheckCircle } from 'lucide-react';
import { appointmentService } from '../services/appointmentService';
import toast from 'react-hot-toast';

const AssistantDashboard = () => {
  const [activeTab, setActiveTab] = useState('appointments'); // 'appointments' or 'create'
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  // Formulaire création RDV
  const [specialties, setSpecialties] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (activeTab === 'appointments') {
      loadAppointments();
    }
  }, [activeTab, selectedDate]);

  useEffect(() => {
    loadSpecialties();
  }, []);

  useEffect(() => {
    if (selectedSpecialty) {
      loadDoctors(selectedSpecialty.id);
    }
  }, [selectedSpecialty]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await appointmentService.getAssistantAppointments({
        date: selectedDate
      });
      setAppointments(data.appointments || []);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadSpecialties = async () => {
    try {
      const data = await appointmentService.getSpecialties();
      setSpecialties(data.specialties || []);
    } catch (error) {
      console.error('Erreur chargement spécialités');
    }
  };

  const loadDoctors = async (specialtyId) => {
    try {
      const data = await appointmentService.getDoctorsBySpecialty(specialtyId);
      setDoctors(data.doctors || []);
    } catch (error) {
      console.error('Erreur chargement médecins');
    }
  };

  const handleCreateAppointment = async () => {
    if (!selectedPatient || !selectedDoctor || !selectedSpecialty || !appointmentDate || !appointmentTime || !reason) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      setLoading(true);
      await appointmentService.createAppointmentOnBehalf({
        patientId: selectedPatient.id,
        doctorId: selectedDoctor.id,
        specialtyId: selectedSpecialty.id,
        appointmentDate,
        appointmentTime: appointmentTime + ':00',
        reason
      });

      toast.success('Rendez-vous créé avec succès');

      // Réinitialiser
      setSelectedPatient(null);
      setSelectedDoctor(null);
      setSelectedSpecialty(null);
      setAppointmentDate('');
      setAppointmentTime('');
      setReason('');
      setPatientSearch('');

      setActiveTab('appointments');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (appointmentId) => {
    try {
      await appointmentService.confirmAppointment(appointmentId);
      toast.success('Rendez-vous confirmé');
      loadAppointments();
    } catch (error) {
      toast.error('Erreur lors de la confirmation');
    }
  };

  const handleCancel = async (appointmentId) => {
    if (!window.confirm('Annuler ce rendez-vous ?')) return;

    const reason = prompt('Raison de l\'annulation:');
    try {
      await appointmentService.cancelAppointment(appointmentId, reason);
      toast.success('Rendez-vous annulé');
      loadAppointments();
    } catch (error) {
      toast.error('Erreur lors de l\'annulation');
    }
  };

  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard Assistant</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 mb-1">Total</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-4">
          <div className="text-sm text-yellow-700 mb-1">En attente</div>
          <div className="text-2xl font-bold text-yellow-900">{stats.pending}</div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4">
          <div className="text-sm text-blue-700 mb-1">Confirmés</div>
          <div className="text-2xl font-bold text-blue-900">{stats.confirmed}</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4">
          <div className="text-sm text-green-700 mb-1">Terminés</div>
          <div className="text-2xl font-bold text-green-900">{stats.completed}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'appointments'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calendar className="inline h-5 w-5 mr-2" />
            Rendez-vous
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'create'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Plus className="inline h-5 w-5 mr-2" />
            Créer RDV
          </button>
          <button
            onClick={() => setActiveTab('calls')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'calls'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Phone className="inline h-5 w-5 mr-2" />
            Appels
          </button>
        </nav>
      </div>

      {/* Contenu */}
      {activeTab === 'appointments' && (
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>

          {loading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : appointments.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              Aucun rendez-vous pour cette date
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => {
                const statusBadge = appointmentService.getStatusBadge(apt.status);
                return (
                  <div key={apt.id} className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-bold text-lg">
                            {appointmentService.formatTime(apt.appointmentTime)}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full bg-${statusBadge.color}-100 text-${statusBadge.color}-800`}>
                            {statusBadge.text}
                          </span>
                          <span className="text-sm text-gray-600">
                            {apt.specialty?.name}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700">
                          <strong>Patient:</strong> {apt.patient?.firstName} {apt.patient?.lastName}
                          {apt.patient?.phoneNumber && ` - ${apt.patient.phoneNumber}`}
                        </div>
                        <div className="text-sm text-gray-700">
                          <strong>Médecin:</strong> Dr. {apt.doctor?.firstName} {apt.doctor?.lastName}
                        </div>
                        {apt.reason && (
                          <div className="text-sm text-gray-600 mt-1">
                            <strong>Motif:</strong> {apt.reason}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {apt.status === 'pending' && (
                          <button
                            onClick={() => handleConfirm(apt.id)}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                          >
                            <CheckCircle className="inline h-4 w-4 mr-1" />
                            Confirmer
                          </button>
                        )}
                        {(apt.status === 'pending' || apt.status === 'confirmed') && (
                          <button
                            onClick={() => handleCancel(apt.id)}
                            className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
                          >
                            Annuler
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'create' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">Créer un rendez-vous</h2>

          <div className="space-y-4">
            {/* Recherche patient */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient (simulé - recherche à implémenter)
              </label>
              <input
                type="text"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                placeholder="Rechercher un patient..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
              {selectedPatient && (
                <div className="mt-2 p-2 bg-blue-50 rounded">
                  Patient sélectionné: {selectedPatient.firstName} {selectedPatient.lastName}
                </div>
              )}
            </div>

            {/* Spécialité */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Spécialité</label>
              <select
                value={selectedSpecialty?.id || ''}
                onChange={(e) => {
                  const specialty = specialties.find(s => s.id === e.target.value);
                  setSelectedSpecialty(specialty);
                }}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="">Sélectionner une spécialité</option>
                {specialties.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Médecin */}
            {selectedSpecialty && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Médecin</label>
                <select
                  value={selectedDoctor?.id || ''}
                  onChange={(e) => {
                    const doctor = doctors.find(d => d.id === e.target.value);
                    setSelectedDoctor(doctor);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                >
                  <option value="">Sélectionner un médecin</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.firstName} {d.lastName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date et heure */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Heure</label>
                <input
                  type="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
            </div>

            {/* Motif */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Motif</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                rows="3"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleCreateAppointment}
                disabled={loading}
                className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                Créer le rendez-vous
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'calls' && (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          <Phone className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>Gestion des appels - Fonctionnalité à venir</p>
        </div>
      )}
    </div>
  );
};

export default AssistantDashboard;