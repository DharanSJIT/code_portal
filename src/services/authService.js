// src/services/authService.js (FRONTEND - React/Vite project)
import { auth } from '../firebase';
import { API_ENDPOINTS, fetchWithAuth } from '../config/api';

class AuthService {
  // Login and verify with backend
  async loginAndVerifyAdmin(user) {
    try {
      const idToken = await user.getIdToken();
      
      // Verify with backend and check admin status
      const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Backend verification failed');
      }
      
      const data = await response.json();
      
      // Store token and admin status
      localStorage.setItem('authToken', idToken);
      localStorage.setItem('isAdmin', data.user.isAdmin);
      localStorage.setItem('userEmail', data.user.email);
      localStorage.setItem('userId', data.user.uid);
      
      return data;
    } catch (error) {
      console.error('Backend verification error:', error);
      throw error;
    }
  }

  // Check if user is admin
  async checkAdminStatus() {
    try {
      const data = await fetchWithAuth(API_ENDPOINTS.AUTH.CHECK_ADMIN);
      
      // Update local storage
      localStorage.setItem('isAdmin', data.isAdmin);
      
      return data.isAdmin;
    } catch (error) {
      console.error('Check admin error:', error);
      return false;
    }
  }

  // Verify admin access (throws error if not admin)
  async verifyAdmin() {
    try {
      const data = await fetchWithAuth(API_ENDPOINTS.AUTH.VERIFY_ADMIN);
      return data;
    } catch (error) {
      console.error('Verify admin error:', error);
      throw error;
    }
  }

  // Get current user info from backend
  async getCurrentUser() {
    try {
      const data = await fetchWithAuth(API_ENDPOINTS.AUTH.ME);
      return data.user;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }

  // Logout and notify backend
  async logoutWithBackend() {
    try {
      const token = localStorage.getItem('authToken');
      
      if (token) {
        // Notify backend
        await fetch(API_ENDPOINTS.AUTH.LOGOUT, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      
      // Clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userId');
      
      return { success: true };
    } catch (error) {
      console.error('Backend logout error:', error);
      // Continue with logout even if backend fails
      localStorage.clear();
      return { success: true };
    }
  }

  // Get current auth token
  async getToken() {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      localStorage.setItem('authToken', token);
      return token;
    }
    return localStorage.getItem('authToken');
  }

  // Refresh token
  async refreshToken() {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken(true); // Force refresh
      localStorage.setItem('authToken', token);
      return token;
    }
    return null;
  }

  // Check if user is logged in
  isAuthenticated() {
    return !!auth.currentUser && !!localStorage.getItem('authToken');
  }

  // Check if user is admin (from local storage)
  isAdmin() {
    return localStorage.getItem('isAdmin') === 'true';
  }

  // Get all users (admin only)
  async getAllUsers() {
    try {
      const data = await fetchWithAuth(API_ENDPOINTS.ADMIN.USERS);
      return data.users;
    } catch (error) {
      console.error('Get all users error:', error);
      throw error;
    }
  }

  // Set user as admin (admin only)
  async setUserAsAdmin(email) {
    try {
      const data = await fetchWithAuth(API_ENDPOINTS.ADMIN.SET_ADMIN, {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      return data;
    } catch (error) {
      console.error('Set admin error:', error);
      throw error;
    }
  }

  // Remove admin privileges (admin only)
  async removeAdminPrivileges(email) {
    try {
      const data = await fetchWithAuth(API_ENDPOINTS.ADMIN.REMOVE_ADMIN, {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      return data;
    } catch (error) {
      console.error('Remove admin error:', error);
      throw error;
    }
  }
}

export default new AuthService();