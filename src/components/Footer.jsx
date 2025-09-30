import { motion } from 'framer-motion';

const Footer = () => {
  return (
    <motion.footer 
      className="bg-white border-t border-gray-200 py-8"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <motion.div 
              className="text-xl font-bold text-blue-600 mb-4"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              CodeTracker
            </motion.div>
            <p className="text-gray-500 text-sm mb-4">
              Track your coding progress across multiple platforms and compete with friends.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Resources</h3>
            <ul className="space-y-2">
              {['Documentation', 'Tutorials', 'API', 'Support'].map((item) => (
                <motion.li key={item} whileHover={{ x: 2 }}>
                  <a href="#" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
                    {item}
                  </a>
                </motion.li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Community</h3>
            <ul className="space-y-2">
              {['Forum', 'Discord', 'Events', 'Blog'].map((item) => (
                <motion.li key={item} whileHover={{ x: 2 }}>
                  <a href="#" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
                    {item}
                  </a>
                </motion.li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Legal</h3>
            <ul className="space-y-2">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Contact Us'].map((item) => (
                <motion.li key={item} whileHover={{ x: 2 }}>
                  <a href="#" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
                    {item}
                  </a>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} CodeTracker. All rights reserved.
          </p>
          
          <div className="mt-4 md:mt-0">
            <div className="flex space-x-6">
              {['Twitter', 'GitHub', 'LinkedIn', 'YouTube'].map((platform) => (
                <motion.a 
                  key={platform}
                  href="#"
                  className="text-gray-500 hover:text-blue-600 transition-colors"
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <span className="text-sm">{platform}</span>
                </motion.a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
