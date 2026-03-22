import { createContext, useContext, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import contexts
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Import pages and components
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudySpaces from './pages/StudySpaces';
import MyBookings from './pages/MyBookings';
import StudySpaceReports from './pages/StudySpaceReports';
import Students from './pages/Students';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';

// Create Library Context
const LibraryContext = createContext();

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within LibraryProvider');
  }
  return context;
};

const initialMembers = [
  {
    id: 'MB-201',
    name: 'Ananya Singh',
    email: 'ananya.singh@email.com',
    phone: '9876543210',
    membership: 'Student',
    membershipDate: '2024-01-15',
    borrowedCount: 2,
    status: 'Active',
  },
  {
    id: 'MB-202',
    name: 'Rahul Mehta',
    email: 'rahul.mehta@email.com',
    phone: '9876543211',
    membership: 'Faculty',
    membershipDate: '2023-06-20',
    borrowedCount: 1,
    status: 'Active',
  },
  {
    id: 'MB-203',
    name: 'Priya Sharma',
    email: 'priya.sharma@email.com',
    phone: '9876543212',
    membership: 'Researcher',
    membershipDate: '2024-02-10',
    borrowedCount: 0,
    status: 'Review',
  },
];

const statusTone = {
  Active: 'positive',
  Review: 'warning',
  Issued: 'neutral',
  'Due Soon': 'warning',
  Overdue: 'danger',
  Available: 'positive',
  Low: 'warning',
  Paid: 'positive',
  Unpaid: 'danger',
  Pending: 'warning',
};

export function LibraryProvider({ children }) {
  const [members, setMembers] = useState(initialMembers);

  // Members operations
  const addMember = (memberData) => {
    const newMember = {
      id: `MB-${200 + members.length + 1}`,
      ...memberData,
      borrowedCount: 0,
      status: 'Active',
      membershipDate: new Date().toISOString().slice(0, 10),
    };
    setMembers([...members, newMember]);
    return newMember;
  };

  const updateMember = (memberId, updates) => {
    setMembers(members.map(m => m.id === memberId ? { ...m, ...updates } : m));
  };

  const deleteMember = (memberId) => {
    setMembers(members.filter(m => m.id !== memberId));
  };

  const calculateStats = () => {
    const activeMembers = members.filter(m => m.status === 'Active').length;

    return {
      activeMembers,
      totalMembers: members.length,
      totalEnrolled: members.filter(m => m.status === 'Active' || m.status === 'Review').length,
    };
  };

  const value = {
    members,
    statusTone,
    addMember,
    updateMember,
    deleteMember,
    calculateStats,
  };

  return (
    <LibraryContext.Provider value={value}>
      {children}
    </LibraryContext.Provider>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {isAuthenticated && <Navigation />}
      <main className={isAuthenticated ? 'app-shell' : ''}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/students"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <Students />
              </ProtectedRoute>
            }
          />
          <Route
            path="/study-spaces"
            element={
              <ProtectedRoute>
                <StudySpaces />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute requiredRole="STUDENT">
                <MyBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/study-space-reports"
            element={
              <ProtectedRoute>
                <StudySpaceReports />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <LibraryProvider>
          <AppContent />
        </LibraryProvider>
      </AuthProvider>
    </Router>
  );
}
