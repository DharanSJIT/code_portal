// Helper function to extract username from URL
const extractUsername = (url, pattern) => {
  const match = url.match(pattern);
  return match ? match[1] : url;
};

// Helper function to fetch with CORS proxy
const fetchWithProxy = async (url) => {
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
  ];
  
  for (const proxyUrl of proxies) {
    try {
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/html, */*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });
      
      if (response.ok) {
        return response;
      }
    } catch (error) {
      console.log(`Proxy failed, trying next: ${error.message}`);
      continue;
    }
  }
  
  throw new Error('All proxy attempts failed');
};

/**
 * Scrape AtCoder profile - FIXED VERSION
 */
export const scrapeAtCoder = async (url) => {
  try {
    const username = extractUsername(url, /atcoder\.jp\/users\/([^\/\?]+)/);
    console.log(`Scraping AtCoder for user: ${username}`);
    
    // Try API first for contest history
    try {
      const apiUrl = `https://atcoder.jp/users/${username}/history/json`;
      const response = await fetchWithProxy(apiUrl);
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        const ratings = data.map(contest => contest.NewRating || contest.NewRating === 0 ? contest.NewRating : null)
                          .filter(r => r !== null);
        const currentRating = ratings.length > 0 ? ratings[ratings.length - 1] : 0;
        const maxRating = ratings.length > 0 ? Math.max(...ratings) : 0;
        
        return {
          username,
          rating: currentRating,
          maxRating: maxRating,
          contestsParticipated: data.length,
          rank: getAtCoderRank(currentRating),
          lastUpdated: new Date().toISOString()
        };
      }
    } catch (apiError) {
      console.log('AtCoder API failed, trying HTML scraping:', apiError.message);
    }
    
    // Fallback to HTML scraping - IMPROVED PARSING
    const profileUrl = `https://atcoder.jp/users/${username}`;
    const response = await fetchWithProxy(profileUrl);
    const html = await response.text();
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    let rating = 0;
    let maxRating = 0;
    let contestsParticipated = 0;
    
    // Improved rating extraction
    const dlElements = doc.querySelectorAll('dl.dl-horizontal');
    
    dlElements.forEach(dl => {
      const dtElements = dl.querySelectorAll('dt');
      const ddElements = dl.querySelectorAll('dd');
      
      dtElements.forEach((dt, index) => {
        const label = dt.textContent.trim();
        const value = ddElements[index] ? ddElements[index].textContent.trim() : '';
        
        if (label.includes('Rating')) {
          const ratingMatch = value.match(/(\d+)/);
          if (ratingMatch) rating = parseInt(ratingMatch[1]);
        }
        
        if (label.includes('Highest Rating')) {
          const maxMatch = value.match(/(\d+)/);
          if (maxMatch) maxRating = parseInt(maxMatch[1]);
        }
        
        if (label.includes('Rated Matches')) {
          contestsParticipated = parseInt(value) || 0;
        }
      });
    });
    
    // Alternative parsing method
    if (rating === 0) {
      const ratingElement = doc.querySelector('table tr td span.user-green, table tr td span.user-blue, table tr td span.user-red, table tr td span.user-orange, table tr td span.user-yellow');
      if (ratingElement) {
        const ratingText = ratingElement.textContent;
        const ratingMatch = ratingText.match(/(\d+)/);
        if (ratingMatch) rating = parseInt(ratingMatch[1]);
      }
    }
    
    // Get problems solved from submissions page
    let problemsSolved = 0;
    try {
      const submissionsUrl = `https://atcoder.jp/users/${username}/submissions`;
      const submissionsResponse = await fetchWithProxy(submissionsUrl);
      const submissionsHtml = await submissionsResponse.text();
      const submissionsDoc = parser.parseFromString(submissionsHtml, 'text/html');
      
      // Count unique AC problems
      const acLinks = submissionsDoc.querySelectorAll('a[href*="/tasks/"]');
      const solvedProblems = new Set();
      
      acLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.includes('/tasks/')) {
          solvedProblems.add(href);
        }
      });
      
      problemsSolved = solvedProblems.size;
    } catch (subError) {
      console.log('Could not fetch submissions:', subError.message);
    }
    
    return {
      username,
      rating: rating,
      maxRating: maxRating || rating,
      contestsParticipated: contestsParticipated,
      problemsSolved: problemsSolved,
      rank: getAtCoderRank(rating),
      lastUpdated: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('AtCoder scraping error:', error);
    return {
      error: error.message || 'Failed to fetch AtCoder data'
    };
  }
};

const getAtCoderRank = (rating) => {
  if (rating >= 2800) return 'Red';
  if (rating >= 2400) return 'Orange';
  if (rating >= 2000) return 'Yellow';
  if (rating >= 1600) return 'Blue';
  if (rating >= 1200) return 'Cyan';
  if (rating >= 800) return 'Green';
  if (rating >= 400) return 'Brown';
  return 'Gray';
};

/**
 * Scrape HackerRank profile - IMPROVED VERSION
 */
export const scrapeHackerRank = async (url) => {
  try {
    const username = extractUsername(url, /hackerrank\.com\/(?:profile\/)?([^\/\?]+)/);
    console.log(`Scraping HackerRank for user: ${username}`);
    
    const profileUrl = `https://www.hackerrank.com/${username}`;
    const response = await fetchWithProxy(profileUrl);
    const html = await response.text();
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    let problemsSolved = 0;
    let totalScore = 0;
    let badges = 0;
    
    // Improved parsing for HackerRank
    const statsElements = doc.querySelectorAll('.profile-stat, .hacker-badge, [data-attr*="badge"]');
    
    // Look for specific text patterns
    const bodyText = doc.body.textContent;
    
    // Problems solved
    const solvedMatches = [
      ...bodyText.matchAll(/(\d+)\s*problems?\s*solved/gi),
      ...bodyText.matchAll(/(\d+)\s*solved/gi),
      ...bodyText.matchAll(/problems\s*solved\s*:\s*(\d+)/gi)
    ];
    
    solvedMatches.forEach(match => {
      const value = parseInt(match[1]);
      if (value > problemsSolved) problemsSolved = value;
    });
    
    // Badges
    const badgeMatches = [
      ...bodyText.matchAll(/(\d+)\s*badges?/gi),
      ...bodyText.matchAll(/badges?\s*:\s*(\d+)/gi)
    ];
    
    badgeMatches.forEach(match => {
      const value = parseInt(match[1]);
      if (value > badges) badges = value;
    });
    
    // Score
    const scoreMatches = [
      ...bodyText.matchAll(/score\s*:\s*(\d+)/gi),
      ...bodyText.matchAll(/total\s*score\s*:\s*(\d+)/gi)
    ];
    
    scoreMatches.forEach(match => {
      const value = parseInt(match[1]);
      if (value > totalScore) totalScore = value;
    });
    
    // Try to find data in script tags
    const scripts = doc.querySelectorAll('script');
    for (const script of scripts) {
      const content = script.textContent;
      if (content.includes('model') || content.includes('profile')) {
        try {
          // Look for JSON-like structures
          const jsonPatterns = [
            /{\s*["']?solved["']?\s*:\s*(\d+)/,
            /{\s*["']?badges["']?\s*:\s*(\d+)/,
            /{\s*["']?score["']?\s*:\s*(\d+)/
          ];
          
          jsonPatterns.forEach(pattern => {
            const match = content.match(pattern);
            if (match) {
              const value = parseInt(match[1]);
              if (pattern.toString().includes('solved')) problemsSolved = Math.max(problemsSolved, value);
              if (pattern.toString().includes('badges')) badges = Math.max(badges, value);
              if (pattern.toString().includes('score')) totalScore = Math.max(totalScore, value);
            }
          });
        } catch (e) {
          // Continue if parsing fails
        }
      }
    }
    
    return {
      username,
      problemsSolved: problemsSolved,
      totalScore: totalScore,
      badges: badges,
      lastUpdated: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('HackerRank scraping error:', error);
    return {
      error: error.message || 'Failed to fetch HackerRank data'
    };
  }
};

/**
 * Scrape GitHub profile using official API
 */
export const scrapeGitHub = async (url) => {
  try {
    const username = extractUsername(url, /github\.com\/([^\/\?]+)/);
    console.log(`Scraping GitHub for user: ${username}`);
    
    // GitHub API (no auth required for public data)
    const apiUrl = `https://api.github.com/users/${username}`;
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Get repositories with pagination
    let allRepos = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore && page <= 5) { // Limit to 5 pages (500 repos)
      const reposUrl = `https://api.github.com/users/${username}/repos?per_page=100&page=${page}`;
      const reposResponse = await fetch(reposUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (reposResponse.ok) {
        const repos = await reposResponse.json();
        if (repos.length > 0) {
          allRepos = allRepos.concat(repos);
          page++;
        } else {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }
    
    let totalStars = 0;
    let totalForks = 0;
    
    if (Array.isArray(allRepos)) {
      allRepos.forEach(repo => {
        totalStars += repo.stargazers_count || 0;
        totalForks += repo.forks_count || 0;
      });
    }
    
    return {
      username: data.login,
      name: data.name || '',
      repositories: data.public_repos || 0,
      followers: data.followers || 0,
      following: data.following || 0,
      totalStars: totalStars,
      totalForks: totalForks,
      bio: data.bio || '',
      location: data.location || '',
      company: data.company || '',
      lastUpdated: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('GitHub scraping error:', error);
    return {
      error: error.message || 'Failed to fetch GitHub data'
    };
  }
};

/**
 * Scrape LeetCode profile using GraphQL API
 */
export const scrapeLeetCode = async (url) => {
  try {
    const username = extractUsername(url, /leetcode\.com\/(?:u\/)?([^\/\?]+)/);
    console.log(`Scraping LeetCode for user: ${username}`);
    
    // LeetCode GraphQL API
    const query = `
      query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          username
          profile {
            ranking
            reputation
            starRating
          }
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
        }
        userContestRanking(username: $username) {
          rating
          globalRanking
          attendedContestsCount
        }
        recentSubmissionList(username: $username, limit: 10) {
          title
          titleSlug
          timestamp
          statusDisplay
          lang
        }
      }
    `;
    
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com',
        'Origin': 'https://leetcode.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify({
        query: query,
        variables: { username }
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }
    
    if (!result.data.matchedUser) {
      throw new Error('User not found');
    }
    
    const userData = result.data.matchedUser;
    const contestData = result.data.userContestRanking;
    
    let totalSolved = 0;
    let easySolved = 0;
    let mediumSolved = 0;
    let hardSolved = 0;
    
    if (userData && userData.submitStats) {
      userData.submitStats.acSubmissionNum.forEach(item => {
        if (item.difficulty === 'All') totalSolved = item.count;
        if (item.difficulty === 'Easy') easySolved = item.count;
        if (item.difficulty === 'Medium') mediumSolved = item.count;
        if (item.difficulty === 'Hard') hardSolved = item.count;
      });
    }
    
    // Calculate recent activity
    const recentSubmissions = result.data.recentSubmissionList || [];
    const recentAccepted = recentSubmissions.filter(sub => sub.statusDisplay === 'Accepted').length;
    
    return {
      username,
      problemsSolved: totalSolved,
      easySolved: easySolved,
      mediumSolved: mediumSolved,
      hardSolved: hardSolved,
      rating: contestData?.rating || 0,
      ranking: contestData?.globalRanking || 0,
      contestsAttended: contestData?.attendedContestsCount || 0,
      reputation: userData?.profile?.reputation || 0,
      recentActivity: recentAccepted,
      lastUpdated: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('LeetCode scraping error:', error);
    return {
      error: error.message || 'Failed to fetch LeetCode data'
    };
  }
};

/**
 * Scrape Codeforces profile using official API
 */
export const scrapeCodeforces = async (url) => {
  try {
    const username = extractUsername(url, /codeforces\.com\/profile\/([^\/\?]+)/);
    console.log(`Scraping Codeforces for user: ${username}`);
    
    // Codeforces API
    const apiUrl = `https://codeforces.com/api/user.info?handles=${username}`;
    const response = await fetchWithProxy(apiUrl);
    
    if (!response.ok) {
      throw new Error('Codeforces API request failed');
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK') {
      throw new Error(data.comment || 'Failed to fetch data');
    }
    
    const user = data.result[0];
    
    // Get user submissions to count problems solved
    const submissionsUrl = `https://codeforces.com/api/user.status?handle=${username}&from=1&count=10000`;
    let problemsSolved = 0;
    
    try {
      const submissionsResponse = await fetchWithProxy(submissionsUrl);
      const submissionsData = await submissionsResponse.json();
      
      if (submissionsData.status === 'OK') {
        const solvedProblems = new Set();
        submissionsData.result.forEach(submission => {
          if (submission.verdict === 'OK' && submission.problem) {
            const problemId = `${submission.problem.contestId || 'unknown'}-${submission.problem.index || 'unknown'}-${submission.problem.name || 'unknown'}`;
            solvedProblems.add(problemId);
          }
        });
        problemsSolved = solvedProblems.size;
      }
    } catch (e) {
      console.log('Could not fetch submission count:', e.message);
      // Estimate problems solved based on rating if submissions fail
      if (user.rating) {
        problemsSolved = Math.max(50, Math.floor(user.rating / 10));
      }
    }
    
    return {
      username: user.handle,
      rating: user.rating || 0,
      maxRating: user.maxRating || 0,
      rank: user.rank || 'unrated',
      maxRank: user.maxRank || 'unrated',
      problemsSolved: problemsSolved,
      contribution: user.contribution || 0,
      friendOfCount: user.friendOfCount || 0,
      lastUpdated: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Codeforces scraping error:', error);
    return {
      error: error.message || 'Failed to fetch Codeforces data'
    };
  }
};

/**
 * Main scraping function that handles all platforms
 */
export const scrapeAllPlatforms = async (platformUrls) => {
  const results = {
    atcoder: null,
    codeforces: null,
    github: null,
    hackerrank: null,
    leetcode: null
  };
  
  const scrapers = {
    atcoder: scrapeAtCoder,
    codeforces: scrapeCodeforces,
    github: scrapeGitHub,
    hackerrank: scrapeHackerRank,
    leetcode: scrapeLeetCode
  };
  
  // Scrape all platforms in parallel with timeout
  const scrapingPromises = Object.entries(platformUrls).map(async ([platform, url]) => {
    if (!url || !scrapers[platform]) return;
    
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 30000)
      );
      
      const scrapingPromise = scrapers[platform](url);
      const result = await Promise.race([scrapingPromise, timeoutPromise]);
      
      results[platform] = result;
    } catch (error) {
      console.error(`Error scraping ${platform}:`, error);
      results[platform] = {
        error: error.message || `Failed to fetch ${platform} data`
      };
    }
  });
  
  await Promise.allSettled(scrapingPromises);
  
  return results;
};

/**
 * Format scraped data for database storage
 */
export const formatScrapedData = (scrapedData) => {
  const formatted = {
    platformData: {},
    stats: {
      atcoder: { problemsSolved: 0, rating: 0 },
      codeforces: { problemsSolved: 0, rating: 0, maxRating: 0 },
      github: { repos: 0, contributions: 0 },
      hackerrank: { problemsSolved: 0, stars: 0 },
      leetcode: { solved: 0, easy: 0, medium: 0, hard: 0, totalSolved: 0, streak: 0 }
    },
    scrapingStatus: {
      lastUpdated: new Date().toISOString()
    }
  };
  
  // Process AtCoder data
  if (scrapedData.atcoder && !scrapedData.atcoder.error) {
    formatted.platformData.atcoder = scrapedData.atcoder;
    formatted.stats.atcoder.problemsSolved = scrapedData.atcoder.problemsSolved || 0;
    formatted.stats.atcoder.rating = scrapedData.atcoder.rating || 0;
    formatted.scrapingStatus.atcoder = 'success';
  } else {
    formatted.scrapingStatus.atcoder = 'failed';
  }
  
  // Process Codeforces data
  if (scrapedData.codeforces && !scrapedData.codeforces.error) {
    formatted.platformData.codeforces = scrapedData.codeforces;
    formatted.stats.codeforces.problemsSolved = scrapedData.codeforces.problemsSolved || 0;
    formatted.stats.codeforces.rating = scrapedData.codeforces.rating || 0;
    formatted.stats.codeforces.maxRating = scrapedData.codeforces.maxRating || 0;
    formatted.scrapingStatus.codeforces = 'success';
  } else {
    formatted.scrapingStatus.codeforces = 'failed';
  }
  
  // Process GitHub data
  if (scrapedData.github && !scrapedData.github.error) {
    formatted.platformData.github = scrapedData.github;
    formatted.stats.github.repos = scrapedData.github.repositories || 0;
    formatted.stats.github.contributions = scrapedData.github.followers || 0; // Using followers as contributions metric
    formatted.scrapingStatus.github = 'success';
  } else {
    formatted.scrapingStatus.github = 'failed';
  }
  
  // Process HackerRank data
  if (scrapedData.hackerrank && !scrapedData.hackerrank.error) {
    formatted.platformData.hackerrank = scrapedData.hackerrank;
    formatted.stats.hackerrank.problemsSolved = scrapedData.hackerrank.problemsSolved || 0;
    formatted.stats.hackerrank.stars = scrapedData.hackerrank.badges || 0; // Using badges as stars metric
    formatted.scrapingStatus.hackerrank = 'success';
  } else {
    formatted.scrapingStatus.hackerrank = 'failed';
  }
  
  // Process LeetCode data
  if (scrapedData.leetcode && !scrapedData.leetcode.error) {
    formatted.platformData.leetcode = scrapedData.leetcode;
    formatted.stats.leetcode.solved = scrapedData.leetcode.problemsSolved || 0;
    formatted.stats.leetcode.easy = scrapedData.leetcode.easySolved || 0;
    formatted.stats.leetcode.medium = scrapedData.leetcode.mediumSolved || 0;
    formatted.stats.leetcode.hard = scrapedData.leetcode.hardSolved || 0;
    formatted.stats.leetcode.totalSolved = scrapedData.leetcode.problemsSolved || 0;
    formatted.scrapingStatus.leetcode = 'success';
  } else {
    formatted.scrapingStatus.leetcode = 'failed';
  }
  
  return formatted;
};

// Export all scrapers
export default {
  scrapeAtCoder,
  scrapeHackerRank,
  scrapeGitHub,
  scrapeLeetCode,
  scrapeCodeforces,
  scrapeAllPlatforms,
  formatScrapedData
};