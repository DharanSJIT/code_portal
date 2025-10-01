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
    college: '',
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
      const [parent, child] = name.split('.');
      setStudentData({
        ...studentData,
        [parent]: {
          ...studentData[parent],
          [child]: value
        }
      });
    } else {
      setStudentData({
        ...studentData,
        [name]: value
      });
    }
  };

  const validateUrls = () => {
    return true;
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
    
    if (!studentData.name || !studentData.email) {
      toast.error('Name and email are required');
      return;
    }
    
    if (!validateUrls()) {
      return;
    }
    
    const isDuplicate = await checkDuplicateEmail(studentData.email);
    if (isDuplicate) {
      toast.error('A student with this email already exists');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Creating student account...');
      
      const formattedUrls = {};
      Object.entries(studentData.platformUrls).forEach(([platform, url]) => {
        if (!url) return;
        
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          formattedUrls[platform] = `https://${url}`;
        } else {
          formattedUrls[platform] = url;
        }
      });
      
      const tempPassword = `Temp@${Math.random().toString(36).slice(2, 10)}${Date.now().toString().slice(-4)}`;
      
      console.log('Creating Firebase Auth account...');
      
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        studentData.email, 
        tempPassword
      );
      
      const userId = userCredential.user.uid;
      console.log('Auth account created. UID:', userId);
      
      const scrapingStatus = {};
      Object.keys(formattedUrls).forEach(platform => {
        if (formattedUrls[platform]) {
          scrapingStatus[platform] = 'pending';
        }
      });
      
      const userDocument = {
        name: studentData.name.trim(),
        email: studentData.email.toLowerCase().trim(),
        displayName: studentData.name.trim(),
        phoneNumber: studentData.phoneNumber.trim() || '',
        registerNumber: studentData.registerNumber.trim() || '',
        rollNumber: studentData.rollNumber.trim() || '',
        department: studentData.department || '',
        year: studentData.year || '',
        college: studentData.college || '',
        role: 'student',
        isAdmin: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: null,
        platformUrls: formattedUrls,
        platformData: {
          github: null,
          leetcode: null,
          codeforces: null,
          atcoder: null,
          hackerrank: null
        },
        scrapingStatus: {
          lastUpdated: new Date().toISOString(),
          ...scrapingStatus
        },
        totalSolved: 0,
        streak: 0,
        lastActivityDate: null,
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
      
      if (Object.keys(formattedUrls).length > 0) {
        toast.info('Profile scraping will be initiated by the backend', { autoClose: 5000 });
      }
      
      setTimeout(() => {
        navigate('/admin/students');
      }, 2000);
      
    } catch (error) {
      console.error('Error adding student:', error);
      
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
      college: '',
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

  const platformIcons = {
    github: (
      <svg className="w-5 h-5" fill="#181717" viewBox="0 0 24 24">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
      </svg>
    ),
    leetcode: (
      <svg className="w-5 h-5" fill="#FFA116" viewBox="0 0 24 24">
        <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/>
      </svg>
    ),
    codeforces: (
      <svg className="w-5 h-5" fill="#1F8ACB" viewBox="0 0 24 24">
        <path d="M4.5 7.5C5.328 7.5 6 8.172 6 9v10.5c0 .828-.672 1.5-1.5 1.5h-3C.672 21 0 20.328 0 19.5V9c0-.828.672-1.5 1.5-1.5h3zm9-4.5c.828 0 1.5.672 1.5 1.5v15c0 .828-.672 1.5-1.5 1.5h-3c-.828 0-1.5-.672-1.5-1.5v-15c0-.828.672-1.5 1.5-1.5h3zm9 7.5c.828 0 1.5.672 1.5 1.5v7.5c0 .828-.672 1.5-1.5 1.5h-3c-.828 0-1.5-.672-1.5-1.5V12c0-.828.672-1.5 1.5-1.5h3z"/>
      </svg>
    ),
    atcoder: (
      <svg className="w-5 h-5" fill="#000000" viewBox="0 0 24 24">
        <path d="M12 0l-8 4v8l8 4 8-4V4l-8-4zm0 2.208L17.385 5 12 7.792 6.615 5 12 2.208zM5 6.5l6 3v7l-6-3v-7zm8 10v-7l6-3v7l-6 3zm-1-12.5l5 2.5-5 2.5-5-2.5 5-2.5z"/>
      </svg>
    ),
    hackerrank: (
      <svg className="w-5 h-5" fill="#00EA64" viewBox="0 0 24 24">
        <path d="M12 0c1.285 0 9.75 4.886 10.392 6 .645 1.115.645 10.885 0 12S13.287 24 12 24s-9.75-4.885-10.395-6c-.641-1.115-.641-10.885 0-12C2.25 4.886 10.715 0 12 0zm2.295 6.799c-.141 0-.258.115-.258.258v3.875H9.963V6.908c0-.141-.116-.258-.258-.258H8.279c-.141 0-.258.115-.258.258v10.018c0 .143.117.258.258.258h1.426c.142 0 .258-.115.258-.258v-4.09h4.074v4.09c0 .143.116.258.258.258h1.426c.141 0 .258-.115.258-.258V6.908c0-.141-.117-.258-.258-.258h-1.426z"/>
      </svg>
    ),
    linkedin: (
      <svg className="w-5 h-5" fill="#0A66C2" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    )
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
              <label htmlFor="college" className="block text-sm font-medium text-gray-700 mb-1">
                College
              </label>
              <select
                id="college"
                name="college"
                value={studentData.college}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select College</option>
                <option value="Engineering">Engineering</option>
                <option value="Technology">Technology</option>
              </select>
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
                <option value="AI">AI & ML</option>
                <option value="ADS">ADS</option>
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
        
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b">
            Coding Profiles
            <span className="text-sm font-normal text-gray-500 ml-2">(URLs for web scraping)</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="github" className="flex items-center text-sm font-medium text-gray-700 mb-1">
                {platformIcons.github}
                <span className="ml-2">GitHub Profile</span>
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
              <label htmlFor="leetcode" className="flex items-center text-sm font-medium text-gray-700 mb-1">
                {platformIcons.leetcode}
                <span className="ml-2">LeetCode Profile</span>
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
              <label htmlFor="codeforces" className="flex items-center text-sm font-medium text-gray-700 mb-1">
                {platformIcons.codeforces}
                <span className="ml-2">Codeforces Profile</span>
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
              <label htmlFor="atcoder" className="flex items-center text-sm font-medium text-gray-700 mb-1">
                {platformIcons.atcoder}
                <span className="ml-2">AtCoder Profile</span>
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
              <label htmlFor="hackerrank" className="flex items-center text-sm font-medium text-gray-700 mb-1">
                {platformIcons.hackerrank}
                <span className="ml-2">HackerRank Profile</span>
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
              <label htmlFor="linkedin" className="flex items-center text-sm font-medium text-gray-700 mb-1">
                {platformIcons.linkedin}
                <span className="ml-2">LinkedIn Profile</span>
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