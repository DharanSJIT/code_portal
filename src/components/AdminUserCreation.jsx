// src/components/AdminUserCreation.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase.js';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
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

  const validateUrls = () => {
    const urlRegex = /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(\/\S*)?$/i;
    const urls = studentData.platformUrls;
    
    // Validate each URL if it's not empty
    for (const [platform, url] of Object.entries(urls)) {
      if (url && !urlRegex.test(url)) {
        toast.error(`Invalid ${platform} URL format`);
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateUrls()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Add basic validation
      if (!studentData.name || !studentData.email) {
        toast.error('Name and email are required');
        return;
      }
      
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
      
      // Generate temporary password
      const tempPassword = Math.random().toString(36).slice(2, 10);
      
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        studentData.email, 
        tempPassword
      );
      
      const userId = userCredential.user.uid;
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', userId), {
        name: studentData.name,
        email: studentData.email,
        phoneNumber: studentData.phoneNumber || '',
        registerNumber: studentData.registerNumber || '',
        rollNumber: studentData.rollNumber || '',
        department: studentData.department || '',
        year: studentData.year || '',
        role: 'student',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        totalSolved: 0,
        streak: 0,
        platformUrls: formattedUrls,
        platformData: {},
        scrapingStatus: {}
      });
      
      toast.success('Student added successfully!');
      
      // Initiate scraping if there are any platform URLs
      if (Object.values(formattedUrls).some(url => url)) {
        try {
          // In a frontend app, you would typically call an API endpoint here
          // For now, we'll just update the status in Firestore
          await setDoc(doc(db, 'users', userId), {
            scrapingStatus: {
              lastUpdated: new Date().toISOString(),
              ...Object.keys(formattedUrls).reduce((acc, platform) => {
                if (formattedUrls[platform]) {
                  acc[platform] = 'pending';
                }
                return acc;
              }, {})
            }
          }, { merge: true });
          
          toast.info('Profile scraping initiated');
          
          // Redirect to student list
          navigate('/admin/students');
        } catch (error) {
          console.error('Error initiating scraping:', error);
          toast.error('Error initiating profile scraping');
        }
      } else {
        // Redirect to student list
        navigate('/admin/students');
      }
      
      // Clear the form
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
      
    } catch (error) {
      console.error('Error adding student:', error);
      toast.error(error.message || 'Error adding student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Student</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name*
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
                Email Address*
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={studentData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email address"
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
                placeholder="Enter phone number"
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
                <option value="CSE">Computer Science</option>
                <option value="IT">Information Technology</option>
                <option value="ECE">Electronics & Communication</option>
                <option value="EEE">Electrical & Electronics</option>
                <option value="MECH">Mechanical</option>
                <option value="CIVIL">Civil</option>
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
                placeholder="Enter register number"
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
                placeholder="Enter roll number"
              />
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b">Coding Profiles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="github" className="block text-sm font-medium text-gray-700 mb-1">
                GitHub
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
                LeetCode
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
                Codeforces
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
                AtCoder
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
                HackerRank
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
                LinkedIn
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
        </div>
        
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/admin/students')}
            className="px-4 py-2 mr-4 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400"
          >
            {loading ? 'Adding...' : 'Add Student'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminUserCreation;
