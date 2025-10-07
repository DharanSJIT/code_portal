// src/utils/adminSetup.js
// Complete admin account setup and verification utility

import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

/**
 * Step 1: Create admin account in Firebase Auth + Firestore
 */
export const createAdminAccount = async (email, password, displayName = 'Admin User') => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 CREATING ADMIN ACCOUNT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', email);
    console.log('👤 Display Name:', displayName);
    
    // Create Firebase Auth account
    console.log('\n⏳ Step 1/3: Creating Firebase Authentication account...');
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('✅ Firebase Auth account created!');
    console.log('🆔 UID:', user.uid);
    
    // Create Firestore admin profile
    console.log('\n⏳ Step 2/3: Creating Firestore admin profile...');
    const adminProfile = {
      email: email,
      displayName: displayName,
      name: displayName,
      role: 'admin',
      isAdmin: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
    
    await setDoc(doc(db, 'users', user.uid), adminProfile);
    console.log('✅ Firestore admin profile created!');
    
    // Sign out
    console.log('\n⏳ Step 3/3: Signing out...');
    await signOut(auth);
    console.log('✅ Signed out successfully!');
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 ADMIN ACCOUNT CREATED SUCCESSFULLY!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', email);
    console.log('🔑 Password: [the one you provided]');
    console.log('🆔 UID:', user.uid);
    console.log('\n💡 Next: Run verifyAdminAccount("' + email + '", "yourPassword")');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return { success: true, uid: user.uid, email: email };
    
  } catch (error) {
    console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ ERROR CREATING ADMIN ACCOUNT');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    
    if (error.code === 'auth/email-already-in-use') {
      console.error('\n💡 Solution: Email already exists. Try:');
      console.error('   1. Use a different email, OR');
      console.error('   2. Delete the existing account from Firebase Console, OR');
      console.error('   3. Run: verifyAdminAccount("' + email + '", "password") to check if it\'s already admin');
    } else if (error.code === 'auth/weak-password') {
      console.error('\n💡 Solution: Password too weak. Use at least 6 characters.');
    } else if (error.code === 'auth/invalid-email') {
      console.error('\n💡 Solution: Invalid email format.');
    }
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return { success: false, error: error.message };
  }
};

/**
 * Step 2: Verify admin account exists and has correct permissions
 */
export const verifyAdminAccount = async (email, password) => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 VERIFYING ADMIN ACCOUNT');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', email);
    
    // Sign in
    console.log('\n⏳ Step 1/3: Signing in...');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('✅ Sign-in successful!');
    console.log('🆔 UID:', user.uid);
    console.log('📧 Email:', user.email);
    console.log('✉️  Email Verified:', user.emailVerified);
    
    // Check Firestore profile
    console.log('\n⏳ Step 2/3: Checking Firestore profile...');
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      console.error('❌ No Firestore profile found!');
      console.log('\n💡 Creating Firestore profile now...');
      
      const adminProfile = {
        email: user.email,
        displayName: user.displayName || 'Admin User',
        name: user.displayName || 'Admin User',
        role: 'admin',
        isAdmin: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };
      
      await setDoc(userDocRef, adminProfile);
      console.log('✅ Firestore profile created!');
      console.log('📄 Profile:', adminProfile);
    } else {
      console.log('✅ Firestore profile found!');
      const userData = userDoc.data();
      console.log('📄 Profile data:', userData);
      
      // Check admin status
      console.log('\n⏳ Step 3/3: Checking admin privileges...');
      const isAdmin = userData.role === 'admin' || userData.isAdmin === true;
      
      if (isAdmin) {
        console.log('✅ User HAS admin privileges!');
        console.log('   - role:', userData.role);
        console.log('   - isAdmin:', userData.isAdmin);
      } else {
        console.error('❌ User DOES NOT have admin privileges!');
        console.error('   - role:', userData.role);
        console.error('   - isAdmin:', userData.isAdmin);
        console.log('\n💡 Fixing admin privileges...');
        
        await setDoc(userDocRef, {
          ...userData,
          role: 'admin',
          isAdmin: true,
          updatedAt: new Date().toISOString()
        });
        
        console.log('✅ Admin privileges granted!');
      }
    }
    
    // Sign out
    await signOut(auth);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 VERIFICATION COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Account exists in Firebase Auth');
    console.log('✅ Firestore profile exists');
    console.log('✅ Admin privileges confirmed');
    console.log('\n💡 You can now sign in at: /admin/signin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return { success: true, user: user.uid };
    
  } catch (error) {
    console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ VERIFICATION FAILED');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    
    if (error.code === 'auth/user-not-found') {
      console.error('\n💡 Solution: Account does not exist. Run:');
      console.error('   createAdminAccount("' + email + '", "yourPassword")');
    } else if (error.code === 'auth/wrong-password') {
      console.error('\n💡 Solution: Wrong password. Try again or reset password.');
    } else if (error.code === 'auth/invalid-credential') {
      console.error('\n💡 Solution: Invalid credentials. Check email and password.');
    }
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return { success: false, error: error.message };
  }
};

/**
 * Check all existing users and their admin status
 */
export const checkAllUsers = async () => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👥 CHECKING ALL USERS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const { collection, getDocs } = await import('firebase/firestore');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    console.log(`📊 Total users in Firestore: ${usersSnapshot.size}\n`);
    
    if (usersSnapshot.empty) {
      console.log('⚠️  No users found in Firestore!');
      return;
    }
    
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      const isAdmin = data.role === 'admin' || data.isAdmin === true;
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📄 Document ID:', doc.id);
      console.log('📧 Email:', data.email);
      console.log('👤 Name:', data.name || data.displayName);
      console.log('🎭 Role:', data.role);
      console.log('👑 isAdmin:', data.isAdmin);
      console.log('✅ Is Admin?', isAdmin ? 'YES' : 'NO');
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
  }
};

// Make functions available globally
if (typeof window !== 'undefined') {
  window.createAdminAccount = createAdminAccount;
  window.verifyAdminAccount = verifyAdminAccount;
  window.checkAllUsers = checkAllUsers;
  
  // console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  // console.log('🔧 ADMIN SETUP UTILITIES LOADED');
  // console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  // console.log('\n📝 Available commands:');
  // console.log('   1. createAdminAccount("email", "password", "Name")');
  // console.log('   2. verifyAdminAccount("email", "password")');
  // console.log('   3. checkAllUsers()');
  // console.log('\n💡 Example:');
  // console.log('   createAdminAccount("admin@codetrack.com", "Admin@12345", "Admin User")');
  // console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}