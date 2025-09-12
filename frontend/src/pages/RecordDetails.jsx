import React from 'react';
import { useParams } from 'react-router-dom';
import RecordDetail from '../components/records/RecordDetail';
import DashboardLayout from '../components/dashboard/DashboardLayout';

const RecordDetailsPage = () => {
  const { id } = useParams();

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Détails du Dossier Médical</h1>
        <RecordDetail recordId={id} />
      </div>
    </DashboardLayout>
  );
};

export default RecordDetailsPage;