// src/pages/AssistantDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Phone,
  Users,
  Plus,
  CheckCircle,
  X,
  Clock,
  Search,
  Filter,
  Edit2,
  UserPlus,
  CalendarPlus,
  AlertCircle,
  Stethoscope,
  TrendingUp,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { appointmentService } from '../services/appointmentService';
import CreateUnclaimedPatientModal from '../components/patient/CreateUnclaimedPatientModal';
import toast from 'react-hot-toast';

const AssistantDashboard = () => {
  const [activeTab, setActiveTab] = useState('today'); // 'today', 'create', 'all', 'calendar'
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filtres
  const [statusFilter, setStatusFilter] = useState('all');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Formulaire création RDV
  const [specialties, setSpecialties] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientResults, setPatientResults] = useState([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [reason, setReason] = useState('');

  // Modals
  const [showCreatePatientModal, setShowCreatePatientModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);

  useEffect(() => {
    loadAppointments();
  }, [selectedDate, statusFilter, doctorFilter]);

  useEffect(() => {
    loadSpecialties();
  }, []);

  useEffect(() => {
    if (selectedSpecialty) {
      loadDoctors(selectedSpecialty.id);
    }
  }, [selectedSpecialty]);

  // Recherche de patients en temps réel
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (patientSearch && patientSearch.length >= 2 && !selectedPatient) {
        setSearchingPatients(true);
        try {
          const data = await appointmentService.searchPatients(patientSearch);
          setPatientResults(data.patients || []);
        } catch (error) {
          console.error('Erreur recherche patients:', error);
        } finally {
          setSearchingPatients(false);
        }
      } else {
        setPatientResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [patientSearch, selectedPatient]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await appointmentService.getAllAppointmentsForAssistant({
        date: selectedDate,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        doctorId: doctorFilter !== 'all' ? doctorFilter : undefined
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
    setTimeout(() => setRefreshing(false), 500);
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

      setActiveTab('today');
      loadAppointments();
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
    const reason = prompt('Raison de l\'annulation:');
    if (!reason) return;

    try {
      await appointmentService.cancelAppointment(appointmentId, reason);
      toast.success('Rendez-vous annulé');
      loadAppointments();
    } catch (error) {
      toast.error('Erreur lors de l\'annulation');
    }
  };

  // Statistiques
  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length
  };

  // Filtrage par recherche
  const filteredAppointments = appointments.filter(apt => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      apt.patient?.firstName?.toLowerCase().includes(search) ||
      apt.patient?.lastName?.toLowerCase().includes(search) ||
      apt.doctor?.firstName?.toLowerCase().includes(search) ||
      apt.doctor?.lastName?.toLowerCase().includes(search) ||
      apt.reason?.toLowerCase().includes(search)
    );
  });

  // Médecins uniques pour le filtre
  const uniqueDoctors = [...new Map(appointments.map(apt =>
    [apt.doctor?.id, apt.doctor]
  )).values()].filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-2xl shadow-lg">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                Gestion des Rendez-vous
              </h1>
              <p className="text-gray-600 mt-2">
                Bienvenue dans votre espace de gestion
              </p>
            </div>

            {/* Actions rapides */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-3 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all"
                title="Actualiser"
              >
                <RefreshCw className={`h-5 w-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={() => setShowCreatePatientModal(true)}
                className="px-4 py-3 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all flex items-center gap-2"
              >
                <UserPlus className="h-5 w-5 text-orange-600" />
                <span className="font-medium text-gray-700">Nouveau patient</span>
              </button>

              <button
                onClick={() => setActiveTab('create')}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2 font-medium"
              >
                <CalendarPlus className="h-5 w-5" />
                Nouveau RDV
              </button>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">En attente</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Confirmés</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.confirmed}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Terminés</p>
                  <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation par onglets */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('today')}
              className={`flex-1 px-6 py-4 font-medium text-sm transition-all ${
                activeTab === 'today'
                  ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Calendar className="inline h-5 w-5 mr-2" />
              Aujourd'hui
            </button>

            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 px-6 py-4 font-medium text-sm transition-all ${
                activeTab === 'create'
                  ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Plus className="inline h-5 w-5 mr-2" />
              Créer RDV
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 px-6 py-4 font-medium text-sm transition-all ${
                activeTab === 'all'
                  ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Users className="inline h-5 w-5 mr-2" />
              Tous les RDV
            </button>
          </div>
        </div>

        {/* Contenu principal */}
        {(activeTab === 'today' || activeTab === 'all') && (
          <div className="space-y-6">
            {/* Filtres et recherche */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Recherche */}
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher patient, médecin, motif..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                    />
                  </div>
                </div>

                {/* Date */}
                <div>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  />
                </div>

                {/* Filtre statut */}
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="pending">En attente</option>
                    <option value="confirmed">Confirmés</option>
                    <option value="completed">Terminés</option>
                    <option value="cancelled">Annulés</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Liste des rendez-vous */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="p-6 bg-gray-50 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <Calendar className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Aucun rendez-vous
                </h3>
                <p className="text-gray-600 mb-6">
                  Aucun rendez-vous trouvé pour les critères sélectionnés
                </p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  Créer un rendez-vous
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAppointments.map((apt) => {
                  const statusBadge = appointmentService.getStatusBadge(apt.status);
                  return (
                    <div
                      key={apt.id}
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          {/* Heure */}
                          <div className="text-center min-w-[80px]">
                            <div className="text-2xl font-bold text-gray-900">
                              {appointmentService.formatTime(apt.appointmentTime)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {apt.duration || 30} min
                            </div>
                          </div>

                          {/* Détails */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <span className={`px-3 py-1 text-xs font-medium rounded-full bg-${statusBadge.color}-100 text-${statusBadge.color}-800`}>
                                {statusBadge.text}
                              </span>
                              {apt.specialty && (
                                <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                                  {apt.specialty.name}
                                </span>
                              )}
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-400" />
                                <span className="font-semibold text-gray-900">
                                  {apt.patient?.firstName} {apt.patient?.lastName}
                                </span>
                                {apt.patient?.phoneNumber && (
                                  <>
                                    <span className="text-gray-300">•</span>
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-600">{apt.patient.phoneNumber}</span>
                                  </>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <Stethoscope className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-700">
                                  Dr. {apt.doctor?.firstName} {apt.doctor?.lastName}
                                </span>
                              </div>

                              {apt.reason && (
                                <div className="flex items-start gap-2 mt-2">
                                  <AlertCircle className="h-4 w-4 text-gray-400 mt-0.5" />
                                  <span className="text-sm text-gray-600">{apt.reason}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 ml-4">
                          {apt.status === 'pending' && (
                            <button
                              onClick={() => handleConfirm(apt.id)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 text-sm font-medium"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Confirmer
                            </button>
                          )}

                          {(apt.status === 'pending' || apt.status === 'confirmed') && (
                            <button
                              onClick={() => handleCancel(apt.id)}
                              className="px-4 py-2 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-all text-sm font-medium"
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

        {/* Formulaire de création */}
        {activeTab === 'create' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Créer un rendez-vous</h2>

            <div className="space-y-6">
              {/* Recherche patient */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Patient * <span className="text-gray-500 font-normal">(Recherchez par nom, email ou téléphone)</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      if (selectedPatient) setSelectedPatient(null);
                    }}
                    placeholder="Commencez à taper pour rechercher..."
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                    disabled={!!selectedPatient}
                  />
                </div>

                {selectedPatient && (
                  <div className="mt-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-green-900">
                          {selectedPatient.firstName} {selectedPatient.lastName}
                        </div>
                        <div className="text-sm text-green-700">
                          {selectedPatient.email} {selectedPatient.phoneNumber && `• ${selectedPatient.phoneNumber}`}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedPatient(null);
                        setPatientSearch('');
                      }}
                      className="p-2 text-green-700 hover:text-green-900 hover:bg-green-100 rounded-lg transition-all"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}

                {/* Résultats de recherche */}
                {!selectedPatient && patientResults.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-80 overflow-y-auto">
                    {patientResults.map((patient) => (
                      <button
                        key={patient.id}
                        onClick={() => {
                          setSelectedPatient(patient);
                          setPatientSearch(`${patient.firstName} ${patient.lastName}`);
                          setPatientResults([]);
                        }}
                        className="w-full px-4 py-4 text-left hover:bg-orange-50 transition-all border-b last:border-b-0 flex items-center gap-3"
                      >
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Users className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {patient.firstName} {patient.lastName}
                          </div>
                          <div className="text-sm text-gray-600">
                            {patient.email} {patient.phoneNumber && `• ${patient.phoneNumber}`}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {searchingPatients && (
                  <div className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                    Recherche en cours...
                  </div>
                )}

                {!searchingPatients && patientSearch.length >= 2 && patientResults.length === 0 && !selectedPatient && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-yellow-900">Aucun patient trouvé</div>
                      <button
                        onClick={() => setShowCreatePatientModal(true)}
                        className="text-sm text-yellow-700 hover:text-yellow-900 underline mt-1"
                      >
                        Créer un nouveau profil patient
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Spécialité */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Spécialité *
                </label>
                <select
                  value={selectedSpecialty?.id || ''}
                  onChange={(e) => {
                    const specialty = specialties.find(s => s.id === e.target.value);
                    setSelectedSpecialty(specialty);
                    setSelectedDoctor(null);
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
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
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Médecin *
                  </label>
                  <select
                    value={selectedDoctor?.id || ''}
                    onChange={(e) => {
                      const doctor = doctors.find(d => d.id === e.target.value);
                      setSelectedDoctor(doctor);
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
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
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Heure *
                  </label>
                  <input
                    type="time"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  />
                </div>
              </div>

              {/* Motif */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Motif de consultation *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none"
                  rows="4"
                  placeholder="Décrivez la raison de la consultation..."
                />
              </div>

              {/* Bouton de création */}
              <div className="flex items-center justify-end gap-4 pt-4">
                <button
                  onClick={() => setActiveTab('today')}
                  className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateAppointment}
                  disabled={loading || !selectedPatient || !selectedDoctor || !selectedSpecialty || !appointmentDate || !appointmentTime || !reason}
                  className="px-8 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Création...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Créer le rendez-vous
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal création patient */}
      {showCreatePatientModal && (
        <CreateUnclaimedPatientModal
          isOpen={showCreatePatientModal}
          onClose={() => setShowCreatePatientModal(false)}
          onSuccess={(patient) => {
            setShowCreatePatientModal(false);
            toast.success('Patient créé avec succès');
            // On pourrait auto-sélectionner le patient créé
          }}
        />
      )}
    </div>
  );
};

export default AssistantDashboard;
