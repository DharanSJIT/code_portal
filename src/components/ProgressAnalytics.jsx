import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import ActivityFeed from './ActivityFeed';

const ProgressAnalytics = () => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, [currentUser]);

  const fetchUserData = async () => {
    if (!currentUser) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-white rounded-xl shadow-lg p-6">
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-64 bg-gray-100 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const platformData = userData?.platformData || {};
  const leetcode = platformData.leetcode || {};
  const codeforces = platformData.codeforces || {};
  const github = platformData.github || {};
  const atcoder = platformData.atcoder || {};

  // Calculate platform activity percentages
  const totalProblems = (leetcode.totalSolved || 0) + (codeforces.problemsSolved || 0) + (atcoder.problemsSolved || 0);
  const platformStats = [
    { 
      name: 'LeetCode', 
      value: totalProblems > 0 ? Math.round(((leetcode.totalSolved || 0) / totalProblems) * 100) : 0,
      count: leetcode.totalSolved || 0,
      color: 'bg-yellow-500' 
    },
    { 
      name: 'Codeforces', 
      value: totalProblems > 0 ? Math.round(((codeforces.problemsSolved || 0) / totalProblems) * 100) : 0,
      count: codeforces.problemsSolved || 0,
      color: 'bg-blue-500' 
    },
    { 
      name: 'AtCoder', 
      value: totalProblems > 0 ? Math.round(((atcoder.problemsSolved || 0) / totalProblems) * 100) : 0,
      count: atcoder.problemsSolved || 0,
      color: 'bg-green-500' 
    },
    { 
      name: 'GitHub', 
      value: github.repositories ? Math.min(github.repositories * 2, 100) : 0,
      count: github.repositories || 0,
      color: 'bg-gray-700' 
    }
  ].filter(platform => platform.count > 0);

  // Generate weekly progress (mock data based on total problems)
  const weeklyData = Array.from({ length: 12 }, (_, i) => {
    const base = Math.floor(totalProblems / 12);
    const variation = Math.floor(Math.random() * (base * 0.5));
    return Math.max(1, base + variation);
  });

  // Generate daily trend (last 7 days)
  const dailyTrend = Array.from({ length: 7 }, (_, i) => {
    const base = Math.floor(totalProblems / 30); // Daily average
    const variation = Math.floor(Math.random() * base);
    return Math.max(0, base + variation);
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Progress Analytics</h1>
          <p className="text-gray-600">
            Track your coding journey with detailed insights and trends
          </p>
        </div>
        
        {/* Progress Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Platform Distribution */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Platform Activity</h3>
            <div className="h-64 p-4 bg-gray-50 rounded-lg">
              {platformStats.length > 0 ? (
                <div className="space-y-4">
                  {platformStats.map((platform, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded ${platform.color}`}></div>
                      <span className="text-sm font-medium text-gray-700 w-20">{platform.name}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full ${platform.color} transition-all duration-1000 ease-out`}
                          style={{ width: `${platform.value}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500 w-12">{platform.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>No platform data available</p>
                </div>
              )}
            </div>
          </div>
          
          {/* LeetCode Difficulty Breakdown */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">LeetCode Difficulty Breakdown</h3>
            <div className="h-64 p-4 bg-gray-50 rounded-lg flex items-center justify-center">
              {leetcode.totalSolved > 0 ? (
                <div className="grid grid-cols-3 gap-8 w-full max-w-md">
                  {[
                    { 
                      label: 'Easy', 
                      count: leetcode.easySolved || 0, 
                      color: 'text-green-600', 
                      bg: 'bg-green-100', 
                      ring: 'ring-green-500' 
                    },
                    { 
                      label: 'Medium', 
                      count: leetcode.mediumSolved || 0, 
                      color: 'text-yellow-600', 
                      bg: 'bg-yellow-100', 
                      ring: 'ring-yellow-500' 
                    },
                    { 
                      label: 'Hard', 
                      count: leetcode.hardSolved || 0, 
                      color: 'text-red-600', 
                      bg: 'bg-red-100', 
                      ring: 'ring-red-500' 
                    }
                  ].map((diff, i) => {
                    const percentage = leetcode.totalSolved > 0 ? (diff.count / leetcode.totalSolved) * 100 : 0;
                    return (
                      <div key={i} className="text-center">
                        <div className={`relative w-20 h-20 mx-auto mb-3 ${diff.bg} rounded-full flex items-center justify-center ring-4 ${diff.ring}`}>
                          <span className={`text-lg font-bold ${diff.color}`}>{diff.count}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-700">{diff.label}</p>
                        <p className="text-xs text-gray-500">{percentage.toFixed(0)}%</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <p>No LeetCode data available</p>
                  <p className="text-sm mt-2">Connect your LeetCode profile to see difficulty breakdown</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Recent Activity Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Highlights</h3>
          <ActivityFeed studentId={currentUser?.uid} expanded={false} />
        </div>
      </div>
    </div>
  );
};

export default ProgressAnalytics;