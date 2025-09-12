import React from 'react';
import { useQuery } from 'react-query';
import { recordService } from '../../services/recordService';
import LoadingSpinner from '../common/LoadingSpinner';
import Alert from '../common/Alert';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import IntegrityButton from '../verification/IntegrityButton';

const RecordDetail = ({ recordId }) => {
  const { data: record, isLoading, isError, error } = useQuery(
    ['record', recordId],
    () => recordService.getRecordById(recordId)
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return <Alert type="error" message={error?.message || "Erreur lors du chargement du dossier."} />;
  }

  if (!record) {
    return <Alert type="info" message="Dossier médical introuvable." />;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-blue-700 mb-4">{record.title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-gray-700 mb-1"><strong>Patient:</strong> {record.patientName}</p>
          <p className="text-gray-700 mb-1"><strong>Médecin:</strong> {record.doctorName}</p>
          <p className="text-gray-700 mb-1"><strong>Date:</strong> {format(new Date(record.date), 'dd MMMM yyyy HH:mm', { locale: fr })}</p>
          <p className="text-gray-700 mb-1"><strong>Type:</strong> {record.type}</p>
        </div>
        <div>
          <p className="text-gray-700 mb-1"><strong>Hôpital:</strong> {record.hospital}</p>
          <p className="text-gray-700 mb-1"><strong>Département:</strong> {record.department}</p>
          <p className="text-gray-700 mb-1"><strong>Numéro de référence:</strong> {record.referenceNumber}</p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Description</h3>
        <p className="text-gray-600 leading-relaxed">{record.description}</p>
      </div>

      {record.fileUrl && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Fichier joint</h3>
          <a href={record.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
            Voir le fichier
          </a>
        </div>
      )}

      <div className="flex items-center justify-between">
        <IntegrityButton record={record} />
        {/* Add other actions like edit/delete if applicable */}
      </div>
    </div>
  );
};

export default RecordDetail;