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
  }, [end, duration, totalFrames]);

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
        <path d="M128,24a104,104,0,1,0,104,104A104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Z"></path>
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

// --- Main Component ---

const StudentViewDetails = ({ student, onClose }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [platformData, setPlatformData] = useState({
    leetcode: { loading: true, data: null, error: null },
    codeforces: { loading: true, data: null, error: null },
    hackerrank: { loading: true, data: null, error: null },
    atcoder: { loading: true, data: null, error: null },
    github: { loading: true, data: null, error: null },
  });

  // Fetch logic functions
  useEffect(() => {
    if (student) {
      fetchAllPlatformData();
    }
    const timer = setTimeout(() => setIsMounted(true), 100); // Trigger animations
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student]);

  const fetchAllPlatformData = async () => {
    const promises = [];
    if (student.platformUrls?.leetcode) { 
      promises.push(fetchLeetCodeData(student.platformUrls.leetcode)); 
    } else { 
      setPlatformData(prev => ({ ...prev, leetcode: { loading: false, data: null, error: null } })); 
    }
    
    if (student.platformUrls?.codeforces) { 
      promises.push(fetchCodeforcesData(student.platformUrls.codeforces)); 
    } else { 
      setPlatformData(prev => ({ ...prev, codeforces: { loading: false, data: null, error: null } })); 
    }
    
    if (student.platformUrls?.hackerrank) { 
      promises.push(fetchHackerRankData(student.platformUrls.hackerrank)); 
    } else { 
      setPlatformData(prev => ({ ...prev, hackerrank: { loading: false, data: null, error: null } })); 
    }
    
    if (student.platformUrls?.atcoder) { 
      promises.push(fetchAtCoderData(student.platformUrls.atcoder)); 
    } else { 
      setPlatformData(prev => ({ ...prev, atcoder: { loading: false, data: null, error: null } })); 
    }
    
    if (student.platformUrls?.github) { 
      promises.push(fetchGitHubData(student.platformUrls.github)); 
    } else { 
      setPlatformData(prev => ({ ...prev, github: { loading: false, data: null, error: null } })); 
    }
    
    await Promise.allSettled(promises);
  };
  
  const fetchLeetCodeData = async (url) => { 
    try { 
      const username = url.split('/').filter(Boolean).pop(); 
      const response = await fetch(`https://leetcode-stats-api.herokuapp.com/${username}`); 
      const data = await response.json(); 
      
      if (data.status === 'error') throw new Error(data.message); 
      
      setPlatformData(prev => ({ 
        ...prev, 
        leetcode: { 
          loading: false, 
          data: { 
            totalSolved: data.totalSolved || 0, 
            easy: data.easySolved || 0, 
            medium: data.mediumSolved || 0, 
            hard: data.hardSolved || 0, 
          }, 
          error: null 
        } 
      })); 
    } catch (error) { 
      console.error('LeetCode fetch error:', error); 
      setPlatformData(prev => ({ 
        ...prev, 
        leetcode: { 
          loading: false, 
          data: null, 
          error: 'Failed to fetch LeetCode data.' 
        } 
      })); 
    } 
  };
  
  const fetchCodeforcesData = async (url) => { 
    try { 
      const username = url.split('/').filter(Boolean).pop(); 
      const response = await fetch(`https://codeforces.com/api/user.info?handles=${username}`); 
      const data = await response.json(); 
      
      if (data.status !== 'OK' || !data.result?.[0]) { 
        throw new Error(data.comment || 'User not found'); 
      } 
      
      const user = data.result[0]; 
      const submissionsResponse = await fetch(`https://codeforces.com/api/user.status?handle=${username}&from=1&count=10000`); 
      const submissionsData = await submissionsResponse.json(); 
      
      let solvedCount = 0; 
      if (submissionsData.status === 'OK') { 
        const solvedProblems = new Set(); 
        submissionsData.result.forEach(sub => { 
          if (sub.verdict === 'OK') { 
            solvedProblems.add(`${sub.problem.contestId}-${sub.problem.index}`); 
          } 
        }); 
        solvedCount = solvedProblems.size; 
      } 
      
      setPlatformData(prev => ({ 
        ...prev, 
        codeforces: { 
          loading: false, 
          data: { 
            rating: user.rating || 'Unrated', 
            maxRating: user.maxRating || 'N/A', 
            rank: user.rank || 'Unrated', 
            maxRank: user.maxRank || 'N/A', 
            solved: solvedCount, 
          }, 
          error: null 
        } 
      })); 
    } catch (error) { 
      console.error('Codeforces fetch error:', error); 
      setPlatformData(prev => ({ 
        ...prev, 
        codeforces: { 
          loading: false, 
          data: null, 
          error: 'Failed to fetch Codeforces data.' 
        } 
      })); 
    } 
  };
  
  const fetchHackerRankData = async () => { 
    setPlatformData(prev => ({ 
      ...prev, 
      hackerrank: { 
        loading: false, 
        data: { 
          solved: student.hackerrankSolved || 0, 
          badges: student.hackerrankBadges || 0, 
          stars: student.hackerrankStars || 0, 
        }, 
        error: null 
      } 
    })); 
  };
  
  const fetchAtCoderData = async () => { 
    setPlatformData(prev => ({ 
      ...prev, 
      atcoder: { 
        loading: false, 
        data: { 
          solved: student.atcoderSolved || 0, 
          rating: student.atcoderRating || 'Unrated', 
          maxRating: student.atcoderMaxRating || 'N/A', 
        }, 
        error: null 
      } 
    })); 
  };
  
  const fetchGitHubData = async (url) => { 
    try { 
      const username = url.split('/').filter(Boolean).pop(); 
      const response = await fetch(`https://api.github.com/users/${username}`); 
      
      if (!response.ok) throw new Error(`GitHub API error: ${response.statusText}`); 
      
      const data = await response.json(); 
      setPlatformData(prev => ({ 
        ...prev, 
        github: { 
          loading: false, 
          data: { 
            repos: data.public_repos || 0, 
            followers: data.followers || 0, 
            following: data.following || 0, 
          }, 
          error: null 
        } 
      })); 
    } catch (error) { 
      console.error('GitHub fetch error:', error); 
      setPlatformData(prev => ({ 
        ...prev, 
        github: { 
          loading: false, 
          data: null, 
          error: 'Failed to fetch GitHub data.' 
        } 
      })); 
    } 
  };

  const calculateTotalSolved = () => {
    const values = [ 
      platformData.leetcode.data?.totalSolved, 
      platformData.codeforces.data?.solved, 
      platformData.hackerrank.data?.solved, 
      platformData.atcoder.data?.solved 
    ];
    return values.reduce((sum, val) => sum + (Number.isInteger(val) ? val : 0), 0);
  };
  
  const platformOrder = ['leetcode', 'codeforces', 'github', 'hackerrank', 'atcoder'];
  const availablePlatforms = platformOrder.filter(p => student.platformUrls?.[p]);
  
  const getInitials = (name = '') => {
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  const snapshotData = [
    { label: "Total Problems Solved", value: calculateTotalSolved(), maxValue: 2000, color: "text-blue-500" },
    { label: "GitHub Repositories", value: platformData.github.data?.repos ?? 0, maxValue: 100, color: "text-purple-500" },
    { label: "Active Platforms", value: availablePlatforms.length, maxValue: 5, color: "text-emerald-500" },
    { label: "HackerRank Badges", value: platformData.hackerrank.data?.badges ?? 0, maxValue: 50, color: "text-amber-500" },
  ];

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
        </header>

        {/* Body */}
        <main className="overflow-y-auto flex-1 p-8 bg-slate-100/70">
          <section className="opacity-0 animate-fadeIn" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
            <h3 className="text-base font-semibold text-slate-500 mb-4 uppercase tracking-wider flex items-center gap-2">
              {/* <svg className="w-5 h-5 text-blue-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg> */}
              Overall Snapshot
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ">
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

          <section className="mt-10 opacity-0 animate-fadeIn" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
            <h3 className="text-base font-semibold text-slate-500 mb-4 uppercase tracking-wider flex items-center gap-2">
              {/* <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg> */}
              Platform Details
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {availablePlatforms.map((platform, index) => {
                const { loading, error, data } = platformData[platform];
                const profileUrl = student.platformUrls[platform];

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
                        <h4 className="text-2xl font-bold text-slate-800 capitalize">{platform}</h4>
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
                      {loading ? (
                        <SkeletonLoader />
                      ) : error ? (
                        <ErrorDisplay message={error} />
                      ) : data ? (
                        <dl>
                          {platform === 'leetcode' && (
                            <>
                              <StatItem label="Total Solved" value={data.totalSolved} />
                              <LeetCodeDifficultyStats easy={data.easy} medium={data.medium} hard={data.hard} />
                            </>
                          )}
                          
                          {platform === 'codeforces' && (
                            <>
                              <StatItem label="Problems Solved" value={data.solved} />
                              <StatItem label="Current Rating" value={data.rating} />
                              <StatItem label="Max Rating" value={data.maxRating} />
                              <StatItem label="Rank" value={data.rank} />
                            </>
                          )}
                          
                          {platform === 'hackerrank' && (
                            <>
                              <StatItem label="Problems Solved" value={data.solved} />
                              <StatItem label="Badges Earned" value={data.badges} />
                              <StatItem label="Total Stars" value={data.stars} />
                            </>
                          )}
                          
                          {platform === 'atcoder' && (
                            <>
                              <StatItem label="Problems Solved" value={data.solved} />
                              <StatItem label="Current Rating" value={data.rating} />
                              <StatItem label="Max Rating" value={data.maxRating} />
                            </>
                          )}
                          
                          {platform === 'github' && (
                            <>
                              <StatItem label="Public Repositories" value={data.repos} />
                              <StatItem label="Followers" value={data.followers} />
                              <StatItem label="Following" value={data.following} />
                            </>
                          )}
                        </dl>
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-500">
                          No data available for this platform.
                        </div>
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
document.head.insertAdjacentHTML('beforeend', `
<style>
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
</style>
`);

export default StudentViewDetails;
