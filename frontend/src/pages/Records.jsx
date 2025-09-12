import React from 'react';
import RecordList from '../components/records/RecordList';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

const Records = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Mes Dossiers Médicaux</h1>
        {user?.role === 'doctor' && (
          <div className="mb-6">
            <Link to="/records/new" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full transition-colors duration-300">
              Ajouter un nouveau dossier
            </Link>
          </div>
        )}
        <RecordList />
      </div>
    </DashboardLayout>
  );
};

export default Records;