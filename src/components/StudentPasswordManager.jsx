import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { db, auth } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import BackButton from './BackButton';

const StudentPasswordManager = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [resettingStudent, setResettingStudent] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [refreshing, setRefreshing] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const studentsRef = collection(db, 'users');
      const q = query(studentsRef, where('role', '==', 'student'));
      const querySnapshot = await getDocs(q);
      
      const studentsData = querySnapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        ...docSnapshot.data()
      }));
      
      // Sort by name
      studentsData.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching students:', error);
      setMessage({ type: 'error', text: 'Failed to load students' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStudents();
  };

  const openResetModal = (student) => {
    setSelectedStudent(student);
    setShowResetModal(true);
  };

  const closeResetModal = () => {
    setShowResetModal(false);
    setSelectedStudent(null);
  };

  const resetStudentPassword = async () => {
    if (!selectedStudent?.email) {
      setMessage({ type: 'error', text: 'Invalid student email address' });
      closeResetModal();
      return;
    }

    setResettingStudent(selectedStudent.id);
    
    try {
      // Send password reset email
      await sendPasswordResetEmail(auth, selectedStudent.email);
      
      // Update Firestore with reset timestamp
      await updateDoc(doc(db, 'users', selectedStudent.id), {
        passwordResetRequestedAt: new Date().toISOString(),
        requiresPasswordReset: true,
        lastPasswordReset: new Date().toISOString()
      });

      setMessage({ 
        type: 'success', 
        text: `Password reset email sent successfully!` 
      });

      // Refresh student list to show updated status
      await fetchStudents();
      
    } catch (error) {
      console.error('Error resetting password:', error);
      
      let errorMessage = 'Failed to send reset email. Please try again.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = `Student email not found in authentication system.\n\nEmail: ${selectedStudent.email}`;
          break;
        case 'auth/invalid-email':
          errorMessage = `Invalid email address format.\n\nEmail: ${selectedStudent.email}`;
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many reset attempts. Please wait a few minutes before trying again.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
        case 'permission-denied':
          errorMessage = 'Permission denied. Please check your Firestore security rules.';
          break;
        default:
          errorMessage = `Error: ${error.message}`;
      }
      
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setResettingStudent(null);
      closeResetModal();
    }
  };

  const filteredStudents = students.filter(student => 
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.registerNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Clear message after 8 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [message.text]);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showResetModal) {
        closeResetModal();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showResetModal]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  const cardHoverVariants = {
    rest: { 
      scale: 1,
      y: 0,
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
    },
    hover: { 
      scale: 1.02,
      y: -2,
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    }
  };

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.3
      }
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.2
      }
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center items-center min-h-96"
      >
        <div className="text-center">
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{
              rotate: { duration: 1, repeat: Infinity, ease: "linear" },
              scale: { duration: 1.5, repeat: Infinity }
            }}
            className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4 mt-20"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 text-lg font-medium"
          >
            Loading students...
          </motion.p>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <BackButton />
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="p-6 max-w-7xl mx-auto"
      >
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="mb-8 text-center"
        >
          <motion.h1 
            className="text-4xl font-bold text-gray-900 mb-3"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          >
            Student Password Management
          </motion.h1>
          <motion.p 
            className="text-lg text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Send password reset emails to students securely and efficiently
          </motion.p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <motion.div
            variants={itemVariants}
            className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 text-center"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="text-3xl font-bold text-blue-600 mb-2">{students.length}</div>
            <div className="text-sm text-gray-600 font-medium">Total Students</div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 text-center"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="text-3xl font-bold text-green-600 mb-2">
              {students.filter(s => !s.requiresPasswordReset).length}
            </div>
            <div className="text-sm text-gray-600 font-medium">Active Accounts</div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 text-center"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {students.filter(s => s.requiresPasswordReset).length}
            </div>
            <div className="text-sm text-gray-600 font-medium">Reset Requests</div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 text-center"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {students.filter(s => s.passwordResetRequestedAt).length}
            </div>
            <div className="text-sm text-gray-600 font-medium">Reset Emails Sent</div>
          </motion.div>
        </motion.div>

        {/* Search and Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <motion.div 
              className="relative flex-1 w-full"
              whileFocus={{ scale: 1.02 }}
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search students by name, email, register number, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </motion.div>

            <motion.button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-2xl hover:bg-gray-50 disabled:opacity-50 transition-all duration-200 font-medium shadow-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.svg
                animate={{ rotate: refreshing ? 360 : 0 }}
                transition={{ duration: 1, repeat: refreshing ? Infinity : 0 }}
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </motion.svg>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </motion.button>
          </div>
        </motion.div>

        {/* Message Display */}
        <AnimatePresence>
          {message.text && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className={`mb-6 p-6 rounded-2xl border-l-4 whitespace-pre-line ${
                message.type === 'error' 
                  ? 'bg-red-50 text-red-700 border-red-400' 
                  : 'bg-green-50 text-green-700 border-green-400'
              }`}
            >
              <div className="flex items-start gap-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    message.type === 'error' ? 'bg-red-100' : 'bg-green-100'
                  }`}
                >
                  {message.type === 'error' ? '⚠️' : '✅'}
                </motion.div>
                <div className="flex-1">
                  <div className="font-semibold text-lg mb-1">
                    {message.type === 'error' ? 'Error' : 'Success'}
                  </div>
                  <div className="text-sm leading-relaxed">{message.text}</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Students Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {filteredStudents.map((student, index) => (
            <motion.div
              key={student.id}
              variants={itemVariants}
              custom={index}
              initial="rest"
              whileHover="hover"
              animate="rest"
              variants={cardHoverVariants}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
            >
              <div className="p-6">
                {/* Student Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center"
                      whileHover={{ rotate: 5 }}
                    >
                      <span className="text-blue-600 font-bold text-lg">
                        {student.name?.charAt(0) || 'S'}
                      </span>
                    </motion.div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                        {student.name || 'No Name'}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">{student.email}</p>
                    </div>
                  </div>
                  
                 
                </div>

                {/* Student Details */}
                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  {student.registerNumber && (
                    <div>
                      <div className="text-gray-500 font-medium">Register No.</div>
                      <div className="text-gray-900 font-mono">{student.registerNumber}</div>
                    </div>
                  )}
                  {student.department && (
                    <div>
                      <div className="text-gray-500 font-medium">Department</div>
                      <div className="text-gray-900">{student.department}</div>
                    </div>
                  )}
                  {student.year && (
                    <div>
                      <div className="text-gray-500 font-medium">Year</div>
                      <div className="text-gray-900">Year {student.year}</div>
                    </div>
                  )}
                  {student.college && (
                    <div>
                      <div className="text-gray-500 font-medium">College</div>
                      <div className="text-gray-900">{student.college}</div>
                    </div>
                  )}
                </div>

                
                {/* Action Button */}
                <motion.button
                  onClick={() => openResetModal(student)}
                  disabled={resettingStudent === student.id}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm"
                  whileHover={{ scale: resettingStudent !== student.id ? 1.02 : 1 }}
                  whileTap={{ scale: resettingStudent !== student.id ? 0.98 : 1 }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Send Reset Email
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredStudents.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <motion.div
              animate={{ 
                y: [0, -10, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="text-6xl mb-4"
            >
              📭
            </motion.div>
            <h3 className="text-2xl font-semibold text-gray-600 mb-2">
              {searchTerm ? 'No students found' : 'No students available'}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {searchTerm 
                ? 'Try adjusting your search terms to find the student you\'re looking for.'
                : 'Students will appear here once they are added to the system.'
              }
            </p>
          </motion.div>
        )}

        {/* Footer Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-center text-sm text-gray-500"
        >
          Showing {filteredStudents.length} of {students.length} students
          {students.some(s => s.passwordResetRequestedAt) && (
            <span className="ml-4">
              • {students.filter(s => s.passwordResetRequestedAt).length} reset emails sent
            </span>
          )}
        </motion.div>
      </motion.div>

      {/* Reset Password Modal */}
      <AnimatePresence>
        {showResetModal && selectedStudent && (
          <>
            {/* Backdrop */}
            <motion.div
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
              onClick={closeResetModal}
            >
              {/* Modal */}
              <motion.div
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Send Password Reset</h3>
                      <p className="text-sm text-gray-500">Confirm password reset email</p>
                    </div>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6">
                  <div className="space-y-4">
                    {/* Student Info */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        {/* <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-lg">
                            {selectedStudent.name?.charAt(0) || 'S'}
                          </span>
                        </div> */}
                        <div>
                          <div className="font-semibold text-gray-900">{selectedStudent.name}</div>
                          <div className="text-sm text-gray-500">{selectedStudent.email}</div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {selectedStudent.registerNumber && (
                        <div>
                          <div className="text-gray-500">Register No.</div>
                          <div className="font-medium text-gray-900">{selectedStudent.registerNumber}</div>
                        </div>
                      )}
                      {selectedStudent.department && (
                        <div>
                          <div className="text-gray-500">Department</div>
                          <div className="font-medium text-gray-900">{selectedStudent.department}</div>
                        </div>
                      )}
                    </div>

                    {/* Warning Message */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 text-yellow-600 mt-0.5">
                          ⚠️
                        </div>
                        <div className="text-sm text-yellow-800">
                          This will send a password reset link to the student's email address. The student can use this link to set a new password.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-gray-200 flex gap-3">
                  <motion.button
                    onClick={closeResetModal}
                    disabled={resettingStudent === selectedStudent.id}
                    className="flex-1 px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all duration-200 font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    onClick={resetStudentPassword}
                    disabled={resettingStudent === selectedStudent.id}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {resettingStudent === selectedStudent.id ? (
                      <>
                        {/* <motion.svg
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </motion.svg> */}
                        Sending...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Send Reset Email
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default StudentPasswordManager;