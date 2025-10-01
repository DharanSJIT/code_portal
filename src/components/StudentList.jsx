// src/components/StudentList.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase.js';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import StudentViewDetails from './StudentViewDetails';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  useEffect(() => {
    fetchStudents();
  }, []);
  
  const fetchStudents = async () => {
    try {
      setLoading(true);
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
      // toast.success(`Loaded ${studentsList.length} students`);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students: ' + error.message);
    } finally {
      setLoading(false);
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
      
      toast.success('Profile scraping initiated');
      
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
    
    return matchesSearch && matchesDepartment && matchesYear;
  });
  
  const departments = [...new Set(students.map(s => s.department).filter(Boolean))];
  const years = [...new Set(students.map(s => s.year).filter(Boolean))];

  const PlatformIcon = ({ platform }) => {
    const icons = {
      github: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
      ),
      leetcode: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16.102 17.93l-2.697 2.607c-.466.467-1.111.662-1.823.662s-1.357-.195-1.824-.662l-4.332-4.363c-.467-.467-.702-1.15-.702-1.863s.235-1.357.702-1.824l4.319-4.38c.467-.467 1.125-.645 1.837-.645s1.357.195 1.823.662l2.697 2.606c.514.515 1.365.497 1.9-.038.535-.536.553-1.387.039-1.901l-2.609-2.636a5.055 5.055 0 0 0-2.445-1.337l2.467-2.503c.516-.514.498-1.366-.037-1.901-.535-.535-1.387-.552-1.902-.038l-10.1 10.101c-.981.982-1.494 2.337-1.494 3.835 0 1.498.513 2.895 1.494 3.875l4.347 4.361c.981.979 2.337 1.452 3.834 1.452s2.853-.512 3.835-1.494l2.609-2.637c.514-.514.496-1.365-.039-1.9s-1.386-.553-1.899-.039zM20.811 13.01H10.666c-.702 0-1.27.604-1.27 1.346s.568 1.346 1.27 1.346h10.145c.701 0 1.27-.604 1.27-1.346s-.569-1.346-1.27-1.346z" />
        </svg>
      ),
      codeforces: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4.5 7.5C5.328 7.5 6 8.172 6 9v10.5c0 .828-.672 1.5-1.5 1.5h-3C.672 21 0 20.328 0 19.5V9c0-.828.672-1.5 1.5-1.5h3zm9.75-6c.828 0 1.5.672 1.5 1.5v15c0 .828-.672 1.5-1.5 1.5h-3c-.828 0-1.5-.672-1.5-1.5v-15c0-.828.672-1.5 1.5-1.5h3zm9.75 12c.828 0 1.5.672 1.5 1.5v4.5c0 .828-.672 1.5-1.5 1.5h-3c-.828 0-1.5-.672-1.5-1.5V15c0-.828.672-1.5 1.5-1.5h3z" />
        </svg>
      ),
      hackerrank: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c1.285 0 9.75 4.478 9.75 6.43C21.75 8.382 12 12 12 12s-9.75-3.618-9.75-5.57C2.25 4.478 10.715 0 12 0zm0 24c-1.285 0-9.75-4.478-9.75-6.43C2.25 15.618 12 12 12 12s9.75 3.618 9.75 5.57C21.75 19.522 13.285 24 12 24z" />
        </svg>
      ),
      atcoder: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0l3 7h7l-5.5 4 2 7-6.5-5-6.5 5 2-7L2 7h7z" />
        </svg>
      )
    };
    
    return icons[platform] || null;
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Student Directory</h1>
              <p className="text-gray-600">Manage student profiles and track coding platform activities</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchStudents}
                className="px-6 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-all font-semibold"
              >
                Refresh Data
              </button>
              <Link 
                to="/admin/add-student"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-lg shadow-blue-200"
              >
                Add New Student
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
            <p className="text-sm text-gray-600 mb-1">Total Students</p>
            <p className="text-3xl font-bold text-gray-900">{students.length}</p>
          </div>
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
            <p className="text-sm text-gray-600 mb-1">Active Now</p>
            <p className="text-3xl font-bold text-blue-600">{filteredStudents.length}</p>
          </div>
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
            <p className="text-sm text-gray-600 mb-1">Departments</p>
            <p className="text-3xl font-bold text-gray-900">{departments.length}</p>
          </div>
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
            <p className="text-sm text-gray-600 mb-1">Total Problems Solved</p>
            <p className="text-3xl font-bold text-green-600">
              {students.reduce((acc, s) => acc + (s.totalSolved || 0), 0)}
            </p>
          </div>
        </div>
        
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label htmlFor="search" className="block text-sm font-semibold text-gray-700 mb-2">
                Search Students
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Name, Email, Registration No..."
              />
            </div>
            
            <div>
              <label htmlFor="department" className="block text-sm font-semibold text-gray-700 mb-2">
                Filter by Department
              </label>
              <select
                id="department"
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="year" className="block text-sm font-semibold text-gray-700 mb-2">
                Filter by Year
              </label>
              <select
                id="year"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="">All Years</option>
                {years.map(year => (
                  <option key={year} value={year}>Year {year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-16 text-center">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mb-4"></div>
              <p className="text-gray-600 font-semibold text-lg">Loading student data...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-6xl">📚</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Students Yet</h3>
              <p className="text-gray-600 mb-8">Start building your student directory by adding your first student.</p>
              <Link
                to="/admin/add-student"
                className="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
              >
                Add First Student
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Registration
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Academic
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Platforms
                    </th>
                    {/* <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Solved
                    </th> */}
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map(student => (
                      <tr key={student.id} className="hover:bg-blue-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
                              {student.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="ml-4">
                              <div className="text-base font-bold text-gray-900">{student.name || 'No Name'}</div>
                              <div className="text-sm text-gray-600">{student.email || 'No Email'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900">{student.registerNumber || 'N/A'}</div>
                          <div className="text-sm text-gray-600">Roll: {student.rollNumber || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900">{student.department || 'N/A'}</div>
                          <div className="text-sm text-gray-600">Year {student.year || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {student.platformUrls?.github && (
                              <a 
                                href={student.platformUrls.github} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-900 hover:text-white transition-all"
                                title="GitHub"
                              >
                                <PlatformIcon platform="github" />
                              </a>
                            )}
                            {student.platformUrls?.leetcode && (
                              <a 
                                href={student.platformUrls.leetcode} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-2 bg-gray-100 rounded-lg hover:bg-yellow-500 hover:text-white transition-all"
                                title="LeetCode"
                              >
                                <PlatformIcon platform="leetcode" />
                              </a>
                            )}
                            {student.platformUrls?.codeforces && (
                              <a 
                                href={student.platformUrls.codeforces} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-2 bg-gray-100 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                                title="Codeforces"
                              >
                                <PlatformIcon platform="codeforces" />
                              </a>
                            )}
                            {student.platformUrls?.hackerrank && (
                              <a 
                                href={student.platformUrls.hackerrank} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-2 bg-gray-100 rounded-lg hover:bg-green-600 hover:text-white transition-all"
                                title="HackerRank"
                              >
                                <PlatformIcon platform="hackerrank" />
                              </a>
                            )}
                            {student.platformUrls?.atcoder && (
                              <a 
                                href={student.platformUrls.atcoder} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-800 hover:text-white transition-all"
                                title="AtCoder"
                              >
                                <PlatformIcon platform="atcoder" />
                              </a>
                            )}
                            {(!student.platformUrls || Object.values(student.platformUrls).every(url => !url)) && (
                              <span className="text-xs text-gray-500 py-2">No profiles</span>
                            )}
                          </div>
                        </td>
                        {/* <td className="px-6 py-4 text-center">
                          <span className="inline-block px-4 py-2 bg-blue-100 text-blue-900 rounded-lg font-bold text-lg">
                            {student.totalSolved || 0}
                          </span>
                        </td> */}
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleViewDetails(student)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
                            >
                              View Details
                            </button>
                            
                            <button
                              onClick={() => handleInitiateScraping(student.id, student.platformUrls)}
                              className="px-4 py-2 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:border-green-500 hover:text-green-600 transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={!student.platformUrls || Object.values(student.platformUrls).every(url => !url)}
                            >
                              Scrape
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <p className="text-gray-600 mb-4 text-lg">No students match your search criteria</p>
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setFilterDepartment('');
                            setFilterYear('');
                          }}
                          className="text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          Clear All Filters
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && selectedStudent && (
        <StudentViewDetails 
          student={selectedStudent} 
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default StudentList;