import React, { useState, useEffect } from 'react';

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
    const resultDate = new Date(now.getTime());
    resultDate.setDate(now.getDate() + (dayOfWeek + 7 - now.getDay()) % 7);
    resultDate.setHours(hour, minute, 0, 0);

    // If the calculated date is in the past, move to the next week
    if (resultDate < now) {
      resultDate.setDate(resultDate.getDate() + 7);
    }
    return resultDate;
  };

  const fetchContests = async () => {
    try {
      // Use Promise.allSettled to handle multiple data sources gracefully
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
          .slice(0, 5) // Get the top 5 upcoming from CF
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
      const leetcodeWeeklyDate = getNextDayOfWeek(0, 8, 0); // LeetCode Weekly: Sunday 8:00 AM
      const atcoderBeginnerDate = getNextDayOfWeek(6, 17, 30); // AtCoder Beginner: Saturday 5:30 PM
      
      const placeholderContests = [
        { 
          id: 'lc-placeholder-1', 
          name: 'LeetCode Weekly Contest', 
          platform: 'LeetCode', 
          date: new Intl.DateTimeFormat('en-GB').format(leetcodeWeeklyDate),
          time: new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).format(leetcodeWeeklyDate),
          duration: '1h 30m', 
          url: 'https://leetcode.com/contest/',
          startTime: leetcodeWeeklyDate.getTime()
        },
        { 
          id: 'ac-placeholder-1', 
          name: 'AtCoder Beginner Contest', 
          platform: 'AtCoder', 
          date: new Intl.DateTimeFormat('en-GB').format(atcoderBeginnerDate),
          time: new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).format(atcoderBeginnerDate),
          duration: '1h 40m', 
          url: 'https://atcoder.jp/contests/',
          startTime: atcoderBeginnerDate.getTime()
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
    { title: 'Unified Dashboard', description: 'Aggregate stats from LeetCode, Codeforces, CodeChef, AtCoder, and GitHub in one place' },
    { title: 'Real-time Analytics', description: 'Track your progress with detailed charts, heatmaps, and performance metrics' },
    { title: 'AI Profile Summary', description: 'Generate recruiter-ready summaries of your coding achievements with AI' },
    { title: 'Contest Calendar', description: 'Never miss a coding contest with our integrated calendar and reminders' },
    { title: 'Social Feed', description: 'Connect with other developers, share achievements, and stay motivated' },
    { title: 'Portfolio Builder', description: 'Create stunning portfolio pages to showcase your skills to recruiters' }
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

  return (
    <div className="min-h-screen bg-white">
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out forwards; }
        .delay-100 { animation-delay: 0.1s; opacity: 0; }
        .delay-200 { animation-delay: 0.2s; opacity: 0; }
        .delay-300 { animation-delay: 0.3s; opacity: 0; }
        .delay-400 { animation-delay: 0.4s; opacity: 0; }
        .card-hover { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(59, 130, 246, 0.15); }
        .button-hover { transition: all 0.2s ease; }
        .button-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3); }
        .text-hover { transition: color 0.2s ease; }
      `}</style>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${ scrolled ? 'bg-white shadow-md' : 'bg-white' }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm">CT</div>
              <span className="text-xl font-semibold text-gray-900">CodeTrack Pro</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 text-hover hover:text-blue-600 font-medium">Features</a>
              <a href="#contests" className="text-gray-600 text-hover hover:text-blue-600 font-medium">Contests</a>
              <a href="#pricing" className="text-gray-600 text-hover hover:text-blue-600 font-medium">Pricing</a>
            </div>
            <div className="flex space-x-3">
              <button className="px-5 py-2 text-gray-700 font-medium text-hover hover:text-blue-600">Sign In</button>
              <button className="px-5 py-2 bg-blue-600 text-white rounded font-medium button-hover hover:bg-blue-700">Get Started</button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-16">
        <div className="pt-24 pb-16 px-6">
          <div className="max-w-7xl mx-auto text-center max-w-4xl">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight animate-fadeIn">Track Your Coding Journey with Precision</h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed animate-fadeIn delay-100">Unified dashboard for all your competitive programming profiles. Real-time analytics, AI insights, and career growth tools in one place.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12 animate-fadeIn delay-200">
              <button className="px-8 py-3 bg-blue-600 text-white rounded font-semibold button-hover hover:bg-blue-700">Start Free Trial</button>
              <button className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded font-semibold button-hover hover:border-blue-600 hover:text-blue-600">Watch Demo</button>
            </div>
            <div className="flex flex-wrap justify-center gap-3 animate-fadeIn delay-300">
              {platforms.map((platform, i) => (<span key={i} className="px-4 py-2 bg-gray-50 text-gray-700 rounded-full text-sm font-medium border border-gray-200">{platform}</span>))}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="py-16 px-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12"><h2 className="text-4xl font-bold text-gray-900 mb-3">Powerful Features</h2><p className="text-lg text-gray-600">Everything you need to track and grow your coding career</p></div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <div key={i} className={`bg-white p-8 rounded-lg border border-gray-200 card-hover animate-fadeIn delay-${(i + 1) * 100}`}>
                  <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center mb-4"><div className="w-6 h-6 bg-blue-600 rounded"></div></div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="py-16 px-6 bg-white">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (<div key={i} className={`text-center animate-fadeIn delay-${(i + 1) * 100}`}><div className="text-5xl font-bold text-blue-600 mb-2">{stat.value}</div><div className="text-gray-600 font-medium">{stat.label}</div></div>))}
          </div>
        </div>

        {/* Contests Section */}
        <div id="contests" className="py-16 px-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10"><h2 className="text-4xl font-bold text-gray-900 mb-3">Upcoming Contests</h2><p className="text-lg text-gray-600">Never miss a coding competition</p></div>
            <div className="flex justify-center gap-2 mb-8 flex-wrap">
              <button onClick={() => setActiveTab('all')} className={`px-5 py-2 rounded font-medium transition-all ${activeTab === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-600 hover:text-blue-600'}`}>All Platforms</button>
              {['LeetCode', 'Codeforces', 'AtCoder'].map(platform => (<button key={platform} onClick={() => setActiveTab(platform)} className={`px-5 py-2 rounded font-medium transition-all ${activeTab.toLowerCase() === platform.toLowerCase() ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-600 hover:text-blue-600'}`}>{platform}</button>))}
            </div>
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600">Loading contests...</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {filteredContests.length > 0 ? (filteredContests.map((contest) => (
                  <div key={contest.id} className="bg-white rounded-lg p-6 border border-gray-200 card-hover">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex-1 pr-4">{contest.name}</h3>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full whitespace-nowrap">{contest.platform}</span>
                    </div>
                    <div className="space-y-2 text-gray-600 text-sm">
                      <div className="flex items-center justify-between"><span>📅 {contest.date}</span><span>⏰ {contest.time}</span></div>
                      <div className="flex items-center"><span>⏱️ Duration: {contest.duration}</span></div>
                    </div>
                    {contest.url && (<a href={contest.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors">Register Now →</a>)}
                  </div>
                ))) : (
                  <div className="col-span-2 text-center py-12 text-gray-600 bg-white rounded-lg border">
                    <p className="font-semibold text-lg">No upcoming contests found.</p><p>Please check back later or select another platform.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-16 px-6 bg-white">
          <div className="max-w-4xl mx-auto bg-blue-50 rounded-xl p-12 text-center border border-blue-100">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Ready to Level Up?</h2>
            <p className="text-lg text-gray-600 mb-8">Join thousands of developers tracking their coding journey</p>
            <button className="px-10 py-3 bg-blue-600 text-white rounded font-semibold button-hover hover:bg-blue-700">Create Free Account</button>
            <p className="mt-4 text-sm text-gray-500">No credit card required • 14-day free trial</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-3"><div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">CT</div><span className="text-lg font-semibold text-gray-900">CodeTrack Pro</span></div>
              <p className="text-gray-600 text-sm">Empowering developers to track and grow their coding careers</p>
            </div>
            <div><h4 className="font-semibold text-gray-900 mb-3">Product</h4><ul className="space-y-2 text-gray-600 text-sm"><li className="text-hover hover:text-blue-600 cursor-pointer">Features</li><li className="text-hover hover:text-blue-600 cursor-pointer">Pricing</li><li className="text-hover hover:text-blue-600 cursor-pointer">API</li><li className="text-hover hover:text-blue-600 cursor-pointer">Integrations</li></ul></div>
            <div><h4 className="font-semibold text-gray-900 mb-3">Company</h4><ul className="space-y-2 text-gray-600 text-sm"><li className="text-hover hover:text-blue-600 cursor-pointer">About Us</li><li className="text-hover hover:text-blue-600 cursor-pointer">Blog</li><li className="text-hover hover:text-blue-600 cursor-pointer">Careers</li><li className="text-hover hover:text-blue-600 cursor-pointer">Press</li></ul></div>
            <div><h4 className="font-semibold text-gray-900 mb-3">Resources</h4><ul className="space-y-2 text-gray-600 text-sm"><li className="text-hover hover:text-blue-600 cursor-pointer">Documentation</li><li className="text-hover hover:text-blue-600 cursor-pointer">Help Center</li><li className="text-hover hover:text-blue-600 cursor-pointer">Community</li><li className="text-hover hover:text-blue-600 cursor-pointer">Contact</li></ul></div>
          </div>
          <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
            <p>&copy; 2025 CodeTrack Pro. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-hover hover:text-blue-600">Privacy Policy</a>
              <a href="#" className="text-hover hover:text-blue-600">Terms of Service</a>
              <a href="#" className="text-hover hover:text-blue-600">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;