import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { recordService } from '../services/recordService';
import { ArrowLeft, Edit, Trash2, Shield, Calendar, User, Pill } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import IntegrityButton from '../components/verification/IntegrityButton';
import MatriculeDisplay from '../components/prescription/MatriculeDisplay';
import { useAuth } from '../hooks/useAuth';

const RecordDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [record, setRecord] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);

  useEffect(() => {
    fetchRecord();
  }, [id]);

  const fetchRecord = async () => {
    try {
      console.log('Fetched record:');
      const data = await recordService.getById(id);
      setRecord(data);

      // Si c'est une prescription ou s'il y a des prescriptions liées, les charger
      if (data && (data.type === 'prescription' || data.prescription)) {
        await fetchPrescriptions();
      }
    } catch (error) {
      console.error('Error fetching record:', error);
      navigate('/records');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrescriptions = async () => {
    setLoadingPrescriptions(true);
    try {
      const data = await recordService.getPrescriptionsByRecordId(id);
      setPrescriptions(data.prescriptions || []);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      // Ne pas faire échouer si on ne peut pas récupérer les prescriptions
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Chargement du dossier..." />;
  }

  if (!record) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/records')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Retour aux dossiers
        </button>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-primary-600 text-white p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold">{record.title}</h1>
                <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-sm">
                  {record.type}
                </span>
              </div>
              <IntegrityButton recordId={record.id} />
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="flex items-center text-gray-600">
                <Calendar className="h-5 w-5 mr-2" />
                <span>Créé le {new Date(record.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <User className="h-5 w-5 mr-2" />
                <span>Dr. {record.doctor?.lastName}</span>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700">{record.description}</p>
              </div>

              {record.diagnosis && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Diagnostic</h3>
                  <p className="text-gray-700">{record.diagnosis}</p>
                </div>
              )}

              {record.prescription && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Prescription</h3>
                  <div className="bg-gray-50 p-4 rounded-lg text-sm mb-4">
                    {typeof record.prescription === 'object' ? (
                      <div className="space-y-2">
                        {record.prescription.medications?.map((med, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                            <div>
                              <div className="font-medium text-gray-900">{med.name}</div>
                              <div className="text-gray-600 text-xs">{med.dosage} - {med.frequency}</div>
                            </div>
                          </div>
                        ))}
                        {record.prescription.duration && (
                          <div className="text-gray-600 text-sm mt-2">
                            <strong>Durée:</strong> {record.prescription.duration}
                          </div>
                        )}
                      </div>
                    ) : (
                      <pre>{JSON.stringify(record.prescription, null, 2)}</pre>
                    )}
                  </div>
                </div>
              )}

              {/* Section des prescriptions avec matricules */}
              {(prescriptions.length > 0 || loadingPrescriptions) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Pill className="h-5 w-5 text-blue-600" />
                    Ordonnances délivrables
                  </h3>

                  {loadingPrescriptions ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">Chargement des ordonnances...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {prescriptions.map((prescription) => (
                        <div key={prescription.id} className="border border-gray-200 rounded-lg p-4">
                          {/* Informations de la prescription */}
                          <div className="mb-4">
                            <h4 className="font-semibold text-gray-900 mb-2">{prescription.medication}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                              <div><strong>Dosage:</strong> {prescription.dosage}</div>
                              <div><strong>Quantité:</strong> {prescription.quantity}</div>
                              {prescription.instructions && (
                                <div className="md:col-span-2">
                                  <strong>Instructions:</strong> {prescription.instructions}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Affichage du matricule */}
                          <MatriculeDisplay
                            matricule={prescription.matricule}
                            userRole={user?.role}
                            prescriptionStatus={prescription.deliveryStatus}
                            size="normal"
                            showQRCode={true}
                            showInstructions={true}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {record.hash && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Informations Blockchain</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Hash:</span>
                      <code className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">
                        {record.hash.substring(0, 20)}...
                      </code>
                    </div>
                    {record.hederaTransactionId && (
                      <div>
                        <span className="font-medium">Hedera ID:</span>
                        <code className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">
                          {record.hederaTransactionId}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordDetails;