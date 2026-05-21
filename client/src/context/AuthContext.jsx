import axios from 'axios';
import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('kaveriToken'));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('kaveriUser');
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email, password) => {
    try {
      const { data } = await axios.post(`${API_URL}/auth/login`, { email, password });
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('kaveriToken', data.token);
      localStorage.setItem('kaveriUser', JSON.stringify(data.user));
      return { ok: true, user: data.user };
    } catch (error) {
      return { ok: false, message: error.response?.data?.message || 'Login failed' };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('kaveriToken');
    localStorage.removeItem('kaveriUser');
  };

  const value = useMemo(() => ({ token, user, login, logout }), [token, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
