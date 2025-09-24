// src/components/patient/PatientSelectionModal.jsx
import React, { useState, useEffect } from 'react';
import { User, Search, X, FileText } from 'lucide-react';
import accessService from '../../services/accessService';

const PatientSelectionModal = ({ isOpen, onClose, onSelectPatient, doctorId }) => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && doctorId) {
      console.log('PatientSelectionModal ouvert, chargement des patients...', { isOpen, doctorId });
      loadAccessiblePatients();
    }
  }, [isOpen, doctorId]);

  useEffect(() => {
    filterPatients();
  }, [searchQuery, patients]);

  const loadAccessiblePatients = async () => {
    setLoading(true);
    try {
      console.log('Appel API getAccessiblePatients pour docteur:', doctorId);
      const response = await accessService.getAccessiblePatients(doctorId);
      console.log('Réponse API patients accessibles:', response);
      setPatients(response.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des patients:', error);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    if (!searchQuery.trim()) {
      setFilteredPatients(patients);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = patients.filter(patient =>
      `${patient.firstName} ${patient.lastName} ${patient.email || ''}`.toLowerCase().includes(query)
    );
    setFilteredPatients(filtered);
  };

  const handlePatientSelect = (patient) => {
    onSelectPatient(patient);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Sélectionner un Patient
              </h2>
              <p className="text-sm text-gray-600">
                Choisissez le patient pour lequel créer un dossier médical
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Rechercher un patient par nom, prénom ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Patient List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Chargement des patients...</span>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {patients.length === 0 ? 'Aucun accès patient' : 'Aucun patient trouvé'}
              </h3>
              <p className="text-gray-600">
                {patients.length === 0
                  ? 'Vous n\'avez accès à aucun dossier patient actuellement.'
                  : 'Aucun patient ne correspond à votre recherche.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => handlePatientSelect(patient)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-900 transition-colors">
                        {patient.firstName} {patient.lastName}
                      </h3>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">ID: {patient.id}</p>
                        {patient.email && (
                          <p className="text-sm text-gray-500">{patient.email}</p>
                        )}
                        {patient.phoneNumber && (
                          <p className="text-sm text-gray-500">{patient.phoneNumber}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        Accès approuvé
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientSelectionModal;