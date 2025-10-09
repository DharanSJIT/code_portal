// src/components/AdminRoute.jsx
import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getCurrentUser, getUserById } from '../firebase';
import { toast } from 'react-toastify';

const AdminRoute = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // Check localStorage first for quicker response
        const storedAdmin = localStorage.getItem('adminUser');
        if (storedAdmin) {
          const adminData = JSON.parse(storedAdmin);
          
          if (adminData && adminData.role === 'admin') {
            setIsAdmin(true);
            setLoading(false);
            return;
          }
        }
        
        // If not in localStorage, check with Firebase
        const user = getCurrentUser();
        
        if (!user) {
          // No user is signed in
          setIsAdmin(false);
          setLoading(false);
          toast.error("Please sign in to access the admin dashboard");
          return;
        }
        
        // Get the user document from Firestore
        const { user: userDoc, error } = await getUserById(user.uid);
        
        if (error) {
          toast.error("Error verifying admin access");
          setIsAdmin(false);
          setLoading(false);
          return;
        }
        
        if (!userDoc) {
          toast.error("User profile not found");
          setIsAdmin(false);
          setLoading(false);
          return;
        }
        
        // Check if the user has admin role
        const hasAdminRole = userDoc.role === 'admin' || userDoc.isAdmin === true;
        
        if (hasAdminRole) {
          // Store the admin user in localStorage for future checks
          const adminUser = {
            uid: user.uid,
            email: user.email,
            name: userDoc.name || userDoc.displayName || user.displayName,
            role: 'admin'
          };
          
          localStorage.setItem('adminUser', JSON.stringify(adminUser));
          localStorage.setItem('isAdmin', 'true');
          
          setIsAdmin(true);
        } else {
          toast.error("Access denied: Admin privileges required");
          setIsAdmin(false);
        }
      } catch (error) {
        toast.error("Authentication error");
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAdminStatus();
  }, []);
  
  // Show loading spinner while checking admin status
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }
  
  // If user is admin, render the protected routes via Outlet
  // If not admin, redirect to admin signin page
  if (!isAdmin) {
    return <Navigate to="/admin/signin" replace />;
  }
  
  return <Outlet />;
};

export default AdminRoute;