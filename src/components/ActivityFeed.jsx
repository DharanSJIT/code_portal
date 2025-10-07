import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import activityService from '../services/activityService';

const ActivityFeed = ({ studentId, expanded = false }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchActivities = async () => {
      if (!studentId) {
        setLoading(false);
        return;
      }
      
      try {
        const result = await activityService.getStudentActivities(studentId, expanded ? 20 : 4);
        if (result.success) {
          setActivities(result.activities);
        } else {
          console.error('Error fetching activities:', result.error);
          setActivities([]);
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivities();
  }, [studentId, expanded]);
  
  const displayActivities = activities;
  
  const getPlatformColor = (platform) => {
    const colors = {
      leetcode: 'bg-yellow-500',
      codeforces: 'bg-blue-500',
      atcoder: 'bg-green-500',
      github: 'bg-gray-800',
      hackerrank: 'bg-green-600',
      default: 'bg-blue-500'
    };
    return colors[platform?.toLowerCase()] || colors.default;
  };
  
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-0">
              <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-800">Recent Activity</h3>
        {!expanded && activities.length > 4 && (
          <motion.button 
            className="text-blue-600 text-sm hover:text-blue-800 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            View all
          </motion.button>
        )}
      </div>
      
      <div className="space-y-4">
        {displayActivities.map((activity, index) => (
          <motion.div 
            key={activity.id} 
            className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${getPlatformColor(activity.platform)}`}>
              {activity.platform ? activity.platform.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <p className="font-medium text-gray-800">{activity.platform || 'Unknown Platform'}</p>
                <p className="text-xs text-gray-500">{formatTime(activity.timestamp)}</p>
              </div>
              <p className="text-gray-600 text-sm">{activity.action || 'Activity recorded'}</p>
            </div>
          </motion.div>
        ))}
        
        {displayActivities.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No recent activity found</p>
            <p className="text-xs text-gray-400 mt-1">Activities will appear when platform data is updated</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-3 text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Refresh to check for new activities
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
