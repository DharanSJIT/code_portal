// src/components/AdminSignIn.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { loginWithEmailAndPassword, getUserById } from '../firebase';
import authService from '../services/authService';
import { toast } from 'react-toastify';

const AdminSignIn = ({ isOpen = true, onClose = () => {} }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [isFocused, setIsFocused] = useState({ email: false, password: false });

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
      // Step 1: Login with Firebase Authentication
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
      
      // Step 2: Get user profile from Firestore
      const { user: userDoc, error: userError } = await getUserById(user.uid);
      if (userError) {
        setAuthError(`Error fetching user profile: ${userError}`);
        setAuthLoading(false);
        return;
      }
      if (!userDoc) {
        setAuthError("User profile not found. Please contact administrator.");
        setAuthLoading(false);
        return;
      }
      
      // Step 3: Check if user is admin
      const isAdmin = userDoc.role === 'admin' || userDoc.isAdmin === true;
      if (!isAdmin) {
        setAuthError("Access denied: Admin privileges required");
        setAuthLoading(false);
        await authService.logoutWithBackend();
        return;
      }
      
      // Step 4: Try to verify with backend (optional)
      try {
        await authService.loginAndVerifyAdmin(user);
      } catch (backendError) {
        console.warn('Backend verification failed (continuing anyway):', backendError.message);
      }
      
      // Step 5: Store admin session
      const adminUser = {
        uid: user.uid,
        email: user.email,
        name: userDoc.displayName || userDoc.name || email,
        role: 'admin'
      };
      localStorage.setItem('adminUser', JSON.stringify(adminUser));
      localStorage.setItem('isAdmin', 'true');
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('userId', user.uid);
      
      // Step 6: Show success message
      toast.success('Welcome back, Admin!');
      
      // Step 7: Close modal and navigate
      handleClose();
      navigate('/admin/dashboard');
      
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      transition: {
        when: "afterChildren",
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    },
    exit: {
      y: -20,
      opacity: 0,
      transition: {
        duration: 0.2
      }
    }
  };

  const inputVariants = {
    focused: {
      scale: 1.02,
      boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.4), 0 5px 10px -5px rgba(59, 130, 246, 0.2)",
      transition: { duration: 0.2 }
    },
    unfocused: {
      scale: 1,
      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
      transition: { duration: 0.2 }
    }
  };

  const buttonVariants = {
    initial: { scale: 1 },
    tap: { scale: 0.95 },
    hover: { 
      scale: 1.02,
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
    },
    loading: {
      scale: [1, 1.02, 1],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const errorVariants = {
    hidden: { 
      height: 0, 
      opacity: 0,
      marginTop: 0,
      paddingTop: 0,
      paddingBottom: 0
    },
    visible: { 
      height: "auto",
      opacity: 1,
      marginTop: 16,
      paddingTop: 12,
      paddingBottom: 12,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Enhanced Background with Gradient */}
        <motion.div
          className="absolute inset-0 bg-white-100/10 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        />
        
        {/* Floating Background Elements */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500/20 rounded-full blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-purple-500/20 rounded-full blur-xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.2, 0.4],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        <motion.div
          className="relative w-full max-w-md"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div
            className="bg-gradient-to-br from-white to-gray-50/95 border border-white/20 rounded-2xl p-8 shadow-2xl backdrop-blur-sm relative overflow-hidden"
            variants={itemVariants}
            whileHover={{ 
              scale: 1.01,
              transition: { duration: 0.2 }
            }}
          >
            {/* Animated Border Glow */}
            <motion.div
              className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10"
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-light z-10 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100/50 transition-colors"
              aria-label="Close"
            >
              <motion.span
                whileHover={{ rotate: 90 }}
                transition={{ duration: 0.2 }}
              >
                &times;
              </motion.span>
            </button>
            
            <motion.div 
              className="text-center mb-8 relative"
              variants={itemVariants}
            >
              <motion.div
                className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-blue-500 to-blue-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: 64 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              />
              <motion.h2 
                className="text-3xl font-bold   mt-6 mb-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Admin Sign In
              </motion.h2>
              <motion.p 
                className="text-gray-500 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Secure Administrative Access
              </motion.p>
            </motion.div>
            
            <motion.div 
              className="space-y-6 relative"
              variants={containerVariants}
            >
              <form onSubmit={handleEmailSignIn} className="space-y-6">
                <motion.div variants={itemVariants}>
                  <label htmlFor="admin-email" className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
                    Email Address
                  </label>
                  <motion.input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setIsFocused(prev => ({ ...prev, email: true }))}
                    onBlur={() => setIsFocused(prev => ({ ...prev, email: false }))}
                    className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none backdrop-blur-sm"
                    placeholder="admin@example.com"
                    autoComplete="email"
                    variants={inputVariants}
                    animate={isFocused.email ? "focused" : "unfocused"}
                  />
                </motion.div>
                
                <motion.div variants={itemVariants}>
                  <label htmlFor="admin-password" className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
                    Password
                  </label>
                  <motion.input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsFocused(prev => ({ ...prev, password: true }))}
                    onBlur={() => setIsFocused(prev => ({ ...prev, password: false }))}
                    className="w-full px-4 py-3 bg-white/80 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none backdrop-blur-sm"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    variants={inputVariants}
                    animate={isFocused.password ? "focused" : "unfocused"}
                  />
                </motion.div>
                
                <AnimatePresence>
                  {authError && (
                    <motion.div
                      className="text-red-700 text-sm bg-red-50/80 border border-red-200 rounded-xl text-center backdrop-blur-sm"
                      variants={errorVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                    >
                      {authError}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <motion.button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3.5 px-4 bg-blue-600 text-white font-semibold rounded-xl shadow-lg relative overflow-hidden"
                  variants={buttonVariants}
                  initial="initial"
                  whileHover={authLoading ? "loading" : "hover"}
                  whileTap="tap"
                  animate={authLoading ? "loading" : "initial"}
                >
                  {/* Animated button background */}
                  <motion.div
                    className="absolute inset-0 opacity-0"
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                  
                  <span className="relative z-10">
                    {authLoading ? (
                      <motion.span className="flex items-center justify-center">
                        <motion.svg 
                          className="mr-2 h-4 w-4 text-white" 
                          xmlns="http://www.w3.org/2000/svg" 
                          fill="none" 
                          viewBox="0 0 24 24"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </motion.svg>
                        Authenticating...
                      </motion.span>
                    ) : (
                      <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        Sign In as Admin
                      </motion.span>
                    )}
                  </span>
                </motion.button>
              </form>
              
              <motion.div 
                className="text-center pt-4 border-t border-gray-200/50"
                variants={itemVariants}
              >
                <motion.button 
                  onClick={goToStudentLogin}
                  className="text-sm bg-gradient-to-r from-gray-600 to-gray-700 bg-clip-text text-transparent font-medium hover:from-gray-700 hover:to-gray-800 transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Not an admin? Go to Student Login →
                </motion.button>
              </motion.div>
            </motion.div>

            {/* Footer decorative element */}
            <motion.div
              className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-blue-500 to-blue-500 rounded-full opacity-50"
              initial={{ width: 0 }}
              animate={{ width: 96 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AdminSignIn;