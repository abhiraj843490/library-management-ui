import React, { createContext, useContext, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Mock users database
  const mockUsers = [
    {
      id: 'ADM-001',
      name: 'Admin User',
      email: 'admin@studyspace.com',
      password: 'admin123',
      role: 'ADMIN',
      department: 'Management',
    },
    {
      id: 'STU-001',
      name: 'Aarav Kumar',
      email: 'aarav.kumar@email.com',
      password: 'student1',
      role: 'STUDENT',
      enrollment: '2026-01-10',
      side: 'BOYS',
      seatNumber: 'B-15',
    },
    {
      id: 'STU-002',
      name: 'Priya Sharma',
      email: 'priya.sharma@email.com',
      password: 'student1',
      role: 'STUDENT',
      enrollment: '2026-01-20',
      side: 'GIRLS',
      seatNumber: 'G-08',
    },
    {
      id: 'STU-003',
      name: 'Neha Patel',
      email: 'neha.patel@email.com',
      password: 'student1',
      role: 'STUDENT',
      enrollment: '2026-02-05',
      side: 'GIRLS',
      seatNumber: 'G-12',
    },
  ];

  const login = (email, password) => {
    const foundUser = mockUsers.find(u => u.email === email && u.password === password);
    
    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      setIsAuthenticated(true);
      localStorage.setItem('authUser', JSON.stringify(userWithoutPassword));
      return { success: true, message: 'Login successful' };
    }
    
    return { success: false, message: 'Invalid email or password' };
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('authUser');
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
