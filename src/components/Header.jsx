import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const Header = ({ userData }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
            
            {userData && (
              <motion.div 
                className="flex items-center space-x-2"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring' }}
              >
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
                  {userData.name.charAt(0)}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-700">{userData.name}</p>
                  <p className="text-xs text-gray-500">
                    {userData.streak} day streak
                  </p>
                </div>
              </motion.div>
            )}
            
            <motion.button 
              className="ml-4 px-4 py-2 rounded-md bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Sign Out
            </motion.button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
