import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
  updateProfile,
} from 'firebase/auth';

// Mirrors the original onward_com.html Firebase config. Override via .env.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCUQ1OAdePveybB7-iXswneOK2lKGjJ_nA',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'onward-1590a.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'onward-1590a',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'onward-1590a.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '644318276751',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:644318276751:web:2320c84fa7f142f35ed4fa',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-HSK523R0RJ',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  fbSignOut as signOut,
  fbOnAuthStateChanged as onAuthStateChanged,
  updateProfile,
};
