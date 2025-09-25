import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import websocketService from '../services/websocketService';
import toast from 'react-hot-toast';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authService.getCurrentUser()
        .then((userData) => {
          setUser(userData);
          // Connect to WebSocket when user is authenticated
          websocketService.connect(token);
        })
        .catch(() => {
          localStorage.removeItem('token');
          websocketService.disconnect();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      setUser(response.user);
      localStorage.setItem('token', response.token);

      // Connect to WebSocket after successful login
      websocketService.connect(response.token);

      toast.success('Connexion réussie !');
      return response;
    } catch (error) {
      console.error('❌ Login error:', error);
      let errorMessage = 'Erreur lors de la connexion';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      console.log('📝 Sending registration data:', userData);
      const response = await authService.register(userData);
      setUser(response.user);
      localStorage.setItem('token', response.token);

      // Connect to WebSocket after successful registration
      websocketService.connect(response.token);

      toast.success('Inscription réussie !');
      return response;
    } catch (error) {
      console.error('❌ Registration error:', error);

      // Better error handling
      let errorMessage = 'Erreur lors de l\'inscription';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        // Handle validation errors
        const validationErrors = error.response.data.errors;
        errorMessage = validationErrors.map(err => err.msg || err.message).join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');

    // Disconnect WebSocket on logout
    websocketService.disconnect();

    toast.success('Déconnexion réussie');
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}