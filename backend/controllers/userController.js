// backend/controllers/userController.js
import { db } from '../config/firebase.js';
import logger from '../utils/logger.js';

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.uid;
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    return res.status(200).json(userData);
  } catch (error) {
    logger.error('Error getting user profile:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { name, email, bio, profileImage } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (bio) updateData.bio = bio;
    if (profileImage) updateData.profileImage = profileImage;
    
    await db.collection('users').doc(userId).update(updateData);
    
    return res.status(200).json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    logger.error('Error updating user profile:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Update platform URLs
const updatePlatformUrls = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { platformUrls } = req.body;
    
    if (!platformUrls) {
      return res.status(400).json({ error: 'Platform URLs are required' });
    }
    
    await db.collection('users').doc(userId).update({ platformUrls });
    
    return res.status(200).json({ success: true, message: 'Platform URLs updated successfully' });
  } catch (error) {
    logger.error('Error updating platform URLs:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Get leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users')
      .orderBy('totalSolved', 'desc')
      .limit(20)
      .get();
    
    const leaderboard = [];
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      leaderboard.push({
        id: doc.id,
        name: userData.name,
        totalSolved: userData.totalSolved || 0,
        streak: userData.streak || 0,
        profileImage: userData.profileImage
      });
    });
    
    return res.status(200).json(leaderboard);
  } catch (error) {
    logger.error('Error getting leaderboard:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Admin only: Get all users
const getAllUsers = async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').get();
    
    const users = [];
    usersSnapshot.forEach(doc => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return res.status(200).json(users);
  } catch (error) {
    logger.error('Error getting all users:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Admin only: Create user
const createUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    
    const newUser = {
      name,
      email,
      role: role || 'user',
      createdAt: new Date().toISOString(),
      totalSolved: 0,
      streak: 0
    };
    
    const userRef = await db.collection('users').add(newUser);
    
    return res.status(201).json({
      id: userRef.id,
      ...newUser
    });
  } catch (error) {
    logger.error('Error creating user:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Admin only: Update user
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    
    await db.collection('users').doc(userId).update(updateData);
    
    return res.status(200).json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    logger.error('Error updating user:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Admin only: Delete user
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    await db.collection('users').doc(userId).delete();
    
    return res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Error deleting user:', error);
    return res.status(500).json({ error: error.message });
  }
};

export default {
  getUserProfile,
  updateUserProfile,
  updatePlatformUrls,
  getLeaderboard,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
};
