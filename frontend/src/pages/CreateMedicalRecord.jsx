// src/pages/CreateMedicalRecord.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  FileText,
  Save,
  ArrowLeft,
  User,
  Calendar,
  AlertCircle,
  Pill,
  Syringe,
  Activity,
  Heart
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import medicalRecordService from '../services/medicalRecordService';

const CreateMedicalRecord = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { user } = useAuth();
  const selectedPatient = state?.patient;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    type: 'consultation',
    title: '',
    description: '',
    diagnosis: '',
    medications: [],
    allergen: '',
    severity: '',
    vaccine: '',
    batchNumber: '',
    testType: '',
    results: '',
    metadata: {}
  });

  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    duration: ''
  });

  useEffect(() => {
    // Si aucun patient sélectionné, rediriger vers le dashboard
    if (!selectedPatient) {
      navigate('/dashboard');
      return;
    }
  }, [selectedPatient, navigate]);

  const recordTypes = {
    consultation: {
      icon: Heart,
      label: 'Consultation',
      color: 'purple',
      fields: ['title', 'description', 'diagnosis']
    },
    prescription: {
      icon: Pill,
      label: 'Prescription',
      color: 'blue',
      fields: ['title', 'description', 'medications']
    },
    vaccination: {
      icon: Syringe,
      label: 'Vaccination',
      color: 'green',
      fields: ['title', 'description', 'vaccine', 'batchNumber']
    },
    allergy: {
      icon: AlertCircle,
      label: 'Allergie',
      color: 'red',
      fields: ['title', 'description', 'allergen', 'severity']
    },
    test_result: {
      icon: Activity,
      label: 'Résultat d\'examen',
      color: 'orange',
      fields: ['title', 'description', 'testType', 'results']
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleAddMedication = () => {
    if (newMedication.name && newMedication.dosage) {
      setFormData(prev => ({
        ...prev,
        medications: [...prev.medications, { ...newMedication }]
      }));
      setNewMedication({ name: '', dosage: '', frequency: '', duration: '' });
    }
  };

  const handleRemoveMedication = (index) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const config = recordTypes[formData.type];

    if (!formData.title.trim()) {
      setError('Le titre est obligatoire');
      return false;
    }

    if (!formData.description.trim()) {
      setError('La description est obligatoire');
      return false;
    }

    // Validation spécifique par type
    if (formData.type === 'prescription' && formData.medications.length === 0) {
      setError('Au moins un médicament doit être ajouté pour une prescription');
      return false;
    }

    if (formData.type === 'allergy' && !formData.allergen.trim()) {
      setError('L\'allergène est obligatoire pour une allergie');
      return false;
    }

    if (formData.type === 'vaccination' && !formData.vaccine.trim()) {
      setError('Le nom du vaccin est obligatoire');
      return false;
    }

    if (formData.type === 'test_result' && !formData.testType.trim()) {
      setError('Le type d\'examen est obligatoire');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const recordData = {
        patientId: selectedPatient.id,
        type: formData.type,
        title: formData.title,
        description: formData.description,
        diagnosis: formData.diagnosis || null,
        prescription: formData.type === 'prescription' ? formData.medications : null,
        metadata: {
          ...(formData.type === 'allergy' && {
            allergen: formData.allergen,
            severity: formData.severity
          }),
          ...(formData.type === 'vaccination' && {
            vaccine: formData.vaccine,
            batchNumber: formData.batchNumber
          }),
          ...(formData.type === 'test_result' && {
            testType: formData.testType,
            results: formData.results
          })
        }
      };

      await medicalRecordService.createRecord(recordData);
      setSuccess('Dossier médical créé avec succès');

      // Rediriger vers le dashboard après 2 secondes
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (err) {
      console.error('Erreur lors de la création:', err);
      setError(err.message || 'Erreur lors de la création du dossier médical');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedPatient) {
    return null;
  }

  const currentType = recordTypes[formData.type];
  const TypeIcon = currentType.icon;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            Retour au dashboard
          </button>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg bg-${currentType.color}-100`}>
                <TypeIcon className={`h-8 w-8 text-${currentType.color}-600`} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Créer un dossier médical - {currentType.label}
                </h1>
                <div className="flex items-center gap-2 mt-2 text-gray-600">
                  <User className="h-4 w-4" />
                  <span>Patient: {selectedPatient.firstName} {selectedPatient.lastName}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-3">
                Type de dossier médical
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(recordTypes).map(([type, config]) => {
                  const Icon = config.icon;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleInputChange('type', type)}
                      className={`p-4 rounded-lg border-2 transition-all text-center ${
                        formData.type === type
                          ? `border-${config.color}-500 bg-${config.color}-50`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`h-6 w-6 mx-auto mb-2 ${
                        formData.type === type ? `text-${config.color}-600` : 'text-gray-400'
                      }`} />
                      <span className={`text-sm font-medium ${
                        formData.type === type ? `text-${config.color}-900` : 'text-gray-700'
                      }`}>
                        {config.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Basic Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Titre *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Titre du dossier médical"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Description détaillée"
                  required
                />
              </div>
            </div>

            {/* Type-specific fields */}
            {formData.type === 'consultation' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Diagnostic
                </label>
                <textarea
                  value={formData.diagnosis}
                  onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Diagnostic médical"
                />
              </div>
            )}

            {formData.type === 'prescription' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Médicaments prescrits
                </label>

                {/* Add medication */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="text"
                    placeholder="Nom du médicament"
                    value={newMedication.name}
                    onChange={(e) => setNewMedication(prev => ({ ...prev, name: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Dosage"
                    value={newMedication.dosage}
                    onChange={(e) => setNewMedication(prev => ({ ...prev, dosage: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Fréquence"
                    value={newMedication.frequency}
                    onChange={(e) => setNewMedication(prev => ({ ...prev, frequency: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddMedication}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Ajouter
                  </button>
                </div>

                {/* Medications list */}
                {formData.medications.length > 0 && (
                  <div className="space-y-2">
                    {formData.medications.map((med, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div>
                          <span className="font-medium">{med.name}</span>
                          <span className="text-gray-600 ml-2">- {med.dosage}</span>
                          {med.frequency && <span className="text-gray-500 ml-2">({med.frequency})</span>}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveMedication(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Supprimer
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {formData.type === 'allergy' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Allergène *
                  </label>
                  <input
                    type="text"
                    value={formData.allergen}
                    onChange={(e) => handleInputChange('allergen', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nom de l'allergène"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Sévérité
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) => handleInputChange('severity', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner</option>
                    <option value="Légère">Légère</option>
                    <option value="Modérée">Modérée</option>
                    <option value="Sévère">Sévère</option>
                    <option value="Critique">Critique</option>
                  </select>
                </div>
              </div>
            )}

            {formData.type === 'vaccination' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Nom du vaccin *
                  </label>
                  <input
                    type="text"
                    value={formData.vaccine}
                    onChange={(e) => handleInputChange('vaccine', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nom du vaccin"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Numéro de lot
                  </label>
                  <input
                    type="text"
                    value={formData.batchNumber}
                    onChange={(e) => handleInputChange('batchNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Numéro de lot"
                  />
                </div>
              </div>
            )}

            {formData.type === 'test_result' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Type d'examen *
                  </label>
                  <input
                    type="text"
                    value={formData.testType}
                    onChange={(e) => handleInputChange('testType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type d'examen"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Résultats
                  </label>
                  <textarea
                    value={formData.results}
                    onChange={(e) => handleInputChange('results', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Résultats de l'examen"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Création...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Créer le dossier
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMedicalRecord;