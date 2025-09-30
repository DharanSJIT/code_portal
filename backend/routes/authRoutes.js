// backend/routes/authRoutes.js
import express from 'express';
import authController from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import rateLimiter from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply rate limiting to login attempts
router.use('/login', rateLimiter);

// Auth routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-token', authMiddleware.verifyToken, authController.verifyToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.use(authMiddleware.verifyToken);
router.post('/logout', authController.logout);
router.post('/change-password', authController.changePassword);

export default router;