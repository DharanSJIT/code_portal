import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { logOut, getCurrentUser, getUserById } from '../firebase';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  
  // Track scroll position for header styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get user data from Firebase on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      // Don't fetch user data if we're in the process of signing out
      if (isSigningOut) return;
      
      try {
        const currentUser = getCurrentUser();
        
        if (currentUser) {
          console.log('Firebase Auth User:', currentUser);
          
          // Try to get complete user data from Firestore
          try {
            const { user: userDoc, error } = await getUserById(currentUser.uid);
            
            if (userDoc && !error) {
              console.log('Firestore User Document:', userDoc);
              // Use Firestore data which has complete profile
              setUser({
                uid: currentUser.uid,
                name: userDoc.name || currentUser.displayName || 'User',
                email: userDoc.email || currentUser.email,
                photoURL: userDoc.photoURL || currentUser.photoURL,
                role: userDoc.role,
                department: userDoc.department,
                registerNumber: userDoc.registerNumber,
                streak: userDoc.streak || 0
              });
            } else {
              // Fallback to Firebase Auth data if Firestore fails
              console.log('Using Firebase Auth data as fallback');
              setUser({
                uid: currentUser.uid,
                name: currentUser.displayName || 'User',
                email: currentUser.email,
                photoURL: currentUser.photoURL,
                role: 'student', // default role
                streak: 0
              });
            }
          } catch (firestoreError) {
            console.error('Firestore lookup error:', firestoreError);
            // Fallback to Firebase Auth data
            setUser({
              uid: currentUser.uid,
              name: currentUser.displayName || 'User',
              email: currentUser.email,
              photoURL: currentUser.photoURL,
              role: 'student',
              streak: 0
            });
          }
        } else {
          // If no user is logged in and we're not signing out, redirect to landing page
          if (!isSigningOut) {
            console.log('No user logged in, redirecting to home');
            navigate('/');
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate, isSigningOut]);

  // Reset image error when user changes
  useEffect(() => {
    setImageError(false);
  }, [user]);

  // Handle sign out
  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      setIsDropdownOpen(false);
      
      const { success, error } = await logOut();
      
      if (success) {
        setUser(null);
        console.log('Sign out successful, navigating to landing page');
        // Navigate to landing page after successful sign out
        navigate('/', { replace: true });
      } else {
        console.error("Sign out error:", error);
        // Even if there's an error, still navigate to landing page
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error("Error signing out:", error);
      // Navigate to landing page even if there's an error
      navigate('/', { replace: true });
    } finally {
      // Reset signing out state after a short delay
      setTimeout(() => setIsSigningOut(false), 1000);
    }
  };

  // Get display name (first name only)
  const getDisplayName = (name) => {
    if (!name || name === 'User') return 'User';
    return name.split(' ')[0]; // Return only first name
  };

  // Toggle dropdown menu
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Account SVG Icon Component
  const AccountIcon = ({ className = "h-6 w-6" }) => (
    <svg 
      className={className} 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
      />
    </svg>
  );

  // Navigation items
  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Leaderboard', path: '/leaderboard' },
    { name: 'Tasks', path: '/tasks' },
    { name: 'Activity', path: '/activity' }
  ];

  // Check if current path is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  if (loading) {
    return (
      <header className="h-16 sm:h-20 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-full">
          <div className="animate-pulse h-8 w-32 bg-gray-200 rounded"></div>
          <div className="flex items-center space-x-4">
            <div className="animate-pulse h-8 w-24 bg-gray-200 rounded"></div>
            <div className="animate-pulse h-8 w-8 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <motion.header 
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md py-2' : 'bg-white py-4'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <motion.div 
              className="text-2xl font-bold text-blue-600 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              onClick={() => navigate('/dashboard')}
            >
              CodeTracker
            </motion.div>
          </div>
          
          <div className="flex items-center space-x-6">
            <nav className="hidden md:flex space-x-8">
              {navItems.map((item) => (
                <motion.button
                  key={item.name}
                  onClick={() => navigate(item.path)}
                  className={`font-medium transition-colors duration-200 ${
                    isActive(item.path)
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                >
                  {item.name}
                </motion.button>
              ))}
            </nav>
            
            {user && (
              <div className="relative" ref={dropdownRef}>
                <motion.div 
                  className="flex items-center space-x-2 cursor-pointer rounded-full hover:bg-gray-100 p-1.5 pr-3 transition-colors duration-200"
                  onClick={toggleDropdown}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* User Avatar */}
                  <div className="relative">
                    {user.photoURL && !imageError ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.name} 
                        className="h-8 w-8 rounded-full object-cover ring-2 ring-white shadow-sm"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center shadow-sm">
                        <AccountIcon className="h-4 w-4 text-gray-500" />
                      </div>
                    )}
                  </div>
                  
                  <div className="hidden sm:block">
                    <p className="text-sm font-semibold text-gray-700 line-clamp-1">
                      {getDisplayName(user.name)}
                    </p>
                    {user.streak > 0 && (
                      <p className="text-xs text-orange-600 font-medium">
                        🔥 {user.streak} day streak
                      </p>
                    )}
                  </div>
                  <svg 
                    className={`h-5 w-5 text-gray-400 transition-transform duration-200 ease-in-out ${isDropdownOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.div>
                
                {/* Enhanced Dropdown Menu */}
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div 
                      className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg overflow-hidden z-10 border border-gray-100"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      style={{ 
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                      }}
                    >
                      {/* User info section */}
                      <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div className="flex items-center">
                          <div className="relative">
                            {user.photoURL && !imageError ? (
                              <img 
                                src={user.photoURL} 
                                alt={user.name} 
                                className="h-10 w-10 rounded-full object-cover border-2 border-white shadow"
                                onError={() => setImageError(true)}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center shadow">
                                <AccountIcon className="h-5 w-5 text-gray-500" />
                              </div>
                            )}
                          </div>
                          <div className="ml-3 overflow-hidden">
                            <p className="text-sm font-bold text-gray-800 truncate">{user.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            {user.department && (
                              <p className="text-xs text-blue-600 font-medium truncate">
                                {user.department}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Menu items */}
                      <div className="py-1">
                        <button 
                          onClick={() => {
                            setIsDropdownOpen(false);
                            navigate('/profile');
                          }}
                          className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors duration-200"
                        >
                          <AccountIcon className="w-4 h-4 mr-3 text-gray-400" />
                          Profile
                        </button>
                        
                        <button 
                          onClick={() => {
                            setIsDropdownOpen(false);
                            navigate('/settings');
                          }}
                          className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors duration-200"
                        >
                          <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Settings
                        </button>
                      </div>
                      
                      {/* Divider */}
                      <div className="h-px bg-gray-200 mx-2"></div>
                      
                      {/* Additional user info */}
                      <div className="px-4 py-2 bg-gray-50">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Role:</span>
                          <span className="font-medium capitalize">{user.role || 'student'}</span>
                        </div>
                        {user.registerNumber && (
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Reg No:</span>
                            <span className="font-medium">{user.registerNumber}</span>
                          </div>
                        )}
                        {user.streak > 0 && (
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Streak:</span>
                            <span className="font-medium text-orange-600">🔥 {user.streak} days</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Sign out button */}
                      <div className="py-1 px-2">
                        <motion.button 
                          onClick={handleSignOut} 
                          className="flex w-full items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg hover:from-red-600 hover:to-red-700 transition-colors duration-200"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sign Out
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;