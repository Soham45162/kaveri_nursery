import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAQrHGZ7egAguqVDFlvadUy2SXgJ7F72Bo",
  authDomain: "kaveri-nursery.firebaseapp.com",
  projectId: "kaveri-nursery",
  storageBucket: "kaveri-nursery.firebasestorage.app",
  messagingSenderId: "888514098956",
  appId: "1:888514098956:web:b1c252bc570d3711acfb29",
  measurementId: "G-1N8HMBNHPC"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
