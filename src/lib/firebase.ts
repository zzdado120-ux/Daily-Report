import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

// Web app's Firebase configuration
export const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey || "AIzaSyBmWqoibfdUxUZAvVUzXgZt0840Sq1K8eA",
  authDomain: firebaseConfigData.authDomain || "sale-course-495bd.firebaseapp.com",
  projectId: firebaseConfigData.projectId || "sale-course-495bd",
  storageBucket: firebaseConfigData.storageBucket || "sale-course-495bd.firebasestorage.app",
  messagingSenderId: firebaseConfigData.messagingSenderId || "158707548050",
  appId: firebaseConfigData.appId || "1:158707548050:web:a82d73527b72b6846a8b4b",
};

// Initialize Firebase
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = firebaseConfigData.firestoreDatabaseId && firebaseConfigData.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfigData.firestoreDatabaseId)
  : getFirestore(app);

// Auth helpers
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Google login error:', error);
    throw error;
  }
}

export async function logout(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

