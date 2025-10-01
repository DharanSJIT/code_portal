// AdminLeaderboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase.js';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { toast } from 'react-toastify';
import StudentViewDetails from './StudentViewDetails';

const AdminLeaderboard = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeBoard, setActiveBoard] = useState('leetcode');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Platform configurations
  const boards = [
    { 
      id: 'leetcode', 
      name: 'LeetCode', 
      icon: '💻', 
      color: 'text-orange-600', 
      bgColor: 'bg-orange-50', 
      borderColor: 'border-orange-200',
      metricLabel: 'Problems Solved'
    },
    { 
      id: 'github', 
      name: 'GitHub', 
      icon: '🐙', 
      color: 'text-gray-700', 
      bgColor: 'bg-gray-50', 
      borderColor: 'border-gray-200',
      metricLabel: 'Repositories'
    },
    { 
      id: 'codeforces', 
      name: 'Codeforces', 
      icon: '🏆', 
      color: 'text-blue-600', 
      bgColor: 'bg-blue-50', 
      borderColor: 'border-blue-200',
      metricLabel: 'Problems Solved'
    },
    { 
      id: 'hackerrank', 
      name: 'HackerRank', 
      icon: '✅', 
      color: 'text-green-600', 
      bgColor: 'bg-green-50', 
      borderColor: 'border-green-200',
      metricLabel: 'Problems Solved'
    },
    { 
      id: 'atcoder', 
      name: 'AtCoder', 
      icon: '🎯', 
      color: 'text-purple-600', 
      bgColor: 'bg-purple-50', 
      borderColor: 'border-purple-200',
      metricLabel: 'Problems Solved'
    },
  ];

  // Real-time listener for student data
  useEffect(() => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'student'));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const studentsList = [];
        snapshot.forEach(doc => {
          studentsList.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setStudents(studentsList);
        setLoading(false);
        console.log('Leaderboard data updated:', studentsList.length, 'students');
      },
      (error) => {
        console.error('Error fetching students:', error);
        toast.error('Failed to load leaderboard data');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Extract metric value based on platform
  const getMetricValue = (student, boardId) => {
    const data = student;
    
    switch(boardId) {
      case 'leetcode':
        return data.leetcodeSolved || data.totalSolved || data.leetCodeSolved || 0;
      case 'github':
        return data.githubRepoCount || data.repos || data.githubRepos || data.public_repos || 0;
      case 'codeforces':
        return data.codeforcesSolved || data.cfSolved || data.codeforcesProblems || 0;
      case 'hackerrank':
        return data.hackerrankSolved || data.hrSolved || data.hackerRankSolved || 0;
      case 'atcoder':
        return data.atcoderSolved || data.acSolved || data.atCoderSolved || 0;
      default:
        return 0;
    }
  };

  // Get unique departments
  const departments = ['all', ...new Set(students.map(s => s.department).filter(Boolean))];

  // Filter and sort students based on active board and department
  const filteredAndSortedStudents = students
    .filter(s => departmentFilter === 'all' || s.department === departmentFilter)
    .map(s => ({
      ...s,
      metricValue: getMetricValue(s, activeBoard)
    }))
    .sort((a, b) => {
      // Primary sort by metric value
      if (b.metricValue !== a.metricValue) {
        return b.metricValue - a.metricValue;
      }
      // Secondary sort by name
      return (a.name || '').localeCompare(b.name || '');
    });

  // Get rank badge styling
  const getRankBadge = (rank) => {
    if (rank === 1) {
      return { 
        icon: '🥇', 
        color: 'text-yellow-600', 
        bg: 'bg-yellow-50', 
        border: 'border-yellow-300',
        label: '1st Place'
      };
    }
    if (rank === 2) {
      return { 
        icon: '🥈', 
        color: 'text-gray-500', 
        bg: 'bg-gray-50', 
        border: 'border-gray-300',
        label: '2nd Place'
      };
    }
    if (rank === 3) {
      return { 
        icon: '🥉', 
        color: 'text-orange-600', 
        bg: 'bg-orange-50', 
        border: 'border-orange-300',
        label: '3rd Place'
      };
    }
    return { 
      icon: rank, 
      color: 'text-gray-600', 
      bg: 'bg-white', 
      border: 'border-gray-200',
      label: `${rank}th Place`
    };
  };

  const currentBoard = boards.find(b => b.id === activeBoard);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Student Leaderboards
          </h1>
          <p className="text-gray-600">
            Track top performers across different coding platforms in real-time
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border-2 border-gray-200 rounded-xl p-4 md:p-6 hover:border-blue-400 transition-all">
            <p className="text-sm text-gray-600 mb-1 font-medium">Total Students</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900">{students.length}</p>
          </div>
          <div className="bg-white border-2 border-gray-200 rounded-xl p-4 md:p-6 hover:border-blue-400 transition-all">
            <p className="text-sm text-gray-600 mb-1 font-medium">Active Platforms</p>
            <p className="text-2xl md:text-3xl font-bold text-blue-600">{boards.length}</p>
          </div>
          <div className="bg-white border-2 border-gray-200 rounded-xl p-4 md:p-6 hover:border-blue-400 transition-all">
            <p className="text-sm text-gray-600 mb-1 font-medium">Departments</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900">{departments.length - 1}</p>
          </div>
          <div className="bg-white border-2 border-gray-200 rounded-xl p-4 md:p-6 hover:border-blue-400 transition-all">
            <p className="text-sm text-gray-600 mb-1 font-medium">Top Score</p>
            <p className="text-2xl md:text-3xl font-bold text-green-600">
              {filteredAndSortedStudents[0]?.metricValue || 0}
            </p>
          </div>
        </div>

        {/* Platform Selection & Filters */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-4 md:p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <h3 className="text-lg font-bold text-gray-900">Select Platform</h3>
            <div className="flex items-center gap-3">
              <label htmlFor="dept-filter" className="text-sm font-semibold text-gray-700">
                Department:
              </label>
              <select
                id="dept-filter"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>
                    {dept === 'all' ? 'All Departments' : dept}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {boards.map(board => (
              <button
                key={board.id}
                onClick={() => setActiveBoard(board.id)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  activeBoard === board.id
                    ? `${board.bgColor} ${board.borderColor} shadow-md scale-105`
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{board.icon}</span>
                  <span className={`text-sm font-bold ${
                    activeBoard === board.id ? board.color : 'text-gray-600'
                  }`}>
                    {board.name}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {filteredAndSortedStudents.filter(s => s.metricValue > 0).length} active
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className={`p-6 ${currentBoard.bgColor} border-b-2 ${currentBoard.borderColor}`}>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-4xl">{currentBoard.icon}</span>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                  {currentBoard.name} Leaderboard
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Showing {filteredAndSortedStudents.filter(s => s.metricValue > 0).length} students with activity
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-16 text-center">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mb-4"></div>
              <p className="text-gray-600 font-semibold text-lg">Loading leaderboard...</p>
            </div>
          ) : filteredAndSortedStudents.filter(s => s.metricValue > 0).length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Activity Yet</h3>
              <p className="text-gray-600">No students have data for {currentBoard.name} yet.</p>
              <Link
                to="/admin/students"
                className="inline-block mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                View All Students
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    <th className="px-4 md:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-4 md:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-4 md:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                      Department
                    </th>
                    <th className="px-4 md:px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {currentBoard.metricLabel}
                    </th>
                    <th className="px-4 md:px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAndSortedStudents
                    .filter(s => s.metricValue > 0)
                    .map((student, index) => {
                      const rank = index + 1;
                      const badge = getRankBadge(rank);
                      
                      return (
                        <tr 
                          key={student.id} 
                          className={`hover:bg-gray-50 transition-colors ${
                            rank <= 3 ? `${badge.bg} border-l-4 ${badge.border}` : ''
                          }`}
                        >
                          <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                            <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${badge.border} ${badge.bg} font-bold ${badge.color} text-lg`}>
                              {badge.icon}
                            </div>
                          </td>
                          
                          <td className="px-4 md:px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                                {student.name?.charAt(0).toUpperCase() || '?'}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm md:text-base font-bold text-gray-900 truncate">
                                  {student.name}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {student.email}
                                </div>
                                <div className="text-xs text-gray-500 md:hidden">
                                  {student.department} • Year {student.year}
                                </div>
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-4 md:px-6 py-4 hidden md:table-cell">
                            <div className="text-sm font-semibold text-gray-900">
                              {student.department || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              Year {student.year || 'N/A'}
                            </div>
                          </td>
                          
                          <td className="px-4 md:px-6 py-4 text-right">
                            <div className={`text-xl md:text-2xl font-bold ${currentBoard.color}`}>
                              {student.metricValue.toLocaleString()}
                            </div>
                            {rank <= 3 && (
                              <div className="text-xs text-gray-500 mt-1">
                                {badge.label}
                              </div>
                            )}
                          </td>
                          
                          <td className="px-4 md:px-6 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setSelectedStudent(student)}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-semibold"
                              >
                                View
                              </button>
                              <Link
                                to={`/admin/students/${student.id}`}
                                className="hidden md:inline-block px-3 py-1.5 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-all text-xs font-semibold"
                              >
                                Edit
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top 3 Winners Podium */}
        {!loading && filteredAndSortedStudents.filter(s => s.metricValue > 0).length > 0 && (
          <div className="mt-8 bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Top Performers</h3>
              <span className="text-sm text-gray-500">
                {currentBoard.name} • {departmentFilter === 'all' ? 'All Departments' : departmentFilter}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {filteredAndSortedStudents
                .filter(s => s.metricValue > 0)
                .slice(0, 3)
                .map((student, index) => {
                  const rank = index + 1;
                  const badge = getRankBadge(rank);
                  
                  return (
                    <div 
                      key={student.id}
                      className={`p-6 rounded-xl border-2 ${badge.border} ${badge.bg} text-center transform hover:scale-105 transition-all`}
                    >
                      <div className="text-5xl mb-4">{badge.icon}</div>
                      <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4 shadow-lg">
                        {student.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 mb-1 truncate">
                        {student.name}
                      </h4>
                      <p className="text-sm text-gray-600 mb-1 truncate">
                        {student.department}
                      </p>
                      <p className="text-xs text-gray-500 mb-4">
                        Year {student.year}
                      </p>
                      <div className={`text-4xl font-bold ${currentBoard.color} mb-1`}>
                        {student.metricValue.toLocaleString()}
                      </div>
                      <p className="text-xs text-gray-500">
                        {currentBoard.metricLabel.toLowerCase()}
                      </p>
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="mt-4 w-full px-4 py-2 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-all text-sm font-semibold"
                      >
                        View Profile
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Quick Stats Section */}
        {!loading && filteredAndSortedStudents.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Platform Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Students</span>
                  <span className="text-lg font-bold text-gray-900">
                    {filteredAndSortedStudents.filter(s => s.metricValue > 0).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total {currentBoard.metricLabel}</span>
                  <span className="text-lg font-bold text-blue-600">
                    {filteredAndSortedStudents
                      .reduce((sum, s) => sum + s.metricValue, 0)
                      .toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Average Score</span>
                  <span className="text-lg font-bold text-green-600">
                    {filteredAndSortedStudents.filter(s => s.metricValue > 0).length > 0
                      ? Math.round(
                          filteredAndSortedStudents
                            .filter(s => s.metricValue > 0)
                            .reduce((sum, s) => sum + s.metricValue, 0) /
                          filteredAndSortedStudents.filter(s => s.metricValue > 0).length
                        ).toLocaleString()
                      : 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/admin/students"
                  className="block w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-center"
                >
                  View All Students
                </Link>
                <Link
                  to="/admin/add-student"
                  className="block w-full px-4 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-all font-semibold text-center"
                >
                  Add New Student
                </Link>
                <button
                  onClick={() => {
                    toast.info('Refreshing leaderboard data...');
                  }}
                  className="block w-full px-4 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:border-green-500 hover:text-green-600 transition-all font-semibold text-center"
                >
                  Refresh Data
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Student Details Modal */}
      {selectedStudent && (
        <StudentViewDetails 
          student={selectedStudent} 
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
};

export default AdminLeaderboard;