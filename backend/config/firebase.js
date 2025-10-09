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
    
    // Try environment variables first (for production)
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      console.log('Using Firebase service account from environment variables');
      serviceAccount = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
      };
    }
    // Try JSON string environment variable
    else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.log('Using Firebase service account from JSON environment variable');
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } 
    // Fallback to file (for local development)
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