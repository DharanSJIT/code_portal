// src/components/AdminUserCreation.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase.js';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { toast } from 'react-toastify';

const AdminUserCreation = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [studentData, setStudentData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    registerNumber: '',
    rollNumber: '',
    department: '',
    year: '',
    platformUrls: {
      github: '',
      leetcode: '',
      codeforces: '',
      atcoder: '',
      hackerrank: '',
      linkedin: ''
    }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested objects (platformUrls)
      const [parent, child] = name.split('.');
      setStudentData({
        ...studentData,
        [parent]: {
          ...studentData[parent],
          [child]: value
        }
      });
    } else {
      // Handle top-level fields
      setStudentData({
        ...studentData,
        [name]: value
      });
    }
  };

  // URL validation removed as per user request
  const validateUrls = () => {
    return true; // Accept all URLs without validation
  };

  const checkDuplicateEmail = async (email) => {
    try {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking duplicate email:', error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!studentData.name || !studentData.email) {
      toast.error('Name and email are required');
      return;
    }
    
    if (!validateUrls()) {
      return;
    }
    
    // Check for duplicate email in Firestore
    const isDuplicate = await checkDuplicateEmail(studentData.email);
    if (isDuplicate) {
      toast.error('A student with this email already exists');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Creating student account...');
      
      // Format platform URLs to ensure they have https://
      const formattedUrls = {};
      Object.entries(studentData.platformUrls).forEach(([platform, url]) => {
        if (!url) return;
        
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          formattedUrls[platform] = `https://${url}`;
        } else {
          formattedUrls[platform] = url;
        }
      });
      
      // Generate a secure temporary password (student should change this)
      const tempPassword = `Temp@${Math.random().toString(36).slice(2, 10)}${Date.now().toString().slice(-4)}`;
      
      console.log('Creating Firebase Auth account...');
      
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        studentData.email, 
        tempPassword
      );
      
      const userId = userCredential.user.uid;
      console.log('Auth account created. UID:', userId);
      
      // Prepare scraping status object
      const scrapingStatus = {};
      Object.keys(formattedUrls).forEach(platform => {
        if (formattedUrls[platform]) {
          scrapingStatus[platform] = 'pending';
        }
      });
      
      // Create comprehensive user document in Firestore
      const userDocument = {
        // Basic Information
        name: studentData.name.trim(),
        email: studentData.email.toLowerCase().trim(),
        displayName: studentData.name.trim(),
        phoneNumber: studentData.phoneNumber.trim() || '',
        
        // Academic Information
        registerNumber: studentData.registerNumber.trim() || '',
        rollNumber: studentData.rollNumber.trim() || '',
        department: studentData.department || '',
        year: studentData.year || '',
        
        // User Role
        role: 'student',
        isAdmin: false,
        
        // Timestamps
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: null,
        
        // Platform URLs (for web scraping)
        platformUrls: formattedUrls,
        
        // Platform Data (will be populated by backend scraper)
        platformData: {
          github: null,
          leetcode: null,
          codeforces: null,
          atcoder: null,
          hackerrank: null
        },
        
        // Scraping Status (for backend to track)
        scrapingStatus: {
          lastUpdated: new Date().toISOString(),
          ...scrapingStatus
        },
        
        // Performance Metrics
        totalSolved: 0,
        streak: 0,
        lastActivityDate: null,
        
        // Stats by platform (will be updated by scraper)
        stats: {
          github: { repos: 0, contributions: 0 },
          leetcode: { solved: 0, easy: 0, medium: 0, hard: 0 },
          codeforces: { rating: 0, maxRating: 0, problemsSolved: 0 },
          atcoder: { rating: 0, problemsSolved: 0 },
          hackerrank: { problemsSolved: 0, stars: 0 }
        }
      };
      
      console.log('Creating Firestore document...');
      await setDoc(doc(db, 'users', userId), userDocument);
      console.log('Firestore document created successfully');
      
      toast.success(`Student added successfully! Temporary password: ${tempPassword}`);
      toast.info('Please share the temporary password with the student', { autoClose: 10000 });
      
      // If there are platform URLs, the backend scraper will pick them up
      if (Object.keys(formattedUrls).length > 0) {
        toast.info('Profile scraping will be initiated by the backend', { autoClose: 5000 });
      }
      
      // Wait a bit for the user to see the password
      setTimeout(() => {
        navigate('/admin/students');
      }, 2000);
      
    } catch (error) {
      console.error('Error adding student:', error);
      
      // Provide specific error messages
      if (error.code === 'auth/email-already-in-use') {
        toast.error('This email is already registered in Firebase Auth');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Invalid email format');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Password is too weak');
      } else {
        toast.error(error.message || 'Error adding student');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStudentData({
      name: '',
      email: '',
      phoneNumber: '',
      registerNumber: '',
      rollNumber: '',
      department: '',
      year: '',
      platformUrls: {
        github: '',
        leetcode: '',
        codeforces: '',
        atcoder: '',
        hackerrank: '',
        linkedin: ''
      }
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Add New Student</h2>
        <button
          onClick={() => navigate('/admin/students')}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          ← Back to Students
        </button>
      </div>
      
      <form onSubmit={handleSubmit}>
        {/* Personal Information */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={studentData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter full name"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={studentData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="student@example.com"
              />
            </div>
            
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={studentData.phoneNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+91 1234567890"
              />
            </div>
            
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <select
                id="department"
                name="department"
                value={studentData.department}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Department</option>
                <option value="CSE">Computer Science & Engineering</option>
                <option value="IT">Information Technology</option>
                <option value="ECE">Electronics & Communication</option>
                <option value="EEE">Electrical & Electronics</option>
                <option value="MECH">Mechanical Engineering</option>
                <option value="CIVIL">Civil Engineering</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                Year of Study
              </label>
              <select
                id="year"
                name="year"
                value={studentData.year}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="registerNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Register Number
              </label>
              <input
                type="text"
                id="registerNumber"
                name="registerNumber"
                value={studentData.registerNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="REG12345"
              />
            </div>
            
            <div>
              <label htmlFor="rollNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Roll Number
              </label>
              <input
                type="text"
                id="rollNumber"
                name="rollNumber"
                value={studentData.rollNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ROLL123"
              />
            </div>
          </div>
        </div>
        
        {/* Coding Profiles */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b">
            Coding Profiles
            <span className="text-sm font-normal text-gray-500 ml-2">(URLs for web scraping)</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="github" className="block text-sm font-medium text-gray-700 mb-1">
                GitHub Profile
              </label>
              <input
                type="text"
                id="github"
                name="platformUrls.github"
                value={studentData.platformUrls.github}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://github.com/username"
              />
            </div>
            
            <div>
              <label htmlFor="leetcode" className="block text-sm font-medium text-gray-700 mb-1">
                LeetCode Profile
              </label>
              <input
                type="text"
                id="leetcode"
                name="platformUrls.leetcode"
                value={studentData.platformUrls.leetcode}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://leetcode.com/username"
              />
            </div>
            
            <div>
              <label htmlFor="codeforces" className="block text-sm font-medium text-gray-700 mb-1">
                Codeforces Profile
              </label>
              <input
                type="text"
                id="codeforces"
                name="platformUrls.codeforces"
                value={studentData.platformUrls.codeforces}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://codeforces.com/profile/username"
              />
            </div>
            
            <div>
              <label htmlFor="atcoder" className="block text-sm font-medium text-gray-700 mb-1">
                AtCoder Profile
              </label>
              <input
                type="text"
                id="atcoder"
                name="platformUrls.atcoder"
                value={studentData.platformUrls.atcoder}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://atcoder.jp/users/username"
              />
            </div>
            
            <div>
              <label htmlFor="hackerrank" className="block text-sm font-medium text-gray-700 mb-1">
                HackerRank Profile
              </label>
              <input
                type="text"
                id="hackerrank"
                name="platformUrls.hackerrank"
                value={studentData.platformUrls.hackerrank}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://www.hackerrank.com/username"
              />
            </div>
            
            <div>
              <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 mb-1">
                LinkedIn Profile
              </label>
              <input
                type="text"
                id="linkedin"
                name="platformUrls.linkedin"
                value={studentData.platformUrls.linkedin}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://www.linkedin.com/in/username"
              />
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> These URLs will be used by the backend web scraper to fetch student's coding activity and statistics.
            </p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={handleReset}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Reset Form
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/students')}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding Student...
              </span>
            ) : 'Add Student'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminUserCreation;