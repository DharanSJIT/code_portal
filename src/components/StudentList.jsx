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
  const [filterCollege, setFilterCollege] = useState('');
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
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-lg"
              >
                Add New Student
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-400 transition-all">
            <p className="text-sm text-gray-600 mb-1 font-medium">Total Students</p>
            <p className="text-3xl font-bold text-gray-900">{students.length}</p>
          </div>
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-400 transition-all">
            <p className="text-sm text-gray-600 mb-1 font-medium">Filtered Results</p>
            <p className="text-3xl font-bold text-blue-600">{filteredStudents.length}</p>
          </div>
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-400 transition-all">
            <p className="text-sm text-gray-600 mb-1 font-medium">Departments</p>
            <p className="text-3xl font-bold text-gray-900">{departments.length}</p>
          </div>
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-400 transition-all">
            <p className="text-sm text-gray-600 mb-1 font-medium">Total Problems Solved</p>
            <p className="text-3xl font-bold text-green-600">
              {students.reduce((acc, s) => acc + (s.totalSolved || 0), 0)}
            </p>
          </div>
        </div>
        
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-8 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Filter Students</h3>
          <div className="grid grid-cols-4 gap-6">
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
              <label htmlFor="college" className="block text-sm font-semibold text-gray-700 mb-2">
                Filter by College
              </label>
              <select
                id="college"
                value={filterCollege}
                onChange={(e) => setFilterCollege(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors bg-white"
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
            </div>
            
            <div>
              <label htmlFor="department" className="block text-sm font-semibold text-gray-700 mb-2">
                Filter by Department
              </label>
              <select
                id="department"
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors bg-white"
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
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors bg-white"
              >
                <option value="">All Years</option>
                {years.map(year => (
                  <option key={year} value={year}>Year {year}</option>
                ))}
              </select>
            </div>
          </div>
          
          {(searchTerm || filterDepartment || filterYear || filterCollege) && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterDepartment('');
                  setFilterYear('');
                  setFilterCollege('');
                }}
                className="px-4 py-2 text-sm font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
        
        <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-16 text-center">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mb-4"></div>
              <p className="text-gray-600 font-semibold text-lg">Loading student data...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
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
                            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
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
                          {student.college && (
                            <div className="text-xs text-blue-600 font-medium mt-1">{student.college}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 flex-wrap">
                            {student.platformUrls?.github && (
                              <a 
                                href={student.platformUrls.github} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
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
                                className="p-2 bg-gray-100 rounded-lg hover:bg-orange-50 transition-all"
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
                                className="p-2 bg-gray-100 rounded-lg hover:bg-blue-50 transition-all"
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
                                className="p-2 bg-gray-100 rounded-lg hover:bg-green-50 transition-all"
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
                                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
                                title="AtCoder"
                              >
                                <PlatformIcon platform="atcoder" />
                              </a>
                            )}
                            {student.platformUrls?.linkedin && (
                              <a 
                                href={student.platformUrls.linkedin} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-2 bg-gray-100 rounded-lg hover:bg-blue-50 transition-all"
                                title="LinkedIn"
                              >
                                <PlatformIcon platform="linkedin" />
                              </a>
                            )}
                            {(!student.platformUrls || Object.values(student.platformUrls).every(url => !url)) && (
                              <span className="text-xs text-gray-500 py-2">No profiles</span>
                            )}
                          </div>
                        </td>
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
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <p className="text-gray-600 mb-4 text-lg font-medium">No students match your search criteria</p>
                          <button
                            onClick={() => {
                              setSearchTerm('');
                              setFilterDepartment('');
                              setFilterYear('');
                              setFilterCollege('');
                            }}
                            className="px-6 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-semibold rounded-lg transition-colors"
                          >
                            Clear All Filters
                          </button>
                        </div>
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