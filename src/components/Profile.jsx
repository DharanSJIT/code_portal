import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import ChangePassword from '../components/ChangePassword';

// --- Reusable SVG Icons for Tabs ---
const UserIcon = () => (
  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
);
const ShieldIcon = () => (
  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
);

const TABS = [
  { id: 'profile', label: 'Edit Profile', icon: <UserIcon /> },
  { id: 'security', label: 'Security', icon: <ShieldIcon /> },
];

const Profile = () => {
  const { currentUser, userData, refreshUserData } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    name: '', department: '', year: '', college: '', phone: ''
  });

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        department: userData.department || '',
        year: userData.year || '',
        college: userData.college || '',
        phone: userData.phone || '',
      });
    }
  }, [userData]);

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [name]: e.target.value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { ...formData, updatedAt: new Date() });
      if (refreshUserData) await refreshUserData();
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };
  
  const contentVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeInOut' } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2, ease: 'easeInOut' } }
  };

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Account Settings</h1>
          <p className="text-gray-600 mt-2">Hello, <span className="font-semibold text-blue-600">{userData.name || 'User'}</span>! Manage your profile and security settings.</p>
        </motion.div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* --- Left Navigation Panel --- */}
          <div className="md:col-span-1">
            <nav className="flex flex-col space-y-2">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors relative ${
                    activeTab === tab.id ? 'text-white' : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-blue-600 rounded-lg z-0"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <div className="relative z-10 flex items-center">
                    {tab.icon}
                    {tab.label}
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* --- Right Content Panel --- */}
          <div className="md:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {activeTab === 'profile' && (
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                      <h2 className="text-2xl font-semibold text-gray-900">Your Information</h2>
                      <p className="text-gray-500 mt-1">Update your personal details here.</p>
                    </div>
                    <form onSubmit={handleSaveProfile} className="p-6 space-y-6">
                      {message.text && (
                        <div className={`p-4 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                          {message.text}
                        </div>
                      )}
                      {/* Name & Email */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Full Name</label>
                          <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email Address</label>
                          <p className="mt-1 text-gray-500">{currentUser?.email} (cannot be changed)</p>
                        </div>
                      </div>
                      {/* Department & Year */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Department</label>
                          <select name="department" value={formData.department} onChange={handleInputChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Select Department</option>
                            <option value="Computer Science">Computer Science</option>
                            <option value="Information Technology">Information Technology</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Academic Year</label>
                           <select name="year" value={formData.year} onChange={handleInputChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">Select Year</option>
                                <option value="1">First Year</option>
                                <option value="2">Second Year</option>
                           </select>
                        </div>
                      </div>
                      {/* College & Phone */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                         <div>
                            <label className="block text-sm font-medium text-gray-700">College</label>
                            <input type="text" name="college" value={formData.college} onChange={handleInputChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Phone</label>
                            <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                        </div>
                      </div>
                      <div className="pt-6 border-t border-gray-200 flex justify-end gap-3">
                        <button type="button" onClick={() => setFormData(userData)} className="px-5 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium">Reset</button>
                        <motion.button type="submit" disabled={loading} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50" whileTap={{ scale: 0.98 }}>
                          {loading ? 'Saving...' : 'Save Changes'}
                        </motion.button>
                      </div>
                    </form>
                  </div>
                )}
                
                {activeTab === 'security' && (
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200">
                     <div className="p-6 border-b border-gray-200">
                      <h2 className="text-2xl font-semibold text-gray-900">Password & Security</h2>
                      <p className="text-gray-500 mt-1">Manage your password to keep your account secure.</p>
                    </div>
                     <div className="p-6 space-y-6">
                        <div className="flex flex-col sm:flex-row items-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 sm:mb-0 sm:mr-4">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                            </div>
                            <div>
                                <h4 className="font-semibold text-blue-900">Security Tip</h4>
                                <p className="text-sm text-blue-800">For the best security, your new password should be at least 8 characters long and include a mix of letters, numbers, and symbols.</p>
                            </div>
                        </div>
                         <div className="pt-6 border-t border-gray-200 flex justify-between items-center">
                            <div>
                                <h3 className="font-medium text-gray-800">Change Password</h3>
                                <p className="text-sm text-gray-500">Last changed on {userData.passwordLastChanged ? new Date(userData.passwordLastChanged.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <motion.button onClick={() => setIsChangePasswordOpen(true)} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium" whileTap={{ scale: 0.98 }}>
                                Change
                            </motion.button>
                        </div>
                     </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
      <ChangePassword isOpen={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)} />
    </div>
  );
};

export default Profile;