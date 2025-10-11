import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

const EditStudentModal = ({ student, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    registerNumber: '',
    rollNumber: '',
    department: '',
    year: '',
    phoneNumber: '',
    platformUrls: {
      leetcode: '',
      codeforces: '',
      atcoder: '',
      github: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || '',
        email: student.email || '',
        registerNumber: student.registerNumber || '',
        rollNumber: student.rollNumber || '',
        department: student.department || '',
        year: student.year || '',
        phoneNumber: student.phoneNumber || '',
        platformUrls: {
          leetcode: student.platformUrls?.leetcode || '',
          codeforces: student.platformUrls?.codeforces || '',
          atcoder: student.platformUrls?.atcoder || '',
          github: student.platformUrls?.github || ''
        }
      });
    }
  }, [student]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Validate platform URLs
    const urlPatterns = {
      leetcode: /^https?:\/\/(www\.)?leetcode\.com\/(u\/)?[a-zA-Z0-9_-]+\/?$/,
      codeforces: /^https?:\/\/(www\.)?codeforces\.com\/profile\/[a-zA-Z0-9_-]+\/?$/,
      atcoder: /^https?:\/\/(www\.)?atcoder\.jp\/users\/[a-zA-Z0-9_-]+\/?$/,
      github: /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?$/
    };

    Object.entries(formData.platformUrls).forEach(([platform, url]) => {
      if (url && !urlPatterns[platform].test(url)) {
        newErrors[`platformUrls.${platform}`] = `Invalid ${platform} URL format`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Format platform URLs
      const formattedUrls = {};
      Object.entries(formData.platformUrls).forEach(([platform, url]) => {
        if (url) {
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            formattedUrls[platform] = `https://${url}`;
          } else {
            formattedUrls[platform] = url;
          }
        }
      });

      const updateData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        registerNumber: formData.registerNumber.trim(),
        rollNumber: formData.rollNumber.trim(),
        department: formData.department.trim(),
        year: formData.year.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        platformUrls: formattedUrls,
        lastUpdated: new Date().toISOString()
      };

      await updateDoc(doc(db, 'users', student.id), updateData);

      const updatedStudent = {
        ...student,
        ...updateData
      };

      toast.success('Student updated successfully!');
      onUpdate(updatedStudent);
      onClose();
    } catch (error) {
      console.error('Error updating student:', error);
      toast.error('Failed to update student');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const platformLabels = {
    leetcode: 'LeetCode',
    codeforces: 'Codeforces',
    atcoder: 'AtCoder',
    github: 'GitHub'
  };

  const platformPlaceholders = {
    leetcode: 'https://leetcode.com/username',
    codeforces: 'https://codeforces.com/profile/username',
    atcoder: 'https://atcoder.jp/users/username',
    github: 'https://github.com/username'
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Edit Student</h2>
                <p className="text-sm text-gray-600 mt-1">Update student information and platform URLs</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full p-2 transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter student name"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter email address"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Register Number
                    </label>
                    <input
                      type="text"
                      value={formData.registerNumber}
                      onChange={(e) => handleInputChange('registerNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter register number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Roll Number
                    </label>
                    <input
                      type="text"
                      value={formData.rollNumber}
                      onChange={(e) => handleInputChange('rollNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter roll number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter department"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Year
                    </label>
                    <select
                      value={formData.year}
                      onChange={(e) => handleInputChange('year', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Year</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              {/* Platform URLs */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform URLs</h3>
                <div className="space-y-4">
                  {Object.entries(platformLabels).map(([platform, label]) => (
                    <div key={platform}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {label} Profile URL
                      </label>
                      <input
                        type="url"
                        value={formData.platformUrls[platform]}
                        onChange={(e) => handleInputChange(`platformUrls.${platform}`, e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors[`platformUrls.${platform}`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder={platformPlaceholders[platform]}
                      />
                      {errors[`platformUrls.${platform}`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`platformUrls.${platform}`]}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Update Student
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EditStudentModal;