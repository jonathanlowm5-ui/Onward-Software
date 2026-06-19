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
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyD0kom66wnprVZwcIoNYTHoSYe7cHFVgCA',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'onwards-61e6c.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'onwards-61e6c',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'onwards-61e6c.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '807263852085',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:807263852085:web:38d665c8f257061326837c',
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
