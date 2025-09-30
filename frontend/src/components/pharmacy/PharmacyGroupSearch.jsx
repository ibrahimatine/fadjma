import React, { useState } from 'react';
import { Search, Package, User, Calendar, Pill, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { prescriptionGroupService } from '../../services/prescriptionGroupService';
import toast from 'react-hot-toast';

const PharmacyGroupSearch = () => {
  const [searchMatricule, setSearchMatricule] = useState('');
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deliverySuccess, setDeliverySuccess] = useState(false);

  const handleSearch = async () => {
    if (!searchMatricule.trim()) {
      toast.error('Veuillez entrer un matricule');
      return;
    }

    try {
      setLoading(true);
      setDeliverySuccess(false);
      const result = await prescriptionGroupService.searchGroupForPharmacy(searchMatricule.trim());
      setGroup(result.prescriptionGroup);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Groupe non trouvé');
      setGroup(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDeliverGroup = async () => {
    if (!group) return;

    if (!window.confirm(`Confirmer la délivrance de ${group.items.length} prescription(s) ?`)) {
      return;
    }

    try {
      setLoading(true);
      const result = await prescriptionGroupService.deliverPrescriptionGroup(
        group.groupMatricule,
        {
          deliveryDate: new Date().toISOString(),
          notes: 'Groupe délivré en totalité'
        }
      );

      toast.success('Groupe délivré avec succès !');
      setDeliverySuccess(true);

      // Recharger les données du groupe
      setTimeout(() => {
        handleSearch();
      }, 1000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la délivrance');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badge = prescriptionGroupService.getStatusBadge(status);
    return (
      <span className={`px-3 py-1 text-sm rounded-full bg-${badge.color}-100 text-${badge.color}-800`}>
        {badge.text}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Recherche de Groupe de Prescriptions</h1>
        <p className="text-gray-600">
          Recherchez un groupe de prescriptions par son matricule pour délivrer toutes les prescriptions en une seule fois
        </p>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Matricule du groupe
            </label>
            <input
              type="text"
              value={searchMatricule}
              onChange={(e) => setSearchMatricule(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="PGR-20250930-XXXX"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg font-mono"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition disabled:opacity-50 flex items-center"
            >
              <Search className="h-5 w-5 mr-2" />
              Rechercher
            </button>
          </div>
        </div>
      </div>

      {/* Message de succès */}
      {deliverySuccess && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-center">
            <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-green-900">
                Groupe délivré avec succès !
              </h3>
              <p className="text-sm text-green-700 mt-1">
                Toutes les prescriptions ont été marquées comme délivrées et enregistrées sur la blockchain Hedera.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Résultat de la recherche */}
      {group && (
        <div className="space-y-6">
          {/* Informations du groupe */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Groupe {prescriptionGroupService.formatMatricule(group.groupMatricule)}
                </h2>
                <div className="flex items-center gap-3">
                  {getStatusBadge(group.status)}
                  <span className="text-sm text-gray-600">
                    {group.items?.length} prescription(s)
                  </span>
                </div>
              </div>
              {group.status === 'pending' && (
                <button
                  onClick={handleDeliverGroup}
                  disabled={loading}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center font-semibold"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Délivrer le groupe complet
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Patient */}
              <div className="flex items-start">
                <User className="h-5 w-5 text-gray-400 mr-3 mt-1" />
                <div>
                  <div className="text-sm text-gray-600">Patient</div>
                  <div className="font-semibold">
                    {group.patient?.firstName} {group.patient?.lastName}
                  </div>
                  <div className="text-sm text-gray-500">{group.patient?.matricule}</div>
                  {group.patient?.phoneNumber && (
                    <div className="text-sm text-gray-500">{group.patient.phoneNumber}</div>
                  )}
                </div>
              </div>

              {/* Médecin */}
              <div className="flex items-start">
                <User className="h-5 w-5 text-gray-400 mr-3 mt-1" />
                <div>
                  <div className="text-sm text-gray-600">Médecin prescripteur</div>
                  <div className="font-semibold">
                    Dr. {group.doctor?.firstName} {group.doctor?.lastName}
                  </div>
                  {group.doctor?.specialization && (
                    <div className="text-sm text-gray-500">{group.doctor.specialization}</div>
                  )}
                </div>
              </div>

              {/* Date de création */}
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-gray-400 mr-3 mt-1" />
                <div>
                  <div className="text-sm text-gray-600">Date de création</div>
                  <div className="font-semibold">
                    {new Date(group.createdAt).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>

              {/* Date de délivrance */}
              {group.deliveredAt && (
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1" />
                  <div>
                    <div className="text-sm text-gray-600">Date de délivrance</div>
                    <div className="font-semibold">
                      {new Date(group.deliveredAt).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Transaction Hedera */}
            {group.hederaTransactionId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-blue-900 mb-1">
                      Enregistré sur la blockchain Hedera
                    </div>
                    <code className="text-xs text-blue-700 font-mono">
                      {group.hederaTransactionId}
                    </code>
                  </div>
                  <a
                    href={`https://hashscan.io/testnet/transaction/${group.hederaTransactionId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                  >
                    Voir sur Hashscan
                    <ExternalLink className="h-4 w-4 ml-1" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Liste des prescriptions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Package className="h-6 w-6 mr-2 text-primary-600" />
              Prescriptions du groupe
            </h3>

            <div className="space-y-4">
              {group.items?.map((item, index) => (
                <div
                  key={item.id}
                  className="border-2 border-gray-200 rounded-lg p-5 hover:border-primary-300 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm mr-3">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-bold text-lg">{item.prescription.medication}</div>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {item.prescription.matricule}
                          </code>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-11">
                        <div>
                          <div className="text-sm text-gray-600">Dosage</div>
                          <div className="font-medium">{item.prescription.dosage}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Durée</div>
                          <div className="font-medium">{item.prescription.duration}</div>
                        </div>
                        {item.prescription.instructions && (
                          <div className="md:col-span-2">
                            <div className="text-sm text-gray-600">Instructions</div>
                            <div className="font-medium">{item.prescription.instructions}</div>
                          </div>
                        )}
                        <div className="md:col-span-2">
                          <div className="text-sm text-gray-600">Date de prescription</div>
                          <div className="font-medium">
                            {new Date(item.prescription.createdAt).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      {item.prescription.deliveryStatus === 'delivered' ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="h-5 w-5 mr-1" />
                          <span className="text-sm font-medium">Délivré</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-yellow-600">
                          <AlertCircle className="h-5 w-5 mr-1" />
                          <span className="text-sm font-medium">En attente</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* État vide */}
      {!group && !loading && searchMatricule && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun groupe trouvé</h3>
          <p className="text-gray-600">
            Vérifiez le matricule saisi et réessayez
          </p>
        </div>
      )}

      {!group && !searchMatricule && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Recherchez un groupe de prescriptions
          </h3>
          <p className="text-gray-600">
            Entrez le matricule du groupe (format: PGR-20250930-XXXX) pour afficher ses détails
          </p>
        </div>
      )}
    </div>
  );
};

export default PharmacyGroupSearch;