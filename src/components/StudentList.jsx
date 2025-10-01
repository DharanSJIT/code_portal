import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase.js';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import StudentViewDetails from './StudentViewDetails';
import { motion, AnimatePresence } from 'framer-motion';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterCollege, setFilterCollege] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  useEffect(() => {
    fetchStudents();
  }, []);
  
  const fetchStudents = async () => {
    try {
      setLoading(true);
      setIsRefreshing(true);
      console.log('Fetching students from Firestore...');
      
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'student'));
      const snapshot = await getDocs(q);
      
      console.log('Found', snapshot.size, 'students');
      
      const studentsList = [];
      snapshot.forEach(doc => {
        studentsList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setStudents(studentsList);
      // toast.success('Student data refreshed successfully!');
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students: ' + error.message);
    } finally {
      setLoading(false);
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };
  
  const handleInitiateScraping = async (studentId, platformUrls) => {
    if (!platformUrls || Object.values(platformUrls).every(url => !url)) {
      toast.error('No profile URLs found for this student');
      return;
    }
    
    try {
      console.log('Initiating scraping for student:', studentId);
      
      const updateData = {
        'scrapingStatus.lastUpdated': new Date().toISOString()
      };
      
      Object.keys(platformUrls).forEach(platform => {
        if (platformUrls[platform]) {
          updateData[`scrapingStatus.${platform}`] = 'pending';
        }
      });
      
      const studentRef = doc(db, 'users', studentId);
      await updateDoc(studentRef, updateData);
      
      // toast.success('Profile scraping initiated');
      
      setTimeout(() => {
        fetchStudents();
      }, 1000);
    } catch (error) {
      console.error('Error initiating scraping:', error);
      toast.error('Failed to initiate scraping: ' + error.message);
    }
  };

  const handleViewDetails = (student) => {
    setSelectedStudent(student);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedStudent(null);
  };
  
  const filteredStudents = students.filter(student => {
    const matchesSearch = searchTerm === '' || 
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.registerNumber && student.registerNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (student.rollNumber && student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesDepartment = filterDepartment === '' || student.department === filterDepartment;
    const matchesYear = filterYear === '' || student.year === filterYear;
    const matchesCollege = filterCollege === '' || student.college === filterCollege;
    
    return matchesSearch && matchesDepartment && matchesYear && matchesCollege;
  });
  
  const departments = [...new Set(students.map(s => s.department).filter(Boolean))];
  const years = [...new Set(students.map(s => s.year).filter(Boolean))];
  const colleges = [...new Set(students.map(s => s.college).filter(Boolean))];

  const PlatformIcon = ({ platform }) => {
    const icons = {
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
      hackerrank: (
        <svg className="w-5 h-5" fill="#00EA64" viewBox="0 0 24 24">
          <path d="M12 0c1.285 0 9.75 4.886 10.392 6 .645 1.115.645 10.885 0 12S13.287 24 12 24s-9.75-4.885-10.395-6c-.641-1.115-.641-10.885 0-12C2.25 4.886 10.715 0 12 0zm2.295 6.799c-.141 0-.258.115-.258.258v3.875H9.963V6.908c0-.141-.116-.258-.258-.258H8.279c-.141 0-.258.115-.258.258v10.018c0 .143.117.258.258.258h1.426c.142 0 .258-.115.258-.258v-4.09h4.074v4.09c0 .143.116.258.258.258h1.426c.141 0 .258-.115.258-.258V6.908c0-.141-.117-.258-.258-.258h-1.426z"/>
        </svg>
      ),
      atcoder: (
        <svg className="w-5 h-5" fill="#000000" viewBox="0 0 24 24">
          <path d="M12 0l-8 4v8l8 4 8-4V4l-8-4zm0 2.208L17.385 5 12 7.792 6.615 5 12 2.208zM5 6.5l6 3v7l-6-3v-7zm8 10v-7l6-3v7l-6 3zm-1-12.5l5 2.5-5 2.5-5-2.5 5-2.5z"/>
        </svg>
      ),
      linkedin: (
        <svg className="w-5 h-5" fill="#0A66C2" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      )
    };
    
    return icons[platform] || null;
  };
  
  return (
    <motion.div
      className="min-h-screen bg-slate-50 p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Student Directory</h1>
              <p className="text-slate-600">Manage student profiles and track coding platform activities</p>
            </div>
            <div className="flex gap-3">
              <motion.button
                onClick={fetchStudents}
                className={`px-6 py-3 bg-white text-slate-700 border-2 border-slate-300 rounded-lg transition-all font-semibold flex items-center gap-2 hover:shadow-md ${isRefreshing ? 'border-blue-500' : 'hover:border-blue-500 hover:text-blue-600'}`}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={isRefreshing}
              >
                <motion.svg 
                  className={`w-5 h-5 ${isRefreshing ? 'text-blue-600' : 'text-slate-500'}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  animate={{ rotate: isRefreshing ? 360 : 0 }}
                  transition={{ 
                    duration: 1, 
                    repeat: isRefreshing ? Infinity : 0,
                    ease: "linear"
                  }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </motion.svg>
                {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
              </motion.button>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Link 
                  to="/admin/add-student"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-lg flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add New Student
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          className="bg-white border-2 border-slate-200 rounded-xl p-6 mb-8 shadow-sm hover:shadow-md transition-all"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            {/* <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg> */}
            Filter Students
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label htmlFor="search" className="block text-sm font-semibold text-slate-700 mb-2">
                Search Students
              </label>
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="relative"
              >
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-10 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Name, Email, Registration No..."
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </motion.div>
            </div>

            <div>
              <label htmlFor="college" className="block text-sm font-semibold text-slate-700 mb-2">
                Filter by College
              </label>
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="relative"
              >
                <select
                  id="college"
                  value={filterCollege}
                  onChange={(e) => setFilterCollege(e.target.value)}
                  className="w-full px-4 py-3 pl-4 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors bg-white appearance-none"
                >
                  <option value="">All Colleges</option>
                  {colleges.length > 0 ? (
                    colleges.map(college => (
                      <option key={college} value={college}>{college}</option>
                    ))
                  ) : (
                    <>
                      <option value="Engineering">Engineering</option>
                      <option value="Technology">Technology</option>
                    </>
                  )}
                </select>
                {/* <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div> */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </motion.div>
            </div>
            
            <div>
              <label htmlFor="department" className="block text-sm font-semibold text-slate-700 mb-2">
                Filter by Department
              </label>
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="relative"
              >
                <select
                  id="department"
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="w-full px-4 py-3 pl-4 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors bg-white appearance-none"
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {/* <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div> */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </motion.div>
            </div>
            
            <div>
              <label htmlFor="year" className="block text-sm font-semibold text-slate-700 mb-2">
                Filter by Year
              </label>
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="relative"
              >
                <select
                  id="year"
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="w-full px-4 py-3 pl-4 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors bg-white appearance-none"
                >
                  <option value="">All Years</option>
                  {years.map(year => (
                    <option key={year} value={year}>Year {year}</option>
                  ))}
                </select>
                {/* <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div> */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </motion.div>
            </div>
          </div>
          
          <AnimatePresence>
            {(searchTerm || filterDepartment || filterYear || filterCollege) && (
              <motion.div 
                className="mt-4 flex justify-end"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <motion.button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterDepartment('');
                    setFilterYear('');
                    setFilterCollege('');
                  }}
                  className="px-4 py-2 text-sm font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear All Filters
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        
        <motion.div 
          className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          {loading ? (
            <div className="p-16 text-center">
              <motion.div 
                className="inline-block rounded-full h-16 w-16 border-4 border-slate-200 border-t-blue-600 mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <p className="text-slate-600 font-semibold text-lg">Loading student data...</p>
            </div>
          ) : students.length === 0 ? (
            <motion.div 
              className="p-16 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="w-32 h-32 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6"
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  repeatType: "reverse" 
                }}
              >
                <svg className="w-16 h-16 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </motion.div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">No Students Yet</h3>
              <p className="text-slate-600 mb-8">Start building your student directory by adding your first student.</p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/admin/add-student"
                  className="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg flex items-center gap-2 mx-auto justify-center"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add First Student
                </Link>
              </motion.div>
            </motion.div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b-2 border-slate-200">
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Registration
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Academic
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Platforms
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <AnimatePresence>
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student, index) => (
                        <motion.tr 
                          key={student.id} 
                          className="hover:bg-blue-50 transition-colors"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          exit={{ opacity: 0, y: -20 }}
                          whileHover={{ backgroundColor: "rgba(239, 246, 255, 0.6)" }}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <motion.div 
                                className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                {student.name?.charAt(0).toUpperCase() || '?'}
                              </motion.div>
                              <div className="ml-4">
                                <div className="text-base font-bold text-slate-900">{student.name || 'No Name'}</div>
                                <div className="text-sm text-slate-600">{student.email || 'No Email'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-slate-900">{student.registerNumber || 'N/A'}</div>
                            <div className="text-sm text-slate-600">Roll: {student.rollNumber || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-slate-900">{student.department || 'N/A'}</div>
                            <div className="text-sm text-slate-600">Year {student.year || 'N/A'}</div>
                            {student.college && (
                              <motion.div 
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ 
                                  type: "spring", 
                                  stiffness: 500,
                                  damping: 30 
                                }}
                              >
                                {student.college}
                              </motion.div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2 flex-wrap">
                              {student.platformUrls?.github && (
                                <motion.a 
                                  href={student.platformUrls.github} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all"
                                  title="GitHub"
                                  whileHover={{ scale: 1.15, rotate: 5 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <PlatformIcon platform="github" />
                                </motion.a>
                              )}
                              {student.platformUrls?.leetcode && (
                                <motion.a 
                                  href={student.platformUrls.leetcode} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="p-2 bg-slate-100 rounded-lg hover:bg-orange-50 transition-all"
                                  title="LeetCode"
                                  whileHover={{ scale: 1.15, rotate: -5 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <PlatformIcon platform="leetcode" />
                                </motion.a>
                              )}
                              {student.platformUrls?.codeforces && (
                                <motion.a 
                                  href={student.platformUrls.codeforces} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="p-2 bg-slate-100 rounded-lg hover:bg-blue-50 transition-all"
                                  title="Codeforces"
                                  whileHover={{ scale: 1.15, rotate: 5 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <PlatformIcon platform="codeforces" />
                                </motion.a>
                              )}
                              {student.platformUrls?.hackerrank && (
                                <motion.a 
                                  href={student.platformUrls.hackerrank} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="p-2 bg-slate-100 rounded-lg hover:bg-green-50 transition-all"
                                  title="HackerRank"
                                  whileHover={{ scale: 1.15, rotate: -5 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <PlatformIcon platform="hackerrank" />
                                </motion.a>
                              )}
                              {student.platformUrls?.atcoder && (
                                <motion.a 
                                  href={student.platformUrls.atcoder} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all"
                                  title="AtCoder"
                                  whileHover={{ scale: 1.15, rotate: 5 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <PlatformIcon platform="atcoder" />
                                </motion.a>
                              )}
                              {student.platformUrls?.linkedin && (
                                <motion.a 
                                  href={student.platformUrls.linkedin} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="p-2 bg-slate-100 rounded-lg hover:bg-blue-50 transition-all"
                                  title="LinkedIn"
                                  whileHover={{ scale: 1.15, rotate: -5 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <PlatformIcon platform="linkedin" />
                                </motion.a>
                              )}
                              {(!student.platformUrls || Object.values(student.platformUrls).every(url => !url)) && (
                                <span className="text-xs text-slate-500 py-2">No profiles</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              <motion.button
                                onClick={() => handleViewDetails(student)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm flex items-center gap-1"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View
                              </motion.button>
                              
                              <motion.button
                                onClick={() => handleInitiateScraping(student.id, student.platformUrls)}
                                className="px-4 py-2 bg-white text-slate-700 border-2 border-slate-300 rounded-lg hover:border-green-500 hover:text-green-600 transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                whileHover={!(!student.platformUrls || Object.values(student.platformUrls).every(url => !url)) ? { scale: 1.05 } : {}}
                                whileTap={!(!student.platformUrls || Object.values(student.platformUrls).every(url => !url)) ? { scale: 0.95 } : {}}
                                disabled={!student.platformUrls || Object.values(student.platformUrls).every(url => !url)}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Scrape
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <td colSpan="5" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <motion.svg 
                              className="w-16 h-16 text-slate-300 mb-4"
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                              animate={{
                                scale: [1, 1.1, 1],
                                rotate: [0, 10, -10, 0]
                              }}
                              transition={{
                                duration: 3,
                                repeat: Infinity,
                                repeatType: "reverse"
                              }}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </motion.svg>
                            <p className="text-slate-600 mb-4 text-lg font-medium">No students match your search criteria</p>
                            <motion.button
                              onClick={() => {
                                setSearchTerm('');
                                setFilterDepartment('');
                                setFilterYear('');
                                setFilterCollege('');
                              }}
                              className="px-6 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-semibold rounded-lg transition-colors flex items-center gap-2"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Clear All Filters
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {showModal && selectedStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 overflow-y-auto"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeModal}></div>
            <motion.div
              className="relative z-10"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30 
              }}
            >
              <StudentViewDetails 
                student={selectedStudent} 
                onClose={closeModal}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StudentList;
