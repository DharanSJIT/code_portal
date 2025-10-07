import { db } from '../firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';

class ActivityService {
  // Log a new activity with duplicate prevention
  async logActivity(studentId, platform, action, details = {}) {
    try {
      // Check for recent duplicate activities (within last 5 minutes)
      const recentActivities = await this.getStudentActivities(studentId, 10);
      if (recentActivities.success) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const isDuplicate = recentActivities.activities.some(activity => {
          const activityTime = activity.timestamp?.toDate?.() || new Date(activity.createdAt || 0);
          return activityTime > fiveMinutesAgo && 
                 activity.platform === platform.toLowerCase() && 
                 activity.action === action;
        });
        
        if (isDuplicate) {
          return { success: true, message: 'Duplicate activity prevented' };
        }
      }

      const activityData = {
        studentId,
        platform: platform.toLowerCase(),
        action,
        details,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'activities'), activityData);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error logging activity:', error);
      return { success: false, error: error.message };
    }
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

  // Log platform data update
  async logPlatformUpdate(studentId, platform, oldData, newData) {
    const changes = this.calculateChanges(oldData, newData);
    if (changes.length > 0 && !changes.includes('Initial data fetch')) {
      const action = `Updated ${platform} data: ${changes.join(', ')}`;
      return await this.logActivity(studentId, platform, action, { changes, oldData, newData });
    }
    return { success: true, message: 'No changes detected' };
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

  // Log problem solving activity
  async logProblemSolved(studentId, platform, problemTitle, difficulty = null) {
    const action = difficulty 
      ? `Solved ${difficulty} problem: ${problemTitle}`
      : `Solved problem: ${problemTitle}`;
    
    return await this.logActivity(studentId, platform, action, {
      problemTitle,
      difficulty,
      type: 'problem_solved'
    });
  }

  // Log contest participation
  async logContestParticipation(studentId, platform, contestName, rank = null) {
    const action = rank 
      ? `Participated in ${contestName} (Rank: ${rank})`
      : `Participated in ${contestName}`;
    
    return await this.logActivity(studentId, platform, action, {
      contestName,
      rank,
      type: 'contest_participation'
    });
  }

  // Log repository creation/update
  async logRepositoryActivity(studentId, repoName, action = 'created') {
    const actionText = `${action.charAt(0).toUpperCase() + action.slice(1)} repository: ${repoName}`;
    
    return await this.logActivity(studentId, 'github', actionText, {
      repoName,
      type: 'repository_activity',
      action
    });
  }
}

export default new ActivityService();