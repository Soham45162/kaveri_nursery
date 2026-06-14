import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          let userData = { email: firebaseUser.email, role: 'customer', id: firebaseUser.uid, name: firebaseUser.displayName || 'User' };
          
          if (userDoc.exists()) {
            userData = { ...userData, ...userDoc.data(), id: firebaseUser.uid };
          } else {
            await setDoc(doc(db, 'users', firebaseUser.uid), userData);
          }

          if (firebaseUser.email === 'sohamkedar02@gmail.com') {
            userData.role = 'admin';
            userData.name = 'Owner';
            await setDoc(doc(db, 'users', firebaseUser.uid), { role: 'admin', name: 'Owner' }, { merge: true });
          }
          
          setUser(userData);
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser(null);
          setToken(null);
        }
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      let role = 'customer';
      if (email === 'sohamkedar02@gmail.com') {
         role = 'admin';
      } else if (userDoc.exists() && userDoc.data().role) {
         role = userDoc.data().role;
      }
      return { ok: true, user: { role } };
    } catch (error) {
      console.error(error);
      
      // Auto-bootstrap the specific admin account
      if (email === 'sohamkedar02@gmail.com' && password === 'Soham@123') {
        try {
          const newCredential = await createUserWithEmailAndPassword(auth, email, password);
          await setDoc(doc(db, 'users', newCredential.user.uid), { email, role: 'admin', name: 'Soham Admin' });
          return { ok: true, user: { role: 'admin' } };
        } catch (signupError) {
          if (signupError.code !== 'auth/email-already-in-use') {
             return { ok: false, message: signupError.message };
          }
        }
      }

      let message = 'Login failed';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = 'Invalid email or password';
      } else {
        message = error.message;
      }
      return { ok: false, message };
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = useMemo(() => ({ token, user, login, logout }), [token, user]);
  
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-cream dark:bg-[#07130a]"><div className="w-16 h-16 border-4 border-leaf-500 border-t-transparent rounded-full animate-spin"></div></div>;
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
