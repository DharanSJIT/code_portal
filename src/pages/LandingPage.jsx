import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const LandingPage = () => {
  const [upcomingContests, setUpcomingContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchContests();
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Helper function to find the next occurrence of a specific day of the week
  const getNextDayOfWeek = (dayOfWeek, hour, minute) => { // 0=Sun, 1=Mon, ..., 6=Sat
    const now = new Date();
    // Your current timezone is IST (UTC+5:30)
    // To make calculations robust, we'll work with UTC dates and times
    const resultDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    resultDate.setUTCDate(now.getUTCDate() + (dayOfWeek + 7 - now.getUTCDay()) % 7);
    resultDate.setUTCHours(hour, minute, 0, 0);

    // If the calculated date is in the past (in UTC), move to the next week
    if (resultDate < now) {
      resultDate.setUTCDate(resultDate.getUTCDate() + 7);
    }
    return resultDate;
  };

  const fetchContests = async () => {
    try {
      const [codeforcesData] = await Promise.allSettled([
        fetch('https://codeforces.com/api/contest.list').then(res => {
            if (!res.ok) throw new Error('Codeforces API request failed');
            return res.json();
        })
      ]);

      const contests = [];

      // 1. Process live data from Codeforces API
      if (codeforcesData.status === 'fulfilled' && codeforcesData.value.status === 'OK') {
        const cfContests = codeforcesData.value.result
          .filter(contest => contest.phase === 'BEFORE')
          .slice(0, 4) // Get top 4 upcoming from CF
          .map(contest => {
              const startTime = new Date(contest.startTimeSeconds * 1000);
              return {
                id: `cf-${contest.id}`,
                name: contest.name,
                platform: 'Codeforces',
                date: new Intl.DateTimeFormat('en-GB').format(startTime),
                time: new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).format(startTime),
                duration: `${Math.floor(contest.durationSeconds / 3600)}h ${Math.floor((contest.durationSeconds % 3600) / 60)}m`,
                url: `https://codeforces.com/contests/${contest.id}`,
                startTime: contest.startTimeSeconds * 1000
              };
          });
        contests.push(...cfContests);
      } else {
        console.error("Failed to fetch Codeforces contests:", codeforcesData.reason);
      }

      // 2. Generate dynamic placeholder contests for other platforms
      // Note: Times are in UTC and will be formatted to the user's local time by the browser.
      const leetcodeDate = getNextDayOfWeek(0, 2, 30);      // LeetCode Weekly: Sunday 02:30 UTC (8:00 AM IST)
      const atcoderDate = getNextDayOfWeek(6, 12, 0);       // AtCoder Beginner: Saturday 12:00 UTC (5:30 PM IST)
      const codechefDate = getNextDayOfWeek(3, 14, 30);     // CodeChef Starters: Wednesday 14:30 UTC (8:00 PM IST)
      const hackerrankDate = getNextDayOfWeek(5, 13, 30);   // HackerRank Challenge: Friday 13:30 UTC (7:00 PM IST)
      
      const placeholderContests = [
        { 
          id: 'lc-placeholder', 
          name: 'LeetCode Weekly Contest', 
          platform: 'LeetCode', 
          date: new Intl.DateTimeFormat('en-GB').format(leetcodeDate),
          time: new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).format(leetcodeDate),
          duration: '1h 30m', 
          url: 'https://leetcode.com/contest/',
          startTime: leetcodeDate.getTime()
        },
        { 
          id: 'ac-placeholder', 
          name: 'AtCoder Beginner Contest', 
          platform: 'AtCoder', 
          date: new Intl.DateTimeFormat('en-GB').format(atcoderDate),
          time: new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).format(atcoderDate),
          duration: '1h 40m', 
          url: 'https://atcoder.jp/contests/',
          startTime: atcoderDate.getTime()
        },
        { 
          id: 'cc-placeholder', 
          name: 'CodeChef Starters', 
          platform: 'CodeChef', 
          date: new Intl.DateTimeFormat('en-GB').format(codechefDate),
          time: new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).format(codechefDate),
          duration: '3h 0m', 
          url: 'https://www.codechef.com/contests',
          startTime: codechefDate.getTime()
        },
        { 
          id: 'hr-placeholder', 
          name: 'HackerRank Weekly Challenge', 
          platform: 'HackerRank', 
          date: new Intl.DateTimeFormat('en-GB').format(hackerrankDate),
          time: new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).format(hackerrankDate),
          duration: '48h 0m', 
          url: 'https://www.hackerrank.com/contests',
          startTime: hackerrankDate.getTime()
        }
      ];

      contests.push(...placeholderContests);

      // 3. Sort all contests by start time and limit the total
      contests.sort((a, b) => a.startTime - b.startTime);
      setUpcomingContests(contests.slice(0, 8));
      
    } catch (error) {
      console.error('Error fetching contests:', error);
      // Final fallback with static data if everything else fails
      const now = Date.now();
      setUpcomingContests([
        { id: 'fallback-1', name: 'Codeforces Round (Fallback)', platform: 'Codeforces', date: new Date(now + 86400000).toLocaleDateString(), time: '14:35', duration: '2h 0m', url: 'https://codeforces.com/' },
        { id: 'fallback-2', name: 'LeetCode Contest (Fallback)', platform: 'LeetCode', date: new Date(now + 172800000).toLocaleDateString(), time: '08:00', duration: '1h 30m', url: 'https://leetcode.com/contest/' },
      ]);
    } finally {
        setLoading(false);
    }
  };

  const features = [
    { 
      title: 'Unified Dashboard', 
      description: 'Aggregate stats from LeetCode, Codeforces, CodeChef, AtCoder, and GitHub in one place',
    //   icon: '📊'
    },
    { 
      title: 'Real-time Analytics', 
      description: 'Track your progress with detailed charts, heatmaps, and performance metrics',
    //   icon: '📈'
    },
    { 
      title: 'AI Profile Summary', 
      description: 'Generate recruiter-ready summaries of your coding achievements with AI',
    //   icon: '🤖'
    },
    { 
      title: 'Contest Calendar', 
      description: 'Never miss a coding contest with our integrated calendar and reminders',
    //   icon: '🗓️'
    },
    { 
      title: 'Social Feed', 
      description: 'Connect with other developers, share achievements, and stay motivated',
    //   icon: '🌐'
    },
    { 
      title: 'Portfolio Builder', 
      description: 'Create stunning portfolio pages to showcase your skills to recruiters',
    //   icon: '💼'
    }
  ];

  const stats = [
    { value: '12K+', label: 'Active Users' },
    { value: '150K+', label: 'Problems Solved' },
    { value: '15+', label: 'Platforms' },
    { value: '98.5%', label: 'User Satisfaction' }
  ];

  const platforms = ['LeetCode', 'Codeforces', 'CodeChef', 'AtCoder', 'HackerRank', 'GitHub'];

  const filteredContests = activeTab === 'all' 
    ? upcomingContests 
    : upcomingContests.filter(c => c.platform.toLowerCase() === activeTab.toLowerCase());

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: 'spring',
        stiffness: 100
      }
    }
  };

  const buttonVariants = {
    hover: { 
      scale: 1.05,
      boxShadow: "0px 8px 15px rgba(59, 130, 246, 0.3)",
      transition: { 
        type: 'spring',
        stiffness: 400,
        damping: 10
      }
    },
    tap: { 
      scale: 0.95
    }
  };

  const cardVariants = {
    hover: { 
      y: -8,
      boxShadow: "0px 12px 24px rgba(59, 130, 246, 0.2)",
      transition: { 
        type: 'spring',
        stiffness: 300,
        damping: 15
      }
    }
  };

  const fadeInUpVariants = {
    hidden: { 
      y: 40, 
      opacity: 0 
    },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: 'spring',
        stiffness: 50,
        damping: 20
      }
    }
  };

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        @keyframes gradientBG {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse 4s ease-in-out infinite;
        }
        
        .gradient-text {
          background: linear-gradient(90deg, #3B82F6, #8B5CF6);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        
        .gradient-bg {
          background: linear-gradient(135deg, #3B82F6, #8B5CF6, #3B82F6);
          background-size: 200% 200%;
          animation: gradientBG 15s ease infinite;
        }
        
        .glow {
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);
        }
        
        .backdrop-blur {
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
      `}</style>

      {/* Navigation */}
      <motion.nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur ${
          scrolled ? 'bg-white/90 shadow-md' : 'bg-white/80'
        }`}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ 
          type: 'spring',
          stiffness: 100,
          damping: 20
        }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-md">CT</div>
              <span className="text-xl font-bold text-gray-900">CodeTrack<span className="text-blue-600">Pro</span></span>
            </div>
            <div className="hidden md:flex items-center space-x-10">
              <a href="#features" className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-300">Features</a>
              <a href="#contests" className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-300">Contests</a>
              <a href="#testimonials" className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-300">Testimonials</a>
            </div>
            <div className="flex space-x-4">
              <motion.button 
                className="px-5 py-2.5 text-gray-700 font-medium hover:text-blue-600 transition-colors duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sign In
              </motion.button>
              <motion.button 
                className="px-6 py-2.5 bg-blue-500 text-white rounded-lg font-medium shadow-md"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                Get Started Free
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <main className="pt-16">
        <div className="relative pt-24 pb-20 px-6 overflow-hidden">
          <motion.div 
            className="absolute top-0 right-0 w-96 h-96 bg-blue-50 rounded-full filter blur-3xl opacity-50 -z-10"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.3, 0.5] 
            }}
            transition={{ 
              duration: 15,
              repeat: Infinity,
              repeatType: "reverse" 
            }}
          />
          <motion.div 
            className="absolute bottom-0 left-20 w-72 h-72 bg-purple-50 rounded-full filter blur-3xl opacity-50 -z-10"
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.5, 0.4, 0.5] 
            }}
            transition={{ 
              duration: 12,
              repeat: Infinity,
              repeatType: "reverse",
              delay: 1 
            }}
          />
          
          <div className="max-w-7xl mx-auto text-center max-w-4xl">
            <motion.h1 
              className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              Track Your Coding Journey With <span className="text-blue-500">Precision</span>
            </motion.h1>
            <motion.p 
              className="text-xl text-gray-600 mb-8 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              Unified dashboard for all your competitive programming profiles. Real-time analytics, AI insights, and career growth tools in one place.
            </motion.p>
            <motion.div 
              className="flex flex-col sm:flex-row justify-center gap-5 mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              <motion.button 
                className="px-8 py-4 bg-blue-500 text-white rounded-lg font-semibold shadow-lg"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                Start Free Trial
              </motion.button>
              <motion.button 
                className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-blue-600 hover:text-blue-600 transition-colors"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  Watch Demo
                </span>
              </motion.button>
            </motion.div>
            <motion.div 
              className="flex flex-wrap justify-center gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
            >
              {platforms.map((platform, i) => (
                <motion.span 
                  key={i} 
                  className="px-5 py-2.5 bg-gray-50 text-gray-700 rounded-full text-sm font-medium border border-gray-200 shadow-sm"
                  whileHover={{ y: -3, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {platform}
                </motion.span>
              ))}
            </motion.div>
          </div>
          
         
        </div>

        {/* Features Section */}
        <motion.div 
          id="features" 
          className="py-24 px-6 bg-gray-50"
          variants={fadeInUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <motion.h2 
                className="text-4xl font-bold text-gray-900 mb-4"
                variants={fadeInUpVariants}
              >
                Powerful Features for <span className="text-blue-600">Coding Professionals</span>
              </motion.h2>
              <motion.p 
                className="text-xl text-gray-600 max-w-3xl mx-auto"
                variants={fadeInUpVariants}
              >
                Everything you need to track and grow your coding career, all in one intuitive platform
              </motion.p>
            </div>
            <motion.div 
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
            >
              {features.map((feature, i) => (
                <motion.div 
                  key={i} 
                  className="bg-white p-8 rounded-xl border border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-xl transition-all duration-300"
                  variants={itemVariants}
                  whileHover={cardVariants.hover}
                >
                  {/* <div className="w-16 h-16 mb-6 rounded-2xl gradient-bg flex items-center justify-center text-white text-2xl font-bold shadow-md">
                    {feature.icon}
                  </div> */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div 
          className="py-20 px-6 bg-white"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="mb-12 text-center">
              <motion.h2 
                className="text-3xl font-bold text-gray-900 mb-4"
                variants={fadeInUpVariants}
              >
                Trusted by Developers Worldwide
              </motion.h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, i) => (
                <motion.div 
                  key={i} 
                  className="text-center p-8 bg-gray-50 rounded-xl border border-gray-100"
                  variants={itemVariants}
                  whileHover={{ 
                    y: -5, 
                    boxShadow: "0px 10px 25px rgba(59, 130, 246, 0.1)"
                  }}
                >
                  <motion.div 
                    className="text-5xl font-bold gradient-text mb-2"
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ 
                      scale: 1, 
                      opacity: 1,
                      transition: {
                        type: "spring",
                        stiffness: 100
                      }
                    }}
                    viewport={{ once: true }}
                  >
                    {stat.value}
                  </motion.div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Contests Section */}
        <motion.div 
          id="contests" 
          className="py-24 px-6 bg-gray-50"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <motion.h2 
                className="text-4xl font-bold text-gray-900 mb-3"
                variants={fadeInUpVariants}
              >
                Upcoming Coding Contests
              </motion.h2>
              <motion.p 
                className="text-xl text-gray-600"
                variants={fadeInUpVariants}
              >
                Never miss another competitive programming opportunity
              </motion.p>
            </div>
            
            <motion.div 
              className="flex justify-center gap-3 mb-10 flex-wrap"
              variants={fadeInUpVariants}
            >
              <motion.button 
                onClick={() => setActiveTab('all')} 
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  activeTab === 'all' 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-600 hover:text-blue-600'
                }`}
                whileHover={{ y: -3 }}
                whileTap={{ y: 0 }}
              >
                All Platforms
              </motion.button>
              {['LeetCode', 'Codeforces', 'CodeChef', 'AtCoder', 'HackerRank'].map(platform => (
                <motion.button 
                  key={platform} 
                  onClick={() => setActiveTab(platform)} 
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    activeTab.toLowerCase() === platform.toLowerCase() 
                      ? 'bg-blue-500 text-white shadow-md' 
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-600 hover:text-blue-600'
                  }`}
                  whileHover={{ y: -3 }}
                  whileTap={{ y: 0 }}
                >
                  {platform}
                </motion.button>
              ))}
            </motion.div>
            
            {loading ? (
              <div className="text-center py-20">
                <motion.div 
                  className="inline-block w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ 
                    duration: 1.5, 
                    ease: "linear", 
                    repeat: Infinity 
                  }}
                ></motion.div>
                <p className="mt-6 text-lg text-gray-600">Loading upcoming contests...</p>
              </div>
            ) : (
              <motion.div 
                className="grid md:grid-cols-2 gap-6"
                variants={containerVariants}
              >
                {filteredContests.length > 0 ? (
                  filteredContests.map((contest, index) => (
                    <motion.div 
                      key={contest.id} 
                      className="bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-xl transition-all duration-300"
                      variants={itemVariants}
                      whileHover={cardVariants.hover}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold text-gray-900 flex-1 pr-4">{contest.name}</h3>
                        <span className={`px-4 py-1.5 text-white text-xs font-bold rounded-full whitespace-nowrap ${
                          contest.platform === 'Codeforces' ? 'bg-red-500' :
                          contest.platform === 'LeetCode' ? 'bg-yellow-500' :
                          contest.platform === 'CodeChef' ? 'bg-green-500' :
                          contest.platform === 'AtCoder' ? 'bg-blue-500' :
                          'bg-purple-500'
                        }`}>
                          {contest.platform}
                        </span>
                      </div>
                      <div className="space-y-3 text-gray-600">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-blue-500">
                              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V9h14v10zM5 7V5h14v2H5zm2 4h10v2H7zm0 4h7v2H7z"/>
                            </svg>
                            {contest.date}
                          </span>
                          <span className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-blue-500">
                              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                            </svg>
                            {contest.time}
                          </span>
                        </div>
                        <div className="flex items-center">
                         <span className="flex items-center gap-2">
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-blue-500">
    <path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
  </svg>
  Duration: {contest.duration}
</span>

                        </div>
                      </div>
                      {contest.url && (
                        <motion.a 
                          href={contest.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium text-sm transition-colors"
                          whileHover={{ scale: 1.03, x: 5 }}
                        >
                          Register Now
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z"/>
                          </svg>
                        </motion.a>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <motion.div 
                    className="col-span-2 text-center py-16 text-gray-600 bg-white rounded-xl border border-gray-200"
                    variants={fadeInUpVariants}
                  >
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M0 0h24v24H0V0z" fill="none"/>
                      <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
                    </svg>
                    <p className="font-semibold text-xl mb-2">No upcoming contests found for {activeTab}.</p>
                    <p>Please check back later or select another platform.</p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Testimonials Section */}
        <motion.div 
          id="testimonials"
          className="py-24 px-6 bg-white"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <motion.h2 
                className="text-4xl font-bold text-gray-900 mb-4"
                variants={fadeInUpVariants}
              >
                What Developers Are Saying
              </motion.h2>
              <motion.p 
                className="text-xl text-gray-600 max-w-3xl mx-auto"
                variants={fadeInUpVariants}
              >
                Join thousands of developers who have transformed their coding journey
              </motion.p>
            </div>
            
            <motion.div 
              className="grid md:grid-cols-3 gap-8"
              variants={containerVariants}
            >
              <motion.div 
                className="bg-white p-8 rounded-xl shadow-md border border-gray-200"
                variants={itemVariants}
                whileHover={cardVariants.hover}
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full mr-4 flex items-center justify-center font-bold text-blue-600">JS</div>
                  <div>
                    <div className="font-bold text-gray-900">Jake Simon</div>
                    <div className="text-sm text-gray-600">Software Engineer at Google</div>
                  </div>
                </div>
                <p className="text-gray-700 mb-4">
                  "CodeTrack Pro completely transformed my competitive programming journey. The unified dashboard saves me hours each week, and the analytics helped me identify weaknesses I didn't know I had."
                </p>
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                    </svg>
                  ))}
                </div>
              </motion.div>
              
              <motion.div 
                className="bg-white p-8 rounded-xl shadow-md border border-gray-200"
                variants={itemVariants}
                whileHover={cardVariants.hover}
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-full mr-4 flex items-center justify-center font-bold text-purple-600">AL</div>
                  <div>
                    <div className="font-bold text-gray-900">Anisha Lal</div>
                    <div className="text-sm text-gray-600">CS Student at Stanford</div>
                  </div>
                </div>
                <p className="text-gray-700 mb-4">
                  "The AI profile summary feature helped me showcase my coding achievements to recruiters in a way that stood out. I received interview calls from 3 FAANG companies within a month!"
                </p>
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                    </svg>
                  ))}
                </div>
              </motion.div>
              
              <motion.div 
                className="bg-white p-8 rounded-xl shadow-md border border-gray-200"
                variants={itemVariants}
                whileHover={cardVariants.hover}
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-green-100 rounded-full mr-4 flex items-center justify-center font-bold text-green-600">MC</div>
                  <div>
                    <div className="font-bold text-gray-900">Miguel Costa</div>
                    <div className="text-sm text-gray-600">Senior Developer at Microsoft</div>
                  </div>
                </div>
                <p className="text-gray-700 mb-4">
                  "I love the contest calendar and reminders. I've participated in twice as many competitions this year and climbed from Pupil to Candidate Master on Codeforces. The analytics are simply game-changing."
                </p>
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                    </svg>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div 
          className="py-24 px-6 bg-gray-50"
          variants={fadeInUpVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="max-w-5xl mx-auto">
            <motion.div 
              className="relative bg-blue-500 rounded-2xl p-12 text-center overflow-hidden shadow-xl"
              variants={itemVariants}
            >
              {/* Abstract shapes */}
              {/* <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20">
                <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full"></div>
                <div className="absolute bottom-10 right-10 w-60 h-60 bg-white rounded-full"></div>
                <div className="absolute top-40 right-20 w-20 h-20 bg-white rounded-full"></div>
              </div> */}
              
              <div className="relative z-10">
                <motion.h2 
                  className="text-4xl font-bold text-white mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  Ready to Level Up Your Coding Career?
                </motion.h2>
                <motion.p 
                  className="text-xl text-white/90 mb-10 max-w-2xl mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  Join thousands of developers who have transformed their coding journey with our all-in-one platform.
                </motion.p>
                <motion.button 
                  className="px-10 py-4 bg-white text-white-600 rounded-xl font-bold text-lg shadow-lg hover:shadow-2xl"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  viewport={{ once: true }}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 20px 30px rgba(0, 0, 0, 0.2)"
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  Start Your Free Trial
                </motion.button>
                <motion.p 
                  className="mt-6 text-white/80"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  viewport={{ once: true }}
                >
                  No credit card required • 14-day free trial • Cancel anytime
                </motion.p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center space-x-2 mb-5">
                <div className="w-10 h-10 gradient-bg rounded-lg flex items-center justify-center text-white font-bold text-base shadow-md">CT</div>
                <span className="text-xl font-bold text-gray-900">CodeTrack<span className="text-blue-600">Pro</span></span>
              </div>
              <p className="text-gray-600 mb-6">Empowering developers to track and grow their coding careers through unified analytics and insights.</p>
              <div className="flex space-x-4">
                {['twitter', 'facebook', 'linkedin', 'github'].map(social => (
                  <motion.a 
                    key={social} 
                    href="#" 
                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-blue-100 hover:text-blue-600"
                    whileHover={{ y: -3 }}
                  >
                    <span className="sr-only">{social}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                    </svg>
                  </motion.a>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-gray-900 mb-5 text-lg">Product</h4>
              <ul className="space-y-3 text-gray-600">
                <li className="hover:text-blue-600 transition-colors cursor-pointer">Features</li>
                <li className="hover:text-blue-600 transition-colors cursor-pointer">Pricing</li>
                <li className="hover:text-blue-600 transition-colors cursor-pointer">API</li>
                <li className="hover:text-blue-600 transition-colors cursor-pointer">Integrations</li>
                <li className="hover:text-blue-600 transition-colors cursor-pointer">Updates</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-gray-900 mb-5 text-lg">Company</h4>
              <ul className="space-y-3 text-gray-600">
                <li className="hover:text-blue-600 transition-colors cursor-pointer">About Us</li>
                <li className="hover:text-blue-600 transition-colors cursor-pointer">Blog</li>
                <li className="hover:text-blue-600 transition-colors cursor-pointer">Careers</li>
                <li className="hover:text-blue-600 transition-colors cursor-pointer">Press</li>
                <li className="hover:text-blue-600 transition-colors cursor-pointer">Accessibility</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-gray-900 mb-5 text-lg">Resources</h4>
              <ul className="space-y-3 text-gray-600">
                <li className="hover:text-blue-600 transition-colors cursor-pointer">Documentation</li>
                <li className="hover:text-blue-600 transition-colors cursor-pointer">Help Center</li>
                <li className="hover:text-blue-600 transition-colors cursor-pointer">Community</li>
                <li className="hover:text-blue-600 transition-colors cursor-pointer">Contact</li>
                <li className="hover:text-blue-600 transition-colors cursor-pointer">Developers</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
            <p>&copy; 2025 CodeTrack Pro. All rights reserved.</p>
            <div className="flex space-x-6 mt-6 md:mt-0">
              <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
