import React from 'react';
import { useRecords } from '../../hooks/useRecords';
import RecordCard from './RecordCard';
import LoadingSpinner from '../common/LoadingSpinner';
import Alert from '../common/Alert';

const RecordList = () => {
  const { records, isLoading, isError, error } = useRecords();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return <Alert type="error" message={error?.message || "Erreur lors du chargement des dossiers."} />;
  }

  if (!records || records.length === 0) {
    return <Alert type="info" message="Aucun dossier médical trouvé." />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {records.map((record) => (
        <RecordCard key={record.id} record={record} />
      ))}
    </div>
  );
};

export default RecordList;