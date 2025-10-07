import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';


const ProgressAnalytics = () => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTestingActivity, setIsTestingActivity] = useState(false);

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
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Progress Analytics</h1>
              <p className="text-gray-600">
                Track your coding journey with detailed insights and trends
              </p>
            </div>
            <button
              onClick={async () => {
                setIsTestingActivity(true);
                try {
                  const activityService = (await import('../services/activityService')).default;
                  await activityService.logActivity(currentUser?.uid, 'system', `Manual activity test at ${new Date().toLocaleTimeString()}`);
                  setTimeout(() => {
                    window.location.reload();
                  }, 1500);
                } catch (error) {
                  setIsTestingActivity(false);
                }
              }}
              disabled={isTestingActivity}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${
                isTestingActivity 
                  ? 'bg-green-400 text-white cursor-not-allowed' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isTestingActivity ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Testing...
                </>
              ) : (
                'Test Activity'
              )}
            </button>
          </div>
        </div>
        
        {/* Profile & Export Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Profile Completion */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Profile Completion</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Platform Links</span>
                <span className="text-sm font-medium">{platformStats.length}/4</span>
              </div>
              <div className="bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full transition-all duration-1000" 
                  style={{ width: `${(platformStats.length / 4) * 100}%` }}></div>
              </div>
              <div className="text-xs text-gray-500">
                {platformStats.length === 4 ? '✅ All platforms connected!' : `Connect ${4 - platformStats.length} more platform${4 - platformStats.length > 1 ? 's' : ''}`}
              </div>
            </div>
          </div>

          {/* Export Data */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Export Your Data</h3>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {/* <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      📈
                    </div> */}
                    <div>
                      <p className="text-sm font-medium text-gray-800">Progress Report</p>
                      <p className="text-xs text-gray-500">Complete coding statistics</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Format: CSV</p>
                    <p className="text-xs text-gray-400">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    const csvData = [
                      `Date,${today}`,
                      `Total Problems,${totalProblems}`,
                      `Platforms Connected,${platformStats.length}`,
                      '',
                      'Platform,Problems'
                    ].concat(platformStats.map(p => `${p.name},${p.count}`)).join('\n');
                    const blob = new Blob([csvData], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `coding-progress-${today}.csv`;
                    a.click();
                  }}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download CSV Report
                </button>
              </div>
              {/* <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
                ℹ️ Includes: Date, total problems, platform breakdown, and progress metrics
              </div> */}
            </div>
          </div>
        </div>

        {/* Recent Activity Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Highlights</h3>
          <div className="space-y-4">
            {platformStats.map((platform, index) => {
              const getPlatformColor = (name) => {
                const colors = {
                  'LeetCode': 'bg-yellow-500',
                  'Codeforces': 'bg-blue-500', 
                  'AtCoder': 'bg-green-500',
                  'GitHub': 'bg-gray-800'
                };
                return colors[name] || 'bg-blue-500';
              };
              
              return (
                <div key={index} className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${getPlatformColor(platform.name)}`}>
                    {platform.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p className="font-medium text-gray-800">{platform.name}</p>
                      <p className="text-xs text-gray-500">Current</p>
                    </div>
                    <p className="text-gray-600 text-sm">
                      {platform.name === 'GitHub' ? `Created ${platform.count} repositories` : `Solved ${platform.count} problems`}
                    </p>
                  </div>
                </div>
              );
            })}
            
            {platformStats.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">No platform data available</p>
                <p className="text-xs text-gray-400 mt-1">Connect your coding platforms to see activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressAnalytics;