// backend/middleware/authMiddleware.js
import admin from '../config/firebase.js';
import logger from '../utils/logger.js';

/**
 * Verify Firebase ID token
 */
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized: No token provided' 
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    
    logger.info(`Token verified for user: ${decodedToken.email}`);
    next();
  } catch (error) {
    logger.error('Error verifying token:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ 
        error: 'Unauthorized: Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(401).json({ 
      error: 'Unauthorized: Invalid token',
      details: error.message 
    });
  }
};

/**
 * Check if user is admin (checks both custom claims and Firestore)
 */
export const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized: No token provided' 
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Method 1: Check custom claims (fastest)
    if (decodedToken.admin === true) {
      req.user = decodedToken;
      logger.info(`Admin access granted via custom claims: ${decodedToken.email}`);
      return next();
    }
    
    // Method 2: Check Firestore if custom claims not set
    try {
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(decodedToken.uid)
        .get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        
        if (userData.role === 'admin') {
          req.user = {
            ...decodedToken,
            role: userData.role
          };
          logger.info(`Admin access granted via Firestore: ${decodedToken.email}`);
          return next();
        }
      }
    } catch (firestoreError) {
      logger.warn('Firestore check failed, relying on custom claims only:', firestoreError.message);
    }
    
    // If neither method confirms admin status
    logger.warn(`Admin access denied for user: ${decodedToken.email}`);
    return res.status(403).json({ 
      error: 'Forbidden: Admin privileges required',
      code: 'NOT_ADMIN'
    });
    
  } catch (error) {
    logger.error('Error verifying admin access:', error);
    return res.status(403).json({ 
      error: 'Admin access denied',
      details: error.message 
    });
  }
};

/**
 * Backward compatibility: isAdmin alias for verifyAdmin
 */
export const isAdmin = verifyAdmin;

/**
 * Optional: Check if user has specific role
 */
export const checkRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Unauthorized: No user found' 
        });
      }
      
      // Check custom claims first
      if (req.user.role && allowedRoles.includes(req.user.role)) {
        return next();
      }
      
      // Check Firestore
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(req.user.uid)
        .get();
      
      if (!userDoc.exists) {
        return res.status(404).json({ 
          error: 'User document not found' 
        });
      }
      
      const userData = userDoc.data();
      
      if (allowedRoles.includes(userData.role)) {
        req.user.role = userData.role;
        return next();
      }
      
      return res.status(403).json({ 
        error: `Forbidden: Requires one of these roles: ${allowedRoles.join(', ')}`,
        code: 'INSUFFICIENT_ROLE'
      });
      
    } catch (error) {
      logger.error('Error checking role:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        details: error.message 
      });
    }
  };
};

/**
 * Optional: Verify token and attach user (but don't require authentication)
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    
    logger.info(`Optional auth: User identified as ${decodedToken.email}`);
    next();
  } catch (error) {
    logger.warn('Optional auth failed:', error.message);
    next(); // Continue anyway
  }
};

// Default export for backward compatibility
export default { 
  verifyToken, 
  isAdmin, 
  verifyAdmin,
  checkRole,
  optionalAuth
};