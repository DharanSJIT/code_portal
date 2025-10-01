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

// Check if Firebase is already initialized
if (admin.apps.length === 0) {
  try {
    let serviceAccount;
    
    // Try to use environment variable first
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.log('Using Firebase service account from environment variable');
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } 
    // Then try to use file
    else {
      console.log('Using Firebase service account from file');
      const serviceAccountPath = join(__dirname, '..', 'serviceAccountKey.json');
      serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    }
    
    // Initialize Firebase with the service account
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${serviceAccount.project_id}.firebaseio.com`
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    console.log('📦 Project ID:', serviceAccount.project_id);
    
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    console.error('❌ Full error:', error);
    
    // Don't use dummy config - throw error instead
    throw new Error('Firebase initialization failed. Please check your serviceAccountKey.json file.');
  }
} else {
  console.log('ℹ️  Firebase already initialized');
}

// Export admin directly (this is the standard pattern)
export default admin;

// Also export db and auth as named exports for convenience
export const db = admin.firestore();
export const auth = admin.auth();