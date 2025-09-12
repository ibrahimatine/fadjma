import React from 'react';
import { Link } from 'react-router-dom';

const PatientDashboard = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Tableau de bord du patient</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Voir mes dossiers médicaux */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
          <h2 className="text-xl font-semibold text-gray-700 mb-3">Voir mes dossiers médicaux</h2>
          <p className="text-gray-600 mb-4">Accédez à tous vos dossiers médicaux.</p>
          <Link to="/records" className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full transition-colors duration-300">
            Voir les dossiers
          </Link>
        </div>

        {/* Card 2: Vérifier l'intégrité d'un dossier */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
          <h2 className="text-xl font-semibold text-gray-700 mb-3">Vérifier l'intégrité d'un dossier</h2>
          <p className="text-gray-600 mb-4">Vérifiez l'authenticité et l'intégrité de vos dossiers.</p>
          <Link to="/verify" className="inline-block bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-full transition-colors duration-300">
            Vérifier l'intégrité
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;