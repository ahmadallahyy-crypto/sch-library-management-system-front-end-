import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { authAPI } from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [attendant, setAttendant] = useState(null);
  const [loading, setLoading]     = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const stored      = localStorage.getItem('attendant');
    const accessToken = localStorage.getItem('accessToken');
    if (stored && accessToken) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAttendant(JSON.parse(stored));
      } catch {
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data: res } = await authAPI.login(email, password);
    // Backend envelope: { success, data: { attendant, accessToken, refreshToken }, message }
    const { attendant: user, accessToken, refreshToken } = res.data;
    localStorage.setItem('accessToken',  accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('attendant',    JSON.stringify(user));
    setAttendant(user);
    return user;
  }, []);

  const logout = useCallback(async () => {
    try { await authAPI.logout(); } catch { /* ignore */ }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('attendant');
    setAttendant(null);
  }, []);

  const isAdmin = attendant?.role === 'admin';

  const value = useMemo(() => ({
    attendant,
    login,
    logout,
    isAdmin,
    loading
  }), [attendant, login, logout, isAdmin, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};