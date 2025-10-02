import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// --- Animation & Utility Hooks ---

// Custom hook for a count-up number animation
const useCountUp = (end, duration = 1500) => {
  const [count, setCount] = useState(0);
  const frameRate = 1000 / 60;
  const totalFrames = Math.round(duration / frameRate);

  useEffect(() => {
    let frame = 0;
    const counter = setInterval(() => {
      frame++;
      const progress = (frame / totalFrames) ** 2; // Ease-out effect
      const currentCount = Math.round(end * progress);
      setCount(currentCount);

      if (frame === totalFrames) {
        clearInterval(counter);
        setCount(end); // Ensure it ends on the exact number
      }
    }, frameRate);

    return () => clearInterval(counter);
  }, [end, duration, totalFrames, frameRate]);

  return count;
};

// --- Icon Components ---

const PlatformIcon = ({ platform }) => {
  const icons = {
    leetcode: (
      <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 transition transform hover:scale-110 duration-300">
        <path fillRule="evenodd" clipRule="evenodd" d="M13.483 4.243a1.5 1.5 0 00-2.966 0l-5.733 9.93a1.5 1.5 0 001.299 2.251h11.466a1.5 1.5 0 001.299-2.251l-5.733-9.93zM12 11.25l-2.932 5.078h5.864L12 11.25z" fill="#FBBF24"></path>
      </svg>
    ),
    codeforces: (
      <svg viewBox="0 0 256 256" className="h-8 w-8 transition transform hover:scale-110 duration-300">
        <rect width="256" height="256" fill="none"/>
        <circle cx="128" cy="128" r="96" fill="none" stroke="#4B5563" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
        <circle cx="128" cy="128" r="32" fill="none" stroke="#4B5563" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
        <line x1="160" y1="128" x2="224" y2="128" fill="none" stroke="#4B5563" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
        <line x1="32" y1="128" x2="96" y2="128" fill="none" stroke="#4B5563" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"/>
      </svg>
    ),
    hackerrank: (
      <svg viewBox="0 0 24 24" fill="#2D9A41" className="h-8 w-8 transition transform hover:scale-110 duration-300">
        <path d="M12.5 10.334H11.5V13.667H12.5V10.334ZM15.833 8.167H14.833V15.833H15.833V8.167ZM9.167 8.167H8.167V15.833H9.167V8.167ZM18.25 5H5.75C5.333 5 5 5.333 5 5.75V18.25C5 18.667 5.333 19 5.75 19H18.25C18.667 19 19 18.667 19 18.25V5.75C19 5.333 18.667 5 18.25 5Z"></path>
      </svg>
    ),
    atcoder: (
      <svg viewBox="0 0 256 256" fill="#374151" className="h-8 w-8 transition transform hover:scale-110 duration-300">
        <path d="M188.6,188.6a8,8,0,0,1,0,11.3l-50.06,50.06a8,8,0,0,1-11.32,0L77.17,199.9a8,8,0,0,1,0-11.3L121.28,144.5a8,8,0,0,1,11.32,0ZM162,176a8,8,0,0,0-11.31-11.31L135.37,179.94a8,8,0,0,0,11.31,11.31Z"></path>
        <path d="M128,24a104,104,0,1,0,104,104A104.11,104.11,0,0,0,128,216Z"></path>
      </svg>
    ),
    github: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 text-gray-800 transition transform hover:scale-110 duration-300">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
      </svg>
    ),
  };
  return icons[platform] || null;
};

// --- Helper UI Components ---

const StatItem = ({ label, value }) => (
  <div className="flex justify-between items-center py-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors duration-200">
    <dt className="text-sm text-slate-500">{label}</dt>
    <dd className="text-base font-semibold text-slate-800 tracking-tight">{value}</dd>
  </div>
);
  
const LeetCodeDifficultyStats = ({ easy, medium, hard }) => (
  <div className="grid grid-cols-3 gap-3 mt-3 text-center">
    <div className="bg-green-50 border border-green-200 rounded-lg p-2 transition-transform duration-300 transform hover:scale-105 hover:shadow-md">
      <p className="text-xs font-medium text-green-800">Easy</p>
      <p className="font-bold text-green-700 text-2xl tracking-tighter">{easy}</p>
    </div>
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 transition-transform duration-300 transform hover:scale-105 hover:shadow-md">
      <p className="text-xs font-medium text-yellow-800">Medium</p>
      <p className="font-bold text-yellow-700 text-2xl tracking-tighter">{medium}</p>
    </div>
    <div className="bg-red-50 border border-red-200 rounded-lg p-2 transition-transform duration-300 transform hover:scale-105 hover:shadow-md">
      <p className="text-xs font-medium text-red-800">Hard</p>
      <p className="font-bold text-red-700 text-2xl tracking-tighter">{hard}</p>
    </div>
  </div>
);

// Enhanced Radial Progress Card for the Snapshot
const RadialProgressCard = ({ value, maxValue, label, color, isMounted }) => {
  const animatedValue = useCountUp(value);
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full" viewBox="0 0 120 120">
          <circle
            className="text-slate-100"
            strokeWidth="10"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="60"
            cy="60"
          />
          <circle
            className={color}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={isMounted ? offset : circumference}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="60"
            cy="60"
            style={{ 
              transform: 'rotate(-90deg)', 
              transformOrigin: '50% 50%', 
              transition: 'stroke-dashoffset 1.5s ease-out' 
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold text-slate-800">{animatedValue}</span>
        </div>
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-600">{label}</p>
    </div>
  );
};

const SkeletonLoader = () => (
  <div className="space-y-4 animate-pulse p-2">
    <div className="flex justify-between items-center">
      <div className="h-6 bg-slate-200 rounded-md w-1/3"></div>
      <div className="h-4 bg-slate-200 rounded-md w-1/4"></div>
    </div>
    <div className="space-y-3 pt-4">
      <div className="h-4 bg-slate-200 rounded-md w-full"></div>
      <div className="h-4 bg-slate-200 rounded-md w-5/6"></div>
      <div className="h-4 bg-slate-200 rounded-md w-full"></div>
    </div>
  </div>
);

const ErrorDisplay = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-full text-center text-amber-700 bg-amber-50 rounded-lg py-10 animate-fadeIn">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M8.257 3.099c.636-1.22 2.85-1.22 3.486 0l5.58 10.76c.636 1.22-.474 2.641-1.743 2.641H4.42c-1.269 0-2.379-1.421-1.743-2.64L8.257 3.099zM9 13a1 1 0 112 0 1 1 0 01-2 0zm1-5a1 1 0 00-1 1v2a1 1 0 102 0V9a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
    <p className="font-semibold">Unable to fetch data</p>
    <p className="text-xs max-w-xs">{message}</p>
  </div>
);

// Platform Status Indicator
const PlatformStatus = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return { color: 'bg-green-500', text: 'Updated' };
      case 'scraping':
        return { color: 'bg-blue-500 animate-pulse', text: 'Scraping...' };
      case 'failed':
        return { color: 'bg-red-500', text: 'Failed' };
      default:
        return { color: 'bg-gray-400', text: 'Pending' };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${config.color}`}></div>
      <span className="text-xs text-slate-500">{config.text}</span>
    </div>
  );
};

// --- Main Component ---

const StudentViewDetails = ({ student, onClose }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [leetcodeData, setLeetcodeData] = useState({
    loading: false,
    data: null,
    error: null
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    
    // Fetch LeetCode data if URL is available
    if (student.platformUrls?.leetcode) {
      fetchLeetCodeData(student.platformUrls.leetcode);
    }
    
    return () => clearTimeout(timer);
  }, [student.platformUrls?.leetcode]);

  // Fetch LeetCode data directly from LeetCode API
  const fetchLeetCodeData = async (leetcodeUrl) => {
    try {
      setLeetcodeData({ loading: true, data: null, error: null });
      
      // Extract username from URL
      const username = leetcodeUrl.split('/').filter(Boolean).pop();
      
      if (!username) {
        throw new Error('Invalid LeetCode URL');
      }

      // Method 1: Try leetcode-stats-api first
      try {
        const response = await fetch(`https://leetcode-stats-api.herokuapp.com/${username}`);
        if (!response.ok) throw new Error('API not available');
        
        const data = await response.json();
        
        if (data.status === 'success' && data.totalSolved !== undefined) {
          setLeetcodeData({
            loading: false,
            data: {
              totalSolved: data.totalSolved || 0,
              easy: data.easySolved || 0,
              medium: data.mediumSolved || 0,
              hard: data.hardSolved || 0,
              ranking: data.ranking || 0,
              acceptanceRate: data.acceptanceRate || 0,
              reputation: data.reputation || 0
            },
            error: null
          });
          return;
        }
      } catch (apiError) {
        console.log('LeetCode stats API failed, trying GraphQL...');
      }

      // Method 2: Try GraphQL API
      try {
        const graphqlQuery = {
          query: `
            query getUserProfile($username: String!) {
              matchedUser(username: $username) {
                username
                submitStats {
                  acSubmissionNum {
                    difficulty
                    count
                    submissions
                  }
                  totalSubmissionNum {
                    difficulty
                    count
                    submissions
                  }
                }
                profile {
                  ranking
                  reputation
                  starRating
                }
              }
            }
          `,
          variables: { username }
        };

        const response = await fetch('https://leetcode.com/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Referer': 'https://leetcode.com',
          },
          body: JSON.stringify(graphqlQuery)
        });

        if (response.ok) {
          const result = await response.json();
          
          if (result.data?.matchedUser) {
            const userData = result.data.matchedUser;
            let totalSolved = 0;
            let easy = 0;
            let medium = 0;
            let hard = 0;

            if (userData.submitStats?.acSubmissionNum) {
              userData.submitStats.acSubmissionNum.forEach(item => {
                if (item.difficulty === 'All') totalSolved = item.count;
                if (item.difficulty === 'Easy') easy = item.count;
                if (item.difficulty === 'Medium') medium = item.count;
                if (item.difficulty === 'Hard') hard = item.count;
              });
            }

            setLeetcodeData({
              loading: false,
              data: {
                totalSolved,
                easy,
                medium,
                hard,
                ranking: userData.profile?.ranking || 0,
                reputation: userData.profile?.reputation || 0
              },
              error: null
            });
            return;
          }
        }
      } catch (graphqlError) {
        console.log('GraphQL API failed, trying public API...');
      }

      // Method 3: Try public API endpoints
      try {
        // Alternative public API endpoint
        const publicResponse = await fetch(`https://leetcodestats.cyclic.app/${username}`);
        if (publicResponse.ok) {
          const data = await publicResponse.json();
          setLeetcodeData({
            loading: false,
            data: {
              totalSolved: data.totalSolved || 0,
              easy: data.easySolved || 0,
              medium: data.mediumSolved || 0,
              hard: data.hardSolved || 0,
              ranking: data.ranking || 0,
              acceptanceRate: data.acceptanceRate || 0
            },
            error: null
          });
          return;
        }
      } catch (publicError) {
        console.log('Public API also failed');
      }

      // If all methods fail
      throw new Error('All LeetCode API methods failed');

    } catch (error) {
      console.error('LeetCode fetch error:', error);
      setLeetcodeData({
        loading: false,
        data: null,
        error: 'Failed to fetch LeetCode data. Please check the username or try again later.'
      });
    }
  };

  // Helper function to get platform data from student object (for other platforms)
  const getPlatformData = (platform) => {
    if (platform === 'leetcode') {
      return {
        data: leetcodeData.data || student.platformData?.[platform] || student.stats?.[platform] || null,
        status: leetcodeData.loading ? 'scraping' : (leetcodeData.data ? 'completed' : student.scrapingStatus?.[platform] || 'pending'),
        hasData: !!(leetcodeData.data || student.platformData?.[platform] || student.stats?.[platform])
      };
    }

    const platformData = student.platformData?.[platform];
    const stats = student.stats?.[platform];
    const scrapingStatus = student.scrapingStatus?.[platform];
    
    return {
      data: platformData || stats || null,
      status: scrapingStatus || 'pending',
      hasData: !!(platformData || stats)
    };
  };

  // Calculate total problems solved across all platforms
  const calculateTotalSolved = () => {
    const platforms = ['leetcode', 'codeforces', 'hackerrank', 'atcoder'];
    return platforms.reduce((total, platform) => {
      const platformData = getPlatformData(platform);
      if (platformData.data) {
        if (platform === 'leetcode') {
          return total + (platformData.data.totalSolved || platformData.data.solved || 0);
        } else {
          return total + (platformData.data.problemsSolved || platformData.data.solved || 0);
        }
      }
      return total;
    }, 0);
  };

  // Get platform stats for display
  const getPlatformStats = (platform) => {
    const { data } = getPlatformData(platform);
    
    if (!data) return null;

    switch (platform) {
      case 'leetcode':
        return {
          totalSolved: data.totalSolved || data.solved || 0,
          easy: data.easySolved || data.easy || 0,
          medium: data.mediumSolved || data.medium || 0,
          hard: data.hardSolved || data.hard || 0,
          rating: data.rating || 0,
          ranking: data.ranking || 0,
          reputation: data.reputation || 0,
          acceptanceRate: data.acceptanceRate || 0
        };
      
      case 'codeforces':
        return {
          rating: data.rating || 'Unrated',
          maxRating: data.maxRating || 'N/A',
          problemsSolved: data.problemsSolved || 0,
          rank: data.rank || 'unrated',
          maxRank: data.maxRank || 'N/A',
          contestsAttended: data.contestsAttended || 0
        };
      
      case 'hackerrank':
        return {
          problemsSolved: data.problemsSolved || 0,
          badges: data.badges || 0,
          totalScore: data.totalScore || 0
        };
      
      case 'atcoder':
        return {
          rating: data.rating || 'Unrated',
          maxRating: data.maxRating || 'N/A',
          problemsSolved: data.problemsSolved || 0,
          contestsParticipated: data.contestsParticipated || 0,
          rank: data.rank || 'Unrated'
        };
      
      case 'github':
        return {
          repositories: data.repositories || data.repos || 0,
          followers: data.followers || 0,
          following: data.following || 0,
          totalStars: data.totalStars || 0
        };
      
      default:
        return data;
    }
  };

  const getInitials = (name = '') => {
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const platformOrder = ['leetcode', 'codeforces', 'github', 'hackerrank', 'atcoder'];
  const availablePlatforms = platformOrder.filter(p => student.platformUrls?.[p]);

  // Snapshot data for radial progress cards
  const snapshotData = [
    { 
      label: "Total Problems Solved", 
      value: calculateTotalSolved(), 
      maxValue: Math.max(calculateTotalSolved() * 1.5, 1000), 
      color: "text-blue-500" 
    },
    { 
      label: "GitHub Repositories", 
      value: getPlatformStats('github')?.repositories || 0, 
      maxValue: Math.max((getPlatformStats('github')?.repositories || 0) * 1.5, 50), 
      color: "text-purple-500" 
    },
    { 
      label: "Active Platforms", 
      value: availablePlatforms.length, 
      maxValue: 5, 
      color: "text-emerald-500" 
    },
    { 
      label: "HackerRank Badges", 
      value: getPlatformStats('hackerrank')?.badges || 0, 
      maxValue: Math.max((getPlatformStats('hackerrank')?.badges || 0) * 1.5, 20), 
      color: "text-amber-500" 
    },
  ];

  // Format last updated time
  const formatLastUpdated = (lastUpdated) => {
    if (!lastUpdated) return 'Never';
    const date = new Date(lastUpdated);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div 
      className={`fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out ${isMounted ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
    >
      <div 
        className={`bg-slate-50 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] flex flex-col overflow-hidden transition-all duration-500 ease-out ${isMounted ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-8'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="px-8 py-4 border-b border-slate-200 bg-white">
          <div className="flex justify-between items-start gap-6">
            <div className="flex items-center gap-5">
              <div 
                className="flex-shrink-0 h-16 w-16 bg-blue-600 text-white flex items-center justify-center rounded-full text-2xl font-bold transform transition-transform duration-300 hover:scale-110 hover:shadow-lg"
              >
                {getInitials(student.name)}
              </div>
              <div>
                <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">{student.name}</h2>
                <p className="text-slate-500 mt-1">{student.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-full p-2 transition-all duration-300 hover:rotate-90"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-sm text-slate-600">
            <div className="flex gap-2 hover:translate-x-1 transition-transform duration-200">
              <strong className="font-medium text-slate-500">Register No:</strong>
              <span>{student.registerNumber || 'N/A'}</span>
            </div>
            <div className="flex gap-2 hover:translate-x-1 transition-transform duration-200">
              <strong className="font-medium text-slate-500">Roll No:</strong>
              <span>{student.rollNumber || 'N/A'}</span>
            </div>
            <div className="flex gap-2 hover:translate-x-1 transition-transform duration-200">
              <strong className="font-medium text-slate-500">Department:</strong>
              <span>{student.department || 'N/A'}</span>
            </div>
            <div className="flex gap-2 hover:translate-x-1 transition-transform duration-200">
              <strong className="font-medium text-slate-500">Year:</strong>
              <span>{student.year || 'N/A'}</span>
            </div>
          </div>
          {student.scrapingStatus?.lastUpdated && (
            <div className="mt-3 text-xs text-slate-400">
              Last updated: {formatLastUpdated(student.scrapingStatus.lastUpdated)}
            </div>
          )}
        </header>

        {/* Body */}
        <main className="overflow-y-auto flex-1 p-8 bg-slate-100/70">
          {/* Overall Snapshot Section */}
          <section className="opacity-0 animate-fadeIn" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
            <h3 className="text-base font-semibold text-slate-500 mb-4 uppercase tracking-wider">
              Overall Snapshot
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {snapshotData.map((item, index) => (
                <div
                  key={item.label}
                  className="opacity-0 animate-fadeIn transform translate-y-4" 
                  style={{ 
                    animationDelay: `${0.2 + (index * 0.1)}s`, 
                    animationFillMode: 'forwards' 
                  }}
                >
                  <RadialProgressCard {...item} isMounted={isMounted} />
                </div>
              ))}
            </div>
          </section>

          {/* Platform Details Section */}
          <section className="mt-10 opacity-0 animate-fadeIn" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
            <h3 className="text-base font-semibold text-slate-500 mb-4 uppercase tracking-wider">
              Platform Details
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {availablePlatforms.map((platform, index) => {
                const { data, status } = getPlatformData(platform);
                const stats = getPlatformStats(platform);
                const profileUrl = student.platformUrls[platform];
                const isLoading = platform === 'leetcode' ? leetcodeData.loading : false;

                return (
                  <div 
                    key={platform} 
                    className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 opacity-0 animate-fadeIn" 
                    style={{ 
                      animationDelay: `${0.7 + (index * 0.1)}s`,
                      animationFillMode: 'forwards'
                    }}
                  >
                    <div className="flex items-center justify-between p-6 border-b border-slate-100">
                      <div className="flex items-center gap-4">
                        <PlatformIcon platform={platform} />
                        <div>
                          <h4 className="text-2xl font-bold text-slate-800 capitalize">{platform}</h4>
                          <PlatformStatus status={isLoading ? 'scraping' : status} />
                        </div>
                      </div>
                      <a 
                        href={profileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 group flex items-center gap-1 transition-all duration-200 hover:translate-x-1"
                      >
                        View Profile <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                      </a>
                    </div>
                    <div className="p-6 min-h-[150px]">
                      {isLoading ? (
                        <SkeletonLoader />
                      ) : platform === 'leetcode' && leetcodeData.error ? (
                        <ErrorDisplay message={leetcodeData.error} />
                      ) : !data ? (
                        <div className="flex flex-col items-center justify-center h-32 text-slate-500">
                          <svg className="w-12 h-12 mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          <p className="text-sm">No data available</p>
                          <p className="text-xs text-slate-400">Click scrape in student list to fetch data</p>
                        </div>
                      ) : (
                        <dl>
                          {platform === 'leetcode' && stats && (
                            <>
                              <StatItem label="Total Solved" value={stats.totalSolved} />
                              {stats.ranking > 0 && <StatItem label="Global Ranking" value={stats.ranking} />}
                              {stats.reputation > 0 && <StatItem label="Reputation" value={stats.reputation} />}
                              {stats.acceptanceRate > 0 && <StatItem label="Acceptance Rate" value={`${stats.acceptanceRate}%`} />}
                              <LeetCodeDifficultyStats easy={stats.easy} medium={stats.medium} hard={stats.hard} />
                            </>
                          )}
                          
                          {platform === 'codeforces' && stats && (
                            <>
                              <StatItem label="Problems Solved" value={stats.problemsSolved} />
                              <StatItem label="Current Rating" value={stats.rating} />
                              <StatItem label="Max Rating" value={stats.maxRating} />
                              <StatItem label="Rank" value={stats.rank} />
                              <StatItem label="Contests Attended" value={stats.contestsAttended} />
                            </>
                          )}
                          
                          {platform === 'hackerrank' && stats && (
                            <>
                              <StatItem label="Problems Solved" value={stats.problemsSolved} />
                              <StatItem label="Badges Earned" value={stats.badges} />
                              <StatItem label="Total Score" value={stats.totalScore} />
                            </>
                          )}
                          
                          {platform === 'atcoder' && stats && (
                            <>
                              <StatItem label="Problems Solved" value={stats.problemsSolved} />
                              <StatItem label="Current Rating" value={stats.rating} />
                              <StatItem label="Max Rating" value={stats.maxRating} />
                              <StatItem label="Contests Participated" value={stats.contestsParticipated} />
                              <StatItem label="Rank" value={stats.rank} />
                            </>
                          )}
                          
                          {platform === 'github' && stats && (
                            <>
                              <StatItem label="Public Repositories" value={stats.repositories} />
                              <StatItem label="Followers" value={stats.followers} />
                              <StatItem label="Following" value={stats.following} />
                              <StatItem label="Total Stars" value={stats.totalStars} />
                            </>
                          )}
                        </dl>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {availablePlatforms.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center mt-6 opacity-0 animate-fadeIn" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
                <svg className="w-16 h-16 mx-auto text-slate-300 mb-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <h4 className="text-xl font-bold text-slate-700 mb-2">
                  No Platform Profiles Linked
                </h4>
                <p className="text-slate-500 max-w-md mx-auto">
                  This student hasn't linked any coding platform profiles yet. Encourage them to add their profiles for better tracking.
                </p>
              </div>
            )}
          </section>
        </main>

        {/* Footer */}
        <footer className="px-8 py-3 border-t border-slate-200 flex justify-end items-center rounded-b-xl bg-white opacity-0 animate-fadeIn" style={{ animationDelay: '0.9s', animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-slate-400 hover:scale-105 transform duration-200"
            >
              Close
            </button>
            <Link
              to={`/admin/students/${student.id}`}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow-lg hover:-translate-y-0.5 transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit Student Profile
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
};

// Add required CSS for animations
const styles = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-fadeIn {
  animation: fadeIn 0.5s ease-out forwards;
}
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
.animate-bounce {
  animation: bounce 2s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

export default StudentViewDetails;