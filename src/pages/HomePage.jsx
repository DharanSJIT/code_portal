import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/StatCard';
import ActivityFeed from '../components/ActivityFeed';
import StreakTracker from '../components/StreakTracker';
import TaskTracker from '../components/TaskTracker';

const HomePage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) {
        navigate('/signin');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch user document from Firebase
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          
          // Structure the data for the dashboard
          setUserData({
            name: data.name || currentUser.displayName || 'User',
            email: data.email || currentUser.email,
            
            // LeetCode data
            leetcode: {
              solvedToday: 0, // You can add this to your Firebase if needed
              totalSolved: data.platformData?.leetcode?.totalSolved || 0,
              streak: 0, // You can add this to your Firebase if needed
              easySolved: data.platformData?.leetcode?.easySolved || 0,
              mediumSolved: data.platformData?.leetcode?.mediumSolved || 0,
              hardSolved: data.platformData?.leetcode?.hardSolved || 0,
              ranking: data.platformData?.leetcode?.ranking || 'N/A'
            },
            
            // Codeforces data
            codeforces: {
              submissions: 0, // You can calculate this if needed
              rating: data.platformData?.codeforces?.rating || 0,
              problemsSolved: data.platformData?.codeforces?.problemsSolved || 0,
              maxRating: data.platformData?.codeforces?.maxRating || 0,
              rank: data.platformData?.codeforces?.rank || 'Unrated'
            },
            
            // AtCoder data
            atcoder: {
              problemsSolved: data.platformData?.atcoder?.problemsSolved || 0,
              rating: data.platformData?.atcoder?.rating || 0,
              highestRating: data.platformData?.atcoder?.highestRating || 0,
              rank: data.platformData?.atcoder?.rank || 'Unrated'
            },
            
            // GitHub data
            github: {
              newRepos: 0, // You can add this logic if needed
              commits: 0, // You can add this logic if needed
              repositories: data.platformData?.github?.repositories || 0,
              // contributions: data.platformData?.github?.contributions || 0,
              totalStars: data.platformData?.github?.totalStars || 0,
              followers: data.platformData?.github?.followers || 0
            },
            
            // General data
            streak: 0, // You can implement streak logic
            department: data.department || 'Not Specified',
            college: data.college || 'Engineering',
            year: data.year || 'N/A',
            
            // Platform URLs
            platformUrls: data.platformUrls || {},
            
            // Scraping status
            scrapingStatus: data.scrapingStatus || {},
            
            // Mock tasks and activities (you can fetch from Firebase if you have them)
            dailyTasks: [
              { id: 1, title: 'Solve 3 LeetCode problems', completed: false },
              { id: 2, title: 'Participate in Codeforces contest', completed: false },
              { id: 3, title: 'Push code to GitHub', completed: false },
              { id: 4, title: 'Review coding concepts', completed: false }
            ],
            
            recentActivity: generateRecentActivity(data.platformData, data.scrapingStatus)
          });
        } else {
          setError('User profile not found');
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser, navigate]);

  // Generate recent activity based on platform data
  const generateRecentActivity = (platformData, scrapingStatus) => {
    const activities = [];
    
    if (platformData?.leetcode && scrapingStatus?.leetcode === 'completed') {
      activities.push({
        id: activities.length + 1,
        platform: 'LeetCode',
        action: `Solved ${platformData.leetcode.totalSolved} problems total`,
        time: 'Recently updated'
      });
    }
    
    if (platformData?.codeforces && scrapingStatus?.codeforces === 'completed') {
      activities.push({
        id: activities.length + 1,
        platform: 'Codeforces',
        action: `Current rating: ${platformData.codeforces.rating} (${platformData.codeforces.rank})`,
        time: 'Recently updated'
      });
    }
    
    if (platformData?.atcoder && scrapingStatus?.atcoder === 'completed') {
      activities.push({
        id: activities.length + 1,
        platform: 'AtCoder',
        action: `Solved ${platformData.atcoder.problemsSolved} problems`,
        time: 'Recently updated'
      });
    }
    
    if (platformData?.github && scrapingStatus?.github === 'completed') {
      activities.push({
        id: activities.length + 1,
        platform: 'GitHub',
        action: `${platformData.github.repositories} repositories with ${platformData.github.totalStars} stars`,
        time: 'Recently updated'
      });
    }
    
    // Add default message if no activities
    if (activities.length === 0) {
      activities.push({
        id: 1,
        platform: 'System',
        action: 'No recent activity. Start coding to see updates!',
        time: 'Just now'
      });
    }
    
    return activities;
  };

  // Prepare platform stats
  const platformStats = userData ? [
    { 
      title: 'LeetCode', 
      stats: [
        { label: 'Total Solved', value: userData.leetcode.totalSolved },
        { label: 'Easy', value: userData.leetcode.easySolved },
        { label: 'Medium', value: userData.leetcode.mediumSolved },
        { label: 'Hard', value: userData.leetcode.hardSolved }
      ],
      color: 'bg-yellow-50',
      borderColor: 'border-yellow-500',
      status: userData.scrapingStatus?.leetcode
    },
    { 
      title: 'Codeforces', 
      stats: [
        { label: 'Rating', value: userData.codeforces.rating },
        { label: 'Max Rating', value: userData.codeforces.maxRating },
        { label: 'Rank', value: userData.codeforces.rank },
        { label: 'Solved', value: userData.codeforces.problemsSolved }
      ],
      color: 'bg-red-50',
      borderColor: 'border-red-500',
      status: userData.scrapingStatus?.codeforces
    },
    { 
      title: 'AtCoder', 
      stats: [
        { label: 'Rating', value: userData.atcoder.rating },
        { label: 'Highest', value: userData.atcoder.highestRating },
        { label: 'Rank', value: userData.atcoder.rank },
        { label: 'Solved', value: userData.atcoder.problemsSolved }
      ],
      color: 'bg-blue-50',
      borderColor: 'border-blue-500',
      status: userData.scrapingStatus?.atcoder
    },
    { 
      title: 'GitHub', 
      stats: [
        { label: 'Repositories', value: userData.github.repositories },
        { label: 'Total Stars', value: userData.github.totalStars },
        { label: 'Followers', value: userData.github.followers },
        // { label: 'Contributions', value: userData.github.contributions }
      ],
      color: 'bg-purple-50',
      borderColor: 'border-purple-500',
      status: userData.scrapingStatus?.github
    }
  ] : [];

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { label: 'Updated', color: 'bg-green-100 text-green-800' },
      failed: { label: 'Failed', color: 'bg-red-100 text-red-800' },
      in_progress: { label: 'Updating', color: 'bg-blue-100 text-blue-800' },
      not_started: { label: 'Not Started', color: 'bg-gray-100 text-gray-800' }
    };

    const config = statusConfig[status] || statusConfig.not_started;

    return (
      <span className={`text-xs ${config.color} px-2 py-1 rounded-full font-medium`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <main className="flex-grow px-4 py-6 md:px-8">
          <motion.div 
            className="flex items-center justify-center h-[70vh]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="ml-4 text-xl font-medium text-gray-700">Loading your dashboard...</p>
          </motion.div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <main className="flex-grow px-4 py-6 md:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
              >
                Retry
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-grow px-4 py-6 md:px-8">
        <AnimatePresence mode="wait">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <div className="max-w-7xl mx-auto">
              {/* Welcome Section */}
              <motion.div 
                className="mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className="text-3xl font-bold text-gray-800">
                  Welcome back, {userData?.name}!
                </h1>
                <p className="text-gray-600 mt-1">
                  {userData?.department} • Year {userData?.year} • {userData?.college}
                </p>
              </motion.div>

              {/* Stats Overview */}
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.1, delayChildren: 0.4 }}
              >
                {platformStats.map((platform, index) => (
                  <motion.div
                    key={platform.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + (index * 0.1) }}
                  >
                    <div className="relative">
                      <StatCard 
                        title={platform.title} 
                        stats={platform.stats} 
                        color={platform.color}
                        borderColor={platform.borderColor}
                      />
                      <div className="absolute top-4 right-4">
                        {getStatusBadge(platform.status)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default HomePage;