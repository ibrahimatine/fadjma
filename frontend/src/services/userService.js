import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class UserService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api`,
      timeout: 10000,
    });

    // Add auth token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Search users (patients, doctors, etc.)
  async searchUsers(params = {}) {
    try {
      const response = await this.api.get('/users/search', { params });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error searching users:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error searching users',
        error: error
      };
    }
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      const response = await this.api.get(`/users/${userId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error getting user:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error getting user',
        error: error
      };
    }
  }

  // Get all users (admin only)
  async getAllUsers(params = {}) {
    try {
      const response = await this.api.get('/users', { params });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error getting users:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error getting users',
        error: error
      };
    }
  }

  // Update user profile
  async updateProfile(userId, userData) {
    try {
      const response = await this.api.put(`/users/${userId}`, userData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error updating profile:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error updating profile',
        error: error
      };
    }
  }
}

export const userService = new UserService();