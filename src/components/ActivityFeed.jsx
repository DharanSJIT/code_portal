import { motion } from 'framer-motion';

const ActivityFeed = ({ activities, expanded = false }) => {
  const displayActivities = expanded ? activities : activities.slice(0, 4);
  
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
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white bg-blue-500`}>
              {activity.platform.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <p className="font-medium text-gray-800">{activity.platform}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
              <p className="text-gray-600 text-sm">{activity.action}</p>
            </div>
          </motion.div>
        ))}
        
        {displayActivities.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No recent activity found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
