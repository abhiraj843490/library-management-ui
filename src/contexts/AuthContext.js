import React, { createContext, useContext, useState } from 'react';
import { loginApi } from '../services/authApi';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('authUser');
      return stored ? JSON.parse(stored) : null;
    } catch (_) {
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem('token');
    const authUser = localStorage.getItem('authUser');
    return Boolean(token && authUser);
  });

  const login = async (email, password) => {
    try {
      const result = await loginApi(email, password);
      const payload = result?.data || result;
      const authUser = payload?.user;
      const token = payload?.token;

      if (!authUser || !token) {
        return { success: false, message: 'Invalid login response from server' };
      }

      setUser(authUser);
      setIsAuthenticated(true);
      localStorage.setItem('authUser', JSON.stringify(authUser));
      localStorage.setItem('token', token);
      return { success: true, message: result?.message || 'Login successful' };
    } catch (error) {
      return { success: false, message: error.message || 'Invalid email or password' };
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('authUser');
    localStorage.removeItem('token');
  };

  const value = {
    user,
    isAuthenticated,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
