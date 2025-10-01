// src/components/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { db } from '../firebase.js';

const AdminDashboard = () => {
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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get all users who are students
        const usersSnapshot = await db.collection('users')
          .where('role', '==', 'student')
          .get();
        
        const totalStudents = usersSnapshot.size;
        let activeStudents = 0;
        let totalProblems = 0;
        
        const platformCounts = {
          leetcode: 0,
          codeforces: 0,
          atcoder: 0,
          github: 0,
          hackerrank: 0
        };
        
        const activity = [];
        
        usersSnapshot.forEach(doc => {
          const userData = doc.data();
          
          // Count active students (those with at least one platform)
          if (userData.platformUrls && Object.values(userData.platformUrls).some(url => url)) {
            activeStudents++;
          }
          
          // Sum total solved problems
          if (userData.totalSolved) {
            totalProblems += userData.totalSolved;
          }
          
          // Count platforms
          if (userData.platformUrls) {
            Object.entries(userData.platformUrls).forEach(([platform, url]) => {
              if (url && platformCounts[platform] !== undefined) {
                platformCounts[platform]++;
              }
            });
          }
          
          // Add to recent activity if updated in the last 7 days
          if (userData.lastUpdated) {
            const lastUpdated = new Date(userData.lastUpdated);
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            if (lastUpdated >= sevenDaysAgo) {
              activity.push({
                id: doc.id,
                name: userData.name,
                action: 'Profile updated',
                timestamp: userData.lastUpdated
              });
            }
          }
        });
        
        // Sort activity by timestamp descending
        activity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Set stats state
        setStats({
          totalStudents,
          activeStudents,
          totalProblems,
          platformStats: platformCounts
        });
        
        // Set recent activity
        setRecentActivity(activity.slice(0, 10)); // Get latest 10 activities
        
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stats Cards */}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
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
                <span className="text-sm font-medium text-gray-700">{stats.platformStats.leetcode}/{stats.totalStudents}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-green-500 h-2.5 rounded-full" 
                  style={{ width: `${(stats.platformStats.leetcode / stats.totalStudents) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Codeforces</span>
                <span className="text-sm font-medium text-gray-700">{stats.platformStats.codeforces}/{stats.totalStudents}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-500 h-2.5 rounded-full" 
                  style={{ width: `${(stats.platformStats.codeforces / stats.totalStudents) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">AtCoder</span>
                <span className="text-sm font-medium text-gray-700">{stats.platformStats.atcoder}/{stats.totalStudents}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-yellow-500 h-2.5 rounded-full" 
                  style={{ width: `${(stats.platformStats.atcoder / stats.totalStudents) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">GitHub</span>
                <span className="text-sm font-medium text-gray-700">{stats.platformStats.github}/{stats.totalStudents}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-purple-500 h-2.5 rounded-full" 
                  style={{ width: `${(stats.platformStats.github / stats.totalStudents) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">HackerRank</span>
                <span className="text-sm font-medium text-gray-700">{stats.platformStats.hackerrank}/{stats.totalStudents}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-red-500 h-2.5 rounded-full" 
                  style={{ width: `${(stats.platformStats.hackerrank / stats.totalStudents) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          // src/components/AdminDashboard.jsx (continued)
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
          {recentActivity.length > 0 ? (
            <div className="overflow-y-auto max-h-80">
              {recentActivity.map((activity, index) => (
                <div 
                  key={index} 
                  className="flex items-start py-3 border-b border-gray-200 last:border-0"
                >
                  <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
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
            <p className="text-gray-500 text-sm py-4">No recent activity</p>
          )}
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a 
            href="/admin/add-student"
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
          </a>
          
          <a 
            href="/admin/students"
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
          </a>
          
          <a 
            href="/admin/scraping-status"
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
          </a>
          
          <a 
            href="/admin/leaderboard"
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
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
