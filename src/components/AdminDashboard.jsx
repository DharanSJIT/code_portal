import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats, logOutEnhanced, getCurrentUser, getUserById } from '../firebase';
import { motion } from 'framer-motion';

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    verifyAdminAndFetchData();
    
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
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
      setIsRefreshing(true);
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
      setTimeout(() => setIsRefreshing(false), 500);
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
      <motion.div 
        className="flex items-center justify-center h-screen bg-slate-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 260,
            damping: 20
          }}
        >
          <motion.div 
            className="w-16 h-16 mx-auto mb-5 flex items-center justify-center bg-red-100 rounded-full text-red-600"
            animate={{ 
              scale: [1, 1.1, 1],
            }}
            transition={{ 
              repeat: Infinity,
              repeatType: "reverse",
              duration: 2
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </motion.div>
          <motion.div 
            className="text-red-600 text-xl font-semibold mb-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {error}
          </motion.div>
          <motion.button 
            onClick={() => navigate('/admin/signin')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-300 font-medium shadow-lg hover:shadow-xl"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Go to Login
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  if (loading && !isRefreshing) {
    return (
      <motion.div 
        className="flex items-center justify-center h-full min-h-screen bg-slate-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-center">
          <motion.div 
            className="h-16 w-16 mx-auto mb-4 relative"
            animate={{ rotate: 360 }}
            transition={{ 
              repeat: Infinity,
              duration: 1.5,
              ease: "linear"
            }}
          >
            <div className="absolute top-0 left-0 h-full w-full border-4 border-blue-100 rounded-full"></div>
            <div className="absolute top-0 left-0 h-full w-full border-4 border-blue-600 rounded-full border-t-transparent"></div>
          </motion.div>
          <motion.p 
            className="text-slate-600 font-medium text-xl"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ 
              repeat: Infinity,
              duration: 2
            }}
          >
            Loading dashboard...
          </motion.p>
        </div>
      </motion.div>
    );
  }

  const quickActions = [
    {
      title: "Add Student",
      description: "Create a new student account",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      color: "text-emerald-600",
      bgColor: "bg-emerald-100/50",
      borderColor: "border-emerald-200",
      hoverColor: "hover:bg-emerald-100",
      action: () => navigate('/admin/add-student')
    },
    {
      title: "View Students",
      description: "Browse all student profiles",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: "text-blue-600",
      bgColor: "bg-blue-100/50",
      borderColor: "border-blue-200",
      hoverColor: "hover:bg-blue-100",
      action: () => navigate('/admin/students')
    },
    {
      title: "Scraping Status",
      description: "Monitor data collection",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      color: "text-amber-600",
      bgColor: "bg-amber-100/50",
      borderColor: "border-amber-200",
      hoverColor: "hover:bg-amber-100",
      action: () => navigate('/admin/scraping-status')
    },
    {
      title: "Leaderboard",
      description: "View top performers",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: "text-purple-600",
      bgColor: "bg-purple-100/50",
      borderColor: "border-purple-200",
      hoverColor: "hover:bg-purple-100",
      action: () => navigate('/admin/leaderboard')
    },
  ];

  const statCards = [
    {
      title: "Total Students",
      value: stats.totalStudents,
      description: "Registered students",
      icon: (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
          <path d="M17 21V19C17 16.7909 15.2091 15 13 15H5C2.79086 15 1 16.7909 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M23 21V19C22.9986 17.1771 21.765 15.5857 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 3.13C17.7699 3.58317 19.0078 5.17883 19.0078 7.005C19.0078 8.83117 17.7699 10.4268 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Active Students",
      value: stats.activeStudents,
      description: "With profile links",
      icon: (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
          <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8.5 11C10.7091 11 12.5 9.20914 12.5 7C12.5 4.79086 10.7091 3 8.5 3C6.29086 3 4.5 4.79086 4.5 7C4.5 9.20914 6.29086 11 8.5 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M20 8V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M23 11H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Problems Solved",
      value: stats.totalProblems,
      description: "Across all platforms",
      icon: (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      title: "Platforms",
      value: Object.values(stats.platformStats).reduce((a, b) => a + b, 0),
      description: "Total connections",
      icon: (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
          <path d="M10 13C10.5523 13 11 12.5523 11 12C11 11.4477 10.5523 11 10 11C9.44772 11 9 11.4477 9 12C9 12.5523 9.44772 13 10 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 5C10.5523 5 11 4.55228 11 4C11 3.44772 10.5523 3 10 3C9.44772 3 9 3.44772 9 4C9 4.55228 9.44772 5 10 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 21C10.5523 21 11 20.5523 11 20C11 19.4477 10.5523 19 10 19C9.44772 19 9 19.4477 9 20C9 20.5523 9.44772 21 10 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M18 9C18.5523 9 19 8.55228 19 8C19 7.44772 18.5523 7 18 7C17.4477 7 17 7.44772 17 8C17 8.55228 17.4477 9 18 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M18 17C18.5523 17 19 16.5523 19 16C19 15.4477 18.5523 15 18 15C17.4477 15 17 15.4477 17 16C17 16.5523 17.4477 17 18 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 12H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9.5 10.5L4.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9.5 13.5L4.5 18.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    }
  ];

  const platformData = [
    { name: 'LeetCode', count: stats.platformStats.leetcode, color: 'bg-yellow-500', icon: (
      <svg className="w-5 h-5" fill="#FFA116" viewBox="0 0 24 24">
        <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/>
      </svg>
    ) },
    { name: 'Codeforces', count: stats.platformStats.codeforces, color: 'bg-blue-500', icon: (
      <svg className="w-5 h-5" fill="#1F8ACB" viewBox="0 0 24 24">
        <path d="M4.5 7.5C5.328 7.5 6 8.172 6 9v10.5c0 .828-.672 1.5-1.5 1.5h-3C.672 21 0 20.328 0 19.5V9c0-.828.672-1.5 1.5-1.5h3zm9-4.5c.828 0 1.5.672 1.5 1.5v15c0 .828-.672 1.5-1.5 1.5h-3c-.828 0-1.5-.672-1.5-1.5v-15c0-.828.672-1.5 1.5-1.5h3zm9 7.5c.828 0 1.5.672 1.5 1.5v7.5c0 .828-.672 1.5-1.5 1.5h-3c-.828 0-1.5-.672-1.5-1.5V12c0-.828.672-1.5 1.5-1.5h3z"/>
      </svg>
    ) },
    { name: 'AtCoder', count: stats.platformStats.atcoder, color: 'bg-slate-700', icon: (
      <svg className="w-5 h-5" fill="#000000" viewBox="0 0 24 24">
        <path d="M12 0l-8 4v8l8 4 8-4V4l-8-4zm0 2.208L17.385 5 12 7.792 6.615 5 12 2.208zM5 6.5l6 3v7l-6-3v-7zm8 10v-7l6-3v7l-6 3zm-1-12.5l5 2.5-5 2.5-5-2.5 5-2.5z"/>
      </svg>
    ) },
    { name: 'GitHub', count: stats.platformStats.github, color: 'bg-slate-900', icon: (
      <svg className="w-5 h-5" fill="#181717" viewBox="0 0 24 24">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
      </svg>
    ) },
    { name: 'HackerRank', count: stats.platformStats.hackerrank, color: 'bg-green-500', icon: (
      <svg className="w-5 h-5" fill="#00EA64" viewBox="0 0 24 24">
        <path d="M12 0c1.285 0 9.75 4.886 10.392 6 .645 1.115.645 10.885 0 12S13.287 24 12 24s-9.75-4.885-10.395-6c-.641-1.115-.641-10.885 0-12C2.25 4.886 10.715 0 12 0zm2.295 6.799c-.141 0-.258.115-.258.258v3.875H9.963V6.908c0-.141-.116-.258-.258-.258H8.279c-.141 0-.258.115-.258.258v10.018c0 .143.117.258.258.258h1.426c.142 0 .258-.115.258-.258v-4.09h4.074v4.09c0 .143.116.258.258.258h1.426c.141 0 .258-.115.258-.258V6.908c0-.141-.117-.258-.258-.258h-1.426z"/>
      </svg>
    ) },
  ];

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Side Navigation */}
      <div className="flex h-full">
        <motion.nav 
          className="hidden lg:block w-64 bg-white shadow-md pt-8 fixed h-screen overflow-auto"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="px-6 mb-8">
            <h1 className="text-2xl font-bold text-slate-800">Admin Portal</h1>
            <p className="text-slate-500 text-sm mt-1">Student Progress Tracker</p>
          </div>
          
          <div className="mb-8 px-6">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Main Menu</p>
            <ul className="space-y-1">
              <li>
                <motion.a 
                  href="#"
                  className="flex items-center px-4 py-3 text-blue-600 bg-blue-50 rounded-lg font-medium"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 10 }}
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Dashboard
                </motion.a>
              </li>
              <li>
                <motion.a 
                  onClick={() => navigate('/admin/students')}
                  className="flex items-center px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg font-medium cursor-pointer"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 10 }}
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Students
                </motion.a>
              </li>
              <li>
                <motion.a 
                  onClick={() => navigate('/admin/leaderboard')}
                  className="flex items-center px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg font-medium cursor-pointer"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 10 }}
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Leaderboard
                </motion.a>
              </li>
              <li>
                <motion.a 
                  onClick={() => navigate('/admin/scraping-status')}
                  className="flex items-center px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg font-medium cursor-pointer"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 10 }}
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Scraping Status
                </motion.a>
              </li>
            </ul>
          </div>
          
          <div className="px-6">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Account</p>
            <ul className="space-y-1">
              <li>
                <motion.a 
                  className="flex items-center px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg font-medium cursor-pointer"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 10 }}
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </motion.a>
              </li>
              <li>
                <motion.button 
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 10 }}
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </motion.button>
              </li>
            </ul>
          </div>
          
          <div className="mt-auto px-6 pb-8 pt-20">
            {adminInfo && (
              <motion.div 
                className="flex items-center p-4 bg-slate-50 rounded-xl"
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                  {adminInfo.name.charAt(0).toUpperCase()}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-semibold text-slate-800 truncate max-w-[120px]">{adminInfo.name}</p>
                  <p className="text-xs text-slate-500 truncate max-w-[120px]">{adminInfo.email}</p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.nav>

        {/* Main Content */}
        <div className="flex-1 lg:ml-64">
          {/* Top Header */}
          <motion.header 
            className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center">
                {/* Mobile Menu Button */}
                <button className="lg:hidden mr-3 text-slate-500 hover:text-slate-700">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                
                <div>
                  <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">Dashboard</h1>
                  <p className="text-sm text-slate-500">{currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <motion.button
                  onClick={handleRefresh}
                  className="p-2 text-slate-600 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={isRefreshing}
                >
                  <motion.svg 
                    className={`w-5 h-5 ${isRefreshing ? 'text-blue-600' : ''}`} 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    animate={{ rotate: isRefreshing ? 360 : 0 }}
                    transition={{ 
                      duration: 1, 
                      repeat: isRefreshing ? Infinity : 0,
                      ease: "linear"
                    }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </motion.svg>
                </motion.button>
                
                <motion.button 
                  className="p-2 text-slate-600 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </motion.button>
                
                <motion.button 
                  onClick={handleLogout}
                  className="md:flex hidden items-center px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </motion.button>
              </div>
            </div>
          </motion.header>

          {/* Dashboard Content */}
          <div className="p-6 space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {statCards.map((card, index) => (
                <motion.div 
                  key={card.title}
                  className={`${card.bgColor} border border-slate-200 rounded-xl overflow-hidden shadow-sm`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ 
                    y: -5,
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                  }}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-semibold text-slate-600">{card.title}</h3>
                      <div className={`w-12 h-12 rounded-lg ${card.color} bg-opacity-20 flex items-center justify-center`}>
                        <motion.div
                          animate={{ 
                            scale: [1, 1.1, 1],
                          }}
                          transition={{ 
                            repeat: Infinity,
                            repeatType: "reverse",
                            duration: 2
                          }}
                        >
                          {card.icon}
                        </motion.div>
                      </div>
                    </div>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + (index * 0.1) }}
                    >
                      <p className="text-3xl font-bold text-slate-800">{card.value}</p>
                      <p className="text-sm text-slate-500 mt-1">{card.description}</p>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Platform Stats & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div 
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
                initial={fadeInUp.initial}
                animate={fadeInUp.animate}
                transition={{ ...fadeInUp.transition, delay: 0.3 }}
              >
                <div className="p-6 border-b border-slate-100">
                  <h2 className="text-xl font-bold text-slate-800">Platform Distribution</h2>
                </div>
                <div className="p-6 space-y-5">
                  {platformData.map((platform, index) => (
                    <motion.div 
                      key={platform.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + (index * 0.1), duration: 0.5 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="mr-3">{platform.icon}</div>
                          <span className="font-medium text-slate-700">{platform.name}</span>
                        </div>
                        <span className="text-sm font-medium text-slate-600">
                          {platform.count} / {stats.totalStudents}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5">
                        <motion.div 
                          className={`${platform.color} h-2.5 rounded-full`}
                          initial={{ width: 0 }}
                          animate={{ 
                            width: stats.totalStudents > 0 
                              ? `${(platform.count / stats.totalStudents) * 100}%` 
                              : '0%' 
                          }}
                          transition={{ duration: 1, delay: 0.5 + (index * 0.1) }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {stats.totalStudents > 0 
                          ? `${Math.round((platform.count / stats.totalStudents) * 100)}% coverage`
                          : '0% coverage'
                        }
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
              
              <motion.div 
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
                initial={fadeInUp.initial}
                animate={fadeInUp.animate}
                transition={{ ...fadeInUp.transition, delay: 0.4 }}
              >
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-slate-800">Recent Activity</h2>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">Last 24 hours</span>
                </div>
                <div className="p-6">
                  {recentActivity.length > 0 ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                      {recentActivity.map((activity, index) => (
                        <motion.div 
                          key={index} 
                          className="flex items-start p-4 border border-slate-100 rounded-xl hover:border-blue-200 hover:bg-blue-50 transition-all"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 + (index * 0.1), duration: 0.5 }}
                          whileHover={{ scale: 1.02 }}
                        >
                          <motion.div 
                            className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"
                            whileHover={{ scale: 1.1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                          >
                            <span className="text-lg font-bold">
                              {activity.name?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </motion.div>
                          <div className="ml-4 flex-1">
                            <p className="text-sm font-semibold text-slate-800">{activity.name}</p>
                            <p className="text-sm text-slate-600">{activity.action}</p>
                            <p className="text-xs text-slate-400 mt-1">
                              {new Date(activity.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <motion.div 
                      className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <motion.div
                        animate={{ 
                          y: [0, -10, 0]
                        }}
                        transition={{ 
                          repeat: Infinity,
                          duration: 2
                        }}
                        className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4"
                      >
                        <svg className="w-8 h-8 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </motion.div>
                      <p className="text-slate-600 font-medium">No recent activity</p>
                      <p className="text-sm text-slate-400 mt-1">Activity will appear here once students start using the platform</p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>
            
            {/* Quick Actions */}
            <motion.div 
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
              initial={fadeInUp.initial}
              animate={fadeInUp.animate}
              transition={{ ...fadeInUp.transition, delay: 0.5 }}
            >
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800">Quick Actions</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {quickActions.map((action, index) => (
                    <motion.button
                      key={action.title}
                      onClick={action.action}
                      className={`p-6 ${action.bgColor} border ${action.borderColor} rounded-xl text-left flex flex-col h-full`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + (index * 0.1), duration: 0.5 }}
                      whileHover={{ 
                        y: -5, 
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                      }}
                    >
                      <div className={`p-3 rounded-lg ${action.color} bg-opacity-10 w-fit mb-3`}>
                        {action.icon}
                      </div>
                      <h3 className={`font-bold ${action.color} mb-1 text-lg`}>{action.title}</h3>
                      <p className="text-sm text-slate-600">{action.description}</p>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
