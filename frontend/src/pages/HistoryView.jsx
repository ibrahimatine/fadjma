import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  Search,
  Calendar,
  User,
  ArrowLeft,
  Stethoscope
} from 'lucide-react';
import DoctorPatientHistory from '../components/history/DoctorPatientHistory';
import { historyService } from '../services/historyService';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

const HistoryView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [searchMode, setSearchMode] = useState(true);
  const [searchForm, setSearchForm] = useState({
    doctorId: searchParams.get('doctorId') || '',
    patientId: searchParams.get('patientId') || '',
    doctorName: '',
    patientName: ''
  });
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [availablePatients, setAvailablePatients] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);

    // Si c'est un docteur, pré-remplir son ID
    if (currentUser?.role === 'doctor') {
      setSearchForm(prev => ({
        ...prev,
        doctorId: currentUser.id,
        doctorName: `${currentUser.firstName} ${currentUser.lastName}`
      }));
    }

    // Si c'est un patient, pré-remplir son ID
    if (currentUser?.role === 'patient') {
      setSearchForm(prev => ({
        ...prev,
        patientId: currentUser.id,
        patientName: `${currentUser.firstName} ${currentUser.lastName}`
      }));
    }

    // Si on a déjà des IDs dans l'URL, charger directement l'historique
    if (searchParams.get('doctorId') && searchParams.get('patientId')) {
      setSearchMode(false);
    }

    loadAvailableUsers();
  }, [searchParams]);

  const loadAvailableUsers = async () => {
    try {
      // Charger les docteurs et patients disponibles selon le rôle
      if (user?.role === 'admin') {
        // L'admin peut voir tous les docteurs et patients
        // TODO: Implémenter des endpoints pour lister les utilisateurs
        console.log('Admin can see all users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleSearch = async () => {
    // Vérifier qu'on a au moins les noms ou les IDs
    if ((!searchForm.doctorId && !searchForm.doctorName) || (!searchForm.patientId && !searchForm.patientName)) {
      toast.error('Veuillez saisir au moins le nom du docteur et du patient');
      return;
    }

    setLoading(true);

    try {
      // Si on n'a que les noms, essayer de trouver les IDs
      let finalDoctorId = searchForm.doctorId;
      let finalPatientId = searchForm.patientId;

      // Rechercher le docteur par nom si nécessaire
      if (!finalDoctorId && searchForm.doctorName) {
        try {
          const doctorSearchResponse = await historyService.searchUsers(searchForm.doctorName, 'doctor');
          if (doctorSearchResponse.success && doctorSearchResponse.data.length > 0) {
            const doctor = doctorSearchResponse.data[0]; // Prendre le premier résultat
            finalDoctorId = doctor.id;
            setSearchForm(prev => ({
              ...prev,
              doctorId: doctor.id,
              doctorName: doctor.displayName
            }));
            toast.success(`Docteur trouvé: ${doctor.displayName}`);
          } else {
            toast.error(`Aucun docteur trouvé avec le nom "${searchForm.doctorName}"`);
            return;
          }
        } catch (error) {
          console.error('Doctor search error:', error);
          toast.error('Erreur lors de la recherche du docteur');
          return;
        }
      }

      // Rechercher le patient par nom si nécessaire
      if (!finalPatientId && searchForm.patientName) {
        try {
          const patientSearchResponse = await historyService.searchUsers(searchForm.patientName, 'patient');
          if (patientSearchResponse.success && patientSearchResponse.data.length > 0) {
            const patient = patientSearchResponse.data[0]; // Prendre le premier résultat
            finalPatientId = patient.id;
            setSearchForm(prev => ({
              ...prev,
              patientId: patient.id,
              patientName: patient.displayName
            }));
            toast.success(`Patient trouvé: ${patient.displayName}`);
          } else {
            toast.error(`Aucun patient trouvé avec le nom "${searchForm.patientName}"`);
            return;
          }
        } catch (error) {
          console.error('Patient search error:', error);
          toast.error('Erreur lors de la recherche du patient');
          return;
        }
      }

      setSearchParams({
        doctorId: finalDoctorId,
        patientId: finalPatientId
      });

      setSearchForm(prev => ({
        ...prev,
        doctorId: finalDoctorId,
        patientId: finalPatientId
      }));

      setSearchMode(false);

    } catch (error) {
      console.error('Search error:', error);
      toast.error('Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setSearchMode(true);
    setSearchParams({});
  };

  const canViewHistory = () => {
    if (!user) return false;

    // Admin peut tout voir
    if (user.role === 'admin') return true;

    // Docteur ne peut voir que ses propres interactions
    if (user.role === 'doctor') {
      return searchForm.doctorId === user.id;
    }

    // Patient ne peut voir que ses propres données
    if (user.role === 'patient') {
      return searchForm.patientId === user.id;
    }

    return false;
  };

  if (!canViewHistory() && !searchMode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-red-500 mb-4">
            <Users className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès refusé</h2>
          <p className="text-gray-600 mb-4">
            Vous n'avez pas l'autorisation de voir cet historique.
          </p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {searchMode ? (
          // Mode recherche
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-center mb-8">
              <Users className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900">Historique des Interactions</h1>
              <p className="text-gray-600 mt-2">
                Consultez l'historique complet des interactions entre docteurs et patients
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <div className="space-y-6">

                {/* Sélection du docteur */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Stethoscope className="inline h-4 w-4 mr-2" />
                    Docteur
                  </label>
                  {user?.role === 'doctor' ? (
                    <div className="px-4 py-3 bg-gray-50 rounded-lg border">
                      <span className="text-gray-900">
                        Dr. {user.firstName} {user.lastName}
                      </span>
                      <span className="text-gray-500 ml-2">(Vous)</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Nom du docteur..."
                        value={searchForm.doctorName}
                        onChange={(e) => setSearchForm(prev => ({ ...prev, doctorName: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="ID du docteur (optionnel)"
                        value={searchForm.doctorId}
                        onChange={(e) => setSearchForm(prev => ({ ...prev, doctorId: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-gray-500"
                      />
                    </div>
                  )}
                </div>

                {/* Sélection du patient */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="inline h-4 w-4 mr-2" />
                    Patient
                  </label>
                  {user?.role === 'patient' ? (
                    <div className="px-4 py-3 bg-gray-50 rounded-lg border">
                      <span className="text-gray-900">
                        {user.firstName} {user.lastName}
                      </span>
                      <span className="text-gray-500 ml-2">(Vous)</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Nom du patient..."
                        value={searchForm.patientName}
                        onChange={(e) => setSearchForm(prev => ({ ...prev, patientName: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="ID du patient (optionnel si nom fourni)"
                        value={searchForm.patientId}
                        onChange={(e) => setSearchForm(prev => ({ ...prev, patientId: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* Bouton de recherche */}
                <button
                  onClick={handleSearch}
                  disabled={(!searchForm.doctorId && !searchForm.doctorName) || (!searchForm.patientId && !searchForm.patientName) || loading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Search className="h-5 w-5" />
                  Voir l'historique
                </button>

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">💡 Instructions</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Les <strong>docteurs</strong> ne peuvent voir que leurs propres interactions</li>
                    <li>• Les <strong>patients</strong> ne peuvent voir que leur propre historique</li>
                    <li>• Les <strong>administrateurs</strong> peuvent voir tous les historiques</li>
                    <li>• Tous les enregistrements sont vérifiables sur la blockchain Hedera</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Mode affichage de l'historique
          <div>
            <div className="mb-6">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Nouvelle recherche
              </button>
            </div>

            <DoctorPatientHistory
              doctorId={searchForm.doctorId}
              patientId={searchForm.patientId}
              doctorName={searchForm.doctorName || `Docteur ${searchForm.doctorId}`}
              patientName={searchForm.patientName || `Patient ${searchForm.patientId}`}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryView;