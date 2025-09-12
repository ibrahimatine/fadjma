import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/dashboard" className="text-2xl font-bold">
          FadjMa
        </Link>
        <nav className="flex items-center space-x-4">
          {user ? (
            <>
              <Link to="/dashboard" className="hover:text-blue-200">
                Dashboard
              </Link>
              <Link to="/records" className="hover:text-blue-200">
                Mes Dossiers
              </Link>
              <Link to="/verify" className="hover:text-blue-200">
                Vérification
              </Link>
              <span className="text-blue-200">
                {user.name} ({user.role})
              </span>
              <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded">
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-blue-200">
                Connexion
              </Link>
              <Link to="/register" className="hover:text-blue-200">
                Inscription
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;