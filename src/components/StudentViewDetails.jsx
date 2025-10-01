// src/components/StudentViewDetails.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const StudentViewDetails = ({ student, onClose }) => {
  const [platformData, setPlatformData] = useState({
    leetcode: { loading: true, data: null, error: null },
    codeforces: { loading: true, data: null, error: null },
    hackerrank: { loading: true, data: null, error: null },
    atcoder: { loading: true, data: null, error: null },
    github: { loading: true, data: null, error: null }
  });

  useEffect(() => {
    if (student) {
      fetchAllPlatformData();
    }
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
      
      setPlatformData(prev => ({
        ...prev,
        leetcode: {
          loading: false,
          data: {
            totalSolved: data.totalSolved || 0,
            easy: data.easySolved || 0,
            medium: data.mediumSolved || 0,
            hard: data.hardSolved || 0,
            ranking: data.ranking || 'N/A',
            acceptanceRate: data.acceptanceRate || 'N/A'
          },
          error: null
        }
      }));
    } catch (error) {
      console.error('LeetCode fetch error:', error);
      setPlatformData(prev => ({
        ...prev,
        leetcode: { loading: false, data: null, error: 'Failed to fetch data' }
      }));
    }
  };

  const fetchCodeforcesData = async (url) => {
    try {
      const username = url.split('/').filter(Boolean).pop();
      const response = await fetch(`https://codeforces.com/api/user.info?handles=${username}`);
      const data = await response.json();
      
      if (data.status === 'OK' && data.result && data.result.length > 0) {
        const user = data.result[0];
        
        const submissionsResponse = await fetch(`https://codeforces.com/api/user.status?handle=${username}`);
        const submissionsData = await submissionsResponse.json();
        
        let solvedCount = 0;
        if (submissionsData.status === 'OK') {
          const solvedProblems = new Set();
          submissionsData.result.forEach(submission => {
            if (submission.verdict === 'OK') {
              solvedProblems.add(`${submission.problem.contestId}-${submission.problem.index}`);
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
              contribution: user.contribution || 0
            },
            error: null
          }
        }));
      } else {
        throw new Error('User not found');
      }
    } catch (error) {
      console.error('Codeforces fetch error:', error);
      setPlatformData(prev => ({
        ...prev,
        codeforces: { loading: false, data: null, error: 'Failed to fetch data' }
      }));
    }
  };

  const fetchHackerRankData = async (url) => {
    setPlatformData(prev => ({
      ...prev,
      hackerrank: {
        loading: false,
        data: {
          solved: student.hackerrankSolved || 0,
          badges: student.hackerrankBadges || 0,
          stars: student.hackerrankStars || 0,
          certificates: student.hackerrankCertificates || 0
        },
        error: null
      }
    }));
  };

  const fetchAtCoderData = async (url) => {
    try {
      setPlatformData(prev => ({
        ...prev,
        atcoder: {
          loading: false,
          data: {
            solved: student.atcoderSolved || 0,
            rating: student.atcoderRating || 'Unrated',
            maxRating: student.atcoderMaxRating || 'N/A',
            rank: student.atcoderRank || 'N/A'
          },
          error: null
        }
      }));
    } catch (error) {
      console.error('AtCoder fetch error:', error);
      setPlatformData(prev => ({
        ...prev,
        atcoder: { loading: false, data: null, error: 'Failed to fetch data' }
      }));
    }
  };

  const fetchGitHubData = async (url) => {
    try {
      const username = url.split('/').filter(Boolean).pop();
      const response = await fetch(`https://api.github.com/users/${username}`);
      
      if (!response.ok) throw new Error('GitHub API error');
      
      const data = await response.json();
      
      const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`);
      let totalStars = 0;
      if (reposResponse.ok) {
        const repos = await reposResponse.json();
        totalStars = repos.reduce((acc, repo) => acc + (repo.stargazers_count || 0), 0);
      }
      
      setPlatformData(prev => ({
        ...prev,
        github: {
          loading: false,
          data: {
            repos: data.public_repos || 0,
            followers: data.followers || 0,
            following: data.following || 0,
            gists: data.public_gists || 0,
            stars: totalStars,
            bio: data.bio || 'No bio available'
          },
          error: null
        }
      }));
    } catch (error) {
      console.error('GitHub fetch error:', error);
      setPlatformData(prev => ({
        ...prev,
        github: { loading: false, data: null, error: 'Failed to fetch data' }
      }));
    }
  };

  const calculateTotalSolved = () => {
    let total = 0;
    if (platformData.leetcode.data) total += platformData.leetcode.data.totalSolved;
    if (platformData.codeforces.data) total += platformData.codeforces.data.solved;
    if (platformData.hackerrank.data) total += platformData.hackerrank.data.solved;
    if (platformData.atcoder.data) total += platformData.atcoder.data.solved;
    return total;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-blue-600 px-8 py-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-white mb-2">{student.name}</h2>
              <p className="text-blue-100 text-sm">{student.email}</p>
              <div className="flex gap-4 mt-3 text-sm flex-wrap">
                <span className="text-blue-100">
                  <span className="font-semibold">Reg:</span> {student.registerNumber || 'N/A'}
                </span>
                <span className="text-blue-100">
                  <span className="font-semibold">Roll:</span> {student.rollNumber || 'N/A'}
                </span>
                <span className="text-blue-100">
                  <span className="font-semibold">Dept:</span> {student.department || 'N/A'}
                </span>
                <span className="text-blue-100">
                  <span className="font-semibold">Year:</span> {student.year || 'N/A'}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-blue-700 rounded-lg p-2 transition-colors ml-4"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-8">
          {/* Overall Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-600 mb-1">Total Problems</p>
              <p className="text-3xl font-bold text-gray-900">{calculateTotalSolved()}</p>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-600 mb-1">GitHub Repos</p>
              <p className="text-3xl font-bold text-gray-900">
                {platformData.github.data?.repos || 0}
              </p>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-600 mb-1">Active Platforms</p>
              <p className="text-3xl font-bold text-gray-900">
                {student.platformUrls ? Object.values(student.platformUrls).filter(url => url).length : 0}
              </p>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-600 mb-1">Last Updated</p>
              <p className="text-sm font-semibold text-gray-900">
                {student.scrapingStatus?.lastUpdated 
                  ? new Date(student.scrapingStatus.lastUpdated).toLocaleDateString() 
                  : 'Never'}
              </p>
            </div>
          </div>

          {/* Platform Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LeetCode */}
            {student.platformUrls?.leetcode && (
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-400 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">LeetCode</h3>
                  <a
                    href={student.platformUrls.leetcode}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Profile →
                  </a>
                </div>
                {platformData.leetcode.loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
                  </div>
                ) : platformData.leetcode.error ? (
                  <p className="text-red-600 text-sm">{platformData.leetcode.error}</p>
                ) : platformData.leetcode.data ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-700">Total Solved</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {platformData.leetcode.data.totalSolved}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Easy</p>
                        <p className="text-xl font-bold text-green-600">{platformData.leetcode.data.easy}</p>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Medium</p>
                        <p className="text-xl font-bold text-yellow-600">{platformData.leetcode.data.medium}</p>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Hard</p>
                        <p className="text-xl font-bold text-red-600">{platformData.leetcode.data.hard}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No data available</p>
                )}
              </div>
            )}

            {/* Codeforces */}
            {student.platformUrls?.codeforces && (
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-400 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Codeforces</h3>
                  <a
                    href={student.platformUrls.codeforces}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Profile →
                  </a>
                </div>
                {platformData.codeforces.loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
                  </div>
                ) : platformData.codeforces.error ? (
                  <p className="text-red-600 text-sm">{platformData.codeforces.error}</p>
                ) : platformData.codeforces.data ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-700">Problems Solved</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {platformData.codeforces.data.solved}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Rating</p>
                        <p className="text-lg font-bold text-blue-600">{platformData.codeforces.data.rating}</p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Max Rating</p>
                        <p className="text-lg font-bold text-blue-600">{platformData.codeforces.data.maxRating}</p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Rank</p>
                        <p className="text-lg font-bold text-blue-600">{platformData.codeforces.data.rank}</p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Max Rank</p>
                        <p className="text-lg font-bold text-blue-600">{platformData.codeforces.data.maxRank}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No data available</p>
                )}
              </div>
            )}

            {/* HackerRank */}
            {student.platformUrls?.hackerrank && (
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-400 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">HackerRank</h3>
                  <a
                    href={student.platformUrls.hackerrank}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Profile →
                  </a>
                </div>
                {platformData.hackerrank.loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
                  </div>
                ) : platformData.hackerrank.data ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-700">Problems Solved</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {platformData.hackerrank.data.solved}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Badges</p>
                        <p className="text-lg font-bold text-green-600">{platformData.hackerrank.data.badges}</p>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Stars</p>
                        <p className="text-lg font-bold text-yellow-600">{platformData.hackerrank.data.stars}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No data available</p>
                )}
              </div>
            )}

            {/* AtCoder */}
            {student.platformUrls?.atcoder && (
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-400 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">AtCoder</h3>
                  <a
                    href={student.platformUrls.atcoder}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Profile →
                  </a>
                </div>
                {platformData.atcoder.loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
                  </div>
                ) : platformData.atcoder.data ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-700">Problems Solved</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {platformData.atcoder.data.solved}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Rating</p>
                        <p className="text-lg font-bold text-blue-600">{platformData.atcoder.data.rating}</p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Max Rating</p>
                        <p className="text-lg font-bold text-blue-600">{platformData.atcoder.data.maxRating}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No data available</p>
                )}
              </div>
            )}

            {/* GitHub */}
            {student.platformUrls?.github && (
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-400 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">GitHub</h3>
                  <a
                    href={student.platformUrls.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Profile →
                  </a>
                </div>
                {platformData.github.loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
                  </div>
                ) : platformData.github.error ? (
                  <p className="text-red-600 text-sm">{platformData.github.error}</p>
                ) : platformData.github.data ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-700">Public Repositories</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {platformData.github.data.repos}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 bg-blue-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Followers</p>
                        <p className="text-lg font-bold text-blue-600">{platformData.github.data.followers}</p>
                      </div>
                      <div className="text-center p-2 bg-blue-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Following</p>
                        <p className="text-lg font-bold text-blue-600">{platformData.github.data.following}</p>
                      </div>
                      <div className="text-center p-2 bg-blue-50 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Stars</p>
                        <p className="text-lg font-bold text-blue-600">{platformData.github.data.stars}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No data available</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Close
          </button>
          <Link
            to={`/admin/students/${student.id}`}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Edit Student Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentViewDetails;