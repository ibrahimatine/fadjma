import React, { useState, useEffect } from 'react';
import { Package, CheckSquare, Square, AlertCircle, Copy, ExternalLink } from 'lucide-react';
import { prescriptionGroupService } from '../../services/prescriptionGroupService';
import toast from 'react-hot-toast';
import api from '../../services/api';

const PrescriptionGroupForm = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescriptionIds, setSelectedPrescriptionIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createdGroup, setCreatedGroup] = useState(null);

  // Charger les patients du médecin
  useEffect(() => {
    loadMyPatients();
  }, []);

  // Charger les prescriptions du patient sélectionné
  useEffect(() => {
    if (selectedPatient) {
      loadPatientPrescriptions(selectedPatient.id);
    }
  }, [selectedPatient]);

  const loadMyPatients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/medical-records/doctor/my-patients');
      setPatients(response.data.patients || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des patients');
    } finally {
      setLoading(false);
    }
  };

  const loadPatientPrescriptions = async (patientId) => {
    try {
      setLoading(true);
      // Obtenir les prescriptions non délivrées du patient
      const response = await api.get(`/prescriptions/patient/${patientId}`);

      // Filtrer les prescriptions non délivrées et non groupées
      const availablePrescriptions = response.data.prescriptions.filter(
        prx => prx.deliveryStatus === 'pending' && !prx.groupId
      );

      setPrescriptions(availablePrescriptions);
    } catch (error) {
      toast.error('Erreur lors du chargement des prescriptions');
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const togglePrescription = (prescriptionId) => {
    setSelectedPrescriptionIds(prev => {
      if (prev.includes(prescriptionId)) {
        return prev.filter(id => id !== prescriptionId);
      } else {
        return [...prev, prescriptionId];
      }
    });
  };

  const selectAll = () => {
    if (selectedPrescriptionIds.length === prescriptions.length) {
      setSelectedPrescriptionIds([]);
    } else {
      setSelectedPrescriptionIds(prescriptions.map(p => p.id));
    }
  };

  const handleCreateGroup = async () => {
    if (!selectedPatient) {
      toast.error('Veuillez sélectionner un patient');
      return;
    }

    if (selectedPrescriptionIds.length === 0) {
      toast.error('Veuillez sélectionner au moins une prescription');
      return;
    }

    try {
      setLoading(true);
      const result = await prescriptionGroupService.createPrescriptionGroup(
        selectedPrescriptionIds,
        selectedPatient.id
      );

      setCreatedGroup(result.prescriptionGroup);
      toast.success('Groupe de prescriptions créé avec succès !');

      // Réinitialiser
      setSelectedPrescriptionIds([]);
      loadPatientPrescriptions(selectedPatient.id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création du groupe');
    } finally {
      setLoading(false);
    }
  };

  const copyMatricule = (matricule) => {
    navigator.clipboard.writeText(matricule);
    toast.success('Matricule copié !');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Groupes de Prescriptions</h1>
        <p className="text-gray-600">
          Créez un groupe de prescriptions pour que votre patient puisse tout récupérer en une seule fois à la pharmacie
        </p>
      </div>

      {/* Confirmation du groupe créé */}
      {createdGroup && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Groupe créé avec succès !
              </h3>
              <div className="bg-white rounded border border-green-300 p-4 mb-3">
                <div className="text-sm text-gray-700 mb-2">Matricule du groupe :</div>
                <div className="flex items-center justify-between">
                  <code className="text-2xl font-bold text-green-700">
                    {prescriptionGroupService.formatMatricule(createdGroup.groupMatricule)}
                  </code>
                  <button
                    onClick={() => copyMatricule(createdGroup.groupMatricule)}
                    className="ml-3 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center text-sm"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copier
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-700">
                <strong>{createdGroup.items?.length}</strong> prescription(s) groupée(s)
              </div>
              <div className="mt-3 text-sm text-gray-600">
                Donnez ce matricule à votre patient. Il pourra récupérer toutes ses prescriptions en une seule fois à la pharmacie.
              </div>
              <button
                onClick={() => setCreatedGroup(null)}
                className="mt-4 text-sm text-green-700 hover:text-green-800 underline"
              >
                Créer un autre groupe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire */}
      {!createdGroup && (
        <div className="space-y-6">
          {/* Sélection du patient */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">1. Sélectionnez un patient</h2>

            {loading && !selectedPatient ? (
              <div className="text-center py-4">Chargement des patients...</div>
            ) : patients.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>Aucun patient trouvé</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {patients.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => {
                      setSelectedPatient(patient);
                      setSelectedPrescriptionIds([]);
                      setCreatedGroup(null);
                    }}
                    className={`p-4 border-2 rounded-lg text-left transition ${
                      selectedPatient?.id === patient.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    <div className="font-semibold">
                      {patient.firstName} {patient.lastName}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {patient.matricule}
                    </div>
                    {patient.phoneNumber && (
                      <div className="text-xs text-gray-500 mt-1">
                        {patient.phoneNumber}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sélection des prescriptions */}
          {selectedPatient && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  2. Sélectionnez les prescriptions à grouper
                </h2>
                {prescriptions.length > 0 && (
                  <button
                    onClick={selectAll}
                    className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                  >
                    {selectedPrescriptionIds.length === prescriptions.length ? (
                      <>
                        <CheckSquare className="h-4 w-4 mr-1" />
                        Tout désélectionner
                      </>
                    ) : (
                      <>
                        <Square className="h-4 w-4 mr-1" />
                        Tout sélectionner
                      </>
                    )}
                  </button>
                )}
              </div>

              {loading ? (
                <div className="text-center py-4">Chargement des prescriptions...</div>
              ) : prescriptions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>Aucune prescription disponible pour ce patient</p>
                  <p className="text-sm mt-2">
                    Les prescriptions déjà délivrées ou groupées ne sont pas affichées
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {prescriptions.map((prescription) => {
                    const isSelected = selectedPrescriptionIds.includes(prescription.id);
                    return (
                      <div
                        key={prescription.id}
                        onClick={() => togglePrescription(prescription.id)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-primary-300'
                        }`}
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mt-1">
                            {isSelected ? (
                              <CheckSquare className="h-5 w-5 text-primary-600" />
                            ) : (
                              <Square className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div className="ml-3 flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-semibold text-lg">
                                {prescription.medication}
                              </div>
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {prescription.matricule}
                              </code>
                            </div>
                            <div className="text-sm text-gray-700 space-y-1">
                              <div>
                                <strong>Dosage:</strong> {prescription.dosage}
                              </div>
                              <div>
                                <strong>Durée:</strong> {prescription.duration}
                              </div>
                              {prescription.instructions && (
                                <div>
                                  <strong>Instructions:</strong> {prescription.instructions}
                                </div>
                              )}
                              <div className="text-xs text-gray-500 mt-2">
                                Prescrit le {new Date(prescription.createdAt).toLocaleDateString('fr-FR')}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Bouton de création */}
          {selectedPatient && prescriptions.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={handleCreateGroup}
                disabled={loading || selectedPrescriptionIds.length === 0}
                className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-lg font-semibold"
              >
                <Package className="h-5 w-5 mr-2" />
                Créer le groupe ({selectedPrescriptionIds.length} prescription{selectedPrescriptionIds.length > 1 ? 's' : ''})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PrescriptionGroupForm;