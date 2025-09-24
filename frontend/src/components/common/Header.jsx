import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { Home, FileText, LogOut, User, Shield } from 'lucide-react';
import NotificationBadge from './NotificationBadge';
import NotificationCenter from '../notifications/NotificationCenter';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const _isDoctor = user?.role === 'doctor';
  const _isPatient = user?.role === 'patient';
  const [showNotifications, setShowNotifications] = useState(false);

  // Only fetch notifications for patients
  const { unreadCount } = useNotifications(user?.id, _isPatient);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">FadjMa</span>
            </Link>

            <nav className="ml-10 flex space-x-4">
              <Link
                to="/dashboard"
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
              >
                <Home className="h-4 w-4 mr-1" />
                Dashboard
              </Link>

              {_isDoctor &&
                <Link
                  to="/records"
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Dossiers
                </Link>
              }
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notifications for patients */}
            {_isPatient && (
              <NotificationBadge
                count={unreadCount}
                onClick={() => setShowNotifications(true)}
                size="medium"
              />
            )}

            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-700">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-full uppercase">
                {user?.role}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* Notification Center Modal */}
      {_isPatient && (
        <NotificationCenter
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
          userId={user?.id}
        />
      )}
    </header>
  );
};

export default Header;