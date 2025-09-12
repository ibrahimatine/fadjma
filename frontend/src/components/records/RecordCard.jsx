import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const RecordCard = ({ record }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300 border border-gray-200">
      <h3 className="text-xl font-semibold text-blue-700 mb-2">{record.title}</h3>
      <p className="text-gray-600 text-sm mb-1">
        <strong>Patient:</strong> {record.patientName}
      </p>
      <p className="text-gray-600 text-sm mb-1">
        <strong>Médecin:</strong> {record.doctorName}
      </p>
      <p className="text-gray-600 text-sm mb-4">
        <strong>Date:</strong> {format(new Date(record.date), 'dd MMMM yyyy', { locale: fr })}
      </p>
      <Link to={`/records/${record.id}`} className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full transition-colors duration-300 text-sm">
        Voir les détails
      </Link>
    </div>
  );
};

export default RecordCard;