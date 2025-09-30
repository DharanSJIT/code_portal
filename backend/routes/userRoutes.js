// backend/routes/userRoutes.js
import express from 'express';
import userController from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/leaderboard', userController.getLeaderboard);

// Protected routes
router.use(authMiddleware.verifyToken);
router.get('/profile', userController.getUserProfile);
router.put('/profile', userController.updateUserProfile);
router.put('/platform-urls', userController.updatePlatformUrls);

// Admin only routes
router.use(authMiddleware.isAdmin);
router.get('/all', userController.getAllUsers);
router.post('/create', userController.createUser);
router.put('/:userId', userController.updateUser);
router.delete('/:userId', userController.deleteUser);

export default router;
