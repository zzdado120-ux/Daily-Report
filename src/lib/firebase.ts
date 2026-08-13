import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: "AIzaSyBsbPev3qqO2HjPOq-4Aus6BOFYodMoYBk",
  authDomain: "course-web-bc7de.firebaseapp.com",
  projectId: "course-web-bc7de",
  storageBucket: "course-web-bc7de.firebasestorage.app",
  messagingSenderId: "94502967366",
  appId: "1:94502967366:web:b5af7ebc76fb23ee67d247"
};

// Initialize Firebase app
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

export const db = getFirestore(app);

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
