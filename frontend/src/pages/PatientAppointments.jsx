import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Stethoscope, Plus, X, CheckCircle } from 'lucide-react';
import { appointmentService } from '../services/appointmentService';
import toast from 'react-hot-toast';

const PatientAppointments = () => {
  const [activeTab, setActiveTab] = useState('book'); // 'book' or 'my-appointments'
  const [specialties, setSpecialties] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');
  const [myAppointments, setMyAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Charger les spécialités au montage
  useEffect(() => {
    console.log('Loading specialties...');
    loadSpecialties();
    if (activeTab === 'my-appointments') {
      loadMyAppointments();
    }
  }, [activeTab]);

  // Charger les médecins quand une spécialité est sélectionnée
  useEffect(() => {
    if (selectedSpecialty) {
      loadDoctors(selectedSpecialty.id);
    }
  }, [selectedSpecialty]);

  // Charger les créneaux quand un médecin et une date sont sélectionnés
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      loadAvailableSlots(selectedDoctor.id, selectedDate);
    }
  }, [selectedDoctor, selectedDate]);

  const loadSpecialties = async () => {
    try {
      const data = await appointmentService.getSpecialties();
      setSpecialties(data.specialties || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des spécialités');
    }
  };

  const loadDoctors = async (specialtyId) => {
    try {
      setLoading(true);
      const data = await appointmentService.getDoctorsBySpecialty(specialtyId);
      setDoctors(data.doctors || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des médecins');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async (doctorId, date) => {
    try {
      setLoading(true);
      const data = await appointmentService.getAvailableSlots(doctorId, date);
      setAvailableSlots(data.slots || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des créneaux');
    } finally {
      setLoading(false);
    }
  };

  const loadMyAppointments = async () => {
    try {
      setLoading(true);
      const data = await appointmentService.getMyAppointments();
      setMyAppointments(data.appointments || []);
    } catch (error) {
      toast.error('Erreur lors du chargement de vos rendez-vous');
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedSpecialty || !selectedDoctor || !selectedDate || !selectedSlot || !reason) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      setLoading(true);
      await appointmentService.createAppointment({
        doctorId: selectedDoctor.id,
        specialtyId: selectedSpecialty.id,
        appointmentDate: selectedDate,
        appointmentTime: selectedSlot + ':00',
        reason
      });

      toast.success('Rendez-vous créé avec succès !');

      // Réinitialiser le formulaire
      setSelectedSpecialty(null);
      setSelectedDoctor(null);
      setSelectedDate('');
      setSelectedSlot(null);
      setReason('');
      setActiveTab('my-appointments');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création du rendez-vous');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) {
      return;
    }

    try {
      const reason = prompt('Raison de l\'annulation (optionnel):');
      await appointmentService.cancelAppointment(appointmentId, reason);
      toast.success('Rendez-vous annulé');
      loadMyAppointments();
    } catch (error) {
      toast.error('Erreur lors de l\'annulation');
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Mes Rendez-vous</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('book')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'book'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Plus className="inline h-5 w-5 mr-2" />
            Prendre RDV
          </button>
          <button
            onClick={() => setActiveTab('my-appointments')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'my-appointments'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Calendar className="inline h-5 w-5 mr-2" />
            Mes RDV
          </button>
        </nav>
      </div>

      {/* Contenu */}
      {activeTab === 'book' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">Réserver un rendez-vous</h2>

          {/* Étape 1: Sélectionner une spécialité */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              1. Choisissez une spécialité
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {specialties.map((specialty) => (
                <button
                  key={specialty.id}
                  onClick={() => {
                    setSelectedSpecialty(specialty);
                    setSelectedDoctor(null);
                    setSelectedDate('');
                    setSelectedSlot(null);
                  }}
                  className={`p-4 border-2 rounded-lg text-left transition ${
                    selectedSpecialty?.id === specialty.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                  style={{
                    borderColor: selectedSpecialty?.id === specialty.id ? specialty.color : undefined
                  }}
                >
                  <div className="font-semibold text-sm">{specialty.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {specialty.doctorCount} médecin{specialty.doctorCount > 1 ? 's' : ''}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Étape 2: Sélectionner un médecin */}
          {selectedSpecialty && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                2. Choisissez un médecin
              </label>
              {loading ? (
                <div className="text-center py-4">Chargement...</div>
              ) : doctors.length === 0 ? (
                <div className="text-center py-4 text-gray-500">Aucun médecin disponible</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {doctors.map((doctor) => (
                    <button
                      key={doctor.id}
                      onClick={() => {
                        setSelectedDoctor(doctor);
                        setSelectedDate('');
                        setSelectedSlot(null);
                      }}
                      className={`p-4 border-2 rounded-lg text-left transition ${
                        selectedDoctor?.id === doctor.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <User className="h-10 w-10 text-gray-400 mr-3" />
                        <div>
                          <div className="font-semibold">Dr. {doctor.firstName} {doctor.lastName}</div>
                          {doctor.yearsOfExperience && (
                            <div className="text-xs text-gray-500">
                              {doctor.yearsOfExperience} ans d'expérience
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Étape 3: Choisir une date */}
          {selectedDoctor && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                3. Choisissez une date
              </label>
              <input
                type="date"
                min={getMinDate()}
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlot(null);
                }}
                className="border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
          )}

          {/* Étape 4: Choisir un créneau */}
          {selectedDate && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                4. Choisissez un créneau
              </label>
              {loading ? (
                <div className="text-center py-4">Chargement des créneaux...</div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  Aucun créneau disponible pour cette date
                </div>
              ) : (
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => setSelectedSlot(slot.time)}
                      className={`py-2 px-3 border rounded-lg text-sm transition ${
                        selectedSlot === slot.time
                          ? 'border-primary-500 bg-primary-500 text-white'
                          : 'border-gray-300 hover:border-primary-300'
                      }`}
                    >
                      <Clock className="inline h-4 w-4 mr-1" />
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Étape 5: Motif */}
          {selectedSlot && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                5. Motif de la consultation
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                rows="3"
                placeholder="Décrivez brièvement le motif de votre consultation..."
              />
            </div>
          )}

          {/* Bouton de confirmation */}
          {selectedSlot && reason && (
            <div className="flex justify-end">
              <button
                onClick={handleBookAppointment}
                disabled={loading}
                className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
              >
                <CheckCircle className="inline h-5 w-5 mr-2" />
                Confirmer le rendez-vous
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'my-appointments' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : myAppointments.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              Vous n'avez aucun rendez-vous
            </div>
          ) : (
            myAppointments.map((appointment) => {
              const statusBadge = appointmentService.getStatusBadge(appointment.status);
              return (
                <div key={appointment.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <Stethoscope
                          className="h-5 w-5 mr-2"
                          style={{ color: appointment.specialty?.color }}
                        />
                        <span className="font-semibold text-lg">
                          {appointment.specialty?.name}
                        </span>
                        <span className={`ml-3 px-3 py-1 text-xs rounded-full bg-${statusBadge.color}-100 text-${statusBadge.color}-800`}>
                          {statusBadge.text}
                        </span>
                      </div>
                      <div className="text-gray-600 space-y-1">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {appointmentService.formatDate(appointment.appointmentDate)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          {appointmentService.formatTime(appointment.appointmentTime)}
                        </div>
                        {appointment.reason && (
                          <div className="mt-2 text-sm">
                            <strong>Motif:</strong> {appointment.reason}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      {appointment.status === 'pending' && (
                        <button
                          onClick={() => handleCancelAppointment(appointment.id)}
                          className="text-red-600 hover:text-red-800 flex items-center text-sm"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Annuler
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default PatientAppointments;