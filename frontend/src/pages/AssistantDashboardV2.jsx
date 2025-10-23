// src/pages/AssistantDashboardV2.jsx - Interface Optimisée pour Assistant/Secrétaire
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
  RefreshCw,
  Bell,
  Activity,
  ClipboardList,
  FileText,
  MapPin,
  Mail,
  Eye,
  MoreVertical,
  Download,
  PhoneCall,
  MessageSquare
} from 'lucide-react';
import { appointmentService } from '../services/appointmentService';
import CreateUnclaimedPatientModal from '../components/patient/CreateUnclaimedPatientModal';
import websocketService from '../services/websocketService';
import toast from 'react-hot-toast';

const AssistantDashboardV2 = () => {
  const [activeView, setActiveView] = useState('dashboard'); // dashboard, appointments, create, calendar
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filtres avancés
  const [filters, setFilters] = useState({
    status: 'all',
    doctor: 'all',
    specialty: 'all',
    search: '',
    dateRange: 'today', // today, week, month, custom, all
    dateFilter: 'today' // today, all
  });

  // Notifications
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);

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
  const [availableSlots, setAvailableSlots] = useState([]);

  // Modals et états
  const [showCreatePatientModal, setShowCreatePatientModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadAppointments();
    loadSpecialties();

    // Écouter les événements de rafraîchissement
    const handleRefreshAppointments = () => {
      console.log('🔄 Refreshing appointments from event...');
      loadAppointments();
    };

    // Écouter les notifications de nouveaux rendez-vous
    const handleNewAppointment = (notification) => {
      console.log('🔔 Nouvelle notification de RDV:', notification);
      // Jouer un son ou montrer une notification
      if (Notification.permission === 'granted') {
        new Notification('Nouveau rendez-vous', {
          body: notification.message || 'Un nouveau rendez-vous nécessite votre attention',
          icon: '/logo192.png'
        });
      }
      // Rafraîchir automatiquement la liste
      loadAppointments();
    };

    window.addEventListener('refreshAppointments', handleRefreshAppointments);
    websocketService.addEventListener('new_appointment', handleNewAppointment);

    // Demander permission pour les notifications si pas encore fait
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      window.removeEventListener('refreshAppointments', handleRefreshAppointments);
      websocketService.removeEventListener('new_appointment', handleNewAppointment);
    };
  }, [selectedDate, filters]);

  useEffect(() => {
    if (selectedSpecialty) {
      loadDoctors(selectedSpecialty.id);
    }
  }, [selectedSpecialty]);

  useEffect(() => {
    if (selectedDoctor && appointmentDate) {
      loadAvailableSlots();
    }
  }, [selectedDoctor, appointmentDate]);

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
      const params = {
        status: filters.status !== 'all' ? filters.status : undefined,
        doctorId: filters.doctor !== 'all' ? filters.doctor : undefined
      };

      // Ajouter la date seulement si le filtre n'est pas "all"
      if (filters.dateFilter !== 'all') {
        params.date = selectedDate;
      }

      const data = await appointmentService.getAllAppointmentsForAssistant(params);
      setAppointments(data.appointments || []);

      // Mettre à jour le compteur de notifications (RDV en attente)
      const pending = (data.appointments || []).filter(apt => apt.status === 'pending');
      setPendingAppointments(pending);
      setNotificationCount(pending.length);
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

  const loadAvailableSlots = async () => {
    try {
      const data = await appointmentService.getAvailableSlots(selectedDoctor.id, appointmentDate);
      setAvailableSlots(data.slots || []);
    } catch (error) {
      console.error('Erreur chargement créneaux');
      setAvailableSlots([]);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
    setTimeout(() => setRefreshing(false), 500);
    toast.success('Données actualisées');
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
        appointmentTime: appointmentTime.includes(':00') ? appointmentTime : appointmentTime + ':00',
        reason
      });

      toast.success('✅ Rendez-vous créé avec succès');

      // Réinitialiser
      resetCreateForm();
      setActiveView('appointments');
      loadAppointments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const resetCreateForm = () => {
    setSelectedPatient(null);
    setSelectedDoctor(null);
    setSelectedSpecialty(null);
    setAppointmentDate('');
    setAppointmentTime('');
    setReason('');
    setPatientSearch('');
    setAvailableSlots([]);
  };

  const handleConfirm = async (appointmentId) => {
    try {
      await appointmentService.confirmAppointment(appointmentId);
      toast.success('✅ Rendez-vous confirmé');
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

  const handleCall = (phone) => {
    if (!phone) {
      toast.error('Aucun numéro de téléphone');
      return;
    }
    window.location.href = `tel:${phone}`;
  };

  // Statistiques
  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length
  };

  // Filtrage avancé
  const filteredAppointments = appointments.filter(apt => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const matchesSearch = (
        apt.patient?.firstName?.toLowerCase().includes(search) ||
        apt.patient?.lastName?.toLowerCase().includes(search) ||
        apt.doctor?.firstName?.toLowerCase().includes(search) ||
        apt.doctor?.lastName?.toLowerCase().includes(search) ||
        apt.reason?.toLowerCase().includes(search)
      );
      if (!matchesSearch) return false;
    }
    return true;
  });

  // Médecins uniques pour le filtre
  const uniqueDoctors = [...new Map(appointments.map(apt =>
    [apt.doctor?.id, apt.doctor]
  )).values()].filter(Boolean);

  // Prochains rendez-vous (3 prochains)
  const upcomingAppointments = appointments
    .filter(apt => apt.status !== 'cancelled' && apt.status !== 'completed')
    .sort((a, b) => {
      const dateA = new Date(`${a.appointmentDate}T${a.appointmentTime}`);
      const dateB = new Date(`${b.appointmentDate}T${b.appointmentTime}`);
      return dateA - dateB;
    })
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* En-tête amélioré */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg">
                <ClipboardList className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Espace Secrétariat
                </h1>
                <p className="text-gray-600 flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4" />
                  {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="flex items-center gap-3">
              {/* Indicateur de notifications */}
              {notificationCount > 0 && (
                <div className="relative">
                  <button
                    onClick={() => {
                      setFilters({...filters, status: 'pending', dateFilter: 'all'});
                      setActiveView('appointments');
                    }}
                    className="p-3 bg-amber-50 border-2 border-amber-300 rounded-xl hover:shadow-md transition-all group relative animate-pulse"
                    title={`${notificationCount} rendez-vous en attente`}
                  >
                    <Bell className="h-5 w-5 text-amber-600" />
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                      {notificationCount}
                    </span>
                  </button>
                </div>
              )}

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-3 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all group"
                title="Actualiser"
              >
                <RefreshCw className={`h-5 w-5 text-purple-600 group-hover:text-purple-700 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={() => setShowCreatePatientModal(true)}
                className="px-5 py-3 bg-white border-2 border-purple-200 rounded-xl hover:shadow-md transition-all flex items-center gap-2 text-purple-700 hover:bg-purple-50 font-medium"
              >
                <UserPlus className="h-5 w-5" />
                <span>Nouveau patient</span>
              </button>

              <button
                onClick={() => setActiveView('create')}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2 font-medium"
              >
                <CalendarPlus className="h-5 w-5" />
                Nouveau RDV
              </button>
            </div>
          </div>

          {/* Statistiques améliorées */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total RDV</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-xs text-gray-500 mt-1">Aujourd'hui</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl group-hover:scale-110 transition-transform">
                  <Calendar className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-yellow-100 p-6 hover:shadow-lg transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">En attente</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                  {stats.pending > 0 && (
                    <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                      <Bell className="h-3 w-3" />
                      À confirmer
                    </p>
                  )}
                </div>
                <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl group-hover:scale-110 transition-transform">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6 hover:shadow-lg transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Confirmés</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.confirmed}</p>
                  <p className="text-xs text-blue-600 mt-1">Validés</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl group-hover:scale-110 transition-transform">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-6 hover:shadow-lg transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Terminés</p>
                  <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
                  <p className="text-xs text-green-600 mt-1">Effectués</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6 hover:shadow-lg transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Annulés</p>
                  <p className="text-3xl font-bold text-red-600">{stats.cancelled}</p>
                  <p className="text-xs text-red-600 mt-1">Ce jour</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl group-hover:scale-110 transition-transform">
                  <X className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation améliorée */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`flex-1 px-6 py-4 font-medium text-sm transition-all relative ${
                activeView === 'dashboard'
                  ? 'text-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {activeView === 'dashboard' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              )}
              <Activity className="inline h-5 w-5 mr-2" />
              Tableau de bord
            </button>

            <button
              onClick={() => setActiveView('appointments')}
              className={`flex-1 px-6 py-4 font-medium text-sm transition-all relative ${
                activeView === 'appointments'
                  ? 'text-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {activeView === 'appointments' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              )}
              <Calendar className="inline h-5 w-5 mr-2" />
              Rendez-vous ({appointments.length})
            </button>

            <button
              onClick={() => setActiveView('create')}
              className={`flex-1 px-6 py-4 font-medium text-sm transition-all relative ${
                activeView === 'create'
                  ? 'text-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {activeView === 'create' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"></div>
              )}
              <Plus className="inline h-5 w-5 mr-2" />
              Créer RDV
            </button>
          </div>
        </div>

        {/* Vue Dashboard */}
        {activeView === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Prochains rendez-vous */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="h-6 w-6 text-purple-600" />
                  Prochains rendez-vous
                </h2>
                <button
                  onClick={() => setActiveView('appointments')}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                >
                  Voir tous
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {upcomingAppointments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-6 bg-gray-50 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                    <Calendar className="h-12 w-12 text-gray-400" />
                  </div>
                  <p className="text-gray-600">Aucun rendez-vous à venir</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingAppointments.map((apt) => {
                    const statusBadge = appointmentService.getStatusBadge(apt.status);
                    return (
                      <div
                        key={apt.id}
                        className="p-4 border-2 border-gray-100 rounded-xl hover:border-purple-200 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="text-center min-w-[70px] p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                              <div className="text-2xl font-bold text-purple-600">
                                {appointmentService.formatTime(apt.appointmentTime)}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {apt.duration || 30}min
                              </div>
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`px-3 py-1 text-xs font-medium rounded-full bg-${statusBadge.color}-100 text-${statusBadge.color}-800`}>
                                  {statusBadge.text}
                                </span>
                                {apt.specialty && (
                                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                                    {apt.specialty.name}
                                  </span>
                                )}
                              </div>

                              <div className="space-y-1">
                                <div className="font-semibold text-gray-900 flex items-center gap-2">
                                  <Users className="h-4 w-4 text-purple-500" />
                                  {apt.patient?.firstName} {apt.patient?.lastName}
                                </div>
                                <div className="text-sm text-gray-600 flex items-center gap-2">
                                  <Stethoscope className="h-4 w-4 text-gray-400" />
                                  Dr. {apt.doctor?.firstName} {apt.doctor?.lastName}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {apt.patient?.phoneNumber && (
                              <button
                                onClick={() => handleCall(apt.patient.phoneNumber)}
                                className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all"
                                title="Appeler"
                              >
                                <PhoneCall className="h-5 w-5" />
                              </button>
                            )}
                            {apt.status === 'pending' && (
                              <button
                                onClick={() => handleConfirm(apt.id)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-sm font-medium"
                              >
                                Confirmer
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

            {/* Actions rapides */}
            <div className="space-y-6">
              {/* Actions */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Actions rapides</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setActiveView('create')}
                    className="w-full p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all flex items-center justify-between group"
                  >
                    <span className="flex items-center gap-3">
                      <CalendarPlus className="h-5 w-5" />
                      <span className="font-medium">Créer un RDV</span>
                    </span>
                    <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={() => setShowCreatePatientModal(true)}
                    className="w-full p-4 bg-white border-2 border-purple-200 text-purple-700 rounded-xl hover:bg-purple-50 transition-all flex items-center justify-between group"
                  >
                    <span className="flex items-center gap-3">
                      <UserPlus className="h-5 w-5" />
                      <span className="font-medium">Nouveau patient</span>
                    </span>
                    <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={handleRefresh}
                    className="w-full p-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-between group"
                  >
                    <span className="flex items-center gap-3">
                      <RefreshCw className="h-5 w-5" />
                      <span className="font-medium">Actualiser</span>
                    </span>
                    <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Notifications et demandes */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-sm border border-amber-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-amber-600" />
                    <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
                  </div>
                  {notificationCount > 0 && (
                    <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                      {notificationCount}
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {notificationCount > 0 ? (
                    <>
                      <div className="p-4 bg-white rounded-xl border-2 border-amber-300 hover:shadow-md transition-all cursor-pointer"
                           onClick={() => {
                             setFilters({...filters, status: 'pending', dateFilter: 'all'});
                             setActiveView('appointments');
                           }}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-bold text-gray-900">
                            {notificationCount} demande{notificationCount > 1 ? 's' : ''} de RDV
                          </p>
                          <ChevronRight className="h-5 w-5 text-amber-600" />
                        </div>
                        <p className="text-xs text-gray-600">
                          Cliquez pour voir et confirmer
                        </p>
                      </div>
                      {/* Afficher les 3 premières demandes en attente */}
                      {pendingAppointments.slice(0, 3).map((apt) => (
                        <div key={apt.id} className="p-3 bg-white rounded-xl border border-yellow-200 text-xs">
                          <div className="font-medium text-gray-900 mb-1">
                            {apt.patient?.firstName} {apt.patient?.lastName}
                          </div>
                          <div className="text-gray-600 flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            {new Date(apt.appointmentDate).toLocaleDateString('fr-FR')} à {apt.appointmentTime?.slice(0,5)}
                          </div>
                          {apt.specialty && (
                            <div className="text-purple-600 mt-1">
                              {apt.specialty.name}
                            </div>
                          )}
                        </div>
                      ))}
                      {pendingAppointments.length > 3 && (
                        <button
                          onClick={() => {
                            setFilters({...filters, status: 'pending', dateFilter: 'all'});
                            setActiveView('appointments');
                          }}
                          className="w-full p-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition-all"
                        >
                          Voir les {pendingAppointments.length - 3} autres demandes
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-900">Tout est à jour !</p>
                      <p className="text-xs text-gray-600 mt-1">Aucune demande en attente</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vue Liste des rendez-vous */}
        {activeView === 'appointments' && (
          <div className="space-y-6">
            {/* Filtres avancés */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => setFilters({...filters, search: e.target.value})}
                      placeholder="Rechercher patient, médecin, motif..."
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <select
                    value={filters.dateFilter}
                    onChange={(e) => setFilters({...filters, dateFilter: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium"
                  >
                    <option value="today">Aujourd'hui</option>
                    <option value="all">📋 Toutes les dates</option>
                  </select>
                </div>

                <div>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    disabled={filters.dateFilter === 'all'}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                    title={filters.dateFilter === 'all' ? 'Désactivé en mode "Toutes les dates"' : ''}
                  />
                </div>

                <div>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="pending">⏳ En attente</option>
                    <option value="confirmed">✅ Confirmés</option>
                    <option value="completed">🎯 Terminés</option>
                    <option value="cancelled">❌ Annulés</option>
                  </select>
                </div>
              </div>

              {/* Indicateur du mode de filtre actif */}
              {filters.dateFilter === 'all' && (
                <div className="mt-4 p-3 bg-blue-50 border-2 border-blue-200 rounded-xl flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    Affichage de tous les rendez-vous (toutes dates confondues)
                  </span>
                </div>
              )}
            </div>

            {/* Liste */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="p-6 bg-gray-50 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <Calendar className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun rendez-vous</h3>
                <p className="text-gray-600 mb-6">Aucun rendez-vous trouvé pour les critères sélectionnés</p>
                <button
                  onClick={() => setActiveView('create')}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all"
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
                      className="bg-white rounded-2xl shadow-sm border-2 border-gray-100 p-6 hover:shadow-lg hover:border-purple-200 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="text-center min-w-[90px] p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                            <div className="text-3xl font-bold text-purple-600">
                              {appointmentService.formatTime(apt.appointmentTime)}
                            </div>
                            <div className="text-xs text-gray-600 mt-2">
                              {apt.duration || 30} minutes
                            </div>
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <span className={`px-4 py-1.5 text-xs font-semibold rounded-full bg-${statusBadge.color}-100 text-${statusBadge.color}-800`}>
                                {statusBadge.text}
                              </span>
                              {apt.specialty && (
                                <span className="px-4 py-1.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                  {apt.specialty.name}
                                </span>
                              )}
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-50 rounded-lg">
                                  <Users className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                  <div className="font-bold text-gray-900 text-lg">
                                    {apt.patient?.firstName} {apt.patient?.lastName}
                                  </div>
                                  <div className="text-sm text-gray-600 flex items-center gap-4">
                                    {apt.patient?.email && (
                                      <span className="flex items-center gap-1">
                                        <Mail className="h-4 w-4" />
                                        {apt.patient.email}
                                      </span>
                                    )}
                                    {apt.patient?.phoneNumber && (
                                      <span className="flex items-center gap-1">
                                        <Phone className="h-4 w-4" />
                                        {apt.patient.phoneNumber}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                  <Stethoscope className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="font-medium text-gray-700">
                                  Dr. {apt.doctor?.firstName} {apt.doctor?.lastName}
                                </div>
                              </div>

                              {apt.reason && (
                                <div className="flex items-start gap-3 mt-3 p-3 bg-gray-50 rounded-lg">
                                  <AlertCircle className="h-5 w-5 text-gray-400 mt-0.5" />
                                  <span className="text-sm text-gray-700">{apt.reason}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          {apt.patient?.phoneNumber && (
                            <button
                              onClick={() => handleCall(apt.patient.phoneNumber)}
                              className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all"
                              title="Appeler le patient"
                            >
                              <PhoneCall className="h-5 w-5" />
                            </button>
                          )}

                          {apt.status === 'pending' && (
                            <button
                              onClick={() => handleConfirm(apt.id)}
                              className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 text-sm font-medium whitespace-nowrap"
                            >
                              <CheckCircle className="h-5 w-5" />
                              Confirmer
                            </button>
                          )}

                          {(apt.status === 'pending' || apt.status === 'confirmed') && (
                            <button
                              onClick={() => handleCancel(apt.id)}
                              className="px-5 py-3 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-all text-sm font-medium whitespace-nowrap"
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

        {/* Vue Création de RDV (suite dans le prochain message) */}
        {activeView === 'create' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <CalendarPlus className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Créer un rendez-vous</h2>
                <p className="text-gray-600">Remplissez les informations pour créer un nouveau rendez-vous</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Recherche patient améliorée */}
              <div className="relative">
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  1. Sélectionner le patient *
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      if (selectedPatient) setSelectedPatient(null);
                    }}
                    placeholder="Nom, email, téléphone du patient..."
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-lg"
                    disabled={!!selectedPatient}
                  />
                </div>

                {selectedPatient && (
                  <div className="mt-4 p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl flex items-center justify-between animate-fadeIn">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-500 rounded-xl">
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-green-900 text-lg">
                          {selectedPatient.firstName} {selectedPatient.lastName}
                        </div>
                        <div className="text-sm text-green-700 flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {selectedPatient.email}
                          </span>
                          {selectedPatient.phoneNumber && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {selectedPatient.phoneNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedPatient(null);
                        setPatientSearch('');
                      }}
                      className="p-3 text-green-700 hover:text-green-900 hover:bg-green-100 rounded-xl transition-all"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                )}

                {!selectedPatient && patientResults.length > 0 && (
                  <div className="absolute z-30 w-full mt-2 bg-white border-2 border-purple-200 rounded-xl shadow-2xl max-h-96 overflow-y-auto">
                    {patientResults.map((patient) => (
                      <button
                        key={patient.id}
                        onClick={() => {
                          setSelectedPatient(patient);
                          setPatientSearch(`${patient.firstName} ${patient.lastName}`);
                          setPatientResults([]);
                        }}
                        className="w-full px-5 py-4 text-left hover:bg-purple-50 transition-all border-b last:border-b-0 flex items-center gap-4"
                      >
                        <div className="p-3 bg-purple-50 rounded-xl">
                          <Users className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-gray-900">
                            {patient.firstName} {patient.lastName}
                          </div>
                          <div className="text-sm text-gray-600 flex items-center gap-3 mt-1">
                            <span>{patient.email}</span>
                            {patient.phoneNumber && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span>{patient.phoneNumber}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {searchingPatients && (
                  <div className="mt-3 text-sm text-gray-600 flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                    Recherche en cours...
                  </div>
                )}

                {!searchingPatients && patientSearch.length >= 2 && patientResults.length === 0 && !selectedPatient && (
                  <div className="mt-3 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="h-6 w-6 text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-bold text-amber-900 mb-1">Aucun patient trouvé</div>
                      <div className="text-sm text-amber-700 mb-2">Le patient n'existe pas encore dans le système</div>
                      <button
                        onClick={() => setShowCreatePatientModal(true)}
                        className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all text-sm font-medium"
                      >
                        Créer un nouveau patient
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Spécialité */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  2. Choisir la spécialité *
                </label>
                <select
                  value={selectedSpecialty?.id || ''}
                  onChange={(e) => {
                    const specialty = specialties.find(s => s.id === e.target.value);
                    setSelectedSpecialty(specialty);
                    setSelectedDoctor(null);
                    setAvailableSlots([]);
                  }}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-lg"
                >
                  <option value="">Sélectionner une spécialité</option>
                  {specialties.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Médecin */}
              {selectedSpecialty && (
                <div className="animate-fadeIn">
                  <label className="block text-sm font-bold text-gray-900 mb-3">
                    3. Sélectionner le médecin *
                  </label>
                  <select
                    value={selectedDoctor?.id || ''}
                    onChange={(e) => {
                      const doctor = doctors.find(d => d.id === e.target.value);
                      setSelectedDoctor(doctor);
                      setAvailableSlots([]);
                    }}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-lg"
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

              {/* Date et créneaux */}
              {selectedDoctor && (
                <div className="animate-fadeIn">
                  <label className="block text-sm font-bold text-gray-900 mb-3">
                    4. Choisir la date et l'heure *
                  </label>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <input
                      type="date"
                      value={appointmentDate}
                      onChange={(e) => {
                        setAppointmentDate(e.target.value);
                        setAppointmentTime('');
                      }}
                      min={new Date().toISOString().split('T')[0]}
                      className="px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-lg"
                    />
                    <input
                      type="time"
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                      className="px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-lg"
                    />
                  </div>

                  {/* Créneaux disponibles */}
                  {appointmentDate && availableSlots.length > 0 && (
                    <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                      <p className="text-sm font-bold text-blue-900 mb-3">Créneaux disponibles :</p>
                      <div className="grid grid-cols-4 gap-2">
                        {availableSlots.slice(0, 8).map((slot) => (
                          <button
                            key={slot.time}
                            onClick={() => setAppointmentTime(slot.time)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              appointmentTime === slot.time
                                ? 'bg-purple-600 text-white'
                                : 'bg-white border border-blue-200 text-blue-700 hover:bg-blue-50'
                            }`}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                      {availableSlots.length > 8 && (
                        <p className="text-xs text-blue-700 mt-2">
                          +{availableSlots.length - 8} autres créneaux disponibles
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Motif */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  5. Motif de consultation *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none text-lg"
                  rows="4"
                  placeholder="Décrivez la raison de la consultation..."
                />
              </div>

              {/* Boutons */}
              <div className="flex items-center justify-end gap-4 pt-6 border-t">
                <button
                  onClick={() => {
                    resetCreateForm();
                    setActiveView('dashboard');
                  }}
                  className="px-8 py-4 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateAppointment}
                  disabled={loading || !selectedPatient || !selectedDoctor || !selectedSpecialty || !appointmentDate || !appointmentTime || !reason}
                  className="px-10 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg flex items-center gap-3"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      Création...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-6 w-6" />
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
            toast.success('✅ Patient créé avec succès');
            // Auto-sélectionner le patient créé si possible
          }}
        />
      )}
    </div>
  );
};

export default AssistantDashboardV2;