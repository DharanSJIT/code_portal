// backend/routes/authRoutes.js
import express from 'express';
import authController from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import rateLimiter from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply rate limiting to sensitive routes
router.use('/login', rateLimiter);
router.use('/register', rateLimiter);

// Public auth routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Token verification (public but requires token)
router.post('/verify-token', authMiddleware.verifyToken, authController.verifyToken);

// Admin verification route (public but requires token)
router.get('/verify-admin', authMiddleware.verifyAdmin, (req, res) => {
  res.json({
    success: true,
    isAdmin: true,
    user: {
      uid: req.user.uid,
      email: req.user.email,
      role: req.user.role || 'admin'
    }
  });
});

// Check current user's admin status
router.get('/check-admin', authMiddleware.verifyToken, async (req, res) => {
  try {
    // Check if user has admin custom claim
    const isAdmin = req.user.admin === true;
    
    res.json({
      success: true,
      isAdmin,
      user: {
        uid: req.user.uid,
        email: req.user.email,
        customClaims: req.user
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to check admin status',
      details: error.message
    });
  }
});

// Protected routes (require authentication)
router.use(authMiddleware.verifyToken);

router.post('/logout', authController.logout);
router.post('/change-password', authController.changePassword);
router.get('/me', authController.getCurrentUser || ((req, res) => {
  res.json({
    success: true,
    user: req.user
  });
}));

// Admin-only routes
router.get('/admin/test', authMiddleware.verifyAdmin, (req, res) => {
  res.json({
    message: '✅ Admin access granted',
    user: req.user
  });
});

// Get all users (admin only)
router.get('/admin/users', authMiddleware.verifyAdmin, async (req, res) => {
  try {
    const admin = (await import('../config/firebase.js')).default;
    const listUsersResult = await admin.auth().listUsers(1000);
    
    const users = listUsersResult.users.map(user => ({
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      disabled: user.disabled,
      createdAt: user.metadata.creationTime,
      lastSignIn: user.metadata.lastSignInTime,
      customClaims: user.customClaims || {}
    }));
    
    res.json({
      success: true,
      users,
      count: users.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch users',
      details: error.message
    });
  }
});

// Set user as admin (admin only)
router.post('/admin/set-admin', authMiddleware.verifyAdmin, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const admin = (await import('../config/firebase.js')).default;
    const user = await admin.auth().getUserByEmail(email);
    
    await admin.auth().setCustomUserClaims(user.uid, {
      admin: true,
      role: 'admin'
    });
    
    res.json({
      success: true,
      message: `Admin privileges granted to ${email}`,
      user: {
        uid: user.uid,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to set admin privileges',
      details: error.message
    });
  }
});

// Remove admin privileges (admin only)
router.post('/admin/remove-admin', authMiddleware.verifyAdmin, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Prevent removing own admin privileges
    if (email === req.user.email) {
      return res.status(400).json({ 
        error: 'Cannot remove your own admin privileges' 
      });
    }
    
    const admin = (await import('../config/firebase.js')).default;
    const user = await admin.auth().getUserByEmail(email);
    
    await admin.auth().setCustomUserClaims(user.uid, {
      admin: false,
      role: 'user'
    });
    
    res.json({
      success: true,
      message: `Admin privileges removed from ${email}`,
      user: {
        uid: user.uid,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to remove admin privileges',
      details: error.message
    });
  }
});

export default router;