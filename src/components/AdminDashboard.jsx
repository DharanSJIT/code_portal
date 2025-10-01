// src/components/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats, logOutEnhanced, getCurrentUser, getUserById } from '../firebase';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalProblems: 0,
    platformStats: {
      leetcode: 0,
      codeforces: 0,
      atcoder: 0,
      github: 0,
      hackerrank: 0
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);
  const [error, setError] = useState(null);
  const [adminInfo, setAdminInfo] = useState(null);

  useEffect(() => {
    verifyAdminAndFetchData();
  }, []);

  const verifyAdminAndFetchData = async () => {
    try {
      console.log('AdminDashboard: Verifying admin access...');
      
      // Check localStorage first
      const storedAdmin = localStorage.getItem('adminUser');
      if (storedAdmin) {
        const adminData = JSON.parse(storedAdmin);
        console.log('AdminDashboard: Found admin in localStorage:', adminData);
        setAdminInfo(adminData);
      }
      
      // Verify with Firebase
      const user = getCurrentUser();
      
      if (!user) {
        console.error('AdminDashboard: No user signed in');
        setError('Please sign in to access the dashboard');
        setTimeout(() => {
          navigate('/admin/signin');
        }, 2000);
        return;
      }
      
      console.log('AdminDashboard: Current user:', user.email);
      
      // Get user profile from Firestore
      const { user: userDoc, error: userError } = await getUserById(user.uid);
      
      if (userError || !userDoc) {
        console.error('AdminDashboard: Error fetching user profile:', userError);
        setError('User profile not found');
        setTimeout(() => {
          navigate('/admin/signin');
        }, 2000);
        return;
      }
      
      console.log('AdminDashboard: User profile:', userDoc);
      
      // Check admin privileges
      const isAdmin = userDoc.role === 'admin' || userDoc.isAdmin === true;
      
      if (!isAdmin) {
        console.error('AdminDashboard: User is not admin. Role:', userDoc.role, 'isAdmin:', userDoc.isAdmin);
        setError('Access denied. Admin privileges required.');
        setTimeout(() => {
          navigate('/admin/signin');
        }, 2000);
        return;
      }
      
      console.log('AdminDashboard: Admin access verified!');
      
      // Set admin info
      setAdminInfo({
        uid: user.uid,
        email: user.email,
        name: userDoc.displayName || userDoc.name || user.email,
        role: 'admin'
      });

      // Fetch dashboard stats
      await fetchStats();
      
    } catch (error) {
      console.error('AdminDashboard: Verification error:', error);
      setError('Authentication failed. Redirecting to login...');
      setTimeout(() => {
        navigate('/admin/signin');
      }, 2000);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      console.log('AdminDashboard: Fetching stats...');
      
      // Get dashboard stats from Firebase
      const { stats: dashboardStats, recentActivity: activity, error: statsError } = await getDashboardStats();
      
      if (statsError) {
        throw new Error(statsError);
      }
      
      console.log('AdminDashboard: Stats fetched successfully');
      
      setStats({
        totalStudents: dashboardStats.totalStudents || 0,
        activeStudents: dashboardStats.activeStudents || 0,
        totalProblems: dashboardStats.totalSolvedProblems || 0,
        platformStats: dashboardStats.platformCounts || {
          leetcode: 0,
          codeforces: 0,
          atcoder: 0,
          github: 0,
          hackerrank: 0
        }
      });
      
      setRecentActivity(activity || []);
      
    } catch (error) {
      console.error('AdminDashboard: Error fetching stats:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('AdminDashboard: Logging out...');
      await logOutEnhanced();
      localStorage.removeItem('adminUser');
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userId');
      navigate('/admin/signin');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleRefresh = () => {
    fetchStats();
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">{error}</div>
          <button 
            onClick={() => navigate('/admin/signin')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header with Admin Info */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          {adminInfo && (
            <p className="text-sm text-gray-600">Welcome, {adminInfo.email}</p>
          )}
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-500">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-gray-500 text-sm">Total Students</h3>
                <p className="text-2xl font-semibold text-gray-800">{stats.totalStudents}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-500">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-gray-500 text-sm">Active Students</h3>
                <p className="text-2xl font-semibold text-gray-800">{stats.activeStudents}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-500">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-gray-500 text-sm">Total Problems Solved</h3>
                <p className="text-2xl font-semibold text-gray-800">{stats.totalProblems}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-500">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-gray-500 text-sm">Platforms Connected</h3>
                <p className="text-2xl font-semibold text-gray-800">
                  {Object.values(stats.platformStats).reduce((a, b) => a + b, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Platform Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Platform Distribution</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">LeetCode</span>
                  <span className="text-sm font-medium text-gray-700">
                    {stats.platformStats.leetcode}/{stats.totalStudents}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-green-500 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: stats.totalStudents > 0 ? `${(stats.platformStats.leetcode / stats.totalStudents) * 100}%` : '0%' }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Codeforces</span>
                  <span className="text-sm font-medium text-gray-700">
                    {stats.platformStats.codeforces}/{stats.totalStudents}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-500 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: stats.totalStudents > 0 ? `${(stats.platformStats.codeforces / stats.totalStudents) * 100}%` : '0%' }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">AtCoder</span>
                  <span className="text-sm font-medium text-gray-700">
                    {stats.platformStats.atcoder}/{stats.totalStudents}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-yellow-500 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: stats.totalStudents > 0 ? `${(stats.platformStats.atcoder / stats.totalStudents) * 100}%` : '0%' }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">GitHub</span>
                  <span className="text-sm font-medium text-gray-700">
                    {stats.platformStats.github}/{stats.totalStudents}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-purple-500 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: stats.totalStudents > 0 ? `${(stats.platformStats.github / stats.totalStudents) * 100}%` : '0%' }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">HackerRank</span>
                  <span className="text-sm font-medium text-gray-700">
                    {stats.platformStats.hackerrank}/{stats.totalStudents}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-red-500 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: stats.totalStudents > 0 ? `${(stats.platformStats.hackerrank / stats.totalStudents) * 100}%` : '0%' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
            {recentActivity.length > 0 ? (
              <div className="overflow-y-auto max-h-80">
                {recentActivity.map((activity, index) => (
                  <div 
                    key={index} 
                    className="flex items-start py-3 border-b border-gray-200 last:border-0"
                  >
                    <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center flex-shrink-0">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.name}</p>
                      <p className="text-sm text-gray-600">{activity.action}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-gray-500 text-sm mt-2">No recent activity</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/admin/add-student')}
              className="block p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
            >
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-blue-100 text-blue-500">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <span className="ml-3 font-medium">Add Student</span>
              </div>
            </button>
            
            <button
              onClick={() => navigate('/admin/students')}
              className="block p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition"
            >
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-green-100 text-green-500">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="ml-3 font-medium">View Students</span>
              </div>
            </button>
            
            <button
              onClick={() => navigate('/admin/scraping-status')}
              className="block p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition"
            >
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-yellow-100 text-yellow-500">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                </div>
                <span className="ml-3 font-medium">Scraping Status</span>
              </div>
            </button>
            
            <button
              onClick={() => navigate('/admin/leaderboard')}
              className="block p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition"
            >
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-purple-100 text-purple-500">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="ml-3 font-medium">View Leaderboard</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;