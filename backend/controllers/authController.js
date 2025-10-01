// backend/controllers/authController.js
import admin from '../config/firebase.js';
// import { admin } from '../config/firebase.js'; 
import logger from '../utils/logger.js';

const register = async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters' 
      });
    }

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: displayName || null,
      emailVerified: false
    });

    logger.info(`User registered successfully: ${email}`);

    // Optional: Create user document in Firestore
    try {
      await admin.firestore().collection('users').doc(userRecord.uid).set({
        email,
        displayName: displayName || null,
        role: 'user',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (firestoreError) {
      logger.warn('Failed to create Firestore document:', firestoreError);
    }

    res.status(201).json({ 
      success: true,
      message: 'User registered successfully',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ 
        error: 'Email already exists' 
      });
    }
    
    if (error.code === 'auth/invalid-email') {
      return res.status(400).json({ 
        error: 'Invalid email address' 
      });
    }
    
    res.status(500).json({ 
      error: 'Registration failed',
      details: error.message 
    });
  }
};

const login = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ 
        error: 'ID token is required' 
      });
    }

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Get user data with custom claims
    const user = await admin.auth().getUser(decodedToken.uid);
    
    // Optional: Update last login in Firestore
    try {
      await admin.firestore().collection('users').doc(user.uid).update({
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (firestoreError) {
      logger.warn('Failed to update last login:', firestoreError);
    }

    logger.info(`User logged in: ${user.email}`);

    res.status(200).json({ 
      success: true,
      message: 'Login successful',
      user: {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        displayName: user.displayName,
        customClaims: user.customClaims || {},
        isAdmin: user.customClaims?.admin === true
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    res.status(500).json({ 
      error: 'Login failed',
      details: error.message 
    });
  }
};

const verifyToken = async (req, res) => {
  try {
    // Token is already verified by middleware
    // req.user contains the decoded token
    
    const user = await admin.auth().getUser(req.user.uid);
    
    res.status(200).json({ 
      success: true,
      message: 'Token is valid',
      user: {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        displayName: user.displayName,
        customClaims: user.customClaims || {},
        isAdmin: user.customClaims?.admin === true
      }
    });
  } catch (error) {
    logger.error('Token verification error:', error);
    res.status(500).json({ 
      error: 'Token verification failed',
      details: error.message 
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        error: 'Email is required' 
      });
    }

    // Verify user exists
    try {
      await admin.auth().getUserByEmail(email);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Don't reveal if user exists or not for security
        return res.status(200).json({ 
          success: true,
          message: 'If the email exists, a password reset link has been sent'
        });
      }
      throw error;
    }

    // Generate password reset link
    const resetLink = await admin.auth().generatePasswordResetLink(email);
    
    // TODO: Send email with reset link
    // For now, just return success (in production, use email service)
    logger.info(`Password reset requested for: ${email}`);
    
    // In development, you can log the link
    if (process.env.NODE_ENV === 'development') {
      logger.info(`Reset link: ${resetLink}`);
    }

    res.status(200).json({ 
      success: true,
      message: 'Password reset email sent',
      // Remove this in production
      ...(process.env.NODE_ENV === 'development' && { resetLink })
    });
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({ 
      error: 'Failed to send password reset email',
      details: error.message 
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { oobCode, newPassword } = req.body;

    if (!oobCode || !newPassword) {
      return res.status(400).json({ 
        error: 'Reset code and new password are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters' 
      });
    }

    // Verify the password reset code
    const email = await admin.auth().verifyPasswordResetCode(oobCode);
    
    // Reset the password
    await admin.auth().confirmPasswordReset(oobCode, newPassword);
    
    logger.info(`Password reset successful for: ${email}`);

    res.status(200).json({ 
      success: true,
      message: 'Password reset successful' 
    });
  } catch (error) {
    logger.error('Reset password error:', error);
    
    if (error.code === 'auth/invalid-action-code') {
      return res.status(400).json({ 
        error: 'Invalid or expired reset code' 
      });
    }
    
    if (error.code === 'auth/expired-action-code') {
      return res.status(400).json({ 
        error: 'Reset code has expired' 
      });
    }
    
    res.status(500).json({ 
      error: 'Password reset failed',
      details: error.message 
    });
  }
};

const logout = async (req, res) => {
  try {
    // For Firebase, logout is handled client-side
    // But we can revoke refresh tokens server-side for security
    
    const uid = req.user.uid;
    
    // Revoke all refresh tokens for this user
    await admin.auth().revokeRefreshTokens(uid);
    
    logger.info(`User logged out: ${req.user.email}`);

    res.status(200).json({ 
      success: true,
      message: 'Logout successful' 
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ 
      error: 'Logout failed',
      details: error.message 
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const uid = req.user.uid;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Current password and new password are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'New password must be at least 6 characters' 
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ 
        error: 'New password must be different from current password' 
      });
    }

    // Update password
    await admin.auth().updateUser(uid, {
      password: newPassword
    });

    // Revoke refresh tokens to force re-login
    await admin.auth().revokeRefreshTokens(uid);
    
    logger.info(`Password changed for user: ${req.user.email}`);

    res.status(200).json({ 
      success: true,
      message: 'Password changed successfully. Please login again.' 
    });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ 
      error: 'Password change failed',
      details: error.message 
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await admin.auth().getUser(req.user.uid);
    
    // Get additional user data from Firestore if available
    let userData = null;
    try {
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(user.uid)
        .get();
      
      if (userDoc.exists) {
        userData = userDoc.data();
      }
    } catch (firestoreError) {
      logger.warn('Failed to fetch user data from Firestore:', firestoreError);
    }

    res.status(200).json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        displayName: user.displayName,
        photoURL: user.photoURL,
        disabled: user.disabled,
        customClaims: user.customClaims || {},
        isAdmin: user.customClaims?.admin === true,
        metadata: {
          createdAt: user.metadata.creationTime,
          lastSignIn: user.metadata.lastSignInTime,
          lastRefresh: user.metadata.lastRefreshTime
        },
        ...userData // Additional data from Firestore
      }
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({
      error: 'Failed to get user data',
      details: error.message
    });
  }
};

const verifyAdminStatus = async (req, res) => {
  try {
    const user = await admin.auth().getUser(req.user.uid);
    const isAdmin = user.customClaims?.admin === true;
    
    res.json({
      success: true,
      isAdmin,
      user: {
        uid: user.uid,
        email: user.email,
        customClaims: user.customClaims || {}
      }
    });
  } catch (error) {
    logger.error('Verify admin status error:', error);
    res.status(500).json({
      error: 'Failed to verify admin status',
      details: error.message
    });
  }
};

export default {
  register,
  login,
  verifyToken,
  forgotPassword,
  resetPassword,
  logout,
  changePassword,
  getCurrentUser,
  verifyAdminStatus
};