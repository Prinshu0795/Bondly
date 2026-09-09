import { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/endpoints';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, check for existing token
  useEffect(() => {
    const token = localStorage.getItem('bondly_token');
    const savedUser = localStorage.getItem('bondly_user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('bondly_token');
        localStorage.removeItem('bondly_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('bondly_token', token);
    localStorage.setItem('bondly_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const signup = async (username, email, password) => {
    const res = await authService.signup({ username, email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('bondly_token', token);
    localStorage.setItem('bondly_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('bondly_token');
    localStorage.removeItem('bondly_user');
    setUser(null);
  };

  const value = {
    user,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
