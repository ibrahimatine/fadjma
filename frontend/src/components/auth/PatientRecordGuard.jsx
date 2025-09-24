// src/components/auth/PatientRecordGuard.jsx
import { useState, useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { medicalRecordService } from '../../services/medicalRecordService';
import LoadingSpinner from '../common/LoadingSpinner';

const PatientRecordGuard = ({ children }) => {
  const { user } = useAuth();
  const { id: recordId } = useParams();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user?.id || !recordId) {
        setLoading(false);
        setHasAccess(false);
        return;
      }

      try {
        setLoading(true);

        // Try to get the record - backend will handle access control
        const recordResult = await medicalRecordService.getRecordById(recordId);

        if (recordResult.status === 200 || recordResult.statusText === 'OK') {
          // If we can get the record, we have access
          setHasAccess(true);
        } else {
          setHasAccess(false);
        }
      } catch (error) {
        console.error('Access check error:', error);

        if (error.status === 403) {
          // Backend denied access - user doesn't own this record
          setHasAccess(false);
        } else if (error.status === 404) {
          // Record doesn't exist
          setHasAccess(false);
          setError('Dossier médical introuvable');
        } else {
          // Other error
          setHasAccess(false);
          setError('Erreur lors de la vérification des permissions');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [user?.id, recordId]);

  if (loading) {
    return <LoadingSpinner text="Vérification des permissions..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Erreur de permission
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PatientRecordGuard;