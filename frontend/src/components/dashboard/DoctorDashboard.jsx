import React from 'react';
import { Link } from 'react-router-dom';

const DoctorDashboard = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Tableau de bord du médecin</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Gérer les dossiers médicaux */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
          <h2 className="text-xl font-semibold text-gray-700 mb-3">Gérer les dossiers médicaux</h2>
          <p className="text-gray-600 mb-4">Accédez et gérez les dossiers médicaux de vos patients.</p>
          <Link to="/records" className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full transition-colors duration-300">
            Voir les dossiers
          </Link>
        </div>

        {/* Card 2: Ajouter un nouveau dossier */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
          <h2 className="text-xl font-semibold text-gray-700 mb-3">Ajouter un nouveau dossier</h2>
          <p className="text-gray-600 mb-4">Créez un nouveau dossier médical pour un patient.</p>
          <Link to="/records/new" className="inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full transition-colors duration-300">
            Ajouter un dossier
          </Link>
        </div>

        {/* Card 3: Vérifier l'intégrité */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
          <h2 className="text-xl font-semibold text-gray-700 mb-3">Vérifier l'intégrité</h2>
          <p className="text-gray-600 mb-4">Vérifiez l'intégrité des dossiers médicaux via Hedera.</p>
          <Link to="/verify" className="inline-block bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-full transition-colors duration-300">
            Vérifier
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;