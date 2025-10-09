import { db } from '../firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';

class ActivityService {
  // Log a new activity with duplicate prevention - DISABLED TO SAVE STORAGE
  async logActivity(studentId, platform, action, details = {}, forceCreate = false) {
    // Activity logging disabled to save Firebase storage
    return { success: true, message: 'Activity logging disabled' };
  }

  // Get activities for a student
  async getStudentActivities(studentId, limitCount = 10) {
    try {
      const activitiesRef = collection(db, 'activities');
      const q = query(
        activitiesRef,
        where('studentId', '==', studentId),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const activities = [];

      querySnapshot.forEach((doc) => {
        activities.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Sort by timestamp in JavaScript instead of Firestore
      activities.sort((a, b) => {
        const aTime = a.timestamp?.toDate?.() || new Date(a.createdAt || 0);
        const bTime = b.timestamp?.toDate?.() || new Date(b.createdAt || 0);
        return bTime - aTime;
      });

      return { success: true, activities };
    } catch (error) {
      console.error('Error fetching activities:', error);
      return { success: false, error: error.message, activities: [] };
    }
  }

  // Log platform data update - DISABLED TO SAVE STORAGE
  async logPlatformUpdate(studentId, platform, oldData, newData) {
    return { success: true, message: 'Platform update logging disabled' };
  }

  // Calculate what changed between old and new data
  calculateChanges(oldData, newData) {
    const changes = [];
    
    if (!oldData) return ['Initial data fetch'];
    
    // Check for common fields that might change
    const fieldsToCheck = [
      'totalSolved', 'problemsSolved', 'rating', 'repositories', 
      'followers', 'easySolved', 'mediumSolved', 'hardSolved'
    ];

    fieldsToCheck.forEach(field => {
      const oldValue = oldData[field] || 0;
      const newValue = newData[field] || 0;
      
      if (oldValue !== newValue) {
        const diff = newValue - oldValue;
        if (diff > 0) {
          changes.push(`+${diff} ${field}`);
        } else if (diff < 0) {
          changes.push(`${diff} ${field}`);
        }
      }
    });

    return changes;
  }

  // Log problem solving activity - DISABLED TO SAVE STORAGE
  async logProblemSolved(studentId, platform, problemTitle, difficulty = null) {
    return { success: true, message: 'Problem solving logging disabled' };
  }

  // Log contest participation - DISABLED TO SAVE STORAGE
  async logContestParticipation(studentId, platform, contestName, rank = null) {
    return { success: true, message: 'Contest participation logging disabled' };
  }

  // Log repository creation/update - DISABLED TO SAVE STORAGE
  async logRepositoryActivity(studentId, repoName, action = 'created') {
    return { success: true, message: 'Repository activity logging disabled' };
  }
}

export default new ActivityService();