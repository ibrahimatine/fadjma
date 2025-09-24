// src/components/access/AccessRequestModal.jsx
import React, { useState } from 'react';
import { X, Send, Clock, FileText } from 'lucide-react';

const AccessRequestModal = ({
  isOpen,
  onClose,
  patient,
  onSubmit,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    reason: '',
    accessLevel: 'write',
    expiresAt: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.reason.trim()) {
      return;
    }

    const requestData = {
      patientId: patient.id,
      reason: formData.reason.trim(),
      accessLevel: formData.accessLevel,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null
    };

    await onSubmit(requestData);

    // Reset form
    setFormData({
      reason: '',
      accessLevel: 'read',
      expiresAt: ''
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Set default expiration to 7 days from now
  React.useEffect(() => {
    if (isOpen && !formData.expiresAt) {
      const defaultExpiry = new Date();
      defaultExpiry.setDate(defaultExpiry.getDate() + 7);
      setFormData(prev => ({
        ...prev,
        expiresAt: defaultExpiry.toISOString().split('T')[0]
      }));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Demande d'accès
              </h3>
              <p className="text-sm text-gray-600">
                Patient: {patient?.firstName} {patient?.lastName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Raison de la demande *
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="Ex: Consultation de suivi, Urgence médicale, Seconde opinion..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              rows={3}
              required
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Expliquez pourquoi vous avez besoin d'accéder au dossier de ce patient
            </p>
          </div>

          {/* Access Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Niveau d'accès
            </label>
            <select
              name="accessLevel"
              value={formData.accessLevel}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={loading}
            >
              <option value="read">Lecture seule</option>
              <option value="write">Lecture et écriture</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {formData.accessLevel === 'read' && 'Consultation des dossiers existants uniquement'}
              {formData.accessLevel === 'write' && 'Consultation et modification des dossiers'}
            </p>
          </div>

          {/* Expiration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date d'expiration
            </label>
            <input
              type="date"
              name="expiresAt"
              value={formData.expiresAt}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              min={new Date().toISOString().split('T')[0]}
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              L'accès sera automatiquement révoqué à cette date
            </p>
          </div>

          {/* Patient Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Informations du patient
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Nom:</span> {patient?.firstName} {patient?.lastName}</p>
              <p><span className="font-medium">ID:</span> {patient?.id}</p>
              {patient?.email && (
                <p><span className="font-medium">Email:</span> {patient?.email}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !formData.reason.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Envoyer la demande
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccessRequestModal;