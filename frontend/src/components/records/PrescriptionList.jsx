import React from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';

const PrescriptionList = ({ prescriptions, onConfirmDelivery }) => {
  if (!prescriptions || prescriptions.length === 0) {
    return <p className="text-gray-600">No prescriptions to display.</p>;
  }

  return (
    <div className="prescription-list grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {prescriptions.map((prescription) => (
        <div key={prescription.id} className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">{prescription.medication}</h3>
          <p className="text-gray-600 mb-1"><strong>Dosage:</strong> {prescription.dosage}</p>
          <p className="text-gray-600 mb-1"><strong>Quantity:</strong> {prescription.quantity}</p>
          <p className="text-gray-600 mb-1"><strong>Instructions:</strong> {prescription.instructions || 'N/A'}</p>
          <p className="text-gray-600 mb-1"><strong>Patient:</strong> {prescription.patient.firstName} {prescription.patient.lastName}</p>
          <p className="text-gray-600 mb-1"><strong>Doctor:</strong> {prescription.doctor.firstName} {prescription.doctor.lastName}</p>
          <p className="text-gray-600 mb-1"><strong>Issue Date:</strong> {format(new Date(prescription.issueDate), 'PPP')}</p>
          <p className="text-gray-600 mb-4">
            <strong>Delivery Status:</strong>{' '}
            <span
              className={`font-medium ${
                prescription.deliveryStatus === 'delivered' ? 'text-green-600' :
                prescription.deliveryStatus === 'cancelled' ? 'text-red-600' :
                'text-yellow-600'
              }`}
            >
              {prescription.deliveryStatus.charAt(0).toUpperCase() + prescription.deliveryStatus.slice(1)}
            </span>
          </p>

          {prescription.deliveryStatus === 'pending' && (
            <button
              onClick={() => onConfirmDelivery(prescription.id)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Confirm Delivery
            </button>
          )}
          {prescription.deliveryConfirmationHash && (
            <p className="text-sm text-gray-500 mt-2 break-all">
              Hedera Tx Hash: {prescription.deliveryConfirmationHash}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

PrescriptionList.propTypes = {
  prescriptions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      medication: PropTypes.string.isRequired,
      dosage: PropTypes.string.isRequired,
      quantity: PropTypes.number.isRequired,
      instructions: PropTypes.string,
      issueDate: PropTypes.string.isRequired,
      deliveryStatus: PropTypes.string.isRequired,
      deliveryConfirmationHash: PropTypes.string,
      patient: PropTypes.shape({
        firstName: PropTypes.string.isRequired,
        lastName: PropTypes.string.isRequired,
      }).isRequired,
      doctor: PropTypes.shape({
        firstName: PropTypes.string.isRequired,
        lastName: PropTypes.string.isRequired,
      }).isRequired,
    })
  ).isRequired,
  onConfirmDelivery: PropTypes.func.isRequired,
};

export default PrescriptionList;