// src/config/api.js

// Backend API URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
    VERIFY_TOKEN: `${API_BASE_URL}/api/auth/verify-token`,
    FORGOT_PASSWORD: `${API_BASE_URL}/api/auth/forgot-password`,
    RESET_PASSWORD: `${API_BASE_URL}/api/auth/reset-password`,
    CHANGE_PASSWORD: `${API_BASE_URL}/api/auth/change-password`,
    ME: `${API_BASE_URL}/api/auth/me`,
    VERIFY_ADMIN: `${API_BASE_URL}/api/auth/verify-admin`,
    CHECK_ADMIN: `${API_BASE_URL}/api/auth/check-admin`,
  },
  
  // Admin endpoints
  ADMIN: {
    TEST: `${API_BASE_URL}/api/auth/admin/test`,
    USERS: `${API_BASE_URL}/api/auth/admin/users`,
    SET_ADMIN: `${API_BASE_URL}/api/auth/admin/set-admin`,
    REMOVE_ADMIN: `${API_BASE_URL}/api/auth/admin/remove-admin`,
  },
  
  // User endpoints
  USERS: {
    LIST: `${API_BASE_URL}/api/users`,
    GET: (id) => `${API_BASE_URL}/api/users/${id}`,
    UPDATE: (id) => `${API_BASE_URL}/api/users/${id}`,
    DELETE: (id) => `${API_BASE_URL}/api/users/${id}`,
  },
  
  // Scraping endpoints
  SCRAPING: {
    START: `${API_BASE_URL}/api/scraping/start`,
    STATUS: `${API_BASE_URL}/api/scraping/status`,
  },
};

// Helper function to make authenticated requests
export const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }
  
  return response.json();
};