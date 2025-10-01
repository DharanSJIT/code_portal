import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../components/Header';
import Footer from '../components/Footer';
import StatCard from '../components/StatCard';
import ActivityFeed from '../components/ActivityFeed';
import StreakTracker from '../components/StreakTracker';
import Leaderboard from '../components/Leaderboard';
import TaskTracker from '../components/TaskTracker';

const HomePage = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    // Simulate fetching user data
    setTimeout(() => {
      setUserData({
        name: 'John Doe',
        leetcode: {
          solvedToday: 3,
          totalSolved: 247,
          streak: 12
        },
        codeforces: {
          submissions: 156,
          rating: 1824,
          problemsSolved: 112
        },
        atcoder: {
          problemsSolved: 78,
          rating: 1345
        },
        hackerrank: {
          badges: 14,
          stars: 5,
          submissions: 98
        },
        github: {
          newRepos: 2,
          commits: 18,
          contributions: 324
        },
        streak: 24,
        dailyTasks: [
          { id: 1, title: 'Solve 3 LeetCode problems', completed: true },
          { id: 2, title: 'Participate in Codeforces contest', completed: false },
          { id: 3, title: 'Complete system design task', completed: false },
          { id: 4, title: 'Push code to GitHub', completed: true }
        ],
        recentActivity: [
          { id: 1, platform: 'LeetCode', action: 'Solved "Two Sum" problem', time: '2 hours ago' },
          { id: 2, platform: 'GitHub', action: 'Pushed 12 commits to main', time: '4 hours ago' },
          { id: 3, platform: 'Codeforces', action: 'Participated in Div 2 contest', time: '1 day ago' },
          { id: 4, platform: 'AtCoder', action: 'Solved 3 problems in ABC contest', time: '2 days ago' },
          { id: 5, platform: 'HackerRank', action: 'Earned Gold Badge in Algorithms', time: '3 days ago' }
        ]
      });
      setLoading(false);
    }, 1500);
  }, []);

  const platformStats = [
    { 
      title: 'LeetCode', 
      stats: [
        { label: 'Today', value: userData?.leetcode.solvedToday || 0 },
        { label: 'Total', value: userData?.leetcode.totalSolved || 0 },
        { label: 'Streak', value: userData?.leetcode.streak || 0 }
      ],
      color: 'bg-yellow-50',
      borderColor: 'border-yellow-500'
    },
    { 
      title: 'Codeforces', 
      stats: [
        { label: 'Rating', value: userData?.codeforces.rating || 0 },
        { label: 'Solved', value: userData?.codeforces.problemsSolved || 0 },
        { label: 'Submissions', value: userData?.codeforces.submissions || 0 }
      ],
      color: 'bg-red-50',
      borderColor: 'border-red-500'
    },
    { 
      title: 'AtCoder', 
      stats: [
        { label: 'Rating', value: userData?.atcoder.rating || 0 },
        { label: 'Solved', value: userData?.atcoder.problemsSolved || 0 }
      ],
      color: 'bg-white',
      borderColor: 'border-gray-500'
    },
    { 
      title: 'HackerRank', 
      stats: [
        { label: 'Badges', value: userData?.hackerrank.badges || 0 },
        { label: 'Stars', value: userData?.hackerrank.stars || 0 },
        { label: 'Submissions', value: userData?.hackerrank.submissions || 0 }
      ],
      color: 'bg-green-50',
      borderColor: 'border-green-500'
    },
    { 
      title: 'GitHub', 
      stats: [
        { label: 'New Repos', value: userData?.github.newRepos || 0 },
        { label: 'Commits', value: userData?.github.commits || 0 },
        { label: 'Contributions', value: userData?.github.contributions || 0 }
      ],
      color: 'bg-purple-50',
      borderColor: 'border-purple-500'
    }
  ];

  // Mock data for leaderboard
  const leaderboardData = [
    { rank: 1, name: 'Alice Chen', totalSolved: 542, streak: 45, githubActivity: 467 },
    { rank: 2, name: 'John Doe', totalSolved: 498, streak: 24, githubActivity: 324 },
    { rank: 3, name: 'Michael Smith', totalSolved: 456, streak: 19, githubActivity: 289 },
    { rank: 4, name: 'Sarah Johnson', totalSolved: 421, streak: 32, githubActivity: 256 },
    { rank: 5, name: 'Robert Brown', totalSolved: 387, streak: 15, githubActivity: 201 },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* <Header userData={userData} /> */}

      <main className="flex-grow px-4 py-6 md:px-8">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              className="flex items-center justify-center h-[70vh]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="ml-4 text-xl font-medium text-gray-700">Loading your dashboard...</p>
            </motion.div>
          ) : (
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
                    Your current streak is <span className="font-semibold text-blue-600">{userData?.streak} days</span>. Keep going!
                  </p>
                </motion.div>

                {/* Navigation Tabs */}
                <motion.div 
                  className="mb-8 border-b border-gray-200"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <nav className="flex space-x-8">
                    {['Dashboard', 'Leaderboard', 'Tasks', 'Activity'].map((tab) => (
                      <button
                        key={tab}
                        className={`py-4 px-1 font-medium text-sm transition-all duration-200 border-b-2 ${
                          activeTab === tab.toLowerCase() 
                            ? 'border-blue-500 text-blue-600' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                        onClick={() => setActiveTab(tab.toLowerCase())}
                      >
                        {tab}
                      </button>
                    ))}
                  </nav>
                </motion.div>

                {/* Tab Content */}
                <div className="mt-6">
                  {activeTab === 'dashboard' && (
                    <>
                      {/* Stats Overview */}
                      <motion.div 
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
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
                            <StatCard 
                              title={platform.title} 
                              stats={platform.stats} 
                              color={platform.color}
                              borderColor={platform.borderColor}
                            />
                          </motion.div>
                        ))}
                      </motion.div>

                      {/* Streak Tracker */}
                      <motion.div 
                        className="mb-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                      >
                        <StreakTracker streak={userData?.streak || 0} />
                      </motion.div>
                      
                      {/* Two Column Layout */}
                      <motion.div 
                        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <motion.div 
                          className="lg:col-span-2"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1 }}
                        >
                          <ActivityFeed activities={userData?.recentActivity || []} />
                        </motion.div>
                        
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.1 }}
                        >
                          <TaskTracker tasks={userData?.dailyTasks || []} />
                        </motion.div>
                      </motion.div>
                    </>
                  )}

                  {activeTab === 'leaderboard' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Leaderboard data={leaderboardData} currentUser="John Doe" />
                    </motion.div>
                  )}

                  {activeTab === 'tasks' && (
                    <motion.div
                      className="max-w-4xl mx-auto"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <TaskTracker tasks={userData?.dailyTasks || []} expanded={true} />
                    </motion.div>
                  )}

                  {activeTab === 'activity' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <ActivityFeed activities={userData?.recentActivity || []} expanded={true} />
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* <Footer /> */}
    </div>
  );
};

export default HomePage;
