// src/components/Header.jsx
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { logOut, getCurrentUser } from '../firebase';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
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
    const fetchUserData = () => {
      try {
        const currentUser = getCurrentUser();
        
        if (currentUser) {
          // Create a user object with the data we need
          setUser({
            uid: currentUser.uid,
            name: currentUser.displayName || 'User',
            email: currentUser.email,
            // photoURL: currentUser.photoURL,
            streak: 0 
          });
        } else {
          // If no user is logged in, redirect to landing page
          navigate('/');
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  // Handle sign out
  const handleSignOut = async () => {
    try {
      setIsDropdownOpen(false);
      const { success, error } = await logOut();
      if (success) {
        navigate('/');
      } else {
        console.error("Sign out error:", error);
      }
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  
  // Get initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Toggle dropdown menu
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  if (loading) {
    return (
      <header className="h-16 sm:h-20 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-full">
          <div className="animate-pulse h-8 w-32 bg-gray-200 rounded"></div>
          <div className="animate-pulse h-8 w-40 bg-gray-200 rounded"></div>
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
              className="text-2xl font-bold text-blue-600"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              CodeTracker
            </motion.div>
          </div>
          
          <div className="flex items-center space-x-6">
            <nav className="hidden md:flex space-x-8">
              {['Dashboard', 'Leaderboard', 'Challenges', 'Community'].map((item) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200"
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                >
                  {item}
                </motion.a>
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
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.name} 
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-white shadow-sm"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium shadow-sm">
                      {getInitials(user.name)}
                    </div>
                  )}
                  <div className="hidden sm:block">
                    <p className="text-sm font-semibold text-gray-700 line-clamp-1">{user.name}</p>
                    <div className="flex items-center">
                      <span className="h-2 w-2 rounded-full bg-green-500 mr-1.5"></span>
                      <p className="text-xs text-gray-500">
                        {user.streak} day streak
                      </p>
                    </div>
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
                          {user.photoURL ? (
                            <img 
                              src={user.photoURL} 
                              alt={user.name} 
                              className="h-10 w-10 rounded-full object-cover border-2 border-white shadow"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium text-sm shadow">
                              {getInitials(user.name)}
                            </div>
                          )}
                          <div className="ml-3 overflow-hidden">
                            <p className="text-sm font-bold text-gray-800 truncate">{user.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Menu items */}
                      <div className="py-1">
                        <a 
                          href="#profile" 
                          className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                        >
                        
                          Profile
                        </a>
                        
                        <a 
                          href="#settings" 
                          className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                        >
                          
                          Settings
                        </a>

                       
                      </div>
                      
                      {/* Divider */}
                      <div className="h-px bg-gray-200 mx-2"></div>
                      
                      {/* Sign out button */}
                      <div className="py-1 px-2">
                        <motion.button 
                          onClick={handleSignOut} 
                          className="flex w-full items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg hover:from-red-600 hover:to-red-700 transition-colors"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          
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
