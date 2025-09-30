// backend/config/firebase.js
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin SDK
let serviceAccount;

try {
  // Try to use environment variable first
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log('Using Firebase service account from environment variable');
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } 
  // Then try to use file
  else {
    console.log('Using Firebase service account from file');
    const serviceAccountPath = join(__dirname, '../serviceAccountKey.json');
    serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  }
  
  // Initialize Firebase with the service account
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${serviceAccount.project_id}.firebaseio.com`
  });
} catch (error) {
  console.error('Firebase initialization error:', error);
  
  // For development purposes, initialize with minimal config
  if (process.env.NODE_ENV === 'development') {
    console.warn('Initializing Firebase with dummy configuration for development');
    admin.initializeApp({
      projectId: 'dummy-project'
    });
  } else {
    // In production, rethrow the error
    throw error;
  }
}

const db = admin.firestore();
const auth = admin.auth();

// Export the Firebase services
const firebase = {
  admin,
  db,
  auth
};

export { admin, db, auth };
export default firebase;
