import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { loginWithEmailAndPassword, signInWithGoogle, getUserById } from '../firebase';
import authService from '../services/authService';

const SignIn = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    
    try {
      const { user, error } = await signInWithGoogle();
      
      if (error) {
        setAuthError(error);
        setAuthLoading(false);
        return;
      }
      
      if (user) {
        console.log('Google Sign-in successful. User UID:', user.uid);
        
        // Use Firestore lookup directly
        const { user: userDoc, error: userError } = await getUserById(user.uid);
        
        if (userError) {
          console.error('Firestore lookup error:', userError);
          setAuthError(`Error: ${userError}. Please contact administrator.`);
          setAuthLoading(false);
          return;
        }
        
        if (!userDoc) {
          console.error('User document not found in Firestore for UID:', user.uid);
          setAuthError("User profile not found. Please contact administrator to create your profile.");
          setAuthLoading(false);
          return;
        }
        
        // Check if user is a student (not admin)
        if (userDoc.role === 'admin') {
          setAuthError("Admin users should use the Admin Sign In page.");
          setAuthLoading(false);
          return;
        }
        
        // User is a student, proceed
        if (onClose && typeof onClose === 'function') {
          onClose();
        }
        navigate('/home');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      setAuthError(error.message || "An error occurred during sign in with Google");
      setAuthLoading(false);
    }
  };

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
      const { user, error } = await loginWithEmailAndPassword(email, password);
      
      if (error) {
        setAuthError(error);
        setAuthLoading(false);
        return;
      }
      
      if (user) {
        console.log('Email sign-in successful. User UID:', user.uid);
        console.log('User email:', user.email);
        
        // Use Firestore lookup directly
        const { user: userDoc, error: userError } = await getUserById(user.uid);
        
        if (userError) {
          console.error('Firestore lookup error:', userError);
          console.error('Attempted to find document with UID:', user.uid);
          setAuthError(`Error: ${userError}. Please contact administrator.`);
          setAuthLoading(false);
          return;
        }
        
        if (!userDoc) {
          console.error('User document not found in Firestore for UID:', user.uid);
          console.error('Available user email:', user.email);
          setAuthError("User profile not found. Please contact administrator to create your profile.");
          setAuthLoading(false);
          return;
        }
        
        // Check if user is a student (not admin)
        if (userDoc.role === 'admin') {
          setAuthError("Admin users should use the Admin Sign In page.");
          setAuthLoading(false);
          return;
        }
        
        // User is a student, proceed
        if (onClose && typeof onClose === 'function') {
          onClose();
        }
        navigate('/home');
      }
    } catch (error) {
      console.error('Email sign-in error:', error);
      setAuthError(error.message || "An error occurred during sign in");
      setAuthLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setAuthError(null);
    // Safe check for onClose function
    if (onClose && typeof onClose === 'function') {
      onClose();
    }
  };
  
  const goToAdminLogin = () => {
    if (onClose && typeof onClose === 'function') {
      onClose();
    }
    navigate('/admin/signin');
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
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Student Sign In</h2>
          <p className="text-gray-600">Welcome back to CodeTrack Pro!</p>
        </div>
        
        <div className="space-y-4">
          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={authLoading}
            className="flex items-center justify-center w-full py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>
          
          <div className="relative flex items-center justify-center">
            <div className="border-t border-gray-300 flex-grow"></div>
            <span className="text-gray-500 text-sm px-2 bg-white">OR</span>
            <div className="border-t border-gray-300 flex-grow"></div>
          </div>
          
          {/* Email/Password Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
                autoComplete="email"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                id="password"
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
                  Processing...
                </span>
              ) : "Sign In"}
            </button>
          </form>
          
          <div className="text-center mt-4 space-y-2">
            <p className="text-sm text-gray-600">
              Don't have an account? Please contact your administrator.
            </p>
            <button 
              onClick={goToAdminLogin}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Admin? Sign in here
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SignIn;