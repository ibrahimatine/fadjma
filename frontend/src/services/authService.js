import api from './api';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data.user;
  },

  logout: () => {
    // In a real application, you might want to invalidate the token on the server-side as well.
    // For now, just removing it from local storage is sufficient for client-side logout.
    localStorage.removeItem('token');
  },
};