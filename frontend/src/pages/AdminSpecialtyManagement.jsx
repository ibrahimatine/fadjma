import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Plus,
  Edit,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  Calendar,
  Users,
  Eye,
  EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const AdminSpecialtyManagement = () => {
  const [specialties, setSpecialties] = useState([]);
  const [availableSpecialties, setAvailableSpecialties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [createForm, setCreateForm] = useState({
    name: '',
    code: '',
    description: '',
    dailyAppointmentLimit: 20,
    averageConsultationDuration: 30,
    color: '#3B82F6',
    icon: ''
  });

  useEffect(() => {
    loadSpecialties();
    loadAvailableSpecialties();
  }, []);

  const loadSpecialties = async () => {
    try {
      setLoading(true);
      const response = await api.get('/appointments/admin/specialties');
      setSpecialties(response.data.specialties || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des spécialités');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSpecialties = async () => {
    try {
      const response = await api.get('/appointments/admin/available-specialties');
      setAvailableSpecialties(response.data.specialties || []);
    } catch (error) {
      console.error('Erreur lors du chargement des spécialités disponibles');
    }
  };

  const handleStartEdit = (specialty) => {
    setEditingId(specialty.id);
    setEditForm({
      name: specialty.name,
      description: specialty.description || '',
      dailyAppointmentLimit: specialty.dailyAppointmentLimit,
      averageConsultationDuration: specialty.averageConsultationDuration,
      color: specialty.color,
      icon: specialty.icon || '',
      isActive: specialty.isActive
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = async (specialtyId) => {
    try {
      setLoading(true);
      await api.put(`/appointments/admin/specialties/${specialtyId}`, editForm);
      toast.success('Spécialité mise à jour avec succès');
      setEditingId(null);
      setEditForm({});
      await loadSpecialties();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleSpecialtySelect = (e) => {
    const specialtyName = e.target.value;
    if (!specialtyName) {
      setSelectedSpecialty(null);
      setCreateForm({
        name: '',
        code: '',
        description: '',
        dailyAppointmentLimit: 20,
        averageConsultationDuration: 30,
        color: '#3B82F6',
        icon: ''
      });
      return;
    }

    const specialty = availableSpecialties.find(s => s.name === specialtyName);
    if (specialty) {
      setSelectedSpecialty(specialty);
      setCreateForm({
        name: specialty.name,
        code: specialty.code,
        description: specialty.description,
        dailyAppointmentLimit: specialty.defaultDailyLimit,
        averageConsultationDuration: specialty.defaultDuration,
        color: specialty.color,
        icon: specialty.icon
      });
    }
  };

  const handleCreateSpecialty = async () => {
    if (!selectedSpecialty) {
      toast.error('Veuillez sélectionner une spécialité');
      return;
    }

    try {
      setLoading(true);
      await api.post('/appointments/admin/specialties', createForm);
      toast.success('Spécialité créée avec succès');
      setShowCreateForm(false);
      setSelectedSpecialty(null);
      setCreateForm({
        name: '',
        code: '',
        description: '',
        dailyAppointmentLimit: 20,
        averageConsultationDuration: 30,
        color: '#3B82F6',
        icon: ''
      });
      await loadSpecialties();
      await loadAvailableSpecialties();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (specialtyId, currentStatus) => {
    try {
      await api.put(`/appointments/admin/specialties/${specialtyId}`, {
        isActive: !currentStatus
      });
      toast.success(`Spécialité ${!currentStatus ? 'activée' : 'désactivée'}`);
      await loadSpecialties();
    } catch (error) {
      toast.error('Erreur lors de la modification du statut');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Stethoscope className="h-8 w-8 text-blue-600" />
            Gestion des Spécialités
          </h1>
          <p className="text-gray-600 mt-2">
            Configurez les spécialités médicales et leurs limites de rendez-vous
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showCreateForm ? (
            <>
              <X className="h-5 w-5" />
              Annuler
            </>
          ) : (
            <>
              <Plus className="h-5 w-5" />
              Nouvelle Spécialité
            </>
          )}
        </button>
      </div>

      {/* Formulaire de création */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-blue-200">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">Créer une nouvelle spécialité</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Spécialité médicale *
              </label>
              <select
                value={selectedSpecialty?.name || ''}
                onChange={handleSpecialtySelect}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white"
              >
                <option value="">-- Sélectionnez une spécialité --</option>
                {availableSpecialties.map((specialty) => (
                  <option key={specialty.code} value={specialty.name}>
                    {specialty.name} ({specialty.code})
                  </option>
                ))}
              </select>
              {availableSpecialties.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  Toutes les spécialités ont déjà été créées
                </p>
              )}
              {selectedSpecialty && (
                <p className="text-xs text-gray-500 mt-1">
                  {selectedSpecialty.description}
                </p>
              )}
            </div>

            {selectedSpecialty && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Limite quotidienne de RDV
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={createForm.dailyAppointmentLimit}
                    onChange={(e) => setCreateForm({ ...createForm, dailyAppointmentLimit: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Valeur suggérée: {selectedSpecialty.defaultDailyLimit}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durée moyenne (minutes)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="120"
                    value={createForm.averageConsultationDuration}
                    onChange={(e) => setCreateForm({ ...createForm, averageConsultationDuration: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Valeur suggérée: {selectedSpecialty.defaultDuration} min
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Couleur
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={createForm.color}
                      onChange={(e) => setCreateForm({ ...createForm, color: e.target.value })}
                      className="border border-gray-300 rounded-lg px-2 py-1 h-10 w-20"
                    />
                    <span className="text-sm text-gray-600">{createForm.color}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code
                  </label>
                  <input
                    type="text"
                    value={createForm.code}
                    disabled
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-gray-600"
                  />
                </div>
              </>
            )}

            {selectedSpecialty && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optionnelle)
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                  rows="3"
                  placeholder="Description personnalisée..."
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={handleCreateSpecialty}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Créer la spécialité
            </button>
          </div>
        </div>
      )}

      {/* Liste des spécialités */}
      {loading && specialties.length === 0 ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Chargement...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {specialties.map((specialty) => {
            const isEditing = editingId === specialty.id;

            return (
              <div
                key={specialty.id}
                className={`bg-white rounded-lg shadow p-6 border-l-4 transition-all ${
                  !specialty.isActive
                    ? 'border-gray-400 opacity-60'
                    : 'border-blue-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {isEditing ? (
                      /* Mode édition */
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Nom
                            </label>
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Limite quotidienne de RDV
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={editForm.dailyAppointmentLimit}
                              onChange={(e) => setEditForm({ ...editForm, dailyAppointmentLimit: parseInt(e.target.value) })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Durée moyenne (minutes)
                            </label>
                            <input
                              type="number"
                              min="10"
                              max="120"
                              value={editForm.averageConsultationDuration}
                              onChange={(e) => setEditForm({ ...editForm, averageConsultationDuration: parseInt(e.target.value) })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Couleur
                            </label>
                            <input
                              type="color"
                              value={editForm.color}
                              onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-2 py-1 h-10"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Description
                            </label>
                            <textarea
                              value={editForm.description}
                              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                              rows="2"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <button
                            onClick={handleCancelEdit}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            <X className="h-4 w-4" />
                            Annuler
                          </button>
                          <button
                            onClick={() => handleSaveEdit(specialty.id)}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            <Save className="h-4 w-4" />
                            Enregistrer
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Mode affichage */
                      <>
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: specialty.color }}
                          />
                          <h3 className="text-xl font-semibold text-gray-900">
                            {specialty.name}
                          </h3>
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {specialty.code}
                          </span>
                          {!specialty.isActive && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                              Inactive
                            </span>
                          )}
                        </div>

                        {specialty.description && (
                          <p className="text-gray-600 mb-4">{specialty.description}</p>
                        )}

                        <div className="grid grid-cols-3 gap-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-500" />
                            <div>
                              <div className="text-xs text-gray-500">Limite quotidienne</div>
                              <div className="font-semibold">{specialty.dailyAppointmentLimit} RDV/jour</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-purple-500" />
                            <div>
                              <div className="text-xs text-gray-500">Durée moyenne</div>
                              <div className="font-semibold">{specialty.averageConsultationDuration} min</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-green-500" />
                            <div>
                              <div className="text-xs text-gray-500">Médecins</div>
                              <div className="font-semibold">{specialty.doctorCount}</div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleToggleActive(specialty.id, specialty.isActive)}
                        className={`p-2 rounded-lg transition-colors ${
                          specialty.isActive
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-400 hover:bg-gray-50'
                        }`}
                        title={specialty.isActive ? 'Désactiver' : 'Activer'}
                      >
                        {specialty.isActive ? (
                          <Eye className="h-5 w-5" />
                        ) : (
                          <EyeOff className="h-5 w-5" />
                        )}
                      </button>

                      <button
                        onClick={() => handleStartEdit(specialty)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {specialties.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucune spécialité trouvée
          </h3>
          <p className="text-gray-600">
            Créez votre première spécialité médicale pour commencer
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminSpecialtyManagement;