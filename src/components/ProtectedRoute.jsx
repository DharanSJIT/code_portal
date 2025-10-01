// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { authService } from '../firebase';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const [checking, setChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [requireAdmin]);

  const checkAuth = async () => {
    try {
      // Check if user is authenticated
      if (!authService.isAuthenticated()) {
        setIsAuthorized(false);
        setChecking(false);
        return;
      }

      // If admin is required, verify with backend
      if (requireAdmin) {
        try {
          const isAdmin = await authService.checkAdminStatus();
          setIsAuthorized(isAdmin);
        } catch (error) {
          console.error('Admin verification failed:', error);
          setIsAuthorized(false);
        }
      } else {
        setIsAuthorized(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthorized(false);
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/login" replace />;
  }

  return children;
}