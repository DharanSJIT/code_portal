import { useState } from 'react';
import { motion } from 'framer-motion';

const Leaderboard = ({ data, currentUser }) => {
  const [sortBy, setSortBy] = useState('totalSolved');
  
  const sortedData = [...data].sort((a, b) => b[sortBy] - a[sortBy]);
  
  const getSortIcon = (field) => {
    if (sortBy === field) {
      return (
        <motion.span 
          animate={{ rotate: 180 }}
          transition={{ duration: 0.3 }}
        >
          ▼
        </motion.span>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="font-semibold text-xl text-gray-800">Leaderboard</h3>
        <p className="text-gray-500 mt-1">
          See how you compare to other coders across all platforms
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th 
                className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => setSortBy('totalSolved')}
              >
                Total Solved {getSortIcon('totalSolved')}
              </th>
              <th 
                className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => setSortBy('streak')}
              >
                Streak {getSortIcon('streak')}
              </th>
              <th 
                className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => setSortBy('githubActivity')}
              >
                GitHub Activity {getSortIcon('githubActivity')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((user, index) => (
              <motion.tr 
                key={user.rank}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={user.name === currentUser ? 'bg-blue-50' : ''}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.rank}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
                      {user.name.charAt(0)}
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.totalSolved}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.streak} days</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.githubActivity}</div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;
