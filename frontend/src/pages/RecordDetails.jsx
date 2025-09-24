import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { recordService } from '../services/recordService';
import { ArrowLeft, Edit, Trash2, Shield, Calendar, User } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import IntegrityButton from '../components/verification/IntegrityButton';

const RecordDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecord();
  }, [id]);

  const fetchRecord = async () => {
    try {
      console.log('Fetched record:');
      const data = await recordService.getById(id);
      setRecord(data);
    } catch (error) {
      console.error('Error fetching record:', error);
      navigate('/records');
    } finally {
      setLoading(false);
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
                  <pre className="bg-gray-50 p-4 rounded-lg text-sm">
                    {JSON.stringify(record.prescription, null, 2)}
                  </pre>
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