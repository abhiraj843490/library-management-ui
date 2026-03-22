import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navigation.css';

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  const isAdmin = user?.role === 'ADMIN';

  return (
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/dashboard" className="nav-brand">
          <span className="nav-icon">📚</span>
          Genius Tech Library System
        </Link>

        <ul className="nav-menu">
          <li>
            <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
              Dashboard
            </Link>
          </li>

          {isAdmin ? (
            <>
              <li>
                <Link to="/students" className={`nav-link ${isActive('/students')}`}>
                  Students
                </Link>
              </li>
              <li>
                <Link to="/study-spaces" className={`nav-link ${isActive('/study-spaces')}`}>
                  Study Spaces
                </Link>
              </li>
              <li>
                <Link to="/study-space-reports" className={`nav-link ${isActive('/study-space-reports')}`}>
                  Reports
                </Link>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/my-bookings" className={`nav-link ${isActive('/my-bookings')}`}>
                  My Bookings
                </Link>
              </li>
              <li>
                <Link to="/study-spaces" className={`nav-link ${isActive('/study-spaces')}`}>
                  Available Spaces
                </Link>
              </li>
              <li>
                <Link to="/study-space-reports" className={`nav-link ${isActive('/study-space-reports')}`}>
                  Analytics
                </Link>
              </li>
            </>
          )}
        </ul>

        <div className="nav-user">
          <div className="user-info">
            <span className="user-role">{isAdmin ? '👨‍💼 Admin' : '👨‍🎓 Student'}</span>
            <span className="user-name">{user?.name}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            🚪 Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
