import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, CheckCircle, X, FileText } from 'lucide-react';
import { appointmentService } from '../services/appointmentService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const DoctorAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAppointments();

    // Écouter les événements de rafraîchissement
    const handleRefreshAppointments = () => {
      console.log('🔄 Refreshing doctor appointments from event...');
      loadAppointments();
    };

    window.addEventListener('refreshAppointments', handleRefreshAppointments);

    return () => {
      window.removeEventListener('refreshAppointments', handleRefreshAppointments);
    };
  }, [selectedDate, filterStatus]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (selectedDate) filters.date = selectedDate;
      if (filterStatus !== 'all') filters.status = filterStatus;

      // Utiliser l'API appropriée selon le rôle
      let data;
      if (user?.role === 'assistant') {
        console.log('Loading appointments for assistant');
        data = await appointmentService.getAllAppointmentsForAssistant(filters);
      } else {
        console.log('Loading appointments for doctor');
        data = await appointmentService.getDoctorAppointments(filters);
      }

      setAppointments(data.appointments || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast.error('Erreur lors du chargement des rendez-vous');
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

  const handleComplete = async (appointmentId) => {
    const notes = prompt('Notes de consultation (optionnel):');
    try {
      await appointmentService.completeAppointment(appointmentId, notes);
      toast.success('Rendez-vous marqué comme terminé');
      loadAppointments();
    } catch (error) {
      toast.error('Erreur lors de la finalisation');
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

  const groupByStatus = () => {
    const grouped = {
      pending: [],
      confirmed: [],
      completed: [],
      cancelled: []
    };

    appointments.forEach(apt => {
      if (grouped[apt.status]) {
        grouped[apt.status].push(apt);
      }
    });

    return grouped;
  };

  const grouped = groupByStatus();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Mes Rendez-vous</h1>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2"
            >
              <option value="all">Tous</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmés</option>
              <option value="completed">Terminés</option>
              <option value="cancelled">Annulés</option>
            </select>
          </div>
          <div className="ml-auto">
            <div className="text-sm text-gray-600">
              {appointments.length} rendez-vous
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Chargement...</div>
      ) : (
        <div className="space-y-6">
          {/* En attente */}
          {grouped.pending.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-yellow-700">
                En attente de confirmation ({grouped.pending.length})
              </h2>
              <div className="space-y-3">
                {grouped.pending.map((apt) => (
                  <AppointmentCard
                    key={apt.id}
                    appointment={apt}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                    showActions={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Confirmés */}
          {grouped.confirmed.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-blue-700">
                Confirmés ({grouped.confirmed.length})
              </h2>
              <div className="space-y-3">
                {grouped.confirmed.map((apt) => (
                  <AppointmentCard
                    key={apt.id}
                    appointment={apt}
                    onComplete={handleComplete}
                    onCancel={handleCancel}
                    showActions={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Terminés */}
          {grouped.completed.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-green-700">
                Terminés ({grouped.completed.length})
              </h2>
              <div className="space-y-3">
                {grouped.completed.map((apt) => (
                  <AppointmentCard
                    key={apt.id}
                    appointment={apt}
                    showActions={false}
                  />
                ))}
              </div>
            </div>
          )}

          {appointments.length === 0 && (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              Aucun rendez-vous pour cette date
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AppointmentCard = ({ appointment, onConfirm, onComplete, onCancel, showActions }) => {
  const statusBadge = appointmentService.getStatusBadge(appointment.status);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-3">
            <span className={`px-3 py-1 text-xs rounded-full bg-${statusBadge.color}-100 text-${statusBadge.color}-800`}>
              {statusBadge.text}
            </span>
            <span className="ml-3 font-semibold text-lg">
              {appointmentService.formatTime(appointment.appointmentTime)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center text-gray-700">
                <User className="h-4 w-4 mr-2 text-gray-400" />
                <span className="font-medium">
                  {appointment.patient?.firstName} {appointment.patient?.lastName}
                </span>
              </div>
              {appointment.patient?.phoneNumber && (
                <div className="flex items-center text-gray-600 text-sm">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  {appointment.patient.phoneNumber}
                </div>
              )}
              <div className="flex items-center text-gray-600 text-sm">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                {appointmentService.formatDate(appointment.appointmentDate)}
              </div>
            </div>

            <div>
              <div className="text-sm">
                <div className="font-medium text-gray-700 mb-1">Spécialité</div>
                <div className="text-gray-600">{appointment.specialty?.name}</div>
              </div>
              {appointment.reason && (
                <div className="mt-3 text-sm">
                  <div className="font-medium text-gray-700 mb-1">Motif</div>
                  <div className="text-gray-600">{appointment.reason}</div>
                </div>
              )}
              {appointment.notes && (
                <div className="mt-3 text-sm">
                  <div className="font-medium text-gray-700 mb-1">Notes</div>
                  <div className="text-gray-600">{appointment.notes}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {showActions && (
          <div className="ml-4 flex flex-col gap-2">
            {appointment.status === 'pending' && (
              <>
                <button
                  onClick={() => onConfirm(appointment.id)}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Confirmer
                </button>
                <button
                  onClick={() => onCancel(appointment.id)}
                  className="flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
                >
                  <X className="h-4 w-4 mr-1" />
                  Annuler
                </button>
              </>
            )}
            {appointment.status === 'confirmed' && (
              <>
                <button
                  onClick={() => onComplete(appointment.id)}
                  className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Terminer
                </button>
                <button
                  onClick={() => onCancel(appointment.id)}
                  className="flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"
                >
                  <X className="h-4 w-4 mr-1" />
                  Annuler
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorAppointments;