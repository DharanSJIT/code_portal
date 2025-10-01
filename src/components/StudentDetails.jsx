// src/components/StudentDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase.js';
import { toast } from 'react-toastify';

const StudentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [student, setStudent] = useState(null);
  const [formData, setFormData] = useState({
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

  // Fetch student details on component mount
  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true);
        const studentDoc = await db.collection('users').doc(id).get();
        
        if (!studentDoc.exists) {
          toast.error('Student not found');
          navigate('/admin/students');
          return;
        }
        
        const studentData = studentDoc.data();
        setStudent(studentData);
        
        // Set form data
        setFormData({
          name: studentData.name || '',
          email: studentData.email || '',
          phoneNumber: studentData.phoneNumber || '',
          registerNumber: studentData.registerNumber || '',
          rollNumber: studentData.rollNumber || '',
          department: studentData.department || '',
          year: studentData.year || '',
          platformUrls: {
            github: studentData.platformUrls?.github || '',
            leetcode: studentData.platformUrls?.leetcode || '',
            codeforces: studentData.platformUrls?.codeforces || '',
            atcoder: studentData.platformUrls?.atcoder || '',
            hackerrank: studentData.platformUrls?.hackerrank || '',
            linkedin: studentData.platformUrls?.linkedin || ''
          }
        });
      } catch (error) {
        console.error('Error fetching student details:', error);
        toast.error('Error loading student details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudent();
  }, [id, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested objects (platformUrls)
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      // Handle top-level fields
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const validateUrls = () => {
    const urlRegex = /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(\/\S*)?$/i;
    const urls = formData.platformUrls;
    
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
      
      // Format platform URLs to ensure they have https://
      const formattedUrls = {};
      Object.entries(formData.platformUrls).forEach(([platform, url]) => {
        if (!url) return;
        
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          formattedUrls[platform] = `https://${url}`;
        } else {
          formattedUrls[platform] = url;
        }
      });
      
      // Update user document
      await db.collection('users').doc(id).update({
        name: formData.name,
        phoneNumber: formData.phoneNumber || '',
        registerNumber: formData.registerNumber || '',
        rollNumber: formData.rollNumber || '',
        department: formData.department || '',
        year: formData.year || '',
        platformUrls: formattedUrls,
        lastUpdated: new Date().toISOString()
      });
      
      toast.success('Student updated successfully');
      
      // Refresh student data
      const updatedDoc = await db.collection('users').doc(id).get();
      setStudent(updatedDoc.data());
      
    } catch (error) {
      console.error('Error updating student:', error);
      toast.error('Failed to update student');
    } finally {
      setLoading(false);
    }
  };

  const handleScrapingInitiate = async () => {
    const platformUrls = student.platformUrls;
    
    if (!platformUrls || Object.values(platformUrls).every(url => !url)) {
      toast.error('No profile URLs found for this student');
      return;
    }
    
    try {
      setScraping(true);
      
      // Update scraping status to pending
      await db.collection('users').doc(id).update({
        'scrapingStatus.lastUpdated': new Date().toISOString(),
        ...Object.keys(platformUrls).reduce((acc, platform) => {
          if (platformUrls[platform]) {
            acc[`scrapingStatus.${platform}`] = 'pending';
          }
          return acc;
        }, {})
      });
      
      // In a real app, this would be an API call to your scraping service
      toast.info('Profile scraping initiated');
      
      // Refresh student data after a short delay
      setTimeout(async () => {
        const updatedDoc = await db.collection('users').doc(id).get();
        setStudent(updatedDoc.data());
        setScraping(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error initiating scraping:', error);
      toast.error('Failed to initiate scraping');
      setScraping(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      try {
        setLoading(true);
        await db.collection('users').doc(id).delete();
        toast.success('Student deleted successfully');
        navigate('/admin/students');
      } catch (error) {
        console.error('Error deleting student:', error);
        toast.error('Failed to delete student');
        setLoading(false);
      }
    }
  };

  if (loading && !student) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Student Details</h1>
        <div className="space-x-3">
          <button
            onClick={() => navigate('/admin/students')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
          >
            Back to List
          </button>
          <button
            onClick={handleDeleteStudent}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
            disabled={loading}
          >
            Delete Student
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Form */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-800">Edit Student Information</h2>
          </div>
          
          <div className="p-6">
            <form onSubmit={handleSubmit}>
              {/* Personal Information */}
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-3 pb-2 border-b">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name*
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter full name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      disabled
                      className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-500"
                      placeholder="Email cannot be changed"
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
                      value={formData.phoneNumber}
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
                      value={formData.department}
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
                      value={formData.year}
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
                      value={formData.registerNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter register number"
                    />
                  </div>
                  
                  <div>
                    // src/components/StudentDetails.jsx (continued)
                    <label htmlFor="rollNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Roll Number
                    </label>
                    <input
                      type="text"
                      id="rollNumber"
                      name="rollNumber"
                      value={formData.rollNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter roll number"
                    />
                  </div>
                </div>
              </div>
              
              {/* Coding Profiles */}
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-3 pb-2 border-b">Coding Profiles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="github" className="block text-sm font-medium text-gray-700 mb-1">
                      GitHub
                    </label>
                    <input
                      type="text"
                      id="github"
                      name="platformUrls.github"
                      value={formData.platformUrls.github}
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
                      value={formData.platformUrls.leetcode}
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
                      value={formData.platformUrls.codeforces}
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
                      value={formData.platformUrls.atcoder}
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
                      value={formData.platformUrls.hackerrank}
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
                      value={formData.platformUrls.linkedin}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://www.linkedin.com/in/username"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => navigate('/admin/students')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Student Stats */}
        <div className="space-y-6">
          {/* Student Profile */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800">Profile Summary</h2>
            </div>
            <div className="p-6">
              <div className="flex items-center">
                <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-3xl">
                  {student?.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="ml-5">
                  <h3 className="text-xl font-semibold text-gray-800">{student?.name}</h3>
                  <p className="text-gray-600">{student?.email}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {student?.department} {student?.year && `• Year ${student.year}`}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-gray-200 pt-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500">Problems Solved</h4>
                  <p className="text-2xl font-semibold text-blue-600">{student?.totalSolved || 0}</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500">Current Streak</h4>
                  <p className="text-2xl font-semibold text-green-600">{student?.streak || 0}</p>
                </div>
              </div>
              
              <div className="mt-6">
                <button
                  onClick={handleScrapingInitiate}
                  disabled={scraping || !student?.platformUrls || Object.values(student.platformUrls).every(url => !url)}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400"
                >
                  {scraping ? 'Scraping in Progress...' : 'Scrape Profiles Now'}
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Last updated: {student?.lastUpdated ? new Date(student.lastUpdated).toLocaleString() : 'Never'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Scraping Status */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800">Scraping Status</h2>
            </div>
            <div className="p-4">
              {student?.scrapingStatus && Object.keys(student.scrapingStatus).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(student.scrapingStatus)
                    .filter(([key]) => key !== 'lastUpdated')
                    .map(([platform, status]) => (
                      <div key={platform} className="flex justify-between items-center">
                        <span className="capitalize text-gray-700">{platform}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          status === 'completed' ? 'bg-green-100 text-green-800' :
                          status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          status === 'pending' ? 'bg-blue-100 text-blue-800' :
                          status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {status}
                        </span>
                      </div>
                    ))}
                  
                  <p className="text-xs text-gray-500 mt-2">
                    Last scraping: {student.scrapingStatus.lastUpdated ? 
                      new Date(student.scrapingStatus.lastUpdated).toLocaleString() : 
                      'Never'}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-600 py-2">No scraping has been performed yet.</p>
              )}
            </div>
          </div>
          
          {/* Platform Data */}
          {student?.platformData && Object.keys(student.platformData).length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-800">Platform Data</h2>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  {Object.entries(student.platformData).map(([platform, data]) => (
                    <div key={platform} className="border rounded-lg p-3">
                      <h3 className="text-sm font-medium text-gray-800 capitalize mb-2">{platform}</h3>
                      <div className="space-y-1 text-sm">
                        {Object.entries(data)
                          .filter(([key]) => key !== 'lastUpdated')
                          .map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-gray-500">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                              <span className="font-medium">{value}</span>
                            </div>
                          ))}
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        Updated: {data.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : 'Unknown'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDetails;
