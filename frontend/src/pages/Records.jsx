import React from 'react';
import { useAuth } from '../hooks/useAuth';
import PatientRecordGroups from '../components/doctor/PatientRecordGroups';
import PatientMedicalRecordsView from '../components/patient/PatientMedicalRecordsView';

const Records = () => {
  const { user } = useAuth();

  // Pour les docteurs, afficher la vue groupée par patient
  if (user?.role === 'doctor') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PatientRecordGroups />
        </div>
      </div>
    );
  }

  // Pour les patients, afficher leur vue personnelle
  if (user?.role === 'patient') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PatientMedicalRecordsView />
        </div>
      </div>
    );
  }

  // Fallback pour les autres rôles
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Accès non autorisé</h1>
          <p className="text-gray-600 mt-2">Vous n'avez pas accès à cette page.</p>
        </div>
      </div>
    </div>
  );
};

export default Records;