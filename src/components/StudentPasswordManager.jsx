// components/StudentPasswordManager.jsx
import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';

const StudentPasswordManager = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [resettingStudent, setResettingStudent] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'users'));
      const studentsData = [];
      
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        if (data.role === 'student') {
          studentsData.push({
            id: docSnapshot.id,
            ...data
          });
        }
      });
      
      // Sort by name
      studentsData.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching students:', error);
      setMessage({ type: 'error', text: 'Failed to load students' });
    } finally {
      setLoading(false);
    }
  };

  // Use the SAME password generation as your AdminUserCreation
  const generateTemporaryPassword = () => {
    return `Temp@${Math.random().toString(36).slice(2, 10)}${Date.now().toString().slice(-4)}`;
  };

  const resetStudentPassword = async (student) => {
    setResettingStudent(student.id);
    setMessage({ type: '', text: '' });

    const newTempPassword = generateTemporaryPassword();
    
    try {
      await updateDoc(doc(db, 'users', student.id), {
        tempPassword: newTempPassword,
        tempPasswordCreatedAt: new Date().toISOString(),
        requiresPasswordReset: true
      });

      // Show success message with password
      setMessage({ 
        type: 'success', 
        text: `Password reset for ${student.name}. New temporary password: ${newTempPassword}` 
      });

      // Refresh the list to show updated password
      fetchStudents();
      
      // Auto-copy to clipboard
      navigator.clipboard.writeText(newTempPassword);
      
    } catch (error) {
      console.error('Error resetting password:', error);
      setMessage({ type: 'error', text: 'Failed to reset password. Please try again.' });
    } finally {
      setResettingStudent(null);
    }
  };

  const filteredStudents = students.filter(student => 
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.registerNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Password Management</h1>
        <p className="text-gray-600">Manage and reset temporary passwords for students</p>
      </motion.div>

      {/* Search and Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6 space-y-4"
      >
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search by name, email, register number, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <motion.button
            onClick={fetchStudents}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Refresh
          </motion.button>
        </div>

        <AnimatePresence>
          {message.text && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-xl border-l-4 ${
                message.type === 'error' 
                  ? 'bg-red-50 text-red-700 border-red-400' 
                  : 'bg-green-50 text-green-700 border-green-400'
              }`}
            >
              {message.text}
              {message.type === 'success' && (
                <p className="text-sm mt-1 opacity-90">
                  Password has been copied to clipboard automatically.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Student Information
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Academic Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Temporary Password
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student, index) => (
                <motion.tr
                  key={student.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-lg">
                          {student.name?.charAt(0) || 'S'}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {student.name || 'No Name'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.email}
                        </div>
                        {student.registerNumber && (
                          <div className="text-xs text-gray-400">
                            Reg: {student.registerNumber}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{student.department || 'Not specified'}</div>
                    <div className="text-sm text-gray-500">Year {student.year || 'N/A'}</div>
                    <div className="text-xs text-gray-400">{student.college || 'Not specified'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      {student.tempPassword ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="inline-flex flex-col space-y-1"
                        >
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono bg-green-100 text-green-800 border border-green-200">
                            {student.tempPassword}
                          </span>
                          {student.tempPasswordCreatedAt && (
                            <div className="text-xs text-gray-500">
                              Created: {new Date(student.tempPasswordCreatedAt).toLocaleDateString()}
                            </div>
                          )}
                        </motion.div>
                      ) : (
                        <span className="text-red-400 italic">No password set</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <motion.button
                      onClick={() => resetStudentPassword(student)}
                      disabled={resettingStudent === student.id}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm shadow-sm"
                      whileHover={{ scale: resettingStudent !== student.id ? 1.05 : 1 }}
                      whileTap={{ scale: resettingStudent !== student.id ? 0.95 : 1 }}
                    >
                      {resettingStudent === student.id ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Resetting...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Reset Password
                        </>
                      )}
                    </motion.button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          
          {filteredStudents.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="text-gray-400 text-lg">
                {searchTerm ? 'No students match your search' : 'No students found'}
              </div>
              <div className="text-gray-500 text-sm mt-2">
                {searchTerm ? 'Try adjusting your search terms' : 'Students will appear here once created'}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentPasswordManager;