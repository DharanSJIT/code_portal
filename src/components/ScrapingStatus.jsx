// src/components/ScrapingStatus.jsx
import { useState, useEffect } from 'react';
import { db } from '../firebase.js';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { 
  scrapeLeetCode, 
  scrapeGitHub, 
  scrapeHackerRank, 
  scrapeCodeforces, 
  scrapeAtCoder 
} from '../utils/scrapers';

const ScrapingStatus = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  
  useEffect(() => {
    fetchScrapingStatus();
  }, []);
  
  const fetchScrapingStatus = async () => {
    try {
      setLoading(true);
      
      const usersQuery = query(
        collection(db, 'users'),
        where('role', '==', 'student')
      );
      
      const usersSnapshot = await getDocs(usersQuery);
      
      const studentsData = [];
      usersSnapshot.forEach(doc => {
        const data = doc.data();
        
        // Only include students who have platform URLs
        if (data.platformUrls && Object.values(data.platformUrls).some(url => url)) {
          studentsData.push({
            id: doc.id,
            name: data.name,
            email: data.email,
            platformUrls: data.platformUrls || {},
            platformData: data.platformData || {},
            scrapingStatus: data.scrapingStatus || {},
            lastAutoSync: data.lastAutoSync || null,
            lastUpdated: data.scrapingStatus?.lastUpdated || null
          });
        }
      });
      
      // Sort by last updated (most recent first)
      studentsData.sort((a, b) => {
        const timeA = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
        const timeB = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
        return timeB - timeA;
      });
      
      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching scraping status:', error);
      toast.error('Failed to load scraping status');
    } finally {
      setLoading(false);
    }
  };
  
  const scrapeStudentPlatforms = async (platformUrls) => {
    const results = {
      leetcode: null,
      github: null,
      hackerrank: null,
      codeforces: null,
      atcoder: null
    };

    const platformScrapers = {
      leetcode: scrapeLeetCode,
      github: scrapeGitHub,
      hackerrank: scrapeHackerRank,
      codeforces: scrapeCodeforces,
      atcoder: scrapeAtCoder
    };

    // Scrape each platform individually
    const scrapePromises = Object.entries(platformUrls).map(async ([platform, url]) => {
      if (!url || !platformScrapers[platform]) return;

      try {
        console.log(`  📡 Scraping ${platform}...`);
        const result = await platformScrapers[platform](url);
        results[platform] = result;
        console.log(`  ✅ ${platform} scraped successfully`);
        return { platform, success: true, data: result };
      } catch (error) {
        console.error(`  ❌ ${platform} scraping failed:`, error.message);
        results[platform] = { error: error.message };
        return { platform, success: false, error: error.message };
      }
    });

    const resultsArray = await Promise.allSettled(scrapePromises);
    return results;
  };

  const formatScrapedData = (scrapedData) => {
    const formatted = {
      platformData: {},
      scrapingStatus: {
        lastUpdated: new Date().toISOString()
      }
    };
    
    // Process each platform
    const platforms = ['leetcode', 'github', 'hackerrank', 'codeforces', 'atcoder'];
    platforms.forEach(platform => {
      if (scrapedData[platform] && !scrapedData[platform].error) {
        formatted.platformData[platform] = scrapedData[platform];
        formatted.scrapingStatus[platform] = 'completed';
      } else if (scrapedData[platform]?.error) {
        formatted.scrapingStatus[platform] = 'failed';
      }
    });
    
    return formatted;
  };

  const handleRetryStudent = async (studentId) => {
    try {
      setIsSyncing(true);
      toast.info('Starting manual sync for student...');

      const studentDoc = await getDocs(doc(db, 'users', studentId));
      if (!studentDoc.exists()) {
        throw new Error('Student not found');
      }

      const student = { id: studentDoc.id, ...studentDoc.data() };
      
      if (!student.platformUrls) {
        throw new Error('No platform URLs found for student');
      }

      console.log(`🔄 Manually syncing ${student.name || student.id}`);
      
      // Update status to scraping
      await updateDoc(doc(db, 'users', student.id), {
        'scrapingStatus.lastUpdated': new Date().toISOString(),
        'scrapingStatus.manualSync': 'in_progress'
      });

      // Scrape all platforms
      const scrapedData = await scrapeStudentPlatforms(student.platformUrls);
      const formattedData = formatScrapedData(scrapedData);
      
      // Update Firestore with new data
      await updateDoc(doc(db, 'users', student.id), {
        ...formattedData,
        lastManualSync: new Date().toISOString()
      });
      
      setLastSyncTime(new Date());
      console.log(`✅ Successfully manually synced ${student.name || student.id}`);
      toast.success('Student data synced successfully');
      
    } catch (error) {
      console.error(`❌ Failed to sync student:`, error);
      toast.error('Failed to sync student data');
    } finally {
      setIsSyncing(false);
      fetchScrapingStatus(); // Refresh data
    }
  };

  const handleRetryAll = async () => {
    try {
      setIsSyncing(true);
      toast.info('Starting sync for all students...');

      let successfulUpdates = 0;
      let failedUpdates = 0;

      // Process each student sequentially
      for (const student of students) {
        try {
          console.log(`🔄 Syncing ${student.name || student.id}`);
          
          // Update status to scraping
          await updateDoc(doc(db, 'users', student.id), {
            'scrapingStatus.lastUpdated': new Date().toISOString(),
            'scrapingStatus.manualSync': 'in_progress'
          });

          // Scrape all platforms
          const scrapedData = await scrapeStudentPlatforms(student.platformUrls);
          const formattedData = formatScrapedData(scrapedData);
          
          // Update Firestore with new data
          await updateDoc(doc(db, 'users', student.id), {
            ...formattedData,
            lastManualSync: new Date().toISOString()
          });
          
          successfulUpdates++;
          console.log(`✅ Successfully synced ${student.name || student.id}`);
          
          // Small delay between students to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          failedUpdates++;
          console.error(`❌ Failed to sync ${student.name || student.id}:`, error);
          
          // Update with error status
          try {
            await updateDoc(doc(db, 'users', student.id), {
              'scrapingStatus.lastUpdated': new Date().toISOString(),
              'scrapingStatus.lastError': error.message,
              'scrapingStatus.manualSync': 'failed'
            });
          } catch (updateError) {
            console.error('Failed to update error status:', updateError);
          }
        }
      }

      setLastSyncTime(new Date());
      toast.success(`Sync completed! ${successfulUpdates} successful, ${failedUpdates} failed`);
      
    } catch (error) {
      console.error('💥 Error in manual sync:', error);
      toast.error('Failed to sync all student data');
    } finally {
      setIsSyncing(false);
      fetchScrapingStatus(); // Refresh data
    }
  };

  const getPlatformStatus = (student, platform) => {
    return student.scrapingStatus?.[platform] || 'not_started';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'success': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'pending': return 'bg-blue-500';
      case 'scraping': return 'bg-yellow-500';
      case 'in_progress': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'success': return 'Success';
      case 'failed': return 'Failed';
      case 'pending': return 'Pending';
      case 'scraping': return 'Scraping';
      case 'in_progress': return 'In Progress';
      default: return 'Not Started';
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-700';
      case 'success': return 'text-green-700';
      case 'failed': return 'text-red-700';
      case 'pending': return 'text-blue-700';
      case 'scraping': return 'text-yellow-700';
      case 'in_progress': return 'text-yellow-700';
      default: return 'text-gray-700';
    }
  };

  const getPlatformStats = (student, platform) => {
    const data = student.platformData?.[platform];
    if (!data || data.error) return null;

    switch (platform) {
      case 'leetcode':
        return `${data.problemsSolved || data.totalSolved || 0} solved`;
      case 'codeforces':
        return `${data.problemsSolved || 0} problems`;
      case 'hackerrank':
        return `${data.problemsSolved || 0} solved`;
      case 'atcoder':
        return `${data.problemsSolved || 0} problems`;
      case 'github':
        return `${data.repositories || 0} repos`;
      default:
        return null;
    }
  };

  const filteredStudents = students.filter(student => {
    if (filterStatus === 'all') return true;
    
    const platformStatuses = Object.keys(student.platformUrls)
      .filter(platform => student.platformUrls[platform])
      .map(platform => getPlatformStatus(student, platform));

    switch (filterStatus) {
      case 'completed':
        return platformStatuses.some(status => status === 'completed' || status === 'success');
      case 'failed':
        return platformStatuses.some(status => status === 'failed');
      case 'in_progress':
        return platformStatuses.some(status => status === 'scraping' || status === 'in_progress' || status === 'pending');
      case 'not_started':
        return platformStatuses.every(status => !status || status === 'not_started');
      default:
        return true;
    }
  });

  // Calculate statistics
  const stats = {
    total: students.reduce((sum, student) => 
      sum + Object.values(student.platformUrls).filter(Boolean).length, 0
    ),
    completed: students.reduce((sum, student) => 
      sum + Object.keys(student.platformUrls).filter(platform => 
        student.platformUrls[platform] && 
        (getPlatformStatus(student, platform) === 'completed' || getPlatformStatus(student, platform) === 'success')
      ).length, 0
    ),
    failed: students.reduce((sum, student) => 
      sum + Object.keys(student.platformUrls).filter(platform => 
        student.platformUrls[platform] && getPlatformStatus(student, platform) === 'failed'
      ).length, 0
    ),
    inProgress: students.reduce((sum, student) => 
      sum + Object.keys(student.platformUrls).filter(platform => 
        student.platformUrls[platform] && 
        (getPlatformStatus(student, platform) === 'scraping' || 
         getPlatformStatus(student, platform) === 'in_progress' ||
         getPlatformStatus(student, platform) === 'pending')
      ).length, 0
    ),
    notStarted: students.reduce((sum, student) => 
      sum + Object.keys(student.platformUrls).filter(platform => 
        student.platformUrls[platform] && 
        (!getPlatformStatus(student, platform) || getPlatformStatus(student, platform) === 'not_started')
      ).length, 0
    )
  };

  const formatLastSync = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Scraping Status</h1>
              <p className="mt-2 text-sm text-gray-600">
                Monitor and manage data synchronization from coding platforms
              </p>
            </div>
            
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button
                onClick={handleRetryAll}
                disabled={isSyncing}
                className={`px-4 py-2 rounded-md font-medium text-sm ${
                  isSyncing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isSyncing ? 'Syncing...' : 'Sync All Students'}
              </button>
              
              <button
                onClick={fetchScrapingStatus}
                disabled={isSyncing}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md font-medium text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Sync Status */}
          {isSyncing && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm font-medium text-blue-800">
                  Manual sync in progress...
                </span>
              </div>
            </div>
          )}

          {lastSyncTime && !isSyncing && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-green-800">
                    Last manual sync completed
                  </span>
                </div>
                <span className="text-xs text-green-600">
                  {formatLastSync(lastSyncTime)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total Platforms', value: stats.total, color: 'bg-gray-100', textColor: 'text-gray-800', border: 'border-gray-300', filter: 'all' },
            { label: 'Completed', value: stats.completed, color: 'bg-green-100', textColor: 'text-green-800', border: 'border-green-300', filter: 'completed' },
            { label: 'In Progress', value: stats.inProgress, color: 'bg-yellow-100', textColor: 'text-yellow-800', border: 'border-yellow-300', filter: 'in_progress' },
            { label: 'Failed', value: stats.failed, color: 'bg-red-100', textColor: 'text-red-800', border: 'border-red-300', filter: 'failed' },
            { label: 'Not Started', value: stats.notStarted, color: 'bg-gray-100', textColor: 'text-gray-800', border: 'border-gray-300', filter: 'not_started' },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                filterStatus === stat.filter 
                  ? `${stat.border} ${stat.color} shadow-md` 
                  : 'bg-white border-gray-200 hover:shadow-sm'
              }`}
              onClick={() => setFilterStatus(stat.filter)}
            >
              <div className={`text-2xl font-bold ${stat.textColor}`}>
                {stat.value}
              </div>
              <div className="text-sm font-medium text-gray-600 mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Student Scraping Status</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {filteredStudents.length} of {students.length} students
                  {filterStatus !== 'all' && ` (filtered by ${filterStatus.replace('_', ' ')})`}
                </p>
              </div>
              
              {filterStatus !== 'all' && (
                <button
                  onClick={() => setFilterStatus('all')}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear Filter
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-3 text-gray-500">Loading scraping status...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
              <p className="text-gray-500">
                {students.length === 0 
                  ? "No students with platform URLs found." 
                  : "No students match the current filter."
                }
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Platforms & Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Sync
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-800">
                              {student.name?.charAt(0).toUpperCase() || 'S'}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.name || 'Unknown Student'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.email || 'No email'}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          {Object.entries(student.platformUrls)
                            .filter(([_, url]) => url)
                            .map(([platform, url]) => {
                              const status = getPlatformStatus(student, platform);
                              const stats = getPlatformStats(student, platform);
                              
                              return (
                                <div key={platform} className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <span className="text-xs font-medium text-gray-700 capitalize min-w-20">
                                      {platform}
                                    </span>
                                    <div className="flex items-center space-x-2">
                                      <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`}></div>
                                      <span className={`text-xs font-medium ${getStatusTextColor(status)}`}>
                                        {getStatusText(status)}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {stats && (
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                      {stats}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatLastSync(student.lastUpdated)}
                        </div>
                        {student.lastAutoSync && (
                          <div className="text-xs text-gray-500">
                            Auto: {formatLastSync(student.lastAutoSync)}
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleRetryStudent(student.id)}
                          disabled={isSyncing}
                          className={`text-blue-600 hover:text-blue-900 text-sm font-medium ${
                            isSyncing ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          Sync Now
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Information */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Click "Sync Now" to manually update student data from coding platforms
          </p>
        </div>
      </div>
    </div>
  );
};

export default ScrapingStatus;