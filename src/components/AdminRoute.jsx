// src/components/AdminRoute.jsx
import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { getCurrentUser, getUserById } from '../firebase';
import { toast } from 'react-toastify';

const AdminRoute = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
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
          
          // Show toast notification
          toast.error("Please sign in to access the admin dashboard");
          return;
        }
        
        // Get the user document from Firestore
        const { user: userDoc, error } = await getUserById(user.uid);
        
        if (error) {
          console.error("Error fetching user data:", error);
          toast.error("Error verifying admin access");
          setIsAdmin(false);
          setLoading(false);
          return;
        }
        
        // Check if the user has admin role
        if (userDoc && userDoc.role === 'admin') {
          // Store the admin user in localStorage for future checks
          localStorage.setItem('adminUser', JSON.stringify({
            uid: user.uid,
            email: user.email,
            name: userDoc.name || user.displayName,
            role: 'admin'
          }));
          
          setIsAdmin(true);
        } else {
          toast.error("Access denied: Admin privileges required");
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        toast.error("Authentication error");
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAdminStatus();
  }, [navigate]);
  
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
  return isAdmin ? <Outlet /> : <Navigate to="/admin/signin" replace />;
};

export default AdminRoute;
