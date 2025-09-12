import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white p-4 mt-8">
      <div className="container mx-auto text-center text-sm">
        <p>&copy; {new Date().getFullYear()} FadjMa. Tous droits réservés.</p>
        <div className="flex justify-center space-x-4 mt-2">
          <a href="#" className="hover:text-blue-400">Politique de Confidentialité</a>
          <a href="#" className="hover:text-blue-400">Conditions d'Utilisation</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;