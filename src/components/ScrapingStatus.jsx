// src/components/ScrapingStatus.jsx
import { useState, useEffect } from 'react';
import { db } from '../firebase.js';
import { toast } from 'react-toastify';

const ScrapingStatus = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  
  useEffect(() => {
    fetchScrapingStatus();
  }, []);
  
  const fetchScrapingStatus = async () => {
    try {
      setLoading(true);
      
      const usersSnapshot = await db.collection('users')
        .where('role', '==', 'student')
        .get();
      
      const studentsData = [];
      usersSnapshot.forEach(doc => {
        const data = doc.data();
        
        // Only include students who have platform URLs
        if (data.platformUrls && Object.values(data.platformUrls).some(url => url)) {
          studentsData.push({
            id: doc.id,
            name: data.name,
            platformUrls: data.platformUrls || {},
            scrapingStatus: data.scrapingStatus || {},
            lastUpdated: data.lastUpdated || null
          });
        }
      });
      
      // Sort by last updated
      studentsData.sort((a, b) => {
        if (!a.scrapingStatus.lastUpdated) return 1;
        if (!b.scrapingStatus.lastUpdated) return -1;
        return new Date(b.scrapingStatus.lastUpdated) - new Date(a.scrapingStatus.lastUpdated);
      });
      
      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching scraping status:', error);
      toast.error('Failed to load scraping status');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRetry = async (studentId, platforms) => {
    try {
      // Update status to pending for selected platforms
      const updateData = {
        'scrapingStatus.lastUpdated': new Date().toISOString()
      };
      
      platforms.forEach(platform => {
        updateData[`scrapingStatus.${platform}`] = 'pending';
      });
      
      await db.collection('users').doc(studentId).update(updateData);
      
      // In a real app, this would be an API call to your scraping service
      toast.info('Scraping initiated for selected platforms');
      
      // Refresh the data
      fetchScrapingStatus();
    } catch (error) {
      console.error('Error retrying scraping:', error);
      toast.error('Failed to initiate scraping');
    }
  };
  
  const filteredStudents = students.filter(student => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'completed') {
      return Object.values(student.scrapingStatus).some(status => status === 'completed');
    }
    if (filterStatus === 'failed') {
      return Object.values(student.scrapingStatus).some(status => status === 'failed');
    }
    if (filterStatus === 'pending') {
      return Object.values(student.scrapingStatus).some(status => status === 'pending' || status === 'in_progress');
    }
    if (filterStatus === 'not_started') {
      return !student.scrapingStatus || Object.keys(student.scrapingStatus).length <= 1; // Only lastUpdated
    }
    return true;
  });
  
  // Get platform status counts
  const platformCounts = {
    completed: 0,
    in_progress: 0,
    pending: 0,
    failed: 0,
    not_started: 0
  };
  
  students.forEach(student => {
    const statuses = Object.entries(student.scrapingStatus || {})
      .filter(([key]) => key !== 'lastUpdated')
      .map(([_, status]) => status);
    
    if (statuses.length === 0) {
      platformCounts.not_started += Object.values(student.platformUrls).filter(Boolean).length;
    } else {
      statuses.forEach(status => {
        if (platformCounts[status] !== undefined) {
          platformCounts[status]++;
        }
      });
    }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Scraping Status</h1>
      
      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div 
          className={`p-4 rounded-lg shadow ${filterStatus === 'all' ? 'bg-blue-50 border-2 border-blue-300' : 'bg-white'}`}
          onClick={() => setFilterStatus('all')}
        >
          <h3 className="text-lg font-medium text-gray-800">All</h3>
          <p className="text-3xl font-bold text-blue-600">
            {Object.values(platformCounts).reduce((sum, count) => sum + count, 0)}
          </p>
          <p className="text-sm text-gray-500">Total platforms</p>
        </div>
        
        <div 
          className={`p-4 rounded-lg shadow ${filterStatus === 'completed' ? 'bg-green-50 border-2 border-green-300' : 'bg-white'}`}
          onClick={() => setFilterStatus('completed')}
        >
          <h3 className="text-lg font-medium text-gray-800">Completed</h3>
          <p className="text-3xl font-bold text-green-600">{platformCounts.completed}</p>
          <p className="text-sm text-gray-500">Platforms scraped</p>
        </div>
        
        <div 
          className={`p-4 rounded-lg shadow ${filterStatus === 'pending' ? 'bg-yellow-50 border-2 border-yellow-300' : 'bg-white'}`}
          onClick={() => setFilterStatus('pending')}
        >
          <h3 className="text-lg font-medium text-gray-800">In Progress</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {platformCounts.pending + platformCounts.in_progress}
          </p>
          <p className="text-sm text-gray-500">Platforms processing</p>
        </div>
        
        <div 
          className={`p-4 rounded-lg shadow ${filterStatus === 'failed' ? 'bg-red-50 border-2 border-red-300' : 'bg-white'}`}
          onClick={() => setFilterStatus('failed')}
        >
          <h3 className="text-lg font-medium text-gray-800">Failed</h3>
          <p className="text-3xl font-bold text-red-600">{platformCounts.failed}</p>
          <p className="text-sm text-gray-500">Platforms failed</p>
        </div>
        
        <div 
          className={`p-4 rounded-lg shadow ${filterStatus === 'not_started' ? 'bg-gray-50 border-2 border-gray-300' : 'bg-white'}`}
          onClick={() => setFilterStatus('not_started')}
        >
          <h3 className="text-lg font-medium text-gray-800">Not Started</h3>
          <p className="text-3xl font-bold text-gray-600">{platformCounts.not_started}</p>
          <p className="text-sm text-gray-500">Platforms waiting</p>
        </div>
      </div>
      
      {/* Scraping List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-medium">Student Scraping Status</h2>
          <p className="text-sm text-gray-500">
            Showing {filteredStudents.length} of {students.length} students
          </p>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-500">Loading scraping status...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {filteredStudents.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Platforms
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStudents.map(student => {
                    // Get status details
                    const statuses = Object.entries(student.scrapingStatus || {})
                      .filter(([key]) => key !== 'lastUpdated');
                    
                    // Get failed platforms
                    const failedPlatforms = statuses
                      .filter(([_, status]) => status === 'failed')
                      .map(([platform]) => platform);
                    
                    return (
                      <tr key={student.id}>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            {Object.entries(student.platformUrls).map(([platform, url]) => (
                              url && (
                                <a 
                                  key={platform} 
                                  href={url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="px-2 py-1 bg-gray-100 text-gray-800 rounded-md text-xs capitalize"
                                  title={url}
                                >
                                  {platform}
                                </a>
                              )
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {statuses.length > 0 ? (
                              statuses.map(([platform, status]) => (
                                <div key={platform} className="flex items-center">
                                  <span className={`w-2 h-2 rounded-full mr-2 ${
                                    status === 'completed' ? 'bg-green-500' :
                                    status === 'in_progress' ? 'bg-yellow-500' :
                                    status === 'pending' ? 'bg-blue-500' :
                                    status === 'failed' ? 'bg-red-500' :
                                    'bg-gray-500'
                                  }`}></span>
                                  <span className="text-xs text-gray-600 capitalize">{platform}: </span>
                                  <span className={`text-xs ml-1 ${
                                    status === 'completed' ? 'text-green-600' :
                                    status === 'in_progress' ? 'text-yellow-600' :
                                    status === 'pending' ? 'text-blue-600' :
                                    status === 'failed' ? 'text-red-600' :
                                    'text-gray-600'
                                  }`}>{status}</span>
                                </div>
                              ))
                            ) : (
                              <span className="text-xs text-gray-500">Not started</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {student.scrapingStatus?.lastUpdated ? 
                            new Date(student.scrapingStatus.lastUpdated).toLocaleString() : 
                            'Never'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {failedPlatforms.length > 0 ? (
                            <button
                              onClick={() => handleRetry(student.id, failedPlatforms)}
                              className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-md hover:bg-red-200"
                            >
                              Retry Failed ({failedPlatforms.length})
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRetry(student.id, Object.keys(student.platformUrls).filter(key => student.platformUrls[key]))}
                              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md hover:bg-blue-200"
                            >
                              Start All
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-gray-500">
                No students found matching the current filter
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScrapingStatus;