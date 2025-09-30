// backend/middleware/authMiddleware.js
import { admin } from '../config/firebase.js';
import logger from '../utils/logger.js';

export const verifyToken = async (req, res, next) => {
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    
    if (!idToken) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    
    next();
  } catch (error) {
    logger.error('Error verifying token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: No user found' });
    }
    
    const userDoc = await admin.firestore().collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User document not found' });
    }
    
    const userData = userDoc.data();
    
    if (userData.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Requires admin access' });
    }
    
    next();
  } catch (error) {
    logger.error('Error checking admin status:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Default export for backward compatibility with your routes
export default { verifyToken, isAdmin };