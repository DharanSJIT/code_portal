// src/components/AdminSignIn.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { loginWithEmailAndPassword } from '../firebase';
import authService from '../services/authService';

const AdminSignIn = ({ isOpen = true, onClose = () => {} }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    
    if (!email || !password) {
      setAuthError("Email and password are required");
      setAuthLoading(false);
      return;
    }
    
    try {
      // Step 1: Login with Firebase
      const { user, error } = await loginWithEmailAndPassword(email, password);
      
      if (error) {
        setAuthError(error);
        setAuthLoading(false);
        return;
      }
      
      if (!user) {
        setAuthError("Invalid credentials");
        setAuthLoading(false);
        return;
      }
      
      // Step 2: Verify with backend and check admin status
      try {
        const backendData = await authService.loginAndVerifyAdmin(user);
        
        // Step 3: Check if user is admin
        if (!backendData.user.isAdmin) {
          setAuthError("Access denied: Admin privileges required");
          setAuthLoading(false);
          
          // Logout the user since they're not admin
          await authService.logoutWithBackend();
          return;
        }
        
        // Step 4: Store admin session (additional to what authService already stores)
        localStorage.setItem('adminUser', JSON.stringify({
          uid: backendData.user.uid,
          email: backendData.user.email,
          name: backendData.user.displayName || email,
          role: 'admin'
        }));
        
        console.log('Admin login successful:', backendData);
        
        // Step 5: Close modal and navigate to admin dashboard
        handleClose();
        navigate('/admin/dashboard');
        
      } catch (backendError) {
        console.error('Backend verification failed:', backendError);
        setAuthError(`Error verifying admin access: ${backendError.message}`);
        setAuthLoading(false);
      }
      
    } catch (error) {
      console.error('Login error:', error);
      setAuthError(error.message || "An error occurred during sign in");
      setAuthLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setAuthError(null);
    onClose();
  };
  
  const goToStudentLogin = () => {
    navigate('/signin');
  };

  // If the modal is not open, don't render anything
  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative"
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        transition={{
          type: 'spring',
          damping: 25,
          stiffness: 300
        }}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Admin Sign In</h2>
          <p className="text-gray-600">Access the admin dashboard</p>
        </div>
        
        <div className="space-y-4">
          {/* Admin Icon */}
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-blue-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          
          {/* Email/Password Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter admin email"
                autoComplete="email"
              />
            </div>
            
            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>
            
            {authError && (
              <div className="p-3 text-red-700 text-sm bg-red-50 border border-red-200 rounded-lg">
                {authError}
              </div>
            )}
            
            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg shadow-md transition-colors disabled:opacity-70 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {authLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </span>
              ) : "Sign In as Admin"}
            </button>
          </form>
          
          <div className="text-center mt-4">
            <button 
              onClick={goToStudentLogin}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Go to Student Login
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdminSignIn;