import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import Alert from '../common/Alert';
import PrescriptionList from '../records/PrescriptionList'; // Will create this component next

const PharmacyDashboard = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/pharmacy');
        setPrescriptions(response.data);
      } catch (err) {
        setError('Failed to fetch prescriptions.');
        console.error('Error fetching pharmacy prescriptions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, []);

  const handleDeliveryConfirmation = async (prescriptionId) => {
    try {
      await api.put(`/api/pharmacy/${prescriptionId}/confirm-delivery`);
      setPrescriptions(prevPrescriptions =>
        prevPrescriptions.map(p =>
          p.id === prescriptionId ? { ...p, deliveryStatus: 'delivered' } : p
        )
      );
      setError(null); // Clear any previous errors
    } catch (err) {
      setError('Failed to confirm delivery.');
      console.error('Error confirming delivery:', err);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="pharmacy-dashboard p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Pharmacy Dashboard</h1>
      {error && <Alert type="error" message={error} />}
      {prescriptions.length === 0 ? (
        <p className="text-gray-600">No prescriptions found for your pharmacy.</p>
      ) : (
        <PrescriptionList
          prescriptions={prescriptions}
          onConfirmDelivery={handleDeliveryConfirmation}
        />
      )}
    </div>
  );
};

export default PharmacyDashboard;