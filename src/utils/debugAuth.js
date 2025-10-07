// src/utils/debugAuth.js
// Temporary debugging utility to help identify the UID mismatch issue

import { auth, db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

/**
 * Debug function to check if user profile exists in Firestore
 * Use this in your browser console or temporarily in your sign-in flow
 */
export const debugUserProfile = async () => {
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    console.error('❌ No user is currently signed in');
    return;
  }
  
  console.log('🔍 Debugging User Authentication and Profile');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 Email:', currentUser.email);
  console.log('🆔 UID:', currentUser.uid);
  console.log('👤 Display Name:', currentUser.displayName);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    // Method 1: Direct lookup by UID
    console.log('\n🔎 Method 1: Looking for document with exact UID...');
    const { doc, getDoc } = await import('firebase/firestore');
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    
    if (userDocSnap.exists()) {
      console.log('✅ Found user document by UID!');
      console.log('📄 Document Data:', userDocSnap.data());
    } else {
      console.log('❌ No document found with UID:', currentUser.uid);
    }
    
    // Method 2: Search by email
    console.log('\n🔎 Method 2: Searching by email...');
    const q = query(collection(db, 'users'), where('email', '==', currentUser.email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('❌ No documents found with email:', currentUser.email);
    } else {
      console.log(`✅ Found ${querySnapshot.size} document(s) with this email:`);
      querySnapshot.forEach((doc) => {
        console.log('  📄 Document ID:', doc.id);
        console.log('  📄 Document Data:', doc.data());
        console.log('  ⚠️  UID Match:', doc.id === currentUser.uid ? 'YES ✅' : 'NO ❌');
        console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      });
    }
    
    // Method 3: List all users (for debugging)
    console.log('\n🔎 Method 3: Listing all users in Firestore...');
    const allUsersSnapshot = await getDocs(collection(db, 'users'));
    console.log(`📊 Total documents in 'users' collection: ${allUsersSnapshot.size}`);
    
    allUsersSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('  📄 Document ID:', doc.id);
      console.log('  📧 Email:', data.email);
      console.log('  👤 Name:', data.name || data.displayName);
      console.log('  🎭 Role:', data.role);
    });
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 Debug complete!');
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  }
};

/**
 * Function to manually create a user profile if missing
 * Call this if you find the profile is missing
 */
export const createMissingUserProfile = async (userData = {}) => {
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    console.error('❌ No user is currently signed in');
    return { success: false, error: 'No user signed in' };
  }
  
  try {
    const { doc, setDoc } = await import('firebase/firestore');
    
    const userProfile = {
      email: currentUser.email,
      name: userData.name || currentUser.displayName || 'Test User',
      displayName: currentUser.displayName || userData.name || 'Test User',
      role: userData.role || 'user',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...userData
    };
    
    console.log('🔧 Creating user profile with UID:', currentUser.uid);
    console.log('📄 Profile data:', userProfile);
    
    await setDoc(doc(db, 'users', currentUser.uid), userProfile);
    
    console.log('✅ User profile created successfully!');
    return { success: true, profile: userProfile };
    
  } catch (error) {
    console.error('❌ Error creating user profile:', error);
    return { success: false, error: error.message };
  }
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.debugUserProfile = debugUserProfile;
  window.createMissingUserProfile = createMissingUserProfile;
  // console.log('🔧 Debug utilities loaded! Use window.debugUserProfile() to debug');
}