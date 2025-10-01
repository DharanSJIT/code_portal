// src/firebase.js
import { initializeApp } from 'firebase/app';
import authService from './services/authService';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-auth-domain",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-storage-bucket",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "your-messaging-sender-id",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// ==========================
// Authentication Functions
// ==========================

// For admin-only: Create a new user account
const createUserAccount = async (name, email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update user profile with name
    await updateProfile(user, {
      displayName: name
    });
    
    return { user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

// Sign in with email and password
const loginWithEmailAndPassword = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

// Sign in with Google
const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

// Sign out
const logOut = async () => {
  try {
    await signOut(auth);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Listen to auth state changes
const subscribeToAuthChanges = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Get current user
const getCurrentUser = () => {
  return auth.currentUser;
};

// ==========================
// Firestore User Functions
// ==========================

// Create a new student document
const createStudentDocument = async (userId, studentData) => {
  try {
    // Format platform URLs if provided
    const formattedUrls = {};
    if (studentData.platformUrls) {
      Object.entries(studentData.platformUrls).forEach(([platform, url]) => {
        if (url) {
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            formattedUrls[platform] = `https://${url}`;
          } else {
            formattedUrls[platform] = url;
          }
        }
      });
    }

    // Create the student document
    await setDoc(doc(db, 'users', userId), {
      name: studentData.name,
      email: studentData.email,
      phoneNumber: studentData.phoneNumber || '',
      registerNumber: studentData.registerNumber || '',
      rollNumber: studentData.rollNumber || '',
      department: studentData.department || '',
      year: studentData.year || '',
      role: 'student',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      totalSolved: 0,
      streak: 0,
      platformUrls: formattedUrls,
      platformData: {},
      scrapingStatus: {}
    });
    
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get a user document by ID
const getUserById = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { user: { id: userDoc.id, ...userDoc.data() }, error: null };
    } else {
      return { user: null, error: 'User not found' };
    }
  } catch (error) {
    return { user: null, error: error.message };
  }
};

// Get all students
const getAllStudents = async () => {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'student')
    );
    
    const querySnapshot = await getDocs(q);
    const students = [];
    
    querySnapshot.forEach((doc) => {
      students.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { students, error: null };
  } catch (error) {
    return { students: [], error: error.message };
  }
};

// Get leaderboard data
const getLeaderboard = async (limit = 20) => {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'student'),
      orderBy('totalSolved', 'desc'),
      limit(limit)
    );
    
    const querySnapshot = await getDocs(q);
    const leaderboard = [];
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      leaderboard.push({
        id: doc.id,
        name: userData.name,
        totalSolved: userData.totalSolved || 0,
        streak: userData.streak || 0,
        department: userData.department || '',
        year: userData.year || '',
        lastUpdated: userData.lastUpdated
      });
    });
    
    return { leaderboard, error: null };
  } catch (error) {
    return { leaderboard: [], error: error.message };
  }
};

// Update student details
const updateStudent = async (userId, data) => {
  try {
    // Format platform URLs if provided
    if (data.platformUrls) {
      const formattedUrls = {};
      Object.entries(data.platformUrls).forEach(([platform, url]) => {
        if (url) {
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            formattedUrls[platform] = `https://${url}`;
          } else {
            formattedUrls[platform] = url;
          }
        }
      });
      data.platformUrls = formattedUrls;
    }

    // Add lastUpdated timestamp
    data.lastUpdated = new Date().toISOString();
    
    await updateDoc(doc(db, 'users', userId), data);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete a student
const deleteStudent = async (userId) => {
  try {
    await deleteDoc(doc(db, 'users', userId));
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ==========================
// Scraping Status Functions
// ==========================

// Initiate scraping for a student
const initiateScrapingForStudent = async (userId, platformUrls) => {
  try {
    if (!platformUrls || Object.values(platformUrls).every(url => !url)) {
      return { success: false, error: 'No platform URLs provided' };
    }

    const updateData = {
      'scrapingStatus.lastUpdated': new Date().toISOString()
    };

    // Set status to pending for all available platforms
    Object.entries(platformUrls).forEach(([platform, url]) => {
      if (url) {
        updateData[`scrapingStatus.${platform}`] = 'pending';
      }
    });

    await updateDoc(doc(db, 'users', userId), updateData);

    // In a real application, you would make an API call to your backend here
    // to start the scraping process:
    // await fetch('/api/scrape', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ userId, platformUrls })
    // });

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get scraping status for all students
const getAllScrapingStatus = async () => {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'student')
    );
    
    const querySnapshot = await getDocs(q);
    const statuses = [];
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.platformUrls && Object.values(userData.platformUrls).some(url => url)) {
        statuses.push({
          id: doc.id,
          name: userData.name,
          platformUrls: userData.platformUrls || {},
          scrapingStatus: userData.scrapingStatus || {},
          lastUpdated: userData.lastUpdated
        });
      }
    });
    
    return { statuses, error: null };
  } catch (error) {
    return { statuses: [], error: error.message };
  }
};

// Get dashboard stats
const getDashboardStats = async () => {
  try {
    const q = query(collection(db, 'users'), where('role', '==', 'student'));
    const querySnapshot = await getDocs(q);
    
    let totalStudents = 0;
    let activeStudents = 0;
    let totalSolvedProblems = 0;
    const platformCounts = {
      github: 0,
      leetcode: 0,
      codeforces: 0,
      atcoder: 0,
      hackerrank: 0,
      linkedin: 0
    };
    
    const recentActivity = [];
    
    querySnapshot.forEach(doc => {
      const userData = doc.data();
      totalStudents++;
      
      // Count active students (with platform URLs)
      if (userData.platformUrls && Object.values(userData.platformUrls).some(url => url)) {
        activeStudents++;
      }
      
      // Sum total solved problems
      if (userData.totalSolved) {
        totalSolvedProblems += userData.totalSolved;
      }
      
      // Count platform usage
      if (userData.platformUrls) {
        Object.entries(userData.platformUrls).forEach(([platform, url]) => {
          if (url && platformCounts[platform] !== undefined) {
            platformCounts[platform]++;
          }
        });
      }
      
      // Recent activity
      if (userData.lastUpdated) {
        const lastUpdated = new Date(userData.lastUpdated);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        if (lastUpdated >= sevenDaysAgo) {
          recentActivity.push({
            id: doc.id,
            name: userData.name,
            action: 'Profile updated',
            timestamp: userData.lastUpdated
          });
        }
      }
    });
    
    // Sort activity by timestamp descending
    recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return { 
      stats: {
        totalStudents,
        activeStudents,
        totalSolvedProblems,
        platformCounts
      },
      recentActivity: recentActivity.slice(0, 10), // Only get the 10 most recent activities
      error: null 
    };
  } catch (error) {
    return { stats: {}, recentActivity: [], error: error.message };
  }
};

// Export all functions and instances
const logOutEnhanced = async () => {
  try {
    // Notify backend first
    await authService.logoutWithBackend();
    
    // Then sign out from Firebase
    await signOut(auth);
    
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Export the enhanced logout
export {
  auth,
  db,
  createUserAccount,
  loginWithEmailAndPassword,
  signInWithGoogle,
  logOut,
  logOutEnhanced, // New enhanced logout
  subscribeToAuthChanges,
  getCurrentUser,
  createStudentDocument,
  getUserById,
  getAllStudents,
  getLeaderboard,
  updateStudent,
  deleteStudent,
  initiateScrapingForStudent,
  getAllScrapingStatus,
  getDashboardStats,
  authService // Export auth service
};
