import admin from '../config/firebase.js';

async function setAdminClaim() {
  const adminEmail = 'admin@hopeportal.com';

  try {
    // Get user by email
    const user = await admin.auth().getUserByEmail(adminEmail);
    console.log('Found user:', user.uid);

    // Set custom admin claims
    await admin.auth().setCustomUserClaims(user.uid, {
      admin: true,
      role: 'admin'
    });

    console.log('✅ Admin claims set successfully for:', adminEmail);

    // Verify the claims were set
    const updatedUser = await admin.auth().getUser(user.uid);
    console.log('📋 Custom claims:', updatedUser.customClaims);

    console.log('\n✨ Done! User is now an admin.');
    console.log('⚠️  Note: User must sign out and sign in again for claims to take effect.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setAdminClaim();