// contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userGroups, setUserGroups] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Fetch user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserData(userData);
            
            // Fetch user's groups if they're a student
            if (userData.role === 'student' && userData.domain) {
              const groupsQuery = query(
                collection(db, 'groups'),
                where('domain', '==', userData.domain),
                where('isActive', '==', true)
              );
              const groupsSnapshot = await getDocs(groupsQuery);
              const groups = groupsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
              setUserGroups(groups);
            } else if (userData.role === 'admin') {
              // Admins can access all groups
              const groupsQuery = query(
                collection(db, 'groups'),
                where('isActive', '==', true)
              );
              const groupsSnapshot = await getDocs(groupsQuery);
              const groups = groupsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
              setUserGroups(groups);
            }
          } else {
            setUserData(null);
            setUserGroups([]);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUserData(null);
          setUserGroups([]);
        }
      } else {
        setUserData(null);
        setUserGroups([]);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = () => {
    return signOut(auth);
  };

  // Change password function
  const changePassword = async (currentPassword, newPassword) => {
    if (!currentUser) {
      throw new Error('No user is currently logged in');
    }

    try {
      // Re-authenticate user before password change
      const credential = EmailAuthProvider.credential(
        currentUser.email, 
        currentPassword
      );
      
      await reauthenticateWithCredential(currentUser, credential);
      
      // Update to new password
      await updatePassword(currentUser, newPassword);
      
      return { success: true, message: 'Password updated successfully!' };
    } catch (error) {
      console.error('Password change error:', error);
      
      let errorMessage = 'Failed to update password. ';
      switch (error.code) {
        case 'auth/wrong-password':
          errorMessage += 'Current password is incorrect.';
          break;
        case 'auth/weak-password':
          errorMessage += 'New password is too weak. Use at least 6 characters.';
          break;
        case 'auth/requires-recent-login':
          errorMessage += 'Please log in again to change your password.';
          break;
        default:
          errorMessage += 'Please try again.';
      }
      
      throw new Error(errorMessage);
    }
  };

  const value = {
    currentUser,
    userData,
    userGroups,
    logout,
    changePassword,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};