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
      
      const storedAdmin = localStorage.getItem('adminUser');
      if (storedAdmin) {
        const adminData = JSON.parse(storedAdmin);
        console.log('AdminDashboard: Found admin in localStorage:', adminData);
        setAdminInfo(adminData);
      }
      
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
      
      setAdminInfo({
        uid: user.uid,
        email: user.email,
        name: userDoc.displayName || userDoc.name || user.email,
        role: 'admin'
      });

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
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-sm border border-gray-200 max-w-md">
          <div className="text-red-600 text-xl font-semibold mb-4">{error}</div>
          <button 
            onClick={() => navigate('/admin/signin')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Admin Dashboard</h1>
            {adminInfo && (
              <p className="text-gray-600">Welcome back, <span className="font-medium">{adminInfo.email}</span></p>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleRefresh}
              className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Refresh Data
            </button>
            <button
              onClick={handleLogout}
              className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Students</h3>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">All Time</span>
            </div>
            <p className="text-4xl font-bold text-gray-900">{stats.totalStudents}</p>
            <p className="text-sm text-gray-500 mt-2">Registered students</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Active Students</h3>
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">Active</span>
            </div>
            <p className="text-4xl font-bold text-gray-900">{stats.activeStudents}</p>
            <p className="text-sm text-gray-500 mt-2">With profile links</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Problems Solved</h3>
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">Total</span>
            </div>
            <p className="text-4xl font-bold text-gray-900">{stats.totalProblems}</p>
            <p className="text-sm text-gray-500 mt-2">Across all platforms</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Platforms</h3>
              <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">Connected</span>
            </div>
            <p className="text-4xl font-bold text-gray-900">
              {Object.values(stats.platformStats).reduce((a, b) => a + b, 0)}
            </p>
            <p className="text-sm text-gray-500 mt-2">Total connections</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Platform Distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Platform Distribution</h2>
            <div className="space-y-5">
              {[
                { name: 'LeetCode', count: stats.platformStats.leetcode, color: 'bg-yellow-500' },
                { name: 'Codeforces', count: stats.platformStats.codeforces, color: 'bg-blue-500' },
                { name: 'AtCoder', count: stats.platformStats.atcoder, color: 'bg-gray-700' },
                { name: 'GitHub', count: stats.platformStats.github, color: 'bg-gray-900' },
                { name: 'HackerRank', count: stats.platformStats.hackerrank, color: 'bg-green-500' }
              ].map((platform) => (
                <div key={platform.name}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700">{platform.name}</span>
                    <span className="text-sm font-medium text-gray-600">
                      {platform.count} / {stats.totalStudents}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`${platform.color} h-3 rounded-full transition-all duration-500`}
                      style={{ 
                        width: stats.totalStudents > 0 
                          ? `${(platform.count / stats.totalStudents) * 100}%` 
                          : '0%' 
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.totalStudents > 0 
                      ? `${Math.round((platform.count / stats.totalStudents) * 100)}% coverage`
                      : '0% coverage'
                    }
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
            {recentActivity.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {recentActivity.map((activity, index) => (
                  <div 
                    key={index} 
                    className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-lg font-bold text-gray-600">
                        {activity.name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-semibold text-gray-900">{activity.name}</p>
                      <p className="text-sm text-gray-600">{activity.action}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500 font-medium">No recent activity</p>
                <p className="text-sm text-gray-400 mt-1">Activity will appear here once students start using the platform</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/admin/add-student')}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
            >
              <h3 className="font-bold text-gray-900 mb-1">Add Student</h3>
              <p className="text-sm text-gray-600">Create a new student account</p>
            </button>
            
            <button
              onClick={() => navigate('/admin/students')}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition text-left"
            >
              <h3 className="font-bold text-gray-900 mb-1">View Students</h3>
              <p className="text-sm text-gray-600">Browse all student profiles</p>
            </button>
            
            <button
              onClick={() => navigate('/admin/scraping-status')}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition text-left"
            >
              <h3 className="font-bold text-gray-900 mb-1">Scraping Status</h3>
              <p className="text-sm text-gray-600">Monitor data collection</p>
            </button>
            
            <button
              onClick={() => navigate('/admin/leaderboard')}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition text-left"
            >
              <h3 className="font-bold text-gray-900 mb-1">Leaderboard</h3>
              <p className="text-sm text-gray-600">View top performers</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;