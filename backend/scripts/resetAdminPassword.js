import admin from '../config/firebase.js';

async function resetPassword() {
  const email = 'admin@hopeportal.com';
  const newPassword = 'Admin@123456'; // Change this!

  try {
    const user = await admin.auth().getUserByEmail(email);
    
    await admin.auth().updateUser(user.uid, {
      password: newPassword,
    });

    console.log('✅ Password reset successfully!');
    console.log('\n📧 Email:', email);
    console.log('🔑 Password:', newPassword);
    console.log('\n⚠️  Save these credentials securely!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetPassword();